/**
 * API Route: Get all available report templates
 * GET /api/reports/templates
 */

import { NextResponse } from 'next/server'
import { getAllTemplates } from '@/lib/google-ads/report-templates'

export async function GET() {
  try {
    const templates = getAllTemplates()

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error) {
    console.error('Error fetching templates:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
      },
      { status: 500 }
    )
  }
}
