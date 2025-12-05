/**
 * Google Calendar API Client
 * Fetches meetings directly from Google Calendar
 */

import { google, calendar_v3 } from 'googleapis'
import type { Meeting } from '@/lib/email/meeting-parser'

// Initialize OAuth2 client
function getOAuth2Client() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth credentials not configured. Please set GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, and GOOGLE_ADS_REFRESH_TOKEN')
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob' // Redirect URI for installed apps
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  return oauth2Client
}

/**
 * Get Google Calendar API client
 */
function getCalendarClient() {
  const auth = getOAuth2Client()
  return google.calendar({ version: 'v3', auth })
}

/**
 * Fetch events from a specific Google Calendar
 */
async function fetchEventsFromCalendar(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<Meeting[]> {
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500, // Increased limit to get more events
      showDeleted: false, // Don't include deleted events
    })

    const events = response.data.items || []

    return events
      .map((event): Meeting | null => {
        // Skip cancelled or declined events
        if (event.status === 'cancelled') {
          return null
        }

        // Skip if no ID or title
        if (!event.id || !event.summary) {
          return null
        }

        // Skip if user has declined
        if (event.attendees) {
          const userResponse = event.attendees.find(
            (attendee) => attendee.self && attendee.responseStatus === 'declined'
          )
          if (userResponse) {
            return null
          }
        }

        // Parse start and end times
        const startTime = event.start?.dateTime
          ? new Date(event.start.dateTime)
          : event.start?.date
          ? new Date(event.start.date + 'T00:00:00') // All-day events: set to start of day
          : null

        const endTime = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : event.end?.date
          ? new Date(event.end.date + 'T23:59:59') // All-day events: set to end of day
          : null

        if (!startTime) {
          return null
        }

        // Default end time to 1 hour after start if not provided
        const finalEndTime = endTime || new Date(startTime.getTime() + 60 * 60 * 1000)

        // Extract attendees
        const attendees: string[] = []
        if (event.attendees) {
          attendees.push(
            ...event.attendees
              .map((attendee) => attendee.email || '')
              .filter((email) => email && email !== event.organizer?.email)
          )
        }

        // Extract organizer
        const organizer = event.organizer?.email || event.creator?.email || ''

        return {
          id: `${calendarId}:${event.id}`, // Include calendar ID to avoid duplicates across calendars
          title: event.summary,
          startTime,
          endTime: finalEndTime,
          location: event.location || undefined,
          organizer,
          attendees,
          description: event.description || undefined,
          source: 'google_calendar',
          emailSubject: event.summary,
          emailFrom: organizer,
          emailDate: event.created ? new Date(event.created) : new Date(),
        }
      })
      .filter((meeting): meeting is Meeting => meeting !== null)
  } catch (error) {
    // Log error but don't throw - we want to continue with other calendars
    console.warn(`Error fetching events from calendar ${calendarId}:`, error)
    return []
  }
}

/**
 * Fetch events from Google Calendar
 * Fetches from all accessible calendars, not just primary
 */
export async function fetchCalendarEvents(
  timeMin?: Date,
  timeMax?: Date,
  calendarId?: string
): Promise<Meeting[]> {
  try {
    const calendar = getCalendarClient()

    // Set default time range if not provided
    const minTime = timeMin || new Date()
    minTime.setHours(0, 0, 0, 0) // Start of day
    
    const maxTime = timeMax || new Date()
    maxTime.setDate(maxTime.getDate() + 30) // Default to 30 days ahead
    maxTime.setHours(23, 59, 59, 999) // End of day

    console.log(`Fetching calendar events from ${minTime.toISOString()} to ${maxTime.toISOString()}`)

    // If specific calendar ID provided, fetch only from that calendar
    if (calendarId) {
      const meetings = await fetchEventsFromCalendar(calendar, calendarId, minTime, maxTime)
      console.log(`Fetched ${meetings.length} meetings from calendar ${calendarId}`)
      return meetings
    }

    // Otherwise, fetch from all accessible calendars
    try {
      const calendarListResponse = await calendar.calendarList.list({
        minAccessRole: 'reader', // Get all calendars user can read
      })

      const calendars = calendarListResponse.data.items || []
      console.log(`Found ${calendars.length} accessible calendars`)

      // Fetch events from all calendars in parallel
      const meetingPromises = calendars.map((cal) =>
        fetchEventsFromCalendar(calendar, cal.id || 'primary', minTime, maxTime)
      )

      const allMeetingsArrays = await Promise.all(meetingPromises)
      const allMeetings = allMeetingsArrays.flat()

      // Remove duplicates (same event ID across calendars)
      const uniqueMeetings = allMeetings.filter(
        (meeting, index, self) =>
          index === self.findIndex((m) => m.id === meeting.id || (m.title === meeting.title && m.startTime.getTime() === meeting.startTime.getTime()))
      )

      console.log(`Fetched ${uniqueMeetings.length} unique meetings from ${calendars.length} calendars`)
      return uniqueMeetings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    } catch (listError) {
      console.warn('Error listing calendars, falling back to primary calendar:', listError)
      // Fallback to primary calendar if listing fails
      const meetings = await fetchEventsFromCalendar(calendar, 'primary', minTime, maxTime)
      console.log(`Fetched ${meetings.length} meetings from primary calendar (fallback)`)
      return meetings
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    
    // If it's an auth error, provide helpful message
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('invalid_grant') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid_credentials')) {
        throw new Error(
          'Google Calendar authentication failed. Please ensure:\n' +
          '1. Google Calendar API is enabled in your Google Cloud project\n' +
          '2. The OAuth consent screen includes the Calendar scope (https://www.googleapis.com/auth/calendar.readonly)\n' +
          '3. Your refresh token has the calendar.readonly scope\n' +
          '4. Run: node scripts/get-calendar-refresh-token.js to regenerate your refresh token with Calendar access'
        )
      }
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        throw new Error('Google Calendar not found. Please check your calendar ID.')
      }
      if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
        throw new Error('Access denied to Google Calendar. Please check your OAuth scopes and permissions.')
      }
    }
    
    throw error
  }
}

/**
 * List available calendars
 */
export async function listCalendars(): Promise<Array<{ id: string; name: string; primary: boolean }>> {
  try {
    const calendar = getCalendarClient()
    const response = await calendar.calendarList.list()

    return (response.data.items || []).map((cal) => ({
      id: cal.id || '',
      name: cal.summary || 'Unnamed Calendar',
      primary: cal.primary || false,
    }))
  } catch (error) {
    console.error('Error listing calendars:', error)
    throw error
  }
}

