'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { AppSettings, DEFAULT_SETTINGS, COLOR_SCHEMES, DARK_COLOR_SCHEMES, FONT_FAMILIES } from './types'

interface SettingsContextType {
  settings: AppSettings
  loading: boolean
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>
  applyTheme: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data: AppSettings = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const applyTheme = useCallback(() => {
    const root = document.documentElement

    // Determine if we should use dark mode
    const isDark =
      settings.themeMode === 'dark' ||
      (settings.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    // Apply color scheme
    const schemeSource = isDark ? DARK_COLOR_SCHEMES : COLOR_SCHEMES
    const scheme = schemeSource[settings.colorScheme || 'beech-yellow']

    if (scheme) {
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

    // Apply font family
    const fontKey = (settings.fontFamily || 'inter') as keyof typeof FONT_FAMILIES
    const fontConfig = FONT_FAMILIES[fontKey]
    if (fontConfig) {
      root.style.setProperty('--font-sans', fontConfig.value)
    }

    // Add/remove dark class for Tailwind
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [settings.colorScheme, settings.themeMode, settings.fontFamily])

  // Apply theme whenever settings change
  useEffect(() => {
    if (!loading) {
      applyTheme()
    }
  }, [loading, applyTheme])

  const updateSettings = async (updates: Partial<AppSettings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  // Listen for system theme changes
  useEffect(() => {
    if (settings.themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme()
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [settings.themeMode, applyTheme])

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, applyTheme }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
