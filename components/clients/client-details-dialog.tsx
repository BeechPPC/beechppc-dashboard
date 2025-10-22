'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'

interface ClientDetails {
  businessName: string
  url: string
  monthlyBudget: string
  accountType: 'ecommerce' | 'lead-gen' | ''
  country: string
  contactName: string
  contactEmail: string
  notes: string
  industry: string
  timezone: string
}

interface ClientDetailsDialogProps {
  open: boolean
  onClose: () => void
  accountId: string
  accountName: string
  currency: string
}

export function ClientDetailsDialog({ open, onClose, accountId, accountName, currency }: ClientDetailsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [details, setDetails] = useState<ClientDetails>({
    businessName: accountName,
    url: '',
    monthlyBudget: '',
    accountType: '',
    country: '',
    contactName: '',
    contactEmail: '',
    notes: '',
    industry: '',
    timezone: '',
  })

  // Load existing details when dialog opens
  useEffect(() => {
    if (open) {
      loadClientDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountId])

  const loadClientDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/clients/${accountId}/details`)
      if (response.ok) {
        const data = await response.json()
        if (data.details) {
          setDetails({ ...details, ...data.details })
        }
      }
    } catch (error) {
      console.error('Error loading client details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/clients/${accountId}/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
      })

      if (response.ok) {
        onClose()
      } else {
        console.error('Failed to save client details')
      }
    } catch (error) {
      console.error('Error saving client details:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof ClientDetails, value: string) => {
    setDetails({ ...details, [field]: value })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <DialogTitle>Client Details</DialogTitle>
        <DialogDescription>
          Manage information for {accountName}
        </DialogDescription>
      </DialogHeader>

      <DialogContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={details.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                placeholder="Enter business name"
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                type="url"
                value={details.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {/* Monthly Budget & Account Type - Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyBudget">Monthly Budget ({currency})</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  value={details.monthlyBudget}
                  onChange={(e) => handleChange('monthlyBudget', e.target.value)}
                  placeholder="5000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select
                  id="accountType"
                  value={details.accountType}
                  onChange={(e) => handleChange('accountType', e.target.value)}
                >
                  <option value="">Select type</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="lead-gen">Lead Generation</option>
                </Select>
              </div>
            </div>

            {/* Industry & Country - Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={details.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  placeholder="e.g., Retail, Healthcare, Finance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={details.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="e.g., United States, United Kingdom"
                />
              </div>
            </div>

            {/* Contact Name & Email - Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={details.contactName}
                  onChange={(e) => handleChange('contactName', e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={details.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                id="timezone"
                value={details.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
              >
                <option value="">Select timezone</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Australia/Sydney">Sydney (AEDT)</option>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={details.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Add any additional notes or context about this client..."
                rows={4}
              />
            </div>
          </div>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Details
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
