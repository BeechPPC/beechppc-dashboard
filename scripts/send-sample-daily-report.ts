/**
 * Generate and optionally send a sample daily report email
 * Run with: npx tsx scripts/send-sample-daily-report.ts [--send]
 */

// @ts-nocheck
import { writeFileSync } from 'fs'
import { join } from 'path'
import { generateEmailTemplate } from '../lib/email/template'
import { sendDailyReport } from '../lib/email/service'
import type { AccountPerformance } from '../lib/google-ads/types'

// Sample account performance data
const sampleReportData: AccountPerformance[] = [
  {
    id: '123-456-7890',
    name: 'Acme Corporation - Main Account',
    currency: 'AUD',
    yesterday: {
      cost: 1250.75,
      conversions: 42,
      clicks: 385,
      impressions: 12450,
      ctr: 3.09,
      averageCpc: 3.25,
      conversionRate: 10.91,
    },
    last7Days: {
      cost: 7850.50,
      conversions: 285,
      clicks: 2415,
      impressions: 85200,
      ctr: 2.83,
      averageCpc: 3.25,
      conversionRate: 11.80,
    },
    last30Days: {
      cost: 32150.25,
      conversions: 1180,
      clicks: 9875,
      impressions: 342800,
      ctr: 2.88,
      averageCpc: 3.26,
      conversionRate: 11.95,
    },
  },
  {
    id: '987-654-3210',
    name: 'TechStart Solutions',
    currency: 'AUD',
    yesterday: {
      cost: 875.50,
      conversions: 28,
      clicks: 267,
      impressions: 9850,
      ctr: 2.71,
      averageCpc: 3.28,
      conversionRate: 10.49,
    },
    last7Days: {
      cost: 5425.75,
      conversions: 195,
      clicks: 1655,
      impressions: 62500,
      ctr: 2.65,
      averageCpc: 3.28,
      conversionRate: 11.78,
    },
    last30Days: {
      cost: 22150.00,
      conversions: 820,
      clicks: 6750,
      impressions: 251200,
      ctr: 2.69,
      averageCpc: 3.28,
      conversionRate: 12.15,
    },
  },
  {
    id: '555-123-4567',
    name: 'Digital Marketing Pro',
    currency: 'AUD',
    yesterday: {
      cost: 625.25,
      conversions: 18,
      clicks: 192,
      impressions: 7250,
      ctr: 2.65,
      averageCpc: 3.26,
      conversionRate: 9.38,
    },
    last7Days: {
      cost: 4175.50,
      conversions: 125,
      clicks: 1280,
      impressions: 48500,
      ctr: 2.64,
      averageCpc: 3.26,
      conversionRate: 9.77,
    },
    last30Days: {
      cost: 17650.75,
      conversions: 520,
      clicks: 5415,
      impressions: 198750,
      ctr: 2.72,
      averageCpc: 3.26,
      conversionRate: 9.60,
    },
  },
  {
    id: '222-888-9999',
    name: 'E-Commerce Plus',
    currency: 'AUD',
    yesterday: {
      cost: 1450.00,
      conversions: 55,
      clicks: 445,
      impressions: 15850,
      ctr: 2.81,
      averageCpc: 3.26,
      conversionRate: 12.36,
    },
    last7Days: {
      cost: 9850.25,
      conversions: 380,
      clicks: 3020,
      impressions: 105500,
      ctr: 2.86,
      averageCpc: 3.26,
      conversionRate: 12.58,
    },
    last30Days: {
      cost: 41250.50,
      conversions: 1585,
      clicks: 12650,
      impressions: 425800,
      ctr: 2.97,
      averageCpc: 3.26,
      conversionRate: 12.53,
    },
  },
  {
    id: '777-444-1111',
    name: 'Local Services Hub',
    currency: 'AUD',
    yesterday: {
      cost: 385.75,
      conversions: 12,
      clicks: 118,
      impressions: 4550,
      ctr: 2.59,
      averageCpc: 3.27,
      conversionRate: 10.17,
    },
    last7Days: {
      cost: 2650.00,
      conversions: 82,
      clicks: 810,
      impressions: 31200,
      ctr: 2.60,
      averageCpc: 3.27,
      conversionRate: 10.12,
    },
    last30Days: {
      cost: 11250.25,
      conversions: 345,
      clicks: 3440,
      impressions: 128500,
      ctr: 2.68,
      averageCpc: 3.27,
      conversionRate: 10.03,
    },
  },
]

async function main() {
  const shouldSend = process.argv.includes('--send')

  console.log('Generating sample daily report...\n')

  // Set report date to yesterday
  const reportDate = new Date()
  reportDate.setDate(reportDate.getDate() - 1)

  // Generate the email HTML
  const emailHtml = generateEmailTemplate(sampleReportData, reportDate)

  // Save to file for preview
  const outputPath = join(process.cwd(), 'sample-daily-report.html')
  writeFileSync(outputPath, emailHtml)
  console.log(`✓ Sample daily report saved to: ${outputPath}\n`)

  if (shouldSend) {
    // Get email recipient from environment
    const recipient = process.env.TEST_EMAIL_RECIPIENT || process.env.EMAIL_USER

    if (!recipient) {
      console.error('Error: No recipient email found.')
      console.error('Set TEST_EMAIL_RECIPIENT or EMAIL_USER environment variable.')
      process.exit(1)
    }

    try {
      console.log(`Sending daily report to: ${recipient}`)
      const result = await sendDailyReport(emailHtml, reportDate, [recipient])
      console.log(`✓ Daily report sent successfully! (Message ID: ${result.messageId})\n`)
      console.log('Check your inbox for the email.')
    } catch (error) {
      console.error('Error sending email:', error)
      console.error('\nMake sure your .env file has these settings configured:')
      console.error('  - EMAIL_HOST')
      console.error('  - EMAIL_PORT')
      console.error('  - EMAIL_USER')
      console.error('  - EMAIL_PASSWORD')
      process.exit(1)
    }
  } else {
    console.log('Email HTML generated. To send the email, run:')
    console.log('  npx tsx scripts/send-sample-daily-report.ts --send')
    console.log('\nOr open the HTML file in your browser to preview it.')
  }
}

main()
