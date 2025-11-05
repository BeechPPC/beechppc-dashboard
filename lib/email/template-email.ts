/**
 * Email Template Generator for Report Templates
 * Generates HTML emails based on template data
 */

import type { ReportTemplate } from '../google-ads/report-templates'
import type { SearchTermData, AdData, KeywordData } from '../google-ads/template-queries'
import { formatCurrency, formatNumber } from '../utils'

interface TemplateReportData {
  accountName: string
  currency: string
  data: SearchTermData[] | AdData[] | KeywordData[]
}

/**
 * Format percentage
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

/**
 * Generate table rows for search terms report
 */
function generateSearchTermsRows(data: SearchTermData[]): string {
  if (data.length === 0) {
    return '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No search terms found matching criteria</td></tr>'
  }

  return data.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">${item.searchTerm}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">${item.campaign}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">${item.adGroup}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${formatNumber(item.impressions)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${item.clicks}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${formatPercentage(item.ctr)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${formatCurrency(item.cost)}</td>
    </tr>
  `).join('')
}

/**
 * Generate table rows for ads report
 */
function generateAdsRows(data: AdData[]): string {
  if (data.length === 0) {
    return '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No ads found matching criteria</td></tr>'
  }

  return data.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">${item.adName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">${item.campaign}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${formatNumber(item.impressions)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${item.clicks}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; font-weight: bold; color: #f59e0b;">${formatPercentage(item.ctr)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${item.conversions.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${formatCurrency(item.cost)}</td>
    </tr>
  `).join('')
}

/**
 * Generate table rows for keywords report
 */
function generateKeywordsRows(data: KeywordData[]): string {
  if (data.length === 0) {
    return '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #666;">No keywords found matching criteria</td></tr>'
  }

  return data.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">${item.keyword}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">${item.matchType}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">${item.campaign}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${formatNumber(item.impressions)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${item.clicks}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; font-weight: bold; color: #f59e0b;">${item.conversions.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${formatPercentage(item.ctr)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">${formatCurrency(item.costPerConversion)}</td>
    </tr>
  `).join('')
}

/**
 * Generate email template for template-based report
 */
export function generateTemplateEmail(
  template: ReportTemplate,
  accountData: TemplateReportData,
  reportDate: Date
): string {
  const { accountName, data } = accountData
  const dateStr = reportDate.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  let tableHeaders = ''
  let tableRows = ''

  // Generate appropriate table based on template type
  switch (template.type) {
    case 'SEARCH_TERMS':
      tableHeaders = `
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left;">Search Term</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left;">Campaign</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left;">Ad Group</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Impressions</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Clicks</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">CTR</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Cost</th>
      `
      tableRows = generateSearchTermsRows(data as SearchTermData[])
      break

    case 'ADS':
      tableHeaders = `
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left;">Ad Name</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left;">Campaign</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Impressions</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Clicks</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">CTR</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Conversions</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Cost</th>
      `
      tableRows = generateAdsRows(data as AdData[])
      break

    case 'KEYWORDS':
      tableHeaders = `
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left;">Keyword</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left;">Match Type</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left;">Campaign</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Impressions</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Clicks</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Conversions</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">CTR</th>
        <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right;">Cost/Conv</th>
      `
      tableRows = generateKeywordsRows(data as KeywordData[])
      break
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${template.name}</title>
  <style>
    /* Prevent email clients from changing colors */
    :root {
      color-scheme: light only;
      supported-color-schemes: light;
    }

    /* Force light mode colors and prevent dark mode */
    @media (prefers-color-scheme: dark) {
      body, .container, div, table, th, td, p, h1, h2, span, strong {
        background-color: inherit !important;
        color: inherit !important;
      }
    }

    @media only screen and (max-width: 600px) {
      .container {
        padding: 5px !important;
      }
      table {
        font-size: 10px !important;
      }
      th {
        padding: 6px 4px !important;
        font-size: 10px !important;
      }
      td {
        padding: 6px 4px !important;
        font-size: 10px !important;
      }
      h1 {
        font-size: 22px !important;
      }
      h2 {
        font-size: 16px !important;
      }
      /* Make tables horizontally scrollable on very small screens */
      .table-container {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fefce8;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; color: #111827; font-size: 28px; font-weight: 600;">Beech PPC</h1>
      <p style="margin: 10px 0 0 0; color: #374151; font-size: 16px;">${template.name}</p>
    </div>

    <!-- Account Info -->
    <div style="background-color: #fff; padding: 20px 30px; border-bottom: 1px solid #fde68a;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="margin: 0; color: #111827; font-size: 20px;">${accountName}</h2>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${dateStr}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">${data.length} results</p>
        </div>
      </div>
    </div>

    <!-- Report Description -->
    <div style="background-color: #fff; padding: 15px 30px; border-bottom: 1px solid #fde68a;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">${template.description}</p>
    </div>

    <!-- Data Table -->
    <div style="background-color: #fff; padding: 15px; border-radius: 0 0 8px 8px;">
      <div class="table-container" style="overflow-x: auto;">
        <table style="width: 100%; min-width: 500px; border-collapse: collapse; background-color: #fff;">
          <thead>
            <tr>
              ${tableHeaders}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 20px; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">This is an automated report from Beech PPC</p>
      <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
