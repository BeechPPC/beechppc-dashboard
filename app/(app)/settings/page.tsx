'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Mail, Save, CheckCircle, Upload, Palette, Image as ImageIcon } from 'lucide-react'
import { COLOR_SCHEMES } from '@/lib/settings/types'
import type { AppSettings } from '@/lib/settings/types'
import Image from 'next/image'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState('0 11 * * *')
  const [timezone, setTimezone] = useState('Australia/Melbourne')
  const [recipients, setRecipients] = useState('chris@beechppc.com')
  const [logoUrl, setLogoUrl] = useState<string | undefined>()
  const [logoFileName, setLogoFileName] = useState<string | undefined>()
  const [colorScheme, setColorScheme] = useState('beech-yellow')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data: AppSettings = await response.json()
          setSchedule(data.schedule || '0 11 * * *')
          setTimezone(data.timezone || 'Australia/Melbourne')
          setRecipients(data.recipients || 'chris@beechppc.com')
          setLogoUrl(data.logoUrl)
          setLogoFileName(data.logoFileName)
          setColorScheme(data.colorScheme || 'beech-yellow')
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule,
          timezone,
          recipients,
          colorScheme,
        }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)

        // Apply color scheme immediately
        applyColorScheme(colorScheme)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setLogoUrl(data.logoUrl)
        setLogoFileName(data.fileName)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)

        // Reload the page to update the logo in the sidebar
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload logo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const applyColorScheme = (schemeName: string) => {
    const scheme = COLOR_SCHEMES[schemeName]
    if (!scheme) return

    const root = document.documentElement
    root.style.setProperty('--primary', scheme.primary)
    root.style.setProperty('--primary-light', scheme.primaryLight)
    root.style.setProperty('--primary-mid', scheme.primaryMid)
    root.style.setProperty('--primary-dark', scheme.primaryDark)
    root.style.setProperty('--background', scheme.background)
    root.style.setProperty('--surface', scheme.surface)
    root.style.setProperty('--foreground', scheme.foreground)
    root.style.setProperty('--muted', scheme.muted)
    root.style.setProperty('--success', scheme.success)
    root.style.setProperty('--error', scheme.error)
    root.style.setProperty('--warning', scheme.warning)
    root.style.setProperty('--border', scheme.border)
    root.style.setProperty('--ring', scheme.ring)
  }

  // Apply color scheme on load
  useEffect(() => {
    if (!loading) {
      applyColorScheme(colorScheme)
    }
  }, [loading, colorScheme])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted mt-2 text-sm sm:text-base">
          Configure your branding, color scheme, and report preferences
        </p>
      </div>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Brand Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo to replace the default icon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {logoUrl ? (
                <div className="relative h-16 w-16 rounded-lg border border-border overflow-hidden">
                  <Image
                    src={logoUrl}
                    alt="Logo preview"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-muted mt-2">
                Accepted formats: PNG, JPEG, SVG, WebP. Max size: 5MB
              </p>
              {logoFileName && (
                <p className="text-xs text-muted mt-1">
                  Current file: {logoFileName}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Scheme
          </CardTitle>
          <CardDescription>
            Choose a color scheme for your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
              <button
                key={key}
                onClick={() => setColorScheme(key)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  colorScheme === key
                    ? 'border-primary bg-primary-light/30'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="h-8 w-8 rounded-md"
                    style={{ backgroundColor: scheme.primary }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{scheme.name}</div>
                  </div>
                  {colorScheme === key && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex gap-1">
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: scheme.primaryLight }}
                  />
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: scheme.primaryMid }}
                  />
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: scheme.primaryDark }}
                  />
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: scheme.success }}
                  />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

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
            'Click Save Settings to apply your changes.'
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
