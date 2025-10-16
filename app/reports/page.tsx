'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, Eye, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function ReportsPage() {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [recipients, setRecipients] = useState('chris@beechppc.com')

  const handleSendReport = async () => {
    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/reports/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: recipients.split(',').map(email => email.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({
          success: true,
          message: `Report sent successfully to ${data.recipients.length} recipient(s)!`,
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to send report',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setResult({
        success: false,
        message,
      })
    } finally {
      setSending(false)
    }
  }

  const handlePreview = () => {
    window.open('/api/reports/preview', '_blank')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted mt-2">
          Generate and send daily MCC performance reports
        </p>
      </div>

      {/* Send Report Card */}
      <Card>
        <CardHeader>
          <CardTitle>Send Daily Report</CardTitle>
          <CardDescription>
            Generate and send a report with yesterday&apos;s performance data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipients Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Recipients
            </label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="email1@example.com, email2@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted mt-1">
              Separate multiple emails with commas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSendReport}
              disabled={sending || !recipients.trim()}
              size="lg"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Report Now
                </>
              )}
            </Button>

            <Button
              onClick={handlePreview}
              variant="outline"
              size="lg"
            >
              <Eye className="h-4 w-4" />
              Preview Report
            </Button>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                result.success
                  ? 'bg-success/10 text-success'
                  : 'bg-error/10 text-error'
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>
            Automatic daily reports are configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium">Schedule</span>
              <span className="text-sm text-muted">Daily at 11:00 AM Melbourne Time</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm font-medium">Recipients</span>
              <span className="text-sm text-muted">chris@beechppc.com</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Status</span>
              <span className="flex items-center gap-2 text-sm text-success">
                <div className="h-2 w-2 rounded-full bg-success" />
                Active
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted">
              <Mail className="inline h-4 w-4 mr-1" />
              Reports are automatically generated and sent daily from your localhost service.
              Use the manual send button above to send a report on-demand.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Historical Reports (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Reports</CardTitle>
          <CardDescription>
            View previously sent reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted">
            <p>Historical report tracking will be available once database is configured.</p>
            <p className="text-sm mt-2">Coming soon in the next update!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
