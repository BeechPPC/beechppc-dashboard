import { NextRequest, NextResponse } from 'next/server'
import { getSettings, updateSettings } from '@/lib/settings/storage'

export async function GET() {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json()
    const newSettings = await updateSettings(updates)
    return NextResponse.json(newSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
