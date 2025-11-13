import { formatCurrency, formatNumber } from '../utils'
import type { CampaignPerformance, KeywordPerformance } from '../google-ads/client'

export interface MonthlyReportData {
  accountName: string
  accountId: string
  currency: string
  month: string
  summary: {
    totalSpend: number
    totalConversions: number
    totalClicks: number
    totalImpressions: number
    avgCtr: number
    avgCpc: number
    costPerConversion: number
    conversionRate: number
  }
  campaigns: CampaignPerformance[]
  topKeywords: KeywordPerformance[]
  poorPerformingKeywords: KeywordPerformance[]
  insights: {
    whatWorking: string[]
    poorPerforming: string[]
    recommendations: string[]
  }
}

export function generateMonthlyReportTemplate(data: MonthlyReportData): string {
  const { accountName, month, summary, campaigns, topKeywords, poorPerformingKeywords, insights } = data

  // Sort campaigns by cost
  const topCampaigns = [...campaigns].sort((a, b) => b.cost - a.cost).slice(0, 5)

  const campaignsHtml = topCampaigns
    .map(
      (campaign) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">
        <strong style="display: block; margin-bottom: 4px;">${campaign.name}</strong>
        <span style="color: #6b7280; font-size: 12px; display: block;">${campaign.status}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${formatCurrency(campaign.cost, data.currency)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${Math.round(campaign.conversions)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${formatNumber(campaign.clicks)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${campaign.ctr.toFixed(2)}%
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${campaign.costPerConversion > 0 ? formatCurrency(campaign.costPerConversion, data.currency) : '-'}
      </td>
    </tr>
  `
    )
    .join('')

  const topKeywordsHtml = topKeywords
    .slice(0, 10)
    .map(
      (kw) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">
        <strong style="display: block; margin-bottom: 4px;">${kw.keyword}</strong>
        <span style="color: #6b7280; font-size: 12px; display: block;">${kw.matchType}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${formatCurrency(kw.cost, data.currency)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${Math.round(kw.conversions)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${kw.ctr.toFixed(2)}%
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${kw.qualityScore || 'N/A'}
      </td>
    </tr>
  `
    )
    .join('')

  const poorKeywordsHtml = poorPerformingKeywords
    .slice(0, 5)
    .map(
      (kw) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">
        <strong style="display: block; margin-bottom: 4px;">${kw.keyword}</strong>
        <span style="color: #6b7280; font-size: 12px; display: block;">${kw.matchType}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${formatCurrency(kw.cost, data.currency)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${Math.round(kw.conversions)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        ${kw.ctr.toFixed(2)}%
      </td>
    </tr>
  `
    )
    .join('')

  const workingWellHtml = insights.whatWorking
    .map((item) => `<li style="margin-bottom: 8px; color: #111827;">${item}</li>`)
    .join('')

  const poorPerformingHtml = insights.poorPerforming
    .map((item) => `<li style="margin-bottom: 8px; color: #111827;">${item}</li>`)
    .join('')

  const recommendationsHtml = insights.recommendations
    .map((item) => `<li style="margin-bottom: 8px; color: #111827;">${item}</li>`)
    .join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Monthly Report - ${accountName} - ${month}</title>
  <style>
    :root {
      color-scheme: light only;
      supported-color-schemes: light;
    }

    @media (prefers-color-scheme: dark) {
      body, .container, div, table, th, td, p, h1, h2, h3, span, strong, li {
        background-color: inherit !important;
        color: inherit !important;
      }
    }

    @media only screen and (max-width: 600px) {
      .container {
        padding: 10px !important;
      }
      h1 {
        font-size: 22px !important;
      }
      h2 {
        font-size: 18px !important;
      }
      h3 {
        font-size: 16px !important;
      }
      .summary-grid tr {
        display: block !important;
      }
      .summary-grid td {
        display: block !important;
        width: 100% !important;
        margin-bottom: 10px !important;
      }
      .table-container {
        overflow-x: auto !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fefce8;">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; color: #111827; font-size: 28px; font-weight: 600;">Beech PPC</h1>
      <p style="margin: 10px 0 0 0; color: #374151; font-size: 18px; font-weight: 500;">Monthly Report - ${accountName}</p>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${month}</p>
    </div>

    <!-- Executive Summary -->
    <div style="background-color: #fff; padding: 20px; border-bottom: 1px solid #fde68a;">
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">Executive Summary</h2>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="summary-grid" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="text-align: center; padding: 20px; background-color: #fefce8; border-radius: 8px; width: 25%;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Total Spend</p>
            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${formatCurrency(summary.totalSpend, data.currency)}</p>
          </td>
          <td style="width: 10px;"></td>
          <td style="text-align: center; padding: 20px; background-color: #fefce8; border-radius: 8px; width: 25%;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Conversions</p>
            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${Math.round(summary.totalConversions)}</p>
          </td>
          <td style="width: 10px;"></td>
          <td style="text-align: center; padding: 20px; background-color: #fefce8; border-radius: 8px; width: 25%;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Avg CPC</p>
            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${formatCurrency(summary.avgCpc, data.currency)}</p>
          </td>
          <td style="width: 10px;"></td>
          <td style="text-align: center; padding: 20px; background-color: #fefce8; border-radius: 8px; width: 25%;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Cost/Conv</p>
            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${formatCurrency(summary.costPerConversion, data.currency)}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- What's Working Well -->
    <div style="background-color: #fff; padding: 20px; border-bottom: 1px solid #fde68a;">
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px; font-weight: 600;">✅ What's Working Well</h2>
      <ul style="margin: 0; padding-left: 20px; color: #111827; line-height: 1.6;">
        ${workingWellHtml}
      </ul>
    </div>

    <!-- Poor Performing Areas -->
    <div style="background-color: #fff; padding: 20px; border-bottom: 1px solid #fde68a;">
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px; font-weight: 600;">⚠️ Areas Needing Attention</h2>
      <ul style="margin: 0; padding-left: 20px; color: #111827; line-height: 1.6;">
        ${poorPerformingHtml}
      </ul>
    </div>

    <!-- Recommendations -->
    <div style="background-color: #fff; padding: 20px; border-bottom: 1px solid #fde68a;">
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px; font-weight: 600;">💡 Recommendations</h2>
      <ul style="margin: 0; padding-left: 20px; color: #111827; line-height: 1.6;">
        ${recommendationsHtml}
      </ul>
    </div>

    <!-- Top Campaigns -->
    <div style="background-color: #fff; padding: 20px; border-bottom: 1px solid #fde68a;">
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px; font-weight: 600;">Top Campaigns by Spend</h2>
      <div class="table-container" style="overflow-x: auto;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff;">
          <thead>
            <tr>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left; font-weight: 600; color: #111827;">Campaign</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Spend</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Conv.</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Clicks</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">CTR</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Cost/Conv</th>
            </tr>
          </thead>
          <tbody>
            ${campaignsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Top Keywords -->
    <div style="background-color: #fff; padding: 20px; border-bottom: 1px solid #fde68a;">
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px; font-weight: 600;">Top Performing Keywords</h2>
      <div class="table-container" style="overflow-x: auto;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff;">
          <thead>
            <tr>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left; font-weight: 600; color: #111827;">Keyword</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Spend</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Conv.</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">CTR</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">QS</th>
            </tr>
          </thead>
          <tbody>
            ${topKeywordsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Poor Performing Keywords -->
    ${
      poorPerformingKeywords.length > 0
        ? `
    <div style="background-color: #fff; padding: 20px; border-bottom: 1px solid #fde68a;">
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px; font-weight: 600;">Poor Performing Keywords</h2>
      <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">High spend with zero conversions</p>
      <div class="table-container" style="overflow-x: auto;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff;">
          <thead>
            <tr>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left; font-weight: 600; color: #111827;">Keyword</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Spend</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Conv.</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">CTR</th>
            </tr>
          </thead>
          <tbody>
            ${poorKeywordsHtml}
          </tbody>
        </table>
      </div>
    </div>
    `
        : ''
    }

    <!-- Footer -->
    <div style="background-color: #fff; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">This is an automated monthly report from Beech PPC</p>
      <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</p>
    </div>
  </div>
</body>
</html>
  `
}
