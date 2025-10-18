# Quick Start Guide - Beech PPC AI Agent

## Step 1: Configure Email Settings

Edit the `.env` file and update the email configuration:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_TO=recipient@example.com
```

### Setting up Gmail App Password:

1. Go to https://myaccount.google.com/
2. Click on "Security" in the left menu
3. Ensure "2-Step Verification" is turned ON
4. Scroll down to "App passwords"
5. Click "App passwords"
6. Select "Mail" for the app and "Mac" (or your device) for the device
7. Click "Generate"
8. Copy the 16-character password (without spaces)
9. Paste it into the `EMAIL_PASSWORD` field in `.env`

## Step 2: Test the Configuration

Run the test command to generate and send a report immediately:

```bash
npm run test-report
```

This will:
- Fetch all accounts from your MCC
- Retrieve yesterday's performance data
- Generate a beautiful HTML email
- Send it to the configured email address

## Step 3: Start the Scheduled Agent

Once the test is successful, start the agent:

```bash
npm start
```

The agent will:
- Run in the foreground
- Schedule daily reports at 11:00 AM Melbourne time
- Display status messages and next scheduled run time

## Step 4: Run in Background (Optional)

### Option A: Using PM2 (Recommended for production)

```bash
# Install PM2 globally
npm install -g pm2

# Start the agent
pm2 start src/index.js --name beech-ppc-agent

# View logs
pm2 logs beech-ppc-agent

# Save the process list (survives reboots)
pm2 save
pm2 startup
```

### Option B: Using nohup

```bash
nohup npm start > logs/beech-ppc-agent.log 2>&1 &
```

## Troubleshooting

### Email Not Sending?

1. **Check Gmail App Password**: Make sure you're using an app-specific password, not your regular Gmail password
2. **Verify 2-Step Verification**: Must be enabled in your Google Account
3. **Check .env file**: Ensure EMAIL_USER, EMAIL_PASSWORD, and EMAIL_TO are all filled in correctly
4. **Test with another email**: Try using a different SMTP provider temporarily to isolate the issue

### No Google Ads Data?

1. **Verify API credentials**: Check that your Google Ads API credentials in `.env` are correct
2. **Check account access**: Ensure your MCC account has access to child accounts
3. **Verify accounts are enabled**: Check that accounts are active in Google Ads
4. **Check API access level**: Basic access may have limitations; Standard access is recommended

### Still Having Issues?

Run the test command with verbose logging:

```bash
NODE_ENV=development npm run test-report
```

Check the console output for detailed error messages.

## What's Next?

Once your daily reports are working:

1. Monitor the logs to ensure reports are being generated daily
2. Check your inbox at 11 AM Melbourne time for the reports
3. Customize the metrics or scheduling if needed
4. Explore additional features (coming soon):
   - Weekly/monthly summaries
   - Performance alerts
   - Budget pacing notifications
   - Campaign-level insights

## Need Help?

Check the main README.md for detailed documentation and troubleshooting tips.
