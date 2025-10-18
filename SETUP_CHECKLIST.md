# Google Ads MCP Setup Checklist

Follow these steps in order to get your Google Ads MCP server running.

## ☐ Step 1: Install pipx

Run this command [[memory:3888662]]:
```bash
brew install pipx
pipx ensurepath
```

Then restart your terminal or run:
```bash
source ~/.zshrc  # or ~/.bash_profile
```

## ☐ Step 2: Install Google Ads MCP Server

Run:
```bash
pipx install google-ads-mcp
```

## ☐ Step 3: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Ads API** for your project
4. Navigate to "APIs & Services" > "Credentials"
5. Create OAuth 2.0 credentials (Desktop application type)
6. Download the credentials or note the Client ID and Client Secret

## ☐ Step 4: Get Developer Token

1. Go to [Google Ads API Center](https://ads.google.com/aw/apicenter)
2. Sign in with your Google Ads manager account
3. Apply for API access
4. Note your Developer Token
5. If you have Basic access, consider applying for Standard access for production use

## ☐ Step 5: Configure Authentication

### Option A: Application Default Credentials (Recommended)

Run:
```bash
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/adwords
```

### Option B: Create google-ads.yaml

Create `~/.google-ads.yaml`:
```yaml
developer_token: YOUR_DEVELOPER_TOKEN
client_id: YOUR_CLIENT_ID
client_secret: YOUR_CLIENT_SECRET
refresh_token: YOUR_REFRESH_TOKEN
login_customer_id: YOUR_LOGIN_CUSTOMER_ID
```

To generate a refresh token, you can use the Google Ads API authentication guide.

## ☐ Step 6: Create Local .env File

Copy the example:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
GOOGLE_ADS_DEVELOPER_TOKEN=your_actual_token
GOOGLE_ADS_LOGIN_CUSTOMER_ID=1234567890
```

## ☐ Step 7: Configure MCP in Cursor

1. Open Cursor Settings
2. Navigate to MCP configuration
3. Add the configuration from `mcp-config-example.json`
4. Replace the placeholder values with your actual credentials:
   - `GOOGLE_ADS_DEVELOPER_TOKEN`
   - `GOOGLE_ADS_LOGIN_CUSTOMER_ID`

## ☐ Step 8: Test the Connection

Restart Cursor/Gemini and try these commands:
- "List all my Google Ads accounts"
- "Show me the campaigns for customer ID [your-customer-id]"

## Troubleshooting

### Error: "Developer token is not approved"
- Your token may be in test mode
- Apply for Standard access in the API Center

### Error: "Customer not found"
- Ensure customer ID is without hyphens
- Verify you have access to that customer account

### Error: "Authentication failed"
- Run `gcloud auth application-default login` again
- Verify your OAuth credentials are correct

### Error: "Command not found: uvx"
- Install uv: `brew install uv`
- Or use `pipx run google-ads-mcp` instead

## Quick Reference

- **Developer Token Location**: Google Ads > Tools & Settings > API Center
- **Customer ID Location**: Google Ads > Settings (top right corner)
- **Login Customer ID**: Usually your manager account ID (if you have one)
- **API Documentation**: https://developers.google.com/google-ads/api/docs/start

