/**
 * Health check endpoint for database connectivity
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    console.log('[Health Check] Testing database connection...')

    // Try to connect and query
    await prisma.$queryRaw`SELECT 1 as health`

    console.log('[Health Check] Database connection successful')

    // Try to check if ReportSchedule table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'ReportSchedule'
      ) as exists
    `

    console.log('[Health Check] Table check result:', tableCheck)

    return NextResponse.json({
      success: true,
      database: 'connected',
      tableExists: tableCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Health Check] Database connection failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}