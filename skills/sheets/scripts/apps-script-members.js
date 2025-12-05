// Conversion rates to AUD (update quarterly)
const CONVERSION_RATES = {
  'usd': 1.55,
  'eur': 1.65,
  'aud': 1.0
};

// Categorization rules for Tier and Script based on Description
function categorizeProduct(description) {
  const desc = (description || '').toLowerCase();

  // Community tier products (Ads to AI or Bundle)
  if (desc.includes('ads to ai') || desc.includes('from ads to ai')) {
    return { tier: 'community', script: 'adstoai' };
  }
  if (desc.includes('bundle')) {
    return { tier: 'community', script: 'bundle' };
  }
  if (desc.includes('build the agent')) {
    return { tier: 'community', script: 'bta' };
  }

  // Customer tier products
  if (desc.includes('mastery')) {
    return { tier: 'customer', script: 'mastery' };
  }
  if (desc.includes('workshop') && !desc.includes('mastery')) {
    return { tier: 'customer', script: 'workshop' };
  }
  if (desc.includes('pmax')) {
    return { tier: 'customer', script: 'pmax' };
  }
  if (desc.includes('mcc')) {
    return { tier: 'customer', script: 'mcc' };
  }
  if (desc.includes('negative')) {
    return { tier: 'customer', script: 'neg' };
  }
  if (desc.includes('own the agent')) {
    return { tier: 'customer', script: 'own' };
  }
  if (desc.includes('core')) {
    return { tier: 'customer', script: 'core' };
  }
  if (desc.includes('discovery') || desc.includes('bss')) {
    return { tier: 'customer', script: 'bss' };
  }

  // Default for unknown products
  return { tier: 'customer', script: 'unknown' };
}

// Calculate AUD conversion
function convertToAUD(amount, currency) {
  const curr = (currency || 'usd').toLowerCase();
  const rate = CONVERSION_RATES[curr] || CONVERSION_RATES['usd'];
  return amount * rate;
}

function doGet(e) {
  // Use the currently active spreadsheet.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // IMPORTANT: Get the sheet named 'tx'
  const sheet = ss.getSheetByName('tx');

  if (!sheet) {
    // If the 'tx' sheet doesn't exist, return an error.
    return ContentService
      .createTextOutput(JSON.stringify({ "error": "Sheet 'tx' not found." }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Get all the data from the sheet.
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // Extract header row
  const headers = values.shift();

  // Find column indexes
  const emailColIndex = headers.indexOf('Customer Email');
  const amountColIndex = headers.indexOf('Amount');
  const currencyColIndex = headers.indexOf('Currency');
  const convertedAmountColIndex = headers.indexOf('Converted Amount');
  const descriptionColIndex = headers.indexOf('Description');
  const tierColIndex = headers.indexOf('Tier');
  const scriptColIndex = headers.indexOf('Script');

  const result = values.map((row, rowIndex) => {
    const email = row[emailColIndex];

    // Only process rows that have a valid email address.
    if (email && typeof email === 'string' && email.includes('@')) {
      // Update converted amount if missing
      if (!row[convertedAmountColIndex] && row[amountColIndex] && row[currencyColIndex]) {
        const convertedAmount = convertToAUD(row[amountColIndex], row[currencyColIndex]);
        sheet.getRange(rowIndex + 2, convertedAmountColIndex + 1).setValue(convertedAmount);
        row[convertedAmountColIndex] = convertedAmount;
      }

      // Update tier and script if missing
      if ((!row[tierColIndex] || !row[scriptColIndex]) && row[descriptionColIndex]) {
        const category = categorizeProduct(row[descriptionColIndex]);

        if (!row[tierColIndex]) {
          sheet.getRange(rowIndex + 2, tierColIndex + 1).setValue(category.tier);
          row[tierColIndex] = category.tier;
        }

        if (!row[scriptColIndex]) {
          sheet.getRange(rowIndex + 2, scriptColIndex + 1).setValue(category.script);
          row[scriptColIndex] = category.script;
        }
      }

      // Convert the entire row to an object using headers
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] || null;
      });
      return record;
    }
    return null;
  }).filter(item => item !== null); // Remove any rows that didn't have a valid email.

  // The server code is already designed to look for a "data" key.
  const response = {
    "data": result,
    "headers": headers
  };

  // Return the collected data as a JSON string.
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests to mark emails as invited to GitHub
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('tx');

    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ "error": "Sheet 'tx' not found." }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Parse the POST data
    const data = JSON.parse(e.postData.contents);
    const emailsToMark = data.emails || [];
    const inviteDate = data.date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    if (!Array.isArray(emailsToMark) || emailsToMark.length === 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ "error": "No emails provided" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Get all data
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];

    // Find column indexes
    const emailColIndex = headers.indexOf('Customer Email');
    const githubInvitedColIndex = headers.indexOf('Github Invited');

    if (emailColIndex === -1 || githubInvitedColIndex === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({ "error": "Required columns not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Track updates
    let updatedCount = 0;
    const normalizedEmails = emailsToMark.map(e => e.toLowerCase().trim());

    // Loop through rows (skip header)
    for (let i = 1; i < values.length; i++) {
      const rowEmail = (values[i][emailColIndex] || '').toLowerCase().trim();

      // If this email is in our list and not already marked
      if (normalizedEmails.includes(rowEmail) && !values[i][githubInvitedColIndex]) {
        sheet.getRange(i + 1, githubInvitedColIndex + 1).setValue(inviteDate);
        updatedCount++;
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        "success": true,
        "updated": updatedCount,
        "date": inviteDate
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        "error": error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
