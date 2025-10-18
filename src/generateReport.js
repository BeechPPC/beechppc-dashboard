import { getMccReportData } from './googleAdsClient.js';
import { generateEmailTemplate } from './emailTemplate.js';
import { sendDailyReport } from './emailService.js';

/**
 * Generate and send the daily MCC report
 */
export async function generateAndSendReport() {
  console.log('Starting daily MCC report generation...');
  console.log(`Report Date: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}`);

  try {
    // Fetch MCC data
    console.log('Fetching MCC account data...');
    const reportData = await getMccReportData();
    console.log(`Retrieved data for ${reportData.length} accounts`);

    if (reportData.length === 0) {
      console.warn('No account data found. Skipping report generation.');
      return { success: false, message: 'No data available' };
    }

    // Generate email HTML
    console.log('Generating email template...');
    const reportDate = new Date();
    reportDate.setDate(reportDate.getDate() - 1); // Yesterday's report
    const emailHtml = generateEmailTemplate(reportData, reportDate);

    // Send email
    console.log('Sending email...');
    const result = await sendDailyReport(emailHtml, reportDate);

    console.log('Daily MCC report completed successfully');
    return result;
  } catch (error) {
    console.error('Error generating daily report:', error);
    throw error;
  }
}

// If running this file directly (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running report generation in test mode...');
  generateAndSendReport()
    .then((result) => {
      console.log('Report generation completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Report generation failed:', error);
      process.exit(1);
    });
}

export default generateAndSendReport;
