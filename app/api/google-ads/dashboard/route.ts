import { NextResponse } from 'next/server'
import { getMccReportData } from '@/lib/google-ads/client'
import { calculatePercentageChange } from '@/lib/utils'
import type { DashboardMetrics } from '@/lib/google-ads/types'

export async function GET() {
  try {
    // Log environment variable status (without exposing secrets)
    console.log('[Dashboard API] Environment check:', {
      hasClientId: !!process.env.GOOGLE_ADS_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_ADS_CLIENT_SECRET,
      hasDeveloperToken: !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      hasRefreshToken: !!process.env.GOOGLE_ADS_REFRESH_TOKEN,
      hasLoginCustomerId: !!process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    })

    const accountsData = await getMccReportData()

    // Aggregate metrics across all accounts
    const totals = accountsData.reduce(
      (acc, account) => {
        acc.yesterday.spend += account.yesterday.cost
        acc.yesterday.conversions += account.yesterday.conversions
        acc.yesterday.clicks += account.yesterday.clicks
        acc.yesterday.impressions += account.yesterday.impressions

        if (account.previousDay) {
          acc.previous.spend += account.previousDay.cost
          acc.previous.conversions += account.previousDay.conversions
          acc.previous.clicks += account.previousDay.clicks
          acc.previous.impressions += account.previousDay.impressions
        }

        return acc
      },
      {
        yesterday: { spend: 0, conversions: 0, clicks: 0, impressions: 0 },
        previous: { spend: 0, conversions: 0, clicks: 0, impressions: 0 },
      }
    )

    const avgCpc = totals.yesterday.clicks > 0
      ? totals.yesterday.spend / totals.yesterday.clicks
      : 0

    const avgCostPerConv = totals.yesterday.conversions > 0
      ? totals.yesterday.spend / totals.yesterday.conversions
      : 0

    const metrics: DashboardMetrics = {
      totalSpend: totals.yesterday.spend,
      totalConversions: totals.yesterday.conversions,
      totalClicks: totals.yesterday.clicks,
      totalImpressions: totals.yesterday.impressions,
      avgCpc,
      avgCostPerConv,
      changeVsPrevious: {
        spend: calculatePercentageChange(totals.yesterday.spend, totals.previous.spend),
        conversions: calculatePercentageChange(totals.yesterday.conversions, totals.previous.conversions),
        clicks: calculatePercentageChange(totals.yesterday.clicks, totals.previous.clicks),
        impressions: calculatePercentageChange(totals.yesterday.impressions, totals.previous.impressions),
      },
    }

    return NextResponse.json({
      success: true,
      metrics,
      accountCount: accountsData.length,
      accounts: accountsData
    })
  } catch (error) {
    console.error('[Dashboard API] Error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    })

    const message = error instanceof Error ? error.message : 'Failed to fetch dashboard data'
    return NextResponse.json(
      {
        success: false,
        error: message,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}

// Enable dynamic rendering to fetch fresh data
export const dynamic = 'force-dynamic'
