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
      <td style="padding: 12px; border-bottom: 1px solid #fde68a;">
        <strong class="account-name">${account.name}</strong><br>
        <span class="account-id" style="color: #6b7280; font-size: 12px;">ID: ${account.id}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">
        ${formatCurrency(account.yesterday.cost, account.currency)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">
        ${Math.round(account.yesterday.conversions)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">
        ${formatNumber(account.yesterday.clicks)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;">
        ${formatNumber(account.yesterday.impressions)}
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
  <title>Daily MCC Report - ${formattedDate}</title>
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
    <div style="background-color: #fff; padding: 20px 30px; border-bottom: 1px solid #fde68a;">
      <div class="summary-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div class="summary-card" style="text-align: center; padding: 20px; background-color: #fefce8; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Total Spend</p>
          <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${formatCurrency(totalSpend)}</p>
        </div>
        <div class="summary-card" style="text-align: center; padding: 20px; background-color: #fefce8; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Conversions</p>
          <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${Math.round(totalConversions)}</p>
        </div>
        <div class="summary-card" style="text-align: center; padding: 20px; background-color: #fefce8; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Clicks</p>
          <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">${formatNumber(totalClicks)}</p>
        </div>
      </div>
    </div>

    <!-- Account Performance Table -->
    <div style="background-color: #fff; padding: 30px; border-radius: 0 0 8px 8px;">
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">Account Performance</h2>
      <table style="width: 100%; border-collapse: collapse; background-color: #fff;">
        <thead>
          <tr>
            <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left; font-weight: 600; color: #111827;">Account</th>
            <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Spend</th>
            <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Conversions</th>
            <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Clicks</th>
            <th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: right; font-weight: 600; color: #111827;">Impressions</th>
          </tr>
        </thead>
        <tbody>
          ${accountsHtml}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="margin-top: 20px; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0;">This is an automated report from Beech PPC</p>
      <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</p>
    </div>
  </div>

  <!-- Mobile Responsive Styles -->
  <style>
    @media only screen and (max-width: 600px) {
      .container {
        padding: 10px !important;
      }
      .summary-grid {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
      }
      .summary-card {
        padding: 15px !important;
      }
      table {
        font-size: 12px !important;
      }
      th, td {
        padding: 8px !important;
      }
      h1 {
        font-size: 24px !important;
      }
      h2 {
        font-size: 18px !important;
      }
      .account-name {
        font-size: 14px !important;
      }
      .account-id {
        font-size: 11px !important;
      }
    }
  </style>
</body>
</html>
  `
}
