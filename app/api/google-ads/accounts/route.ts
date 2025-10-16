import { NextResponse } from 'next/server'
import { getCustomerAccounts } from '@/lib/google-ads/client'

export async function GET() {
  try {
    const accounts = await getCustomerAccounts()
    return NextResponse.json({ success: true, accounts })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}
