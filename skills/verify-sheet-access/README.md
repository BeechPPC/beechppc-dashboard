# Verify Sheet Access Skill

This skill automatically verifies Google Sheets Web App URLs and discovers available data tabs.

## What It Does

This skill helps you:
1. Verify a Web App URL is accessible
2. Automatically discover all available sheet tabs
3. Inspect data structure and headers
4. View sample data from specific tabs

## When Claude Uses This Skill

Claude will automatically activate this skill when you:
- Provide a Google Sheets Web App URL
- Ask to "check what's in this sheet"
- Want to verify a Web App is working
- Need to see what tabs are available
- Prepare to build an integration with Sheet data

## Files in This Skill

- **SKILL.md** - Main skill instructions for Claude
- **deploy-sheet.js** - Apps Script code for your Google Sheet
- **README.md** - This file (documentation)

## How to Deploy Your Sheet

Before this skill can work, your Google Sheet must be deployed as a Web App with the correct code.

### Quick Deploy Steps

1. Open your Google Sheet
2. Extensions > Apps Script
3. Paste code from `deploy-sheet.js`
4. Save (name it "Sheet API")
5. Deploy > New deployment > Web app
6. Set "Who has access" to "Anyone"
7. Deploy and copy the URL

See `deploy-sheet.js` for detailed deployment instructions.

## Example Usage

```
You: Can you verify this Web App URL?
https://script.google.com/macros/s/AKfycby.../exec

Claude: [Activates verify-sheet-access skill automatically]

Found 5 tabs in the sheet:
1. daily (30 rows, 12 columns)
2. search_terms (450 rows, 15 columns)
3. campaigns (120 rows, 18 columns)
4. products (500 rows, 8 columns)
5. quality (200 rows, 10 columns)

Which tabs would you like to inspect?
```

## Key Features

- **Automatic Discovery**: Uses `?tab=_sheets` endpoint to find all tabs
- **No Guessing**: Doesn't try to guess tab names
- **Clean Display**: Shows row and column counts for each tab
- **Sample Data**: Displays headers and first row for inspection
- **Error Handling**: Clear error messages with troubleshooting hints

## Web App Endpoints

After deploying with `deploy-sheet.js`, your Web App supports:

```bash
# List all sheets
curl -sL "YOUR_URL?tab=_sheets"

# Get data from specific sheet
curl -sL "YOUR_URL?tab=daily"
curl -sL "YOUR_URL?tab=search_terms"
```

## Troubleshooting

### "Sheet not found: _sheets"
Your Web App doesn't have the updated code. Deploy `deploy-sheet.js` to fix this.

### HTML redirect response
Use `curl -sL` (with `-L` flag) to follow redirects automatically.

### Authentication error
In deployment settings, set "Who has access" to "Anyone" and redeploy.

### No response or timeout
- Verify the Web App URL is correct
- Check Apps Script execution logs
- Ensure the sheet has data

## Skill Configuration

This skill uses:
- **allowed-tools**: Bash, Read
- **Invocation**: Model-invoked (automatic)
- **Description**: Optimized for Claude to discover when relevant

## Distribution

This skill is:
- Project-specific (`.claude/skills/`)
- Auto-available to anyone working on this project
- Can be packaged into a plugin for wider distribution

## Related

- **Commands**: `/verify-sheet-access` was the original slash command version
- **Agents**: Consider creating a dedicated agent for complex Sheet analysis
- **MCP**: Could integrate with a Google Sheets MCP server for write access
