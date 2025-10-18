import dotenv from 'dotenv';
import https from 'https';
import { createInterface } from 'readline';

dotenv.config();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function generateRefreshToken() {
  console.log('=== Google Ads API - Refresh Token Generator ===\n');

  console.log('This script will help you generate a new refresh token for Google Ads API.\n');

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;

  console.log(`Client ID: ${clientId}`);
  console.log(`Client Secret: ${clientSecret ? '***' + clientSecret.slice(-4) : 'Missing'}\n`);

  if (!clientId || !clientSecret) {
    console.error('❌ Error: GOOGLE_ADS_CLIENT_ID or GOOGLE_ADS_CLIENT_SECRET not found in .env file');
    process.exit(1);
  }

  try {
    // Manually construct OAuth URL
    const redirectUri = 'http://localhost';
    const scope = 'https://www.googleapis.com/auth/adwords';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&response_type=code` +
      `&prompt=consent`;

    console.log('Step 1: Authorize the application');
    console.log('─────────────────────────────────────────────────────────');
    console.log('\nPlease visit this URL in your browser:\n');
    console.log(authUrl);
    console.log('\n─────────────────────────────────────────────────────────');
    console.log('\nAfter authorizing, you will be redirected to a URL.');
    console.log('Copy the ENTIRE redirect URL (it will look like: http://localhost/?code=...)');

    const redirectUrl = await question('\nPaste the full redirect URL here: ');

    // Extract the authorization code from the URL
    const urlParams = new URL(redirectUrl.trim());
    const code = urlParams.searchParams.get('code');

    if (!code) {
      console.error('\n❌ Error: Could not extract authorization code from URL');
      console.error('Make sure you pasted the complete redirect URL');
      process.exit(1);
    }

    console.log('\nStep 2: Exchanging authorization code for refresh token...');

    // Exchange code for tokens using Google's token endpoint
    const tokenData = new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }).toString();

    const tokens = await new Promise((resolve, reject) => {
      const req = https.request('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': tokenData.length
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Token exchange failed: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(tokenData);
      req.end();
    });

    console.log('\n✅ Success! Your new refresh token has been generated:\n');
    console.log('─────────────────────────────────────────────────────────');
    console.log('REFRESH TOKEN:');
    console.log(tokens.refresh_token);
    console.log('─────────────────────────────────────────────────────────\n');

    console.log('Update your .env file with this new refresh token:');
    console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`);

    console.log('Access Token (temporary, for testing):');
    console.log(tokens.access_token);
    console.log('\nExpires in:', tokens.expires_in, 'seconds');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

generateRefreshToken();
