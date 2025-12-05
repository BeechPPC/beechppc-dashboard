---
name: verify-sheet-access
description: Verifies Google Sheets Web App URLs are accessible and explores available data tabs. Use when Mike provides a Web App URL and needs to check what tabs/sheets are available, verify data structure, or inspect headers and sample data before building integrations.
allowed-tools: Bash, Read
---

# Verify Sheet Access

Verifies that a Google Sheets Web App URL is accessible and automatically discovers all available data tabs before doing any development work.

## When to Use This Skill

Use this skill when:
- Mike provides a Google Sheets Web App URL
- Need to verify Web App is accessible
- Want to discover what tabs/sheets exist
- Need to inspect data structure and headers
- Preparing to build an integration with Sheet data
- Testing after deploying a new Web App

## Required Setup

The Google Sheet must be deployed as a Web App with the Apps Script code that includes the `?tab=_sheets` endpoint.

**If the user's Web App doesn't have this code**, refer them to the `references/deploy-sheet.js` file in this skill directory with deployment instructions.

## Verification Process

### Step 1: Discover Available Tabs

Fetch the list of all available tabs using the `_sheets` endpoint:

```bash
curl -sL "WEB_APP_URL?tab=_sheets"
```

Expected response format:
```json
{
  "sheets": [
    {"name": "daily", "rows": 30, "columns": 12},
    {"name": "search_terms", "rows": 450, "columns": 15}
  ],
  "count": 2
}
```

**If this fails with "Sheet not found: _sheets":**
- The Web App needs to be updated with the code from `references/deploy-sheet.js`
- Tell the user to update their Apps Script and redeploy using the code from `references/deploy-sheet.js`
- Show the error message from the response

**If this returns HTML "Moved Temporarily":**
- You forgot the `-L` flag in curl
- Always use `curl -sL` to follow redirects

### Step 2: Display Available Tabs

Parse the JSON response and show a numbered list with metadata:

```
Found X tabs in the sheet:

1. daily (30 rows, 12 columns)
2. search_terms (450 rows, 15 columns)
3. quality (120 rows, 8 columns)
...
```

### Step 3: Ask Which Tabs to Inspect

**IMPORTANT: PAUSE HERE**

Play audio alert to notify the user:
```bash
afplay /System/Library/Sounds/Glass.aiff
```

Ask the user which tabs they want to inspect:
- **Tab names**: `"search_terms, quality"`
- **Tab numbers**: `"2, 3, 5"`
- **All tabs**: `"all"`
- **2025 tabs only**: `"tabs ending in 25"` or similar pattern

Wait for their response before proceeding.

### Step 4: Fetch and Display Tab Data

For each requested tab, fetch data and show first row:

```bash
curl -sL "WEB_APP_URL?tab=TABNAME" | jq '.[0]'
```

Display format:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tab: keyword80 (247 rows, 8 columns)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Headers:
- campaign
- adGroup
- keyword
- matchType

First row:
{
  "campaign": "Brand Campaign",
  "adGroup": "Brand Core",
  "keyword": "8020agent",
  "matchType": "EXACT"
}
```

**Handle errors gracefully:**
- `{"error": "Sheet not found: tabname"}` - Tab doesn't exist
- Invalid JSON - Show raw response
- Empty array - Note that tab is empty

### Step 5: Summary

Provide verification summary:

```
✅ Verification Complete

Successfully verified X tabs:
- ✅ daily (30 rows, 12 columns)
- ✅ search_terms (450 rows, 15 columns)

All tabs are accessible and contain data.
```

If any failed:
```
⚠️ Some tabs could not be accessed:
- ❌ quality - Sheet not found
```

Play audio alert:
```bash
afplay /System/Library/Sounds/Glass.aiff
```

## Important Notes

- This skill does NOT write any code
- This skill does NOT modify any files
- This is purely for verification and exploration
- Always use `curl -sL` to follow redirects
- Always use `jq '.[0]'` to show first row cleanly

## Troubleshooting

**"Sheet not found: _sheets"**
→ Web App needs updated Apps Script code (see `references/deploy-sheet.js`)

**HTML redirect response**
→ Use `curl -sL` not `curl -s`

**Authentication required**
→ Web App deployment not set to "Anyone"

**Empty response or timeout**
→ Web App URL incorrect or script has errors

## Apps Script Reference

The required Apps Script code is in `references/deploy-sheet.js`. Show the user this file when they need to deploy or update their Web App.
