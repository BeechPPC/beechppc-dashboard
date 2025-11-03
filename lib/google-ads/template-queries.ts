/**
 * Google Ads Query Functions for Report Templates
 * Fetches data based on template configurations
 */

import { GoogleAdsApi } from 'google-ads-api'
import type { ReportTemplate } from './report-templates'

// Initialize Google Ads API client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
})

export interface SearchTermData {
  searchTerm: string
  status: string
  campaign: string
  adGroup: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
}

export interface AdData {
  adId: string
  adName: string
  adType: string
  finalUrls: string[]
  campaign: string
  adGroup: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
}

export interface KeywordData {
  keyword: string
  matchType: string
  criterionId: string
  campaign: string
  adGroup: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
  ctr: number
  costPerConversion: number
  avgCpc?: number
  accountId?: string
  accountName?: string
}

/**
 * Get search terms with zero conversions
 */
export async function getZeroConversionSearchTerms(
  customerId: string,
  dateRange: string = 'LAST_14_DAYS'
): Promise<SearchTermData[]> {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
    })

    const query = `
      SELECT
        search_term_view.search_term,
        search_term_view.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        campaign.name,
        ad_group.name
      FROM search_term_view
      WHERE segments.date DURING ${dateRange}
        AND metrics.clicks > 0
        AND metrics.conversions = 0
      ORDER BY metrics.clicks DESC
    `

    const results = await accountCustomer.query(query)

    return results.map(row => ({
      searchTerm: row.search_term_view?.search_term || '',
      status: String(row.search_term_view?.status || 'UNKNOWN'),
      campaign: row.campaign?.name || '',
      adGroup: row.ad_group?.name || '',
      impressions: row.metrics?.impressions || 0,
      clicks: row.metrics?.clicks || 0,
      cost: (row.metrics?.cost_micros || 0) / 1_000_000,
      conversions: row.metrics?.conversions || 0,
      ctr: (row.metrics?.ctr || 0) * 100,
    }))
  } catch (error) {
    console.error(`Error fetching zero conversion search terms for ${customerId}:`, error)
    return []
  }
}

/**
 * Get best performing ads by CTR
 */
export async function getBestPerformingAdsByCtr(
  customerId: string,
  dateRange: string = 'LAST_14_DAYS',
  limit: number = 20
): Promise<AdData[]> {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
    })

    const query = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.ad.final_urls,
        campaign.name,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM ad_group_ad
      WHERE segments.date DURING ${dateRange}
        AND metrics.impressions >= 100
        AND ad_group_ad.status = 'ENABLED'
      ORDER BY metrics.ctr DESC
      LIMIT ${limit}
    `

    const results = await accountCustomer.query(query)

    return results.map(row => ({
      adId: String(row.ad_group_ad?.ad?.id || ''),
      adName: row.ad_group_ad?.ad?.name || `Ad ${row.ad_group_ad?.ad?.id || 'Unknown'}`,
      adType: String(row.ad_group_ad?.ad?.type || 'UNKNOWN'),
      finalUrls: row.ad_group_ad?.ad?.final_urls || [],
      campaign: row.campaign?.name || '',
      adGroup: row.ad_group?.name || '',
      impressions: row.metrics?.impressions || 0,
      clicks: row.metrics?.clicks || 0,
      cost: (row.metrics?.cost_micros || 0) / 1_000_000,
      conversions: row.metrics?.conversions || 0,
      ctr: (row.metrics?.ctr || 0) * 100,
    }))
  } catch (error) {
    console.error(`Error fetching best performing ads for ${customerId}:`, error)
    return []
  }
}

/**
 * Get best performing keywords by conversions
 */
export async function getBestPerformingKeywordsByConversion(
  customerId: string,
  dateRange: string = 'LAST_14_DAYS',
  limit: number = 20
): Promise<KeywordData[]> {
  try {
    const accountCustomer = client.Customer({
      customer_id: customerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
    })

    const query = `
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.criterion_id,
        campaign.name,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.cost_per_conversion
      FROM keyword_view
      WHERE segments.date DURING ${dateRange}
        AND metrics.conversions >= 1
        AND ad_group_criterion.status = 'ENABLED'
      ORDER BY metrics.conversions DESC
      LIMIT ${limit}
    `

    const results = await accountCustomer.query(query)

    return results.map(row => ({
      keyword: row.ad_group_criterion?.keyword?.text || '',
      matchType: String(row.ad_group_criterion?.keyword?.match_type || 'UNKNOWN'),
      criterionId: String(row.ad_group_criterion?.criterion_id || ''),
      campaign: row.campaign?.name || '',
      adGroup: row.ad_group?.name || '',
      impressions: row.metrics?.impressions || 0,
      clicks: row.metrics?.clicks || 0,
      cost: (row.metrics?.cost_micros || 0) / 1_000_000,
      conversions: row.metrics?.conversions || 0,
      ctr: (row.metrics?.ctr || 0) * 100,
      costPerConversion: (row.metrics?.cost_per_conversion || 0) / 1_000_000,
    }))
  } catch (error) {
    console.error(`Error fetching best performing keywords for ${customerId}:`, error)
    return []
  }
}

/**
 * Get highest CPC keywords across all accounts
 */
export async function getHighestCpcKeywords(
  customerIds: string[],
  dateRange: string = 'LAST_7_DAYS',
  limit: number = 50
): Promise<KeywordData[]> {
  try {
    const allKeywords: KeywordData[] = []

    // Fetch keywords from all accounts in parallel
    const results = await Promise.all(
      customerIds.map(async (customerId) => {
        try {
          const accountCustomer = client.Customer({
            customer_id: customerId,
            refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
            login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
          })

          const query = `
            SELECT
              ad_group_criterion.keyword.text,
              ad_group_criterion.keyword.match_type,
              ad_group_criterion.criterion_id,
              campaign.name,
              ad_group.name,
              customer.id,
              customer.descriptive_name,
              metrics.impressions,
              metrics.clicks,
              metrics.cost_micros,
              metrics.conversions,
              metrics.ctr,
              metrics.average_cpc
            FROM keyword_view
            WHERE segments.date DURING ${dateRange}
              AND metrics.clicks > 0
              AND ad_group_criterion.status = 'ENABLED'
            ORDER BY metrics.average_cpc DESC
            LIMIT ${limit}
          `

          const accountResults = await accountCustomer.query(query)

          return accountResults.map(row => ({
            keyword: row.ad_group_criterion?.keyword?.text || '',
            matchType: String(row.ad_group_criterion?.keyword?.match_type || 'UNKNOWN'),
            criterionId: String(row.ad_group_criterion?.criterion_id || ''),
            campaign: row.campaign?.name || '',
            adGroup: row.ad_group?.name || '',
            accountId: String(row.customer?.id || customerId),
            accountName: row.customer?.descriptive_name || '',
            impressions: row.metrics?.impressions || 0,
            clicks: row.metrics?.clicks || 0,
            cost: (row.metrics?.cost_micros || 0) / 1_000_000,
            conversions: row.metrics?.conversions || 0,
            ctr: (row.metrics?.ctr || 0) * 100,
            avgCpc: (row.metrics?.average_cpc || 0) / 1_000_000,
            costPerConversion: row.metrics?.conversions > 0
              ? (row.metrics?.cost_micros || 0) / row.metrics.conversions / 1_000_000
              : 0,
          }))
        } catch (error) {
          console.error(`Error fetching keywords for account ${customerId}:`, error)
          return []
        }
      })
    )

    // Flatten all results
    results.forEach(accountKeywords => {
      allKeywords.push(...accountKeywords)
    })

    // Sort by avgCpc descending and return top N
    return allKeywords
      .sort((a, b) => (b.avgCpc || 0) - (a.avgCpc || 0))
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching highest CPC keywords:', error)
    return []
  }
}

/**
 * Execute a template query for a specific account
 */
export async function executeTemplateQuery(
  customerId: string,
  template: ReportTemplate
): Promise<SearchTermData[] | AdData[] | KeywordData[]> {
  switch (template.type) {
    case 'SEARCH_TERMS':
      return await getZeroConversionSearchTerms(customerId, template.dateRange)

    case 'ADS':
      return await getBestPerformingAdsByCtr(customerId, template.dateRange, template.limit)

    case 'KEYWORDS':
      return await getBestPerformingKeywordsByConversion(customerId, template.dateRange, template.limit)

    default:
      throw new Error(`Unknown template type: ${template.type}`)
  }
}
