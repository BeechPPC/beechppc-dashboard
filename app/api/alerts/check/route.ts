import { NextResponse } from 'next/server'
import { getEnabledAlerts, updateAlert } from '@/lib/alerts/storage'
import { checkAllAlerts } from '@/lib/alerts/checker'
import { generateAlertEmail, generateAlertEmailSubject } from '@/lib/alerts/email-template'
import { sendEmail } from '@/lib/email/service'

/**
 * POST /api/alerts/check
 * Check all enabled alerts and send notifications
 */
export async function POST() {
  try {
    // Get all enabled alerts
    const alerts = await getEnabledAlerts()

    if (alerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No enabled alerts to check',
        checked: 0,
        triggered: 0,
      })
    }

    // Check all alerts
    const results = await checkAllAlerts(alerts)

    // Filter to only triggered alerts
    const triggeredResults = results.filter(r => r.triggered)

    // Send email notifications for triggered alerts
    let emailsSent = 0
    for (const result of triggeredResults) {
      if (result.triggers.length > 0) {
        // Get unique recipients from the alert
        const recipients = result.alert.recipients

        // Generate email
        const subject = generateAlertEmailSubject(result.triggers)
        const html = generateAlertEmail(result.triggers)

        try {
          // Send email to all recipients
          await sendEmail(recipients, subject, html)
          emailsSent++

          // Update last triggered timestamp
          await updateAlert(result.alert.id, {
            lastTriggered: new Date().toISOString(),
          })
        } catch (emailError) {
          console.error(`Failed to send alert email for ${result.alert.name}:`, emailError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: alerts.length,
      triggered: triggeredResults.length,
      emailsSent,
      results: triggeredResults.map(r => ({
        alertId: r.alert.id,
        alertName: r.alert.name,
        triggerCount: r.triggers.length,
        triggers: r.triggers,
      })),
    })
  } catch (error) {
    console.error('Error checking alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check alerts',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
