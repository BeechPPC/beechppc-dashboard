'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, Eye, Mail, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react'

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
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [recipients, setRecipients] = useState('chris@beechppc.com')
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [loadingData, setLoadingData] = useState(true)

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-b border-border">
              <span className="text-sm font-medium">Schedule</span>
              <span className="text-xs sm:text-sm text-muted">Daily at 11:00 AM Melbourne Time</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-b border-border">
              <span className="text-sm font-medium">Recipients</span>
              <span className="text-xs sm:text-sm text-muted break-all">chris@beechppc.com</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
              <span className="text-sm font-medium">Status</span>
              <span className="flex items-center gap-2 text-sm text-success">
                <div className="h-2 w-2 rounded-full bg-success" />
                Active
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs sm:text-sm text-muted">
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
