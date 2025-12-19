/**
 * Script to generate a new refresh token with Google Slides and Drive API access
 *
 * This script helps you add Slides and Drive scopes to your existing OAuth credentials.
 *
 * Usage:
 *   1. Make sure GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET are in your .env.local
 *   2. Run: node scripts/get-slides-drive-refresh-token.js
 *   3. Follow the prompts
 *   4. Update GOOGLE_ADS_REFRESH_TOKEN in your .env.local with the new token
 */

// Try to load from .env.local first, then fall back to .env
const dotenv = require('dotenv');
const fs = require('fs');

// Check which file exists and load it
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
  console.log('[dotenv] Loading from .env.local');
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
  console.log('[dotenv] Loading from .env');
} else {
  console.error('❌ Error: No .env.local or .env file found');
  console.error('   Please create .env.local or .env with your OAuth credentials');
  process.exit(1);
}

const { google } = require('googleapis');
const readline = require('readline');

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('❌ Error: GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET must be set');
  console.error('   Please add them to your .env.local or .env file');
  console.error('\n   Example:');
  console.error('   GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com');
  console.error('   GOOGLE_ADS_CLIENT_SECRET=your_client_secret');
  process.exit(1);
}

// Try different redirect URIs based on OAuth client type
// Desktop app uses: urn:ietf:wg:oauth:2.0:oob
// Web application uses: http://localhost or http://localhost:3000
const redirectUri = process.env.OAUTH_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

// Include all scopes: Google Ads, Calendar, Slides, and Drive
const scopes = [
  'https://www.googleapis.com/auth/adwords', // Keep existing Google Ads scope
  'https://www.googleapis.com/auth/calendar.readonly', // Keep existing Calendar scope
  'https://www.googleapis.com/auth/presentations', // Add Google Slides scope
  'https://www.googleapis.com/auth/drive.file' // Add Google Drive scope (files created by the app)
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent', // Force consent screen to get new refresh token
});

console.log('\n📊 Google Slides & Drive API Refresh Token Generator\n');
console.log('This will generate a new refresh token with Slides and Drive access.');
console.log('Your existing Google Ads and Calendar access will be preserved.\n');

console.log('📝 Scopes included:');
console.log('   ✓ Google Ads (adwords)');
console.log('   ✓ Google Calendar (calendar.readonly)');
console.log('   ✓ Google Slides (presentations)');
console.log('   ✓ Google Drive (drive.file)\n');

if (redirectUri === 'urn:ietf:wg:oauth:2.0:oob') {
  console.log('ℹ️  Using Desktop app redirect URI (urn:ietf:wg:oauth:2.0:oob)');
  console.log('   If you get "redirect_uri_mismatch" error, see troubleshooting below.\n');
} else {
  console.log(`ℹ️  Using redirect URI: ${redirectUri}`);
  console.log('   Make sure this matches your OAuth client configuration.\n');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Step 1: Visit this URL to authorize:');
console.log('\n' + authUrl + '\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (redirectUri === 'urn:ietf:wg:oauth:2.0:oob') {
  console.log('Step 2: After authorizing, you\'ll see a page with a code.');
  console.log('Step 3: Copy that code and paste it below.\n');
} else {
  console.log('Step 2: After authorizing, you\'ll be redirected to:');
  console.log(`   ${redirectUri}`);
  console.log('Step 3: Copy the "code" parameter from the URL and paste it below.\n');
}

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

    console.log('\n✅ Success! Your new refresh token (with Slides & Drive access):\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(tokens.refresh_token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Next steps:');
    console.log('1. Copy the refresh token above');
    console.log('2. Update your .env.local file:');
    console.log(`   GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('3. Restart your development server');
    console.log('4. Test the Business Clarity Report tool - it should now generate Google Slides!\n');

  } catch (error) {
    console.error('\n❌ Error getting refresh token:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 Tip: The authorization code may have expired. Try running the script again.');
    }
    if (error.message.includes('redirect_uri_mismatch')) {
      console.log('\n🔧 Redirect URI Mismatch Error:');
      console.log('   Your OAuth client redirect URI doesn\'t match the script configuration.');
      console.log('\n   To fix this:');
      console.log('   1. Go to: https://console.cloud.google.com/apis/credentials');
      console.log('   2. Find your OAuth 2.0 Client ID');
      console.log('   3. Check the "Application type":');
      console.log('      - If "Desktop app": Make sure redirect URI is: urn:ietf:wg:oauth:2.0:oob');
      console.log('      - If "Web application": Add redirect URI: http://localhost');
      console.log('   4. If using Web application, set OAUTH_REDIRECT_URI=http://localhost in your .env');
      console.log('   5. Run this script again\n');
    }
  }
  rl.close();
});