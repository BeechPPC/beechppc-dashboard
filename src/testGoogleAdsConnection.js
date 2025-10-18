import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

async function testGoogleAdsConnection() {
  console.log('Testing Google Ads API connection...\n');

  // Step 1: Verify credentials are loaded
  console.log('Step 1: Verifying credentials are loaded from .env');
  console.log(`Developer Token: ${process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`Client ID: ${process.env.GOOGLE_ADS_CLIENT_ID ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`Client Secret: ${process.env.GOOGLE_ADS_CLIENT_SECRET ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`Refresh Token: ${process.env.GOOGLE_ADS_REFRESH_TOKEN ? '✓ Loaded' : '✗ Missing'}`);
  console.log(`MCC ID: ${process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID}\n`);

  // Step 2: Initialize API client
  console.log('Step 2: Initializing Google Ads API client...');
  try {
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });
    console.log('✓ Client initialized\n');

    // Step 3: Create customer instance
    console.log('Step 3: Creating customer instance...');
    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });
    console.log('✓ Customer instance created\n');

    // Step 4: Try a simple query
    console.log('Step 4: Testing with a simple accessible_bidding_strategy query...');
    try {
      const simpleQuery = `
        SELECT
          accessible_bidding_strategy.id,
          accessible_bidding_strategy.name
        FROM accessible_bidding_strategy
        LIMIT 1
      `;
      const result = await customer.query(simpleQuery);
      console.log('✓ Simple query successful');
      console.log(`   Result count: ${result.length}\n`);
    } catch (error) {
      console.error('✗ Simple query failed:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error details:', error.details, '\n');
    }

    // Step 5: Try customer_client query
    console.log('Step 5: Testing customer_client query (MCC account list)...');
    try {
      const customerClientQuery = `
        SELECT
          customer_client.id,
          customer_client.descriptive_name
        FROM customer_client
        LIMIT 5
      `;
      const accounts = await customer.query(customerClientQuery);
      console.log('✓ Customer client query successful');
      console.log(`   Found ${accounts.length} accounts\n`);

      if (accounts.length > 0) {
        console.log('   Sample accounts:');
        accounts.slice(0, 3).forEach(acc => {
          console.log(`   - ${acc.customer_client.descriptive_name} (ID: ${acc.customer_client.id})`);
        });
      }
    } catch (error) {
      console.error('✗ Customer client query failed:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error details:', error.details, '\n');
    }

    console.log('\n✅ Connection test completed');
  } catch (error) {
    console.error('✗ Failed to initialize client:', error.message);
    process.exit(1);
  }
}

testGoogleAdsConnection();
