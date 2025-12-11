import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getMccReportData } from '@/lib/google-ads/client'
import { generateEmailTemplate } from '@/lib/email/template'
import { sendDailyReport } from '@/lib/email/service'

export async function POST(request: Request) {
  try {
    // Check authentication: Either Clerk (for frontend) OR API key (for cron/external)
    const { userId } = await auth()
    const apiKey = request.headers.get('x-api-key')
    const expectedApiKey = process.env.REPORTS_API_KEY

    // Allow if either authenticated via Clerk OR has valid API key
    const isClerkAuth = !!userId
    const isApiKeyAuth = expectedApiKey && apiKey === expectedApiKey

    if (!isClerkAuth && !isApiKeyAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

// Add GET handler for testing connectivity
export async function GET() {
  return NextResponse.json({
    message: 'Reports endpoint is accessible. Use POST to send reports.',
    timestamp: new Date().toISOString()
  })
}

export const dynamic = 'force-dynamic'
