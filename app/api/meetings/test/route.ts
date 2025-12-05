/**
 * Test endpoint to verify Google Calendar API setup
 * GET /api/meetings/test
 * 
 * This endpoint helps diagnose Calendar API configuration issues
 */

import { NextResponse } from 'next/server'
import { listCalendars, fetchCalendarEvents } from '@/lib/calendar/google-calendar'

export async function GET() {
  const diagnostics: {
    step: string
    status: 'success' | 'error' | 'warning'
    message: string
    data?: unknown
  }[] = []

  // Step 1: Check environment variables
  diagnostics.push({
    step: 'Environment Variables',
    status: 'success',
    message: 'Checking OAuth credentials...',
  })

  const hasClientId = !!process.env.GOOGLE_ADS_CLIENT_ID
  const hasClientSecret = !!process.env.GOOGLE_ADS_CLIENT_SECRET
  const hasRefreshToken = !!process.env.GOOGLE_ADS_REFRESH_TOKEN

  if (!hasClientId || !hasClientSecret || !hasRefreshToken) {
    diagnostics.push({
      step: 'Environment Variables',
      status: 'error',
      message: 'Missing OAuth credentials',
      data: {
        GOOGLE_ADS_CLIENT_ID: hasClientId,
        GOOGLE_ADS_CLIENT_SECRET: hasClientSecret,
        GOOGLE_ADS_REFRESH_TOKEN: hasRefreshToken,
      },
    })
    return NextResponse.json({
      success: false,
      diagnostics,
      error: 'OAuth credentials not configured',
    })
  }

  diagnostics.push({
    step: 'Environment Variables',
    status: 'success',
    message: 'OAuth credentials found',
  })

  // Step 2: Test listing calendars
  try {
    const calendars = await listCalendars()
    diagnostics.push({
      step: 'List Calendars',
      status: 'success',
      message: `Found ${calendars.length} accessible calendar(s)`,
      data: calendars.map((cal) => ({
        id: cal.id,
        name: cal.name,
        primary: cal.primary,
      })),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    diagnostics.push({
      step: 'List Calendars',
      status: 'error',
      message: `Failed to list calendars: ${errorMessage}`,
      data: {
        error: errorMessage,
        hint: errorMessage.includes('invalid_grant')
          ? 'Your refresh token may not have Calendar scope. Run: node scripts/get-calendar-refresh-token.js'
          : errorMessage.includes('unauthorized')
          ? 'Check that Google Calendar API is enabled and OAuth consent screen includes Calendar scope'
          : 'Check your OAuth credentials and API permissions',
      },
    })
    return NextResponse.json({
      success: false,
      diagnostics,
      error: 'Failed to access Google Calendar',
    })
  }

  // Step 3: Test fetching events
  try {
    const now = new Date()
    const future = new Date()
    future.setDate(future.getDate() + 7) // Next 7 days

    const meetings = await fetchCalendarEvents(now, future)
    diagnostics.push({
      step: 'Fetch Events',
      status: 'success',
      message: `Successfully fetched ${meetings.length} meeting(s) for next 7 days`,
      data: {
        count: meetings.length,
        dateRange: {
          from: now.toISOString(),
          to: future.toISOString(),
        },
        sampleMeetings: meetings.slice(0, 5).map((m) => ({
          title: m.title,
          startTime: m.startTime.toISOString(),
          location: m.location,
        })),
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    diagnostics.push({
      step: 'Fetch Events',
      status: 'error',
      message: `Failed to fetch events: ${errorMessage}`,
      data: {
        error: errorMessage,
      },
    })
    return NextResponse.json({
      success: false,
      diagnostics,
      error: 'Failed to fetch calendar events',
    })
  }

  // All tests passed
  return NextResponse.json({
    success: true,
    message: 'Google Calendar API is properly configured!',
    diagnostics,
  })
}

