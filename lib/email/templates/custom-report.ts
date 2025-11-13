import { formatCurrency, formatNumber } from '../../utils'
import type { MonthlyReportData } from '../monthly-template'

interface CustomReportSections {
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

/**
 * Custom Report Template
 * Flexible template that includes account summary plus user-selected sections
 * Dynamically builds report based on checkbox selections
 */
export function generateCustomReportTemplate(
  data: MonthlyReportData,
  sections: CustomReportSections
): string {
  const { accountName, month, summary, campaigns, topKeywords, poorPerformingKeywords, auctionInsights, insights, currency } = data

  // Helper function to generate sections dynamically
  const getCampaignsSection = () => {
    if (!sections.campaigns || campaigns.length === 0) return ''

    const topCampaigns = [...campaigns].sort((a, b) => b.cost - a.cost).slice(0, 10)

    return `
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #fbbf24;">
          📊 Campaign Performance
        </h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #fef3c7;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #fbbf24;">CAMPAIGN</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #fbbf24;">SPEND</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #fbbf24;">CONVERSIONS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #fbbf24;">COST/CONV</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #fbbf24;">CTR</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #fbbf24;">CLICKS</th>
              </tr>
            </thead>
            <tbody>
              ${topCampaigns.map(campaign => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #fde68a;">
                    <strong style="display: block; margin-bottom: 4px;">${campaign.name}</strong>
                    <span style="background-color: ${campaign.status === 'ENABLED' ? '#d1fae5' : '#fee2e2'}; color: ${campaign.status === 'ENABLED' ? '#065f46' : '#991b1b'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                      ${campaign.status}
                    </span>
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap; font-weight: 600;">
                    ${formatCurrency(campaign.cost, currency)}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap; font-weight: 600; color: #059669;">
                    ${Math.round(campaign.conversions)}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
                    ${formatCurrency(campaign.costPerConversion, currency)}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">
                    ${campaign.ctr.toFixed(2)}%
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">
                    ${formatNumber(campaign.clicks)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  }

  const getKeywordsSection = () => {
    if (!sections.keywords || topKeywords.length === 0) return ''

    return `
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #22c55e;">
          🔑 Top Performing Keywords
        </h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #f0fdf4;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">KEYWORD</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">MATCH</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">CONVERSIONS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">COST/CONV</th>
                ${sections.qualityScore ? '<th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">QS</th>' : ''}
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">SPEND</th>
              </tr>
            </thead>
            <tbody>
              ${topKeywords.slice(0, 10).map(keyword => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 600; color: #1f2937;">${keyword.keyword}</div>
                    <div style="font-size: 11px; color: #6b7280;">${keyword.campaign}</div>
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                      ${keyword.matchType}
                    </span>
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #059669;">
                    ${Math.round(keyword.conversions)}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
                    ${formatCurrency(keyword.costPerConversion, currency)}
                  </td>
                  ${sections.qualityScore ? `
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; ${
                      keyword.qualityScore && keyword.qualityScore >= 8
                        ? 'background-color: #d1fae5; color: #065f46;'
                        : keyword.qualityScore && keyword.qualityScore >= 6
                        ? 'background-color: #fef3c7; color: #92400e;'
                        : 'background-color: #fee2e2; color: #991b1b;'
                    }">
                      ${keyword.qualityScore || 'N/A'}
                    </span>
                  </td>
                  ` : ''}
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">
                    ${formatCurrency(keyword.cost, currency)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${poorPerformingKeywords.length > 0 ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-top: 16px; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: 600;">⚠️ Poor Performing Keywords</h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
            ${poorPerformingKeywords.length} keywords spending ${formatCurrency(poorPerformingKeywords.reduce((sum, k) => sum + k.cost, 0), currency)} with zero conversions
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
            ${poorPerformingKeywords.slice(0, 5).map(k => `<li style="margin-bottom: 4px;"><strong>${k.keyword}</strong> - ${formatCurrency(k.cost, currency)} wasted</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    `
  }

  const getAuctionInsightsSection = () => {
    if (!sections.auctionInsights) return ''

    if (!auctionInsights || auctionInsights.length === 0) {
      return `
        <div style="margin-bottom: 40px;">
          <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #3b82f6;">
            🎯 Auction Insights
          </h2>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px;">
            <p style="margin: 0; color: #78716c; font-size: 14px;">
              Auction insights data is not available for this period. This requires sufficient impression volume.
            </p>
          </div>
        </div>
      `
    }

    return `
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #3b82f6;">
          🎯 Auction Insights
        </h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #eff6ff;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">COMPETITOR</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">IMPRESSION SHARE</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">OVERLAP RATE</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">POSITION ABOVE</th>
              </tr>
            </thead>
            <tbody>
              ${auctionInsights.slice(0, 10).map(insight => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${insight.domain}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">
                    ${insight.impressionShare.toFixed(1)}%
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${insight.overlapRate.toFixed(1)}%
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: ${insight.positionAboveRate > 50 ? '#dc2626' : '#22c55e'}; font-weight: 600;">
                      ${insight.positionAboveRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  }

  const getConversionsSection = () => {
    if (!sections.conversions) return ''

    return `
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #8b5cf6;">
          🎯 Conversion Performance
        </h2>
        <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 24px; border-radius: 12px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
            <div>
              <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 8px;">Total Conversions</div>
              <div style="color: #1f2937; font-size: 32px; font-weight: 700;">${Math.round(summary.totalConversions)}</div>
              <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Conversion Rate: ${summary.conversionRate.toFixed(2)}%</div>
            </div>
            <div>
              <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 8px;">Cost Per Conversion</div>
              <div style="color: #1f2937; font-size: 32px; font-weight: 700;">${formatCurrency(summary.costPerConversion, currency)}</div>
              <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Total Spend: ${formatCurrency(summary.totalSpend, currency)}</div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Custom Report - ${accountName} - ${month}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 900px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="margin: 0 0 8px 0; color: #1f2937; font-size: 32px; font-weight: 700;">
        📋 Custom Report
      </h1>
      <p style="margin: 0; color: #374151; font-size: 18px; font-weight: 500;">
        ${accountName}
      </p>
      <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 16px;">
        ${month}
      </p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

      <!-- Account Performance Summary (Always Included) -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; padding-bottom: 12px; border-bottom: 3px solid #fbbf24;">
          📈 Account Performance Summary
        </h2>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 12px; font-weight: 500; margin-bottom: 8px;">TOTAL SPEND</div>
            <div style="color: #1f2937; font-size: 28px; font-weight: 700;">${formatCurrency(summary.totalSpend, currency)}</div>
          </div>

          <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 12px; font-weight: 500; margin-bottom: 8px;">TOTAL CONVERSIONS</div>
            <div style="color: #1f2937; font-size: 28px; font-weight: 700;">${Math.round(summary.totalConversions)}</div>
          </div>

          <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 12px; font-weight: 500; margin-bottom: 8px;">CLICKS</div>
            <div style="color: #1f2937; font-size: 28px; font-weight: 700;">${formatNumber(summary.totalClicks)}</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">CTR: ${summary.avgCtr.toFixed(2)}%</div>
          </div>

          <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 12px; font-weight: 500; margin-bottom: 8px;">AVG CPC</div>
            <div style="color: #1f2937; font-size: 28px; font-weight: 700;">${formatCurrency(summary.avgCpc, currency)}</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Impressions: ${formatNumber(summary.totalImpressions)}</div>
          </div>
        </div>
      </div>

      <!-- Dynamic Sections Based on User Selection -->
      ${getCampaignsSection()}
      ${getKeywordsSection()}
      ${getAuctionInsightsSection()}
      ${getConversionsSection()}

      <!-- Insights (Always Included) -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #22c55e;">
          💡 Key Insights & Recommendations
        </h2>

        ${insights.whatWorking.length > 0 ? `
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
          <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">✅ What's Working</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
            ${insights.whatWorking.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        ${insights.poorPerforming.length > 0 ? `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
          <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">⚠️ Areas for Improvement</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
            ${insights.poorPerforming.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px;">
          <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">🎯 Recommendations</h3>
          <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
            ${insights.recommendations.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
          </ol>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">Custom report with selected performance metrics</p>
      <p style="margin: 8px 0 0 0;">Generated automatically by BeechPPC Dashboard</p>
    </div>

  </div>
</body>
</html>
  `
}
