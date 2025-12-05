---
name: sheets
description: Google Sheets operations and Apps Script utilities for working with spreadsheets, reading data, and Apps Script code. USE WHEN user asks to work with Google Sheets, spreadsheets, Apps Script code, read/write sheet data, or automate spreadsheet operations.
---

# Sheets Skill

## Bundled Apps Script

**Script:** `scripts/apps-script.js`

This is Google Apps Script code (not Node.js) - deploy to Google Apps Script Editor.

**Contains:**
- `doGet()` - Returns sheet data as JSON, auto-categorizes products by tier/script, converts amounts to AUD
- `doPost()` - Marks emails as GitHub invited with date stamp
- `categorizeProduct()` - Categorizes products (community/customer tier, script type)
- `convertToAUD()` - Currency conversion with configurable rates

**Deploy as Web App:**
1. Copy script to Apps Script Editor
2. Deploy > New deployment > Web app
3. Use the deployment URL for API calls

## Common Operations

### Google Sheets API (Node.js)

**Read sheet data:**
```javascript
const { google } = require('googleapis');
const sheets = google.sheets({ version: 'v4', auth });
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: 'SHEET_ID',
  range: 'Sheet1!A:Z'
});
```

**Write sheet data:**
```javascript
await sheets.spreadsheets.values.update({
  spreadsheetId: 'SHEET_ID',
  range: 'Sheet1!A1',
  valueInputOption: 'RAW',
  requestBody: { values: [[value1, value2]] }
});
```

**Append rows:**
```javascript
await sheets.spreadsheets.values.append({
  spreadsheetId: 'SHEET_ID',
  range: 'Sheet1!A:Z',
  valueInputOption: 'RAW',
  requestBody: { values: [[value1, value2]] }
});
```

## Configuration

**Credentials:** `~/google-oauth-credentials.json`
**Token:** `~/.sheets-token.json`
**Scopes:** `https://www.googleapis.com/auth/spreadsheets`

## Important Notes

- Use batch operations to reduce API calls
- Apps Script has 6-minute execution limit
- Sheets API has daily quota limits
