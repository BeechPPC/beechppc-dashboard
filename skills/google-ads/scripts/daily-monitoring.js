#!/usr/bin/env node

/**
 * Daily Google Ads Monitoring
 *
 * Fetches yesterday's performance for all client accounts in accounts.json
 * Outputs formatted markdown table for inclusion in daily briefing
 *
 * Usage: node daily-monitoring.js
 */

import { GoogleAdsApi } from 'google-ads-api';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load Google Ads credentials
function loadCredentials() {
    const credPath = join(process.env.HOME, 'google-ads.yaml');
    const creds = load(readFileSync(credPath, 'utf8'));
    return creds;
}

// Load accounts from accounts.json
function loadAccounts() {
    const accountsPath = join(__dirname, '../../../accounts.json');
    const accounts = JSON.parse(readFileSync(accountsPath, 'utf8'));
    return accounts;
}

// Get yesterday's metrics for an account
async function getYesterdayMetrics(client, customerId, loginCustomerId) {
    const customer = client.Customer({
        customer_id: customerId,
        login_customer_id: loginCustomerId,
        refresh_token: client.credentials.refresh_token
    });

    const query = `
        SELECT
            customer.descriptive_name,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value
        FROM customer
        WHERE segments.date DURING YESTERDAY
    `;

    try {
        const results = await customer.query(query);
        if (results.length > 0) {
            const row = results[0];
            return {
                name: row.customer.descriptive_name,
                cost: row.metrics.cost_micros / 1000000,
                conversions: row.metrics.conversions || 0,
                value: row.metrics.conversions_value || 0,
                roas: row.metrics.cost_micros > 0
                    ? (row.metrics.conversions_value / (row.metrics.cost_micros / 1000000)).toFixed(1)
                    : 0
            };
        }
        return null;
    } catch (error) {
        console.error(`Error fetching ${customerId}: ${error.message}`);
        return null;
    }
}

// Format currency based on account currency
function formatCurrency(amount, currency) {
    const symbols = { AUD: 'A$', USD: '$', GBP: '£' };
    const symbol = symbols[currency] || '$';
    return `${symbol}${amount.toFixed(0)}`;
}

async function main() {
    const creds = loadCredentials();
    const accounts = loadAccounts();

    const client = new GoogleAdsApi({
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        developer_token: creds.developer_token
    });

    client.credentials = { refresh_token: creds.refresh_token };

    // Filter to client accounts only (not manager accounts)
    const clientAccounts = Object.entries(accounts)
        .filter(([key, acc]) => acc.type === 'client')
        .map(([key, acc]) => ({ key, ...acc }));

    const results = [];
    const alerts = [];

    for (const account of clientAccounts) {
        const metrics = await getYesterdayMetrics(
            client,
            account.id,
            account.login_customer_id
        );

        if (metrics) {
            results.push({
                ...metrics,
                key: account.key,
                currency: account.currency
            });

            // Check for alerts
            if (metrics.roas < 3 && metrics.cost > 0) {
                alerts.push(`⚠️ ${metrics.name}: ROAS ${metrics.roas}x (below 3x threshold)`);
            }
            if (metrics.conversions === 0 && metrics.cost > 50) {
                alerts.push(`⚠️ ${metrics.name}: ${formatCurrency(metrics.cost, account.currency)} spent, 0 conversions`);
            }
        }
    }

    // Output markdown
    console.log('### Google Ads - Yesterday\n');

    if (results.length === 0) {
        console.log('No account data available.\n');
        return;
    }

    console.log('| Account | Cost | Conv | Value | ROAS |');
    console.log('|---------|------|------|-------|------|');

    for (const r of results) {
        const shortName = r.key.toUpperCase().substring(0, 3);
        console.log(`| ${shortName} | ${formatCurrency(r.cost, r.currency)} | ${r.conversions.toFixed(0)} | ${formatCurrency(r.value, r.currency)} | ${r.roas}x |`);
    }

    if (alerts.length > 0) {
        console.log('\n**Alerts:**');
        for (const alert of alerts) {
            console.log(`- ${alert}`);
        }
    }

    console.log('');
}

main().catch(console.error);
