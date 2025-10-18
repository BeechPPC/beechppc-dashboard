# Beech PPC AI Agent

An automated Google Ads MCC reporting system that delivers daily performance reports directly to your inbox.

## Features

- Daily automated MCC account reports at 11 AM Melbourne time
- Beautiful, mobile-responsive email templates with Beech PPC branding
- Comprehensive metrics tracking:
  - Cost
  - Conversions
  - Average CPC
  - Cost per Conversion
  - Impressions
- Day-over-day comparison with visual indicators
- Support for multiple accounts under your MCC

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Ads API access with a Developer Token
- Google Cloud Project with Google Ads API enabled
- SMTP email account (Gmail recommended)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Edit the `.env` file with your credentials:

```env
# Google Ads API Configuration
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_Ads_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_LOGIN_CUSTOMER_ID=your_mcc_customer_id

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_TO=recipient@example.com

# Schedule (11am Melbourne time by default)
REPORT_SCHEDULE=0 11 * * *
TIMEZONE=Australia/Melbourne
```

### 3. Set Up Gmail App Password (Recommended)

If using Gmail:
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to Security > 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Use this password in the `EMAIL_PASSWORD` field

### 4. Run the Agent

```bash
# Start the scheduled agent
npm start

# Test the report generation (sends immediately)
npm run test-report
```

## Project Structure

```
BeechPPCAIAgent/
├── src/
│   ├── index.js              # Main scheduler
│   ├── googleAdsClient.js    # Google Ads API integration
│   ├── emailTemplate.js      # HTML email template generator
│   ├── emailService.js       # Email sending functionality
│   └── generateReport.js     # Report generation logic
├── .env                      # Environment configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## How It Works

1. **Scheduler**: Runs daily at 11 AM Melbourne time using node-cron
2. **Data Collection**: Fetches all accounts from your MCC and retrieves metrics for yesterday and the previous day
3. **Report Generation**: Creates a beautiful HTML email with your data and day-over-day comparisons
4. **Email Delivery**: Sends the report to your configured email address

## Email Template Features

- Mobile-responsive design
- Beech PPC branded color scheme (yellow gradients)
- Clean, professional layout
- Visual indicators for metric changes (↑ green, ↓ red, → gray)
- Comprehensive account-level metrics
- Account count summary
- Timestamp and report date

## Running in Production

### Option 1: Keep Terminal Open
```bash
npm start
```

### Option 2: Use PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start the agent
pm2 start src/index.js --name beech-ppc-agent

# View logs
pm2 logs beech-ppc-agent

# Stop the agent
pm2 stop beech-ppc-agent

# Restart the agent
pm2 restart beech-ppc-agent

# Make it run on system startup
pm2 startup
pm2 save
```

### Option 3: Run as a System Service
Create a systemd service file (Linux) or launchd service (macOS).

## Testing

To test the report without waiting for the scheduled time:

```bash
npm run test-report
```

This will immediately generate and send a report with yesterday's data.

## Troubleshooting

### Google Ads API Issues

**Error: "Developer token is not approved"**
- Your token may be in test mode
- Apply for Standard access in the [API Center](https://ads.google.com/aw/apicenter)

**Error: "Customer not found"**
- Ensure customer ID is without hyphens (e.g., `6695445119` not `669-544-5119`)
- Verify you have access to that customer account

**Error: "Authentication failed"**
- Verify your OAuth credentials are correct
- Try regenerating your refresh token

### Email Issues

**Error: "Invalid login"**
- For Gmail, make sure you're using an App Password, not your regular password
- Verify 2-Step Verification is enabled

**Error: "Connection timeout"**
- Check your EMAIL_HOST and EMAIL_PORT settings
- Verify firewall settings allow SMTP connections

### No Data in Report

- Verify accounts have data for yesterday
- Check that accounts are enabled in Google Ads
- Ensure the MCC has access to the accounts

## Future Enhancements

Planned features:
- Weekly and monthly summary reports
- Performance alerts and anomaly detection
- Budget pacing notifications
- Campaign-level insights
- Custom metric thresholds
- Multiple report recipients
- Report customization options

## Resources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Node-Cron Documentation](https://github.com/node-cron/node-cron)

## Support

For issues or questions, please refer to the setup documentation or check the logs for detailed error messages.

