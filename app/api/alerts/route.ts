import { NextRequest, NextResponse } from 'next/server'
import { getAllAlerts, createAlert, updateAlert, deleteAlert } from '@/lib/alerts/storage'
import type { Alert } from '@/lib/alerts/types'

// GET /api/alerts - Get all alerts
export async function GET() {
  try {
    const alerts = await getAllAlerts()
    return NextResponse.json({ success: true, alerts })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// POST /api/alerts - Create new alert
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type, condition, threshold, accountId, recipients, frequency } = body

    if (!name || !type || !condition || threshold === undefined || !recipients || !frequency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newAlert = await createAlert({
      name,
      description,
      type,
      condition,
      threshold: Number(threshold),
      accountId,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      frequency,
      enabled: true,
    })

    return NextResponse.json({ success: true, alert: newAlert })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}

// PATCH /api/alerts - Update alert
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    const updatedAlert = await updateAlert(id, updates)
    if (!updatedAlert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, alert: updatedAlert })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}

// DELETE /api/alerts - Delete alert
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    const deleted = await deleteAlert(id)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete alert' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
