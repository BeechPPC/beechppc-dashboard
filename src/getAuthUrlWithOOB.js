import dotenv from 'dotenv';
dotenv.config();

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;

// Try with urn:ietf:wg:oauth:2.0:oob (out-of-band) which works without redirect URI config
const redirectUri = 'urn:ietf:wg:oauth:2.0:oob';
const scope = 'https://www.googleapis.com/auth/adwords';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(clientId)}` +
  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
  `&scope=${encodeURIComponent(scope)}` +
  `&access_type=offline` +
  `&response_type=code` +
  `&prompt=consent`;

console.log('=== OAuth URL (Out-of-Band Method) ===\n');
console.log('Visit this URL in your browser:\n');
console.log(authUrl);
console.log('\n');
console.log('After authorizing, you will see an authorization code displayed on the page.');
console.log('Copy that code and provide it to me (NOT the URL, just the code).');
console.log('\n');
console.log('ALTERNATIVELY, if this doesn\'t work, you need to:');
console.log('1. Go to Google Cloud Console');
console.log('2. APIs & Services > Credentials');
console.log('3. Click on your OAuth 2.0 Client ID');
console.log('4. Add "http://localhost" to Authorized redirect URIs');
console.log('5. Save and try the previous URL again');
