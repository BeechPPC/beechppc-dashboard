/**
 * Generate and send a SAMPLE monthly report for Spacegenie for October
 * This uses mock data to demonstrate the report format
 * Run with: npx tsx scripts/generate-sample-spacegenie-report.ts [--send]
 */

// @ts-nocheck
import { writeFileSync } from 'fs'
import { join } from 'path'
import { sendEmail } from '../lib/email/service'
import { generateMonthlyReportTemplate, type MonthlyReportData } from '../lib/email/monthly-template'
import type { CampaignPerformance, KeywordPerformance } from '../lib/google-ads/client'

// Sample campaign data for Spacegenie - October 2024
const sampleCampaigns: CampaignPerformance[] = [
  {
    id: '1',
    name: 'Self Storage - Brand',
    status: 'ENABLED',
    budget: 500,
    budgetType: 'DAILY',
    cost: 3245.67,
    conversions: 87,
    clicks: 1245,
    impressions: 45678,
    ctr: 2.73,
    avgCpc: 2.61,
    costPerConversion: 37.31,
    conversionRate: 6.99,
  },
  {
    id: '2',
    name: 'Self Storage - Generic',
    status: 'ENABLED',
    budget: 300,
    budgetType: 'DAILY',
    cost: 2876.45,
    conversions: 52,
    clicks: 987,
    impressions: 38452,
    ctr: 2.57,
    avgCpc: 2.91,
    costPerConversion: 55.32,
    conversionRate: 5.27,
  },
  {
    id: '3',
    name: 'Storage Units - Near Me',
    status: 'ENABLED',
    budget: 200,
    budgetType: 'DAILY',
    cost: 1987.23,
    conversions: 34,
    clicks: 756,
    impressions: 28934,
    ctr: 2.61,
    avgCpc: 2.63,
    costPerConversion: 58.45,
    conversionRate: 4.50,
  },
  {
    id: '4',
    name: 'Vehicle Storage',
    status: 'ENABLED',
    budget: 150,
    budgetType: 'DAILY',
    cost: 1432.89,
    conversions: 23,
    clicks: 534,
    impressions: 19876,
    ctr: 2.69,
    avgCpc: 2.68,
    costPerConversion: 62.30,
    conversionRate: 4.31,
  },
  {
    id: '5',
    name: 'Business Storage Solutions',
    status: 'ENABLED',
    budget: 100,
    budgetType: 'DAILY',
    cost: 876.54,
    conversions: 15,
    clicks: 312,
    impressions: 12456,
    ctr: 2.50,
    avgCpc: 2.81,
    costPerConversion: 58.44,
    conversionRate: 4.81,
  },
  {
    id: '6',
    name: 'Moving & Storage - Old',
    status: 'PAUSED',
    budget: 50,
    budgetType: 'DAILY',
    cost: 234.12,
    conversions: 3,
    clicks: 98,
    impressions: 4532,
    ctr: 2.16,
    avgCpc: 2.39,
    costPerConversion: 78.04,
    conversionRate: 3.06,
  },
]

// Sample top performing keywords
const sampleTopKeywords: KeywordPerformance[] = [
  {
    keyword: 'spacegenie',
    matchType: 'EXACT',
    campaign: 'Self Storage - Brand',
    adGroup: 'Brand Core',
    cost: 456.78,
    conversions: 34,
    clicks: 234,
    impressions: 3456,
    ctr: 6.77,
    avgCpc: 1.95,
    costPerConversion: 13.43,
    qualityScore: 9,
  },
  {
    keyword: 'self storage near me',
    matchType: 'PHRASE',
    campaign: 'Storage Units - Near Me',
    adGroup: 'Near Me - High Intent',
    cost: 789.23,
    conversions: 28,
    clicks: 312,
    impressions: 8934,
    ctr: 3.49,
    avgCpc: 2.53,
    costPerConversion: 28.19,
    qualityScore: 8,
  },
  {
    keyword: 'cheap storage units',
    matchType: 'PHRASE',
    campaign: 'Self Storage - Generic',
    adGroup: 'Price Focused',
    cost: 567.89,
    conversions: 22,
    clicks: 287,
    impressions: 9876,
    ctr: 2.91,
    avgCpc: 1.98,
    costPerConversion: 25.81,
    qualityScore: 7,
  },
  {
    keyword: 'storage facility',
    matchType: 'PHRASE',
    campaign: 'Self Storage - Generic',
    adGroup: 'Generic Terms',
    cost: 432.56,
    conversions: 18,
    clicks: 198,
    impressions: 7234,
    ctr: 2.74,
    avgCpc: 2.18,
    costPerConversion: 24.03,
    qualityScore: 8,
  },
  {
    keyword: 'vehicle storage',
    matchType: 'EXACT',
    campaign: 'Vehicle Storage',
    adGroup: 'Vehicle Core',
    cost: 345.67,
    conversions: 14,
    clicks: 156,
    impressions: 5678,
    ctr: 2.75,
    avgCpc: 2.22,
    costPerConversion: 24.69,
    qualityScore: 8,
  },
  {
    keyword: 'climate controlled storage',
    matchType: 'PHRASE',
    campaign: 'Self Storage - Generic',
    adGroup: 'Premium Features',
    cost: 298.45,
    conversions: 12,
    clicks: 134,
    impressions: 4987,
    ctr: 2.69,
    avgCpc: 2.23,
    costPerConversion: 24.87,
    qualityScore: 7,
  },
  {
    keyword: 'boat storage',
    matchType: 'EXACT',
    campaign: 'Vehicle Storage',
    adGroup: 'Boat Specific',
    cost: 234.12,
    conversions: 9,
    clicks: 98,
    impressions: 3456,
    ctr: 2.84,
    avgCpc: 2.39,
    costPerConversion: 26.01,
    qualityScore: 7,
  },
  {
    keyword: 'rv storage near me',
    matchType: 'PHRASE',
    campaign: 'Vehicle Storage',
    adGroup: 'RV Storage',
    cost: 198.76,
    conversions: 8,
    clicks: 89,
    impressions: 3123,
    ctr: 2.85,
    avgCpc: 2.23,
    costPerConversion: 24.85,
    qualityScore: 8,
  },
  {
    keyword: 'storage units for rent',
    matchType: 'PHRASE',
    campaign: 'Self Storage - Generic',
    adGroup: 'Rental Terms',
    cost: 276.34,
    conversions: 11,
    clicks: 123,
    impressions: 4532,
    ctr: 2.71,
    avgCpc: 2.25,
    costPerConversion: 25.12,
    qualityScore: 7,
  },
  {
    keyword: 'secure storage',
    matchType: 'PHRASE',
    campaign: 'Self Storage - Generic',
    adGroup: 'Security Focused',
    cost: 187.92,
    conversions: 7,
    clicks: 87,
    impressions: 3214,
    ctr: 2.71,
    avgCpc: 2.16,
    costPerConversion: 26.85,
    qualityScore: 8,
  },
]

// Sample poor performing keywords (high spend, zero conversions)
const samplePoorKeywords: KeywordPerformance[] = [
  {
    keyword: 'storage',
    matchType: 'BROAD',
    campaign: 'Self Storage - Generic',
    adGroup: 'Broad Terms',
    cost: 234.56,
    conversions: 0,
    clicks: 145,
    impressions: 8934,
    ctr: 1.62,
    avgCpc: 1.62,
    costPerConversion: 0,
    qualityScore: 4,
  },
  {
    keyword: 'cheap storage',
    matchType: 'BROAD',
    campaign: 'Self Storage - Generic',
    adGroup: 'Price Focused',
    cost: 187.34,
    conversions: 0,
    clicks: 98,
    impressions: 5432,
    ctr: 1.80,
    avgCpc: 1.91,
    costPerConversion: 0,
    qualityScore: 5,
  },
  {
    keyword: 'mini storage',
    matchType: 'BROAD',
    campaign: 'Self Storage - Generic',
    adGroup: 'Generic Terms',
    cost: 156.78,
    conversions: 0,
    clicks: 87,
    impressions: 4321,
    ctr: 2.01,
    avgCpc: 1.80,
    costPerConversion: 0,
    qualityScore: 5,
  },
  {
    keyword: 'self storage facilities',
    matchType: 'BROAD',
    campaign: 'Self Storage - Generic',
    adGroup: 'Generic Terms',
    cost: 123.45,
    conversions: 0,
    clicks: 67,
    impressions: 3456,
    ctr: 1.94,
    avgCpc: 1.84,
    costPerConversion: 0,
    qualityScore: 4,
  },
  {
    keyword: 'storage solutions',
    matchType: 'BROAD',
    campaign: 'Business Storage Solutions',
    adGroup: 'Business Generic',
    cost: 98.76,
    conversions: 0,
    clicks: 54,
    impressions: 2987,
    ctr: 1.81,
    avgCpc: 1.83,
    costPerConversion: 0,
    qualityScore: 4,
  },
]

async function main() {
  const shouldSend = process.argv.includes('--send')

  console.log('Generating sample monthly report for Spacegenie (October 2024)...\n')

  // Calculate summary metrics
  const totalSpend = sampleCampaigns.reduce((sum, c) => sum + c.cost, 0)
  const totalConversions = sampleCampaigns.reduce((sum, c) => sum + c.conversions, 0)
  const totalClicks = sampleCampaigns.reduce((sum, c) => sum + c.clicks, 0)
  const totalImpressions = sampleCampaigns.reduce((sum, c) => sum + c.impressions, 0)
  const avgCtr = (totalClicks / totalImpressions) * 100
  const avgCpc = totalSpend / totalClicks
  const costPerConversion = totalSpend / totalConversions
  const conversionRate = (totalConversions / totalClicks) * 100

  // Prepare report data
  const reportData: MonthlyReportData = {
    accountName: 'Spacegenie',
    accountId: '123-456-7890',
    currency: 'AUD',
    month: 'October 2024',
    summary: {
      totalSpend,
      totalConversions,
      totalClicks,
      totalImpressions,
      avgCtr,
      avgCpc,
      costPerConversion,
      conversionRate,
    },
    campaigns: sampleCampaigns,
    topKeywords: sampleTopKeywords,
    poorPerformingKeywords: samplePoorKeywords,
    insights: {
      whatWorking: [
        'Brand campaign "Self Storage - Brand" is delivering the highest ROI with 87 conversions at $37.31 per conversion',
        'Top keyword "spacegenie" (exact match) has an excellent Quality Score of 9 and is converting at just $13.43 per conversion',
        '8 keywords have Quality Scores of 7 or higher, keeping costs competitive',
        'Overall conversion rate of 5.65% indicates strong ad relevance and landing page performance',
        'Near-me searches are performing well with strong intent and conversion rates above 4.5%',
      ],
      poorPerforming: [
        '5 keywords have spent $801.89 with zero conversions - primarily broad match terms attracting low-intent traffic',
        'Broad match keywords showing Quality Scores below 5, indicating poor relevance and higher costs',
        'Campaign "Moving & Storage - Old" is paused but still shows in historical data - consider archiving if no longer needed',
        'Vehicle storage campaigns have higher cost per conversion ($60+) compared to brand and generic storage campaigns',
      ],
      recommendations: [
        'Add negative keywords for broad match terms that are not converting to prevent wasted spend on irrelevant searches',
        'Increase budget allocation to brand campaign which has the lowest cost per conversion at $37.31',
        'Convert top performing broad match keywords to phrase and exact match for better control and lower CPCs',
        'Review auction insights for "Self Storage - Generic" campaign to identify opportunities to increase impression share against competitors',
        'Test audience targeting (in-market audiences for "Moving Services" and "Home Improvement") to refine targeting and improve conversion rates',
        'Consider implementing remarketing campaigns to re-engage users who visited but didn\'t convert',
        'Review landing pages for vehicle storage campaigns to improve conversion rates and reduce cost per conversion',
      ],
    },
  }

  // Generate HTML
  console.log('Generating monthly report HTML...\n')
  const emailHtml = generateMonthlyReportTemplate(reportData)

  // Save to file for preview
  const outputPath = join(process.cwd(), 'spacegenie-october-report.html')
  writeFileSync(outputPath, emailHtml)
  console.log(`✓ Sample monthly report saved to: ${outputPath}\n`)

  if (shouldSend) {
    try {
      const recipient = 'chris@beechppc.com'
      console.log(`Sending monthly report to: ${recipient}...`)

      const result = await sendEmail({
        to: recipient,
        subject: 'Monthly Report - Spacegenie - October 2024',
        html: emailHtml,
      })

      console.log(`✓ Monthly report sent successfully! (Message ID: ${result.messageId})\n`)
    } catch (error) {
      console.error('Error sending email:', error)
      console.error('\nMake sure your .env file has these email settings configured:')
      console.error('  - EMAIL_HOST')
      console.error('  - EMAIL_PORT')
      console.error('  - EMAIL_USER')
      console.error('  - EMAIL_PASSWORD')
      process.exit(1)
    }
  } else {
    console.log('Email HTML generated. To send the email, run:')
    console.log('  npx tsx scripts/generate-sample-spacegenie-report.ts --send')
    console.log('\nOr open the HTML file in your browser to preview it.')
  }

  console.log('\n' + '='.repeat(60))
  console.log('NOTE: This is a SAMPLE report using mock data.')
  console.log('To generate a real report with actual Google Ads data:')
  console.log('1. Ensure your .env file has Google Ads API credentials configured')
  console.log('2. Run: npx tsx scripts/send-spacegenie-monthly-report.ts')
  console.log('='.repeat(60))
}

main()
