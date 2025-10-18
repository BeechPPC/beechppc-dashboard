import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

async function testAlternativeMethod() {
  console.log('Testing alternative Google Ads API methods...\n');

  try {
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });

    console.log('Testing list accessible customers...');
    try {
      // Try to list accessible customers using the customer service
      const customers = await customer.listAccessibleCustomers();
      console.log('✓ List accessible customers successful!');
      console.log('Accessible customer IDs:', customers);
      console.log('');
    } catch (error) {
      console.error('✗ List accessible customers failed:', error.message);
      console.error('Error code:', error.code);
      console.error('');
    }

    console.log('Testing report method with campaign query...');
    try {
      const report = await customer.report({
        entity: 'campaign',
        attributes: ['campaign.id', 'campaign.name'],
        metrics: ['metrics.impressions', 'metrics.clicks', 'metrics.cost_micros'],
        constraints: {
          'campaign.status': 'ENABLED'
        },
        date_constant: 'YESTERDAY',
        limit: 5
      });

      console.log('✓ Report method successful!');
      console.log(`Found ${report.length} campaigns`);
      if (report.length > 0) {
        console.log('Sample campaign:', report[0]);
      }
    } catch (error) {
      console.error('✗ Report method failed:', error.message);
      console.error('Error code:', error.code);
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

testAlternativeMethod();
