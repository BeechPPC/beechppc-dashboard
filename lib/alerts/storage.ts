import fs from 'fs/promises'
import path from 'path'
import type { Alert } from './types'

const ALERTS_FILE = path.join(process.cwd(), 'data', 'alerts.json')

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.mkdir(dataDir, { recursive: true })
  } catch {
    // Directory already exists, ignore error
  }
}

export async function getAllAlerts(): Promise<Alert[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(ALERTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    // File doesn't exist yet, return default alerts
    return getDefaultAlerts()
  }
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(ALERTS_FILE, JSON.stringify(alerts, null, 2), 'utf-8')
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
