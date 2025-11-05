import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const redis = await getRedisClient()

    const detailsKey = `client:${accountId}:details`
    const details = await redis.get(detailsKey)

    if (details) {
      return NextResponse.json({ details: JSON.parse(details) })
    }

    return NextResponse.json({ details: null })
  } catch (error) {
    console.error('Error fetching client details:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Check if it's a Redis connection error
    if (errorMessage.includes('Redis') || errorMessage.includes('not configured')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your Redis configuration.', details: null },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: `Failed to fetch client details: ${errorMessage}`, details: null },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const body = await request.json()
    const redis = await getRedisClient()

    const detailsKey = `client:${accountId}:details`

    // Store client details in Redis
    await redis.set(detailsKey, JSON.stringify(body))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving client details:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Check if it's a Redis connection error
    if (errorMessage.includes('Redis') || errorMessage.includes('not configured')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your Redis configuration.' },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: `Failed to save client details: ${errorMessage}` },
      { status: 500 }
    )
  }
}
