import { NextResponse } from 'next/server'
import { getReport } from '@/lib/reports/storage'
import { generatePdfFromHtml } from '@/lib/reports/pdf-generator'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      )
    }

    console.log(`Fetching report ${reportId} for PDF download`)

    // Get report from storage
    const report = getReport(reportId)

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found. Reports are stored temporarily and may expire.' },
        { status: 404 }
      )
    }

    console.log(`Generating PDF for report: ${report.accountName} - ${report.month}`)

    // Generate PDF from HTML
    const pdfBuffer = await generatePdfFromHtml(report.html)

    // Create filename
    const filename = `${report.accountName.replace(/[^a-z0-9]/gi, '-')}-${report.month.replace(/\s+/g, '-')}.pdf`

    // Return PDF as response
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF download error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate PDF'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
