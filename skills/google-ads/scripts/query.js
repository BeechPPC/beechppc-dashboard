#!/usr/bin/env node

/**
 * Google Ads Query Tool - Direct API to CSV
 *
 * Executes Google Ads queries and saves results directly to CSV,
 * bypassing the context window entirely.
 *
 * Usage:
 *   ./google-ads-query.js \
 *     --customer-id=YOUR_CUSTOMER_ID \
 *     --login-customer-id=YOUR_LOGIN_CUSTOMER_ID \
 *     --query="SELECT ... FROM ... WHERE ..." \
 *     --days=120 \
 *     --output=/path/to/output.csv
 *
 *   ./google-ads-query.js --list-accounts  (show available accounts from .claude/accounts.json)
 *
 * Date Handling:
 *   - If --days provided: Calculates BETWEEN dates using account timezone
 *   - If no --days: Uses LAST_30_DAYS as fallback
 *   - Replaces "LAST_30_DAYS" in query with calculated date range
 *
 * Returns: File path and row count only
 */

import { GoogleAdsApi } from 'google-ads-api';
import { readFileSync, writeFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { resolve } from 'path';

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
    if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        if (key && value) {
            acc[key.replace('--', '')] = value;
        }
    } else if (arg.startsWith('--')) {
        // Boolean flags without values
        acc[arg.replace('--', '')] = true;
    }
    return acc;
}, {});

// Handle --list-accounts flag
if (args['list-accounts']) {
    try {
        // Find .claude/accounts.json by walking up the directory tree
        let currentDir = process.cwd();
        let accountsPath = null;

        while (currentDir !== '/') {
            const testPath = resolve(currentDir, '.claude/accounts.json');
            try {
                readFileSync(testPath);
                accountsPath = testPath;
                break;
            } catch {
                currentDir = resolve(currentDir, '..');
            }
        }

        if (!accountsPath) {
            throw new Error('Could not find .claude/accounts.json in any parent directory');
        }

        const accountsData = JSON.parse(readFileSync(accountsPath, 'utf8'));

        console.log('\nAvailable accounts from .claude/accounts.json:\n');
        Object.entries(accountsData).forEach(([key, account]) => {
            const loginInfo = account.login_customer_id ? ` (login: ${account.login_customer_id})` : '';
            console.log(`  ${account.name}`);
            console.log(`    ID: ${account.id}${loginInfo}`);
            console.log(`    Type: ${account.type} | Currency: ${account.currency}`);
            console.log(`    Aliases: ${account.aliases.join(', ')}`);
            console.log('');
        });
        process.exit(0);
    } catch (error) {
        console.error('Error: Cannot read .claude/accounts.json');
        console.error(error.message);
        process.exit(1);
    }
}

const customerId = args['customer-id'];
const loginCustomerId = args['login-customer-id'];
let query = args['query'];
const outputPath = args['output'];
const days = args['days'] ? parseInt(args['days']) : null;

// Validate arguments
if (!customerId || !query || !outputPath) {
    console.error('Error: Missing required arguments');
    console.error('');
    console.error('Usage:');
    console.error('  ./google-ads-query.js \\');
    console.error('    --customer-id=YOUR_CUSTOMER_ID \\');
    console.error('    --login-customer-id=YOUR_LOGIN_CUSTOMER_ID \\');
    console.error('    --query="SELECT ... FROM ... WHERE ..." \\');
    console.error('    --days=120 \\  (optional, defaults to LAST_30_DAYS)');
    console.error('    --output=/path/to/output.csv');
    console.error('');
    console.error('  ./google-ads-query.js --list-accounts  (show available accounts)');
    process.exit(1);
}

// Read credentials from ~/google-ads.yaml
const credentialsPath = resolve(process.env.HOME, 'google-ads.yaml');
let credentials;

try {
    const yamlContent = readFileSync(credentialsPath, 'utf8');
    credentials = parseYaml(yamlContent);
} catch (error) {
    console.error(`Error: Cannot read credentials from ${credentialsPath}`);
    console.error(error.message);
    process.exit(1);
}

// Initialize Google Ads API client
const client = new GoogleAdsApi({
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    developer_token: credentials.developer_token,
});

const customer = client.Customer({
    customer_id: customerId,
    login_customer_id: loginCustomerId || customerId,
    refresh_token: credentials.refresh_token,
});

// Get account timezone and calculate date range if --days provided
async function getAccountTimezone() {
    const timezoneQuery = 'SELECT customer.time_zone FROM customer LIMIT 1';
    const results = await customer.query(timezoneQuery);
    return results[0]?.customer?.time_zone || 'America/Los_Angeles';
}

function calculateDateRange(numDays, timezone) {
    // Get current date in account timezone
    const now = new Date();
    const endDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

    // Calculate start date (numDays ago)
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - numDays);

    // Format as YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        start: formatDate(startDate),
        end: formatDate(endDate)
    };
}

// Execute query and stream to CSV
async function executeQuery() {
    try {
        // Handle date range calculation if --days provided
        if (days) {
            const timezone = await getAccountTimezone();
            const dateRange = calculateDateRange(days, timezone);

            // Replace LAST_30_DAYS with calculated BETWEEN dates
            query = query.replace(
                /DURING\s+LAST_\d+_DAYS/gi,
                `BETWEEN '${dateRange.start}' AND '${dateRange.end}'`
            );
        } else if (!query.match(/DURING\s+LAST_\d+_DAYS/i) && !query.match(/BETWEEN/i)) {
            // If no date range specified at all, add LAST_30_DAYS as default
            if (query.match(/WHERE/i)) {
                query = query.replace(/WHERE/i, 'WHERE segments.date DURING LAST_30_DAYS AND');
            }
        }

        // Execute the query
        const results = await customer.query(query);

        if (!results || results.length === 0) {
            console.error('Error: Query returned no results');
            process.exit(1);
        }

        // Flatten nested objects to get all field names
        function flattenRow(obj, prefix = '') {
            const flattened = {};
            for (const [key, value] of Object.entries(obj)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    Object.assign(flattened, flattenRow(value, newKey));
                } else {
                    flattened[newKey] = value;
                }
            }
            return flattened;
        }

        // Flatten all rows and collect all unique headers
        const flattenedResults = results.map(row => flattenRow(row));
        const headersSet = new Set();
        flattenedResults.forEach(row => {
            Object.keys(row).forEach(key => headersSet.add(key));
        });
        const headers = Array.from(headersSet).sort();

        // Convert to CSV format
        const csvRows = [];

        // Add header row
        csvRows.push(headers.join(','));

        // Add data rows
        for (const row of flattenedResults) {
            const values = headers.map(header => {
                let value = row[header];

                // Escape CSV values
                if (value !== null && value !== undefined) {
                    value = String(value);
                    // Quote if contains comma, quote, or newline
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                } else {
                    value = '';
                }

                return value;
            });

            csvRows.push(values.join(','));
        }

        // Write to file
        const csvContent = csvRows.join('\n');
        writeFileSync(outputPath, csvContent, 'utf8');

        // Return minimal output (file path + row count)
        console.log(`File: ${outputPath}`);
        console.log(`Rows: ${results.length}`);

    } catch (error) {
        console.error('Error executing query:', error.message);
        if (error.errors) {
            error.errors.forEach(err => {
                console.error(`  - ${err.error_code?.request_error || 'Unknown error'}: ${err.message}`);
            });
        }
        process.exit(1);
    }
}

// Run the query
executeQuery();
