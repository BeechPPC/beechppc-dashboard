import { generateEmailTemplate } from './emailTemplate.js';
import { sendDailyReport, verifyEmailConfig } from './emailService.js';

/**
 * Test email configuration and send a test report
 */
async function testEmailService() {
  console.log('Testing email service...\n');

  // Step 1: Verify email configuration
  console.log('Step 1: Verifying email configuration...');
  const isConfigValid = await verifyEmailConfig();

  if (!isConfigValid) {
    console.error('❌ Email configuration is invalid. Please check your .env file.');
    process.exit(1);
  }
  console.log('✅ Email configuration verified successfully!\n');

  // Step 2: Generate mock report data
  console.log('Step 2: Generating mock report data...');
  const mockReportData = [
    {
      id: '1234567890',
      name: 'Test Account 1',
      currency: 'AUD',
      yesterday: {
        cost: 150.50,
        conversions: 12,
        avgCpc: 2.35,
        costPerConv: 12.54,
        impressions: 5420,
      },
      previousDay: {
        cost: 145.20,
        conversions: 11,
        avgCpc: 2.28,
        costPerConv: 13.20,
        impressions: 5180,
      },
    },
    {
      id: '0987654321',
      name: 'Test Account 2',
      currency: 'AUD',
      yesterday: {
        cost: 320.75,
        conversions: 25,
        avgCpc: 1.89,
        costPerConv: 12.83,
        impressions: 8950,
      },
      previousDay: {
        cost: 298.60,
        conversions: 23,
        avgCpc: 1.85,
        costPerConv: 12.98,
        impressions: 8620,
      },
    },
  ];
  console.log(`✅ Generated mock data for ${mockReportData.length} accounts\n`);

  // Step 3: Generate email template
  console.log('Step 3: Generating email HTML template...');
  const reportDate = new Date();
  reportDate.setDate(reportDate.getDate() - 1); // Yesterday's date
  const emailHtml = generateEmailTemplate(mockReportData, reportDate);
  console.log('✅ Email template generated successfully\n');

  // Step 4: Send test email
  console.log('Step 4: Sending test email...');
  try {
    const result = await sendDailyReport(emailHtml, reportDate);
    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${result.messageId}\n`);
    console.log('🎉 Email test completed successfully!');
    console.log('   Please check your inbox for the test report.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    process.exit(1);
  }
}

// Run the test
testEmailService();
