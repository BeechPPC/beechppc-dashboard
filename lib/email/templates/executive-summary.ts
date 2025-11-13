import { formatCurrency, formatNumber } from '../../utils'
import type { MonthlyReportData } from '../monthly-template'

/**
 * Executive Summary Template
 * High-level overview for marketing managers and executives
 * Focuses on KPIs, ROI, and strategic recommendations
 */
export function generateExecutiveSummaryTemplate(data: MonthlyReportData): string {
  const { accountName, month, summary, insights, currency } = data

  // Calculate ROI metrics
  const costPerClick = summary.avgCpc
  const roas = summary.totalConversions > 0 ? (summary.totalConversions / summary.totalSpend) * 100 : 0

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Summary - ${accountName} - ${month}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="margin: 0 0 8px 0; color: #1f2937; font-size: 32px; font-weight: 700;">
        Executive Summary
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

      <!-- Key Performance Indicators -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; padding-bottom: 12px; border-bottom: 3px solid #fbbf24;">
          📊 Key Performance Indicators
        </h2>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
          <!-- Total Spend -->
          <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 14px; font-weight: 500; margin-bottom: 8px;">TOTAL INVESTMENT</div>
            <div style="color: #1f2937; font-size: 28px; font-weight: 700;">${formatCurrency(summary.totalSpend, currency)}</div>
          </div>

          <!-- Conversions -->
          <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 14px; font-weight: 500; margin-bottom: 8px;">TOTAL CONVERSIONS</div>
            <div style="color: #1f2937; font-size: 28px; font-weight: 700;">${Math.round(summary.totalConversions)}</div>
          </div>

          <!-- Cost Per Conversion -->
          <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 14px; font-weight: 500; margin-bottom: 8px;">COST PER CONVERSION</div>
            <div style="color: #1f2937; font-size: 28px; font-weight: 700;">${formatCurrency(summary.costPerConversion, currency)}</div>
          </div>

          <!-- Conversion Rate -->
          <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 24px; border-radius: 12px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 14px; font-weight: 500; margin-bottom: 8px;">CONVERSION RATE</div>
            <div style="color: #1f2937; font-size: 28px; font-weight: 700;">${summary.conversionRate.toFixed(2)}%</div>
          </div>
        </div>
      </div>

      <!-- What's Working Well -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
          ✅ What's Working Well
        </h2>
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
            ${insights.whatWorking.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Areas for Improvement -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
          ⚠️ Areas for Improvement
        </h2>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
            ${insights.poorPerforming.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Strategic Recommendations -->
      <div style="margin-bottom: 40px;">
        <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
          💡 Strategic Recommendations
        </h2>
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px;">
          <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
            ${insights.recommendations.slice(0, 5).map(item => `<li style="margin-bottom: 12px; font-weight: 500;">${item}</li>`).join('')}
          </ol>
        </div>
      </div>

      <!-- Performance Summary -->
      <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin-top: 32px;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
          📈 Performance Overview
        </h3>
        <div style="color: #6b7280; font-size: 14px; line-height: 1.8;">
          <p style="margin: 0 0 12px 0;">
            <strong>Total Clicks:</strong> ${formatNumber(summary.totalClicks)} |
            <strong>Total Impressions:</strong> ${formatNumber(summary.totalImpressions)}
          </p>
          <p style="margin: 0 0 12px 0;">
            <strong>Average CTR:</strong> ${summary.avgCtr.toFixed(2)}% |
            <strong>Average CPC:</strong> ${formatCurrency(summary.avgCpc, currency)}
          </p>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">This is an executive summary. For detailed campaign and keyword data, please refer to the detailed performance report.</p>
      <p style="margin: 8px 0 0 0;">Generated automatically by BeechPPC Dashboard</p>
    </div>

  </div>
</body>
</html>
  `
}
