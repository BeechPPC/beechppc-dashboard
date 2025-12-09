import type { AlertTrigger } from './types'

export function generateAlertEmail(triggers: AlertTrigger[], businessName: string = 'PPC AI'): string {
  const triggerCount = triggers.length
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Google Ads Alert Notification</title>
  <style>
    /* Prevent email clients from changing colors */
    :root {
      color-scheme: light only;
      supported-color-schemes: light;
    }

    /* Force light mode colors and prevent dark mode */
    @media (prefers-color-scheme: dark) {
      body, .container, div, table, th, td, p, h1, h2, h3, span, strong {
        background-color: inherit !important;
        color: inherit !important;
      }
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #fefce8;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #f59e0b;
    }
    .header h1 {
      margin: 0;
      color: #111827;
      font-size: 28px;
      font-weight: bold;
    }
    .alert-icon {
      width: 60px;
      height: 60px;
      background-color: #ef4444;
      border-radius: 50%;
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
    }
    .content {
      padding: 30px 20px;
    }
    .summary {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .summary p {
      margin: 0;
      color: #111827;
      font-size: 16px;
    }
    .alert-item {
      background-color: #ffffff;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .alert-item:last-child {
      margin-bottom: 0;
    }
    .alert-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #fde68a;
    }
    .alert-name {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    .alert-time {
      font-size: 12px;
      color: #6b7280;
    }
    .alert-account {
      font-size: 14px;
      color: #374151;
      margin: 8px 0;
      font-weight: 500;
    }
    .alert-message {
      background-color: #fef3c7;
      padding: 12px;
      border-radius: 4px;
      font-size: 14px;
      color: #374151;
      margin-top: 12px;
    }
    .metric-badge {
      display: inline-block;
      background-color: #f59e0b;
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #fde68a;
    }
    .footer p {
      margin: 5px 0;
      font-size: 12px;
      color: #9ca3af;
    }
    .cta-button {
      display: inline-block;
      background-color: #f59e0b;
      color: #ffffff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    @media only screen and (max-width: 600px) {
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 20px 15px;
      }
      .alert-item {
        padding: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="alert-icon">⚠️</div>
      <h1>Alert Notification</h1>
      <p style="margin: 10px 0 0; color: #374151; font-size: 14px;">${date}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Summary -->
      <div class="summary">
        <p><strong>${triggerCount}</strong> alert${triggerCount !== 1 ? 's' : ''} triggered for your Google Ads accounts</p>
      </div>

      <!-- Alert Items -->
      ${triggers.map(trigger => `
      <div class="alert-item">
        <div class="alert-header">
          <h3 class="alert-name">${trigger.alertName}</h3>
          <span class="metric-badge">${trigger.metricType}</span>
        </div>
        <p class="alert-account">📊 ${trigger.accountName} (ID: ${trigger.accountId})</p>
        ${trigger.conversionActionName ? `
        <p class="alert-account" style="color: #6b7280; font-weight: normal;">
          🎯 Conversion Action: <strong>${trigger.conversionActionName}</strong>
        </p>
        ` : ''}
        ${trigger.campaignName ? `
        <p class="alert-account" style="color: #6b7280; font-weight: normal;">
          📢 Campaign: <strong>${trigger.campaignName}</strong>
        </p>
        ` : ''}
        ${trigger.adGroupName ? `
        <p class="alert-account" style="color: #6b7280; font-weight: normal;">
          📁 Ad Group: <strong>${trigger.adGroupName}</strong>
        </p>
        ` : ''}
        ${trigger.adName ? `
        <p class="alert-account" style="color: #6b7280; font-weight: normal;">
          📝 Ad: <strong>${trigger.adName}</strong> (ID: ${trigger.adId})
        </p>
        ` : ''}
        <div class="alert-message">
          ${trigger.message}
          ${trigger.lastConversionDate ? `
          <p style="margin: 8px 0 0; font-size: 13px;">
            📅 Last Conversion: ${new Date(trigger.lastConversionDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            ${trigger.daysSinceLastConversion ? `(${trigger.daysSinceLastConversion} days ago)` : ''}
          </p>
          ` : trigger.metricType === 'conversion_tracking' ? `
          <p style="margin: 8px 0 0; font-size: 13px; color: #ef4444; font-weight: 600;">
            ⚠️ No conversion data found in the last 90 days
          </p>
          ` : ''}
          ${trigger.disapprovalReasons && trigger.disapprovalReasons.length > 0 ? `
          <div style="margin-top: 12px;">
            <p style="font-weight: 600; margin-bottom: 6px; font-size: 13px;">🚫 Disapproval Reasons:</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
              ${trigger.disapprovalReasons.map(reason => `<li style="margin: 4px 0;">${reason}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
        <p class="alert-time">Triggered at ${new Date(trigger.triggeredAt).toLocaleTimeString('en-US')}</p>
      </div>
      `).join('')}

      <!-- Call to Action -->
      <div style="text-align: center;">
        <a href="https://beechppc-dashboard.vercel.app/dashboard" class="cta-button">
          View Dashboard
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This alert was automatically generated by ${businessName}</p>
      <p>Manage your alerts at <a href="https://beechppc-dashboard.vercel.app/automations/alerts" style="color: #f59e0b;">beechppc-dashboard.vercel.app</a></p>
      <p style="margin-top: 15px;">&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function generateAlertEmailSubject(triggers: AlertTrigger[]): string {
  const count = triggers.length
  if (count === 1) {
    return `⚠️ Alert: ${triggers[0].alertName}`
  }
  return `⚠️ ${count} Google Ads Alerts Triggered`
}
