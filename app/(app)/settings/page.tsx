'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Mail, Save, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [schedule, setSchedule] = useState('0 11 * * *')
  const [timezone, setTimezone] = useState('Australia/Melbourne')
  const [recipients, setRecipients] = useState('chris@beechppc.com')

  const handleSave = () => {
    // In a real implementation, this would call an API
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted mt-2 text-sm sm:text-base">
          Configure your daily report preferences and notifications
        </p>
      </div>

      {/* Report Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Report Schedule
          </CardTitle>
          <CardDescription>
            Configure when daily reports are automatically sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Schedule (Cron Expression)
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="0 11 * * *"
            />
            <p className="text-xs text-muted mt-1">
              Current: Daily at 11:00 AM
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Australia/Melbourne">Australia/Melbourne</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
              <option value="Australia/Brisbane">Australia/Brisbane</option>
              <option value="Australia/Perth">Australia/Perth</option>
              <option value="Pacific/Auckland">New Zealand (Auckland)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs sm:text-sm text-muted">
              <strong>Note:</strong> Schedule changes require restarting the localhost service to take effect.
              Update the <code className="bg-muted/20 px-1 py-0.5 rounded text-xs">REPORT_SCHEDULE</code> and{' '}
              <code className="bg-muted/20 px-1 py-0.5 rounded text-xs">TIMEZONE</code> values in your{' '}
              <code className="bg-muted/20 px-1 py-0.5 rounded text-xs">.env</code> file.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Recipients
          </CardTitle>
          <CardDescription>
            Manage who receives the daily reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Default Recipients
            </label>
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="email1@example.com, email2@example.com"
            />
            <p className="text-xs text-muted mt-1">
              Separate multiple emails with commas
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs sm:text-sm text-muted">
              <strong>Note:</strong> To update default recipients for scheduled reports, modify the{' '}
              <code className="bg-muted/20 px-1 py-0.5 rounded text-xs">EMAIL_TO</code> value in your{' '}
              <code className="bg-muted/20 px-1 py-0.5 rounded text-xs">.env</code> file and restart the service.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Ads API */}
      <Card>
        <CardHeader>
          <CardTitle>Google Ads API Configuration</CardTitle>
          <CardDescription>
            Your Google Ads API connection details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-b border-border">
            <span className="text-sm font-medium">MCC Account ID</span>
            <span className="text-xs sm:text-sm text-muted font-mono break-all">6695445119</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-b border-border">
            <span className="text-sm font-medium">API Status</span>
            <span className="flex items-center gap-2 text-sm text-success">
              <div className="h-2 w-2 rounded-full bg-success" />
              Connected
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
            <span className="text-sm font-medium">Developer Token</span>
            <span className="text-xs sm:text-sm text-muted font-mono break-all">gxL-KFFY***</span>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs sm:text-sm text-muted">
              API credentials are configured in your <code className="bg-muted/20 px-1 py-0.5 rounded text-xs">.env.local</code> file.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-primary-light/50 rounded-lg border border-primary/20">
        <p className="text-xs sm:text-sm">
          {saved ? (
            <span className="flex items-center gap-2 text-success">
              <CheckCircle className="h-4 w-4" />
              Settings saved successfully!
            </span>
          ) : (
            'Settings are managed through environment variables for security.'
          )}
        </p>
        {!saved && (
          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        )}
      </div>
    </div>
  )
}
