'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Save, CheckCircle, Upload, Palette, Image as ImageIcon,
  Type, Moon, Sun, Monitor, Layout, Building2
} from 'lucide-react'
import { COLOR_SCHEMES, FONT_FAMILIES } from '@/lib/settings/types'
import { useSettings } from '@/lib/settings/context'
import Image from 'next/image'

export default function SettingsPage() {
  const { settings, loading, updateSettings, applyTheme } = useSettings()
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // Local state for form fields
  const [companyName, setCompanyName] = useState(settings.companyName || 'Beech PPC AI')
  const [colorScheme, setColorScheme] = useState(settings.colorScheme || 'beech-yellow')
  const [fontFamily, setFontFamily] = useState(settings.fontFamily || 'inter')
  const [themeMode, setThemeMode] = useState(settings.themeMode || 'light')
  const [dashboardLayout, setDashboardLayout] = useState(settings.dashboardLayout || 'spacious')

  // Sync local state when settings load
  useState(() => {
    if (!loading) {
      setCompanyName(settings.companyName || 'Beech PPC AI')
      setColorScheme(settings.colorScheme || 'beech-yellow')
      setFontFamily(settings.fontFamily || 'inter')
      setThemeMode(settings.themeMode || 'light')
      setDashboardLayout(settings.dashboardLayout || 'spacious')
    }
  })

  const handleSave = async () => {
    try {
      await updateSettings({
        companyName,
        colorScheme,
        fontFamily,
        themeMode,
        dashboardLayout,
      })

      setSaved(true)
      applyTheme()
      setTimeout(() => setSaved(false), 3000)

      // Reload to update company name in sidebar
      window.location.reload()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
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
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
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

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('favicon', file)

      const response = await fetch('/api/settings/upload-favicon', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload favicon')
      }
    } catch (error) {
      console.error('Error uploading favicon:', error)
      alert('Failed to upload favicon')
    } finally {
      setUploading(false)
    }
  }

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
          Configure your branding, appearance, and report preferences
        </p>
      </div>

      {/* Company Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Name
          </CardTitle>
          <CardDescription>
            Customize your company or agency name displayed in the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Beech PPC AI"
          />
          <p className="text-xs text-muted mt-2">
            This will appear in the sidebar and throughout the application
          </p>
        </CardContent>
      </Card>

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
              {settings.logoUrl ? (
                <div className="relative h-16 w-16 rounded-lg border border-border overflow-hidden">
                  <Image
                    src={settings.logoUrl}
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
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
              />
              <Button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-muted mt-2">
                Accepted formats: PNG, JPEG, SVG, WebP. Max size: 5MB
              </p>
              {settings.logoFileName && (
                <p className="text-xs text-muted mt-1">
                  Current: {settings.logoFileName}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favicon Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Favicon
          </CardTitle>
          <CardDescription>
            Upload a custom favicon for your browser tab
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {settings.faviconUrl ? (
                <div className="relative h-8 w-8 rounded border border-border overflow-hidden bg-white">
                  <Image
                    src={settings.faviconUrl}
                    alt="Favicon preview"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                ref={faviconInputRef}
                onChange={handleFaviconUpload}
                accept=".ico,image/x-icon,image/png"
                className="hidden"
              />
              <Button
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : settings.faviconUrl ? 'Change Favicon' : 'Upload Favicon'}
              </Button>
              <p className="text-xs text-muted mt-2">
                Accepted formats: ICO, PNG. Max size: 500KB. Recommended: 32x32px
              </p>
              {settings.faviconFileName && (
                <p className="text-xs text-muted mt-1">
                  Current: {settings.faviconFileName}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Font Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Font Family
          </CardTitle>
          <CardDescription>
            Choose the typography for your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(FONT_FAMILIES).map(([key, font]) => (
              <button
                key={key}
                onClick={() => setFontFamily(key)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  fontFamily === key
                    ? 'border-primary bg-primary-light/30'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ fontFamily: font.value }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">{font.name}</div>
                  {fontFamily === key && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="text-xs text-muted">{font.description}</div>
                <div className="text-sm mt-2">The quick brown fox jumps</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Theme Mode
          </CardTitle>
          <CardDescription>
            Choose between light mode, dark mode, or follow your system preference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setThemeMode('light')}
              className={`p-4 rounded-lg border-2 transition-all ${
                themeMode === 'light'
                  ? 'border-primary bg-primary-light/30'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Sun className="h-5 w-5" />
                {themeMode === 'light' && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="font-medium">Light</div>
              <div className="text-xs text-muted mt-1">Always light theme</div>
            </button>

            <button
              onClick={() => setThemeMode('dark')}
              className={`p-4 rounded-lg border-2 transition-all ${
                themeMode === 'dark'
                  ? 'border-primary bg-primary-light/30'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Moon className="h-5 w-5" />
                {themeMode === 'dark' && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="font-medium">Dark</div>
              <div className="text-xs text-muted mt-1">Always dark theme</div>
            </button>

            <button
              onClick={() => setThemeMode('system')}
              className={`p-4 rounded-lg border-2 transition-all ${
                themeMode === 'system'
                  ? 'border-primary bg-primary-light/30'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Monitor className="h-5 w-5" />
                {themeMode === 'system' && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="font-medium">System</div>
              <div className="text-xs text-muted mt-1">Follow system setting</div>
            </button>
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
            Choose a color scheme for your dashboard (adapts to theme mode)
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

      {/* Dashboard Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Dashboard Layout
          </CardTitle>
          <CardDescription>
            Choose the density of information displayed on your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setDashboardLayout('compact')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                dashboardLayout === 'compact'
                  ? 'border-primary bg-primary-light/30'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Compact</div>
                {dashboardLayout === 'compact' && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="text-xs text-muted">
                More data on screen, tighter spacing
              </div>
            </button>

            <button
              onClick={() => setDashboardLayout('spacious')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                dashboardLayout === 'spacious'
                  ? 'border-primary bg-primary-light/30'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Spacious</div>
                {dashboardLayout === 'spacious' && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="text-xs text-muted">
                More breathing room, easier to scan
              </div>
            </button>
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
