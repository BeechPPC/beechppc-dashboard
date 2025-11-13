import { NextResponse } from 'next/server'
import { getCampaignPerformance, getKeywordPerformance, getAccountMetrics, getCustomerAccounts } from '@/lib/google-ads/client'
import { generateMonthlyReportTemplate, type MonthlyReportData } from '@/lib/email/monthly-template'
import { generateExecutiveSummaryTemplate } from '@/lib/email/templates/executive-summary'
import { generateKeywordDeepDiveTemplate } from '@/lib/email/templates/keyword-deep-dive'
import { generateAuctionInsightsTemplate } from '@/lib/email/templates/auction-insights'
import { sendEmail } from '@/lib/email/service'
import { storeReport } from '@/lib/reports/storage'
import type { CampaignPerformance, KeywordPerformance } from '@/lib/google-ads/client'

interface MonthlyReportRequest {
  accountIds: string[]
  dateFrom: string
  dateTo: string
  sections: {
    campaigns: boolean
    keywords: boolean
    auctionInsights: boolean
    qualityScore: boolean
    geographic: boolean
    device: boolean
    adSchedule: boolean
    searchTerms: boolean
    conversions: boolean
  }
  template: string
  recipients: string[]
}

export async function POST(request: Request) {
  try {
    const body: MonthlyReportRequest = await request.json()
    const { accountIds, dateFrom, dateTo, sections, recipients, template } = body

    // Validate inputs
    if (!accountIds || accountIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one account must be selected' },
        { status: 400 }
      )
    }

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: 'Date range is required' },
        { status: 400 }
      )
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one recipient is required' },
        { status: 400 }
      )
    }

    console.log(`Generating monthly reports for ${accountIds.length} account(s) from ${dateFrom} to ${dateTo}`)

    // Fetch all accounts to get names and currencies
    const allAccounts = await getCustomerAccounts()
    const accountsMap = new Map(allAccounts.map(acc => [acc.id, acc]))

    // Generate report for each account
    const reportPromises = accountIds.map(async (accountId) => {
      try {
        console.log(`Fetching data for account: ${accountId}`)

        // Fetch account metrics
        const accountMetrics = await getAccountMetrics(accountId, 'CUSTOM', dateFrom, dateTo)

        if (!accountMetrics) {
          throw new Error(`Failed to fetch metrics for account ${accountId}`)
        }

        // Fetch campaigns if requested
        let campaigns: CampaignPerformance[] = []
        if (sections.campaigns) {
          campaigns = await getCampaignPerformance(accountId, 'CUSTOM', dateFrom, dateTo)
          console.log(`Fetched ${campaigns.length} campaigns for ${accountId}`)
        }

        // Fetch keywords if requested
        let topKeywords: KeywordPerformance[] = []
        let poorKeywords: KeywordPerformance[] = []
        if (sections.keywords) {
          const allKeywords = await getKeywordPerformance(accountId, 'CUSTOM', 100, dateFrom, dateTo)
          console.log(`Fetched ${allKeywords.length} keywords for ${accountId}`)

          // Sort by conversions for top keywords
          topKeywords = allKeywords
            .filter(k => k.conversions > 0)
            .sort((a, b) => b.conversions - a.conversions)
            .slice(0, 10)

          // Find poor performing keywords (high spend, low/no conversions)
          poorKeywords = allKeywords
            .filter(k => k.cost > 50 && k.conversions === 0)
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 5)
        }

        // Calculate summary metrics
        const totalSpend = accountMetrics.cost
        const totalConversions = accountMetrics.conversions
        const totalClicks = accountMetrics.clicks
        const totalImpressions = accountMetrics.impressions
        const avgCtr = (totalClicks / totalImpressions) * 100
        const avgCpc = totalSpend / totalClicks
        const costPerConversion = totalSpend / totalConversions
        const conversionRate = (totalConversions / totalClicks) * 100

        // Generate insights based on data
        const insights = generateInsights(campaigns, topKeywords, poorKeywords, {
          avgCtr,
          avgCpc,
          costPerConversion,
          conversionRate,
        })

        // Get account details
        const accountDetails = accountsMap.get(accountId)
        const accountName = accountDetails?.name || accountId
        const currency = accountDetails?.currency || 'AUD'

        // Format month label
        const fromDate = new Date(dateFrom)
        const monthLabel = fromDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

        // Prepare report data
        const reportData: MonthlyReportData = {
          accountName,
          accountId,
          currency,
          month: monthLabel,
          summary: {
            totalSpend,
            totalConversions,
            totalClicks,
            totalImpressions,
            avgCtr,
            avgCpc,
            costPerConversion,
            conversionRate,
          },
          campaigns: sections.campaigns ? campaigns : [],
          topKeywords: sections.keywords ? topKeywords : [],
          poorPerformingKeywords: sections.keywords ? poorKeywords : [],
          insights,
        }

        return reportData
      } catch (error) {
        console.error(`Error generating report for account ${accountId}:`, error)
        throw error
      }
    })

    const reportsData = await Promise.all(reportPromises)

    // Generate report ID
    const reportId = `monthly-${Date.now()}`

    // Send email and store report HTML for each account
    const emailPromises = reportsData.map(async (reportData, index) => {
      // Generate HTML using the selected template
      let emailHtml: string
      let templateName: string

      switch (template) {
        case 'executive':
          emailHtml = generateExecutiveSummaryTemplate(reportData)
          templateName = 'Executive Summary'
          break
        case 'keyword':
          emailHtml = generateKeywordDeepDiveTemplate(reportData)
          templateName = 'Keyword Deep Dive'
          break
        case 'auction':
          emailHtml = generateAuctionInsightsTemplate(reportData)
          templateName = 'Auction Insights Focus'
          break
        case 'detailed':
        default:
          emailHtml = generateMonthlyReportTemplate(reportData)
          templateName = 'Detailed Performance'
          break
      }

      const subject = `${templateName} - ${reportData.accountName} - ${reportData.month}`

      // Store report HTML for PDF download (use unique ID for each account if multiple)
      const uniqueReportId = reportsData.length > 1 ? `${reportId}-${index}` : reportId
      storeReport(uniqueReportId, reportData.accountName, reportData.month, emailHtml)

      return sendEmail({
        to: recipients.join(','),
        subject,
        html: emailHtml,
      })
    })

    await Promise.all(emailPromises)

    console.log(`Successfully sent ${reportsData.length} monthly report(s) to ${recipients.length} recipient(s)`)

    return NextResponse.json({
      success: true,
      message: `Successfully generated and sent ${reportsData.length} monthly report(s)`,
      reportCount: reportsData.length,
      recipients,
      reportId, // Return the base report ID for PDF download
    })
  } catch (error) {
    console.error('Monthly report API error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate monthly report'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

function generateInsights(
  campaigns: CampaignPerformance[],
  topKeywords: KeywordPerformance[],
  poorKeywords: KeywordPerformance[],
  metrics: { avgCtr: number; avgCpc: number; costPerConversion: number; conversionRate: number }
) {
  const whatWorking: string[] = []
  const poorPerforming: string[] = []
  const recommendations: string[] = []

  // Analyze campaigns
  if (campaigns.length > 0) {
    const bestCampaign = campaigns
      .filter(c => c.conversions > 0)
      .sort((a, b) => a.costPerConversion - b.costPerConversion)[0]

    if (bestCampaign) {
      whatWorking.push(
        `Campaign "${bestCampaign.name}" is delivering the best ROI with ${bestCampaign.conversions} conversions at $${bestCampaign.costPerConversion.toFixed(2)} per conversion`
      )
    }

    const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED')
    if (pausedCampaigns.length > 0) {
      poorPerforming.push(
        `${pausedCampaigns.length} campaign(s) are currently paused - consider reviewing if they should be re-enabled or archived`
      )
    }
  }

  // Analyze keywords
  if (topKeywords.length > 0) {
    const bestKeyword = topKeywords[0]
    whatWorking.push(
      `Top keyword "${bestKeyword.keyword}" (${bestKeyword.matchType.toLowerCase()}) has excellent performance with ${bestKeyword.conversions} conversions at $${bestKeyword.costPerConversion.toFixed(2)} each`
    )

    const highQualityKeywords = topKeywords.filter(k => k.qualityScore && k.qualityScore >= 8)
    if (highQualityKeywords.length > 0) {
      whatWorking.push(
        `${highQualityKeywords.length} keywords have Quality Scores of 8 or higher, keeping costs competitive`
      )
    }
  }

  if (poorKeywords.length > 0) {
    const wastedSpend = poorKeywords.reduce((sum, k) => sum + k.cost, 0)
    poorPerforming.push(
      `${poorKeywords.length} keywords have spent $${wastedSpend.toFixed(2)} with zero conversions - consider pausing or adding negative keywords`
    )

    const lowQualityKeywords = poorKeywords.filter(k => k.qualityScore && k.qualityScore < 5)
    if (lowQualityKeywords.length > 0) {
      poorPerforming.push(
        `${lowQualityKeywords.length} keywords showing Quality Scores below 5, indicating poor relevance and higher costs`
      )
    }
  }

  // General metrics insights
  if (metrics.conversionRate > 10) {
    whatWorking.push(
      `Overall conversion rate of ${metrics.conversionRate.toFixed(2)}% indicates strong ad relevance and landing page performance`
    )
  } else if (metrics.conversionRate < 5) {
    poorPerforming.push(
      `Conversion rate of ${metrics.conversionRate.toFixed(2)}% is below average - consider reviewing ad copy and landing pages`
    )
  }

  // Recommendations
  if (poorKeywords.length > 0) {
    recommendations.push(
      'Add negative keywords for terms that are not converting to prevent wasted spend on irrelevant searches'
    )
  }

  if (campaigns.length > 0) {
    const bestCampaign = campaigns
      .filter(c => c.conversions > 0)
      .sort((a, b) => a.costPerConversion - b.costPerConversion)[0]

    if (bestCampaign) {
      recommendations.push(
        `Increase budget allocation to "${bestCampaign.name}" which has the lowest cost per conversion at $${bestCampaign.costPerConversion.toFixed(2)}`
      )
    }
  }

  recommendations.push(
    'Review auction insights to identify opportunities to increase impression share against competitors'
  )

  recommendations.push(
    'Test audience targeting (in-market audiences for relevant categories) to refine targeting and improve conversion rates'
  )

  if (metrics.avgCpc > 3) {
    recommendations.push(
      'Consider implementing bid adjustments for high-performing times of day and locations to optimize spending'
    )
  }

  return {
    whatWorking: whatWorking.length > 0 ? whatWorking : ['Data is being collected to generate insights'],
    poorPerforming: poorPerforming.length > 0 ? poorPerforming : ['No significant issues detected'],
    recommendations,
  }
}

export const dynamic = 'force-dynamic'
