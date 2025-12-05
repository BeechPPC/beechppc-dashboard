#!/usr/bin/env node

/**
 * Search Term Classification Pipeline
 *
 * Single entry point for the entire classification workflow.
 * This is the ONLY way to run search term classification.
 *
 * Flow:
 * 1. Fetch search terms (Search + Shopping campaigns) with channel type
 * 2. Aggregate by term + channel type
 * 3. Fetch PMax categories (gracefully skips if no PMax campaigns)
 * 4. Combine all sources (S=Search, Sh=Shopping, P=PMax)
 * 5. Classify the combined data
 * 6. Generate HTML report
 * 7. Open report in browser
 *
 * Usage:
 *   node pipeline.js --account=swg --days=90
 *   node pipeline.js --account=mpm --days=180 --run-llm
 */

import { GoogleAdsApi } from 'google-ads-api';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse CLI arguments
function parseArgs() {
    return process.argv.slice(2).reduce((acc, arg) => {
        if (arg.includes('=')) {
            const [key, value] = arg.split('=');
            acc[key.replace('--', '')] = value;
        } else if (arg.startsWith('--')) {
            acc[arg.replace('--', '')] = true;
        }
        return acc;
    }, {});
}

// Load account info from accounts.json
function loadAccountInfo(accountAlias) {
    const accountsPath = resolve(process.cwd(), '.claude/accounts.json');
    if (!existsSync(accountsPath)) {
        throw new Error('accounts.json not found');
    }

    const accounts = JSON.parse(readFileSync(accountsPath, 'utf8'));

    // Find by alias or key
    for (const [key, account] of Object.entries(accounts)) {
        const aliases = account.aliases || [];
        if (key === accountAlias ||
            aliases.some(a => a.toLowerCase() === accountAlias.toLowerCase())) {
            return { key, ...account };
        }
    }

    throw new Error(`Account not found: ${accountAlias}`);
}

// Calculate date range
function getDateRange(days, timezone = 'Australia/Sydney') {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const endDate = formatter.format(yesterday);

    const startDate = new Date(yesterday);
    startDate.setDate(startDate.getDate() - days + 1);
    const startDateStr = formatter.format(startDate);

    return { startDate: startDateStr, endDate };
}

// Run a script and wait for completion
function runScript(scriptPath, args) {
    const fullPath = resolve(__dirname, scriptPath);
    const cmd = `node "${fullPath}" ${args}`;
    try {
        execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
        return true;
    } catch (err) {
        console.error(`Script failed: ${scriptPath}`);
        return false;
    }
}

async function pipeline(accountAlias, days, options = {}) {
    const { runLlm = false, llmLimit = 1000, verbose = false, skipOpen = false } = options;

    console.log('');
    console.log('='.repeat(70));
    console.log('  SEARCH TERM CLASSIFICATION PIPELINE');
    console.log('='.repeat(70));
    console.log('');

    // Step 0: Load account info
    const account = loadAccountInfo(accountAlias);
    const customerId = account.id;
    const loginCustomerId = account.login_customer_id || customerId;
    const timezone = account.timezone || 'Australia/Sydney';
    const accountName = account.key;

    console.log(`Account: ${account.name}`);
    console.log(`Customer ID: ${customerId}`);
    console.log(`Days: ${days}`);
    console.log('');

    // Calculate dates
    const { startDate, endDate } = getDateRange(days, timezone);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Ensure output directory exists
    const accountDir = resolve(process.cwd(), 'data/google-ads', accountName);
    if (!existsSync(accountDir)) {
        mkdirSync(accountDir, { recursive: true });
    }

    // File paths
    const rawPath = resolve(accountDir, `${today}-${accountName}-raw.csv`);
    const aggregatedPath = resolve(accountDir, `${today}-${accountName}-aggregated.csv`);
    const pmaxPath = resolve(accountDir, `${today}-${accountName}-pmax.csv`);
    const combinedPath = resolve(accountDir, `${today}-${accountName}-combined.csv`);
    const classifiedPath = resolve(accountDir, `${today}-${accountName}-classified.csv`);
    const reportPath = resolve(accountDir, `${today}-${accountName}-report.html`);

    // =========================================================================
    // STEP 1: Fetch Search Terms (with channel type for Search vs Shopping)
    // =========================================================================
    console.log('─'.repeat(70));
    console.log('STEP 1: Fetching search terms (Search + Shopping campaigns)');
    console.log('─'.repeat(70));
    console.log('');

    // Query includes campaign.advertising_channel_type to distinguish Search (2) vs Shopping (4)
    const searchQuery = `
        SELECT
            search_term_view.search_term,
            campaign.advertising_channel_type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value
        FROM search_term_view
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
            AND campaign.advertising_channel_type IN ('SEARCH', 'SHOPPING')
            AND metrics.impressions > 0
        ORDER BY metrics.impressions DESC
    `.replace(/\s+/g, ' ').trim();

    const queryArgs = `--customer-id=${customerId} --login-customer-id=${loginCustomerId} --query="${searchQuery}" --output="${rawPath}"`;
    const queryScript = resolve(__dirname, '../../google-ads/scripts/query.js');

    if (!runScript(queryScript, queryArgs)) {
        throw new Error('Failed to fetch search terms');
    }
    console.log('');

    // =========================================================================
    // STEP 2: Aggregate by term + channel type
    // =========================================================================
    console.log('─'.repeat(70));
    console.log('STEP 2: Aggregating search terms');
    console.log('─'.repeat(70));
    console.log('');

    const aggregateArgs = `--input="${rawPath}" --output="${aggregatedPath}"`;
    if (!runScript('aggregate.js', aggregateArgs)) {
        throw new Error('Failed to aggregate search terms');
    }
    console.log('');

    // =========================================================================
    // STEP 3: Fetch PMax Categories (gracefully handles no PMax campaigns)
    // =========================================================================
    console.log('─'.repeat(70));
    console.log('STEP 3: Fetching PMax categories');
    console.log('─'.repeat(70));
    console.log('');

    const pmaxArgs = `--customer-id=${customerId} --login-customer-id=${loginCustomerId} --days=${days} --output="${pmaxPath}"`;
    runScript('fetch-pmax.js', pmaxArgs);  // Don't fail if no PMax campaigns
    console.log('');

    // =========================================================================
    // STEP 4: Combine all sources
    // =========================================================================
    console.log('─'.repeat(70));
    console.log('STEP 4: Combining Search + Shopping + PMax');
    console.log('─'.repeat(70));
    console.log('');

    const combineArgs = `--search="${aggregatedPath}" --pmax="${pmaxPath}" --output="${combinedPath}"`;
    if (!runScript('combine.js', combineArgs)) {
        throw new Error('Failed to combine data');
    }
    console.log('');

    // =========================================================================
    // STEP 5: Classify
    // =========================================================================
    console.log('─'.repeat(70));
    console.log('STEP 5: Classifying search terms');
    console.log('─'.repeat(70));
    console.log('');

    let classifyArgs = `--input="${combinedPath}" --account-id=${customerId} --output="${classifiedPath}"`;
    if (runLlm) {
        classifyArgs += ` --run-llm --llm-limit=${llmLimit}`;
    }
    if (!runScript('classify.js', classifyArgs)) {
        throw new Error('Failed to classify');
    }
    console.log('');

    // =========================================================================
    // STEP 6: Generate Report
    // =========================================================================
    console.log('─'.repeat(70));
    console.log('STEP 6: Generating report');
    console.log('─'.repeat(70));
    console.log('');

    const reportArgs = `--input="${classifiedPath}" --account-id=${customerId} --output="${reportPath}" --start-date=${startDate} --end-date=${endDate} --days=${days}`;
    if (!runScript('report.js', reportArgs)) {
        throw new Error('Failed to generate report');
    }
    console.log('');

    // =========================================================================
    // STEP 7: Open Report
    // =========================================================================
    if (!skipOpen) {
        console.log('─'.repeat(70));
        console.log('STEP 7: Opening report');
        console.log('─'.repeat(70));
        console.log('');

        try {
            execSync(`open -a "Brave Browser" "${reportPath}"`, { stdio: 'inherit' });
        } catch {
            try {
                execSync(`open "${reportPath}"`, { stdio: 'inherit' });
            } catch {
                console.log(`Report saved to: ${reportPath}`);
            }
        }
    }

    // =========================================================================
    // Cleanup intermediate files (optional - keep for debugging)
    // =========================================================================
    // Keeping intermediate files for now for debugging purposes

    console.log('');
    console.log('='.repeat(70));
    console.log('  PIPELINE COMPLETE');
    console.log('='.repeat(70));
    console.log('');
    console.log(`Report: ${reportPath}`);
    console.log('');

    return { reportPath, classifiedPath };
}

// CLI
const args = parseArgs();

if (args.help || !args.account) {
    console.log(`
Search Term Classification Pipeline

Single entry point for the complete classification workflow.
Fetches, aggregates, combines, classifies, and reports.

Usage:
  node pipeline.js --account=<alias> [options]

Required:
  --account         Account alias (e.g., swg, mpm, ssc)

Options:
  --days=N          Date range in days (default: 30)
  --run-llm         Run LLM classification on unclassified terms
  --llm-limit=N     Max terms for LLM (default: 1000)
  --skip-open       Don't open report in browser
  --verbose         Show detailed progress
  --help            Show this help

Examples:
  node pipeline.js --account=swg --days=90
  node pipeline.js --account=mpm --days=180 --run-llm --llm-limit=500

The pipeline will:
  1. Fetch search terms (Search + Shopping campaigns)
  2. Aggregate by term + channel type
  3. Fetch PMax categories (skips gracefully if none)
  4. Combine all sources (S=Search, Sh=Shopping, P=PMax)
  5. Classify with rules + cache + optional LLM
  6. Generate HTML report with source toggles
  7. Open report in browser
`);
    process.exit(0);
}

const accountAlias = args.account;
const days = parseInt(args.days) || 30;

pipeline(accountAlias, days, {
    runLlm: args['run-llm'],
    llmLimit: parseInt(args['llm-limit']) || 1000,
    verbose: args.verbose,
    skipOpen: args['skip-open']
}).catch(err => {
    console.error('');
    console.error('Pipeline failed:', err.message);
    process.exit(1);
});
