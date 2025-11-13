'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, Eye, CheckCircle, XCircle, Loader2, FileText, Clock, Save, Calendar, Download, TrendingUp } from 'lucide-react'
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

  // Monthly Report Builder state
  const [monthlyAccounts, setMonthlyAccounts] = useState<string[]>([])
  const [monthlyDateRange, setMonthlyDateRange] = useState('this_month')
  const [monthlyCustomFrom, setMonthlyCustomFrom] = useState('')
  const [monthlyCustomTo, setMonthlyCustomTo] = useState('')
  const [monthlySections, setMonthlySections] = useState({
    campaigns: true,
    keywords: true,
    auctionInsights: true,
    qualityScore: true,
    geographic: false,
    device: false,
    adSchedule: false,
    searchTerms: false,
    conversions: true,
  })
  const [monthlyTemplate, setMonthlyTemplate] = useState('detailed')
  const [monthlyRecipients, setMonthlyRecipients] = useState('chris@beechppc.com')
  const [generatingMonthly, setGeneratingMonthly] = useState(false)
  const [monthlyResult, setMonthlyResult] = useState<{ success: boolean; message: string; reportId?: string } | null>(null)

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

  const handleToggleAccount = (accountId: string) => {
    setMonthlyAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleToggleAllAccounts = () => {
    if (monthlyAccounts.length === accounts.length) {
      setMonthlyAccounts([])
    } else {
      setMonthlyAccounts(accounts.map(a => a.id))
    }
  }

  const handleToggleSection = (section: keyof typeof monthlySections) => {
    setMonthlySections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleGenerateMonthlyReport = async () => {
    if (monthlyAccounts.length === 0) {
      setMonthlyResult({ success: false, message: 'Please select at least one account' })
      return
    }

    setGeneratingMonthly(true)
    setMonthlyResult(null)

    try {
      // Determine date range
      let dateFrom = ''
      let dateTo = ''

      if (monthlyDateRange === 'this_month') {
        const now = new Date()
        dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        dateTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      } else if (monthlyDateRange === 'last_month') {
        const now = new Date()
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
        dateFrom = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`
        dateTo = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      } else {
        dateFrom = monthlyCustomFrom
        dateTo = monthlyCustomTo
      }

      if (!dateFrom || !dateTo) {
        setMonthlyResult({ success: false, message: 'Please select a valid date range' })
        setGeneratingMonthly(false)
        return
      }

      const res = await fetch('/api/reports/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: monthlyAccounts,
          dateFrom,
          dateTo,
          sections: monthlySections,
          template: monthlyTemplate,
          recipients: monthlyRecipients.split(',').map(email => email.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMonthlyResult({
          success: true,
          message: data.message || 'Monthly report generated and sent successfully!',
          reportId: data.reportId,
        })
      } else {
        setMonthlyResult({
          success: false,
          message: data.error || 'Failed to generate monthly report',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setMonthlyResult({
        success: false,
        message,
      })
    } finally {
      setGeneratingMonthly(false)
    }
  }

  const handleDownloadPDF = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/download/${reportId}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `monthly-report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF')
    }
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

      {/* Monthly Report Builder Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Report Builder
          </CardTitle>
          <CardDescription>
            Generate comprehensive monthly reports for selected accounts with customizable sections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Account Multi-Select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Select Accounts ({monthlyAccounts.length} selected)
                  </label>
                  <Button
                    onClick={handleToggleAllAccounts}
                    variant="outline"
                    size="sm"
                  >
                    {monthlyAccounts.length === accounts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {accounts.map((account) => (
                    <label
                      key={account.id}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={monthlyAccounts.includes(account.id)}
                        onChange={() => handleToggleAccount(account.id)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm">{account.name}</span>
                    </label>
                  ))}
                  {accounts.length === 0 && (
                    <p className="text-sm text-muted text-center py-4">
                      No accounts found. Please check your Google Ads API configuration.
                    </p>
                  )}
                </div>
              </div>

              {/* Date Range Picker */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date Range
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setMonthlyDateRange('this_month')}
                      variant={monthlyDateRange === 'this_month' ? 'default' : 'outline'}
                      size="sm"
                    >
                      This Month
                    </Button>
                    <Button
                      onClick={() => setMonthlyDateRange('last_month')}
                      variant={monthlyDateRange === 'last_month' ? 'default' : 'outline'}
                      size="sm"
                    >
                      Last Month
                    </Button>
                    <Button
                      onClick={() => setMonthlyDateRange('custom')}
                      variant={monthlyDateRange === 'custom' ? 'default' : 'outline'}
                      size="sm"
                    >
                      Custom Range
                    </Button>
                  </div>
                  {monthlyDateRange === 'custom' && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-muted mb-1">From</label>
                        <input
                          type="date"
                          value={monthlyCustomFrom}
                          onChange={(e) => setMonthlyCustomFrom(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-muted mb-1">To</label>
                        <input
                          type="date"
                          value={monthlyCustomTo}
                          onChange={(e) => setMonthlyCustomTo(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Sections */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Report Sections
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries({
                    campaigns: 'Campaign Performance',
                    keywords: 'Keyword Analysis',
                    auctionInsights: 'Auction Insights',
                    qualityScore: 'Quality Score',
                    geographic: 'Geographic Performance',
                    device: 'Device Performance',
                    adSchedule: 'Ad Schedule',
                    searchTerms: 'Search Terms',
                    conversions: 'Conversion Tracking',
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={monthlySections[key as keyof typeof monthlySections]}
                        onChange={() => handleToggleSection(key as keyof typeof monthlySections)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Report Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'executive', label: 'Executive Summary' },
                    { id: 'detailed', label: 'Detailed Performance' },
                    { id: 'auction', label: 'Auction Insights Focus' },
                    { id: 'keyword', label: 'Keyword Deep Dive' },
                    { id: 'custom', label: 'Custom Report' },
                  ].map((template) => (
                    <Button
                      key={template.id}
                      onClick={() => setMonthlyTemplate(template.id)}
                      variant={monthlyTemplate === template.id ? 'default' : 'outline'}
                      size="sm"
                    >
                      {template.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Recipients
                </label>
                <input
                  type="text"
                  value={monthlyRecipients}
                  onChange={(e) => setMonthlyRecipients(e.target.value)}
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
                  onClick={handleGenerateMonthlyReport}
                  disabled={generatingMonthly || monthlyAccounts.length === 0 || !monthlyRecipients.trim()}
                  size="lg"
                  className="flex-1"
                >
                  {generatingMonthly ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Generate & Send Report
                    </>
                  )}
                </Button>
                {monthlyResult?.reportId && (
                  <Button
                    onClick={() => handleDownloadPDF(monthlyResult.reportId!)}
                    variant="outline"
                    size="lg"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                )}
              </div>

              {/* Result Message */}
              {monthlyResult && (
                <div
                  className={`flex items-center gap-2 p-4 rounded-lg ${
                    monthlyResult.success
                      ? 'bg-success/10 text-success'
                      : 'bg-error/10 text-error'
                  }`}
                >
                  {monthlyResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span>{monthlyResult.message}</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
