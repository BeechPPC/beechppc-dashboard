import { NextRequest, NextResponse } from 'next/server'
import { GoogleAdsApi } from 'google-ads-api'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Google Ads API client
const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
})

// Initialize Anthropic client (lazy initialization)
let anthropic: Anthropic | null = null
function getAnthropicClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please add your Anthropic API key to the .env file.')
    }
    anthropic = new Anthropic({ apiKey })
  }
  return anthropic
}

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
    console.log('Keyword research API called')
    const { seedKeywords, landingPageUrl, location = '2036', language = '1000' } = await request.json()

    console.log('Request params:', { seedKeywords, landingPageUrl, location, language })

    if ((!seedKeywords || seedKeywords.length === 0) && !landingPageUrl) {
      return NextResponse.json(
        { error: 'Please provide seed keywords or a landing page URL' },
        { status: 400 }
      )
    }

    console.log('Initializing Google Ads customer...')
    // Use specific account ID for Keyword Planner (not MCC)
    const keywordPlannerAccountId = '6469501976'

    const customer = client.Customer({
      customer_id: keywordPlannerAccountId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID!,
    })

    console.log('Customer initialized with account:', keywordPlannerAccountId)

    // Prepare the keyword plan idea service request
    const keywordPlanIdeas: Record<string, unknown> = {
      customer_id: keywordPlannerAccountId,
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
    console.log('Fetching keyword ideas from Google Ads API...')
    console.log('Request params:', JSON.stringify(keywordPlanIdeas, null, 2))

    let response
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response = await customer.keywordPlanIdeas.generateKeywordIdeas(keywordPlanIdeas as any)
      console.log('API call successful')
      console.log('Response type:', typeof response)
      console.log('Response keys:', Object.keys(response))
      console.log('Full response structure:', JSON.stringify(response, null, 2))
    } catch (apiError) {
      console.error('Google Ads API Error:', apiError)
      console.error('Error details:', JSON.stringify(apiError, null, 2))
      throw new Error(`Google Ads API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`)
    }

    // Handle response - it can be an array directly or an object with results property
    const results = Array.isArray(response) ? response : response.results

    console.log(`Received ${results?.length || 0} keyword ideas`)

    if (!results || results.length === 0) {
      console.log('No keyword ideas found')
      console.log('Response object:', JSON.stringify(response, null, 2))
      return NextResponse.json({
        keywords: [],
        groups: [],
        message: 'No keyword ideas found. This could be due to: 1) Very restrictive targeting 2) Account permissions 3) API quota limits'
      })
    }

    // Debug: Log first result to see structure
    console.log('First keyword idea sample:', JSON.stringify(results[0], null, 2))

    // Process keyword ideas
    const keywords: KeywordData[] = results
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

    console.log(`Processed ${results.length} raw results`)
    console.log(`After filtering: ${keywords.length} keywords with search volume > 0`)

    if (keywords.length === 0 && results.length > 0) {
      console.log('⚠️  WARNING: All keywords were filtered out!')
      console.log('Sample raw keyword data:')
      console.log('- Text:', results[0]?.text)
      console.log('- Metrics:', results[0]?.keyword_idea_metrics)
    }

    // Use Claude AI to analyze and group keywords
    console.log('Analyzing keywords with Claude AI...')
    const { keywords: enrichedKeywords, groups } = await analyzeKeywordsWithClaude(keywords)

    console.log(`Analysis complete. ${groups.length} groups created`)

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
    const client = getAnthropicClient()

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

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
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
