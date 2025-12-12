/**
 * Migration Script: Transfer existing schedule from settings to database
 *
 * This script migrates the legacy schedule configuration from settings
 * to the new ReportSchedule database table.
 */

import prisma from '../lib/prisma'
import { getSettings } from '../lib/settings/storage'

async function migrateSchedule() {
  try {
    console.log('📋 Starting schedule migration...\n')

    // Get current settings
    const settings = await getSettings()
    console.log('Current settings:')
    console.log('- Schedule:', settings.schedule || 'Not set')
    console.log('- Timezone:', settings.timezone || 'Not set')
    console.log('- Recipients:', settings.recipients || 'Not set')
    console.log()

    // Check if schedule already exists
    const existingSchedules = await prisma.reportSchedule.findMany()
    console.log(`Found ${existingSchedules.length} existing schedule(s) in database`)

    if (existingSchedules.length > 0) {
      console.log('\n⚠️  Warning: Schedules already exist in the database:')
      existingSchedules.forEach(schedule => {
        console.log(`   - ${schedule.name} (${schedule.cronSchedule})`)
      })

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })

      const answer = await new Promise<string>((resolve) => {
        readline.question('\nDo you want to create an additional schedule? (yes/no): ', resolve)
      })
      readline.close()

      if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Migration cancelled')
        return
      }
    }

    // Validate that we have the required data
    if (!settings.schedule) {
      console.log('\n❌ No schedule found in settings. Migration aborted.')
      return
    }

    if (!settings.recipients) {
      console.log('\n⚠️  Warning: No recipients found in settings.')
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })

      const recipients = await new Promise<string>((resolve) => {
        readline.question('Enter recipient email addresses (comma-separated): ', resolve)
      })
      readline.close()

      if (!recipients.trim()) {
        console.log('\n❌ No recipients provided. Migration aborted.')
        return
      }

      settings.recipients = recipients
    }

    // Parse recipients
    const recipientEmails = settings.recipients
      .split(',')
      .map(email => email.trim())
      .filter(Boolean)

    console.log(`\n📧 Recipients to migrate: ${recipientEmails.join(', ')}`)

    // Determine frequency from cron
    const cronParts = settings.schedule.split(' ')
    let frequency = 'DAILY'
    if (cronParts[4] !== '*') {
      frequency = 'WEEKLY'
    } else if (cronParts[2] !== '*') {
      frequency = 'MONTHLY'
    }

    // Create the schedule
    const newSchedule = await prisma.reportSchedule.create({
      data: {
        name: 'Daily MCC Performance Report',
        description: 'Automated daily report for all Google Ads accounts (migrated from legacy settings)',
        reportType: 'PERFORMANCE',
        frequency,
        enabled: true,
        cronSchedule: settings.schedule,
        timezone: settings.timezone || 'Australia/Melbourne',
        scopeType: 'ALL_ACCOUNTS',
        accountIds: [],
        templateType: 'STANDARD',
        sections: {
          campaigns: true,
          keywords: true,
          auctionInsights: true,
          qualityScore: true,
          geographic: false,
          device: false,
          adSchedule: false,
          searchTerms: false,
          conversions: true,
        },
        dateRangeType: 'YESTERDAY',
        recipientEmails,
      },
    })

    console.log('\n✅ Schedule migrated successfully!')
    console.log('\nCreated schedule:')
    console.log('- ID:', newSchedule.id)
    console.log('- Name:', newSchedule.name)
    console.log('- Frequency:', newSchedule.frequency)
    console.log('- Cron:', newSchedule.cronSchedule)
    console.log('- Timezone:', newSchedule.timezone)
    console.log('- Recipients:', recipientEmails.join(', '))
    console.log('- Enabled:', newSchedule.enabled)

    console.log('\n✨ Migration complete! You can now manage this schedule in the Reports → Scheduled tab.')
    console.log('\n💡 Note: The legacy settings (schedule, timezone, recipients) are still in place.')
    console.log('   You can safely remove them from settings once you verify the new schedule works.')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateSchedule()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })