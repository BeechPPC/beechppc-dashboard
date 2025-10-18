/**
 * Google Ads Query Functions for Report Templates
 * Fetches data based on template configurations
 */

import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Ads API client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

/**
 * Get search terms with zero conversions
 * @param {string} customerId - Customer ID without hyphens
 * @param {string} dateRange - Date range (default: LAST_14_DAYS)
 * @returns {Array} Array of search term data
 */
export async function getZeroConversionSearchTerms(customerId, dateRange = 'LAST_14_DAYS') {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    });

    const query = `
      SELECT
        search_term_view.search_term,
        search_term_view.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        campaign.name,
        ad_group.name
      FROM search_term_view
      WHERE segments.date DURING ${dateRange}
        AND metrics.clicks > 0
        AND metrics.conversions = 0
      ORDER BY metrics.clicks DESC
    `;

    const results = await accountCustomer.query(query);

    return results.map(row => ({
      searchTerm: row.search_term_view.search_term,
      status: row.search_term_view.status,
      campaign: row.campaign.name,
      adGroup: row.ad_group.name,
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      cost: (row.metrics.cost_micros || 0) / 1_000_000,
      conversions: row.metrics.conversions || 0,
      ctr: (row.metrics.ctr || 0) * 100, // Convert to percentage
    }));
  } catch (error) {
    console.error(`Error fetching zero conversion search terms for ${customerId}:`, error.message);
    return [];
  }
}

/**
 * Get best performing ads by CTR
 * @param {string} customerId - Customer ID without hyphens
 * @param {string} dateRange - Date range (default: LAST_14_DAYS)
 * @param {number} limit - Number of results to return
 * @returns {Array} Array of ad performance data
 */
export async function getBestPerformingAdsByCtr(customerId, dateRange = 'LAST_14_DAYS', limit = 20) {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    });

    const query = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.ad.final_urls,
        campaign.name,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM ad_group_ad
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions >= 100
        AND ad_group_ad.status = 'ENABLED'
      ORDER BY metrics.ctr DESC
      LIMIT ${limit}
    `;

    const results = await accountCustomer.query(query);

    return results.map(row => ({
      adId: row.ad_group_ad.ad.id,
      adName: row.ad_group_ad.ad.name || `Ad ${row.ad_group_ad.ad.id}`,
      adType: row.ad_group_ad.ad.type,
      finalUrls: row.ad_group_ad.ad.final_urls || [],
      campaign: row.campaign.name,
      adGroup: row.ad_group.name,
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      cost: (row.metrics.cost_micros || 0) / 1_000_000,
      conversions: row.metrics.conversions || 0,
      ctr: (row.metrics.ctr || 0) * 100, // Convert to percentage
    }));
  } catch (error) {
    console.error(`Error fetching best performing ads for ${customerId}:`, error.message);
    return [];
  }
}

/**
 * Get best performing keywords by conversions
 * @param {string} customerId - Customer ID without hyphens
 * @param {string} dateRange - Date range (default: LAST_14_DAYS)
 * @param {number} limit - Number of results to return
 * @returns {Array} Array of keyword performance data
 */
export async function getBestPerformingKeywordsByConversion(customerId, dateRange = 'LAST_14_DAYS', limit = 20) {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    });

    const query = `
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.criterion_id,
        campaign.name,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.cost_per_conversion
      FROM keyword_view
      WHERE segments.date DURING ${dateRange}
        AND metrics.conversions >= 1
        AND ad_group_criterion.status = 'ENABLED'
      ORDER BY metrics.conversions DESC
      LIMIT ${limit}
    `;

    const results = await accountCustomer.query(query);

    return results.map(row => ({
      keyword: row.ad_group_criterion.keyword.text,
      matchType: row.ad_group_criterion.keyword.match_type,
      criterionId: row.ad_group_criterion.criterion_id,
      campaign: row.campaign.name,
      adGroup: row.ad_group.name,
      impressions: row.metrics.impressions || 0,
      clicks: row.metrics.clicks || 0,
      cost: (row.metrics.cost_micros || 0) / 1_000_000,
      conversions: row.metrics.conversions || 0,
      ctr: (row.metrics.ctr || 0) * 100, // Convert to percentage
      costPerConversion: (row.metrics.cost_per_conversion || 0) / 1_000_000,
    }));
  } catch (error) {
    console.error(`Error fetching best performing keywords for ${customerId}:`, error.message);
    return [];
  }
}

/**
 * Get all customer accounts under the MCC
 * @returns {Array} Array of customer accounts
 */
export async function getCustomerAccounts() {
  try {
    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });

    const query = `
      SELECT
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.status,
        customer_client.currency_code
      FROM customer_client
      WHERE customer_client.level = 1
        AND customer_client.status = 'ENABLED'
    `;

    const accounts = await customer.query(query);
    return accounts.map(account => ({
      id: account.customer_client.id.toString(),
      name: account.customer_client.descriptive_name,
      currency: account.customer_client.currency_code,
      status: account.customer_client.status,
    }));
  } catch (error) {
    console.error('Error fetching customer accounts:', error);
    throw error;
  }
}

/**
 * Execute a template query for a specific account
 * @param {string} customerId - Customer ID
 * @param {Object} template - Report template configuration
 * @returns {Array} Query results
 */
export async function executeTemplateQuery(customerId, template) {
  switch (template.type) {
    case 'SEARCH_TERMS':
      return await getZeroConversionSearchTerms(customerId, template.dateRange);

    case 'ADS':
      return await getBestPerformingAdsByCtr(customerId, template.dateRange, template.limit);

    case 'KEYWORDS':
      return await getBestPerformingKeywordsByConversion(customerId, template.dateRange, template.limit);

    default:
      throw new Error(`Unknown template type: ${template.type}`);
  }
}
