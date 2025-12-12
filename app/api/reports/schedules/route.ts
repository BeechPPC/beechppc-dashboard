/**
 * API Route: /api/reports/schedules
 * Handles CRUD operations for report schedules
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { ReportType, ReportFrequency, ScopeType, TemplateType, DateRangeType } from '@prisma/client'

// GET /api/reports/schedules - List all schedules
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Schedules GET] Starting database query...')
    console.log('[Schedules GET] DATABASE_URL exists:', !!process.env.DATABASE_URL)

    const schedules = await prisma.reportSchedule.findMany({
      where: {
        deletedAt: null, // Only non-deleted schedules
      },
      orderBy: [
        { enabled: 'desc' }, // Active schedules first
        { createdAt: 'desc' },
      ],
    })

    console.log('[Schedules GET] Successfully fetched', schedules.length, 'schedules')

    return NextResponse.json({
      success: true,
      schedules,
    })
  } catch (error) {
    console.error('[Schedules GET] Error fetching schedules:', error)
    console.error('[Schedules GET] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch schedules',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    )
  }
}

// POST /api/reports/schedules - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      reportType,
      frequency,
      cronSchedule,
      timezone,
      scopeType,
      accountIds,
      templateType,
      sections,
      dateRangeType,
      recipientEmails,
    } = body

    // Validation
    if (!name || !reportType || !frequency || !cronSchedule || !timezone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate nextRunAt based on cron schedule
    // For now, we'll set it to null and implement proper calculation later
    const nextRunAt = null

    // Generate unique ID for the schedule
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const schedule = await prisma.reportSchedule.create({
      data: {
        id: scheduleId,
        name,
        description,
        reportType: reportType as ReportType,
        frequency: frequency as ReportFrequency,
        cronSchedule,
        timezone,
        scopeType: scopeType as ScopeType,
        accountIds: accountIds || null,
        templateType: templateType as TemplateType,
        sections: sections || {},
        dateRangeType: dateRangeType as DateRangeType,
        recipientEmails: recipientEmails || [],
        nextRunAt,
        createdBy: userId,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create schedule',
      },
      { status: 500 }
    )
  }
}