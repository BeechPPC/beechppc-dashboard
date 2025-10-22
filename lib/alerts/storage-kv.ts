/**
 * Redis storage for alerts
 * Provides persistent storage across all serverless instances
 * Requires REDIS_URL or Alerts_REDIS_URL environment variable
 * Falls back to memory storage if Redis is not configured
 */

import { createClient, RedisClientType } from 'redis'
import type { Alert } from './types'

const ALERTS_KEY = 'beechppc:alerts'

// Check if Redis environment variable is configured
const redisUrl = process.env.REDIS_URL || process.env.Alerts_REDIS_URL
const isRedisConfigured = Boolean(redisUrl)

// Lazy load Redis client
let redis: RedisClientType | null = null
let redisConnecting: Promise<RedisClientType | null> | null = null
let lastConnectionAttempt = 0
const CONNECTION_RETRY_DELAY = 5000 // 5 seconds

async function getRedisClient() {
  // If we have a healthy connection, return it
  if (redis && redis.isOpen) {
    return redis
  }

  if (!isRedisConfigured) return null

  // If already connecting, wait for that connection
  if (redisConnecting) {
    return await redisConnecting
  }

  // Rate limit connection attempts
  const now = Date.now()
  if (now - lastConnectionAttempt < CONNECTION_RETRY_DELAY) {
    console.warn('Redis connection attempt too soon, using memory storage')
    return null
  }
  lastConnectionAttempt = now

  // Start new connection
  redisConnecting = (async () => {
    try {
      const client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              console.warn('Redis reconnection failed after 3 attempts')
              return false // Stop reconnecting
            }
            return Math.min(retries * 100, 3000)
          },
          connectTimeout: 10000, // 10 second timeout
        },
      })

      // Handle connection errors
      client.on('error', (err) => {
        console.error('Redis client error:', err)
      })

      client.on('reconnecting', () => {
        console.log('Redis client reconnecting...')
      })

      await client.connect()
      redis = client
      console.log('Redis connected successfully')
      return redis
    } catch (error) {
      console.warn('Redis connection failed, using memory storage:', error)
      redis = null
      return null
    } finally {
      redisConnecting = null
    }
  })()

  return await redisConnecting
}

// In-memory fallback
let memoryCache: Alert[] | null = null

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
  // Use Redis if configured
  const client = await getRedisClient()
  if (client) {
    try {
      const data = await client.get(ALERTS_KEY)

      // If no alerts exist, initialize with defaults
      if (!data) {
        const defaultAlerts = getDefaultAlerts()
        await client.set(ALERTS_KEY, JSON.stringify(defaultAlerts))
        return defaultAlerts
      }

      const alerts = JSON.parse(data)
      if (!Array.isArray(alerts)) {
        const defaultAlerts = getDefaultAlerts()
        await client.set(ALERTS_KEY, JSON.stringify(defaultAlerts))
        return defaultAlerts
      }

      return alerts
    } catch (error) {
      console.error('Error fetching alerts from Redis:', error)
      // Fall through to memory storage
    }
  }

  // Fallback to memory storage
  if (!memoryCache) {
    memoryCache = getDefaultAlerts()
  }
  return [...memoryCache]
}

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  // Use Redis if configured
  const client = await getRedisClient()
  if (client) {
    try {
      await client.set(ALERTS_KEY, JSON.stringify(alerts))
      return
    } catch (error) {
      console.error('Error saving alerts to Redis:', error)
      // Fall through to memory storage
    }
  }

  // Fallback to memory storage
  memoryCache = [...alerts]
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
