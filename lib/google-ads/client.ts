import { GoogleAdsApi } from 'google-ads-api'
import type { GoogleAdsAccount, AccountMetrics, AccountPerformance } from './types'

// Initialize Google Ads API client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
})

// Authenticate with refresh token
const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
})

/**
 * Get all customer accounts under the MCC
 */
export async function getCustomerAccounts(): Promise<GoogleAdsAccount[]> {
  try {
    const query = `
      SELECT
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.status,
        customer_client.currency_code
      FROM customer_client
      WHERE customer_client.level = 1
        AND customer_client.status = 'ENABLED'
    `

    const accounts = await customer.query(query)

    return accounts
      .map((account) => {
        if (!account.customer_client || !account.customer_client.id) return null
        return {
          id: account.customer_client.id.toString(),
          name: account.customer_client.descriptive_name || 'Unnamed Account',
          status: String(account.customer_client.status || 'UNKNOWN'),
          currency: account.customer_client.currency_code || 'AUD',
        }
      })
      .filter((account): account is GoogleAdsAccount => account !== null)
  } catch (error) {
    console.error('Error fetching customer accounts:', error)
    throw error
  }
}

/**
 * Get performance metrics for a specific customer account
 */
export async function getAccountMetrics(
  customerId: string,
  dateRange: string = 'YESTERDAY',
  customDateFrom?: string,
  customDateTo?: string
): Promise<AccountMetrics | null> {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
    })

    // Use custom date range if provided, otherwise use preset
    let dateCondition: string
    if (customDateFrom && customDateTo) {
      dateCondition = `segments.date BETWEEN '${customDateFrom}' AND '${customDateTo}'`
    } else {
      dateCondition = `segments.date DURING ${dateRange}`
    }

    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        metrics.cost_micros,
        metrics.conversions,
        metrics.clicks,
        metrics.impressions,
        segments.date
      FROM campaign
      WHERE ${dateCondition}
    `

    const results = await accountCustomer.query(query)

    if (!results || results.length === 0) {
      return null
    }

    // Aggregate metrics across all campaigns
    const aggregated = results.reduce(
      (acc, row) => {
        if (row.metrics) {
          acc.cost_micros += row.metrics.cost_micros || 0
          acc.conversions += row.metrics.conversions || 0
          acc.clicks += row.metrics.clicks || 0
          acc.impressions += row.metrics.impressions || 0
        }
        return acc
      },
      { cost_micros: 0, conversions: 0, clicks: 0, impressions: 0 }
    )

    const avgCpc = aggregated.clicks > 0 ? aggregated.cost_micros / aggregated.clicks : 0
    const costPerConv = aggregated.conversions > 0 ? aggregated.cost_micros / aggregated.conversions : 0

    return {
      cost: aggregated.cost_micros / 1_000_000,
      conversions: aggregated.conversions,
      clicks: aggregated.clicks,
      impressions: aggregated.impressions,
      avgCpc: avgCpc / 1_000_000,
      costPerConv: costPerConv / 1_000_000,
    }
  } catch (error) {
    console.error(`Error fetching metrics for customer ${customerId}:`, error)
    return null
  }
}

/**
 * Get all MCC accounts with their performance metrics
 */
export async function getMccReportData(
  dateFrom?: string,
  dateTo?: string,
  comparisonDateFrom?: string,
  comparisonDateTo?: string,
  accountId?: string
): Promise<AccountPerformance[]> {
  try {
    const allAccounts = await getCustomerAccounts()

    // Filter to single account if specified
    const accounts = accountId
      ? allAccounts.filter(acc => acc.id === accountId)
      : allAccounts

    const reportData: AccountPerformance[] = []

    for (const account of accounts) {
      const [yesterdayMetrics, previousDayMetrics] = await Promise.all([
        getAccountMetrics(account.id, 'YESTERDAY', dateFrom, dateTo),
        getAccountMetrics(account.id, 'LAST_7_DAYS', comparisonDateFrom, comparisonDateTo),
      ])

      if (yesterdayMetrics) {
        reportData.push({
          id: account.id,
          name: account.name,
          currency: account.currency,
          yesterday: yesterdayMetrics,
          previousDay: previousDayMetrics || undefined,
        })
      }
    }

    return reportData
  } catch (error) {
    console.error('Error generating MCC report data:', error)
    throw error
  }
}

export interface ConversionAction {
  id: string
  name: string
  status: string
  lastConversionDate: string | null
  daysSinceLastConversion: number | null
}

/**
 * Get conversion actions and their last conversion dates for an account
 */
export async function getConversionActions(customerId: string): Promise<ConversionAction[]> {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
    })

    // Get all conversion actions for the account
    const conversionActionsQuery = `
      SELECT
        conversion_action.id,
        conversion_action.name,
        conversion_action.status
      FROM conversion_action
      WHERE conversion_action.status = 'ENABLED'
    `

    const conversionActions = await accountCustomer.query(conversionActionsQuery)

    const results: ConversionAction[] = []

    // For each conversion action, get the last conversion date
    for (const action of conversionActions) {
      if (!action.conversion_action) continue

      const conversionActionId = action.conversion_action.id?.toString()
      const conversionActionName = action.conversion_action.name || 'Unnamed'

      // Query for the most recent conversion for this action (last 90 days)
      const lastConversionQuery = `
        SELECT
          segments.conversion_action,
          segments.conversion_action_name,
          segments.date,
          metrics.conversions
        FROM campaign
        WHERE segments.conversion_action = '${conversionActionId}'
          AND segments.date DURING LAST_90_DAYS
          AND metrics.conversions > 0
        ORDER BY segments.date DESC
        LIMIT 1
      `

      try {
        const lastConversionResults = await accountCustomer.query(lastConversionQuery)

        let lastConversionDate: string | null = null
        let daysSinceLastConversion: number | null = null

        if (lastConversionResults && lastConversionResults.length > 0) {
          const lastConv = lastConversionResults[0]
          if (lastConv.segments?.date) {
            lastConversionDate = lastConv.segments.date

            // Calculate days since last conversion
            const lastDate = new Date(lastConversionDate)
            const today = new Date()
            daysSinceLastConversion = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          }
        }

        results.push({
          id: conversionActionId || '',
          name: conversionActionName,
          status: String(action.conversion_action.status || 'UNKNOWN'),
          lastConversionDate,
          daysSinceLastConversion,
        })
      } catch (convError) {
        console.error(`Error fetching last conversion for action ${conversionActionName}:`, convError)
        // Still include the action, just without last conversion data
        results.push({
          id: conversionActionId || '',
          name: conversionActionName,
          status: String(action.conversion_action.status || 'UNKNOWN'),
          lastConversionDate: null,
          daysSinceLastConversion: null,
        })
      }
    }

    return results
  } catch (error) {
    console.error(`Error fetching conversion actions for customer ${customerId}:`, error)
    throw error
  }
}
