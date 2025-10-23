# GitHub Actions Setup for Daily Reports

This guide explains how to set up GitHub Actions to send daily reports at 11 AM Melbourne time.

## 🔧 Required Setup

### 1. GitHub Secrets Configuration

You need to add the following secrets to your GitHub repository:

1. **Go to your GitHub repository**
2. **Click "Settings" → "Secrets and variables" → "Actions"**
3. **Click "New repository secret"**

Add these two secrets:

#### `VERCEL_URL`
- **Name**: `VERCEL_URL`
- **Value**: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- **Example**: `https://beechppc-dashboard.vercel.app`

#### `EMAIL_TO`
- **Name**: `EMAIL_TO`
- **Value**: Recipient email address
- **Example**: `chris@beechppc.com`

### 2. Verify GitHub Actions is Enabled

1. Go to the "Actions" tab in your GitHub repository
2. If you see a message about enabling workflows, click "I understand my workflows, go ahead and enable them"

### 3. Test the Workflow

1. Go to "Actions" tab
2. Click on "Send Daily Google Ads Report" workflow
3. Click "Run workflow" → "Run workflow"
4. Wait for completion and check your email

## 🕐 Schedule Details

The workflow is configured to run at **11:00 AM Melbourne time** daily:

- **Cron Schedule**: `0 1 * * *` (1:00 AM UTC)
- **Melbourne Time**: 11:00 AM AEST (Australian Eastern Standard Time)
- **Timezone**: Australia/Melbourne (handles AEST/AEDT automatically)

## 🧪 Testing Locally

You can test the API endpoint locally using the provided test script:

```bash
# Set your environment variables
export VERCEL_URL="https://your-app.vercel.app"
export EMAIL_TO="chris@beechppc.com"

# Run the test
node test-report.js
```

## 🔍 Troubleshooting

### Common Issues:

1. **"No host part in the URL" error**
   - ✅ **Fixed**: Added proper URL validation in the workflow
   - **Solution**: Ensure `VERCEL_URL` secret is set correctly

2. **"Recipients are required" error**
   - ✅ **Fixed**: Added email validation
   - **Solution**: Ensure `EMAIL_TO` secret is set correctly

3. **Workflow not running**
   - Check that GitHub Actions is enabled
   - Verify the cron schedule is correct
   - Check the Actions tab for any error messages

4. **API endpoint not responding**
   - Verify your Vercel deployment is running
   - Check that the URL is accessible
   - Test the endpoint manually

### Debug Steps:

1. **Check Secrets**:
   ```bash
   # In GitHub Actions logs, you should see:
   ✅ All secrets are configured
   Vercel URL: https://your-app.vercel.app
   Email to: chris@beechppc.com
   ```

2. **Check API Response**:
   ```bash
   # You should see:
   HTTP Status: 200
   Response: {"success":true,"messageId":"...","accountCount":X,"recipients":["..."]}
   ```

3. **Check Email**:
   - Look for emails with subject "Daily MCC Report - [date]"
   - Check spam folder if not received

## 📊 Workflow Features

The updated workflow includes:

- ✅ **Secret validation** before making API calls
- ✅ **Proper error handling** with detailed error messages
- ✅ **Melbourne timezone awareness** with time logging
- ✅ **HTTP status code checking** for API responses
- ✅ **Detailed logging** for debugging
- ✅ **Manual trigger support** for testing

## 🚀 Next Steps

1. **Set up the secrets** as described above
2. **Test the workflow** manually from the Actions tab
3. **Verify email delivery** at the scheduled time
4. **Monitor the logs** for any issues

The workflow will now run automatically at 11 AM Melbourne time every day and send your daily Google Ads reports!
