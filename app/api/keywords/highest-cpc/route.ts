import { NextResponse } from 'next/server'
import { getCustomerAccounts } from '@/lib/google-ads/client'
import { getHighestCpcKeywords } from '@/lib/google-ads/template-queries'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const dateRange = searchParams.get('dateRange') || 'LAST_7_DAYS'

    // Get all customer accounts
    const accounts = await getCustomerAccounts()
    const customerIds = accounts.map(account => account.id)

    if (customerIds.length === 0) {
      return NextResponse.json(
        { error: 'No customer accounts found' },
        { status: 404 }
      )
    }

    // Get highest CPC keywords across all accounts
    const keywords = await getHighestCpcKeywords(customerIds, dateRange, limit)

    return NextResponse.json({
      keywords,
      totalAccounts: customerIds.length,
      dateRange,
    })
  } catch (error) {
    console.error('Error fetching highest CPC keywords:', error)
    return NextResponse.json(
      { error: 'Failed to fetch highest CPC keywords' },
      { status: 500 }
    )
  }
}
