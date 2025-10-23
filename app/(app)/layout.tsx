'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/navigation/sidebar'
import { COLOR_SCHEMES } from '@/lib/settings/types'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Apply color scheme on mount
  useEffect(() => {
    const loadAndApplyColorScheme = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          const colorScheme = data.colorScheme || 'beech-yellow'
          const scheme = COLOR_SCHEMES[colorScheme]

          if (scheme) {
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
        }
      } catch (error) {
        console.error('Error loading color scheme:', error)
      }
    }
    loadAndApplyColorScheme()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Animated background */}
      <div className="blob-bg">
        <div className="blob" style={{
          top: '10%',
          left: '20%',
          width: '300px',
          height: '300px',
          background: 'var(--primary-mid)',
        }} />
        <div className="blob" style={{
          top: '60%',
          right: '20%',
          width: '400px',
          height: '400px',
          background: 'var(--primary-light)',
          animationDelay: '-5s',
        }} />
      </div>

      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
