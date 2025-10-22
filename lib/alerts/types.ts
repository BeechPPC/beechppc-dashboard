export type AlertType = 'spend' | 'conversions' | 'ctr' | 'cpc' | 'conversion_rate' | 'conversion_tracking'

export type AlertCondition = 'above' | 'below' | 'increases_by' | 'decreases_by' | 'no_data_for_days'

export type AlertFrequency = 'daily' | 'hourly' | 'realtime'

export interface Alert {
  id: string
  name: string
  description?: string
  type: AlertType
  condition: AlertCondition
  threshold: number
  enabled: boolean
  accountId?: string // If undefined, applies to all accounts
  recipients: string[]
  frequency: AlertFrequency
  createdAt: string
  updatedAt: string
  lastTriggered?: string
}

export interface AlertTrigger {
  alertId: string
  alertName: string
  accountId: string
  accountName: string
  triggeredAt: string
  metricType: AlertType
  currentValue: number
  threshold: number
  condition: AlertCondition
  message: string
  // For conversion tracking alerts
  conversionActionName?: string
  lastConversionDate?: string
  daysSinceLastConversion?: number
}

export interface AlertCheckResult {
  triggered: boolean
  alert: Alert
  triggers: AlertTrigger[]
}
