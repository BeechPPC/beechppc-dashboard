import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const code = '4/0AVGzR1AFT986nAcg-3aIEy15CnXthl2uo7zCHPGoX0yv9ZoikGe5MHMjzqgKtW1iDTy1AA';
const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
const redirectUri = 'http://localhost';

console.log('Exchanging authorization code for refresh token...\n');

const tokenData = new URLSearchParams({
  code: code,
  client_id: clientId,
  client_secret: clientSecret,
  redirect_uri: redirectUri,
  grant_type: 'authorization_code'
}).toString();

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
      const tokens = JSON.parse(data);
      console.log('✅ Success! Your new refresh token:\n');
      console.log('─────────────────────────────────────────────────────────');
      console.log('REFRESH TOKEN:');
      console.log(tokens.refresh_token);
      console.log('─────────────────────────────────────────────────────────\n');
      console.log('Update your .env file with:');
      console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    } else {
      console.error('❌ Token exchange failed:');
      console.error(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(tokenData);
req.end();
