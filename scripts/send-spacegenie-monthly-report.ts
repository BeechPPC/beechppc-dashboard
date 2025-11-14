/**
 * Generate and send monthly report for Spacegenie for October
 * Run with: npx tsx scripts/send-spacegenie-monthly-report.ts
 */

import 'dotenv/config'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { sendEmail } from '../lib/email/service'
import { generateMonthlyReportTemplate, type MonthlyReportData } from '../lib/email/monthly-template'
import {
  getCustomerAccounts,
  getAccountMetrics,
  getCampaignPerformance,
  getKeywordPerformance,
} from '../lib/google-ads/client'

async function main() {
  try {
    console.log('Finding Spacegenie account...\n')

    // Get all accounts and find Spacegenie
    const allAccounts = await getCustomerAccounts()
    const spacegenieAccount = allAccounts.find((acc) =>
      acc.name.toLowerCase().includes('spacegenie')
    )

    if (!spacegenieAccount) {
      console.error('Error: Could not find Spacegenie account in MCC')
      console.log('\nAvailable accounts:')
      allAccounts.forEach((acc) => console.log(`  - ${acc.name} (${acc.id})`))
      process.exit(1)
    }

    console.log(`Found account: ${spacegenieAccount.name} (${spacegenieAccount.id})\n`)

    // Fetch data for October 2025
    const dateFrom = '2025-10-01'
    const dateTo = '2025-10-31'

    console.log(`Fetching data for October 2025 (${dateFrom} to ${dateTo})...\n`)

    // Fetch all required data in parallel
    const [monthMetrics, campaigns, topKeywords] = await Promise.all([
      getAccountMetrics(spacegenieAccount.id, 'CUSTOM', dateFrom, dateTo),
      getCampaignPerformance(spacegenieAccount.id, 'CUSTOM', dateFrom, dateTo),
      getKeywordPerformance(spacegenieAccount.id, 'CUSTOM', 100, dateFrom, dateTo),
    ])

    if (!monthMetrics) {
      console.error('Error: Could not fetch metrics for Spacegenie account')
      process.exit(1)
    }

    console.log('Data fetched successfully!\n')

    // Calculate summary metrics
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgCpc = totalClicks > 0 ? monthMetrics.cost / totalClicks : 0
    const costPerConversion = totalConversions > 0 ? monthMetrics.cost / totalConversions : 0
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0

    // Sort keywords by conversions (top performing)
    const topPerformingKeywords = [...topKeywords]
      .filter((kw) => kw.conversions > 0)
      .sort((a, b) => b.conversions - a.conversions)

    // Find poor performing keywords (high spend, zero conversions)
    const poorPerformingKeywords = [...topKeywords]
      .filter((kw) => kw.conversions === 0 && kw.cost > 50) // Spent more than $50 with no conversions
      .sort((a, b) => b.cost - a.cost)

    // Generate insights
    const insights = generateInsights(
      campaigns,
      topPerformingKeywords,
      poorPerformingKeywords,
      monthMetrics.cost,
      totalConversions
    )

    // Prepare report data
    const reportData: MonthlyReportData = {
      accountName: spacegenieAccount.name,
      accountId: spacegenieAccount.id,
      currency: spacegenieAccount.currency,
      month: 'October 2025',
      summary: {
        totalSpend: monthMetrics.cost,
        totalConversions,
        totalClicks,
        totalImpressions,
        avgCtr,
        avgCpc,
        costPerConversion,
        conversionRate,
        searchImpressionShare: monthMetrics.searchImpressionShare,
      },
      campaigns,
      topKeywords: topPerformingKeywords,
      poorPerformingKeywords,
      insights,
    }

    // Generate HTML
    console.log('Generating monthly report HTML...\n')
    const emailHtml = generateMonthlyReportTemplate(reportData)

    // Save to file for preview
    const outputPath = join(process.cwd(), 'spacegenie-october-report.html')
    writeFileSync(outputPath, emailHtml)
    console.log(`✓ Monthly report saved to: ${outputPath}\n`)

    // Send email
    const recipient = 'chris@beechppc.com'
    console.log(`Sending monthly report to: ${recipient}...`)

    const result = await sendEmail({
      to: recipient,
      subject: `Monthly Report - ${spacegenieAccount.name} - October 2025`,
      html: emailHtml,
    })

    console.log(`✓ Monthly report sent successfully! (Message ID: ${result.messageId})\n`)
    console.log('Report generation complete!')
  } catch (error) {
    console.error('Error generating monthly report:', error)
    console.error('\nMake sure your .env file has these settings configured:')
    console.error('  - GOOGLE_ADS_CLIENT_ID')
    console.error('  - GOOGLE_ADS_CLIENT_SECRET')
    console.error('  - GOOGLE_ADS_DEVELOPER_TOKEN')
    console.error('  - GOOGLE_ADS_LOGIN_CUSTOMER_ID')
    console.error('  - GOOGLE_ADS_REFRESH_TOKEN')
    console.error('  - EMAIL_HOST')
    console.error('  - EMAIL_PORT')
    console.error('  - EMAIL_USER')
    console.error('  - EMAIL_PASSWORD')
    process.exit(1)
  }
}

/**
 * Generate insights based on campaign and keyword performance
 */
function generateInsights(
  campaigns: any[],
  topKeywords: any[],
  poorKeywords: any[],
  totalSpend: number,
  totalConversions: number
): {
  whatWorking: string[]
  poorPerforming: string[]
  recommendations: string[]
} {
  const whatWorking: string[] = []
  const poorPerforming: string[] = []
  const recommendations: string[] = []

  // Analyze campaigns
  const enabledCampaigns = campaigns.filter((c) => c.status === 'ENABLED')
  const pausedCampaigns = campaigns.filter((c) => c.status === 'PAUSED')

  if (enabledCampaigns.length > 0) {
    const bestCampaign = [...enabledCampaigns].sort((a, b) => b.conversions - a.conversions)[0]
    if (bestCampaign.conversions > 0) {
      whatWorking.push(
        `Campaign "${bestCampaign.name}" is your top performer with ${Math.round(bestCampaign.conversions)} conversions and a ${bestCampaign.conversionRate.toFixed(2)}% conversion rate`
      )
    }

    // Check for high CTR campaigns
    const highCtrCampaigns = enabledCampaigns.filter((c) => c.ctr > 3.0 && c.impressions > 1000)
    if (highCtrCampaigns.length > 0) {
      whatWorking.push(
        `${highCtrCampaigns.length} campaign(s) achieving CTR above 3%, indicating strong ad relevance and messaging`
      )
    }
  }

  // Analyze top keywords
  if (topKeywords.length > 0) {
    const highQualityKeywords = topKeywords.filter((kw) => kw.qualityScore && kw.qualityScore >= 7)
    if (highQualityKeywords.length > 0) {
      whatWorking.push(
        `${highQualityKeywords.length} keywords have Quality Scores of 7 or higher, reducing your cost per click`
      )
    }

    const bestKeyword = topKeywords[0]
    if (bestKeyword && bestKeyword.conversions > 5) {
      whatWorking.push(
        `Top keyword "${bestKeyword.keyword}" is driving strong results with ${Math.round(bestKeyword.conversions)} conversions`
      )
    }
  }

  // Identify poor performing areas
  if (poorKeywords.length > 0) {
    const totalWastedSpend = poorKeywords.reduce((sum, kw) => sum + kw.cost, 0)
    poorPerforming.push(
      `${poorKeywords.length} keywords have spent $${totalWastedSpend.toFixed(2)} with zero conversions - consider pausing or adjusting bids`
    )
  }

  // Check for low quality scores
  const lowQsKeywords = topKeywords.filter((kw) => kw.qualityScore && kw.qualityScore < 5)
  if (lowQsKeywords.length > 0) {
    poorPerforming.push(
      `${lowQsKeywords.length} keywords have Quality Scores below 5, leading to higher costs - review ad relevance and landing pages`
    )
  }

  // Check campaign budget efficiency
  const lowConversionCampaigns = enabledCampaigns.filter(
    (c) => c.cost > 100 && (c.conversions === 0 || c.conversionRate < 2)
  )
  if (lowConversionCampaigns.length > 0) {
    poorPerforming.push(
      `${lowConversionCampaigns.length} campaign(s) with significant spend but low conversion rates - review targeting and ad copy`
    )
  }

  if (pausedCampaigns.length > 0) {
    poorPerforming.push(
      `${pausedCampaigns.length} campaign(s) are currently paused - review if these should be reactivated or archived`
    )
  }

  // Generate recommendations
  const avgCostPerConv = totalConversions > 0 ? totalSpend / totalConversions : 0

  if (totalConversions > 0) {
    recommendations.push(
      `Current cost per conversion is $${avgCostPerConv.toFixed(2)} - look for opportunities to scale high-performing keywords while maintaining this efficiency`
    )
  }

  if (poorKeywords.length > 5) {
    recommendations.push(
      `Add negative keywords to prevent wasted spend on poor-performing search terms`
    )
  }

  if (topKeywords.some((kw) => kw.matchType === 'BROAD')) {
    recommendations.push(
      `Consider testing phrase and exact match variants of your top broad match keywords for better control and efficiency`
    )
  }

  const highSpendLowConv = campaigns.filter((c) => c.cost > 200 && c.costPerConversion > 0 && c.costPerConversion > avgCostPerConv * 1.5)
  if (highSpendLowConv.length > 0) {
    recommendations.push(
      `Review and optimize campaigns with cost per conversion 50% above account average`
    )
  }

  recommendations.push(
    `Review auction insights to understand competitive landscape and identify opportunities to increase impression share`
  )

  recommendations.push(
    `Consider implementing audience targeting to refine who sees your ads and improve conversion rates`
  )

  // Ensure we have at least some content in each section
  if (whatWorking.length === 0) {
    whatWorking.push('Account is actively generating clicks and impressions')
  }

  if (poorPerforming.length === 0) {
    poorPerforming.push('No major performance issues identified this month')
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring performance and adjust bids based on conversion data')
  }

  return {
    whatWorking,
    poorPerforming,
    recommendations,
  }
}

main()
