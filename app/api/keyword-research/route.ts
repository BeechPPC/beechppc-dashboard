import { NextRequest, NextResponse } from 'next/server'
import { GoogleAdsApi } from 'google-ads-api'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Google Ads API client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
})

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface KeywordData {
  keyword: string
  avgMonthlySearches: number
  competition: string
  competitionIndex: number
  lowTopOfPageBid: number
  highTopOfPageBid: number
  theme?: string
  searchIntent?: string
  aiInsights?: string
}

interface KeywordGroup {
  theme: string
  keywords: KeywordData[]
  totalSearchVolume: number
}

export async function POST(request: NextRequest) {
  try {
    const { seedKeywords, landingPageUrl, location = '2036', language = '1000' } = await request.json()

    if ((!seedKeywords || seedKeywords.length === 0) && !landingPageUrl) {
      return NextResponse.json(
        { error: 'Please provide seed keywords or a landing page URL' },
        { status: 400 }
      )
    }

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
    })

    // Prepare the keyword plan idea service request
    const keywordPlanIdeas: Record<string, unknown> = {
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
      language: `languageConstants/${language}`,
      geo_target_constants: [`geoTargetConstants/${location}`],
      include_adult_keywords: false,
    }

    // Add seed keywords if provided
    if (seedKeywords && seedKeywords.length > 0) {
      keywordPlanIdeas.keyword_seed = {
        keywords: seedKeywords,
      }
    }

    // Add URL seed if provided
    if (landingPageUrl) {
      keywordPlanIdeas.url_seed = {
        url: landingPageUrl,
      }
    }

    // Generate keyword ideas using Google Ads Keyword Planner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await customer.keywordPlanIdeas.generateKeywordIdeas(keywordPlanIdeas as any)

    if (!response.results || response.results.length === 0) {
      return NextResponse.json({ keywords: [], groups: [] })
    }

    // Process keyword ideas
    const keywords: KeywordData[] = response.results
      .map((idea) => {
        const keywordText = idea.text || ''
        const metrics = idea.keyword_idea_metrics || {}

        // Handle monthly search volumes (can be a range or exact number)
        let avgMonthlySearches = 0
        if (metrics.avg_monthly_searches) {
          avgMonthlySearches = Number(metrics.avg_monthly_searches)
        }

        // Get competition level and index
        const competition = String(metrics.competition || 'UNSPECIFIED').toUpperCase()
        const competitionIndex = Number(metrics.competition_index || 0)

        // Get bid estimates (in micros, need to convert to dollars)
        const lowTopOfPageBid = Number(metrics.low_top_of_page_bid_micros || 0) / 1_000_000
        const highTopOfPageBid = Number(metrics.high_top_of_page_bid_micros || 0) / 1_000_000

        return {
          keyword: keywordText,
          avgMonthlySearches,
          competition,
          competitionIndex,
          lowTopOfPageBid,
          highTopOfPageBid,
        }
      })
      .filter((k: KeywordData) => k.keyword && k.avgMonthlySearches > 0)
      .sort((a: KeywordData, b: KeywordData) => b.avgMonthlySearches - a.avgMonthlySearches)

    // Use Claude AI to analyze and group keywords
    const { keywords: enrichedKeywords, groups } = await analyzeKeywordsWithClaude(keywords)

    return NextResponse.json({
      keywords: enrichedKeywords,
      groups,
    })

  } catch (error) {
    console.error('Keyword research API error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate keyword ideas'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

async function analyzeKeywordsWithClaude(keywords: KeywordData[]): Promise<{ keywords: KeywordData[], groups: KeywordGroup[] }> {
  try {
    // Limit to top 100 keywords for AI analysis to stay within token limits
    const topKeywords = keywords.slice(0, 100)

    const keywordList = topKeywords.map(k => k.keyword).join('\n')

    const prompt = `Analyze these keywords for a Google Ads campaign and provide insights:

Keywords:
${keywordList}

Please provide:
1. Group these keywords into 5-10 thematic categories (e.g., "Brand Terms", "Product Features", "Competitor Comparisons", etc.)
2. For each keyword, identify the search intent (Informational, Navigational, Commercial, or Transactional)
3. Provide any strategic insights for organizing these into ad groups

Return your response as a valid JSON object with this structure:
{
  "groups": [
    {
      "theme": "Theme name",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "intents": {
    "keyword1": "Transactional",
    "keyword2": "Informational"
  },
  "insights": "Overall strategic recommendations for campaign structure and keyword usage"
}

Respond ONLY with the JSON object, no other text.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response')
    }

    // Parse Claude's response
    const aiResponse = JSON.parse(textContent.text)

    // Enrich keywords with AI insights
    const enrichedKeywords = keywords.map(keyword => {
      const searchIntent = aiResponse.intents?.[keyword.keyword] || undefined

      // Find which theme this keyword belongs to
      let theme: string | undefined
      for (const group of aiResponse.groups || []) {
        if (group.keywords.includes(keyword.keyword)) {
          theme = group.theme
          break
        }
      }

      return {
        ...keyword,
        searchIntent,
        theme,
        aiInsights: aiResponse.insights
      }
    })

    // Create grouped results
    interface AIGroup {
      theme: string
      keywords: string[]
    }

    const groups: KeywordGroup[] = (aiResponse.groups || []).map((group: AIGroup) => {
      const groupKeywords = enrichedKeywords.filter(k => k.theme === group.theme)
      const totalSearchVolume = groupKeywords.reduce((sum, k) => sum + k.avgMonthlySearches, 0)

      return {
        theme: group.theme,
        keywords: groupKeywords,
        totalSearchVolume
      }
    }).filter((g: KeywordGroup) => g.keywords.length > 0)

    return { keywords: enrichedKeywords, groups }

  } catch (error) {
    console.error('Error analyzing keywords with Claude:', error)
    // Return keywords without AI enrichment if Claude analysis fails
    return { keywords, groups: [] }
  }
}
