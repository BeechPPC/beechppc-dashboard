'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'

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

interface MeetingsCalendarProps {
  meetings: Meeting[]
  currentMonth: Date
  onMonthChange: (month: Date) => void
  onDateClick?: (date: Date) => void
}

export function MeetingsCalendar({ meetings, currentMonth, onMonthChange, onDateClick }: MeetingsCalendarProps) {

  // Get first day of current month
  const firstDayOfMonth = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  }, [currentMonth])

  // Get last day of current month
  const lastDayOfMonth = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  }, [currentMonth])

  // Get first day of calendar grid (might be from previous month)
  const startDate = useMemo(() => {
    const start = new Date(firstDayOfMonth)
    const dayOfWeek = start.getDay()
    // Start from Sunday (0) - adjust if you want Monday (1) as start
    start.setDate(start.getDate() - dayOfWeek)
    return start
  }, [firstDayOfMonth])

  // Get last day of calendar grid (might be from next month)
  const endDate = useMemo(() => {
    const end = new Date(lastDayOfMonth)
    const dayOfWeek = end.getDay()
    // Fill to Saturday (6)
    end.setDate(end.getDate() + (6 - dayOfWeek))
    return end
  }, [lastDayOfMonth])

  // Generate all days in the calendar grid
  const calendarDays = useMemo(() => {
    const days: Date[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }, [startDate, endDate])

  // Group meetings by date (YYYY-MM-DD)
  const meetingsByDate = useMemo(() => {
    const grouped: Record<string, Meeting[]> = {}
    meetings.forEach((meeting) => {
      const date = new Date(meeting.startTime)
      const dateKey = formatDateKey(date)
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(meeting)
    })
    return grouped
  }, [meetings])

  const formatDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()
  }

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    onMonthChange(newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    onMonthChange(newMonth)
  }

  const goToToday = () => {
    onMonthChange(new Date())
  }

  const monthName = currentMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dateKey = formatDateKey(date)
            const dayMeetings = meetingsByDate[dateKey] || []
            const isCurrentMonthDay = isCurrentMonth(date)
            const isTodayDay = isToday(date)

            return (
              <div
                key={index}
                onClick={() => onDateClick?.(date)}
                className={`
                  min-h-[100px] p-2 border border-gray-200 rounded-md
                  ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'}
                  ${isTodayDay ? 'ring-2 ring-amber-500' : ''}
                  ${onDateClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  transition-colors
                `}
              >
                <div
                  className={`
                    text-sm font-medium mb-1
                    ${isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}
                    ${isTodayDay ? 'text-amber-600 font-bold' : ''}
                  `}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayMeetings.slice(0, 3).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded truncate"
                      title={meeting.title}
                    >
                      {meeting.title}
                    </div>
                  ))}
                  {dayMeetings.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayMeetings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

