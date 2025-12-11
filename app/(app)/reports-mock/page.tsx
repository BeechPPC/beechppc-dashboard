'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, Eye, CheckCircle, XCircle, Clock, Calendar, TrendingUp, FileText, Download, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

// Mock data
const MOCK_ACCOUNTS = [
  { id: '1', name: 'Beech PPC - Main Account' },
  { id: '2', name: 'Client ABC - Retail Campaign' },
  { id: '3', name: 'Client XYZ - Service Campaign' },
  { id: '4', name: 'Local Business - Brand Campaign' },
]

const MOCK_SCHEDULES = [
  {
    id: '1',
    name: 'Daily MCC Overview',
    active: true,
    type: 'Quick Daily Report',
    frequency: 'Every day at 11:00 AM',
    timezone: 'Australia/Melbourne',
    recipients: ['chris@beechppc.com', 'team@beechppc.com'],
    accountLevel: 'MCC-level (All accounts)',
  },
  {
    id: '2',
    name: 'Weekly Campaign Review',
    active: false,
    type: 'Custom Report (Campaigns + Keywords)',
    frequency: 'Every Monday at 09:00 AM',
    timezone: 'Australia/Melbourne',
    recipients: ['client@example.com'],
    accountLevel: 'Client ABC - Retail Campaign',
  },
  {
    id: '3',
    name: 'Monthly Performance Report',
    active: true,
    type: 'Template Report (Executive Summary)',
    frequency: 'First day of month at 08:00 AM',
    timezone: 'Australia/Melbourne',
    recipients: ['manager@example.com', 'stakeholder@example.com'],
    accountLevel: 'MCC-level (All accounts)',
  },
]

const MOCK_TEMPLATES = [
  { id: 't1', name: 'Executive Summary', description: 'High-level overview for stakeholders' },
  { id: 't2', name: 'Detailed Performance', description: 'Comprehensive metrics and analysis' },
  { id: 't3', name: 'Auction Insights Focus', description: 'Competitor and auction data' },
  { id: 't4', name: 'Keyword Deep Dive', description: 'Keyword performance analysis' },
]

export default function ReportsMockPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'scheduled' | 'history'>('create')

  // Create Report Tab State
  const [reportType, setReportType] = useState<'quick' | 'custom' | 'template'>('quick')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [dateRange, setDateRange] = useState('this_month')
  const [selectedSections, setSelectedSections] = useState({
    campaigns: true,
    keywords: true,
    auctionInsights: false,
    qualityScore: true,
    geographic: false,
    device: false,
  })
  const [selectedTemplate, setSelectedTemplate] = useState('t1')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [recipients, setRecipients] = useState('')

  // Scheduled Reports Tab State
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleFormType, setScheduleFormType] = useState<'quick' | 'custom' | 'template'>('quick')
  const [scheduleName, setScheduleName] = useState('')
  const [scheduleFrequency, setScheduleFrequency] = useState('daily')
  const [scheduleTime, setScheduleTime] = useState('11:00')
  const [scheduleRecipients, setScheduleRecipients] = useState('')

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  const parseRecipients = (recipientsString: string) => {
    const emails = recipientsString.split(',').map(e => e.trim()).filter(Boolean)
    const valid = emails.filter(validateEmail)
    const invalid = emails.filter(e => !validateEmail(e))
    return { valid, invalid, total: emails.length }
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports (Mock Preview)</h1>
        <p className="text-muted mt-2 text-sm sm:text-base">
          New simplified tab-based layout with mock data
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

      {/* Tab Content */}
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
                  onClick={() => setReportType('quick')}
                  className={`p-6 rounded-lg border-2 transition-all text-left ${
                    reportType === 'quick'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Clock className="h-8 w-8 mb-3 text-primary" />
                  <h3 className="font-semibold mb-1">Quick Daily</h3>
                  <p className="text-sm text-muted">Yesterday's performance across all accounts</p>
                </button>

                <button
                  onClick={() => setReportType('custom')}
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
                  onClick={() => setReportType('template')}
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
                {reportType === 'custom' && (
                  <>
                    {/* Account Multi-Select */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Accounts ({selectedAccounts.length} selected)
                      </label>
                      <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                        {MOCK_ACCOUNTS.map((account) => (
                          <label
                            key={account.id}
                            className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAccounts.includes(account.id)}
                              onChange={() => {
                                setSelectedAccounts(prev =>
                                  prev.includes(account.id)
                                    ? prev.filter(id => id !== account.id)
                                    : [...prev, account.id]
                                )
                              }}
                              className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm">{account.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Date Range
                      </label>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setDateRange('this_month')}
                          variant={dateRange === 'this_month' ? 'default' : 'outline'}
                          size="sm"
                        >
                          This Month
                        </Button>
                        <Button
                          onClick={() => setDateRange('last_month')}
                          variant={dateRange === 'last_month' ? 'default' : 'outline'}
                          size="sm"
                        >
                          Last Month
                        </Button>
                        <Button
                          onClick={() => setDateRange('custom')}
                          variant={dateRange === 'custom' ? 'default' : 'outline'}
                          size="sm"
                        >
                          Custom Range
                        </Button>
                      </div>
                    </div>

                    {/* Report Sections */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Report Sections</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries({
                          campaigns: 'Campaign Performance',
                          keywords: 'Keyword Analysis',
                          auctionInsights: 'Auction Insights',
                          qualityScore: 'Quality Score',
                          geographic: 'Geographic Performance',
                          device: 'Device Performance',
                        }).map(([key, label]) => (
                          <label
                            key={key}
                            className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-accent cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSections[key as keyof typeof selectedSections]}
                              onChange={() => {
                                setSelectedSections(prev => ({
                                  ...prev,
                                  [key]: !prev[key as keyof typeof selectedSections]
                                }))
                              }}
                              className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {reportType === 'template' && (
                  <>
                    {/* Template Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Template</label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      >
                        {MOCK_TEMPLATES.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted mt-1">
                        {MOCK_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                      </p>
                    </div>

                    {/* Account Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Account Scope</label>
                      <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      >
                        <option value="all">MCC-Level (All Accounts)</option>
                        {MOCK_ACCOUNTS.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </div>
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

              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="flex-1">
                  <Eye className="h-4 w-4" />
                  Preview Report
                </Button>
                <Button size="lg" className="flex-1" disabled={!recipients.trim()}>
                  <Send className="h-4 w-4" />
                  Send Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'scheduled' && (
        <div className="space-y-6">
          {!showScheduleForm ? (
            <>
              {/* Active Schedules List */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Schedules</CardTitle>
                  <CardDescription>Manage your automated report schedules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_SCHEDULES.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-lg border-2 ${
                        schedule.active
                          ? 'border-success/30 bg-success/5'
                          : 'border-border bg-muted/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {schedule.active ? (
                            <div className="h-2 w-2 rounded-full bg-success" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted" />
                          )}
                          <h3 className="font-semibold">{schedule.name}</h3>
                          {!schedule.active && (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted">
                              PAUSED
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            {schedule.active ? (
                              <ToggleRight className="h-4 w-4 text-success" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-error" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted">Frequency:</span>{' '}
                          <span className="font-medium">{schedule.frequency}</span>
                        </div>
                        <div>
                          <span className="text-muted">Type:</span>{' '}
                          <span className="font-medium">{schedule.type}</span>
                        </div>
                        <div>
                          <span className="text-muted">Recipients:</span>{' '}
                          <span className="font-medium">{schedule.recipients.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-muted">Scope:</span>{' '}
                          <span className="font-medium">{schedule.accountLevel}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={() => setShowScheduleForm(true)}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    + Add New Schedule
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Create Schedule Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Scheduled Report</CardTitle>
                  <CardDescription>Set up a new automated report schedule</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Schedule Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Schedule Name (optional)
                    </label>
                    <input
                      type="text"
                      value={scheduleName}
                      onChange={(e) => setScheduleName(e.target.value)}
                      placeholder="e.g., Weekly Campaign Review"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Report Type Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Report Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => setScheduleFormType('quick')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          scheduleFormType === 'quick'
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <h4 className="font-medium text-sm mb-1">Quick Daily</h4>
                        <p className="text-xs text-muted">Yesterday's data</p>
                      </button>
                      <button
                        onClick={() => setScheduleFormType('custom')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          scheduleFormType === 'custom'
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <h4 className="font-medium text-sm mb-1">Custom Report</h4>
                        <p className="text-xs text-muted">Choose metrics</p>
                      </button>
                      <button
                        onClick={() => setScheduleFormType('template')}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          scheduleFormType === 'template'
                            ? 'border-primary bg-primary/5'
                            : 'border-border'
                        }`}
                      >
                        <h4 className="font-medium text-sm mb-1">Template</h4>
                        <p className="text-xs text-muted">Pre-configured</p>
                      </button>
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Frequency</label>
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

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                      <option>Australia/Melbourne</option>
                      <option>Australia/Sydney</option>
                      <option>Australia/Brisbane</option>
                    </select>
                  </div>

                  {/* Recipients */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Recipients</label>
                    <input
                      type="text"
                      value={scheduleRecipients}
                      onChange={(e) => setScheduleRecipients(e.target.value)}
                      placeholder="email1@example.com, email2@example.com"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {scheduleRecipients && (() => {
                      const { valid, invalid, total } = parseRecipients(scheduleRecipients)
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
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      onClick={() => setShowScheduleForm(false)}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button size="lg" className="flex-1" disabled={!scheduleRecipients.trim()}>
                      <CheckCircle className="h-4 w-4" />
                      Save & Activate Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

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