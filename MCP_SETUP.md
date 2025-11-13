# Google Ads MCP Server Setup

## Configuration Complete ✅

The Google Ads MCP server has been configured for Claude Desktop.

### Files Created/Modified:

1. **Credentials File**: `/Users/chrisbeechey/BeechPPCAIAgent/google-ads-credentials.json`
   - Contains OAuth credentials (authorized_user type)
   - Includes: client_id, client_secret, refresh_token
   - Universe domain set to googleapis.com

2. **Claude Desktop Config**: `/Users/chrisbeechey/Library/Application Support/Claude/claude_desktop_config.json`
   - MCP server: `google-ads-mcp`
   - Running via: `pipx`
   - Environment variables configured

### Environment Variables Set:

```
GOOGLE_APPLICATION_CREDENTIALS=/Users/chrisbeechey/BeechPPCAIAgent/google-ads-credentials.json
GOOGLE_PROJECT_ID=966247195865
GOOGLE_CLOUD_PROJECT=966247195865
GOOGLE_ADS_DEVELOPER_TOKEN=gxL-KFFY47iC1RdV14W3Fg
GOOGLE_ADS_LOGIN_CUSTOMER_ID=6695445119
```

### Next Steps:

1. **Restart Claude Desktop** - The MCP server will be loaded when Claude Desktop starts
2. **Test the connection** - Try asking Claude to query your Google Ads data
3. **Verify access** - Make sure the MCP tools appear in Claude Desktop's tool list

### Testing Commands (in Claude Desktop after restart):

- "List my Google Ads campaigns"
- "Show me the performance of my ad groups"
- "Get keyword data for customer ID 6695445119"

### Troubleshooting:

If you encounter authentication errors:
- The refresh token may have expired - you may need to regenerate it
- Ensure the OAuth credentials have the Google Ads API scope: `https://www.googleapis.com/auth/adwords`
- Check that the customer ID 6695445119 is accessible with your credentials

### MCP Server Installation:

The server is installed via pipx and runs from:
`/Users/chrisbeechey/.local/bin/google-ads-mcp`

**Installation verified:** ✅ Server starts successfully with no errors

### Important Notes:

1. The configuration now uses the direct binary path instead of `pipx run --spec` to avoid temporary environment issues
2. Fresh installation completed on 2025-10-31 with all required resource files
3. Server tested and confirmed working with provided credentials
