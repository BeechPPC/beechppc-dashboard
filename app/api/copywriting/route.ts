import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/auth/helpers'
import type {
  CopyGenerationRequest,
  CopyGenerationResponse,
  CopyGenerationResult,
  GeneratedCopy,
  ResponsiveSearchAd,
} from '@/lib/copywriting/types'
import { buildSystemPrompt, buildCopyGenerationPrompt } from '@/lib/copywriting/prompts'
import {
  scoreCopy,
  checkPolicyViolations,
  detectCopyElements,
  validateRSA,
} from '@/lib/copywriting/validator'

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
 * POST /api/copywriting
 * Generate Google Ads copy using Claude
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const userId = await requireAuth()
    if (userId instanceof NextResponse) return userId

    // Parse request
    const body = (await request.json()) as CopyGenerationRequest

    // Validate required fields
    if (!body.productOrService || !body.targetAudience) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: productOrService and targetAudience',
        } as CopyGenerationResponse,
        { status: 400 }
      )
    }

    // Defaults
    const copyRequest: CopyGenerationRequest = {
      ...body,
      numberOfVariations: body.numberOfVariations || 8,
      copyType: body.copyType || 'responsive-search-ad',
      brandVoice: body.brandVoice || 'professional',
    }

    // Build prompts
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildCopyGenerationPrompt(copyRequest)

    // Call Claude
    const client = getAnthropicClient()

    console.log('[Copywriting] Generating copy with Claude...')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      temperature: 0.8, // Slightly higher for creative copy
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extract text response
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON response
    let aiResponse: any
    try {
      // Claude sometimes wraps JSON in markdown code blocks
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '')
      }

      aiResponse = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('[Copywriting] JSON parse error:', parseError)
      console.error('[Copywriting] Raw response:', textContent.text)
      throw new Error('Failed to parse AI response as JSON')
    }

    // Process and validate the generated copy
    const result = await processCopyResponse(aiResponse, copyRequest)

    return NextResponse.json({
      success: true,
      data: result,
    } as CopyGenerationResponse)
  } catch (error) {
    console.error('[Copywriting API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate copy',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      } as CopyGenerationResponse,
      { status: 500 }
    )
  }
}

/**
 * Process and enrich AI response with validation and scoring
 */
async function processCopyResponse(
  aiResponse: any,
  request: CopyGenerationRequest
): Promise<CopyGenerationResult> {
  const warnings: string[] = []

  // Process headlines - STRICTLY enforce character limits
  const headlines: GeneratedCopy[] = (aiResponse.headlines || [])
    .map((h: any, index: number) => {
      let text = typeof h === 'string' ? h : h.text

      // STRICT ENFORCEMENT: Truncate if over limit
      const maxLength = 30
      if (text.length > maxLength) {
        console.warn(`[Copywriting] Headline ${index + 1} was ${text.length} chars, truncating to ${maxLength}`)
        text = text.substring(0, maxLength)
      }

      const score = scoreCopy(text, {
        copyType: 'headline',
        keywords: request.keywords,
        targetAudience: request.targetAudience,
      })
      const elements = detectCopyElements(text)
      const policyViolations = checkPolicyViolations(text)

      // Add warnings for policy violations only (not length, since we fixed it)
      policyViolations.forEach((v) => {
        if (v.type === 'error') {
          warnings.push(`Headline ${index + 1}: ${v.message}`)
        }
      })

      return {
        id: `headline-${index + 1}`,
        text,
        type: 'headline',
        characterCount: text.length,
        isWithinLimit: true, // Always true after truncation
        score,
        framework: h.framework || request.copywritingFramework,
        emotionTrigger: h.emotionTrigger,
        ...elements,
      } as GeneratedCopy
    })

  // Process descriptions - STRICTLY enforce character limits
  const descriptions: GeneratedCopy[] = (aiResponse.descriptions || [])
    .map((d: any, index: number) => {
      let text = typeof d === 'string' ? d : d.text

      // STRICT ENFORCEMENT: Truncate if over limit
      const maxLength = 90
      if (text.length > maxLength) {
        console.warn(`[Copywriting] Description ${index + 1} was ${text.length} chars, truncating to ${maxLength}`)
        text = text.substring(0, maxLength)
      }

      const score = scoreCopy(text, {
        copyType: 'description',
        keywords: request.keywords,
        targetAudience: request.targetAudience,
      })
      const elements = detectCopyElements(text)
      const policyViolations = checkPolicyViolations(text)

      // Add warnings for policy violations only (not length, since we fixed it)
      policyViolations.forEach((v) => {
        if (v.type === 'error') {
          warnings.push(`Description ${index + 1}: ${v.message}`)
        }
      })

      return {
        id: `description-${index + 1}`,
        text,
        type: 'description',
        characterCount: text.length,
        isWithinLimit: true, // Always true after truncation
        score,
        framework: d.framework || request.copywritingFramework,
        emotionTrigger: d.emotionTrigger,
        ...elements,
      } as GeneratedCopy
    })

  // Build RSA if applicable
  let responsiveSearchAd: ResponsiveSearchAd | undefined

  if (request.copyType === 'responsive-search-ad' || (headlines.length >= 3 && descriptions.length >= 2)) {
    const rsaValidation = validateRSA(
      headlines.map((h) => h.text),
      descriptions.map((d) => d.text)
    )

    warnings.push(...rsaValidation.warnings)

    responsiveSearchAd = {
      headlines: headlines.slice(0, 15), // Max 15
      descriptions: descriptions.slice(0, 4), // Max 4
      finalUrl: request.landingPageUrl || 'https://example.com',
      strengthRating: calculateAdStrength(headlines.length, descriptions.length),
      diversityScore: calculateDiversityScore(headlines, descriptions),
    }
  }

  // Build final result
  const result: CopyGenerationResult = {
    headlines:
      request.copyType === 'headline' || request.copyType === 'responsive-search-ad'
        ? headlines
        : undefined,
    descriptions:
      request.copyType === 'description' || request.copyType === 'responsive-search-ad'
        ? descriptions
        : undefined,
    responsiveSearchAd,

    strategy: {
      framework: request.copywritingFramework || 'aida',
      rationale: aiResponse.strategy?.rationale || 'Strategic approach based on market analysis',
      keyMessages: aiResponse.strategy?.keyMessages || [],
      differentiators: aiResponse.strategy?.differentiators || [],
      emotionalHooks: aiResponse.strategy?.emotionalHooks || [],
      targetingInsights:
        aiResponse.strategy?.targetingInsights || 'Targeted to specified audience',
    },

    recommendations: aiResponse.recommendations || [],
    warnings,
    testingRecommendations: aiResponse.testingRecommendations || [],
  }

  return result
}

/**
 * Calculate ad strength rating (Google's metric)
 */
function calculateAdStrength(
  headlineCount: number,
  descriptionCount: number
): 'Poor' | 'Average' | 'Good' | 'Excellent' {
  if (headlineCount >= 10 && descriptionCount >= 3) return 'Excellent'
  if (headlineCount >= 7 && descriptionCount >= 3) return 'Good'
  if (headlineCount >= 5 && descriptionCount >= 2) return 'Average'
  return 'Poor'
}

/**
 * Calculate diversity score (how varied are the approaches)
 */
function calculateDiversityScore(headlines: GeneratedCopy[], descriptions: GeneratedCopy[]): number {
  let score = 0

  // Check for variety in approaches
  const hasQuestion = headlines.some((h) => h.hasQuestion)
  const hasNumber = headlines.some((h) => h.hasNumber)
  const hasUrgency = headlines.some((h) => h.hasUrgency)
  const hasCTA = descriptions.some((d) => d.hasCTA)

  if (hasQuestion) score += 20
  if (hasNumber) score += 20
  if (hasUrgency) score += 20
  if (hasCTA) score += 20

  // Check length variety
  const headlineLengths = headlines.map((h) => h.characterCount)
  const lengthVariance = Math.max(...headlineLengths) - Math.min(...headlineLengths)
  if (lengthVariance > 15) score += 20

  return Math.min(100, score)
}