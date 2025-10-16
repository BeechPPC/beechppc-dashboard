import { NextResponse } from 'next/server'
import { getCustomerAccounts } from '@/lib/google-ads/client'

export async function GET() {
  try {
    const accounts = await getCustomerAccounts()
    return NextResponse.json({ success: true, accounts })
  } catch (error) {
    console.error('API Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch accounts'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
