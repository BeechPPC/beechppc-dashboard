import dotenv from 'dotenv';
dotenv.config();

const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
const redirectUri = 'http://localhost';
const scope = 'https://www.googleapis.com/auth/adwords';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(clientId)}` +
  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
  `&scope=${encodeURIComponent(scope)}` +
  `&access_type=offline` +
  `&response_type=code` +
  `&prompt=consent`;

console.log('=== NEW OAuth URL with Updated Client ID ===\n');
console.log('Visit this URL in your browser:\n');
console.log(authUrl);
console.log('\n');
console.log('After authorizing, copy the redirect URL and provide it to me.');
