/**
 * Email Template Generator for Report Templates
 * Generates HTML emails based on template data
 */

/**
 * Format currency with proper symbol
 * @param {number} value - The value to format
 * @param {string} currency - Currency code (default: AUD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, currency = 'AUD') {
  const symbols = {
    AUD: '$',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${value.toFixed(2)}`;
}

/**
 * Format number with commas
 * @param {number} value - The value to format
 * @returns {string} Formatted number
 */
function formatNumber(value) {
  return Math.round(value).toLocaleString();
}

/**
 * Format percentage
 * @param {number} value - The value to format (already in percentage form)
 * @returns {string} Formatted percentage
 */
function formatPercentage(value) {
  return `${value.toFixed(2)}%`;
}

/**
 * Generate table rows for search terms report
 * @param {Array} data - Search term data
 * @returns {string} HTML table rows
 */
function generateSearchTermsRows(data) {
  if (data.length === 0) {
    return '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No search terms found matching criteria</td></tr>';
  }

  return data.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.searchTerm}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.campaign}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.adGroup}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatNumber(item.impressions)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.clicks}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPercentage(item.ctr)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.cost)}</td>
    </tr>
  `).join('');
}

/**
 * Generate table rows for ads report
 * @param {Array} data - Ad data
 * @returns {string} HTML table rows
 */
function generateAdsRows(data) {
  if (data.length === 0) {
    return '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No ads found matching criteria</td></tr>';
  }

  return data.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.adName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.campaign}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatNumber(item.impressions)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.clicks}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #d4af37;">${formatPercentage(item.ctr)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.conversions.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.cost)}</td>
    </tr>
  `).join('');
}

/**
 * Generate table rows for keywords report
 * @param {Array} data - Keyword data
 * @returns {string} HTML table rows
 */
function generateKeywordsRows(data) {
  if (data.length === 0) {
    return '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #666;">No keywords found matching criteria</td></tr>';
  }

  return data.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.keyword}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.matchType}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.campaign}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatNumber(item.impressions)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.clicks}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #d4af37;">${item.conversions.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPercentage(item.ctr)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.costPerConversion)}</td>
    </tr>
  `).join('');
}

/**
 * Generate email template for template-based report
 * @param {Object} template - Report template configuration
 * @param {Object} accountData - Account and report data
 * @param {Date} reportDate - Report generation date
 * @returns {string} HTML email content
 */
export function generateTemplateEmail(template, accountData, reportDate) {
  const { accountName, currency, data } = accountData;
  const dateStr = reportDate.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let tableHeaders = '';
  let tableRows = '';

  // Generate appropriate table based on template type
  switch (template.type) {
    case 'SEARCH_TERMS':
      tableHeaders = `
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: left;">Search Term</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: left;">Campaign</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: left;">Ad Group</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Impressions</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Clicks</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">CTR</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Cost</th>
      `;
      tableRows = generateSearchTermsRows(data);
      break;

    case 'ADS':
      tableHeaders = `
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: left;">Ad Name</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: left;">Campaign</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Impressions</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Clicks</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">CTR</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Conversions</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Cost</th>
      `;
      tableRows = generateAdsRows(data);
      break;

    case 'KEYWORDS':
      tableHeaders = `
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: left;">Keyword</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: left;">Match Type</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: left;">Campaign</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Impressions</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Clicks</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Conversions</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">CTR</th>
        <th style="padding: 12px; background-color: #f8f9fa; border-bottom: 2px solid #d4af37; text-align: right;">Cost/Conv</th>
      `;
      tableRows = generateKeywordsRows(data);
      break;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="margin: 0; color: #d4af37; font-size: 28px; font-weight: 600;">Beech PPC</h1>
      <p style="margin: 10px 0 0 0; color: #fff; font-size: 16px;">${template.name}</p>
    </div>

    <!-- Account Info -->
    <div style="background-color: #fff; padding: 20px 30px; border-bottom: 1px solid #eee;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="margin: 0; color: #333; font-size: 20px;">${accountName}</h2>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${dateStr}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #666; font-size: 14px;">${data.length} results</p>
        </div>
      </div>
    </div>

    <!-- Report Description -->
    <div style="background-color: #fff; padding: 15px 30px; border-bottom: 1px solid #eee;">
      <p style="margin: 0; color: #666; font-size: 14px;">${template.description}</p>
    </div>

    <!-- Data Table -->
    <div style="background-color: #fff; padding: 30px; border-radius: 0 0 8px 8px;">
      <table style="width: 100%; border-collapse: collapse; background-color: #fff;">
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

    <!-- Footer -->
    <div style="margin-top: 20px; padding: 20px; text-align: center; color: #999; font-size: 12px;">
      <p style="margin: 0;">This is an automated report from Beech PPC</p>
      <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</p>
    </div>
  </div>

  <!-- Mobile Responsive Styles -->
  <style>
    @media only screen and (max-width: 600px) {
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
    }
  </style>
</body>
</html>
  `.trim();
}
