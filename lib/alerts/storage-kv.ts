/**
 * Vercel KV (Redis) storage for alerts
 * Provides persistent storage across all serverless instances
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN environment variables
 */

import { kv } from '@vercel/kv'
import type { Alert } from './types'

const ALERTS_KEY = 'beechppc:alerts'

function generateId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

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

export async function getAllAlerts(): Promise<Alert[]> {
  try {
    const alerts = await kv.get<Alert[]>(ALERTS_KEY)

    // If no alerts exist, initialize with defaults
    if (!alerts || !Array.isArray(alerts)) {
      const defaultAlerts = getDefaultAlerts()
      await kv.set(ALERTS_KEY, defaultAlerts)
      return defaultAlerts
    }

    return alerts
  } catch (error) {
    console.error('Error fetching alerts from KV:', error)
    // Return defaults on error
    return getDefaultAlerts()
  }
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  try {
    await kv.set(ALERTS_KEY, alerts)
  } catch (error) {
    console.error('Error saving alerts to KV:', error)
    throw new Error('Failed to save alerts')
  }
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
