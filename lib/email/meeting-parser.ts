/**
 * Meeting Parser
 * Extracts meeting information from emails (calendar invites, meeting requests)
 */

import { EmailMessage } from './reader'

export interface Meeting {
  id: string
  title: string
  startTime: Date
  endTime: Date
  location?: string
  organizer: string
  attendees: string[]
  description?: string
  source: 'calendar_invite' | 'email_text' | 'manual'
  emailSubject: string
  emailFrom: string
  emailDate: Date
}

/**
 * Parse ICS calendar file from email attachment
 * Simple ICS parser without external dependencies
 */
function parseICSFile(content: Buffer): Meeting | null {
  try {
    const icsContent = content.toString('utf-8')

    // Extract VEVENT block
    const veventMatch = icsContent.match(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/)
    if (!veventMatch) {
      return null
    }

    const veventContent = veventMatch[1]

    // Helper to extract property value
    const getProperty = (name: string): string | null => {
      const regex = new RegExp(`^${name}(?:;.*?)?:(.+)$`, 'm')
      const match = veventContent.match(regex)
      return match ? match[1].trim() : null
    }

    // Extract properties
    const summary = getProperty('SUMMARY') || 'Untitled Meeting'
    const dtstartStr = getProperty('DTSTART')
    const dtendStr = getProperty('DTEND')
    const location = getProperty('LOCATION') || undefined
    const organizer = getProperty('ORGANIZER') || ''
    const description = getProperty('DESCRIPTION') || undefined
    const uid = getProperty('UID') || `meeting-${Date.now()}`

    // Parse dates (supports both DATE-TIME and DATE formats)
    let startTime: Date | null = null
    let endTime: Date | null = null

    if (dtstartStr) {
      startTime = parseICSDate(dtstartStr)
    }
    if (dtendStr) {
      endTime = parseICSDate(dtendStr)
    }

    if (!startTime) {
      return null
    }

    // Default end time to 1 hour after start if not provided
    if (!endTime) {
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    }

    // Extract attendees
    const attendees: string[] = []
    const attendeeRegex = /^ATTENDEE(?:;.*?)?:(.+)$/gm
    let attendeeMatch
    while ((attendeeMatch = attendeeRegex.exec(veventContent)) !== null) {
      const attendee = attendeeMatch[1].trim()
      // Extract email from "CN=Name <email@example.com>" or "mailto:email@example.com" format
      const emailMatch = attendee.match(/mailto:([^\s,]+)/i) || attendee.match(/<([^>]+)>/)
      if (emailMatch) {
        attendees.push(emailMatch[1])
      } else if (attendee.includes('@')) {
        attendees.push(attendee)
      }
    }

    // Clean organizer email
    const organizerEmail = organizer
      .replace(/^mailto:/i, '')
      .replace(/CN=[^;]+;?/gi, '')
      .trim()

    return {
      id: uid,
      title: summary,
      startTime,
      endTime,
      location,
      organizer: organizerEmail,
      attendees,
      description,
      source: 'calendar_invite',
      emailSubject: '',
      emailFrom: '',
      emailDate: new Date(),
    }
  } catch (error) {
    console.error('Error parsing ICS file:', error)
    return null
  }
}

/**
 * Parse ICS date format (YYYYMMDDTHHmmss or YYYYMMDD)
 */
function parseICSDate(dateStr: string): Date | null {
  try {
    // Remove timezone info if present
    const cleanDate = dateStr.replace(/[TZ]/g, '').substring(0, 15)
    
    if (cleanDate.length === 8) {
      // DATE format: YYYYMMDD
      const year = parseInt(cleanDate.substring(0, 4))
      const month = parseInt(cleanDate.substring(4, 6)) - 1 // Month is 0-indexed
      const day = parseInt(cleanDate.substring(6, 8))
      return new Date(year, month, day)
    } else if (cleanDate.length >= 14) {
      // DATE-TIME format: YYYYMMDDHHmmss
      const year = parseInt(cleanDate.substring(0, 4))
      const month = parseInt(cleanDate.substring(4, 6)) - 1
      const day = parseInt(cleanDate.substring(6, 8))
      const hour = parseInt(cleanDate.substring(8, 10))
      const minute = parseInt(cleanDate.substring(10, 12))
      const second = cleanDate.length >= 14 ? parseInt(cleanDate.substring(12, 14)) : 0
      return new Date(year, month, day, hour, minute, second)
    }
    
    return null
  } catch (error) {
    console.error('Error parsing ICS date:', error)
    return null
  }
}

/**
 * Extract meeting information from email text using regex patterns
 */
function parseMeetingFromText(email: EmailMessage): Meeting | null {
  const text = email.text || email.html.replace(/<[^>]+>/g, ' ')
  const subject = email.subject.toLowerCase()

  // Common meeting patterns
  const patterns = [
    // "Meeting on [date] at [time]"
    /meeting\s+(?:on|for)\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?)\s+(?:at|@)\s+(\d{1,2}:\d{2}\s*(?:am|pm)?)/i,
    // "Call scheduled for [date] [time]"
    /(?:call|meeting|call)\s+scheduled\s+for\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?)\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?)/i,
    // "Zoom/Teams meeting on [date]"
    /(?:zoom|teams|google\s+meet|meeting)\s+(?:on|for)\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s+\d{4})?)\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm)?)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern) || subject.match(pattern)
    if (match) {
      try {
        // Try to parse the date
        const dateStr = match[1]
        const timeStr = match[2]
        const parsedDate = parseDateWithTime(dateStr, timeStr, email.date)

        if (parsedDate) {
          return {
            id: `meeting-${email.uid}-${Date.now()}`,
            title: email.subject,
            startTime: parsedDate,
            endTime: new Date(parsedDate.getTime() + 60 * 60 * 1000), // Default 1 hour
            location: extractLocation(text),
            organizer: email.from,
            attendees: [],
            description: text.substring(0, 200),
            source: 'email_text',
            emailSubject: email.subject,
            emailFrom: email.from,
            emailDate: email.date,
          }
        }
      } catch (error) {
        console.error('Error parsing meeting date:', error)
      }
    }
  }

  return null
}

/**
 * Parse date with time string
 */
function parseDateWithTime(dateStr: string, timeStr: string, fallbackDate: Date): Date | null {
  try {
    // Simple date parsing - can be enhanced
    const now = new Date()
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
    
    if (!timeMatch) {
      return null
    }

    let hours = parseInt(timeMatch[1])
    const minutes = parseInt(timeMatch[2])
    const ampm = timeMatch[3]?.toLowerCase()

    if (ampm === 'pm' && hours !== 12) {
      hours += 12
    } else if (ampm === 'am' && hours === 12) {
      hours = 0
    }

    // Try to parse date string
    let meetingDate = new Date(fallbackDate)
    
    // Look for day names
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayIndex = dayNames.findIndex(day => dateStr.toLowerCase().includes(day))
    
    if (dayIndex !== -1) {
      const today = new Date()
      const currentDay = today.getDay()
      let daysUntil = dayIndex - currentDay
      if (daysUntil < 0) {
        daysUntil += 7
      }
      meetingDate = new Date(today)
      meetingDate.setDate(today.getDate() + daysUntil)
    } else {
      // Try to parse numeric date
      const dateMatch = dateStr.match(/(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\w+))?(?:\s+(\d{4}))?/)
      if (dateMatch) {
        const day = parseInt(dateMatch[1])
        const monthStr = dateMatch[2]
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear()

        if (monthStr) {
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
          const monthIndex = monthNames.findIndex(m => m.toLowerCase().startsWith(monthStr.toLowerCase()))
          if (monthIndex !== -1) {
            meetingDate = new Date(year, monthIndex, day)
          }
        } else {
          meetingDate = new Date(now.getFullYear(), now.getMonth(), day)
        }
      }
    }

    meetingDate.setHours(hours, minutes, 0, 0)
    return meetingDate
  } catch (error) {
    console.error('Error parsing date:', error)
    return null
  }
}

/**
 * Extract location from email text
 */
function extractLocation(text: string): string | undefined {
  const locationPatterns = [
    /location[:\s]+([^\n]+)/i,
    /venue[:\s]+([^\n]+)/i,
    /(?:zoom|teams|google\s+meet)\s+link[:\s]+([^\s]+)/i,
    /(https?:\/\/[^\s]+(?:zoom|teams|meet)[^\s]+)/i,
  ]

  for (const pattern of locationPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return undefined
}

/**
 * Extract meetings from email
 */
export function extractMeetingsFromEmail(email: EmailMessage): Meeting[] {
  const meetings: Meeting[] = []

  // Check for ICS calendar attachments
  for (const attachment of email.attachments) {
    if (attachment.contentType === 'text/calendar' || attachment.filename.endsWith('.ics')) {
      const meeting = parseICSFile(attachment.content)
      if (meeting) {
        meetings.push({
          ...meeting,
          emailSubject: email.subject,
          emailFrom: email.from,
          emailDate: email.date,
        })
      }
    }
  }

  // If no calendar invite found, try parsing from text
  if (meetings.length === 0) {
    const meeting = parseMeetingFromText(email)
    if (meeting) {
      meetings.push(meeting)
    }
  }

  return meetings
}

/**
 * Extract all meetings from multiple emails
 */
export function extractMeetingsFromEmails(emails: EmailMessage[]): Meeting[] {
  const allMeetings: Meeting[] = []

  for (const email of emails) {
    const meetings = extractMeetingsFromEmail(email)
    allMeetings.push(...meetings)
  }

  // Remove duplicates based on title and start time
  const uniqueMeetings = allMeetings.filter((meeting, index, self) =>
    index === self.findIndex((m) => m.title === meeting.title && m.startTime.getTime() === meeting.startTime.getTime())
  )

  // Sort by start time
  return uniqueMeetings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

/**
 * Filter meetings by date range
 */
export function filterMeetingsByDateRange(
  meetings: Meeting[],
  startDate: Date,
  endDate: Date
): Meeting[] {
  return meetings.filter(
    (meeting) =>
      meeting.startTime >= startDate && meeting.startTime <= endDate
  )
}

/**
 * Get upcoming meetings (next 7 days)
 */
export function getUpcomingMeetings(meetings: Meeting[], days: number = 7): Meeting[] {
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(now.getDate() + days)

  return filterMeetingsByDateRange(meetings, now, futureDate)
}

