/**
 * Google Calendar API Client
 * Fetches meetings directly from Google Calendar
 */

import { google } from 'googleapis'
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
 * Fetch events from Google Calendar
 */
export async function fetchCalendarEvents(
  timeMin?: Date,
  timeMax?: Date,
  calendarId: string = 'primary'
): Promise<Meeting[]> {
  try {
    const calendar = getCalendarClient()

    // Set default time range if not provided
    const minTime = timeMin || new Date()
    const maxTime = timeMax || new Date()
    maxTime.setDate(maxTime.getDate() + 30) // Default to 30 days ahead

    const response = await calendar.events.list({
      calendarId,
      timeMin: minTime.toISOString(),
      timeMax: maxTime.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    })

    const events = response.data.items || []

    return events
      .map((event): Meeting | null => {
        if (!event.id || !event.summary) {
          return null
        }

        // Parse start and end times
        const startTime = event.start?.dateTime
          ? new Date(event.start.dateTime)
          : event.start?.date
          ? new Date(event.start.date)
          : null

        const endTime = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : event.end?.date
          ? new Date(event.end.date)
          : null

        if (!startTime) {
          return null
        }

        // Default end time to 1 hour after start if not provided
        const finalEndTime = endTime || new Date(startTime.getTime() + 60 * 60 * 1000)

        // Extract attendees
        const attendees: string[] = []
        if (event.attendees) {
          attendees.push(...event.attendees.map((attendee) => attendee.email || '').filter(Boolean))
        }

        // Extract organizer
        const organizer = event.organizer?.email || event.creator?.email || ''

        return {
          id: event.id,
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
    console.error('Error fetching calendar events:', error)
    
    // If it's an auth error, provide helpful message
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      if (errorMessage.includes('invalid_grant') || errorMessage.includes('unauthorized')) {
        throw new Error(
          'Google Calendar authentication failed. Please ensure:\n' +
          '1. Google Calendar API is enabled in your Google Cloud project\n' +
          '2. The OAuth consent screen includes the Calendar scope\n' +
          '3. Your refresh token has the calendar.readonly scope\n' +
          '4. You may need to regenerate your refresh token with Calendar access'
        )
      }
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        throw new Error('Google Calendar not found. Please check your calendar ID.')
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

