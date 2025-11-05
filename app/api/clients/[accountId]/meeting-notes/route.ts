import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis'

interface MeetingNote {
  id: string
  date: string
  note: string
  createdAt: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const redis = await getRedisClient()

    const notesKey = `client:${accountId}:meeting-notes`
    const notes = await redis.get(notesKey)

    if (notes) {
      const notesArray = JSON.parse(notes) as MeetingNote[]
      // Sort by date, newest first
      notesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return NextResponse.json({ notes: notesArray })
    }

    return NextResponse.json({ notes: [] })
  } catch (error) {
    console.error('Error fetching meeting notes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Check if it's a Redis connection error
    if (errorMessage.includes('Redis') || errorMessage.includes('not configured')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your Redis configuration.', notes: [] },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: `Failed to fetch meeting notes: ${errorMessage}`, notes: [] },
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
    const { date, note } = body

    if (!date || !note) {
      return NextResponse.json(
        { error: 'Date and note are required' },
        { status: 400 }
      )
    }

    const redis = await getRedisClient()
    const notesKey = `client:${accountId}:meeting-notes`

    // Get existing notes
    const existingNotes = await redis.get(notesKey)
    const notesArray: MeetingNote[] = existingNotes ? JSON.parse(existingNotes) : []

    // Create new note
    const newNote: MeetingNote = {
      id: Date.now().toString(),
      date,
      note,
      createdAt: new Date().toISOString(),
    }

    // Add to array and save
    notesArray.push(newNote)
    await redis.set(notesKey, JSON.stringify(notesArray))

    return NextResponse.json({ success: true, note: newNote })
  } catch (error) {
    console.error('Error saving meeting note:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Check if it's a Redis connection error
    if (errorMessage.includes('Redis') || errorMessage.includes('not configured')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check your Redis configuration.' },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: `Failed to save meeting note: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const searchParams = request.nextUrl.searchParams
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const redis = await getRedisClient()
    const notesKey = `client:${accountId}:meeting-notes`

    // Get existing notes
    const existingNotes = await redis.get(notesKey)
    const notesArray: MeetingNote[] = existingNotes ? JSON.parse(existingNotes) : []

    // Remove note
    const filteredNotes = notesArray.filter(note => note.id !== noteId)
    await redis.set(notesKey, JSON.stringify(filteredNotes))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting meeting note:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting note' },
      { status: 500 }
    )
  }
}

