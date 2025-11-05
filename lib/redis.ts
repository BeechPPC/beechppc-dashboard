/**
 * Shared Redis client utility
 * Provides persistent storage across all serverless instances
 * Requires REDIS_URL environment variable
 */

import { createClient } from 'redis'

const redisUrl = process.env.REDIS_URL
const isRedisConfigured = Boolean(redisUrl)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redis: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisConnecting: Promise<any> | null = null
let lastConnectionAttempt = 0
const CONNECTION_RETRY_DELAY = 5000 // 5 seconds

export async function getRedisClient() {
  // If we have a healthy connection, return it
  if (redis && redis.isOpen) {
    return redis
  }

  // If not configured, return null (caller should use fallback)
  if (!isRedisConfigured) {
    return null
  }

  // Prevent connection spam
  const now = Date.now()
  if (now - lastConnectionAttempt < CONNECTION_RETRY_DELAY && !redisConnecting) {
    console.warn('Redis connection retry delay in effect, returning null')
    return null
  }

  // If already connecting, wait for that attempt
  if (redisConnecting) {
    return redisConnecting
  }

  // Start new connection
  lastConnectionAttempt = now
  redisConnecting = (async () => {
    try {
      const client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000,
          reconnectStrategy: (retries) => {
            if (retries > 3) return false
            return Math.min(retries * 100, 3000)
          }
        }
      })

      client.on('error', (err) => {
        console.error('Redis Client Error:', err)
      })

      await client.connect()
      redis = client
      return client
    } catch (error) {
      console.warn('Failed to connect to Redis, using fallback storage:', error)
      redis = null
      return null
    } finally {
      redisConnecting = null
    }
  })()

  return redisConnecting
}
