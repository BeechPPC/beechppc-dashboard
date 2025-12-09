'use client'

import { SignIn } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export default function SignInPage() {
  const [businessName, setBusinessName] = useState('PPC AI Dashboard')

  useEffect(() => {
    const loadBusinessName = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.companyName) {
            setBusinessName(data.companyName)
          }
        }
      } catch (error) {
        console.error('Error loading business name:', error)
      }
    }
    loadBusinessName()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-yellow-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{businessName}</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
        />
      </div>
    </div>
  )
}
