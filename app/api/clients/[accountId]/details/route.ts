import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis'

// In-memory fallback storage (per-server instance)
const memoryStorage = new Map<string, string>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const redis = await getRedisClient()
    const detailsKey = `client:${accountId}:details`

    // Try Redis first
    if (redis) {
      try {
        const details = await redis.get(detailsKey)
        if (details) {
          return NextResponse.json({ details: JSON.parse(details) })
        }
      } catch (error) {
        console.warn('Redis read failed, using memory fallback:', error)
      }
    }

    // Fallback to memory storage
    const memoryData = memoryStorage.get(detailsKey)
    if (memoryData) {
      return NextResponse.json({ details: JSON.parse(memoryData) })
    }

    return NextResponse.json({ details: null })
  } catch (error) {
    console.error('Error fetching client details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client details', details: null },
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
    const dataString = JSON.stringify(body)

    // Try Redis first
    if (redis) {
      try {
        await redis.set(detailsKey, dataString)
        return NextResponse.json({ success: true })
      } catch (error) {
        console.warn('Redis write failed, using memory fallback:', error)
      }
    }

    // Fallback to memory storage
    memoryStorage.set(detailsKey, dataString)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving client details:', error)
    return NextResponse.json(
      { error: 'Failed to save client details' },
      { status: 500 }
    )
  }
}
