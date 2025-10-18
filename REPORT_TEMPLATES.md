# Report Templates Guide

This guide explains how to use the pre-made report templates to generate and send custom Google Ads reports.

## Available Report Templates

### 1. Search Terms with Zero Conversions (Last 14 Days)
**Template ID:** `zero-conversion-search-terms`

Identifies search terms that received clicks but generated no conversions in the last 14 days. This report helps you identify wasted spend on search terms that aren't converting.

**Metrics Included:**
- Search Term
- Campaign
- Ad Group
- Impressions
- Clicks
- CTR (Click-Through Rate)
- Cost

**Use Case:** Use this report to find search terms to add as negative keywords, saving budget for better-performing terms.

---

### 2. Best Performing Ads by CTR (Last 14 Days)
**Template ID:** `best-performing-ads-ctr`

Shows the top 20 ads ranked by click-through rate over the last 14 days. Only includes ads with at least 100 impressions for statistical significance.

**Metrics Included:**
- Ad Name
- Campaign
- Impressions
- Clicks
- CTR (highlighted)
- Conversions
- Cost

**Use Case:** Identify your best-performing ad copy to inform future creative development and pause underperforming ads.

---

### 3. Best Performing Keywords by Conversions (Last 14 Days)
**Template ID:** `best-performing-keywords-conversion`

Displays the top 20 keywords ranked by total conversions over the last 14 days. Only shows keywords that have generated at least 1 conversion.

**Metrics Included:**
- Keyword
- Match Type
- Campaign
- Impressions
- Clicks
- Conversions (highlighted)
- CTR
- Cost per Conversion

**Use Case:** Identify your most valuable keywords to increase bids, expand match types, or create dedicated campaigns around them.

---

## How to Use Report Templates

### Interactive CLI Method (Recommended)

Run the interactive report sender:

```bash
npm run send-report
```

This will guide you through:
1. **Select Account** - Choose a specific account or all accounts
2. **Select Report Template** - Choose from the available templates
3. **Review & Confirm** - Review your selections and confirm
4. **Send Report** - The report will be generated and sent via email

### Command Line Method

You can also run reports directly from the command line:

```bash
# Send a template report for all accounts
node src/generateTemplateReport.js <template-id>

# Send a template report for a specific account
node src/generateTemplateReport.js <template-id> <customer-id>
```

**Examples:**

```bash
# Zero conversion search terms for all accounts
node src/generateTemplateReport.js zero-conversion-search-terms

# Best performing ads for a specific account
node src/generateTemplateReport.js best-performing-ads-ctr 1234567890

# Best performing keywords for all accounts
node src/generateTemplateReport.js best-performing-keywords-conversion
```

---

## Programmatic Usage

You can also use the templates programmatically in your own scripts:

```javascript
import { generateTemplateReport } from './src/generateTemplateReport.js';

// Generate and send a report for all accounts
const result = await generateTemplateReport('zero-conversion-search-terms');

// Generate and send a report for a specific account
const result = await generateTemplateReport('best-performing-ads-ctr', '1234567890');

// Generate report without sending email (for testing)
const result = await generateTemplateReport('best-performing-keywords-conversion', null, false);
```

---

## Scheduling Reports

You can schedule template reports using the existing cron scheduler. Edit `src/index.js` to add template-based scheduled reports:

```javascript
import { generateTemplateReport } from './generateTemplateReport.js';

// Schedule weekly zero conversion search terms report (every Monday at 9 AM)
cron.schedule('0 9 * * 1', async () => {
  console.log('Running weekly zero conversion search terms report...');
  await generateTemplateReport('zero-conversion-search-terms');
});

// Schedule bi-weekly best performing keywords report (1st and 15th of month at 10 AM)
cron.schedule('0 10 1,15 * *', async () => {
  console.log('Running bi-weekly best performing keywords report...');
  await generateTemplateReport('best-performing-keywords-conversion');
});
```

---

## Creating Custom Templates

To create your own custom report templates:

1. **Define the template** in `src/reportTemplates.js`:

```javascript
CUSTOM_REPORT: {
  id: 'custom-report-id',
  name: 'Your Custom Report Name',
  description: 'Description of what this report shows',
  dateRange: 'LAST_30_DAYS', // or LAST_7_DAYS, YESTERDAY, etc.
  type: 'KEYWORDS', // or SEARCH_TERMS, ADS, etc.
  metrics: ['impressions', 'clicks', 'cost', 'conversions'],
  sorting: {
    metric: 'conversions',
    order: 'DESC',
  },
  filters: {
    minConversions: 1,
  },
  limit: 20,
}
```

2. **Create the query function** in `src/templateReportQueries.js`:

```javascript
export async function getCustomReportData(customerId, dateRange, limit) {
  // Your custom Google Ads query here
}
```

3. **Add to executeTemplateQuery** switch statement in `src/templateReportQueries.js`

4. **Create email template** in `src/templateEmailGenerator.js` if needed

---

## Report Output

All reports are sent via email to the address configured in your `.env` file (`EMAIL_TO`).

Each email includes:
- **Header** with Beech PPC branding
- **Account information** and date
- **Report description**
- **Data table** with relevant metrics
- **Mobile-responsive design** for viewing on any device

---

## Troubleshooting

### No data returned
- Check that your account has data for the specified date range
- Verify filters aren't too restrictive (e.g., minImpressions, minConversions)
- Ensure the account is ENABLED in Google Ads

### Email not sending
- Verify email configuration in `.env` file
- Run `npm test-report` to test basic email functionality
- Check email service logs for detailed error messages

### Template not found
- Ensure you're using the correct template ID (see Available Report Templates above)
- Template IDs are case-sensitive and must match exactly

---

## Support

For issues or questions:
1. Check the main `README.md` for general setup
2. Review `QUICKSTART.md` for Google Ads API configuration
3. Verify your `.env` file has all required variables set correctly
