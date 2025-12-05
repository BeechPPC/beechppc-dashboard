#!/usr/bin/env node

/**
 * Search Term + PMax Category Combiner
 *
 * Combines search term data (from Search and Shopping campaigns) with search category
 * data (from PMax campaigns) into a single file for unified reporting.
 *
 * - Search campaign terms get 'S' source indicator
 * - Shopping campaign terms get 'Sh' source indicator
 * - PMax categories get 'P' source indicator
 * - Data is aggregated at campaign type level (not account level)
 *
 * Usage:
 *   node combine.js \
 *     --search=search-terms-aggregated.csv \
 *     --pmax=pmax-categories.csv \
 *     --output=combined.csv
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

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

// Parse CSV
function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (const char of lines[i]) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const row = {};
        headers.forEach((h, idx) => row[h] = values[idx] || '');
        rows.push(row);
    }

    return { headers, rows };
}

// Find column
function findColumn(headers, candidates) {
    for (const candidate of candidates) {
        if (headers.includes(candidate)) return candidate;
        const match = headers.find(h => h.toLowerCase() === candidate.toLowerCase());
        if (match) return match;
    }
    return null;
}

function combine(searchPath, pmaxPath, outputPath, options = {}) {
    const { verbose = false } = options;
    const log = (msg) => verbose && console.log(msg);

    console.log('='.repeat(60));
    console.log('SEARCH TERM + PMAX COMBINER');
    console.log('='.repeat(60));
    console.log('');

    const combined = [];
    let searchCount = 0;
    let pmaxCount = 0;

    // Process search terms (from Search and Shopping campaigns)
    let shoppingCount = 0;
    if (searchPath && existsSync(searchPath)) {
        console.log(`Reading search terms: ${searchPath}`);
        const content = readFileSync(searchPath, 'utf8');
        const { headers, rows } = parseCSV(content);

        const termCol = findColumn(headers, ['search_term_view.search_term', 'search_term']);
        const impCol = findColumn(headers, ['metrics.impressions', 'impressions']);
        const clickCol = findColumn(headers, ['metrics.clicks', 'clicks']);
        const costCol = findColumn(headers, ['metrics.cost_micros', 'cost_micros']);
        const convCol = findColumn(headers, ['metrics.conversions', 'conversions']);
        const convValueCol = findColumn(headers, ['metrics.conversions_value', 'conversions_value']);
        const channelCol = findColumn(headers, ['channel_type', 'campaign.advertising_channel_type']);

        for (const row of rows) {
            const term = row[termCol]?.trim();
            if (!term) continue;

            // Determine source based on channel type: SEARCH → S, SHOPPING → Sh
            const channelType = channelCol ? (row[channelCol] || 'SEARCH') : 'SEARCH';
            const source = channelType === 'SHOPPING' ? 'Sh' : 'S';

            combined.push({
                term,
                impressions: parseInt(row[impCol]) || 0,
                clicks: parseInt(row[clickCol]) || 0,
                cost_micros: parseFloat(row[costCol]) || 0,
                conversions: parseFloat(row[convCol]) || 0,
                conversions_value: parseFloat(row[convValueCol]) || 0,
                source
            });

            if (source === 'Sh') {
                shoppingCount++;
            } else {
                searchCount++;
            }
        }

        const totalLoaded = searchCount + shoppingCount;
        console.log(`  Loaded ${totalLoaded.toLocaleString()} terms`);
        if (shoppingCount > 0) {
            console.log(`    Search: ${searchCount.toLocaleString()}`);
            console.log(`    Shopping: ${shoppingCount.toLocaleString()}`);
        }
    } else if (searchPath) {
        console.log(`Warning: Search file not found: ${searchPath}`);
    }

    // Process PMax categories
    if (pmaxPath && existsSync(pmaxPath)) {
        console.log(`Reading PMax categories: ${pmaxPath}`);
        const content = readFileSync(pmaxPath, 'utf8');
        const { headers, rows } = parseCSV(content);

        const catCol = findColumn(headers, ['search_category', 'category_label']);
        const impCol = findColumn(headers, ['metrics.impressions', 'impressions']);
        const clickCol = findColumn(headers, ['metrics.clicks', 'clicks']);
        const costCol = findColumn(headers, ['metrics.cost_micros', 'cost_micros']);
        const convCol = findColumn(headers, ['metrics.conversions', 'conversions']);
        const convValueCol = findColumn(headers, ['metrics.conversions_value', 'conversions_value']);

        // Aggregate PMax by category (may have multiple campaigns)
        const pmaxAgg = new Map();

        for (const row of rows) {
            const category = row[catCol]?.trim() || 'Uncategorized';

            if (!pmaxAgg.has(category)) {
                pmaxAgg.set(category, {
                    term: category,
                    impressions: 0,
                    clicks: 0,
                    cost_micros: 0,
                    conversions: 0,
                    conversions_value: 0,
                    source: 'P'
                });
            }

            const agg = pmaxAgg.get(category);
            agg.impressions += parseInt(row[impCol]) || 0;
            agg.clicks += parseInt(row[clickCol]) || 0;
            agg.cost_micros += parseFloat(row[costCol]) || 0;
            agg.conversions += parseFloat(row[convCol]) || 0;
            agg.conversions_value += parseFloat(row[convValueCol]) || 0;
        }

        for (const [, data] of pmaxAgg) {
            combined.push(data);
            pmaxCount++;
        }

        console.log(`  Loaded ${pmaxCount.toLocaleString()} PMax categories`);
    } else if (pmaxPath) {
        console.log(`Warning: PMax file not found: ${pmaxPath}`);
    }

    console.log('');
    console.log(`Total combined: ${combined.length.toLocaleString()}`);

    // Sort by impressions descending
    combined.sort((a, b) => b.impressions - a.impressions);

    // Write output
    const outputHeaders = [
        'search_term_view.search_term',
        'metrics.impressions',
        'metrics.clicks',
        'metrics.cost_micros',
        'metrics.conversions',
        'metrics.conversions_value',
        'source'
    ];

    const csvLines = [outputHeaders.join(',')];

    for (const item of combined) {
        const values = [
            `"${item.term.replace(/"/g, '""')}"`,
            item.impressions,
            item.clicks,
            item.cost_micros,
            item.conversions.toFixed(6),
            item.conversions_value.toFixed(6),
            item.source
        ];
        csvLines.push(values.join(','));
    }

    writeFileSync(outputPath, csvLines.join('\n'));

    console.log(`Output: ${outputPath}`);
    console.log('');

    // Summary stats
    const searchItems = combined.filter(c => c.source === 'S');
    const shoppingItems = combined.filter(c => c.source === 'Sh');
    const pmaxItems = combined.filter(c => c.source === 'P');

    const searchImp = searchItems.reduce((sum, c) => sum + c.impressions, 0);
    const shoppingImp = shoppingItems.reduce((sum, c) => sum + c.impressions, 0);
    const pmaxImp = pmaxItems.reduce((sum, c) => sum + c.impressions, 0);

    const searchCost = searchItems.reduce((sum, c) => sum + c.cost_micros, 0) / 1_000_000;
    const shoppingCost = shoppingItems.reduce((sum, c) => sum + c.cost_micros, 0) / 1_000_000;
    const pmaxCost = pmaxItems.reduce((sum, c) => sum + c.cost_micros, 0) / 1_000_000;

    console.log('Summary:');
    console.log(`  Search:   ${searchCount.toLocaleString()} terms, ${searchImp.toLocaleString()} imp, $${searchCost.toFixed(2)}`);
    if (shoppingCount > 0) {
        console.log(`  Shopping: ${shoppingCount.toLocaleString()} terms, ${shoppingImp.toLocaleString()} imp, $${shoppingCost.toFixed(2)}`);
    }
    console.log(`  PMax:     ${pmaxCount.toLocaleString()} categories, ${pmaxImp.toLocaleString()} imp, $${pmaxCost.toFixed(2)}`);
    console.log('');
    console.log('='.repeat(60));
    console.log('COMBINE COMPLETE');
    console.log('='.repeat(60));

    return { searchCount, pmaxCount, total: combined.length };
}

// CLI
const args = parseArgs();

if (args.help) {
    console.log(`
Search Term + PMax Category Combiner

Combines search terms from Search campaigns with search categories
from PMax campaigns into a unified dataset for reporting.

Usage:
  node combine.js --search=<file> --pmax=<file> [options]

Required (at least one):
  --search        Path to aggregated search terms CSV (source: S/Sh)
  --pmax          Path to PMax categories CSV (source: P)

Output (one of):
  --account-name  Account name for auto-folder (saves to data/google-ads/{name}/)
  --output        Explicit output CSV file path

Options:
  --verbose       Show detailed progress
  --help          Show this help

Notes:
- Search campaign terms are labeled with source 'S'
- Shopping campaign terms are labeled with source 'Sh'
- PMax categories are labeled with source 'P'
`);
    process.exit(0);
}

const searchPath = args.search ? resolve(args.search) : null;
const pmaxPath = args.pmax ? resolve(args.pmax) : null;
const accountName = args['account-name'];

if (!searchPath && !pmaxPath) {
    console.error('Error: At least one of --search or --pmax is required');
    process.exit(1);
}

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
    outputPath = resolve(accountDir, `${today}-${accountName}-combined.csv`);
} else {
    outputPath = resolve('combined.csv');
}

combine(searchPath, pmaxPath, outputPath, { verbose: args.verbose });
