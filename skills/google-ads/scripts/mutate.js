#!/usr/bin/env node

/**
 * Google Ads Mutation Tool
 *
 * Performs write operations on Google Ads accounts (create, update, pause, etc.)
 *
 * Usage:
 *   node google-ads-mutate.js create-campaign --account="Mr Pool Man" --name="Test Campaign" --budget=50.00 [--execute]
 *   node google-ads-mutate.js pause-campaign --account="Mr Pool Man" --campaign-id=12345 [--execute]
 *   node google-ads-mutate.js update-budget --account="Mr Pool Man" --campaign-id=12345 --budget=75.00 [--execute]
 *
 * Flags:
 *   --execute: Execute the mutation (default is dry-run)
 *   --help: Show help for specific operation
 */

import { getAdsClient, getCustomer } from './lib/auth.js';
import { resolveAccount } from './lib/accounts.js';
import { logMutation } from './lib/logger.js';
import { enums } from 'google-ads-api';

// Parse command-line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const operation = args[0];
    const flags = {};

    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            flags[key] = value === undefined ? true : value;
        }
    }

    return { operation, flags };
}

/**
 * Create a new campaign
 *
 * @param {Object} params
 * @param {string} params.account - Account identifier
 * @param {string} params.name - Campaign name
 * @param {number} params.budget - Daily budget in dollars
 * @param {boolean} params.execute - Execute mutation (default: false)
 */
async function createCampaign({ account, name, budget, execute = false }) {
    const accountInfo = resolveAccount(account);
    const customerId = accountInfo.id;
    const loginCustomerId = accountInfo.login_customer_id;

    const client = getAdsClient();
    const customer = getCustomer(client, customerId, loginCustomerId);

    try {
        const budgetAmountMicros = Math.round(parseFloat(budget) * 1_000_000);

        if (!execute) {
            const result = {
                status: 'dry_run',
                operation: 'create_campaign',
                account: accountInfo.name,
                customer_id: customerId,
                campaign_name: name,
                budget_amount: `$${parseFloat(budget).toFixed(2)}`,
                message:
                    'Dry run - no changes made. Run with --execute to create campaign.',
            };

            logMutation(result);
            return result;
        }

        // Create campaign budget
        const budgetResource = {
            name: `${name} Budget`,
            amount_micros: budgetAmountMicros,
            delivery_method: enums.BudgetDeliveryMethod.STANDARD,
        };

        const budgetOperation = {
            create: budgetResource,
        };

        const budgetResponse = await customer.campaignBudgets.create([
            budgetOperation,
        ]);

        // Create campaign
        const campaignResource = {
            name: name,
            status: enums.CampaignStatus.PAUSED,
            advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
            campaign_budget: budgetResponse.results[0].resource_name,
            manual_cpc: {
                enhanced_cpc_enabled: true,
            },
            network_settings: {
                target_google_search: true,
                target_search_network: true,
                target_content_network: false,
            },
        };

        const campaignOperation = {
            create: campaignResource,
        };

        const campaignResponse = await customer.campaigns.create([
            campaignOperation,
        ]);

        const result = {
            status: 'success',
            operation: 'create_campaign',
            account: accountInfo.name,
            customer_id: customerId,
            campaign_name: name,
            campaign_id: campaignResponse.results[0].resource_name,
            budget_id: budgetResponse.results[0].resource_name,
            campaign_status: 'PAUSED',
            message: 'Campaign created successfully (PAUSED for safety)',
        };

        logMutation(result);
        return result;
    } catch (error) {
        const errorResult = {
            status: 'error',
            operation: 'create_campaign',
            account: accountInfo.name,
            customer_id: customerId,
            error: error.message,
            details: error.errors || [],
        };

        logMutation(errorResult);
        return errorResult;
    }
}

/**
 * Pause a campaign
 *
 * @param {Object} params
 * @param {string} params.account - Account identifier
 * @param {string} params.campaignId - Campaign ID or resource name
 * @param {boolean} params.execute - Execute mutation (default: false)
 */
async function pauseCampaign({ account, campaignId, execute = false }) {
    const accountInfo = resolveAccount(account);
    const customerId = accountInfo.id;
    const loginCustomerId = accountInfo.login_customer_id;

    const client = getAdsClient();
    const customer = getCustomer(client, customerId, loginCustomerId);

    try {
        // Build resource name if just ID provided
        const resourceName = campaignId.includes('/')
            ? campaignId
            : `customers/${customerId}/campaigns/${campaignId}`;

        if (!execute) {
            const result = {
                status: 'dry_run',
                operation: 'pause_campaign',
                account: accountInfo.name,
                customer_id: customerId,
                campaign_id: resourceName,
                message:
                    'Dry run - no changes made. Run with --execute to pause campaign.',
            };

            logMutation(result);
            return result;
        }

        // Update campaign status to PAUSED
        const campaignOperation = {
            update: {
                resource_name: resourceName,
                status: enums.CampaignStatus.PAUSED,
            },
            update_mask: { paths: ['status'] },
        };

        await customer.campaigns.update([campaignOperation]);

        const result = {
            status: 'success',
            operation: 'pause_campaign',
            account: accountInfo.name,
            customer_id: customerId,
            campaign_id: resourceName,
            message: 'Campaign paused successfully',
        };

        logMutation(result);
        return result;
    } catch (error) {
        const errorResult = {
            status: 'error',
            operation: 'pause_campaign',
            account: accountInfo.name,
            customer_id: customerId,
            campaign_id: campaignId,
            error: error.message,
            details: error.errors || [],
        };

        logMutation(errorResult);
        return errorResult;
    }
}

/**
 * Update campaign budget
 *
 * @param {Object} params
 * @param {string} params.account - Account identifier
 * @param {string} params.campaignId - Campaign ID or resource name
 * @param {number} params.budget - New daily budget in dollars
 * @param {boolean} params.execute - Execute mutation (default: false)
 */
async function updateBudget({
    account,
    campaignId,
    budget,
    execute = false,
}) {
    const accountInfo = resolveAccount(account);
    const customerId = accountInfo.id;
    const loginCustomerId = accountInfo.login_customer_id;

    const client = getAdsClient();
    const customer = getCustomer(client, customerId, loginCustomerId);

    try {
        const budgetAmountMicros = Math.round(parseFloat(budget) * 1_000_000);

        // Build campaign resource name if just ID provided
        const campaignResourceName = campaignId.includes('/')
            ? campaignId
            : `customers/${customerId}/campaigns/${campaignId}`;

        // Get the campaign's budget resource name
        const query = `
            SELECT campaign.campaign_budget
            FROM campaign
            WHERE campaign.resource_name = '${campaignResourceName}'
            LIMIT 1
        `;

        const [campaignData] = await customer.query(query);

        if (!campaignData) {
            throw new Error(`Campaign not found: ${campaignResourceName}`);
        }

        const budgetResourceName = campaignData.campaign.campaign_budget;

        if (!execute) {
            const result = {
                status: 'dry_run',
                operation: 'update_budget',
                account: accountInfo.name,
                customer_id: customerId,
                campaign_id: campaignResourceName,
                budget_id: budgetResourceName,
                new_budget: `$${parseFloat(budget).toFixed(2)}`,
                message:
                    'Dry run - no changes made. Run with --execute to update budget.',
            };

            logMutation(result);
            return result;
        }

        // Update the budget
        const budgetOperation = {
            update: {
                resource_name: budgetResourceName,
                amount_micros: budgetAmountMicros,
            },
            update_mask: { paths: ['amount_micros'] },
        };

        await customer.campaignBudgets.update([budgetOperation]);

        const result = {
            status: 'success',
            operation: 'update_budget',
            account: accountInfo.name,
            customer_id: customerId,
            campaign_id: campaignResourceName,
            budget_id: budgetResourceName,
            new_budget: `$${parseFloat(budget).toFixed(2)}`,
            message: 'Budget updated successfully',
        };

        logMutation(result);
        return result;
    } catch (error) {
        const errorResult = {
            status: 'error',
            operation: 'update_budget',
            account: accountInfo.name,
            customer_id: customerId,
            campaign_id: campaignId,
            error: error.message,
            details: error.errors || [],
        };

        logMutation(errorResult);
        return errorResult;
    }
}

// Main execution
async function main() {
    const { operation, flags } = parseArgs();

    if (!operation || flags.help) {
        console.log(`
Google Ads Mutation Tool

Available operations:
  create-campaign    Create a new campaign
  pause-campaign     Pause an existing campaign
  update-budget      Update campaign budget

Use --help with an operation for detailed help:
  node google-ads-mutate.js create-campaign --help
        `);
        process.exit(0);
    }

    let result;

    switch (operation) {
        case 'create-campaign':
            if (flags.help) {
                console.log(`
Create Campaign

Usage:
  node google-ads-mutate.js create-campaign --account="Account Name" --name="Campaign Name" --budget=50.00 [--execute]

Required:
  --account     Account name, alias, or customer ID
  --name        Campaign name
  --budget      Daily budget in dollars

Optional:
  --execute     Execute the mutation (default is dry-run)

Example:
  node google-ads-mutate.js create-campaign --account="Mr Pool Man" --name="Test Campaign" --budget=50.00
                `);
                process.exit(0);
            }

            result = await createCampaign({
                account: flags.account,
                name: flags.name,
                budget: flags.budget,
                execute: flags.execute || false,
            });
            break;

        case 'pause-campaign':
            if (flags.help) {
                console.log(`
Pause Campaign

Usage:
  node google-ads-mutate.js pause-campaign --account="Account Name" --campaign-id=12345 [--execute]

Required:
  --account       Account name, alias, or customer ID
  --campaign-id   Campaign ID or full resource name

Optional:
  --execute       Execute the mutation (default is dry-run)

Example:
  node google-ads-mutate.js pause-campaign --account="Mr Pool Man" --campaign-id=12345
                `);
                process.exit(0);
            }

            result = await pauseCampaign({
                account: flags.account,
                campaignId: flags['campaign-id'],
                execute: flags.execute || false,
            });
            break;

        case 'update-budget':
            if (flags.help) {
                console.log(`
Update Budget

Usage:
  node google-ads-mutate.js update-budget --account="Account Name" --campaign-id=12345 --budget=75.00 [--execute]

Required:
  --account       Account name, alias, or customer ID
  --campaign-id   Campaign ID or full resource name
  --budget        New daily budget in dollars

Optional:
  --execute       Execute the mutation (default is dry-run)

Example:
  node google-ads-mutate.js update-budget --account="Mr Pool Man" --campaign-id=12345 --budget=75.00
                `);
                process.exit(0);
            }

            result = await updateBudget({
                account: flags.account,
                campaignId: flags['campaign-id'],
                budget: flags.budget,
                execute: flags.execute || false,
            });
            break;

        default:
            console.error(`Unknown operation: ${operation}`);
            console.log('Run with --help for available operations');
            process.exit(1);
    }

    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
