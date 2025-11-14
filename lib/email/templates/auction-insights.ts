import { formatCurrency, formatNumber } from '../../utils'
import type { MonthlyReportData } from '../monthly-template'

/**
 * Auction Insights Focus Template
 * Competitive analysis showing how account performs against competitors
 * Includes impression share, overlap rates, and competitive positioning
 */
export function generateAuctionInsightsTemplate(data: MonthlyReportData): string {
  const { accountName, month, summary, auctionInsights, campaigns, insights, currency } = data

  // Sort campaigns by impressions to show which are most competitive
  const topCompetitiveCampaigns = [...campaigns]
    .filter(c => c.impressions > 1000)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10)

  // Calculate average impression share (mock data if not available)
  const avgImpressionShare = auctionInsights && auctionInsights.length > 0
    ? auctionInsights.reduce((sum, ai) => sum + ai.impressionShare, 0) / auctionInsights.length
    : 0

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auction Insights Report - ${accountName} - ${month}</title>
  <style>
    @media only screen and (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 10px !important;
      }
    }
    @media only screen and (max-width: 480px) {
      .metrics-grid {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
      }
      .metric-tile {
        margin-bottom: 8px;
      }
      .header-title {
        font-size: 24px !important;
      }
      .section-title {
        font-size: 18px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 900px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="margin: 0 0 8px 0; color: #1f2937; font-size: 32px; font-weight: 700;">
        🎯 Auction Insights Report
      </h1>
      <p style="margin: 0; color: #374151; font-size: 18px; font-weight: 500;">
        ${accountName}
      </p>
      <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 16px;">
        ${month} - Competitive Performance Analysis
      </p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

      <!-- Key Performance Metrics -->
      <div style="margin-bottom: 32px;">
        <h2 class="section-title" style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 3px solid #fbbf24;">
          Key Performance Metrics
        </h2>

        <!-- Row 1: First 4 metrics -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
          <tr>
            <!-- Cost -->
            <td width="23%" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Cost</div>
              <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${formatCurrency(summary.totalSpend, currency)}</div>
            </td>
            <td width="2%"></td>
            <!-- Impr Share -->
            <td width="23%" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Impr Share</div>
              <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${summary.searchImpressionShare.toFixed(1)}%</div>
            </td>
            <td width="2%"></td>
            <!-- Clicks -->
            <td width="23%" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Clicks</div>
              <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${formatNumber(summary.totalClicks)}</div>
            </td>
            <td width="2%"></td>
            <!-- CTR -->
            <td width="23%" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">CTR</div>
              <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${summary.avgCtr.toFixed(2)}%</div>
            </td>
          </tr>
        </table>

        <!-- Row 2: Last 4 metrics -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <!-- Avg CPC -->
            <td width="23%" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Avg CPC</div>
              <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${formatCurrency(summary.avgCpc, currency)}</div>
            </td>
            <td width="2%"></td>
            <!-- Conversions -->
            <td width="23%" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Conversions</div>
              <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${formatNumber(summary.totalConversions)}</div>
            </td>
            <td width="2%"></td>
            <!-- Conv Rate -->
            <td width="23%" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Conv Rate</div>
              <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${summary.conversionRate.toFixed(2)}%</div>
            </td>
            <td width="2%"></td>
            <!-- Cost/Conv -->
            <td width="23%" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Cost/Conv</div>
              <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${formatCurrency(summary.costPerConversion, currency)}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Competitor Analysis -->
      ${auctionInsights && auctionInsights.length > 0 ? `
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #3b82f6;">
          🏆 Competitor Analysis
        </h2>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
          Analysis of how your account performs against competitors in the same auctions.
        </p>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #eff6ff;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">COMPETITOR</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">IMPRESSION SHARE</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">OVERLAP RATE</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">POSITION ABOVE</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">TOP OF PAGE</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">THREAT LEVEL</th>
              </tr>
            </thead>
            <tbody>
              ${auctionInsights.sort((a, b) => b.impressionShare - a.impressionShare).map((insight, index) => {
                const threatLevel = insight.impressionShare > 30 && insight.positionAboveRate > 50 ? 'HIGH' :
                                  insight.impressionShare > 20 ? 'MEDIUM' : 'LOW'
                const threatColor = threatLevel === 'HIGH' ? '#dc2626' : threatLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e'
                const threatBg = threatLevel === 'HIGH' ? '#fee2e2' : threatLevel === 'MEDIUM' ? '#fef3c7' : '#d1fae5'

                return `
                  <tr ${index === 0 ? 'style="background-color: #fefce8;"' : ''}>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                      <div style="font-weight: 600; color: #1f2937;">${insight.domain}</div>
                      ${index === 0 ? '<div style="font-size: 11px; color: #d97706; font-weight: 500;">Top Competitor</div>' : ''}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                      <div style="font-weight: 600; color: #1f2937;">${insight.impressionShare.toFixed(1)}%</div>
                      <div style="width: 100%; max-width: 100px; background-color: #e5e7eb; border-radius: 4px; height: 6px; margin-top: 4px; margin-left: auto;">
                        <div style="width: ${Math.min(100, insight.impressionShare)}%; background-color: #3b82f6; border-radius: 4px; height: 6px;"></div>
                      </div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
                      ${insight.overlapRate.toFixed(1)}%
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                      <span style="color: ${insight.positionAboveRate > 50 ? '#dc2626' : '#22c55e'}; font-weight: 600;">
                        ${insight.positionAboveRate.toFixed(1)}%
                      </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
                      ${insight.topOfPageRate.toFixed(1)}%
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                      <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; background-color: ${threatBg}; color: ${threatColor};">
                        ${threatLevel}
                      </span>
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-top: 16px; border-radius: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">Key Metrics Explained:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 13px; line-height: 1.6;">
            <li><strong>Impression Share:</strong> Percentage of auctions where competitor's ad appeared</li>
            <li><strong>Overlap Rate:</strong> How often you and the competitor appeared in the same auction</li>
            <li><strong>Position Above Rate:</strong> How often competitor's ad ranked higher than yours</li>
            <li><strong>Top of Page Rate:</strong> How often competitor appeared at top of search results</li>
          </ul>
        </div>
      </div>
      ` : `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
        <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px; font-weight: 600;">⚠️ Auction Insights Data Not Available</h3>
        <p style="margin: 0; color: #78716c; font-size: 14px;">
          Auction insights require sufficient impression volume and may not be available for all campaigns.
          Focus on increasing impression share in your top campaigns to enable competitive analysis.
        </p>
      </div>
      `}

      <!-- Campaign Competitive Performance -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #22c55e;">
          📈 Campaign Competitive Performance
        </h2>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
          Your campaigns ranked by impression volume, showing which campaigns are most active in competitive auctions.
        </p>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #f0fdf4;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">CAMPAIGN</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">IMPRESSIONS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">CLICKS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">CTR</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">CONVERSIONS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">CONV RATE</th>
              </tr>
            </thead>
            <tbody>
              ${topCompetitiveCampaigns.map(campaign => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${campaign.name}</div>
                    <span style="background-color: ${campaign.status === 'ENABLED' ? '#d1fae5' : '#fee2e2'}; color: ${campaign.status === 'ENABLED' ? '#065f46' : '#991b1b'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                      ${campaign.status}
                    </span>
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
                    ${formatNumber(campaign.impressions)}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${formatNumber(campaign.clicks)}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: ${campaign.ctr > 3 ? '#059669' : '#6b7280'};">
                    ${campaign.ctr.toFixed(2)}%
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #059669;">
                    ${Math.round(campaign.conversions)}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${campaign.conversionRate.toFixed(2)}%
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Strategic Recommendations -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #f59e0b;">
          💡 Competitive Strategy Recommendations
        </h2>
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
            ${insights.recommendations.map(rec => `<li style="margin-bottom: 12px; font-weight: 500;">${rec}</li>`).join('')}
            <li style="margin-bottom: 12px; font-weight: 500;">Monitor competitor ad copy and landing pages to identify winning strategies</li>
            <li style="margin-bottom: 12px; font-weight: 500;">Increase bids strategically on high-converting keywords where competitors rank above you</li>
            <li style="margin-bottom: 12px; font-weight: 500;">Use audience targeting to differentiate from competitors and improve Quality Score</li>
          </ol>
        </div>
      </div>

      <!-- What's Working -->
      ${insights.whatWorking.length > 0 ? `
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">✅ Competitive Strengths</h3>
        <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
          ${insights.whatWorking.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">Auction insights show how your ads perform against competitors in the same auctions.</p>
      <p style="margin: 8px 0 0 0;">Generated automatically by BeechPPC Dashboard</p>
    </div>

  </div>
</body>
</html>
  `
}
