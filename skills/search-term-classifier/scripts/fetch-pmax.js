#!/usr/bin/env node

/**
 * PMax Search Categories Fetcher
 *
 * Fetches search category insights from Performance Max campaigns.
 * Uses campaign_search_term_insight resource from Google Ads API.
 *
 * Note: Some categories will be "Uncategorized" - this is data Google
 * has chosen not to share. There is no way to see what search terms
 * are in the Uncategorized bucket.
 *
 * Usage:
 *   node fetch-pmax.js \
 *     --customer-id=1234567890 \
 *     --login-customer-id=9876543210 \
 *     --days=90 \
 *     --output=data/google-ads/pmax-categories.csv
 */

import { GoogleAdsApi } from 'google-ads-api';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
function parseArgs() {
    return process.argv.slice(2).reduce((acc, arg) => {
        if (arg.includes('=')) {
            const [key, value] = arg.split('=');
            if (key && value) {
                acc[key.replace('--', '')] = value;
            }
        } else if (arg.startsWith('--')) {
            acc[arg.replace('--', '')] = true;
        }
        return acc;
    }, {});
}

// Load account info from accounts.json
function loadAccountInfo(accountId) {
    const possiblePaths = [
        resolve(process.cwd(), '.claude/accounts.json'),
        resolve(__dirname, '../../../../.claude/accounts.json'),
    ];

    for (const accountsPath of possiblePaths) {
        if (existsSync(accountsPath)) {
            try {
                const accounts = JSON.parse(readFileSync(accountsPath, 'utf8'));
                for (const [key, account] of Object.entries(accounts)) {
                    if (account.id === accountId) {
                        return { key, ...account };
                    }
                }
            } catch (err) {
                // Continue to next path
            }
        }
    }
    return null;
}

// Calculate date range
function getDateRange(days, timezone = 'Australia/Sydney') {
    const now = new Date();

    // Get yesterday in account timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const endDate = formatter.format(yesterday);

    const startDate = new Date(yesterday);
    startDate.setDate(startDate.getDate() - days + 1);
    const startDateStr = formatter.format(startDate);

    return { startDate: startDateStr, endDate };
}

async function fetchPMaxCategories(customerId, loginCustomerId, days, outputPath, options = {}) {
    const { verbose = false } = options;
    const log = (msg) => verbose && console.log(msg);

    console.log('='.repeat(60));
    console.log('PMAX SEARCH CATEGORIES FETCHER');
    console.log('='.repeat(60));
    console.log('');

    // Load credentials
    const credentialsPath = resolve(process.env.HOME, 'google-ads.yaml');
    if (!existsSync(credentialsPath)) {
        throw new Error(`Credentials not found: ${credentialsPath}`);
    }
    const credentials = parseYaml(readFileSync(credentialsPath, 'utf8'));

    // Load account info for timezone
    const accountInfo = loadAccountInfo(customerId);
    const timezone = accountInfo?.timezone || 'Australia/Sydney';

    console.log(`Account: ${accountInfo?.name || customerId}`);
    console.log(`Customer ID: ${customerId}`);
    console.log(`Login Customer ID: ${loginCustomerId || customerId}`);
    console.log(`Timezone: ${timezone}`);
    console.log('');

    // Calculate date range
    const { startDate, endDate } = getDateRange(days, timezone);
    console.log(`Date range: ${startDate} to ${endDate} (${days} days)`);
    console.log('');

    // Initialize API
    const client = new GoogleAdsApi({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        developer_token: credentials.developer_token
    });

    const customer = client.Customer({
        customer_id: customerId,
        login_customer_id: loginCustomerId || customerId,
        refresh_token: credentials.refresh_token
    });

    // First, get all PMax campaigns
    console.log('Fetching PMax campaigns...');
    const campaignQuery = `
        SELECT
            campaign.id,
            campaign.name
        FROM campaign
        WHERE campaign.advertising_channel_type = 'PERFORMANCE_MAX'
            AND campaign.status != 'REMOVED'
    `;

    const campaigns = [];
    try {
        const campaignResults = await customer.query(campaignQuery);
        for (const row of campaignResults) {
            campaigns.push({
                id: row.campaign.id,
                name: row.campaign.name
            });
        }
    } catch (err) {
        console.error('Error fetching campaigns:', err.message);
        throw err;
    }

    console.log(`Found ${campaigns.length} PMax campaigns`);
    if (campaigns.length === 0) {
        console.log('No PMax campaigns found. Creating empty output file.');
        writeFileSync(outputPath, 'search_category,campaign_name,metrics.impressions,metrics.clicks,metrics.cost_micros,metrics.conversions,metrics.conversions_value,source\n');
        return { categories: 0, campaigns: 0 };
    }
    console.log('');

    // Fetch categories for each campaign
    console.log('Fetching search categories...');
    const allCategories = [];

    for (const campaign of campaigns) {
        log(`  Processing: ${campaign.name}`);

        // Note: campaign_search_term_insight supports impressions, clicks, conversions, conversions_value
        // cost_micros is NOT available for this resource
        const categoryQuery = `
            SELECT
                campaign_search_term_insight.category_label,
                metrics.impressions,
                metrics.clicks,
                metrics.conversions,
                metrics.conversions_value
            FROM campaign_search_term_insight
            WHERE campaign.id = ${campaign.id}
                AND segments.date BETWEEN '${startDate}' AND '${endDate}'
            ORDER BY metrics.impressions DESC
        `;

        try {
            const results = await customer.query(categoryQuery);
            for (const row of results) {
                // API returns snake_case properties
                const categoryLabel = row.campaign_search_term_insight?.category_label || 'Uncategorized';
                // Empty string also means uncategorized
                const finalCategory = categoryLabel === '' ? 'Uncategorized' : categoryLabel;

                allCategories.push({
                    category: finalCategory,
                    campaign: campaign.name,
                    impressions: parseInt(row.metrics?.impressions) || 0,
                    clicks: parseInt(row.metrics?.clicks) || 0,
                    // cost_micros NOT available for this resource
                    cost_micros: 0,
                    conversions: parseFloat(row.metrics?.conversions) || 0,
                    conversions_value: parseFloat(row.metrics?.conversions_value) || 0
                });
            }
        } catch (err) {
            const errMsg = err?.message || JSON.stringify(err) || String(err);
            log(`    Warning: Could not fetch categories for ${campaign.name}: ${errMsg}`);
            if (verbose) console.log('    Full error:', err);
        }
    }

    console.log(`Fetched ${allCategories.length} category rows`);
    console.log('');

    // Write to CSV
    const headers = [
        'search_category',
        'campaign_name',
        'metrics.impressions',
        'metrics.clicks',
        'metrics.cost_micros',
        'metrics.conversions',
        'metrics.conversions_value',
        'source'
    ];

    const csvLines = [headers.join(',')];

    for (const cat of allCategories) {
        const values = [
            `"${cat.category.replace(/"/g, '""')}"`,
            `"${cat.campaign.replace(/"/g, '""')}"`,
            cat.impressions,
            cat.clicks,
            cat.cost_micros,
            cat.conversions.toFixed(6),
            cat.conversions_value.toFixed(6),
            'P'  // PMax source indicator
        ];
        csvLines.push(values.join(','));
    }

    writeFileSync(outputPath, csvLines.join('\n'));

    console.log(`Output: ${outputPath}`);
    console.log(`Rows: ${allCategories.length}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('FETCH COMPLETE');
    console.log('='.repeat(60));

    return { categories: allCategories.length, campaigns: campaigns.length };
}

// CLI
const args = parseArgs();

if (args.help || !args['customer-id']) {
    console.log(`
PMax Search Categories Fetcher

Fetches search category insights from Performance Max campaigns.

Usage:
  node fetch-pmax.js --customer-id=<id> [options]

Required:
  --customer-id       Google Ads customer ID

Output (one of):
  --account-name      Account name for auto-folder (saves to data/google-ads/{name}/)
  --output            Explicit output CSV file path

Options:
  --login-customer-id MCC login customer ID (if accessing via MCC)
  --days              Number of days (default: 30)
  --verbose           Show detailed progress
  --help              Show this help

Note: Some categories will be "Uncategorized" - this is data Google
has chosen not to share.
`);
    process.exit(0);
}

const customerId = args['customer-id'];
const loginCustomerId = args['login-customer-id'];
const days = parseInt(args.days) || 30;
const accountName = args['account-name'];

// Determine output path
let outputPath;
if (args.output) {
    outputPath = resolve(args.output);
} else if (accountName) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const accountDir = resolve(process.cwd(), 'data/google-ads', accountName);
    if (!existsSync(accountDir)) {
        mkdirSync(accountDir, { recursive: true });
        console.log(`Created folder: ${accountDir}`);
    }
    outputPath = resolve(accountDir, `${today}-${accountName}-pmax.csv`);
} else {
    outputPath = resolve(`data/google-ads/pmax-categories-${customerId}.csv`);
}

fetchPMaxCategories(customerId, loginCustomerId, days, outputPath, { verbose: args.verbose })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
