import { NextResponse } from 'next/server'
import { getMccReportData } from '@/lib/google-ads/client'
import { generateEmailTemplate } from '@/lib/email/template'
import { sendDailyReport } from '@/lib/email/service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { recipients } = body

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipients are required' },
        { status: 400 }
      )
    }

    console.log('Generating MCC report...')
    const reportData = await getMccReportData()

    if (reportData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No account data found' },
        { status: 400 }
      )
    }

    const reportDate = new Date()
    reportDate.setDate(reportDate.getDate() - 1) // Yesterday's report

    console.log('Generating email template...')
    const emailHtml = generateEmailTemplate(reportData, reportDate)

    console.log('Sending email...')
    const result = await sendDailyReport(emailHtml, reportDate, recipients)

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      accountCount: reportData.length,
      recipients,
    })
  } catch (error) {
    console.error('API Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to send report'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
