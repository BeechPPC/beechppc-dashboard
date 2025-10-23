import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { updateSettings } from '@/lib/settings/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('favicon') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type - favicons must be ICO or PNG
    const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only ICO and PNG files are allowed for favicons.' },
        { status: 400 }
      )
    }

    // Validate file size (max 500KB for favicon)
    const maxSize = 500 * 1024 // 500KB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500KB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'ico'
    const fileName = `favicon-${timestamp}.${extension}`

    // Ensure public directory exists
    const publicDir = join(process.cwd(), 'public')
    try {
      await mkdir(publicDir, { recursive: true })
    } catch (error) {
      console.error('Error creating public directory:', error)
    }

    // Save file to public directory (so it can be accessed as /favicon-xxx.ico)
    const filePath = join(publicDir, fileName)
    await writeFile(filePath, buffer)

    // Update settings with new favicon URL
    const faviconUrl = `/${fileName}`
    await updateSettings({
      faviconUrl,
      faviconFileName: fileName,
    })

    return NextResponse.json({
      faviconUrl,
      fileName,
      message: 'Favicon uploaded successfully',
    })
  } catch (error) {
    console.error('Error uploading favicon:', error)
    return NextResponse.json(
      { error: 'Failed to upload favicon' },
      { status: 500 }
    )
  }
}
