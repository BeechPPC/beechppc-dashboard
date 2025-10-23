import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { updateSettings } from '@/lib/settings/storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPEG, SVG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `logo-${timestamp}.${extension}`

    // Ensure public/uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      console.error('Error creating uploads directory:', error)
    }

    // Save file
    const filePath = join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Update settings with new logo URL
    const logoUrl = `/uploads/${fileName}`
    await updateSettings({
      logoUrl,
      logoFileName: fileName,
    })

    return NextResponse.json({
      logoUrl,
      fileName,
      message: 'Logo uploaded successfully',
    })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}
