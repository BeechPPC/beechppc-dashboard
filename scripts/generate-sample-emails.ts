/**
 * Generate sample email HTML files for review
 * Run with: npx tsx scripts/generate-sample-emails.ts
 */

// @ts-nocheck
import { writeFileSync } from 'fs'
import { join } from 'path'
import { generateAlertEmail } from '../lib/alerts/email-template'
import { generateTemplateEmail } from '../lib/email/template-email'
import type { AlertTrigger } from '../lib/alerts/types'
import type { ReportTemplate } from '../lib/google-ads/report-templates'
import type { SearchTermData } from '../lib/google-ads/template-queries'

// Sample alert data
const sampleAlertTriggers: AlertTrigger[] = [
  {
    alertId: 'alert-1',
    alertName: 'High Cost Per Click Alert',
    accountId: '123-456-7890',
    accountName: 'Demo Account - Main Campaign',
    metricType: 'cpc',
    currentValue: 6.25,
    threshold: 5.0,
    condition: 'above',
    message: 'Cost per click has exceeded $5.00 threshold. Current CPC is $6.25.',
    triggeredAt: new Date().toISOString(),
  },
  {
    alertId: 'alert-2',
    alertName: 'Conversion Tracking Issue',
    accountId: '123-456-7890',
    accountName: 'Demo Account - Main Campaign',
    metricType: 'conversion_tracking',
    currentValue: 0,
    threshold: 30,
    condition: 'no_data_for_days',
    message: 'No conversions detected in the last 30 days for this conversion action.',
    triggeredAt: new Date().toISOString(),
    conversionActionName: 'Purchase Completion',
    daysSinceLastConversion: 45,
    lastConversionDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    alertId: 'alert-3',
    alertName: 'Ad Disapproval Detected',
    accountId: '987-654-3210',
    accountName: 'Demo Account - Secondary',
    metricType: 'ad_disapproval',
    currentValue: 1,
    threshold: 0,
    condition: 'has_disapproved_ads',
    message: 'Your ad has been disapproved and is not showing.',
    triggeredAt: new Date().toISOString(),
    campaignName: 'Brand Awareness Q1',
    adGroupName: 'Desktop Ads',
    adName: 'Responsive Search Ad #3',
    adId: '12345678',
    disapprovalReasons: [
      'Misleading content',
      'Claims not substantiated',
      'Review after policy violation',
    ],
  },
]

// Sample report template data
const sampleReportTemplate: ReportTemplate = {
  id: 'template-1',
  name: 'Top Performing Search Terms',
  description: 'Search terms with high impressions and CTR over the last 7 days',
  dateRange: 'LAST_7_DAYS',
  type: 'SEARCH_TERMS',
  metrics: ['impressions', 'clicks', 'cost', 'conversions', 'ctr'],
  filters: {
    minImpressions: 100,
    minClicks: 5,
  },
}

const sampleSearchTermData: SearchTermData[] = [
  {
    searchTerm: 'buy running shoes online',
    status: 'ENABLED',
    campaign: 'Footwear - Performance',
    adGroup: 'Running Shoes',
    impressions: 1250,
    clicks: 85,
    conversions: 12,
    ctr: 6.8,
    cost: 127.50,
  },
  {
    searchTerm: 'best trail running shoes',
    status: 'ENABLED',
    campaign: 'Footwear - Performance',
    adGroup: 'Trail Running',
    impressions: 980,
    clicks: 62,
    conversions: 9,
    ctr: 6.33,
    cost: 93.00,
  },
  {
    searchTerm: 'marathon training shoes',
    status: 'ENABLED',
    campaign: 'Footwear - Performance',
    adGroup: 'Running Shoes',
    impressions: 750,
    clicks: 48,
    conversions: 7,
    ctr: 6.4,
    cost: 72.00,
  },
  {
    searchTerm: 'lightweight running sneakers',
    status: 'ENABLED',
    campaign: 'Footwear - Performance',
    adGroup: 'Running Shoes',
    impressions: 680,
    clicks: 41,
    conversions: 5,
    ctr: 6.03,
    cost: 61.50,
  },
  {
    searchTerm: 'professional running gear',
    status: 'ENABLED',
    campaign: 'Footwear - Performance',
    adGroup: 'Performance Gear',
    impressions: 520,
    clicks: 34,
    conversions: 4,
    ctr: 6.54,
    cost: 51.00,
  },
]

function main() {
  console.log('Generating sample email HTML files...\n')

  // Generate alert email
  const alertHtml = generateAlertEmail(sampleAlertTriggers)

  // Generate report template email
  const reportHtml = generateTemplateEmail(
    sampleReportTemplate,
    {
      accountName: 'Demo Account - Main Campaign',
      currency: 'AUD',
      data: sampleSearchTermData,
    },
    new Date()
  )

  // Save files
  const outputDir = process.cwd()
  const alertPath = join(outputDir, 'sample-alert-email.html')
  const reportPath = join(outputDir, 'sample-report-email.html')

  writeFileSync(alertPath, alertHtml)
  writeFileSync(reportPath, reportHtml)

  console.log('✓ Sample emails generated successfully!\n')
  console.log('Files created:')
  console.log(`  1. ${alertPath}`)
  console.log(`  2. ${reportPath}`)
  console.log('\nOpen these files in your browser to review the email templates.')
  console.log('You can also resize your browser window to test mobile responsiveness.')
}

main()
