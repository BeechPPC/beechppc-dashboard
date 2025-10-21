import type { Alert } from './types'

// In-memory storage for alerts (persists during server runtime)
// For production, replace with database storage (Vercel KV, Postgres, etc.)
let alertsCache: Alert[] | null = null

function getDefaultAlerts(): Alert[] {
  return [
    {
      id: 'alert_default_1',
      name: 'High Daily Spend',
      description: 'Alert when daily spend exceeds $500',
      type: 'spend',
      condition: 'above',
      threshold: 500,
      enabled: true,
      recipients: ['chris@beechppc.com'],
      frequency: 'daily',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'alert_default_2',
      name: 'Low Conversion Count',
      description: 'Alert when daily conversions fall below 5',
      type: 'conversions',
      condition: 'below',
      threshold: 5,
      enabled: true,
      recipients: ['chris@beechppc.com'],
      frequency: 'daily',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'alert_default_3',
      name: 'CTR Performance Drop',
      description: 'Alert when CTR decreases by 20% or more',
      type: 'ctr',
      condition: 'decreases_by',
      threshold: 20,
      enabled: false,
      recipients: ['chris@beechppc.com'],
      frequency: 'daily',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

function generateId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function getAllAlerts(): Promise<Alert[]> {
  if (!alertsCache) {
    alertsCache = getDefaultAlerts()
  }
  return [...alertsCache] // Return copy to prevent direct mutation
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  alertsCache = [...alerts]
}

export async function getAlertById(id: string): Promise<Alert | null> {
  const alerts = await getAllAlerts()
  return alerts.find(a => a.id === id) || null
}

export async function createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert> {
  const alerts = await getAllAlerts()
  const newAlert: Alert = {
    ...alert,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  alerts.push(newAlert)
  await saveAlerts(alerts)
  return newAlert
}

export async function updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | null> {
  const alerts = await getAllAlerts()
  const index = alerts.findIndex(a => a.id === id)
  if (index === -1) return null

  alerts[index] = {
    ...alerts[index],
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
  }
  await saveAlerts(alerts)
  return alerts[index]
}

export async function deleteAlert(id: string): Promise<boolean> {
  const alerts = await getAllAlerts()
  const filtered = alerts.filter(a => a.id !== id)
  if (filtered.length === alerts.length) return false
  await saveAlerts(filtered)
  return true
}

export async function getEnabledAlerts(): Promise<Alert[]> {
  const alerts = await getAllAlerts()
  return alerts.filter(a => a.enabled)
}
