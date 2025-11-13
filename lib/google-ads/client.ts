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

export interface DisapprovedAd {
  adId: string
  adName: string
  adGroupId: string
  adGroupName: string
  campaignId: string
  campaignName: string
  disapprovalReasons: string[]
  policyTopicEntries: string[]
}

export interface CampaignPerformance {
  id: string
  name: string
  status: string
  budget: number
  budgetType: string
  cost: number
  conversions: number
  clicks: number
  impressions: number
  ctr: number
  avgCpc: number
  costPerConversion: number
  conversionRate: number
}

export interface KeywordPerformance {
  keyword: string
  matchType: string
  campaign: string
  adGroup: string
  cost: number
  conversions: number
  clicks: number
  impressions: number
  ctr: number
  avgCpc: number
  costPerConversion: number
  qualityScore: number | null
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

/**
 * Get all disapproved ads for an account
 */
export async function getDisapprovedAds(customerId: string): Promise<DisapprovedAd[]> {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
    })

    // Query for disapproved ads
    const query = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.policy_summary.approval_status,
        ad_group_ad.policy_summary.policy_topic_entries,
        ad_group.id,
        ad_group.name,
        campaign.id,
        campaign.name
      FROM ad_group_ad
      WHERE ad_group_ad.policy_summary.approval_status = 'DISAPPROVED'
        AND ad_group_ad.status = 'ENABLED'
        AND ad_group.status = 'ENABLED'
        AND campaign.status = 'ENABLED'
    `

    const results = await accountCustomer.query(query)

    const disapprovedAds: DisapprovedAd[] = []

    for (const row of results) {
      if (!row.ad_group_ad?.ad || !row.ad_group || !row.campaign) continue

      const ad = row.ad_group_ad.ad
      const policyTopicEntries = row.ad_group_ad.policy_summary?.policy_topic_entries || []

      // Extract disapproval reasons from policy topic entries
      const disapprovalReasons: string[] = []
      const policyTopics: string[] = []

      for (const entry of policyTopicEntries) {
        if (entry.topic) {
          policyTopics.push(String(entry.topic))
        }
        // Get evidences if available
        if (entry.evidences) {
          for (const evidence of entry.evidences) {
            if (evidence.text_list?.texts) {
              for (const text of evidence.text_list.texts) {
                if (text) {
                  disapprovalReasons.push(String(text))
                }
              }
            }
          }
        }
      }

      // If no specific reasons found, use the policy topics
      if (disapprovalReasons.length === 0 && policyTopics.length > 0) {
        disapprovalReasons.push(...policyTopics)
      }

      // If still no reasons, add a generic message
      if (disapprovalReasons.length === 0) {
        disapprovalReasons.push('Policy violation (details not available)')
      }

      disapprovedAds.push({
        adId: ad.id?.toString() || '',
        adName: ad.name || `Ad ${ad.id}` || 'Unnamed Ad',
        adGroupId: row.ad_group.id?.toString() || '',
        adGroupName: row.ad_group.name || 'Unnamed Ad Group',
        campaignId: row.campaign.id?.toString() || '',
        campaignName: row.campaign.name || 'Unnamed Campaign',
        disapprovalReasons,
        policyTopicEntries: policyTopics,
      })
    }

    return disapprovedAds
  } catch (error) {
    console.error(`Error fetching disapproved ads for customer ${customerId}:`, error)
    throw error
  }
}

/**
 * Get campaign performance metrics for an account
 */
export async function getCampaignPerformance(
  customerId: string,
  dateRange: string = 'LAST_7_DAYS',
  customDateFrom?: string,
  customDateTo?: string
): Promise<CampaignPerformance[]> {
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
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        campaign_budget.period,
        metrics.cost_micros,
        metrics.conversions,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE ${dateCondition}
        AND campaign.status IN ('ENABLED', 'PAUSED')
      ORDER BY metrics.cost_micros DESC
    `

    const results = await accountCustomer.query(query)

    return results.map(row => {
      const cost = (row.metrics?.cost_micros || 0) / 1_000_000
      const conversions = row.metrics?.conversions || 0
      const clicks = row.metrics?.clicks || 0
      const impressions = row.metrics?.impressions || 0

      return {
        id: row.campaign?.id?.toString() || '',
        name: row.campaign?.name || 'Unnamed Campaign',
        status: String(row.campaign?.status || 'UNKNOWN'),
        budget: (row.campaign_budget?.amount_micros || 0) / 1_000_000,
        budgetType: String(row.campaign_budget?.period || 'DAILY'),
        cost,
        conversions,
        clicks,
        impressions,
        ctr: (row.metrics?.ctr || 0) * 100,
        avgCpc: (row.metrics?.average_cpc || 0) / 1_000_000,
        costPerConversion: conversions > 0 ? cost / conversions : 0,
        conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      }
    })
  } catch (error) {
    console.error(`Error fetching campaign performance for customer ${customerId}:`, error)
    throw error
  }
}

/**
 * Get keyword performance metrics for an account
 */
export async function getKeywordPerformance(
  customerId: string,
  dateRange: string = 'LAST_7_DAYS',
  limit: number = 50,
  customDateFrom?: string,
  customDateTo?: string
): Promise<KeywordPerformance[]> {
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
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        campaign.name,
        ad_group.name,
        metrics.cost_micros,
        metrics.conversions,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.average_cpc
      FROM keyword_view
      WHERE ${dateCondition}
        AND ad_group_criterion.status = 'ENABLED'
        AND metrics.impressions > 0
      ORDER BY metrics.cost_micros DESC
      LIMIT ${limit}
    `

    const results = await accountCustomer.query(query)

    return results.map(row => {
      const cost = (row.metrics?.cost_micros || 0) / 1_000_000
      const conversions = row.metrics?.conversions || 0
      const clicks = row.metrics?.clicks || 0

      return {
        keyword: row.ad_group_criterion?.keyword?.text || '',
        matchType: String(row.ad_group_criterion?.keyword?.match_type || 'UNKNOWN'),
        campaign: row.campaign?.name || 'Unknown',
        adGroup: row.ad_group?.name || 'Unknown',
        cost,
        conversions,
        clicks,
        impressions: row.metrics?.impressions || 0,
        ctr: (row.metrics?.ctr || 0) * 100,
        avgCpc: (row.metrics?.average_cpc || 0) / 1_000_000,
        costPerConversion: conversions > 0 ? cost / conversions : 0,
        qualityScore: row.ad_group_criterion?.quality_info?.quality_score || null,
      }
    })
  } catch (error) {
    console.error(`Error fetching keyword performance for customer ${customerId}:`, error)
    throw error
  }
}
