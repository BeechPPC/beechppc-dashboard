import { NextRequest, NextResponse } from 'next/server'
import { fetchEmails, getRecentEmails } from '@/lib/email/reader'
import {
  extractMeetingsFromEmails,
  getUpcomingMeetings,
  filterMeetingsByDateRange,
} from '@/lib/email/meeting-parser'
import type { Meeting } from '@/lib/email/meeting-parser'

/**
 * GET /api/meetings
 * Fetch upcoming meetings from email
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch recent emails
    const emails = await getRecentEmails(limit)

    // Extract meetings from emails
    const allMeetings = extractMeetingsFromEmails(emails)

    // Filter to upcoming meetings
    const upcomingMeetings = getUpcomingMeetings(allMeetings, days)

    return NextResponse.json({
      success: true,
      meetings: upcomingMeetings,
      total: upcomingMeetings.length,
    })
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch meetings',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/meetings
 * Search for meetings with custom criteria
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { days = 7, startDate, endDate, limit = 50 } = body

    // Fetch emails
    let emails
    if (startDate && endDate) {
      emails = await fetchEmails({
        since: new Date(startDate),
        limit,
      })
    } else {
      emails = await getRecentEmails(limit)
    }

    // Extract meetings
    const allMeetings = extractMeetingsFromEmails(emails)

    // Filter meetings
    let filteredMeetings: Meeting[]
    if (startDate && endDate) {
      filteredMeetings = filterMeetingsByDateRange(
        allMeetings,
        new Date(startDate),
        new Date(endDate)
      )
    } else {
      filteredMeetings = getUpcomingMeetings(allMeetings, days)
    }

    return NextResponse.json({
      success: true,
      meetings: filteredMeetings,
      total: filteredMeetings.length,
    })
  } catch (error) {
    console.error('Error searching meetings:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search meetings',
      },
      { status: 500 }
    )
  }
}

