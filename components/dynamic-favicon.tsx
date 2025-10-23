'use client'

import { useEffect, useState } from 'react'

export function DynamicFavicon() {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.faviconUrl) {
            setFaviconUrl(data.faviconUrl)
          }
        }
      } catch (error) {
        console.error('Error loading favicon:', error)
      }
    }
    loadFavicon()
  }, [])

  return (
    <>
      <link
        rel="icon"
        type="image/x-icon"
        href={faviconUrl || '/favicon.ico'}
      />
      <link
        rel="apple-touch-icon"
        href={faviconUrl || '/favicon.ico'}
      />
    </>
  )
}
