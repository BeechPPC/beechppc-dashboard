import type { AccountPerformance } from '../google-ads/types'
import { formatCurrency, formatNumber } from '../utils'

export function generateEmailTemplate(reportData: AccountPerformance[], reportDate: Date): string {
  const formattedDate = reportDate.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const totalSpend = reportData.reduce((sum, account) => sum + account.yesterday.cost, 0)
  const totalConversions = reportData.reduce((sum, account) => sum + account.yesterday.conversions, 0)
  const totalClicks = reportData.reduce((sum, account) => sum + account.yesterday.clicks, 0)

  const accountsHtml = reportData
    .map(
      (account) => `
    <tr>
      <td class="account-cell" style="padding: 12px; border-bottom: 1px solid #fde68a;">
        <strong class="account-name" style="display: block; margin-bottom: 4px;">${account.name}</strong>
        <span class="account-id" style="color: #6b7280; font-size: 12px; display: block;">ID: ${account.id}</span>
      </td>
      <td class="data-cell" style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        <span class="mobile-label" style="display: none; color: #6b7280; font-size: 11px; font-weight: 500;">Spend: </span>${formatCurrency(account.yesterday.cost, account.currency)}
      </td>
      <td class="data-cell" style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        <span class="mobile-label" style="display: none; color: #6b7280; font-size: 11px; font-weight: 500;">Conv: </span>${Math.round(account.yesterday.conversions)}
      </td>
      <td class="data-cell" style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        <span class="mobile-label" style="display: none; color: #6b7280; font-size: 11px; font-weight: 500;">Clicks: </span>${formatNumber(account.yesterday.clicks)}
      </td>
      <td class="data-cell" style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; white-space: nowrap;">
        <span class="mobile-label" style="display: none; color: #6b7280; font-size: 11px; font-weight: 500;">Impr: </span>${formatNumber(account.yesterday.impressions)}
      </td>
    </tr>
  `
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Daily MCC Report - ${formattedDate}</title>
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
      .summary-grid tr {
        display: block !important;
      }
      .summary-grid td {
        display: block !important;
        width: 100% !important;
      }
      .summary-card {
        display: block !important;
        width: 100% !important;
        margin-bottom: 10px !important;
        padding: 12px !important;
      }
      table {
        font-size: 11px !important;
        width: 100% !important;
      }
      /* Make table scrollable horizontally */
      .table-container {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        margin: 0 -5px !important;
      }
      th {
        padding: 8px 6px !important;
        font-size: 10px !important;
      }
      td {
        padding: 8px 6px !important;
        font-size: 11px !important;
      }
      .account-cell {
        min-width: 120px !important;
      }
      .data-cell {
        min-width: 70px !important;
        white-space: nowrap !important;
      }
      .mobile-label {
        display: none !important;
      }
      h1 {
        font-size: 22px !important;
      }
      h2 {
        font-size: 16px !important;
      }
      .account-name {
        font-size: 13px !important;
      }
      .account-id {
        font-size: 10px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fefce8;">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; color: #111827; font-size: 28px; font-weight: 600;">Beech PPC</h1>
      <p style="margin: 10px 0 0 0; color: #374151; font-size: 16px;">Daily MCC Report</p>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${formattedDate}</p>
    </div>

    <!-- Summary Cards -->
    <div style="background-color: #fff; padding: 20px 15px; border-bottom: 1px solid #fde68a;">
      <table class="summary-grid" role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td class="summary-card" style="text-align: center; padding: 20px 10px; background-color: #fefce8; border-radius: 8px; width: 33.33%;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Total Spend</p>
            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${formatCurrency(totalSpend)}</p>
          </td>
          <td style="width: 10px;"></td>
          <td class="summary-card" style="text-align: center; padding: 20px 10px; background-color: #fefce8; border-radius: 8px; width: 33.33%;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Conversions</p>
            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${Math.round(totalConversions)}</p>
          </td>
          <td style="width: 10px;"></td>
          <td class="summary-card" style="text-align: center; padding: 20px 10px; background-color: #fefce8; border-radius: 8px; width: 33.33%;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Clicks</p>
            <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${formatNumber(totalClicks)}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Account Performance Table -->
    <div style="background-color: #fff; padding: 15px; border-radius: 0 0 8px 8px;">
      <h2 style="margin: 0 0 15px 10px; color: #111827; font-size: 20px; font-weight: 600;">Account Performance</h2>
      <div class="table-container" style="overflow-x: auto;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff;">
          <thead>
            <tr>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left; font-weight: 600; color: #111827; white-space: nowrap;">Account</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827; white-space: nowrap;">Spend</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827; white-space: nowrap;">Conversions</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827; white-space: nowrap;">Clicks</th>
              <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827; white-space: nowrap;">Impressions</th>
            </tr>
          </thead>
          <tbody>
            ${accountsHtml}
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
  `
}
