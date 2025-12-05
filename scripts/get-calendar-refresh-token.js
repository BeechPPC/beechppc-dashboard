/**
 * Script to generate a new refresh token with Google Calendar API access
 * 
 * This script helps you add Calendar scope to your existing OAuth credentials.
 * 
 * Usage:
 *   1. Make sure GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET are in your .env.local
 *   2. Run: node scripts/get-calendar-refresh-token.js
 *   3. Follow the prompts
 *   4. Update GOOGLE_ADS_REFRESH_TOKEN in your .env.local with the new token
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const readline = require('readline');

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('❌ Error: GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET must be set in .env.local');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  'urn:ietf:wg:oauth:2.0:oob' // Redirect URI for installed apps
);

// Include both Google Ads and Calendar scopes
const scopes = [
  'https://www.googleapis.com/auth/adwords', // Keep existing Google Ads scope
  'https://www.googleapis.com/auth/calendar.readonly' // Add Calendar scope
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent', // Force consent screen to get new refresh token
});

console.log('\n📅 Google Calendar API Refresh Token Generator\n');
console.log('This will generate a new refresh token with Calendar access.');
console.log('Your existing Google Ads access will be preserved.\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Step 1: Visit this URL to authorize:');
console.log('\n' + authUrl + '\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Step 2: After authorizing, you\'ll be redirected to a page with a code.');
console.log('Step 3: Copy that code and paste it below.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    
    if (!tokens.refresh_token) {
      console.error('\n❌ Error: No refresh token received. You may need to revoke previous access first.');
      console.log('\nTo revoke access:');
      console.log('1. Go to: https://myaccount.google.com/permissions');
      console.log('2. Find "Beech PPC AI Agent" or your app name');
      console.log('3. Click "Remove Access"');
      console.log('4. Run this script again\n');
      rl.close();
      return;
    }

    console.log('\n✅ Success! Your new refresh token (with Calendar access):\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(tokens.refresh_token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Next steps:');
    console.log('1. Copy the refresh token above');
    console.log('2. Update your .env.local file:');
    console.log(`   GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('3. Restart your development server');
    console.log('4. Check the Meetings page - it should now use Google Calendar API!\n');
    
  } catch (error) {
    console.error('\n❌ Error getting refresh token:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 Tip: The authorization code may have expired. Try running the script again.');
    }
  }
  rl.close();
});

