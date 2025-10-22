import { getMccReportData, getCustomerAccounts, getConversionActions, getDisapprovedAds } from '@/lib/google-ads/client'
import type { Alert, AlertTrigger, AlertCheckResult } from './types'
import type { AccountPerformance } from '@/lib/google-ads/types'

/**
 * Check a single alert against current Google Ads data
 */
export async function checkAlert(alert: Alert): Promise<AlertCheckResult> {
  try {
    // Handle conversion tracking alerts separately
    if (alert.type === 'conversion_tracking') {
      return await checkConversionTrackingAlert(alert)
    }

    // Handle ad disapproval alerts separately
    if (alert.type === 'ad_disapproval') {
      return await checkAdDisapprovalAlert(alert)
    }

    // Get today's date
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Get yesterday's date for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Fetch Google Ads data for today and yesterday
    const accountsData = await getMccReportData(
      todayStr,
      todayStr,
      yesterdayStr,
      yesterdayStr,
      alert.accountId
    )

    const triggers: AlertTrigger[] = []

    // Check each account against the alert condition
    for (const account of accountsData) {
      const trigger = evaluateAlertCondition(alert, account)
      if (trigger) {
        triggers.push(trigger)
      }
    }

    return {
      triggered: triggers.length > 0,
      alert,
      triggers,
    }
  } catch (error) {
    console.error(`Error checking alert ${alert.id}:`, error)
    return {
      triggered: false,
      alert,
      triggers: [],
    }
  }
}

/**
 * Check conversion tracking alerts
 */
async function checkConversionTrackingAlert(alert: Alert): Promise<AlertCheckResult> {
  try {
    const triggers: AlertTrigger[] = []

    // Get all accounts or specific account
    const allAccounts = await getCustomerAccounts()
    const accounts = alert.accountId
      ? allAccounts.filter(acc => acc.id === alert.accountId)
      : allAccounts

    // Check each account's conversion actions
    for (const account of accounts) {
      const conversionActions = await getConversionActions(account.id)

      for (const action of conversionActions) {
        // Check if conversion action meets the alert condition
        if (alert.condition === 'no_data_for_days' && action.daysSinceLastConversion !== null) {
          if (action.daysSinceLastConversion >= alert.threshold) {
            triggers.push({
              alertId: alert.id,
              alertName: alert.name,
              accountId: account.id,
              accountName: account.name,
              triggeredAt: new Date().toISOString(),
              metricType: alert.type,
              currentValue: action.daysSinceLastConversion,
              threshold: alert.threshold,
              condition: alert.condition,
              message: `Conversion action "${action.name}" has not received any conversions for ${action.daysSinceLastConversion} days`,
              conversionActionName: action.name,
              lastConversionDate: action.lastConversionDate || undefined,
              daysSinceLastConversion: action.daysSinceLastConversion,
            })
          }
        } else if (action.lastConversionDate === null) {
          // No conversion data found at all
          triggers.push({
            alertId: alert.id,
            alertName: alert.name,
            accountId: account.id,
            accountName: account.name,
            triggeredAt: new Date().toISOString(),
            metricType: alert.type,
            currentValue: 999, // Use large number to indicate no data
            threshold: alert.threshold,
            condition: alert.condition,
            message: `Conversion action "${action.name}" has no conversion data in the last 90 days`,
            conversionActionName: action.name,
            lastConversionDate: undefined,
            daysSinceLastConversion: undefined,
          })
        }
      }
    }

    return {
      triggered: triggers.length > 0,
      alert,
      triggers,
    }
  } catch (error) {
    console.error(`Error checking conversion tracking alert ${alert.id}:`, error)
    return {
      triggered: false,
      alert,
      triggers: [],
    }
  }
}

/**
 * Check ad disapproval alerts
 */
async function checkAdDisapprovalAlert(alert: Alert): Promise<AlertCheckResult> {
  try {
    const triggers: AlertTrigger[] = []

    // Get all accounts or specific account
    const allAccounts = await getCustomerAccounts()
    const accounts = alert.accountId
      ? allAccounts.filter(acc => acc.id === alert.accountId)
      : allAccounts

    // Check each account for disapproved ads
    for (const account of accounts) {
      const disapprovedAds = await getDisapprovedAds(account.id)

      // If there are any disapproved ads, create a trigger for each
      for (const ad of disapprovedAds) {
        triggers.push({
          alertId: alert.id,
          alertName: alert.name,
          accountId: account.id,
          accountName: account.name,
          triggeredAt: new Date().toISOString(),
          metricType: alert.type,
          currentValue: disapprovedAds.length,
          threshold: 0, // Any disapproval triggers the alert
          condition: alert.condition,
          message: `Ad "${ad.adName}" in campaign "${ad.campaignName}" has been disapproved`,
          adId: ad.adId,
          adName: ad.adName,
          disapprovalReasons: ad.disapprovalReasons,
          adGroupName: ad.adGroupName,
          campaignName: ad.campaignName,
        })
      }
    }

    return {
      triggered: triggers.length > 0,
      alert,
      triggers,
    }
  } catch (error) {
    console.error(`Error checking ad disapproval alert ${alert.id}:`, error)
    return {
      triggered: false,
      alert,
      triggers: [],
    }
  }
}

/**
 * Check all enabled alerts
 */
export async function checkAllAlerts(alerts: Alert[]): Promise<AlertCheckResult[]> {
  const enabledAlerts = alerts.filter(a => a.enabled)
  const results = await Promise.all(enabledAlerts.map(alert => checkAlert(alert)))
  return results
}

/**
 * Evaluate if an account's metrics trigger an alert
 */
function evaluateAlertCondition(
  alert: Alert,
  account: AccountPerformance
): AlertTrigger | null {
  const currentMetrics = account.yesterday
  const previousMetrics = account.previousDay

  let currentValue: number
  let previousValue: number | undefined

  // Get the metric value based on alert type
  switch (alert.type) {
    case 'spend':
      currentValue = currentMetrics.cost
      previousValue = previousMetrics?.cost
      break
    case 'conversions':
      currentValue = currentMetrics.conversions
      previousValue = previousMetrics?.conversions
      break
    case 'ctr':
      currentValue = currentMetrics.clicks > 0
        ? (currentMetrics.clicks / currentMetrics.impressions) * 100
        : 0
      previousValue = previousMetrics && previousMetrics.clicks > 0
        ? (previousMetrics.clicks / previousMetrics.impressions) * 100
        : undefined
      break
    case 'cpc':
      currentValue = currentMetrics.avgCpc
      previousValue = previousMetrics?.avgCpc
      break
    case 'conversion_rate':
      currentValue = currentMetrics.clicks > 0
        ? (currentMetrics.conversions / currentMetrics.clicks) * 100
        : 0
      previousValue = previousMetrics && previousMetrics.clicks > 0
        ? (previousMetrics.conversions / previousMetrics.clicks) * 100
        : undefined
      break
    default:
      return null
  }

  let triggered = false
  let message = ''

  // Evaluate condition
  switch (alert.condition) {
    case 'above':
      triggered = currentValue > alert.threshold
      if (triggered) {
        message = `${alert.type} is ${formatValue(alert.type, currentValue)}, which is above the threshold of ${formatValue(alert.type, alert.threshold)}`
      }
      break

    case 'below':
      triggered = currentValue < alert.threshold
      if (triggered) {
        message = `${alert.type} is ${formatValue(alert.type, currentValue)}, which is below the threshold of ${formatValue(alert.type, alert.threshold)}`
      }
      break

    case 'increases_by':
      if (previousValue !== undefined) {
        const percentChange = ((currentValue - previousValue) / previousValue) * 100
        triggered = percentChange >= alert.threshold
        if (triggered) {
          message = `${alert.type} increased by ${percentChange.toFixed(1)}%, which exceeds the threshold of ${alert.threshold}%`
        }
      }
      break

    case 'decreases_by':
      if (previousValue !== undefined) {
        const percentChange = ((previousValue - currentValue) / previousValue) * 100
        triggered = percentChange >= alert.threshold
        if (triggered) {
          message = `${alert.type} decreased by ${percentChange.toFixed(1)}%, which exceeds the threshold of ${alert.threshold}%`
        }
      }
      break
  }

  if (!triggered) {
    return null
  }

  return {
    alertId: alert.id,
    alertName: alert.name,
    accountId: account.id,
    accountName: account.name,
    triggeredAt: new Date().toISOString(),
    metricType: alert.type,
    currentValue,
    threshold: alert.threshold,
    condition: alert.condition,
    message,
  }
}

/**
 * Format value based on metric type
 */
function formatValue(type: string, value: number): string {
  switch (type) {
    case 'spend':
    case 'cpc':
      return `$${value.toFixed(2)}`
    case 'conversions':
      return value.toFixed(0)
    case 'ctr':
    case 'conversion_rate':
      return `${value.toFixed(2)}%`
    default:
      return value.toFixed(2)
  }
}
