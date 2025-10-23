/**
 * Redis storage for application settings
 * Provides persistent storage across all serverless instances
 * Requires REDIS_URL environment variable
 * Falls back to memory storage if Redis is not configured
 */

import { createClient } from 'redis'
import type { AppSettings } from './types'
import { DEFAULT_SETTINGS } from './types'

const SETTINGS_KEY = 'beechppc:settings'

// Check if Redis environment variable is configured
const redisUrl = process.env.REDIS_URL
const isRedisConfigured = Boolean(redisUrl)

// Lazy load Redis client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redis: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisConnecting: Promise<any> | null = null
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
      console.log('Redis connected successfully for settings')
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
let memoryCache: AppSettings | null = null

export async function getSettings(): Promise<AppSettings> {
  // Use Redis if configured
  const client = await getRedisClient()
  if (client) {
    try {
      const data = await client.get(SETTINGS_KEY)

      // If no settings exist, initialize with defaults
      if (!data) {
        await client.set(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS))
        return DEFAULT_SETTINGS
      }

      const settings = JSON.parse(data)
      return settings
    } catch (error) {
      console.error('Error fetching settings from Redis:', error)
      // Fall through to memory storage
    }
  }

  // Fallback to memory storage
  if (!memoryCache) {
    memoryCache = { ...DEFAULT_SETTINGS }
  }
  return { ...memoryCache }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  // Always update the timestamp
  settings.updatedAt = new Date().toISOString()

  // Use Redis if configured
  const client = await getRedisClient()
  if (client) {
    try {
      await client.set(SETTINGS_KEY, JSON.stringify(settings))
      return
    } catch (error) {
      console.error('Error saving settings to Redis:', error)
      // Fall through to memory storage
    }
  }

  // Fallback to memory storage
  memoryCache = { ...settings }
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const currentSettings = await getSettings()
  const newSettings = {
    ...currentSettings,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  await saveSettings(newSettings)
  return newSettings
}
