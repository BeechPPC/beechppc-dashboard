'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, MapPin, Users, Mail } from 'lucide-react'

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
  const [days, setDays] = useState(7)

  const fetchMeetings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/meetings?days=${days}`)
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
  }, [days])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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

  const upcomingMeetings = meetings.filter((m) => isUpcoming(m.startTime))
  const pastMeetings = meetings.filter((m) => !isUpcoming(m.startTime))

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upcoming Meetings</h1>
        <p className="text-gray-600">
          Meetings extracted from your email calendar invites
        </p>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="days" className="text-sm font-medium text-gray-700">
          Show meetings for next:
        </label>
        <select
          id="days"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value={1}>1 day</option>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
        <button
          onClick={fetchMeetings}
          className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <p className="mt-2 text-gray-600">Loading meetings...</p>
        </div>
      )}

      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-800">{error}</p>
          <p className="text-sm text-red-600 mt-2">
            Make sure your email credentials are configured in the settings.
          </p>
        </Card>
      )}

      {!loading && !error && (
        <>
          {upcomingMeetings.length === 0 && pastMeetings.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No meetings found
              </h3>
              <p className="text-gray-600">
                No meetings were found in your emails for the next {days} days.
              </p>
            </Card>
          ) : (
            <>
              {upcomingMeetings.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Upcoming ({upcomingMeetings.length})
                  </h2>
                  <div className="space-y-4">
                    {upcomingMeetings.map((meeting) => (
                      <Card
                        key={meeting.id}
                        className={`p-6 ${
                          isToday(meeting.startTime)
                            ? 'border-amber-500 border-2 bg-amber-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {meeting.title}
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(meeting.startTime)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatTime(meeting.startTime)} -{' '}
                                  {formatTime(meeting.endTime)}
                                </span>
                              </div>
                              {meeting.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{meeting.location}</span>
                                </div>
                              )}
                              {meeting.organizer && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span>Organizer: {meeting.organizer}</span>
                                </div>
                              )}
                              {meeting.attendees.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>
                                    {meeting.attendees.length} attendee
                                    {meeting.attendees.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                            {meeting.description && (
                              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                                {meeting.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {pastMeetings.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Past ({pastMeetings.length})
                  </h2>
                  <div className="space-y-4">
                    {pastMeetings.map((meeting) => (
                      <Card
                        key={meeting.id}
                        className="p-6 border-gray-200 bg-gray-50 opacity-75"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                              {meeting.title}
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(meeting.startTime)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {formatTime(meeting.startTime)} -{' '}
                                  {formatTime(meeting.endTime)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

