'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Loader2, Plus, MoreVertical, Power, PowerOff, Edit, Trash2 } from 'lucide-react'
import cronstrue from 'cronstrue'
import type { ReportSchedule } from '@/lib/types/reports'
import { ScheduleModal } from './ScheduleModal'

export function SchedulesList() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null)
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null)

  // Load schedules when component mounts
  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/reports/schedules')
      const data = await res.json()

      if (data.success) {
        setSchedules(data.schedules)
      } else {
        console.error('Failed to load schedules:', data.error)
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSchedule = async (scheduleId: string, currentEnabled: boolean) => {
    try {
      setTogglingId(scheduleId)

      const res = await fetch(`/api/reports/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      })

      const data = await res.json()

      if (data.success) {
        // Update local state
        setSchedules((prev) =>
          prev.map((schedule) =>
            schedule.id === scheduleId
              ? { ...schedule, enabled: !currentEnabled }
              : schedule
          )
        )
      } else {
        alert('Failed to toggle schedule: ' + data.error)
      }
    } catch (error) {
      console.error('Error toggling schedule:', error)
      alert('Failed to toggle schedule')
    } finally {
      setTogglingId(null)
    }
  }

  const getRecipientCount = (recipientEmails: any) => {
    if (Array.isArray(recipientEmails)) {
      return recipientEmails.length
    }
    if (typeof recipientEmails === 'string') {
      return recipientEmails.split(',').filter(Boolean).length
    }
    return 0
  }

  const handleCreateSchedule = () => {
    setEditingSchedule(null)
    setModalOpen(true)
  }

  const handleEditSchedule = (schedule: ReportSchedule) => {
    setEditingSchedule(schedule)
    setModalOpen(true)
    setShowMoreMenu(null)
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return
    }

    try {
      const res = await fetch(`/api/reports/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId))
      } else {
        alert('Failed to delete schedule: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert('Failed to delete schedule')
    } finally {
      setShowMoreMenu(null)
    }
  }

  const handleModalSuccess = () => {
    loadSchedules()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMoreMenu(null)
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreMenu])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>
            Manage automated report schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>
                Manage automated report schedules
              </CardDescription>
            </div>
            <Button onClick={handleCreateSchedule}>
              <Plus className="h-4 w-4" />
              New Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No schedules yet</h3>
              <p className="text-muted mb-4">
                Create your first automated report schedule to get started
              </p>
              <Button onClick={handleCreateSchedule}>
                <Plus className="h-4 w-4" />
                Create Schedule
              </Button>
            </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Schedule Name and Status */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{schedule.name}</h3>
                      {schedule.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                          <div className="h-1.5 w-1.5 rounded-full bg-success" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted" />
                          Paused
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {schedule.description && (
                      <p className="text-sm text-muted mb-3">{schedule.description}</p>
                    )}

                    {/* Schedule Details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted" />
                        <span>
                          {(() => {
                            try {
                              return cronstrue.toString(schedule.cronSchedule)
                            } catch (e) {
                              return schedule.cronSchedule
                            }
                          })()}
                        </span>
                      </div>
                      <div className="text-muted">
                        {schedule.timezone}
                      </div>
                      <div className="text-muted">
                        → {getRecipientCount(schedule.recipientEmails)} recipient{getRecipientCount(schedule.recipientEmails) !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Last Run Status */}
                    {schedule.lastRunAt && (
                      <div className="mt-2 text-xs text-muted">
                        Last sent: {new Date(schedule.lastRunAt).toLocaleString()}
                        {schedule.lastRunStatus && ` (${schedule.lastRunStatus})`}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4 relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSchedule(schedule.id, schedule.enabled)}
                      disabled={togglingId === schedule.id}
                    >
                      {togglingId === schedule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : schedule.enabled ? (
                        <>
                          <PowerOff className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4" />
                          Resume
                        </>
                      )}
                    </Button>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMoreMenu(showMoreMenu === schedule.id ? null : schedule.id)
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                      {showMoreMenu === schedule.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border py-1 z-50">
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Schedule
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Schedule
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <ScheduleModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      onSuccess={handleModalSuccess}
      schedule={editingSchedule}
    />
    </>
  )
}