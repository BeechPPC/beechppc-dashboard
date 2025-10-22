'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { AlertType, AlertCondition } from '@/lib/alerts/types'

interface CreateAlertFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  name: string
  description: string
  type: AlertType
  condition: AlertCondition
  threshold: string
  accountId: string
  recipients: string
  frequency: 'daily' | 'hourly'
}

export function CreateAlertForm({ onSuccess, onCancel }: CreateAlertFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'spend',
    condition: 'above',
    threshold: '',
    accountId: '',
    recipients: 'chris@beechppc.com',
    frequency: 'daily',
  })

  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // Load available accounts
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch('/api/google-ads/accounts')
        const result = await res.json()
        if (result.success) {
          setAccounts(result.accounts)
        }
      } catch (err) {
        console.error('Failed to load accounts:', err instanceof Error ? err.message : 'Unknown error')
      }
    }
    loadAccounts()
  }, [])

  // Get available conditions based on alert type
  const getAvailableConditions = (type: AlertType): AlertCondition[] => {
    if (type === 'conversion_tracking') {
      return ['no_data_for_days']
    }
    if (type === 'ad_disapproval') {
      return ['has_disapproved_ads']
    }
    if (type === 'spend' || type === 'conversions') {
      return ['above', 'below']
    }
    return ['above', 'below', 'increases_by', 'decreases_by']
  }

  // Update condition when type changes
  const handleTypeChange = (newType: AlertType) => {
    const availableConditions = getAvailableConditions(newType)
    const currentConditionValid = availableConditions.includes(formData.condition)

    setFormData({
      ...formData,
      type: newType,
      condition: currentConditionValid ? formData.condition : availableConditions[0],
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Alert name is required'
    }

    // Skip threshold validation for ad_disapproval alerts
    if (formData.type !== 'ad_disapproval') {
      if (!formData.threshold || isNaN(Number(formData.threshold)) || Number(formData.threshold) <= 0) {
        newErrors.threshold = 'Please enter a valid positive number'
      }
    }

    if (!formData.recipients.trim()) {
      newErrors.recipients = 'At least one email recipient is required'
    } else {
      // Basic email validation
      const emails = formData.recipients.split(',').map(e => e.trim())
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = emails.filter(email => !emailRegex.test(email))
      if (invalidEmails.length > 0) {
        newErrors.recipients = `Invalid email(s): ${invalidEmails.join(', ')}`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          type: formData.type,
          condition: formData.condition,
          threshold: formData.type === 'ad_disapproval' ? 0 : Number(formData.threshold),
          accountId: formData.accountId || undefined,
          recipients: formData.recipients.split(',').map(e => e.trim()),
          frequency: formData.frequency,
        }),
      })

      const result = await res.json()

      if (result.success) {
        onSuccess()
      } else {
        window.alert(`Failed to create alert: ${result.error}`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to create alert:', errorMsg)
      window.alert(`Failed to create alert: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  // Generate preview text
  const getPreviewText = (): string => {
    // Ad disapproval doesn't need threshold
    if (formData.type === 'ad_disapproval') {
      const accountLabel = formData.accountId
        ? accounts.find(a => a.id === formData.accountId)?.name || 'Unknown Account'
        : 'All Accounts'
      return `Alert will trigger when ${accountLabel} has disapproved ads`
    }

    if (!formData.threshold) return 'Configure alert settings to see preview'

    const typeLabel = {
      spend: 'Spend',
      conversions: 'Conversions',
      ctr: 'CTR',
      cpc: 'CPC',
      conversion_rate: 'Conversion Rate',
      conversion_tracking: 'Conversion Tracking',
      ad_disapproval: 'Ad Disapproval',
    }[formData.type]

    const conditionLabel = {
      above: 'exceeds',
      below: 'falls below',
      increases_by: 'increases by',
      decreases_by: 'decreases by',
      no_data_for_days: 'has no conversions for',
      has_disapproved_ads: 'has disapproved ads',
    }[formData.condition]

    const thresholdLabel = (() => {
      const value = formData.threshold
      if (formData.type === 'spend' || formData.type === 'cpc') {
        return `$${value}`
      }
      if (formData.condition === 'no_data_for_days') {
        return `${value} days`
      }
      if (formData.condition === 'increases_by' || formData.condition === 'decreases_by') {
        return `${value}%`
      }
      if (formData.type === 'ctr' || formData.type === 'conversion_rate') {
        return `${value}%`
      }
      return value
    })()

    const accountLabel = formData.accountId
      ? accounts.find(a => a.id === formData.accountId)?.name || 'Unknown Account'
      : 'All Accounts'

    if (formData.type === 'conversion_tracking') {
      return `Alert will trigger when any conversion action ${conditionLabel} ${thresholdLabel} for ${accountLabel}`
    }

    return `Alert will trigger when ${typeLabel} ${conditionLabel} ${thresholdLabel} for ${accountLabel}`
  }

  const availableConditions = getAvailableConditions(formData.type)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Alert Name <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., High Daily Spend Alert"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          maxLength={100}
        />
        {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of what this alert monitors"
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          maxLength={500}
        />
      </div>

      {/* Alert Type */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Alert Type <span className="text-error">*</span>
        </label>
        <select
          value={formData.type}
          onChange={(e) => handleTypeChange(e.target.value as AlertType)}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="ad_disapproval">Ad Disapprovals</option>
          <option value="conversion_tracking">Conversion Tracking Issues</option>
          <option value="spend">Daily Spend</option>
          <option value="conversions">Conversions</option>
          <option value="conversion_rate">Conversion Rate</option>
          <option value="ctr">Click-Through Rate (CTR)</option>
          <option value="cpc">Cost Per Click (CPC)</option>
        </select>
      </div>

      {/* Condition and Threshold */}
      {formData.type === 'ad_disapproval' ? (
        // Ad disapproval only shows condition (no threshold needed)
        <div>
          <label className="block text-sm font-medium mb-2">
            Condition <span className="text-error">*</span>
          </label>
          <select
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value as AlertCondition })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          >
            {availableConditions.includes('has_disapproved_ads') && <option value="has_disapproved_ads">Has Disapproved Ads</option>}
          </select>
          <p className="text-xs text-muted mt-1">
            Alert will trigger whenever any ads are disapproved in the selected account(s)
          </p>
        </div>
      ) : (
        // Other alert types show both condition and threshold
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Condition <span className="text-error">*</span>
            </label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value as AlertCondition })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              {availableConditions.includes('above') && <option value="above">Above</option>}
              {availableConditions.includes('below') && <option value="below">Below</option>}
              {availableConditions.includes('increases_by') && <option value="increases_by">Increases By</option>}
              {availableConditions.includes('decreases_by') && <option value="decreases_by">Decreases By</option>}
              {availableConditions.includes('no_data_for_days') && <option value="no_data_for_days">No Data For (Days)</option>}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Threshold <span className="text-error">*</span>
            </label>
            <div className="relative">
              {(formData.type === 'spend' || formData.type === 'cpc') && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
              )}
              <input
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                placeholder="0"
                min="0"
                step="any"
                className={`w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  (formData.type === 'spend' || formData.type === 'cpc') ? 'pl-7' : ''
                }`}
              />
            </div>
            {errors.threshold && <p className="text-error text-xs mt-1">{errors.threshold}</p>}
          </div>
        </div>
      )}

      {/* Account Scope */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Account
        </label>
        <select
          value={formData.accountId}
          onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="">All Accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted mt-1">
          Leave as &quot;All Accounts&quot; to monitor aggregate performance
        </p>
      </div>

      {/* Email Recipients */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Email Recipients <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={formData.recipients}
          onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
          placeholder="email@example.com, another@example.com"
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted mt-1">
          Separate multiple emails with commas
        </p>
        {errors.recipients && <p className="text-error text-xs mt-1">{errors.recipients}</p>}
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Check Frequency
        </label>
        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'daily' | 'hourly' })}
          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
        >
          <option value="daily">Daily</option>
          <option value="hourly">Hourly</option>
        </select>
      </div>

      {/* Preview */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-900 mb-1">Alert Preview</p>
        <p className="text-sm text-gray-700">{getPreviewText()}</p>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            'Create Alert'
          )}
        </Button>
      </div>
    </form>
  )
}
