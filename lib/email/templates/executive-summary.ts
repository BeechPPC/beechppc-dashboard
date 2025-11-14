import { formatCurrency, formatNumber } from '../../utils'
import type { MonthlyReportData } from '../monthly-template'

/**
 * Executive Summary Template
 * High-level overview for marketing managers and executives
 * Focuses on KPIs, ROI, and strategic recommendations
 */
export function generateExecutiveSummaryTemplate(data: MonthlyReportData): string {
  const { accountName, month, summary, insights, currency } = data

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Summary - ${accountName} - ${month}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .metrics-grid {
        grid-template-columns: 1fr !important;
      }
      .metric-tile {
        margin-bottom: 12px;
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
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 class="header-title" style="margin: 0 0 8px 0; color: #1f2937; font-size: 28px; font-weight: 700;">
        Executive Summary
      </h1>
      <p style="margin: 0; color: #374151; font-size: 16px; font-weight: 500;">
        ${accountName}
      </p>
      <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 14px;">
        ${month}
      </p>
    </div>

    <!-- Main Content -->
    <div style="background-color: #ffffff; padding: 24px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

      <!-- Key Performance Metrics -->
      <div style="margin-bottom: 32px;">
        <h2 class="section-title" style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 3px solid #fbbf24;">
          📊 Key Performance Metrics
        </h2>

        <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <!-- Cost -->
          <div class="metric-tile" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Cost</div>
            <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${formatCurrency(summary.totalSpend, currency)}</div>
          </div>

          <!-- Impr Share -->
          <div class="metric-tile" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Impr Share</div>
            <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${summary.searchImpressionShare.toFixed(1)}%</div>
          </div>

          <!-- Clicks -->
          <div class="metric-tile" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Clicks</div>
            <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${formatNumber(summary.totalClicks)}</div>
          </div>

          <!-- CTR -->
          <div class="metric-tile" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">CTR</div>
            <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${summary.avgCtr.toFixed(2)}%</div>
          </div>

          <!-- Avg CPC -->
          <div class="metric-tile" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Avg CPC</div>
            <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${formatCurrency(summary.avgCpc, currency)}</div>
          </div>

          <!-- Conversions -->
          <div class="metric-tile" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Conversions</div>
            <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${Math.round(summary.totalConversions)}</div>
          </div>

          <!-- Conv Rate -->
          <div class="metric-tile" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Conv Rate</div>
            <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${summary.conversionRate.toFixed(2)}%</div>
          </div>

          <!-- Cost/Conv -->
          <div class="metric-tile" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); padding: 16px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <div style="color: #78716c; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Cost/Conv</div>
            <div style="color: #1f2937; font-size: 22px; font-weight: 700;">${formatCurrency(summary.costPerConversion, currency)}</div>
          </div>
        </div>
      </div>

      <!-- What's Working Well -->
      <div style="margin-bottom: 32px;">
        <h2 class="section-title" style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 14px 0;">
          ✅ What's Working Well
        </h2>
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.7; font-size: 14px;">
            ${insights.whatWorking.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Areas for Improvement -->
      <div style="margin-bottom: 32px;">
        <h2 class="section-title" style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 14px 0;">
          ⚠️ Areas for Improvement
        </h2>
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.7; font-size: 14px;">
            ${insights.poorPerforming.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Strategic Recommendations -->
      <div>
        <h2 class="section-title" style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 14px 0;">
          🎯 Strategic Recommendations
        </h2>
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.7; font-size: 14px;">
            ${insights.recommendations.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
          </ul>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">Generated with BeechPPC AI Agent</p>
      <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} All Rights Reserved</p>
    </div>

  </div>
</body>
</html>
  `.trim()
}
