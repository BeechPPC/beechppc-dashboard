/**
 * Prisma Client Singleton
 * Prevents multiple instances in development (hot reload)
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma Client with Neon adapter for serverless
const createPrismaClient = () => {
  console.log('[Prisma] Creating Prisma client...')
  console.log('[Prisma] DATABASE_URL exists:', !!process.env.DATABASE_URL)
  console.log('[Prisma] Environment:', process.env.NODE_ENV)
  console.log('[Prisma] WebSocket available:', typeof WebSocket !== 'undefined')

  // Always use Neon adapter when DATABASE_URL is available (for Supabase compatibility)
  if (process.env.DATABASE_URL) {
    try {
      // Configure Neon for serverless
      // Only use ws in Node.js environment (not Edge Runtime)
      if (typeof WebSocket === 'undefined') {
        console.log('[Prisma] Loading ws package for Node.js environment')
        const ws = require('ws')
        neonConfig.webSocketConstructor = ws
      } else {
        console.log('[Prisma] Using native WebSocket (Edge Runtime)')
      }

      // Use Neon adapter - pass PoolConfig object
      console.log('[Prisma] Creating Neon adapter...')
      const adapter = new PrismaNeon({
        connectionString: process.env.DATABASE_URL,
      })

      console.log('[Prisma] Creating PrismaClient with Neon adapter...')
      return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })
    } catch (error) {
      console.error('[Prisma] Error creating Prisma client with Neon adapter:', error)
      throw error
    }
  }

  // Fallback to standard Prisma Client (though this shouldn't happen in production)
  console.log('[Prisma] Creating standard PrismaClient (no DATABASE_URL)')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma