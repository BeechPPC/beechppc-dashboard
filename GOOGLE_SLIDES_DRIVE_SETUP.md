# Google Slides & Drive Setup Guide

This guide explains how to add Google Slides and Drive scopes to your OAuth credentials for the Business Clarity Report tool.

## Overview

The Business Clarity Report tool generates professional presentations and saves them to Google Drive. This requires OAuth scopes for:

- **Google Slides API** (`presentations`) - To create slide presentations
- **Google Drive API** (`drive.file`) - To organize files in folders

## Current Situation

You're currently seeing an "insufficient authentication scopes" error because your existing OAuth refresh token was generated with only these scopes:

- `https://www.googleapis.com/auth/adwords` (Google Ads)
- `https://www.googleapis.com/auth/calendar.readonly` (Calendar)

## What You Need to Do

You need to generate a **new refresh token** that includes all the required scopes.

---

## Step 1: Enable Google APIs

First, make sure the required APIs are enabled in your Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services > Library**
4. Search for and enable:
   - **Google Slides API**
   - **Google Drive API**

---

## Step 2: Verify OAuth Client Configuration

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Check the **Application type**:
   - **Desktop app**: Redirect URI should be `urn:ietf:wg:oauth:2.0:oob`
   - **Web application**: Add redirect URI `http://localhost`

---

## Step 3: Generate New Refresh Token

Run the provided script to generate a new refresh token with all required scopes:

```bash
node scripts/get-slides-drive-refresh-token.js
```

### What the script does:

The script will generate an authorization URL with these scopes:
- ✓ Google Ads (`adwords`)
- ✓ Google Calendar (`calendar.readonly`)
- ✓ Google Slides (`presentations`) **← NEW**
- ✓ Google Drive (`drive.file`) **← NEW**

### Follow these steps:

1. **Copy the authorization URL** from the terminal
2. **Paste it into your browser** and press Enter
3. **Sign in** with your Google account
4. **Grant permissions** to all requested scopes
5. **Copy the authorization code** you receive
6. **Paste the code** back into the terminal

---

## Step 4: Update Your .env.local File

After the script completes, you'll receive a new refresh token. Update your `.env.local` file:

```bash
# Replace the old token with the new one
GOOGLE_ADS_REFRESH_TOKEN=your_new_refresh_token_here
```

**Important**: Make sure you replace the **entire** token value.

---

## Step 5: Restart Your Development Server

After updating `.env.local`, restart your development server:

```bash
npm run dev
```

---

## Step 6: Test the Business Clarity Report Tool

1. Navigate to **Tools > Business Clarity Report**
2. Enter a website URL (e.g., `https://example.com`)
3. Click **Generate Report**

The tool should now:
- ✓ Fetch website content
- ✓ Analyze with Claude AI
- ✓ Generate a PDF report
- ✓ Create a Google Slides presentation
- ✓ Save to Google Drive folder "Business Clarity Reports"

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution**: Your OAuth client redirect URI doesn't match the script configuration.

1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Check the **Application type**:
   - **Desktop app**: Make sure redirect URI is `urn:ietf:wg:oauth:2.0:oob`
   - **Web application**: Add redirect URI `http://localhost`
4. If using Web application, set this in `.env.local`:
   ```bash
   OAUTH_REDIRECT_URI=http://localhost
   ```
5. Run the script again

### Error: "No refresh token received"

**Solution**: You may need to revoke previous access first.

1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Find your app name (e.g., "Beech PPC AI Agent")
3. Click **Remove Access**
4. Run the script again

### Error: "invalid_grant"

**Solution**: The authorization code has expired.

- Authorization codes expire after a few minutes
- Simply run the script again and complete the process faster

### Still getting "insufficient authentication scopes"?

1. **Verify** you copied the **entire** new refresh token to `.env.local`
2. **Restart** your development server
3. **Check** the server logs for any OAuth errors
4. **Confirm** Google Slides API and Drive API are enabled in Google Cloud Console

---

## How It Works

### Google Drive Organization

When a Business Clarity Report is generated:

1. **Creates or finds** a folder named "Business Clarity Reports" in Google Drive
2. **Saves the presentation** to this folder
3. **Makes the file shareable** with a link (anyone with link can view)

### File Structure in Google Drive

```
📁 My Drive
  📁 Business Clarity Reports
    📄 Business Clarity Report - Company Name 1
    📄 Business Clarity Report - Company Name 2
    📄 Business Clarity Report - Company Name 3
```

### Permissions

Generated presentations have:
- **Owner**: Your Google account
- **Shareable link**: Anyone with the link can **view** (not edit)

---

## OAuth Scopes Reference

| Scope | Purpose | Permission Level |
|-------|---------|------------------|
| `adwords` | Access Google Ads data | Read/Write |
| `calendar.readonly` | View calendar events | Read-only |
| `presentations` | Create/edit Google Slides | Read/Write |
| `drive.file` | Manage files created by app | Read/Write (app-created files only) |

**Note**: The `drive.file` scope only grants access to files created by the application, not all files in your Google Drive.

---

## Security Notes

- Keep your `GOOGLE_ADS_REFRESH_TOKEN` secure and never commit it to version control
- The refresh token has the same access level as the scopes you granted
- You can revoke access at any time via [Google Account Permissions](https://myaccount.google.com/permissions)

---

## Need Help?

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Google Slides API and Drive API are enabled
4. Try generating a completely new OAuth client ID if problems persist

---

## Summary Checklist

- [ ] Google Slides API enabled in Google Cloud Console
- [ ] Google Drive API enabled in Google Cloud Console
- [ ] OAuth client redirect URI configured correctly
- [ ] Ran `node scripts/get-slides-drive-refresh-token.js`
- [ ] Updated `GOOGLE_ADS_REFRESH_TOKEN` in `.env.local`
- [ ] Restarted development server
- [ ] Tested Business Clarity Report generation
- [ ] Verified presentation appears in Google Drive

Once all items are checked, your Business Clarity Report tool should be fully functional!