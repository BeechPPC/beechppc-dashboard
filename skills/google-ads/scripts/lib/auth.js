/**
 * Shared Google Ads API authentication
 *
 * Provides a single source of truth for GoogleAdsApi client initialization.
 * Uses ~/google-ads.yaml for credentials (same as MCP server).
 */

import { GoogleAdsApi } from 'google-ads-api';
import fs from 'fs';
import yaml from 'yaml';
import { homedir } from 'os';
import { join } from 'path';

// Cache credentials to avoid repeated file reads
let cachedCredentials = null;

/**
 * Load credentials from ~/google-ads.yaml
 *
 * @returns {Object} Credentials object
 */
function loadCredentials() {
    if (cachedCredentials) {
        return cachedCredentials;
    }

    const configPath = join(homedir(), 'google-ads.yaml');

    if (!fs.existsSync(configPath)) {
        throw new Error(`Google Ads config not found at: ${configPath}`);
    }

    const configFile = fs.readFileSync(configPath, 'utf8');
    cachedCredentials = yaml.parse(configFile);

    return cachedCredentials;
}

/**
 * Initialize Google Ads API client
 *
 * @returns {GoogleAdsApi} Initialized Google Ads API client
 */
export function getAdsClient() {
    const config = loadCredentials();

    return new GoogleAdsApi({
        client_id: config.client_id,
        client_secret: config.client_secret,
        developer_token: config.developer_token,
    });
}

/**
 * Get customer client for a specific account
 *
 * @param {GoogleAdsApi} client - Google Ads API client
 * @param {string} customerId - Customer ID (digits only)
 * @param {string} loginCustomerId - Optional MCC login customer ID
 * @returns {Customer} Customer client instance
 */
export function getCustomer(client, customerId, loginCustomerId = null) {
    const config = loadCredentials();

    return client.Customer({
        customer_id: customerId,
        login_customer_id: loginCustomerId || customerId,
        refresh_token: config.refresh_token,
    });
}
