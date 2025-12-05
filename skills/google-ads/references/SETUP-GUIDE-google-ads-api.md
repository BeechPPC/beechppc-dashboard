# Google Ads API Setup Guide

**Complete guide for getting Google Ads API access and creating the `google-ads.yaml` credentials file.**

---

## Overview

This guide walks you through setting up Google Ads API access so you can use the Google Ads query and mutation tools with Claude Code.

**What you'll create:**
- Google Cloud project with Google Ads API enabled
- OAuth 2.0 credentials for API access
- Developer token from Google Ads account
- `~/google-ads.yaml` credentials file

**Time required:** 45-60 minutes (includes review time for developer token)

**Prerequisites:**
- Google Ads account with admin access
- Google Cloud account (free tier is sufficient)
- Basic command-line familiarity (or use AI to help!)

---

## Quick Start Checklist

Before you begin, ensure you have:
- [ ] Google Ads account (manager or individual account)
- [ ] Admin-level access to Google Ads account
- [ ] Google Cloud Console access
- [ ] Node.js installed (for testing)
- [ ] Command-line terminal access (eg Cursor, terminal, etc)

---

## Part 1: Google Cloud Project Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **Select a Project** dropdown (top left)
4. Click **New Project**
5. Enter project details:
   - **Project Name**: `Google Ads API Access` (or your preferred name)
   - **Organization**: (leave as default or select your organization)
6. Click **Create**
7. Wait for project creation (takes ~30 seconds)
8. **Select your new project** from the dropdown

**Note:** Keep this browser tab open - you'll use it throughout setup.

### Step 2: Enable Google Ads API

1. In Google Cloud Console, go to **APIs & Services > Library**
   - Or use search bar: type "API Library"
2. Search for: `Google Ads API`
3. Click **Google Ads API** (by Google)
4. Click **Enable**
5. Wait for API to be enabled (~10 seconds)

**Confirmation:** You should see "API enabled" with a green checkmark.

---

## Part 2: Create OAuth 2.0 Credentials

### Step 3: Configure OAuth Consent Screen

**Why this is needed:** Google requires an OAuth consent screen before you can create credentials.

1. Go to **APIs & Services > OAuth consent screen**
2. Select **User Type**:
   - Choose **External** (unless you have Google Workspace, then Internal is fine)
   - Click **Create**

3. **Fill in App Information:**
   - **App name**: `Google Ads API Client` (or your preferred name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - Leave other fields blank
   - Click **Save and Continue**

4. **Scopes** screen:
   - Click **Add or Remove Scopes**
   - Search for: `https://www.googleapis.com/auth/adwords`
   - Check the box for this scope
   - Click **Update**
   - Click **Save and Continue**

5. **Test users** screen:
   - Click **Add Users**
   - Enter your Google Ads account email
   - Click **Add**
   - Click **Save and Continue**

6. **Summary** screen:
   - Review your settings
   - Click **Back to Dashboard**

**Note:** Your app will remain in "Testing" mode, which is fine for personal API access.

### Step 4: Create OAuth Client ID

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials** (top of page)
3. Select **OAuth client ID**

4. **Configure OAuth Client:**
   - **Application type**: Select **Desktop app**
   - **Name**: `Google Ads API Desktop Client`
   - Click **Create**

5. **Download credentials:**
   - A popup appears with Client ID and Client Secret
   - Click **Download JSON**
   - Save file as `client_secrets.json` (remember location)
   - Click **OK**

**Important:** Keep this JSON file secure - it contains your client secret.

---

## Part 3: Get Developer Token

### Step 5: Apply for Developer Token

**What is a developer token?**
A developer token identifies your application to the Google Ads API. Each Google Ads account has one developer token.

1. Sign in to [Google Ads](https://ads.google.com/)
2. Click **Tools & Settings** (wrench icon, top right)
3. Under **Setup**, click **API Center**

4. **If you see your developer token:**
   - Copy it (format: `XXXX-XXXX-XXXX-XXXX`)
   - **Access level**: Should show "Standard" or "Test"
   - Skip to Part 4

5. **If you need to apply for a token:**
   - Click **Apply for access level**
   - Fill in application form:
     - **Application name**: `Google Ads API Client`
     - **How will you use the API**: `Personal automation for campaign management and reporting`
     - **Estimated API requests per day**: `1000` (or realistic estimate)
   - Click **Submit**
   - **Wait for approval** (can take 24-48 hours)

**Test vs Standard Access:**
- **Test access**: Free, works immediately, limited to test accounts
- **Standard access**: Required for production accounts, needs Google approval
- For personal use: Test access is usually sufficient if using test accounts

**While waiting for approval:** You can continue setup and use Test access level.

---

## Part 4: Get Refresh Token

### Step 6: Set Up Authentication Helper

**Why this is needed:** You need to exchange your OAuth credentials for a refresh token. We'll use Google's official authentication helper.

1. **Install Google Ads API library** (if not already done):
   ```bash
   npm install google-ads-api
   ```

2. **Create authentication helper script:**

   Create file: `get-refresh-token.js`

   ```javascript
   #!/usr/bin/env node

   import { GoogleAdsApi } from 'google-ads-api';
   import readline from 'readline';
   import { readFileSync } from 'fs';

   // Read client secrets
   const clientSecrets = JSON.parse(readFileSync('./client_secrets.json', 'utf8'));

   const client = new GoogleAdsApi({
       client_id: clientSecrets.installed.client_id,
       client_secret: clientSecrets.installed.client_secret,
   });

   // Generate authorization URL
   const authUrl = client.getOAuthUrl();

   console.log('\n========================================');
   console.log('Google Ads API Authentication');
   console.log('========================================\n');
   console.log('Step 1: Visit this URL in your browser:\n');
   console.log(authUrl);
   console.log('\n');
   console.log('Step 2: Sign in with your Google Ads account');
   console.log('Step 3: Click "Allow" to grant permissions');
   console.log('Step 4: Copy the authorization code from the URL');
   console.log('\n========================================\n');

   const rl = readline.createInterface({
       input: process.stdin,
       output: process.stdout,
   });

   rl.question('Paste the authorization code here: ', async (code) => {
       try {
           const token = await client.getRefreshToken(code);
           console.log('\n========================================');
           console.log('Success! Your refresh token:');
           console.log('========================================\n');
           console.log(token);
           console.log('\n========================================');
           console.log('Save this token - you will need it for google-ads.yaml');
           console.log('========================================\n');
       } catch (error) {
           console.error('\nError getting refresh token:', error.message);
       }
       rl.close();
   });
   ```

3. **Make script executable:**
   ```bash
   chmod +x get-refresh-token.js
   ```

### Step 7: Run Authentication Flow

1. **Run the script:**
   ```bash
   node get-refresh-token.js
   ```

2. **Copy the URL** that appears in terminal

3. **Open URL in browser:**
   - Sign in with your Google account
   - Click **Advanced** if you see "App isn't verified"
   - Click **Go to Google Ads API Client (unsafe)**
   - Click **Allow** to grant permissions

4. **Copy authorization code:**
   - After allowing, you'll be redirected to a URL like:
     ```
     http://localhost/?code=4/0AY0e-g7XXXXXXXXXXXXXXXXXXXXX&scope=...
     ```
   - Copy everything after `code=` up to `&scope`
   - Example code: `4/0AY0e-g7XXXXXXXXXXXXXXXXXXXXX`

5. **Paste code into terminal** and press Enter

6. **Save your refresh token:**
   - You'll see output like:
     ```
     1//0gXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
     ```
   - Copy this entire token
   - Store securely (you'll need it next)

**Troubleshooting:**
- **"Redirect URI mismatch"**: Make sure you selected "Desktop app" when creating OAuth client
- **"App isn't verified"**: This is normal - click "Advanced" and proceed
- **Script errors**: Ensure client_secrets.json is in same directory as script

---

## Part 5: Create Configuration File

### Step 8: Create google-ads.yaml

This file stores your credentials and is used by all Google Ads API tools.

1. **Create file** at: `~/google-ads.yaml`
   ```bash
   touch ~/google-ads.yaml
   ```

2. **Open in text editor** and paste:

   ```yaml
   # Google Ads API Configuration
   # Created: 2025-11-05

   # OAuth Credentials (from client_secrets.json)
   client_id: YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   client_secret: YOUR_CLIENT_SECRET_HERE

   # Refresh Token (from get-refresh-token.js)
   refresh_token: 1//0gXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

   # Developer Token (from Google Ads API Center)
   developer_token: XXXX-XXXX-XXXX-XXXX

   # Optional: Default login customer ID (MCC account)
   # Uncomment and set if you manage accounts through an MCC
   # login_customer_id: 1234567890
   ```

3. **Replace placeholders:**

   **client_id**:
   - Open `client_secrets.json`
   - Find: `"client_id"` field
   - Copy entire value (ends with `.apps.googleusercontent.com`)

   **client_secret**:
   - Open `client_secrets.json`
   - Find: `"client_secret"` field
   - Copy the value

   **refresh_token**:
   - Use token from Step 7 (starts with `1//0g`)

   **developer_token**:
   - Use token from Step 5 (format: `XXXX-XXXX-XXXX-XXXX`)

   **login_customer_id** (optional):
   - Only needed if you manage accounts through an MCC (manager account)
   - Use the MCC customer ID (10 digits, no dashes)

4. **Save the file**

5. **Set file permissions** (keep credentials secure):
   ```bash
   chmod 600 ~/google-ads.yaml
   ```

**Example (with fake values):**
```yaml
client_id: 123456789-abc123xyz.apps.googleusercontent.com
client_secret: GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
refresh_token: 1//0gXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
developer_token: 1234-5678-9012-3456
# login_customer_id: 1234567890
```

---

## Part 6: Test Your Setup

### Step 9: Install Google Ads Query Tool

If you haven't already:

```bash
cd ~/Projects/brain/code/google-ads
npm install
```

### Step 10: Test API Connection

**Test 1: Get customer info**

```bash
node google-ads-query.js \
  --customer-id=YOUR_CUSTOMER_ID \
  --query="SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1" \
  --output=/tmp/test.csv
```

Replace `YOUR_CUSTOMER_ID` with your Google Ads customer ID (10 digits, no dashes).

**Expected output:**
```
File: /tmp/test.csv
Rows: 1
```

**Test 2: Get campaigns**

```bash
node google-ads-query.js \
  --customer-id=YOUR_CUSTOMER_ID \
  --query="SELECT campaign.name, campaign.status FROM campaign LIMIT 5" \
  --output=/tmp/campaigns.csv
```

**Expected output:**
```
File: /tmp/campaigns.csv
Rows: 5
```

**View results:**
```bash
cat /tmp/test.csv
cat /tmp/campaigns.csv
```

You should see your account name and campaign names.

### Step 11: Test with Claude Code

In Claude Code:

```
Test my Google Ads API connection by querying customer info for account 1234567890
```

Claude should use the google-ads-query.js tool and return success.

---

## Troubleshooting

### Authentication Errors

**Error: "Invalid developer token"**

**Solutions:**
- Check developer token in google-ads.yaml matches API Center
- Ensure no extra spaces or line breaks in YAML
- Verify token has been approved (not just applied for)
- If using Test access, ensure you're querying a test account

---

**Error: "OAuth credentials are invalid"**

**Solutions:**
- Verify client_id and client_secret are correct
- Check for typos in google-ads.yaml
- Ensure no quotes around values in YAML
- Regenerate refresh token if > 6 months old

---

**Error: "User doesn't have permission"**

**Solutions:**
- Verify refresh token was generated with correct Google account
- Check that account has admin access to Google Ads account
- Re-run OAuth flow with correct user

---

### Connection Errors

**Error: "Cannot find google-ads.yaml"**

**Solutions:**
- Ensure file is at `~/google-ads.yaml`
- Check file permissions: `ls -la ~/google-ads.yaml`
- Verify you're using absolute path in scripts

---

**Error: "Customer not found"**

**Solutions:**
- Verify customer ID is correct (10 digits, no dashes)
- Check if you need to specify `login_customer_id` for MCC-managed accounts
- Ensure account isn't canceled or suspended

---

### Developer Token Issues

**"Test account required"**

**Issue:** Developer token is at Test access level

**Solutions:**
- Use test accounts only (accounts with "Test" in description)
- Or apply for Standard access via API Center
- Standard access requires business verification

---

**"Token approval pending"**

**Issue:** Developer token application is under review

**Solutions:**
- Wait 24-48 hours for Google review
- Check email for approval notification
- Meanwhile, use Test access level with test accounts

---

## Security Best Practices

### Credential Storage

**DO:**
- ✅ Keep google-ads.yaml in home directory (~/)
- ✅ Set file permissions to 600 (owner read/write only)
- ✅ Never commit credentials to git repositories
- ✅ Backup credentials in secure password manager

**DON'T:**
- ❌ Store credentials in project directories
- ❌ Share refresh tokens with others
- ❌ Commit client_secrets.json to version control
- ❌ Include credentials in scripts or code

### Token Management

**Refresh Token:**
- Valid indefinitely (unless revoked)
- Rotate if compromised
- One token per Google account

**Developer Token:**
- One token per Google Ads account
- Can be reset in API Center if compromised
- Different token for each Google Ads account

### Revoking Access

If credentials are compromised:

1. **Revoke OAuth access:**
   - Go to [Google Account Permissions](https://myaccount.google.com/permissions)
   - Find "Google Ads API Client"
   - Click **Remove Access**

2. **Reset developer token:**
   - Google Ads → Tools → API Center
   - Click **Reset Token**

3. **Delete OAuth client:**
   - Google Cloud Console → Credentials
   - Delete the OAuth 2.0 Client ID

4. **Re-run this setup guide** to create new credentials

---

## Multiple Accounts Setup

### Managing Multiple Google Ads Accounts

**Scenario 1: Multiple accounts under one MCC**

Use one set of credentials with different customer IDs:

```yaml
# ~/google-ads.yaml
client_id: YOUR_CLIENT_ID
client_secret: YOUR_CLIENT_SECRET
refresh_token: YOUR_REFRESH_TOKEN
developer_token: YOUR_DEV_TOKEN
login_customer_id: YOUR_MCC_ID  # MCC that manages all accounts
```

Query different accounts:
```bash
# Account 1
node google-ads-query.js --customer-id=1111111111 ...

# Account 2
node google-ads-query.js --customer-id=2222222222 ...
```

---

**Scenario 2: Multiple unrelated Google Ads accounts**

Each account needs its own developer token:

1. Apply for developer token in each account
2. Create separate config files:
   - `~/google-ads-account1.yaml`
   - `~/google-ads-account2.yaml`
3. Modify scripts to use different config files

Or use one refresh token with multiple developer tokens:
```yaml
# For account 1 queries
developer_token: TOKEN_FROM_ACCOUNT_1

# For account 2 queries
developer_token: TOKEN_FROM_ACCOUNT_2
```

---

## API Limits & Quotas

### Rate Limits

**Google Ads API limits:**
- 15,000 operations per day (Test access)
- Unlimited operations per day (Standard access)
- Rate limited to prevent abuse

**Best practices:**
- Batch queries when possible
- Cache results locally
- Avoid unnecessary repeated queries

### Cost

**Google Ads API access:** FREE
- No cost for API usage
- Standard Google Ads spend/billing applies

**Google Cloud:** FREE (for API usage)
- Enabling APIs is free
- OAuth credentials are free
- No charges for API calls

---

## Maintenance

### Regular Tasks

**Monthly:**
- Verify API access is working
- Check for any credential expiration notices
- Review API Center for developer token status

**Quarterly:**
- Test backup credentials if you have them
- Review OAuth app permissions in Google Account
- Update scripts if API version changes

### Updating Credentials

**To rotate credentials:**
1. Generate new OAuth client in Google Cloud
2. Run authentication flow to get new refresh token
3. Update google-ads.yaml with new values
4. Test with simple query
5. Delete old OAuth client (optional)

---

## Additional Resources

### Official Documentation

- [Google Ads API Docs](https://developers.google.com/google-ads/api/docs/start)
- [google-ads-api Node.js Library](https://github.com/opteo/google-ads-api)
- [OAuth 2.0 Setup Guide](https://developers.google.com/google-ads/api/docs/oauth/overview)
- [Developer Token Guide](https://developers.google.com/google-ads/api/docs/get-started/dev-token)

### Support

**Google Ads API Forum:**
- [https://groups.google.com/g/adwords-api](https://groups.google.com/g/adwords-api)

**Issue Tracker:**
- [Google Ads API Issue Tracker](https://issuetracker.google.com/issues?q=componentid:187531)

---

## Checklist: Setup Complete

Verify you have:
- [x] Google Cloud project created
- [x] Google Ads API enabled
- [x] OAuth consent screen configured
- [x] OAuth client credentials created
- [x] Developer token obtained (Test or Standard)
- [x] Refresh token generated
- [x] google-ads.yaml file created at `~/`
- [x] File permissions set to 600
- [x] Test query completed successfully
- [x] Claude Code can access the API

**You're ready to use the Google Ads query and mutation tools!**

---

## Next Steps

Now that your API is set up:

1. **Configure accounts.json:** Add your Google Ads accounts to `.claude/accounts.json`
2. **Explore queries:** Browse `code/google-ads/queries/` folder
3. **Run your first analysis:** Try search term or campaign performance queries
4. **Read the user guide:** See `USER-GUIDE-ads-to-ai.md` for workflows

**Example first query:**
```bash
node google-ads-query.js \
  --customer-id=YOUR_ID \
  --query="$(cat queries/campaigns-performance.gaql)" \
  --days=30 \
  --output=data/campaigns.csv
```

Welcome to automated Google Ads management with Claude Code!
