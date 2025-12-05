# Google Calendar API Setup Guide

This guide explains how to set up Google Calendar API integration to show all meetings directly from your Google Calendar.

## Overview

The meetings system now supports two methods:
1. **Google Calendar API** (Preferred) - Direct access to all calendar events
2. **Email Parsing** (Fallback) - Extracts meetings from email calendar invites

The system will automatically try Google Calendar API first, and fall back to email parsing if the Calendar API is not configured or fails.

## Prerequisites

- Google Workspace account (or personal Google account)
- Existing Google OAuth credentials (same ones used for Google Ads API)
- Google Cloud Project with APIs enabled

## Step 1: Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services > Library**
4. Search for "Google Calendar API"
5. Click on "Google Calendar API"
6. Click **Enable**

## Step 2: Add Calendar Scope to OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Click **Edit App**
3. Scroll to **Scopes** section
4. Click **Add or Remove Scopes**
5. Search for and add:
   - `https://www.googleapis.com/auth/calendar.readonly` (Read-only access to calendars)
6. Click **Update**
7. Click **Save and Continue**

## Step 3: Regenerate Refresh Token with Calendar Scope

Since you're adding a new scope, you'll need to regenerate your refresh token to include Calendar access.

### Option A: Using Existing OAuth Credentials (Recommended)

If you already have OAuth credentials set up for Google Ads API, you can reuse them. You just need to regenerate the refresh token with the Calendar scope included.

1. Create a script to get a new refresh token:

```javascript
// get-calendar-refresh-token.js
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ADS_CLIENT_ID,
  process.env.GOOGLE_ADS_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

const scopes = [
  'https://www.googleapis.com/auth/adwords', // Keep existing Google Ads scope
  'https://www.googleapis.com/auth/calendar.readonly' // Add Calendar scope
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Success! Your new refresh token (with Calendar access):');
    console.log(tokens.refresh_token);
    console.log('\nUpdate your .env.local file:');
    console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}`);
  } catch (error) {
    console.error('Error getting refresh token:', error.message);
  }
  rl.close();
});
```

2. Run the script:
```bash
node get-calendar-refresh-token.js
```

3. Follow the prompts:
   - Visit the authorization URL
   - Grant permissions for both Google Ads and Calendar
   - Copy the code from the redirect page
   - Paste it into the script
   - Copy the new refresh token

4. Update your `.env.local`:
```env
GOOGLE_ADS_REFRESH_TOKEN=your_new_refresh_token_here
```

### Option B: Create New OAuth Client (If Needed)

If you don't have OAuth credentials yet:

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Desktop app** (or **Web application** if deploying)
4. Name it (e.g., "Beech PPC Calendar Client")
5. Click **Create**
6. Download the JSON file or copy Client ID and Secret
7. Add to `.env.local`:
```env
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
```

Then follow Option A to get the refresh token.

## Step 4: Verify Setup

1. Restart your development server:
```bash
npm run dev
```

2. Navigate to the Meetings page in your app
3. Click "Refresh" to fetch meetings
4. Check the browser console or server logs for:
   - `Fetched X meetings from Google Calendar` (success)
   - Or `Using email parsing as fallback` (if Calendar API failed)

## Troubleshooting

### Error: "Google Calendar authentication failed"

**Possible causes:**
1. Google Calendar API is not enabled
   - **Fix:** Enable it in Google Cloud Console (Step 1)

2. Calendar scope not added to OAuth consent screen
   - **Fix:** Add `calendar.readonly` scope (Step 2)

3. Refresh token doesn't have Calendar scope
   - **Fix:** Regenerate refresh token with Calendar scope (Step 3)

4. OAuth credentials incorrect
   - **Fix:** Verify `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, and `GOOGLE_ADS_REFRESH_TOKEN` in `.env.local`

### Error: "Calendar not found"

- The system uses your primary calendar by default
- If you need a different calendar, you can modify `lib/calendar/google-calendar.ts` to specify a different `calendarId`

### Meetings Not Showing

1. **Check API response:**
   - Look at browser Network tab → `/api/meetings` response
   - Check `source` field: should be `"google_calendar"` if working
   - If `source` is `"email"`, Calendar API is falling back to email parsing

2. **Check server logs:**
   - Look for error messages about Calendar API
   - Check if refresh token is being used correctly

3. **Verify calendar has events:**
   - Check your Google Calendar directly
   - Ensure events are within the date range you're viewing

## Environment Variables

Make sure these are set in your `.env.local`:

```env
# Google OAuth (shared with Google Ads API)
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_with_calendar_scope
```

## Benefits of Google Calendar API

✅ **Shows ALL meetings** - Not just those from email invites  
✅ **Real-time sync** - Direct access to your calendar  
✅ **More reliable** - No dependency on email parsing  
✅ **Better data** - Full calendar event details  
✅ **Works for all calendars** - Primary calendar, shared calendars, etc.

## Fallback Behavior

If Google Calendar API is not configured or fails, the system automatically falls back to email parsing. This ensures meetings are still shown even if Calendar API setup is incomplete.

