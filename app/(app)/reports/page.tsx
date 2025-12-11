'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, Eye, CheckCircle, XCircle, Loader2, FileText, Clock, Save, Calendar, Download, TrendingUp } from 'lucide-react'
import { useSettings } from '@/lib/settings/context'
import cronstrue from 'cronstrue'

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

  // Tab state
  const [activeTab, setActiveTab] = useState<'create' | 'scheduled' | 'history'>('create')

  // Common state
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Email validation helper
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  const parseRecipients = (recipientsString: string) => {
    const emails = recipientsString.split(',').map(e => e.trim()).filter(Boolean)
    const valid = emails.filter(validateEmail)
    const invalid = emails.filter(e => !validateEmail(e))
    return { valid, invalid, total: emails.length }
  }

  // CREATE REPORT TAB STATE
  const [reportType, setReportType] = useState<'quick' | 'custom' | 'template'>('quick')
  const [recipients, setRecipients] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Quick Daily Report - no additional state needed

  // Custom Report State
  const [customAccounts, setCustomAccounts] = useState<string[]>([])
  const [customDateRange, setCustomDateRange] = useState('this_month')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [customSections, setCustomSections] = useState({
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
  const [customTemplate, setCustomTemplate] = useState('detailed')
  const [generatingCustom, setGeneratingCustom] = useState(false)
  const [customResult, setCustomResult] = useState<{ success: boolean; message: string; reportId?: string } | null>(null)

  // Template Report State
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')

  // SCHEDULED REPORTS TAB STATE
  const [schedule, setSchedule] = useState(settings.schedule || '0 11 * * *')
  const [timezone, setTimezone] = useState(settings.timezone || 'Australia/Melbourne')
  const [defaultRecipients, setDefaultRecipients] = useState(settings.recipients || '')
  const [scheduleSaved, setScheduleSaved] = useState(false)

  // User-friendly schedule settings
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [scheduleHour, setScheduleHour] = useState('11')
  const [scheduleMinute, setScheduleMinute] = useState('00')
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState('1')
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState('1')

  // Parse existing cron to populate UI
  useEffect(() => {
    const parts = schedule.split(' ')
    if (parts.length === 5) {
      setScheduleMinute(parts[0])
      setScheduleHour(parts[1])

      if (parts[4] !== '*') {
        setScheduleFrequency('weekly')
        setScheduleDayOfWeek(parts[4])
      } else if (parts[2] !== '*') {
        setScheduleFrequency('monthly')
        setScheduleDayOfMonth(parts[2])
      } else {
        setScheduleFrequency('daily')
      }
    }
  }, [schedule])

  // Generate cron from user-friendly inputs
  const generateCronExpression = () => {
    const minute = scheduleMinute
    const hour = scheduleHour

    switch (scheduleFrequency) {
      case 'daily':
        return `${minute} ${hour} * * *`
      case 'weekly':
        return `${minute} ${hour} * * ${scheduleDayOfWeek}`
      case 'monthly':
        return `${minute} ${hour} ${scheduleDayOfMonth} * *`
      default:
        return `${minute} ${hour} * * *`
    }
  }

  // Update cron when user-friendly inputs change
  useEffect(() => {
    const newCron = generateCronExpression()
    setSchedule(newCron)
  }, [scheduleFrequency, scheduleHour, scheduleMinute, scheduleDayOfWeek, scheduleDayOfMonth])

  // Sync with settings changes
  useEffect(() => {
    setSchedule(settings.schedule || '0 11 * * *')
    setTimezone(settings.timezone || 'Australia/Melbourne')
    setDefaultRecipients(settings.recipients || '')
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

  // HANDLERS

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

  const handleSendQuickReport = async () => {
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

  const handleSendCustomReport = async () => {
    if (customAccounts.length === 0) {
      setCustomResult({ success: false, message: 'Please select at least one account' })
      return
    }

    setGeneratingCustom(true)
    setCustomResult(null)

    try {
      let dateFrom = ''
      let dateTo = ''

      if (customDateRange === 'this_month') {
        const now = new Date()
        dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        dateTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      } else if (customDateRange === 'last_month') {
        const now = new Date()
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
        dateFrom = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`
        dateTo = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      } else {
        dateFrom = customDateFrom
        dateTo = customDateTo
      }

      if (!dateFrom || !dateTo) {
        setCustomResult({ success: false, message: 'Please select a valid date range' })
        setGeneratingCustom(false)
        return
      }

      const res = await fetch('/api/reports/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: customAccounts,
          dateFrom,
          dateTo,
          sections: customSections,
          template: customTemplate,
          recipients: recipients.split(',').map(email => email.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()

      if (data.success) {
        setCustomResult({
          success: true,
          message: data.message || 'Custom report generated and sent successfully!',
          reportId: data.reportId,
        })
      } else {
        setCustomResult({
          success: false,
          message: data.error || 'Failed to generate custom report',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setCustomResult({
        success: false,
        message,
      })
    } finally {
      setGeneratingCustom(false)
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

  const handlePreview = () => {
    window.open('/api/reports/preview', '_blank')
  }

  const handleToggleAccount = (accountId: string) => {
    setCustomAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleToggleAllAccounts = () => {
    if (customAccounts.length === accounts.length) {
      setCustomAccounts([])
    } else {
      setCustomAccounts(accounts.map(a => a.id))
    }
  }

  const handleToggleSection = (section: keyof typeof customSections) => {
    setCustomSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleDownloadPDF = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/download/${reportId}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}.pdf`
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
          Generate and schedule Google Ads performance reports
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'create'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Create Report
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'scheduled'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Scheduled Reports
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* CREATE REPORT TAB */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Step 1: Choose Report Type */}
          <Card>
            <CardHeader>
              <CardTitle>1️⃣ Choose Report Type</CardTitle>
              <CardDescription>Select the type of report you want to create</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setReportType('quick')
                    setResult(null)
                    setCustomResult(null)
                  }}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    reportType === 'quick'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Clock className="h-8 w-8 mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Quick Daily</h3>
                  <p className="text-sm text-muted">Yesterday&apos;s performance across all accounts</p>
                </button>

                <button
                  onClick={() => {
                    setReportType('custom')
                    setResult(null)
                    setCustomResult(null)
                  }}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    reportType === 'custom'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <TrendingUp className="h-8 w-8 mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Custom Report</h3>
                  <p className="text-sm text-muted">Choose your own metrics, dates, and accounts</p>
                </button>

                <button
                  onClick={() => {
                    setReportType('template')
                    setResult(null)
                    setCustomResult(null)
                  }}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    reportType === 'template'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <FileText className="h-8 w-8 mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Template Report</h3>
                  <p className="text-sm text-muted">Pre-configured professional layouts</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Configure Report (conditional) */}
          {reportType !== 'quick' && (
            <Card>
              <CardHeader>
                <CardTitle>2️⃣ Configure Report</CardTitle>
                <CardDescription>
                  {reportType === 'custom' && 'Customize your report with specific metrics and date ranges'}
                  {reportType === 'template' && 'Select a template and account scope'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {reportType === 'custom' && (
                      <>
                        {/* Account Multi-Select */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">
                              Select Accounts ({customAccounts.length} selected)
                            </label>
                            <Button
                              onClick={handleToggleAllAccounts}
                              variant="outline"
                              size="sm"
                            >
                              {customAccounts.length === accounts.length ? 'Deselect All' : 'Select All'}
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
                                  checked={customAccounts.includes(account.id)}
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
                                onClick={() => setCustomDateRange('this_month')}
                                variant={customDateRange === 'this_month' ? 'default' : 'outline'}
                                size="sm"
                              >
                                This Month
                              </Button>
                              <Button
                                onClick={() => setCustomDateRange('last_month')}
                                variant={customDateRange === 'last_month' ? 'default' : 'outline'}
                                size="sm"
                              >
                                Last Month
                              </Button>
                              <Button
                                onClick={() => setCustomDateRange('custom')}
                                variant={customDateRange === 'custom' ? 'default' : 'outline'}
                                size="sm"
                              >
                                Custom Range
                              </Button>
                            </div>
                            {customDateRange === 'custom' && (
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs text-muted mb-1">From</label>
                                  <input
                                    type="date"
                                    value={customDateFrom}
                                    onChange={(e) => setCustomDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs text-muted mb-1">To</label>
                                  <input
                                    type="date"
                                    value={customDateTo}
                                    onChange={(e) => setCustomDateTo(e.target.value)}
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
                                  checked={customSections[key as keyof typeof customSections]}
                                  onChange={() => handleToggleSection(key as keyof typeof customSections)}
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
                                onClick={() => setCustomTemplate(template.id)}
                                variant={customTemplate === template.id ? 'default' : 'outline'}
                                size="sm"
                              >
                                {template.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {reportType === 'template' && (
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
                            Account Scope
                          </label>
                          <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          >
                            <option value="all">MCC-Level (All Accounts)</option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Send Report */}
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === 'quick' ? '2️⃣' : '3️⃣'} Send Report
              </CardTitle>
              <CardDescription>Enter recipients and send or preview your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Recipients</label>
                <input
                  type="text"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {recipients && (() => {
                  const { valid, invalid, total } = parseRecipients(recipients)
                  if (total === 0) return null
                  if (invalid.length > 0) {
                    return (
                      <p className="text-xs text-error mt-1">
                        ⚠ {invalid.length} invalid email{invalid.length > 1 ? 's' : ''}: {invalid.join(', ')}
                      </p>
                    )
                  }
                  return (
                    <p className="text-xs text-success mt-1">
                      ✓ {valid.length} valid recipient{valid.length > 1 ? 's' : ''}
                    </p>
                  )
                })()}
                {!recipients && (
                  <p className="text-xs text-muted mt-1">Separate multiple emails with commas</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {reportType === 'quick' && (
                  <>
                    <Button
                      onClick={handlePreview}
                      variant="outline"
                      size="lg"
                      className="w-full sm:flex-1"
                    >
                      <Eye className="h-4 w-4" />
                      Preview Report
                    </Button>
                    <Button
                      onClick={handleSendQuickReport}
                      disabled={sending || !recipients.trim()}
                      size="lg"
                      className="w-full sm:flex-1"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Now
                        </>
                      )}
                    </Button>
                  </>
                )}

                {reportType === 'custom' && (
                  <>
                    <Button
                      onClick={handleSendCustomReport}
                      disabled={generatingCustom || customAccounts.length === 0 || !recipients.trim()}
                      size="lg"
                      className="w-full"
                    >
                      {generatingCustom ? (
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
                    {customResult?.reportId && (
                      <Button
                        onClick={() => handleDownloadPDF(customResult.reportId!)}
                        variant="outline"
                        size="lg"
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </Button>
                    )}
                  </>
                )}

                {reportType === 'template' && (
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
                )}
              </div>

              {/* Result Messages */}
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

              {customResult && (
                <div
                  className={`flex items-center gap-2 p-4 rounded-lg ${
                    customResult.success
                      ? 'bg-success/10 text-success'
                      : 'bg-error/10 text-error'
                  }`}
                >
                  {customResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span>{customResult.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SCHEDULED REPORTS TAB */}
      {activeTab === 'scheduled' && (
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
            {/* Frequency Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Frequency
              </label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setScheduleFrequency('daily')}
                  variant={scheduleFrequency === 'daily' ? 'default' : 'outline'}
                  size="sm"
                >
                  Daily
                </Button>
                <Button
                  onClick={() => setScheduleFrequency('weekly')}
                  variant={scheduleFrequency === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                >
                  Weekly
                </Button>
                <Button
                  onClick={() => setScheduleFrequency('monthly')}
                  variant={scheduleFrequency === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                >
                  Monthly
                </Button>
              </div>
            </div>

            {/* Time Picker */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Time
              </label>
              <div className="flex gap-3 items-center">
                <select
                  value={scheduleHour}
                  onChange={(e) => setScheduleHour(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-muted">:</span>
                <select
                  value={scheduleMinute}
                  onChange={(e) => setScheduleMinute(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  {['00', '15', '30', '45'].map((min) => (
                    <option key={min} value={min}>
                      {min}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Day of Week Selector (for Weekly) */}
            {scheduleFrequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Day of Week
                </label>
                <select
                  value={scheduleDayOfWeek}
                  onChange={(e) => setScheduleDayOfWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                  <option value="0">Sunday</option>
                </select>
              </div>
            )}

            {/* Day of Month Selector (for Monthly) */}
            {scheduleFrequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Day of Month
                </label>
                <select
                  value={scheduleDayOfMonth}
                  onChange={(e) => setScheduleDayOfMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Generated Schedule Preview */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted font-medium mb-1">Schedule Preview:</p>
              <p className="text-sm font-medium">
                {(() => {
                  try {
                    return cronstrue.toString(schedule)
                  } catch (e) {
                    return 'Invalid schedule'
                  }
                })()}
              </p>
              <p className="text-xs text-muted mt-1 font-mono">{schedule}</p>
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
              {defaultRecipients && (() => {
                const { valid, invalid, total } = parseRecipients(defaultRecipients)
                if (total === 0) return null
                if (invalid.length > 0) {
                  return (
                    <p className="text-xs text-error mt-1">
                      ⚠ {invalid.length} invalid email{invalid.length > 1 ? 's' : ''}: {invalid.join(', ')}
                    </p>
                  )
                }
                return (
                  <p className="text-xs text-success mt-1">
                    ✓ {valid.length} valid recipient{valid.length > 1 ? 's' : ''}
                  </p>
                )
              })()}
              {!defaultRecipients && (
                <p className="text-xs text-muted mt-1">
                  Separate multiple emails with commas
                </p>
              )}
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
                <strong>Note:</strong> Schedule changes require updating the GitHub Actions workflow.
                The daily report is automatically generated and sent based on this schedule.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Reports</CardTitle>
            <CardDescription>View previously sent reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted">
              <p>Historical report tracking will be available once database is configured.</p>
              <p className="text-sm mt-2">Coming soon in Phase 1!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}