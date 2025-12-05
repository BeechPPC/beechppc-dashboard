#!/usr/bin/env node

/**
 * Search Term Aggregator
 *
 * Aggregates search term data from ad group level to account level.
 * Google Ads API returns search terms per ad group, causing duplicates.
 * This script deduplicates and sums metrics for unique search terms.
 *
 * Usage:
 *   node aggregate.js --input=raw.csv --output=aggregated.csv
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

// Parse CSV with flexible column detection
function parseCSV(content) {
    const lines = content.trim().split('\n');
    let startLine = 0;

    // Skip metadata lines (report name, date range) if present
    if (lines[0] && (lines[0].match(/,/g) || []).length < 3) {
        startLine = 1;
        if (lines[1] && (lines[1].match(/,/g) || []).length < 3) {
            startLine = 2;
        }
    }

    const headers = lines[startLine].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = [];

    for (let i = startLine + 1; i < lines.length; i++) {
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

// Find column by various naming conventions
function findColumn(headers, candidates) {
    for (const candidate of candidates) {
        if (headers.includes(candidate)) return candidate;
        const lower = candidate.toLowerCase();
        const match = headers.find(h => h.toLowerCase() === lower);
        if (match) return match;
    }
    return null;
}

function aggregate(inputPath, outputPath, options = {}) {
    const { verbose = false } = options;
    const log = (msg) => verbose && console.log(msg);

    console.log('='.repeat(60));
    console.log('SEARCH TERM AGGREGATOR');
    console.log('='.repeat(60));
    console.log('');

    // Read input
    const content = readFileSync(inputPath, 'utf8');
    const { headers, rows } = parseCSV(content);

    console.log(`Input: ${inputPath}`);
    console.log(`Raw rows: ${rows.length.toLocaleString()}`);
    console.log('');

    // Find columns
    const termCol = findColumn(headers, ['search_term_view.search_term', 'search_term', 'Search term', 'query']);
    const impCol = findColumn(headers, ['metrics.impressions', 'impressions', 'Impressions', 'Impr']);
    const clickCol = findColumn(headers, ['metrics.clicks', 'clicks', 'Clicks']);
    const costCol = findColumn(headers, ['metrics.cost_micros', 'cost_micros', 'Cost', 'cost']);
    const convCol = findColumn(headers, ['metrics.conversions', 'conversions', 'Conversions', 'Conv']);
    const convValueCol = findColumn(headers, ['metrics.conversions_value', 'conversions_value', 'Conv. value', 'Value']);
    const channelCol = findColumn(headers, ['campaign.advertising_channel_type', 'advertising_channel_type', 'channel_type']);

    if (!termCol) {
        throw new Error(`Search term column not found. Available: ${headers.join(', ')}`);
    }

    console.log('Detected columns:');
    console.log(`  Term: ${termCol}`);
    console.log(`  Impressions: ${impCol || '(not found)'}`);
    console.log(`  Clicks: ${clickCol || '(not found)'}`);
    console.log(`  Cost: ${costCol || '(not found)'}`);
    console.log(`  Conversions: ${convCol || '(not found)'}`);
    console.log(`  Conv. Value: ${convValueCol || '(not found)'}`);
    console.log(`  Channel Type: ${channelCol || '(not found - will default to SEARCH)'}`);
    console.log('');

    // Aggregate by search term + channel type
    // This keeps Search and Shopping terms separate even if they're the same query
    const aggregated = new Map();

    for (const row of rows) {
        const term = row[termCol]?.toLowerCase().trim();
        if (!term) continue;

        // Get channel type - API returns numeric enum: 2=SEARCH, 4=SHOPPING
        // Normalize to string names for consistency
        let rawChannelType = channelCol ? row[channelCol] : null;
        let channelType = 'SEARCH'; // default
        if (rawChannelType === '2' || rawChannelType === 2 || rawChannelType === 'SEARCH') {
            channelType = 'SEARCH';
        } else if (rawChannelType === '4' || rawChannelType === 4 || rawChannelType === 'SHOPPING') {
            channelType = 'SHOPPING';
        }

        // Create composite key: term + channel type
        const key = `${term}|||${channelType}`;

        if (!aggregated.has(key)) {
            aggregated.set(key, {
                term,
                channel_type: channelType,
                impressions: 0,
                clicks: 0,
                cost_micros: 0,
                conversions: 0,
                conversions_value: 0,
                ad_group_count: 0
            });
        }

        const agg = aggregated.get(key);
        agg.impressions += parseInt(row[impCol]) || 0;
        agg.clicks += parseInt(row[clickCol]) || 0;
        agg.cost_micros += parseFloat(row[costCol]) || 0;
        agg.conversions += parseFloat(row[convCol]) || 0;
        agg.conversions_value += parseFloat(row[convValueCol]) || 0;
        agg.ad_group_count += 1;
    }

    // Calculate stats
    const uniqueTerms = aggregated.size;
    const duplicateRows = rows.length - uniqueTerms;
    const duplicatePct = ((duplicateRows / rows.length) * 100).toFixed(1);

    // Find terms with most duplicates
    const sortedByDupes = [...aggregated.values()]
        .filter(a => a.ad_group_count > 1)
        .sort((a, b) => b.ad_group_count - a.ad_group_count)
        .slice(0, 10);

    console.log('Aggregation Results:');
    console.log(`  Unique terms: ${uniqueTerms.toLocaleString()}`);
    console.log(`  Duplicate rows removed: ${duplicateRows.toLocaleString()} (${duplicatePct}%)`);
    console.log('');

    if (sortedByDupes.length > 0) {
        console.log('Top terms by ad group count:');
        for (const t of sortedByDupes.slice(0, 5)) {
            console.log(`  "${t.term.slice(0, 40)}${t.term.length > 40 ? '...' : ''}" - ${t.ad_group_count} ad groups`);
        }
        console.log('');
    }

    // Write output CSV
    const outputHeaders = [
        'search_term_view.search_term',
        'metrics.impressions',
        'metrics.clicks',
        'metrics.cost_micros',
        'metrics.conversions',
        'metrics.conversions_value',
        'channel_type',
        'ad_group_count'
    ];

    const csvLines = [outputHeaders.join(',')];

    // Sort by impressions descending
    const sortedTerms = [...aggregated.values()].sort((a, b) => b.impressions - a.impressions);

    for (const agg of sortedTerms) {
        const values = [
            `"${agg.term.replace(/"/g, '""')}"`,
            agg.impressions,
            agg.clicks,
            agg.cost_micros,
            agg.conversions.toFixed(6),
            agg.conversions_value.toFixed(6),
            agg.channel_type,
            agg.ad_group_count
        ];
        csvLines.push(values.join(','));
    }

    writeFileSync(outputPath, csvLines.join('\n'));

    // Calculate channel type breakdown
    const searchTerms = sortedTerms.filter(t => t.channel_type === 'SEARCH');
    const shoppingTerms = sortedTerms.filter(t => t.channel_type === 'SHOPPING');

    console.log(`Output: ${outputPath}`);
    console.log(`Output rows: ${uniqueTerms.toLocaleString()}`);
    if (shoppingTerms.length > 0) {
        console.log(`  Search: ${searchTerms.length.toLocaleString()} terms`);
        console.log(`  Shopping: ${shoppingTerms.length.toLocaleString()} terms`);
    }
    console.log('');
    console.log('='.repeat(60));
    console.log('AGGREGATION COMPLETE');
    console.log('='.repeat(60));

    return { uniqueTerms, duplicateRows, duplicatePct, searchTerms: searchTerms.length, shoppingTerms: shoppingTerms.length };
}

// CLI
const args = parseArgs();

if (args.help || !args.input) {
    console.log(`
Search Term Aggregator

Aggregates search term data from ad group level to account level.
Deduplicates and sums metrics for each unique search term.

Usage:
  node aggregate.js --input=<file> [options]

Required:
  --input         Input CSV file (raw from Google Ads API)

Output (one of):
  --account-name  Account name for auto-folder (saves to data/google-ads/{name}/)
  --output        Explicit output CSV file path

Options:
  --verbose       Show detailed progress
  --help          Show this help

Example:
  node aggregate.js --input=data/google-ads/mpm/raw.csv --account-name=mpm
`);
    process.exit(0);
}

const inputPath = resolve(args.input);
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
    outputPath = resolve(accountDir, `${today}-${accountName}-aggregated.csv`);
} else {
    outputPath = resolve(args.input.replace('.csv', '-aggregated.csv'));
}

aggregate(inputPath, outputPath, { verbose: args.verbose });
