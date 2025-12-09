/**
 * Generate and send Spacegenie monthly report via AWS SES
 * Run with: npx tsx scripts/send-spacegenie-report-ses.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { sendEmailSES } from '../lib/email/service-ses'

async function main() {
  try {
    console.log('Reading generated report...\n')

    // Read the already generated HTML file
    const reportPath = join(process.cwd(), 'spacegenie-october-report.html')
    const emailHtml = readFileSync(reportPath, 'utf-8')

    console.log('Sending monthly report via AWS SES...\n')

    const recipient = 'chris@beechppc.com'
    console.log(`Sending to: ${recipient}...`)

    const result = await sendEmailSES({
      to: recipient,
      subject: 'Monthly Report - Spacegenie - October 2024',
      html: emailHtml,
    })

    console.log(`✓ Monthly report sent successfully via AWS SES!`)
    console.log(`  Message ID: ${result.messageId}\n`)
  } catch (error) {
    console.error('Error sending email via AWS SES:', error)
    console.error('\nMake sure your .env file has these AWS SES settings configured:')
    console.error('  - AWS_REGION')
    console.error('  - AWS_ACCESS_KEY_ID')
    console.error('  - AWS_SECRET_ACCESS_KEY')
    console.error('  - EMAIL_FROM or EMAIL_USER')
    console.error('\nAlso ensure the sender email is verified in AWS SES.')
    process.exit(1)
  }
}

main()
