/**
 * API Route: /api/reports/history
 * Handles report history operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// GET /api/reports/history - List report history with pagination
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status') // Optional filter
    const scheduleId = searchParams.get('scheduleId') // Optional filter

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (scheduleId) where.scheduleId = scheduleId

    // Get total count
    const total = await prisma.reportHistory.count({ where })

    // Get paginated results
    const reports = await prisma.reportHistory.findMany({
      where,
      include: {
        schedule: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return NextResponse.json({
      success: true,
      reports,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Error fetching report history:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch report history',
      },
      { status: 500 }
    )
  }
}

// POST /api/reports/history - Create report history entry
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      scheduleId,
      reportType,
      reportName,
      dateFrom,
      dateTo,
      accountIds,
      accountNames,
      htmlContent,
      pdfUrl,
      jsonData,
      status,
      deliveryStatus,
      sentTo,
      fileSizeBytes,
      generationTimeMs,
      errorMessage,
    } = body

    // Validation
    if (!reportType || !reportName || !dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const report = await prisma.reportHistory.create({
      data: {
        scheduleId: scheduleId || null,
        reportType,
        reportName,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        accountIds: accountIds || [],
        accountNames: accountNames || [],
        htmlContent: htmlContent || null,
        pdfUrl: pdfUrl || null,
        jsonData: jsonData || null,
        status: status || 'PENDING',
        deliveryStatus: deliveryStatus || null,
        sentTo: sentTo || null,
        sentAt: status === 'SENT' ? new Date() : null,
        fileSizeBytes: fileSizeBytes || null,
        generationTimeMs: generationTimeMs || null,
        errorMessage: errorMessage || null,
      },
    })

    // If this is from a schedule, update the schedule's lastRunAt
    if (scheduleId) {
      await prisma.reportSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: status === 'SENT' ? 'success' : 'failed',
        },
      })
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Error creating report history:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create report history',
      },
      { status: 500 }
    )
  }
}