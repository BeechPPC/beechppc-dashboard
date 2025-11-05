'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Trash2, Calendar } from 'lucide-react'

interface MeetingNote {
  id: string
  date: string
  note: string
  createdAt: string
}

interface MeetingNotesProps {
  accountId: string
}

export function MeetingNotes({ accountId }: MeetingNotesProps) {
  const [notes, setNotes] = useState<MeetingNote[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  const loadNotes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/clients/${accountId}/meeting-notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to load meeting notes')
      }
    } catch (error) {
      console.error('Error loading meeting notes:', error)
      setError('Failed to load meeting notes. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.note.trim()) {
      setError('Please enter a note')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await fetch(`/api/clients/${accountId}/meeting-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess('Meeting note saved successfully!')
        setFormData({
          date: new Date().toISOString().split('T')[0],
          note: '',
        })
        setShowForm(false)
        await loadNotes()
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to save meeting note. Please try again.')
      }
    } catch (error) {
      console.error('Error saving meeting note:', error)
      setError('Failed to save meeting note. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this meeting note?')) return

    try {
      const response = await fetch(
        `/api/clients/${accountId}/meeting-notes?noteId=${noteId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        loadNotes()
      }
    } catch (error) {
      console.error('Error deleting meeting note:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Meeting Notes</CardTitle>
            <CardDescription>
              Track client calls and important discussions
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            variant={showForm ? 'outline' : 'default'}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Cancel' : 'Add Note'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Add Note Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="meeting-date">Meeting Date</Label>
              <Input
                id="meeting-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-note">Notes</Label>
              <Textarea
                id="meeting-note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Enter meeting notes, discussion points, action items, etc."
                rows={6}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Note'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    note: '',
                  })
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Notes List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No meeting notes yet</p>
            <p className="text-sm mt-1">Click &quot;Add Note&quot; to record your first meeting</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted" />
                      <span className="text-sm font-medium text-muted">
                        {formatDate(note.date)}
                      </span>
                      <span className="text-xs text-muted">
                        • {new Date(note.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(note.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

