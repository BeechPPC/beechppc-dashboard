/**
 * API Route: Send template-based report
 * POST /api/reports/template-send
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTemplateById } from '@/lib/google-ads/report-templates'
import { getCustomerAccounts } from '@/lib/google-ads/client'
import { executeTemplateQuery } from '@/lib/google-ads/template-queries'
import { generateTemplateEmail } from '@/lib/email/template-email'
import { sendEmail } from '@/lib/email/service'

interface RequestBody {
  templateId: string
  accountId?: string | null
  recipients: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { templateId, accountId, recipients } = body

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      )
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one recipient is required' },
        { status: 400 }
      )
    }

    // Get the template configuration
    const template = getTemplateById(templateId)
    if (!template) {
      return NextResponse.json(
        { success: false, error: `Template not found: ${templateId}` },
        { status: 404 }
      )
    }

    console.log(`Generating template report: ${template.name}`)

    // Get accounts to process
    const allAccounts = await getCustomerAccounts()
    const accounts = accountId
      ? allAccounts.filter(acc => acc.id === accountId)
      : allAccounts

    if (accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No accounts found' },
        { status: 404 }
      )
    }

    const results = []

    // Process each account
    for (const account of accounts) {
      try {
        console.log(`Processing account: ${account.name} (${account.id})`)

        // Execute the template query
        const data = await executeTemplateQuery(account.id, template)
        console.log(`Retrieved ${data.length} results for ${account.name}`)

        // Generate email HTML
        const reportDate = new Date()
        const accountData = {
          accountName: account.name,
          currency: account.currency,
          data: data,
        }

        const emailHtml = generateTemplateEmail(template, accountData, reportDate)

        // Send email
        const emailSubject = `${template.name} - ${account.name}`
        await sendEmail({
          to: recipients,
          subject: emailSubject,
          html: emailHtml,
        })

        results.push({
          accountId: account.id,
          accountName: account.name,
          success: true,
          resultCount: data.length,
        })

        console.log(`✓ Sent report for ${account.name}`)
      } catch (error) {
        console.error(`Error processing account ${account.name}:`, error)
        results.push({
          accountId: account.id,
          accountName: account.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: successCount > 0,
      message: `Sent ${successCount} report(s) successfully${
        failureCount > 0 ? `, ${failureCount} failed` : ''
      }`,
      results,
      recipients,
    })
  } catch (error) {
    console.error('Error sending template report:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send template report',
      },
      { status: 500 }
    )
  }
}
