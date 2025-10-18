/**
 * Generate a mobile-responsive email template with Beech PPC branding
 * @param {Array} accountsData - Array of account data with metrics
 * @param {Date} reportDate - Date of the report
 */
export function generateEmailTemplate(accountsData, reportDate) {
  const formattedDate = reportDate.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate percentage change
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Format currency
  const formatCurrency = (amount, currency = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Format decimal
  const formatDecimal = (num) => {
    return new Intl.NumberFormat('en-AU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Get arrow icon for change
  const getChangeIndicator = (change) => {
    if (change > 0) return { symbol: '↑', color: '#10b981' }; // Green
    if (change < 0) return { symbol: '↓', color: '#ef4444' }; // Red
    return { symbol: '→', color: '#6b7280' }; // Gray
  };

  // Generate account rows
  const accountRows = accountsData.map((account) => {
    const costChange = account.previousDay
      ? calculateChange(account.yesterday.cost, account.previousDay.cost)
      : 0;
    const convChange = account.previousDay
      ? calculateChange(account.yesterday.conversions, account.previousDay.conversions)
      : 0;
    const cpcChange = account.previousDay
      ? calculateChange(account.yesterday.avgCpc, account.previousDay.avgCpc)
      : 0;
    const costPerConvChange = account.previousDay
      ? calculateChange(account.yesterday.costPerConv, account.previousDay.costPerConv)
      : 0;
    const impressionsChange = account.previousDay
      ? calculateChange(account.yesterday.impressions, account.previousDay.impressions)
      : 0;

    const costIndicator = getChangeIndicator(costChange);
    const convIndicator = getChangeIndicator(convChange);
    const cpcIndicator = getChangeIndicator(cpcChange);
    const costPerConvIndicator = getChangeIndicator(costPerConvChange);
    const impressionsIndicator = getChangeIndicator(impressionsChange);

    return `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 16px 12px; font-weight: 600; color: #111827; font-size: 14px; background-color: #fefce8;">
          ${account.name}
        </td>
        <td style="padding: 16px 12px; text-align: right; font-size: 14px; color: #374151;">
          <div style="font-weight: 600;">${formatCurrency(account.yesterday.cost, account.currency)}</div>
          <div style="font-size: 12px; color: ${costIndicator.color}; margin-top: 4px;">
            ${costIndicator.symbol} ${Math.abs(costChange).toFixed(1)}%
          </div>
        </td>
        <td style="padding: 16px 12px; text-align: right; font-size: 14px; color: #374151;">
          <div style="font-weight: 600;">${formatDecimal(account.yesterday.conversions)}</div>
          <div style="font-size: 12px; color: ${convIndicator.color}; margin-top: 4px;">
            ${convIndicator.symbol} ${Math.abs(convChange).toFixed(1)}%
          </div>
        </td>
        <td style="padding: 16px 12px; text-align: right; font-size: 14px; color: #374151;">
          <div style="font-weight: 600;">${formatCurrency(account.yesterday.avgCpc, account.currency)}</div>
          <div style="font-size: 12px; color: ${cpcIndicator.color}; margin-top: 4px;">
            ${cpcIndicator.symbol} ${Math.abs(cpcChange).toFixed(1)}%
          </div>
        </td>
        <td style="padding: 16px 12px; text-align: right; font-size: 14px; color: #374151;">
          <div style="font-weight: 600;">${formatCurrency(account.yesterday.costPerConv, account.currency)}</div>
          <div style="font-size: 12px; color: ${costPerConvIndicator.color}; margin-top: 4px;">
            ${costPerConvIndicator.symbol} ${Math.abs(costPerConvChange).toFixed(1)}%
          </div>
        </td>
        <td style="padding: 16px 12px; text-align: right; font-size: 14px; color: #374151;">
          <div style="font-weight: 600;">${formatNumber(account.yesterday.impressions)}</div>
          <div style="font-size: 12px; color: ${impressionsIndicator.color}; margin-top: 4px;">
            ${impressionsIndicator.symbol} ${Math.abs(impressionsChange).toFixed(1)}%
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Daily MCC Report - Beech PPC</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 10px !important;
      }
      table {
        font-size: 12px !important;
      }
      th, td {
        padding: 8px 6px !important;
      }
      .header-title {
        font-size: 20px !important;
      }
      .mobile-scroll {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); min-height: 100vh;">

  <!-- Main Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px 0;">
    <tr>
      <td align="center">

        <!-- Content Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="900" class="container" style="max-width: 900px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header with Beech PPC Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 40px 30px; text-align: center; position: relative;">
              <!-- Decorative circles -->
              <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background-color: rgba(254, 252, 232, 0.3); border-radius: 50%; filter: blur(40px);"></div>
              <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background-color: rgba(254, 252, 232, 0.3); border-radius: 50%; filter: blur(30px);"></div>

              <h1 class="header-title" style="margin: 0; color: #1f2937; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; position: relative; z-index: 1;">
                Beech PPC
              </h1>
              <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px; font-weight: 500; position: relative; z-index: 1;">
                Daily MCC Performance Report
              </p>
            </td>
          </tr>

          <!-- Date Banner -->
          <tr>
            <td style="background-color: #fef3c7; padding: 16px 30px; border-bottom: 3px solid #fbbf24;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="color: #92400e; font-size: 14px; font-weight: 600;">
                    Report Date: ${formattedDate}
                  </td>
                  <td align="right" style="color: #92400e; font-size: 12px; font-weight: 500;">
                    ${accountsData.length} Active Accounts
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Table Content -->
          <tr>
            <td class="mobile-scroll" style="padding: 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse;">
                <!-- Table Header -->
                <thead>
                  <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 16px 12px; text-align: left; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Account
                    </th>
                    <th style="padding: 16px 12px; text-align: right; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Cost
                    </th>
                    <th style="padding: 16px 12px; text-align: right; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Conv.
                    </th>
                    <th style="padding: 16px 12px; text-align: right; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Avg CPC
                    </th>
                    <th style="padding: 16px 12px; text-align: right; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Cost/Conv
                    </th>
                    <th style="padding: 16px 12px; text-align: right; font-size: 13px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
                      Impr.
                    </th>
                  </tr>
                </thead>

                <!-- Table Body -->
                <tbody>
                  ${accountRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 3px solid #fbbf24;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                Powered by Beech PPC AI Agent
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                Automated daily report generated at 11:00 AM Melbourne time
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
}

export default generateEmailTemplate;
