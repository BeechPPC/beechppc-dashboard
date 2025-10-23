'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, Eye, CheckCircle, XCircle, Loader2, FileText, Clock, Save } from 'lucide-react'
import { useSettings } from '@/lib/settings/context'

interface ReportTemplate {
  id: string
  name: string
  description: string
  dateRange: string
  type: string
}

interface Account {
  id: string
  name: string
}

export default function ReportsPage() {
  const { settings, updateSettings } = useSettings()
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [recipients, setRecipients] = useState('chris@beechppc.com')
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [loadingData, setLoadingData] = useState(true)

  // Schedule settings
  const [schedule, setSchedule] = useState(settings.schedule || '0 11 * * *')
  const [timezone, setTimezone] = useState(settings.timezone || 'Australia/Melbourne')
  const [defaultRecipients, setDefaultRecipients] = useState(settings.recipients || 'chris@beechppc.com')
  const [scheduleSaved, setScheduleSaved] = useState(false)

  // Sync with settings changes
  useEffect(() => {
    setSchedule(settings.schedule || '0 11 * * *')
    setTimezone(settings.timezone || 'Australia/Melbourne')
    setDefaultRecipients(settings.recipients || 'chris@beechppc.com')
    setRecipients(settings.recipients || 'chris@beechppc.com')
  }, [settings])

  // Load templates and accounts on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesRes, accountsRes] = await Promise.all([
          fetch('/api/reports/templates'),
          fetch('/api/google-ads/accounts'),
        ])

        const templatesData = await templatesRes.json()
        const accountsData = await accountsRes.json()

        if (templatesData.success) {
          setTemplates(templatesData.templates)
          if (templatesData.templates.length > 0) {
            setSelectedTemplate(templatesData.templates[0].id)
          }
        }

        if (accountsData.success) {
          setAccounts(accountsData.accounts)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  const handleSaveSchedule = async () => {
    try {
      await updateSettings({
        schedule,
        timezone,
        recipients: defaultRecipients,
      })
      setScheduleSaved(true)
      setTimeout(() => setScheduleSaved(false), 3000)
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule settings')
    }
  }

  const handleSendTemplateReport = async () => {
    if (!selectedTemplate) {
      setResult({ success: false, message: 'Please select a report template' })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/reports/template-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          accountId: selectedAccount === 'all' ? null : selectedAccount,
          recipients: recipients.split(',').map(email => email.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({
          success: true,
          message: data.message || 'Report sent successfully!',
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

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted mt-2 text-sm sm:text-base">
          Generate and send performance reports from pre-made templates
        </p>
      </div>

      {/* Template Report Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Reports
          </CardTitle>
          <CardDescription>
            Select a pre-made report template and send to recipients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Report Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplateData && (
                  <p className="text-xs text-muted mt-1">
                    {selectedTemplateData.description}
                  </p>
                )}
              </div>

              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

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

              {/* Action Button */}
              <Button
                onClick={handleSendTemplateReport}
                disabled={sending || !recipients.trim() || !selectedTemplate}
                size="lg"
                className="w-full"
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Daily Standard Report Card */}
      <Card>
        <CardHeader>
          <CardTitle>Send Daily Standard Report</CardTitle>
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSendReport}
              disabled={sending || !recipients.trim()}
              size="lg"
              className="w-full sm:w-auto"
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
              className="w-full sm:w-auto"
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

      {/* Report Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>
            Configure automatic daily report schedule and default recipients
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
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="Australia/Melbourne">Australia/Melbourne</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
              <option value="Australia/Brisbane">Australia/Brisbane</option>
              <option value="Australia/Perth">Australia/Perth</option>
              <option value="Pacific/Auckland">New Zealand (Auckland)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Default Recipients
            </label>
            <input
              type="text"
              value={defaultRecipients}
              onChange={(e) => setDefaultRecipients(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="email1@example.com, email2@example.com"
            />
            <p className="text-xs text-muted mt-1">
              Separate multiple emails with commas
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm text-success">Active</span>
            </div>
            <Button onClick={handleSaveSchedule} disabled={scheduleSaved}>
              {scheduleSaved ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Schedule
                </>
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs sm:text-sm text-muted">
              <strong>Note:</strong> Schedule changes require restarting the service or updating GitHub Actions workflow.
              Reports are automatically generated and sent daily. Use the manual send buttons above to send on-demand.
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
