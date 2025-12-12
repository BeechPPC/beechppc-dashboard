/**
 * API Route: /api/reports/schedules/[id]
 * Handles individual schedule operations (GET, PATCH, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { ReportType, ReportFrequency, ScopeType, TemplateType, DateRangeType } from '@prisma/client'

// GET /api/reports/schedules/[id] - Get single schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const schedule = await prisma.reportSchedule.findUnique({
      where: { id },
    })

    if (!schedule || schedule.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch schedule',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/reports/schedules/[id] - Update schedule
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if schedule exists
    const existing = await prisma.reportSchedule.findUnique({
      where: { id },
    })

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.enabled !== undefined) updateData.enabled = body.enabled
    if (body.reportType !== undefined) updateData.reportType = body.reportType as ReportType
    if (body.frequency !== undefined) updateData.frequency = body.frequency as ReportFrequency
    if (body.cronSchedule !== undefined) updateData.cronSchedule = body.cronSchedule
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.scopeType !== undefined) updateData.scopeType = body.scopeType as ScopeType
    if (body.accountIds !== undefined) updateData.accountIds = body.accountIds
    if (body.templateType !== undefined) updateData.templateType = body.templateType as TemplateType
    if (body.sections !== undefined) updateData.sections = body.sections
    if (body.dateRangeType !== undefined) updateData.dateRangeType = body.dateRangeType as DateRangeType
    if (body.recipientEmails !== undefined) updateData.recipientEmails = body.recipientEmails

    const schedule = await prisma.reportSchedule.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update schedule',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/reports/schedules/[id] - Soft delete schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Soft delete by setting deletedAt timestamp
    const schedule = await prisma.reportSchedule.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        enabled: false, // Also disable the schedule
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
      schedule,
    })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete schedule',
      },
      { status: 500 }
    )
  }
}