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
  // Always use Neon adapter when DATABASE_URL is available (for Supabase compatibility)
  if (process.env.DATABASE_URL) {
    // Configure Neon for serverless
    // Only use ws in Node.js environment (not Edge Runtime)
    if (typeof WebSocket === 'undefined') {
      const ws = require('ws')
      neonConfig.webSocketConstructor = ws
    }

    // Use Neon adapter - pass PoolConfig object
    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL,
    })

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  // Fallback to standard Prisma Client (though this shouldn't happen in production)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma