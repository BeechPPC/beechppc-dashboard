'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import type { ReportSchedule, CreateScheduleRequest } from '@/lib/types/reports'

interface Account {
  id: string
  name: string
}

interface ScheduleModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  schedule?: ReportSchedule | null
}

export function ScheduleModal({ open, onClose, onSuccess, schedule }: ScheduleModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [reportType, setReportType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('DAILY')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [hour, setHour] = useState('11')
  const [minute, setMinute] = useState('00')
  const [dayOfWeek, setDayOfWeek] = useState('1')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [timezone, setTimezone] = useState('Australia/Melbourne')
  const [scopeType, setScopeType] = useState<'ALL_ACCOUNTS' | 'SPECIFIC_ACCOUNTS'>('ALL_ACCOUNTS')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [templateType, setTemplateType] = useState<'STANDARD' | 'DETAILED' | 'EXECUTIVE'>('STANDARD')
  const [sections, setSections] = useState({
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
  const [dateRangeType, setDateRangeType] = useState<'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH'>('YESTERDAY')
  const [recipientEmails, setRecipientEmails] = useState('')

  // Load accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/google-ads/accounts')
        const data = await res.json()
        if (data.success) {
          setAccounts(data.accounts)
        }
      } catch (error) {
        console.error('Error loading accounts:', error)
      } finally {
        setLoadingAccounts(false)
      }
    }

    if (open) {
      loadAccounts()
    }
  }, [open])

  // Populate form when editing
  useEffect(() => {
    if (schedule) {
      setName(schedule.name)
      setDescription(schedule.description || '')
      setReportType(schedule.reportType as any)
      setTimezone(schedule.timezone)
      setScopeType(schedule.scopeType as any)
      setTemplateType(schedule.templateType as any)
      setSections(schedule.sections || sections)
      setDateRangeType(schedule.dateRangeType as any)

      // Parse recipient emails
      if (Array.isArray(schedule.recipientEmails)) {
        setRecipientEmails(schedule.recipientEmails.join(', '))
      } else if (typeof schedule.recipientEmails === 'string') {
        setRecipientEmails(schedule.recipientEmails)
      }

      // Parse account IDs
      if (Array.isArray(schedule.accountIds)) {
        setSelectedAccounts(schedule.accountIds)
      }

      // Parse cron schedule
      const parts = schedule.cronSchedule.split(' ')
      if (parts.length === 5) {
        setMinute(parts[0])
        setHour(parts[1])

        if (parts[4] !== '*') {
          setFrequency('weekly')
          setDayOfWeek(parts[4])
        } else if (parts[2] !== '*') {
          setFrequency('monthly')
          setDayOfMonth(parts[2])
        } else {
          setFrequency('daily')
        }
      }
    }
  }, [schedule])

  // Reset form when closed
  useEffect(() => {
    if (!open) {
      setStep(1)
      if (!schedule) {
        setName('')
        setDescription('')
        setReportType('DAILY')
        setFrequency('daily')
        setHour('11')
        setMinute('00')
        setTimezone('Australia/Melbourne')
        setScopeType('ALL_ACCOUNTS')
        setSelectedAccounts([])
        setTemplateType('STANDARD')
        setSections({
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
        setDateRangeType('YESTERDAY')
        setRecipientEmails('')
      }
    }
  }, [open, schedule])

  const generateCronExpression = () => {
    switch (frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`
      case 'weekly':
        return `${minute} ${hour} * * ${dayOfWeek}`
      case 'monthly':
        return `${minute} ${hour} ${dayOfMonth} * *`
      default:
        return `${minute} ${hour} * * *`
    }
  }

  const validateStep = (currentStep: number) => {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0
      case 2:
        return true // Report type and frequency are always valid
      case 3:
        return scopeType === 'ALL_ACCOUNTS' || selectedAccounts.length > 0
      case 4:
        return true // Template and sections are always valid
      case 5:
        const emails = recipientEmails.split(',').map(e => e.trim()).filter(Boolean)
        return emails.length > 0 && emails.every(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(5)) return

    setLoading(true)

    try {
      const cronSchedule = generateCronExpression()
      const emailList = recipientEmails.split(',').map(e => e.trim()).filter(Boolean)

      const payload: CreateScheduleRequest = {
        name,
        description,
        reportType,
        frequency: frequency.toUpperCase(),
        cronSchedule,
        timezone,
        scopeType,
        accountIds: scopeType === 'SPECIFIC_ACCOUNTS' ? selectedAccounts : undefined,
        templateType,
        sections,
        dateRangeType,
        recipientEmails: emailList,
      }

      const url = schedule
        ? `/api/reports/schedules/${schedule.id}`
        : '/api/reports/schedules'

      const method = schedule ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        onSuccess()
        onClose()
      } else {
        alert(`Failed to ${schedule ? 'update' : 'create'} schedule: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert(`Failed to ${schedule ? 'update' : 'create'} schedule`)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>{schedule ? 'Edit' : 'Create'} Report Schedule</DialogTitle>
        <DialogDescription>
          Step {step} of 5: {
            step === 1 ? 'Basic Information' :
            step === 2 ? 'Schedule & Frequency' :
            step === 3 ? 'Account Selection' :
            step === 4 ? 'Template & Sections' :
            'Recipients'
          }
        </DialogDescription>
      </DialogHeader>

      <DialogContent>
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Schedule Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily Performance Report"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this report schedule"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Step 2: Schedule & Frequency */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="DAILY">Daily Report</option>
                <option value="WEEKLY">Weekly Report</option>
                <option value="MONTHLY">Monthly Report</option>
                <option value="CUSTOM">Custom Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <select
                value={dateRangeType}
                onChange={(e) => setDateRangeType(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="YESTERDAY">Yesterday</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_MONTH">Last Month</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Hour</label>
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString()}>
                      {i.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Minute</label>
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="00">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
              </div>
            </div>

            {frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium mb-2">Day of Week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>
            )}

            {frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium mb-2">Day of Month</label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: 28 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Australia/Melbourne">Australia/Melbourne (AEST/AEDT)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
                <option value="Australia/Brisbane">Australia/Brisbane (AEST)</option>
                <option value="Australia/Perth">Australia/Perth (AWST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Account Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Account Scope</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={scopeType === 'ALL_ACCOUNTS'}
                    onChange={() => setScopeType('ALL_ACCOUNTS')}
                    className="w-4 h-4"
                  />
                  <span>All Accounts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={scopeType === 'SPECIFIC_ACCOUNTS'}
                    onChange={() => setScopeType('SPECIFIC_ACCOUNTS')}
                    className="w-4 h-4"
                  />
                  <span>Specific Accounts</span>
                </label>
              </div>
            </div>

            {scopeType === 'SPECIFIC_ACCOUNTS' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Accounts <span className="text-red-500">*</span>
                </label>
                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="text-sm text-muted py-4">
                    No accounts available
                  </div>
                ) : (
                  <div className="border border-border rounded-lg max-h-64 overflow-y-auto">
                    {accounts.map((account) => (
                      <label
                        key={account.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.id)}
                          onChange={() => toggleAccount(account.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{account.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Template & Sections */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template Type</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="STANDARD">Standard - Balanced detail</option>
                <option value="DETAILED">Detailed - Comprehensive analysis</option>
                <option value="EXECUTIVE">Executive - High-level summary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Report Sections</label>
              <div className="space-y-2">
                {Object.entries(sections).map(([key, enabled]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleSection(key as keyof typeof sections)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Recipients */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Recipients <span className="text-red-500">*</span>
              </label>
              <textarea
                value={recipientEmails}
                onChange={(e) => setRecipientEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted mt-1">
                Enter email addresses separated by commas
              </p>
            </div>

            {recipientEmails && (
              <div className="text-sm">
                <div className="font-medium mb-1">Preview:</div>
                <div className="space-y-1">
                  {recipientEmails.split(',').map((email, i) => {
                    const trimmed = email.trim()
                    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
                    return trimmed ? (
                      <div key={i} className={isValid ? 'text-success' : 'text-destructive'}>
                        {isValid ? '✓' : '✗'} {trimmed}
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <DialogFooter>
        {step > 1 && (
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {step < 5 ? (
          <Button onClick={handleNext} disabled={!validateStep(step)}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading || !validateStep(5)}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {schedule ? 'Update' : 'Create'} Schedule
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  )
}