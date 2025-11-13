import { formatCurrency, formatNumber } from '../../utils'
import type { MonthlyReportData } from '../monthly-template'

/**
 * Keyword Deep Dive Template
 * Comprehensive keyword analysis with performance metrics
 * Shows best performing, worst performing, and keyword opportunities
 */
export function generateKeywordDeepDiveTemplate(data: MonthlyReportData): string {
  const { accountName, month, summary, topKeywords, poorPerformingKeywords, campaigns, currency } = data

  // Find keywords with potential (good clicks, low conversions)
  const allCampaignKeywords = campaigns.flatMap(c => [{ campaign: c.name, avgCpc: c.avgCpc }])

  // Calculate keyword opportunity metrics
  const keywordOpportunities = topKeywords.filter(k => k.clicks > 20 && k.conversions < 5)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Keyword Deep Dive - ${accountName} - ${month}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 900px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="margin: 0 0 8px 0; color: #1f2937; font-size: 32px; font-weight: 700;">
        🔍 Keyword Deep Dive
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

      <!-- Keyword Summary -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px;">
        <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
          📊 Keyword Performance Summary
        </h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div>
            <div style="color: #6b7280; font-size: 12px; font-weight: 500;">TOP PERFORMERS</div>
            <div style="color: #1f2937; font-size: 24px; font-weight: 700;">${topKeywords.length}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 12px; font-weight: 500;">POOR PERFORMERS</div>
            <div style="color: #1f2937; font-size: 24px; font-weight: 700;">${poorPerformingKeywords.length}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 12px; font-weight: 500;">AVG CPC</div>
            <div style="color: #1f2937; font-size: 24px; font-weight: 700;">${formatCurrency(summary.avgCpc, currency)}</div>
          </div>
        </div>
      </div>

      <!-- Top Performing Keywords -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #22c55e;">
          ⭐ Top Performing Keywords
        </h2>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
          These keywords are driving conversions efficiently and should be prioritized.
        </p>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #f0fdf4;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">KEYWORD</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">MATCH TYPE</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">CONVERSIONS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">COST/CONV</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">QS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">CLICKS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">CTR</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #22c55e;">SPEND</th>
              </tr>
            </thead>
            <tbody>
              ${topKeywords.slice(0, 15).map(keyword => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${keyword.keyword}</div>
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
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(keyword.clicks)}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${keyword.ctr.toFixed(2)}%</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">${formatCurrency(keyword.cost, currency)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Poor Performing Keywords -->
      ${poorPerformingKeywords.length > 0 ? `
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #ef4444;">
          ⚠️ Poor Performing Keywords
        </h2>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
          These keywords are spending budget without generating conversions. Consider pausing or optimizing.
        </p>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #fef2f2;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #ef4444;">KEYWORD</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #ef4444;">MATCH TYPE</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #ef4444;">WASTED SPEND</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #ef4444;">CLICKS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #ef4444;">QS</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #ef4444;">RECOMMENDATION</th>
              </tr>
            </thead>
            <tbody>
              ${poorPerformingKeywords.map(keyword => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${keyword.keyword}</div>
                    <div style="font-size: 11px; color: #6b7280;">${keyword.campaign}</div>
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                    <span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                      ${keyword.matchType}
                    </span>
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #dc2626; white-space: nowrap;">
                    ${formatCurrency(keyword.cost, currency)}
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(keyword.clicks)}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    ${keyword.qualityScore ?
                      `<span style="color: ${keyword.qualityScore < 5 ? '#dc2626' : '#6b7280'}; font-weight: 600;">${keyword.qualityScore}</span>`
                      : 'N/A'
                    }
                  </td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                    ${keyword.qualityScore && keyword.qualityScore < 5 ? 'Improve ad relevance & landing page' :
                      keyword.cost > 100 ? 'Pause and reassess' : 'Add negative keywords'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-top: 16px; border-radius: 8px;">
          <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px;">
            💡 Potential Savings: ${formatCurrency(poorPerformingKeywords.reduce((sum, k) => sum + k.cost, 0), currency)}
          </p>
          <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 13px;">
            These keywords have generated zero conversions. Pausing them could free up budget for better performing keywords.
          </p>
        </div>
      </div>
      ` : ''}

      <!-- Keyword Opportunities -->
      ${keywordOpportunities.length > 0 ? `
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #3b82f6;">
          💎 Keyword Opportunities
        </h2>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
          These keywords show potential but need optimization to improve conversion rates.
        </p>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
            <thead>
              <tr style="background-color: #eff6ff;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">KEYWORD</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">CLICKS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">CONVERSIONS</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">CTR</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 2px solid #3b82f6;">OPPORTUNITY</th>
              </tr>
            </thead>
            <tbody>
              ${keywordOpportunities.slice(0, 10).map(keyword => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1f2937;">${keyword.keyword}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(keyword.clicks)}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Math.round(keyword.conversions)}</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${keyword.ctr.toFixed(2)}%</td>
                  <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; color: #3b82f6;">
                    ${keyword.ctr > 5 ? 'Optimize landing page' : keyword.qualityScore && keyword.qualityScore < 7 ? 'Improve ad relevance' : 'Test new ad copy'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Action Items -->
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 24px; border-radius: 12px; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
          🎯 Recommended Actions
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
          <li>Increase bids on top ${Math.min(5, topKeywords.length)} performing keywords to capture more traffic</li>
          <li>Pause or optimize ${poorPerformingKeywords.length} poor performing keywords to reduce wasted spend</li>
          <li>Create negative keyword lists based on poor performers to prevent irrelevant matches</li>
          ${keywordOpportunities.length > 0 ? `<li>A/B test landing pages for ${keywordOpportunities.length} opportunity keywords</li>` : ''}
          <li>Review search query reports to find new keyword expansion opportunities</li>
        </ul>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">Generated automatically by BeechPPC Dashboard</p>
    </div>

  </div>
</body>
</html>
  `
}
