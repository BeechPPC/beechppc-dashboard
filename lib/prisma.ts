/**
 * Prisma Client Singleton
 * Prevents multiple instances in development (hot reload)
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma Client with Neon adapter for serverless
const createPrismaClient = () => {
  // Check if we're in a serverless environment (Vercel)
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME

  if (isServerless && process.env.DATABASE_URL) {
    // Use Neon adapter for serverless
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaNeon(pool)

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  // Standard Prisma Client for local development
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma