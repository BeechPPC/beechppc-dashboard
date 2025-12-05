'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Calendar as CalendarIcon, Clock, MapPin, Users, Mail, RefreshCw } from 'lucide-react'
import { MeetingsCalendar } from '@/components/meetings/meetings-calendar'

interface Meeting {
  id: string
  title: string
  startTime: string
  endTime: string
  location?: string
  organizer: string
  attendees: string[]
  description?: string
  source: string
  emailSubject: string
  emailFrom: string
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const fetchMeetings = useCallback(async (month: Date) => {
    setLoading(true)
    setError(null)
    try {
      const year = month.getFullYear()
      
      // Calculate start and end of month for the calendar view
      const startOfMonth = new Date(year, month.getMonth(), 1)
      const endOfMonth = new Date(year, month.getMonth() + 1, 0, 23, 59, 59)
      
      // Also include a week before and after for calendar grid
      const calendarStart = new Date(startOfMonth)
      calendarStart.setDate(calendarStart.getDate() - 7)
      const calendarEnd = new Date(endOfMonth)
      calendarEnd.setDate(calendarEnd.getDate() + 7)

      const response = await fetch(
        `/api/meetings?startDate=${formatDateForAPI(calendarStart)}&endDate=${formatDateForAPI(calendarEnd)}&limit=100`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch meetings')
      }

      setMeetings(data.meetings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings')
      console.error('Error fetching meetings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMeetings(currentMonth)
  }, [currentMonth, fetchMeetings])

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  // Get meetings for selected date
  const selectedDateMeetings = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.startTime)
      const meetingDateKey = `${meetingDate.getFullYear()}-${String(meetingDate.getMonth() + 1).padStart(2, '0')}-${String(meetingDate.getDate()).padStart(2, '0')}`
      return meetingDateKey === dateKey
    })
  }, [selectedDate, meetings])

  const upcomingMeetings = meetings.filter((m) => isUpcoming(m.startTime))
  const pastMeetings = meetings.filter((m) => !isUpcoming(m.startTime))

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meetings Calendar</h1>
        <p className="text-gray-600">
          Meetings extracted from your email calendar invites
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => fetchMeetings(currentMonth)}
          disabled={loading}
          className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <Card className="p-6 bg-red-50 border-red-200 mb-6">
          <p className="text-red-800">{error}</p>
          <p className="text-sm text-red-600 mt-2">
            Make sure your email credentials are configured in the settings.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                <p className="mt-2 text-gray-600">Loading meetings...</p>
              </div>
            </Card>
          ) : (
            <MeetingsCalendar
              meetings={meetings}
              currentMonth={currentMonth}
              onMonthChange={handleMonthChange}
              onDateClick={(date) => setSelectedDate(date)}
            />
          )}
        </div>

        {/* Sidebar - Selected Date Meetings or Summary */}
        <div className="lg:col-span-1">
          {selectedDate ? (
            <Card className="p-6 sticky top-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedDate.toLocaleDateString('en-AU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h2>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  Clear selection
                </button>
              </div>

              {selectedDateMeetings.length === 0 ? (
                <p className="text-gray-500 text-sm">No meetings on this date</p>
              ) : (
                <div className="space-y-4">
                  {selectedDateMeetings.map((meeting) => (
                    <Card
                      key={meeting.id}
                      className={`p-4 ${
                        isToday(meeting.startTime)
                          ? 'border-amber-500 border-2 bg-amber-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {meeting.title}
                      </h3>
                      <div className="space-y-1.5 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatTime(meeting.startTime)} -{' '}
                            {formatTime(meeting.endTime)}
                          </span>
                        </div>
                        {meeting.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{meeting.location}</span>
                          </div>
                        )}
                        {meeting.organizer && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{meeting.organizer}</span>
                          </div>
                        )}
                        {meeting.attendees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5" />
                            <span>
                              {meeting.attendees.length} attendee
                              {meeting.attendees.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      {meeting.description && (
                        <p className="mt-2 text-xs text-gray-600 line-clamp-3">
                          {meeting.description}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Summary
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Upcoming Meetings</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {upcomingMeetings.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Past Meetings</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {pastMeetings.length}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Click on a date in the calendar to view meetings for that day.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {!loading && !error && meetings.length === 0 && (
        <Card className="p-12 text-center mt-6">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No meetings found
          </h3>
          <p className="text-gray-600">
            No meetings were found in your emails. Try refreshing or check your email settings.
          </p>
        </Card>
      )}
    </div>
  )
}

