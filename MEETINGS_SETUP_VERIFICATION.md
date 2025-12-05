# Meetings Setup Verification Guide

This guide helps you verify that all meetings are appearing correctly in the meetings section after enabling Google Calendar API.

## ✅ What's Been Improved

1. **Multi-Calendar Support**: Now fetches from ALL accessible calendars, not just primary
2. **Better Error Handling**: More detailed error messages and diagnostics
3. **Event Filtering**: Automatically filters out cancelled and declined events
4. **Wider Date Range**: Fetches events with buffer weeks for calendar grid display
5. **Test Endpoint**: Diagnostic endpoint to verify setup

## 🔍 Step 1: Verify Refresh Token Has Calendar Scope

**Critical**: Your refresh token must include the Calendar scope. If you haven't regenerated it yet:

```bash
node scripts/get-calendar-refresh-token.js
```

Follow the prompts to:
1. Visit the authorization URL
2. Grant permissions for both Google Ads AND Calendar
3. Copy the new refresh token
4. Update `GOOGLE_ADS_REFRESH_TOKEN` in your `.env.local`

## 🧪 Step 2: Test Calendar API Connection

Visit the test endpoint to verify everything is working:

```
http://localhost:3000/api/meetings/test
```

Or in production:
```
https://your-domain.com/api/meetings/test
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Google Calendar API is properly configured!",
  "diagnostics": [
    {
      "step": "Environment Variables",
      "status": "success",
      "message": "OAuth credentials found"
    },
    {
      "step": "List Calendars",
      "status": "success",
      "message": "Found X accessible calendar(s)",
      "data": [...]
    },
    {
      "step": "Fetch Events",
      "status": "success",
      "message": "Successfully fetched X meeting(s) for next 7 days",
      "data": {...}
    }
  ]
}
```

**If you see errors**, the diagnostics will tell you exactly what's wrong:
- Missing environment variables
- Invalid refresh token (needs Calendar scope)
- Calendar API not enabled
- Permission issues

## 📅 Step 3: Check Meetings Page

1. Navigate to `/meetings` in your app
2. Click "Refresh" button
3. Check the browser console (F12) for logs:
   - `✅ Fetched X meetings from Google Calendar API` = Success!
   - `⚠️ Google Calendar API failed` = Check error message

4. Check the Network tab:
   - Look for `/api/meetings` request
   - Check the response:
     - `source: "google_calendar"` = Using Calendar API ✅
     - `source: "email"` = Fallback to email parsing ⚠️
     - `warning` field will explain if there's an issue

## 🔧 Troubleshooting

### Issue: "No meetings found" but you have meetings in Google Calendar

**Check:**
1. Visit `/api/meetings/test` - does it show meetings?
2. Check date range - are your meetings within the visible month?
3. Check browser console for error messages
4. Verify meetings aren't cancelled or declined

### Issue: "Google Calendar authentication failed"

**Solutions:**
1. Regenerate refresh token with Calendar scope:
   ```bash
   node scripts/get-calendar-refresh-token.js
   ```
2. Verify OAuth consent screen includes Calendar scope
3. Check that Google Calendar API is enabled in Google Cloud Console

### Issue: Only seeing some meetings

**Possible causes:**
1. **Multiple calendars**: The system now fetches from ALL calendars. Check if meetings are in a different calendar
2. **Date range**: Meetings outside the visible month won't show
3. **Cancelled/Declined**: These are automatically filtered out
4. **All-day events**: These are included but may appear differently

### Issue: Still using email parsing instead of Calendar API

**Check:**
1. Look at the API response `source` field
2. Check server logs for error messages
3. Visit `/api/meetings/test` to see detailed diagnostics
4. Verify refresh token was regenerated with Calendar scope

## 📊 What Gets Fetched

The system now:
- ✅ Fetches from ALL accessible calendars (primary + shared calendars)
- ✅ Includes events from past 7 days to future 30+ days (with buffer)
- ✅ Filters out cancelled events
- ✅ Filters out events you've declined
- ✅ Handles all-day events correctly
- ✅ Removes duplicates across calendars
- ✅ Sorts by start time

## 🎯 Expected Behavior

**When Calendar API is working:**
- Meetings appear immediately on the calendar
- All calendars are included
- No dependency on email parsing
- Fast and reliable

**When Calendar API fails:**
- Automatically falls back to email parsing
- Shows warning message
- Still displays meetings from email invites
- Provides diagnostic URL in error message

## 📝 Next Steps

1. ✅ Enable Google Calendar API in Google Cloud Console
2. ✅ Add Calendar scope to OAuth consent screen
3. ✅ Regenerate refresh token with Calendar scope
4. ✅ Test using `/api/meetings/test`
5. ✅ Verify meetings appear on `/meetings` page

If you're still having issues after following these steps, check the server logs and the test endpoint diagnostics for specific error messages.

