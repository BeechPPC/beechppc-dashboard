import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis'

interface MeetingNote {
  id: string
  date: string
  note: string
  createdAt: string
}

// In-memory fallback storage (per-server instance)
const memoryStorage = new Map<string, MeetingNote[]>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params
    const redis = await getRedisClient()
    const notesKey = `client:${accountId}:meeting-notes`

    // Try Redis first
    if (redis) {
      try {
        const notes = await redis.get(notesKey)
        if (notes) {
          const notesArray = JSON.parse(notes) as MeetingNote[]
          // Sort by date, newest first
          notesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          return NextResponse.json({ notes: notesArray })
        }
      } catch (error) {
        console.warn('Redis read failed, using memory fallback:', error)
      }
    }

    // Fallback to memory storage
    const memoryNotes = memoryStorage.get(notesKey) || []
    // Sort by date, newest first
    memoryNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return NextResponse.json({ notes: memoryNotes })
  } catch (error) {
    console.error('Error fetching meeting notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meeting notes', notes: [] },
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
    let notesArray: MeetingNote[] = []

    // Try Redis first
    if (redis) {
      try {
        const existingNotes = await redis.get(notesKey)
        notesArray = existingNotes ? JSON.parse(existingNotes) : []
      } catch (error) {
        console.warn('Redis read failed, using memory fallback:', error)
        notesArray = memoryStorage.get(notesKey) || []
      }
    } else {
      // Fallback to memory storage
      notesArray = memoryStorage.get(notesKey) || []
    }

    // Create new note
    const newNote: MeetingNote = {
      id: Date.now().toString(),
      date,
      note,
      createdAt: new Date().toISOString(),
    }

    // Add to array and save
    notesArray.push(newNote)

    // Try Redis first
    if (redis) {
      try {
        await redis.set(notesKey, JSON.stringify(notesArray))
        return NextResponse.json({ success: true, note: newNote })
      } catch (error) {
        console.warn('Redis write failed, using memory fallback:', error)
      }
    }

    // Fallback to memory storage
    memoryStorage.set(notesKey, notesArray)
    return NextResponse.json({ success: true, note: newNote })
  } catch (error) {
    console.error('Error saving meeting note:', error)
    return NextResponse.json(
      { error: 'Failed to save meeting note' },
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
    let notesArray: MeetingNote[] = []

    // Try Redis first
    if (redis) {
      try {
        const existingNotes = await redis.get(notesKey)
        notesArray = existingNotes ? JSON.parse(existingNotes) : []
      } catch (error) {
        console.warn('Redis read failed, using memory fallback:', error)
        notesArray = memoryStorage.get(notesKey) || []
      }
    } else {
      // Fallback to memory storage
      notesArray = memoryStorage.get(notesKey) || []
    }

    // Remove note
    const filteredNotes = notesArray.filter(note => note.id !== noteId)

    // Try Redis first
    if (redis) {
      try {
        await redis.set(notesKey, JSON.stringify(filteredNotes))
        return NextResponse.json({ success: true })
      } catch (error) {
        console.warn('Redis write failed, using memory fallback:', error)
      }
    }

    // Fallback to memory storage
    memoryStorage.set(notesKey, filteredNotes)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting meeting note:', error)
    return NextResponse.json(
      { error: 'Failed to delete meeting note' },
      { status: 500 }
    )
  }
}

