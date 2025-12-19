import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/auth/helpers'
import { fetchWebsiteContent } from '@/lib/web/fetcher'
import { generateBusinessClarityPDF } from '@/lib/business-clarity/pdf-generator'
import { generateBusinessClaritySlides } from '@/lib/business-clarity/slides-generator'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Lazy initialization to avoid startup errors
let anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      throw new Error('ANTHROPIC_API_KEY is not configured properly')
    }
    anthropic = new Anthropic({ apiKey })
  }
  return anthropic
}

/**
 * POST /api/tools/business-clarity-report
 * Generate a Business Clarity Report for a given website URL
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const userId = await requireAuth()
    if (userId instanceof NextResponse) return userId

    // Parse request
    const body = await request.json()
    const { url } = body

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'URL is required',
        },
        { status: 400 }
      )
    }

    // Validate URL format
    let fullUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = `https://${url}`
    }

    try {
      new URL(fullUrl)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format. Please include https:// or http://',
        },
        { status: 400 }
      )
    }

    console.log('[Business Clarity Report] Generating report for:', fullUrl)

    // Phase 1: Fetch website content
    console.log('[Business Clarity Report] Phase 1: Fetching website content...')
    const websiteContent = await fetchWebsiteContent(fullUrl)

    if (websiteContent.error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch website: ${websiteContent.error}`,
        },
        { status: 400 }
      )
    }

    // Look for additional pages to fetch (about, services, etc.)
    const additionalPages: string[] = []
    const baseUrl = new URL(fullUrl)

    for (const link of websiteContent.links) {
      try {
        const linkUrl = new URL(link.href)
        // Only fetch pages from the same domain
        if (linkUrl.hostname === baseUrl.hostname) {
          const path = linkUrl.pathname.toLowerCase()
          const text = link.text.toLowerCase()

          if (
            path.includes('/about') || text.includes('about') ||
            path.includes('/services') || text.includes('services') ||
            path.includes('/products') || text.includes('products') ||
            path.includes('/testimonial') || text.includes('testimonial') ||
            path.includes('/reviews') || text.includes('reviews')
          ) {
            if (!additionalPages.includes(link.href) && additionalPages.length < 3) {
              additionalPages.push(link.href)
            }
          }
        }
      } catch {
        // Skip invalid URLs
      }
    }

    // Fetch additional pages
    let combinedContent = websiteContent.content
    for (const pageUrl of additionalPages) {
      try {
        const pageContent = await fetchWebsiteContent(pageUrl)
        if (!pageContent.error && pageContent.content) {
          combinedContent += '\n\n' + pageContent.content
        }
      } catch (error) {
        console.log('[Business Clarity Report] Failed to fetch additional page:', pageUrl)
      }
    }

    // Phase 2: Analyze with Claude
    console.log('[Business Clarity Report] Phase 2: Analyzing business with Claude...')

    const client = getAnthropicClient()

    const analysisPrompt = `You are a business analyst creating a comprehensive Business Clarity Report. Analyze the following website content and create a detailed report.

Website URL: ${fullUrl}
Website Title: ${websiteContent.title}
${websiteContent.metaDescription ? `Meta Description: ${websiteContent.metaDescription}` : ''}

Website Content:
${combinedContent.substring(0, 50000)}

Create a comprehensive analysis covering these six dimensions:

1. **Existential Purpose (Why they exist)**
   - Mission and vision
   - Core problem they solve
   - Market positioning

2. **Target Market (Who they serve)**
   - Demographics (measurable attributes)
   - Psychographics (values, behaviors)
   - Pain points
   - Goals

3. **Offerings (What they do)**
   - Primary services/products
   - Secondary offerings
   - Deliverables

4. **Differentiation (USPs)**
   - Competitive advantages
   - Unique processes
   - Guarantees

5. **Trust Signals (Proof & credibility)**
   - Testimonials/reviews
   - Case studies
   - Credentials/certifications
   - Statistics

6. **PPC Strategy Opportunities**
   - Keyword themes
   - Audience targeting
   - Messaging angles
   - Conversion suggestions

Return your analysis as a JSON object with this structure:
{
  "metadata": {
    "url": "${fullUrl}",
    "companyName": "extracted company name",
    "analyzedDate": "${new Date().toISOString().split('T')[0]}",
    "reportType": "Business Clarity Report"
  },
  "sections": {
    "existentialPurpose": {
      "title": "Why [Company] Exists",
      "content": "paragraph overview (2-3 sentences)",
      "keyPoints": ["array of 3-5 key insights"]
    },
    "targetMarket": {
      "title": "Who [Company] Serves",
      "content": "paragraph overview",
      "keyPoints": ["array of 3-5 key insights"]
    },
    "offerings": {
      "title": "What [Company] Does",
      "content": "paragraph overview",
      "keyPoints": ["array of 3-5 key insights"]
    },
    "differentiation": {
      "title": "Unique Selling Points",
      "content": "paragraph overview",
      "keyPoints": ["array of 3-5 key insights"]
    },
    "trustSignals": {
      "title": "Proof & Credibility",
      "content": "paragraph overview",
      "keyPoints": ["array of 3-5 key insights"]
    },
    "ppcStrategy": {
      "title": "PPC Strategy Opportunities",
      "content": "paragraph overview",
      "keyPoints": ["array of 3-5 key insights"]
    }
  }
}

Be specific and use actual details from the website. If information is missing, note gaps professionally.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    })

    // Extract text response
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON response
    let reportData: any
    try {
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '')
      }
      reportData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('[Business Clarity Report] JSON parse error:', parseError)
      console.error('[Business Clarity Report] Raw response:', textContent.text)
      throw new Error('Failed to parse Claude response as JSON')
    }

    // Phase 3: Generate PDF
    console.log('[Business Clarity Report] Phase 3: Generating PDF...')
    let pdfUrl: string | null = null

    try {
      const pdfBuffer = await generateBusinessClarityPDF(reportData)

      // Save PDF to public directory
      const companySlug = (reportData.metadata.companyName || new URL(fullUrl).hostname)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const timestamp = Date.now()
      const pdfFilename = `business-clarity-report-${companySlug}-${timestamp}.pdf`
      const pdfPath = join(process.cwd(), 'public', 'reports', pdfFilename)

      await writeFile(pdfPath, pdfBuffer)
      pdfUrl = `/reports/${pdfFilename}`

      console.log('[Business Clarity Report] PDF generated successfully:', pdfFilename)
    } catch (error) {
      console.error('[Business Clarity Report] PDF generation failed:', error)
      // Continue even if PDF fails
    }

    // Phase 4: Generate Google Slides
    console.log('[Business Clarity Report] Phase 4: Generating Google Slides...')
    let slideUrl: string | null = null
    let driveFileId: string | null = null
    let driveFolderId: string | null = null

    try {
      const slidesResult = await generateBusinessClaritySlides(reportData)
      slideUrl = slidesResult.presentationUrl
      driveFileId = slidesResult.driveFileId
      driveFolderId = slidesResult.driveFolderId || null

      console.log('[Business Clarity Report] Google Slides generated successfully:', slidesResult.presentationId)
      if (driveFolderId) {
        console.log('[Business Clarity Report] Saved to Google Drive folder:', driveFolderId)
      }
    } catch (error) {
      console.error('[Business Clarity Report] Google Slides generation failed:')
      console.error('[Business Clarity Report] Error name:', error instanceof Error ? error.name : 'Unknown')
      console.error('[Business Clarity Report] Error message:', error instanceof Error ? error.message : String(error))
      console.error('[Business Clarity Report] Full error:', error)
      // Continue even if Slides fails
    }

    console.log('[Business Clarity Report] Report generation complete')

    return NextResponse.json({
      success: true,
      reportData,
      slideUrl,
      pdfUrl,
      driveFileId,
      driveFolderId,
      message: 'Report generated successfully',
    })
  } catch (error) {
    console.error('[Business Clarity Report] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report',
      },
      { status: 500 }
    )
  }
}