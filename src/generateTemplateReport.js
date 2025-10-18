/**
 * Template Report Generator
 * Generates and sends reports based on pre-defined templates
 */

import { getTemplateById } from './reportTemplates.js';
import { getCustomerAccounts, executeTemplateQuery } from './templateReportQueries.js';
import { generateTemplateEmail } from './templateEmailGenerator.js';
import { sendDailyReport } from './emailService.js';

/**
 * Generate and send a template-based report for a specific account
 * @param {string} templateId - The template ID to use
 * @param {string} customerId - The customer/account ID (optional - if not provided, runs for all accounts)
 * @param {boolean} sendEmail - Whether to send the report via email (default: true)
 * @returns {Object} Report result
 */
export async function generateTemplateReport(templateId, customerId = null, sendEmail = true) {
  console.log(`Starting template report generation: ${templateId}`);
  console.log(`Report Date: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`);

  try {
    // Get the template configuration
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    console.log(`Using template: ${template.name}`);

    // Get accounts to process
    let accounts = [];
    if (customerId) {
      // Single account
      const allAccounts = await getCustomerAccounts();
      const account = allAccounts.find(acc => acc.id === customerId);
      if (!account) {
        throw new Error(`Account not found: ${customerId}`);
      }
      accounts = [account];
    } else {
      // All accounts
      accounts = await getCustomerAccounts();
    }

    console.log(`Processing ${accounts.length} account(s)`);

    const results = [];

    // Process each account
    for (const account of accounts) {
      console.log(`\nProcessing account: ${account.name} (${account.id})`);

      try {
        // Execute the template query
        const data = await executeTemplateQuery(account.id, template);
        console.log(`Retrieved ${data.length} results for ${account.name}`);

        // Generate email HTML
        const reportDate = new Date();
        const accountData = {
          accountName: account.name,
          currency: account.currency,
          data: data,
        };

        const emailHtml = generateTemplateEmail(template, accountData, reportDate);

        // Send email if requested
        if (sendEmail) {
          const emailSubject = `${template.name} - ${account.name}`;
          console.log(`Sending email: ${emailSubject}`);

          await sendDailyReport(emailHtml, reportDate, emailSubject);

          results.push({
            accountId: account.id,
            accountName: account.name,
            success: true,
            resultCount: data.length,
            emailSent: true,
          });
        } else {
          results.push({
            accountId: account.id,
            accountName: account.name,
            success: true,
            resultCount: data.length,
            emailSent: false,
            html: emailHtml,
          });
        }

        console.log(`✓ Completed report for ${account.name}`);
      } catch (error) {
        console.error(`Error processing account ${account.name}:`, error.message);
        results.push({
          accountId: account.id,
          accountName: account.name,
          success: false,
          error: error.message,
        });
      }
    }

    console.log('\n=== Template Report Generation Summary ===');
    console.log(`Total accounts processed: ${accounts.length}`);
    console.log(`Successful: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);

    return {
      success: true,
      template: template.name,
      results: results,
    };
  } catch (error) {
    console.error('Error generating template report:', error);
    throw error;
  }
}

/**
 * Generate multiple template reports
 * @param {Array<string>} templateIds - Array of template IDs
 * @param {string} customerId - The customer/account ID (optional)
 * @param {boolean} sendEmail - Whether to send reports via email
 * @returns {Array} Array of report results
 */
export async function generateMultipleTemplateReports(templateIds, customerId = null, sendEmail = true) {
  console.log(`Generating ${templateIds.length} template reports...`);

  const allResults = [];

  for (const templateId of templateIds) {
    try {
      const result = await generateTemplateReport(templateId, customerId, sendEmail);
      allResults.push(result);
    } catch (error) {
      console.error(`Failed to generate report for template ${templateId}:`, error.message);
      allResults.push({
        success: false,
        templateId: templateId,
        error: error.message,
      });
    }
  }

  return allResults;
}

// If running this file directly (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  const templateId = process.argv[2] || 'zero-conversion-search-terms';
  const customerId = process.argv[3] || null;

  console.log('Running template report generation in test mode...');
  console.log(`Template: ${templateId}`);
  if (customerId) {
    console.log(`Account: ${customerId}`);
  } else {
    console.log('Account: All accounts');
  }

  generateTemplateReport(templateId, customerId)
    .then((result) => {
      console.log('\n✓ Template report generation completed successfully');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Template report generation failed:', error);
      process.exit(1);
    });
}

export default generateTemplateReport;
