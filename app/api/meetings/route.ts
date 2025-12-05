import { NextRequest, NextResponse } from 'next/server'
import { fetchEmails } from '@/lib/email/reader'
import {
  extractMeetingsFromEmails,
  getUpcomingMeetings,
  filterMeetingsByDateRange,
} from '@/lib/email/meeting-parser'
import type { Meeting } from '@/lib/email/meeting-parser'
import { fetchCalendarEvents } from '@/lib/calendar/google-calendar'

/**
 * GET /api/meetings
 * Fetch upcoming meetings from email
 * Supports:
 * - days: number of days to look ahead (default: 7)
 * - month: month number (1-12)
 * - year: year (e.g., 2024)
 * - startDate: ISO date string (YYYY-MM-DD)
 * - endDate: ISO date string (YYYY-MM-DD)
 * - limit: max number of emails to fetch (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '0')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Determine date range
    let dateStart: Date | null = null
    let dateEnd: Date | null = null

    if (startDate && endDate) {
      // Use explicit date range
      dateStart = new Date(startDate)
      dateEnd = new Date(endDate)
    } else if (month && year) {
      // Use month/year
      const monthNum = parseInt(month)
      const yearNum = parseInt(year)
      dateStart = new Date(yearNum, monthNum - 1, 1)
      dateEnd = new Date(yearNum, monthNum, 0, 23, 59, 59) // Last day of month
    } else if (days > 0) {
      // Use days parameter
      const now = new Date()
      dateStart = now
      dateEnd = new Date()
      dateEnd.setDate(now.getDate() + days)
    } else {
      // Default: next 7 days
      const now = new Date()
      dateStart = now
      dateEnd = new Date()
      dateEnd.setDate(now.getDate() + 7)
    }

    // Try to fetch from Google Calendar API first (preferred method)
    let allMeetings: Meeting[] = []
    let calendarError: Error | null = null

    try {
      // Use Google Calendar API to get all meetings
      const calendarMeetings = await fetchCalendarEvents(dateStart || undefined, dateEnd || undefined)
      allMeetings = calendarMeetings
      console.log(`Fetched ${calendarMeetings.length} meetings from Google Calendar`)
    } catch (error) {
      calendarError = error instanceof Error ? error : new Error('Unknown calendar error')
      console.warn('Google Calendar API failed, falling back to email parsing:', calendarError.message)

      // Fallback to email parsing if Calendar API fails
      let emails
      if (dateStart) {
        // Search all emails since the start date, not just unseen
        emails = await fetchEmails({
          since: dateStart,
          limit: limit * 2, // Increase limit since we're searching all emails
          searchCriteria: [], // Empty array = search all emails, not just unseen
        })
      } else {
        // For recent emails, search further back and include all emails
        const since = new Date()
        since.setDate(since.getDate() - 30) // Look back 30 days instead of 24 hours
        emails = await fetchEmails({
          since,
          limit: limit * 2,
          searchCriteria: [], // Search all emails
        })
      }

      // Extract meetings from emails
      allMeetings = extractMeetingsFromEmails(emails)
      console.log(`Fetched ${allMeetings.length} meetings from email parsing (fallback)`)
    }

    // Filter meetings by date range
    let filteredMeetings: Meeting[]
    if (dateStart && dateEnd) {
      filteredMeetings = filterMeetingsByDateRange(
        allMeetings,
        dateStart,
        dateEnd
      )
    } else {
      filteredMeetings = getUpcomingMeetings(allMeetings, days || 7)
    }

    return NextResponse.json({
      success: true,
      meetings: filteredMeetings,
      total: filteredMeetings.length,
      source: calendarError ? 'email' : 'google_calendar',
      warning: calendarError
        ? 'Using email parsing as fallback. Google Calendar API is not configured or accessible.'
        : undefined,
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

    // Try to fetch from Google Calendar API first (preferred method)
    let allMeetings: Meeting[] = []
    let calendarError: Error | null = null

    try {
      // Use Google Calendar API to get all meetings
      const calendarMeetings = await fetchCalendarEvents(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )
      allMeetings = calendarMeetings
      console.log(`Fetched ${calendarMeetings.length} meetings from Google Calendar`)
    } catch (error) {
      calendarError = error instanceof Error ? error : new Error('Unknown calendar error')
      console.warn('Google Calendar API failed, falling back to email parsing:', calendarError.message)

      // Fallback to email parsing if Calendar API fails
      let emails
      if (startDate && endDate) {
        // Search all emails since the start date
        emails = await fetchEmails({
          since: new Date(startDate),
          limit: limit * 2,
          searchCriteria: [], // Search all emails, not just unseen
        })
      } else {
        // For recent emails, search further back and include all emails
        const since = new Date()
        since.setDate(since.getDate() - 30) // Look back 30 days
        emails = await fetchEmails({
          since,
          limit: limit * 2,
          searchCriteria: [], // Search all emails
        })
      }

      // Extract meetings from emails
      allMeetings = extractMeetingsFromEmails(emails)
      console.log(`Fetched ${allMeetings.length} meetings from email parsing (fallback)`)
    }

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
      source: calendarError ? 'email' : 'google_calendar',
      warning: calendarError
        ? 'Using email parsing as fallback. Google Calendar API is not configured or accessible.'
        : undefined,
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

