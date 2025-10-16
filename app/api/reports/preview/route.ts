import { NextResponse } from 'next/server'
import { getMccReportData } from '@/lib/google-ads/client'
import { generateEmailTemplate } from '@/lib/email/template'

export async function GET() {
  try {
    console.log('Generating preview report...')
    const reportData = await getMccReportData()

    if (reportData.length === 0) {
      return new NextResponse(
        '<html><body><h1>No account data found</h1></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const reportDate = new Date()
    reportDate.setDate(reportDate.getDate() - 1)

    const emailHtml = generateEmailTemplate(reportData, reportDate)

    return new NextResponse(emailHtml, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return new NextResponse(
      `<html><body><h1>Error generating preview</h1><p>${error.message}</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
