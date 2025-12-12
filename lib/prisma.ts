/**
 * Prisma Client Singleton
 * Prevents multiple instances in development (hot reload)
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma Client - use standard client, Prisma handles Supabase natively
const createPrismaClient = () => {
  console.log('[Prisma] Creating Prisma client...')
  console.log('[Prisma] DATABASE_URL exists:', !!process.env.DATABASE_URL)
  console.log('[Prisma] Environment:', process.env.NODE_ENV)

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  try {
    // For Supabase, pass the connection string config directly to PrismaNeon
    console.log('[Prisma] Creating Prisma Neon adapter with connection string...')
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })

    console.log('[Prisma] Creating PrismaClient with adapter...')
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (error) {
    console.error('[Prisma] Error creating Prisma client:', error)
    throw error
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma