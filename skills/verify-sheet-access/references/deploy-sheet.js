/**
 * Google Apps Script for Sheet Web App Deployment
 *
 * This script turns any Google Sheet into a JSON API that can be queried
 * by external tools. It includes a special endpoint to list all available sheets.
 *
 * HOW TO DEPLOY:
 *
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire file
 * 5. Save the project (name it anything, e.g., "Sheet API")
 * 6. Click Deploy > New deployment
 * 7. Click the gear icon next to "Select type" and choose "Web app"
 * 8. Configure deployment:
 *    - Description: "Sheet API v1" (or anything)
 *    - Execute as: Me (your email)
 *    - Who has access: Anyone
 * 9. Click "Deploy"
 * 10. Authorize the script when prompted
 * 11. Copy the Web App URL - it will look like:
 *     https://script.google.com/macros/s/AKfycby.../exec
 *
 * USAGE:
 *
 * List all sheets:
 *   https://your-web-app-url?tab=_sheets
 *
 * Get data from a specific sheet:
 *   https://your-web-app-url?tab=daily
 *   https://your-web-app-url?tab=search_terms
 *
 * UPDATING:
 *
 * If you need to update this code:
 * 1. Make changes in the Apps Script editor
 * 2. Save the file
 * 3. Go to Deploy > Manage deployments
 * 4. Click the pencil icon to edit the deployment
 * 5. Change version to "New version"
 * 6. Click "Deploy"
 * 7. The Web App URL stays the same
 *
 * @OnlyCurrentDoc - This limits the script to only access the current spreadsheet
 */

/**
 * Responds to HTTP GET requests to serve spreadsheet data as JSON.
 *
 * @param {GoogleAppsScript.Events.AppsScriptHttpRequestEvent} e The event parameter containing URL parameters
 * @return {GoogleAppsScript.Content.TextOutput} JSON response
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabName = e.parameter.tab || 'daily'; // Default to 'daily' if no tab specified

  // Special endpoint: Return list of all sheet names with metadata
  if (tabName === '_sheets') {
    var sheets = ss.getSheets();
    var sheetNames = sheets.map(function(sheet) {
      return {
        name: sheet.getName(),
        rows: sheet.getLastRow(),
        columns: sheet.getLastColumn()
      };
    });

    return ContentService.createTextOutput(JSON.stringify({
      sheets: sheetNames,
      count: sheetNames.length
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }

  // Get the sheet by name
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Sheet not found: ' + tabName,
      hint: 'Use ?tab=_sheets to see available sheets'
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }

  // Get all data from the sheet
  var data = sheet.getDataRange().getValues();

  // First row is headers
  var headers = data.shift();

  // Convert rows to objects with header keys
  var jsonData = data.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      obj[header] = row[index];
    });
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * TESTING:
 *
 * Before deploying, you can test this script:
 * 1. Click the "Run" button and select "doGet"
 * 2. This won't work perfectly (needs e parameter) but will check for syntax errors
 *
 * After deploying, test with curl:
 *   curl -sL "YOUR_WEB_APP_URL?tab=_sheets"
 *
 * COMMON ISSUES:
 *
 * "Authorization required" error:
 * - Make sure "Who has access" is set to "Anyone" in deployment settings
 * - You may need to redeploy after changing this
 *
 * "Sheet not found: _sheets" error:
 * - This is actually good! It means the old code is running
 * - Deploy this new code to fix it
 *
 * Empty or no response:
 * - Check the Apps Script execution logs (View > Executions)
 * - Make sure sheet has data
 * - Verify the Web App URL is correct
 *
 * "Moved Temporarily" HTML response:
 * - This is normal - the URL redirects
 * - Use curl -sL (with -L flag) to follow redirects
 */
