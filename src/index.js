import cron from 'node-cron';
import dotenv from 'dotenv';
import { generateAndSendReport } from './generateReport.js';
import { verifyEmailConfig } from './emailService.js';

dotenv.config();

// Get timezone from environment or default to Australia/Melbourne
const TIMEZONE = process.env.TIMEZONE || 'Australia/Melbourne';

// Cron schedule: 0 11 * * * means every day at 11:00 AM
const SCHEDULE = process.env.REPORT_SCHEDULE || '0 11 * * *';

/**
 * Initialize and start the Beech PPC AI Agent
 */
async function startAgent() {
  console.log('='.repeat(60));
  console.log('🚀 Beech PPC AI Agent Starting...');
  console.log('='.repeat(60));

  // Verify email configuration
  console.log('\n📧 Verifying email configuration...');
  const emailVerified = await verifyEmailConfig();

  if (!emailVerified) {
    console.error('❌ Email configuration verification failed!');
    console.error('Please check your .env file for correct email settings.');
    process.exit(1);
  }
  console.log('✅ Email configuration verified');

  // Display configuration
  console.log('\n⚙️  Configuration:');
  console.log(`   - Schedule: Daily at 11:00 AM`);
  console.log(`   - Timezone: ${TIMEZONE}`);
  console.log(`   - Email To: ${process.env.EMAIL_TO}`);
  console.log(`   - MCC Account: ${process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID}`);

  // Schedule the daily report
  console.log('\n📅 Scheduling daily report...');
  const task = cron.schedule(
    SCHEDULE,
    async () => {
      console.log('\n' + '='.repeat(60));
      console.log(`📊 Starting scheduled report generation...`);
      console.log(`   Time: ${new Date().toLocaleString('en-AU', { timeZone: TIMEZONE })}`);
      console.log('='.repeat(60));

      try {
        await generateAndSendReport();
        console.log('✅ Scheduled report completed successfully\n');
      } catch (error) {
        console.error('❌ Scheduled report failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: TIMEZONE,
    }
  );

  task.start();

  console.log('✅ Daily report scheduled successfully');
  console.log('\n' + '='.repeat(60));
  console.log('✨ Beech PPC AI Agent is now running!');
  console.log('   Press Ctrl+C to stop the agent');
  console.log('='.repeat(60) + '\n');

  // Display next scheduled run
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(11, 0, 0, 0);
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  console.log(`⏰ Next report scheduled for: ${nextRun.toLocaleString('en-AU', { timeZone: TIMEZONE })}\n`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n' + '='.repeat(60));
  console.log('👋 Shutting down Beech PPC AI Agent...');
  console.log('='.repeat(60));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n' + '='.repeat(60));
  console.log('👋 Shutting down Beech PPC AI Agent...');
  console.log('='.repeat(60));
  process.exit(0);
});

// Start the agent
startAgent().catch((error) => {
  console.error('❌ Failed to start agent:', error);
  process.exit(1);
});
