/**
 * Shared Google OAuth2 authentication for Gmail skill
 *
 * Self-contained auth module for Gmail operations.
 * Uses credentials from auth/google/ folder.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Use shared credentials from project root
const CREDENTIALS_PATH = path.join(__dirname, '../../../../auth/google/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../../../auth/google/token.json');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose'
];

async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  // Handle both "installed" (Desktop) and "web" credential formats
  const creds = credentials.installed || credentials.web;
  const { client_id, client_secret } = creds;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3000'
  );

  // Check if token exists
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Need to get new token - start local server to catch callback
  const http = require('http');
  const url = require('url');

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');

        if (code) {
          res.end('Authorization successful! You can close this window.');
          server.close();

          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
          console.log('\nToken saved\n');
          resolve(oAuth2Client);
        }
      } catch (err) {
        reject(err);
      }
    });

    server.listen(3000, () => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });

      console.log('\nAuthorization required!');
      console.log('\nOpen this URL in your browser:\n');
      console.log(authUrl);
      console.log('\nWaiting for authorization...\n');
    });
  });
}

module.exports = { authorize };
