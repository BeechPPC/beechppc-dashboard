import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Ads API client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
});

// Authenticate with refresh token
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
});

/**
 * Get all customer accounts under the MCC
 */
export async function getCustomerAccounts() {
  try {
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
    console.log(`Found ${accounts.length} customer accounts`);
    return accounts;
  } catch (error) {
    console.error('Error fetching customer accounts:', error);
    throw error;
  }
}

/**
 * Get performance metrics for a specific customer account
 * @param {string} customerId - Customer ID without hyphens
 * @param {string} dateRange - Date range (TODAY, YESTERDAY, LAST_7_DAYS, etc.)
 */
export async function getAccountMetrics(customerId, dateRange = 'YESTERDAY') {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    });

    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        metrics.cost_micros,
        metrics.conversions,
        metrics.clicks,
        metrics.impressions,
        segments.date
      FROM campaign
      WHERE segments.date DURING ${dateRange}
    `;

    const results = await accountCustomer.query(query);

    // Aggregate metrics across all campaigns for the date range
    if (results && results.length > 0) {
      const aggregated = results.reduce((acc, row) => {
        acc.cost_micros += row.metrics.cost_micros || 0;
        acc.conversions += row.metrics.conversions || 0;
        acc.impressions += row.metrics.impressions || 0;
        return acc;
      }, { cost_micros: 0, conversions: 0, impressions: 0 });

      // Calculate averages
      const totalClicks = results.reduce((sum, row) => sum + (row.metrics.clicks || 0), 0);
      const avgCpc = totalClicks > 0 ? aggregated.cost_micros / totalClicks : 0;
      const costPerConv = aggregated.conversions > 0 ? aggregated.cost_micros / aggregated.conversions : 0;

      return {
        customer: results[0].customer,
        metrics: {
          cost_micros: aggregated.cost_micros,
          conversions: aggregated.conversions,
          average_cpc: avgCpc,
          cost_per_conversion: costPerConv,
          impressions: aggregated.impressions,
        }
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching metrics for customer ${customerId}:`, error.message);
    return null;
  }
}

/**
 * Get all MCC accounts with their metrics for today and yesterday
 */
export async function getMccReportData() {
  try {
    const accounts = await getCustomerAccounts();
    const reportData = [];

    for (const account of accounts) {
      const customerId = account.customer_client.id.toString();

      // Fetch today's and yesterday's metrics
      const [todayMetrics, yesterdayMetrics] = await Promise.all([
        getAccountMetrics(customerId, 'TODAY'),
        getAccountMetrics(customerId, 'YESTERDAY'),
      ]);

      if (yesterdayMetrics) {
        const yesterdayData = {
          id: customerId,
          name: account.customer_client.descriptive_name,
          currency: account.customer_client.currency_code,
          yesterday: {
            cost: yesterdayMetrics.metrics.cost_micros / 1_000_000,
            conversions: yesterdayMetrics.metrics.conversions,
            avgCpc: yesterdayMetrics.metrics.average_cpc / 1_000_000,
            costPerConv: yesterdayMetrics.metrics.cost_per_conversion / 1_000_000,
            impressions: yesterdayMetrics.metrics.impressions,
          },
          previousDay: todayMetrics ? {
            cost: todayMetrics.metrics.cost_micros / 1_000_000,
            conversions: todayMetrics.metrics.conversions,
            avgCpc: todayMetrics.metrics.average_cpc / 1_000_000,
            costPerConv: todayMetrics.metrics.cost_per_conversion / 1_000_000,
            impressions: todayMetrics.metrics.impressions,
          } : null,
        };

        reportData.push(yesterdayData);
      }
    }

    return reportData;
  } catch (error) {
    console.error('Error generating MCC report data:', error);
    throw error;
  }
}

export default customer;
