/**
 * Migration Script: Automatic transfer of existing schedule from settings to database
 *
 * This script automatically migrates the legacy schedule configuration.
 * Use this version for automated deployments or when you're confident in the migration.
 */

// Load environment variables first
import 'dotenv/config'

// Disable SSL verification for local script execution
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import prisma from '../lib/prisma'
import { getSettings } from '../lib/settings/storage'

async function migrateSchedule() {
  try {
    console.log('📋 Starting automatic schedule migration...\n')

    // Get current settings
    const settings = await getSettings()
    console.log('Current settings:')
    console.log('- Schedule:', settings.schedule || 'Not set')
    console.log('- Timezone:', settings.timezone || 'Not set')
    console.log('- Recipients:', settings.recipients || 'Not set')
    console.log()

    // Check if schedule already exists with the same name
    const existingSchedule = await prisma.reportSchedule.findFirst({
      where: {
        name: 'Daily MCC Performance Report',
        deletedAt: null,
      },
    })

    if (existingSchedule) {
      console.log('✅ Schedule already exists in database:')
      console.log('- ID:', existingSchedule.id)
      console.log('- Name:', existingSchedule.name)
      console.log('- Cron:', existingSchedule.cronSchedule)
      console.log('- Enabled:', existingSchedule.enabled)
      console.log('\n✨ No migration needed!')
      return
    }

    // Validate that we have the required data
    if (!settings.schedule || !settings.recipients) {
      console.log('\n⚠️  Missing schedule or recipients in settings. Skipping migration.')
      console.log('   You can manually create a schedule in the Reports → Scheduled tab.')
      return
    }

    // Parse recipients
    const recipientEmails = settings.recipients
      .split(',')
      .map(email => email.trim())
      .filter(Boolean)

    if (recipientEmails.length === 0) {
      console.log('\n⚠️  No valid recipients found. Skipping migration.')
      return
    }

    console.log(`\n📧 Migrating with recipients: ${recipientEmails.join(', ')}`)

    // Determine frequency from cron
    const cronParts = settings.schedule.split(' ')
    let frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'DAILY'
    if (cronParts[4] !== '*') {
      frequency = 'WEEKLY'
    } else if (cronParts[2] !== '*') {
      frequency = 'MONTHLY'
    }

    // Create the schedule
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const newSchedule = await prisma.reportSchedule.create({
      data: {
        id: scheduleId,
        name: 'Daily MCC Performance Report',
        description: 'Automated daily report for all Google Ads accounts (migrated from legacy settings)',
        reportType: 'DAILY',
        frequency,
        enabled: true,
        cronSchedule: settings.schedule,
        timezone: settings.timezone || 'Australia/Melbourne',
        scopeType: 'MCC',
        accountIds: [],
        templateType: 'DETAILED',
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
        updatedAt: new Date(),
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