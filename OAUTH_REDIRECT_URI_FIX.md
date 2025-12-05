# Fix OAuth Redirect URI Mismatch Error

If you're getting `Error 400: redirect_uri_mismatch`, your OAuth client type doesn't match the redirect URI being used.

## Quick Fix

### Option 1: Update OAuth Client in Google Cloud Console (Recommended)

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID (the one matching your `GOOGLE_ADS_CLIENT_ID`)
3. Click on it to edit
4. Check the **Application type**:
   - **If it's "Desktop app"**: 
     - Make sure **Authorized redirect URIs** includes: `urn:ietf:wg:oauth:2.0:oob`
     - If not, add it and click **Save**
   - **If it's "Web application"**:
     - Add to **Authorized redirect URIs**: `http://localhost`
     - Click **Save**
     - Then set in your `.env` file:
       ```env
       OAUTH_REDIRECT_URI=http://localhost
       ```
5. Run the script again: `node scripts/get-calendar-refresh-token.js`

### Option 2: Use Web Application Redirect URI

If your OAuth client is configured as a "Web application":

1. Add to your `.env` file:
   ```env
   OAUTH_REDIRECT_URI=http://localhost
   ```

2. Make sure your OAuth client in Google Cloud Console has `http://localhost` in the authorized redirect URIs

3. Run the script again

### Option 3: Create a New Desktop App OAuth Client

If you want to use the desktop app flow (simpler):

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Application type**: **Desktop app**
4. Name it (e.g., "Beech PPC Desktop Client")
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**
7. Update your `.env` file:
   ```env
   GOOGLE_ADS_CLIENT_ID=your_new_client_id.apps.googleusercontent.com
   GOOGLE_ADS_CLIENT_SECRET=your_new_client_secret
   ```
8. Run the script: `node scripts/get-calendar-refresh-token.js`

## Verify Your OAuth Client Configuration

To check what redirect URIs are configured:

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Look at **Authorized redirect URIs** section
4. Make sure one of these is listed:
   - `urn:ietf:wg:oauth:2.0:oob` (for Desktop app)
   - `http://localhost` (for Web application)
   - `http://localhost:3000` (if using port 3000)

## Common Issues

### "redirect_uri_mismatch" Error
- **Cause**: The redirect URI in the script doesn't match what's configured in Google Cloud Console
- **Fix**: Follow Option 1 above to update your OAuth client configuration

### "App isn't verified" Warning
- **Cause**: Your app is in testing mode (normal for personal use)
- **Fix**: Click "Advanced" → "Go to [Your App Name] (unsafe)" → "Allow"

### Authorization Code Expired
- **Cause**: The code from the OAuth flow expired (they expire quickly)
- **Fix**: Run the script again and complete the flow quickly

## After Fixing

Once you've fixed the redirect URI:

1. Run: `node scripts/get-calendar-refresh-token.js`
2. Visit the authorization URL
3. Grant permissions
4. Copy the authorization code
5. Paste it into the terminal
6. Copy the refresh token
7. Update `GOOGLE_ADS_REFRESH_TOKEN` in your `.env` file

