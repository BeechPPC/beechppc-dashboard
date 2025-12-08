import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CHAT_FUNCTIONS } from '@/lib/chat/functions'
import { requireAuth } from '@/lib/auth/helpers'
import type { ChatRequest } from '@/lib/chat/types'
import {
  getCustomerAccounts,
  getAccountMetrics,
  getConversionActions,
  getDisapprovedAds,
  getMccReportData,
  getCampaignPerformance,
  getKeywordPerformance,
} from '@/lib/google-ads/client'
import { sendEmail } from '@/lib/email/service'
import { generateEmailTemplate } from '@/lib/email/template'
import { fetchWebsiteContent } from '@/lib/web/fetcher'
import { readFileSync } from 'fs'
import { join } from 'path'

// Initialize Anthropic client (lazy initialization)
let anthropic: Anthropic | null = null
function getAnthropicClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured. Please add your Anthropic API key to the .env file.'
      )
    }
    anthropic = new Anthropic({ apiKey })
  }
  return anthropic
}

/**
 * Load skill content from local files
 * This embeds skill instructions directly in the system prompt
 * (Alternative to Skills API which may not be available yet)
 * Handles both SKILL.md and skill.md file names
 */
function loadSkillContent(skillName: string): string | null {
  try {
    // Try SKILL.md first (uppercase), then skill.md (lowercase)
    let skillPath = join(process.cwd(), 'skills', skillName, 'SKILL.md')
    let content: string
    
    try {
      content = readFileSync(skillPath, 'utf-8')
    } catch {
      // Try lowercase version
      skillPath = join(process.cwd(), 'skills', skillName, 'skill.md')
      content = readFileSync(skillPath, 'utf-8')
    }
    
    // Remove YAML frontmatter (lines between --- and ---)
    const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '')
    return contentWithoutFrontmatter.trim()
  } catch {
    // Skill file not found or error reading - that's okay, just skip it
    return null
  }
}

/**
 * Get skill IDs from environment variables (for future Skills API support)
 * Currently, we embed skill content directly in system prompts
 */
function getSkillIds(): Array<{ id: string }> {
  const skillIds: Array<{ id: string }> = []
  
  // Add Google Ads Analysis skill if configured
  const googleAdsAnalysisSkillId = process.env.SKILL_GOOGLE_ADS_ANALYSIS
  if (googleAdsAnalysisSkillId) {
    skillIds.push({ id: googleAdsAnalysisSkillId })
  }
  
  // Add more skills here as you create them
  // const reportGenerationSkillId = process.env.SKILL_REPORT_GENERATION
  // if (reportGenerationSkillId) {
  //   skillIds.push({ id: reportGenerationSkillId })
  // }
  
  return skillIds
}

/**
 * Execute a function call from Claude
 */
async function executeFunctionCall(functionName: string, args: Record<string, unknown>): Promise<unknown> {
  console.log(`Executing function: ${functionName}`, args)

  try {
    switch (functionName) {
      case 'get_accounts': {
        const accounts = await getCustomerAccounts()
        return {
          success: true,
          data: accounts,
          message: `Found ${accounts.length} active accounts`,
        }
      }

      case 'get_account_metrics': {
        const customerId = args.customerId as string
        const dateFrom = args.dateFrom as string | undefined
        const dateTo = args.dateTo as string | undefined
        const comparisonDateFrom = args.comparisonDateFrom as string | undefined
        const comparisonDateTo = args.comparisonDateTo as string | undefined

        // Get current period metrics
        const metrics = await getAccountMetrics(
          customerId,
          'YESTERDAY',
          dateFrom,
          dateTo
        )

        // Get comparison period metrics if dates provided
        let comparisonMetrics = null
        if (comparisonDateFrom && comparisonDateTo) {
          comparisonMetrics = await getAccountMetrics(
            customerId,
            'LAST_7_DAYS',
            comparisonDateFrom,
            comparisonDateTo
          )
        }

        if (!metrics) {
          return {
            success: false,
            message: `No data found for account ${customerId}`,
          }
        }

        return {
          success: true,
          data: {
            current: metrics,
            comparison: comparisonMetrics,
          },
          message: 'Metrics retrieved successfully',
        }
      }

      case 'get_conversion_actions': {
        const customerId = args.customerId as string
        const conversions = await getConversionActions(customerId)
        return {
          success: true,
          data: conversions,
          message: `Found ${conversions.length} conversion actions`,
        }
      }

      case 'get_disapproved_ads': {
        const customerId = args.customerId as string
        const disapprovedAds = await getDisapprovedAds(customerId)
        return {
          success: true,
          data: disapprovedAds,
          message: `Found ${disapprovedAds.length} disapproved ads`,
        }
      }

      case 'generate_report': {
        const accountIds = (args.accountIds as string[]) || []
        const templateType = (args.templateType as string) || 'daily'
        const recipients = args.recipients as string[]
        const dateFrom = args.dateFrom as string | undefined
        const dateTo = args.dateTo as string | undefined

        if (!recipients || recipients.length === 0) {
          return {
            success: false,
            message: 'No email recipients specified',
          }
        }

        // Get report data
        const reportData = await getMccReportData(dateFrom, dateTo)

        // Filter to specific accounts if requested
        const filteredData =
          accountIds.length > 0
            ? reportData.filter((acc) => accountIds.includes(acc.id))
            : reportData

        if (filteredData.length === 0) {
          return {
            success: false,
            message: 'No data found for the specified accounts',
          }
        }

        // Format email
        const reportDate = new Date()
        const emailHtml = generateEmailTemplate(filteredData, reportDate)

        // Send email to all recipients
        const emailPromises = recipients.map((recipient: string) =>
          sendEmail({
            to: recipient,
            subject: `Google Ads ${templateType === 'daily' ? 'Daily' : 'Performance'} Report - ${new Date().toLocaleDateString()}`,
            html: emailHtml,
          })
        )

        await Promise.all(emailPromises)

        return {
          success: true,
          data: {
            accountCount: filteredData.length,
            recipients: recipients,
          },
          message: `Report sent successfully to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`,
        }
      }

      case 'search_keywords': {
        const seedKeywords = args.seedKeywords as string[]
        const landingPageUrl = args.landingPageUrl as string | undefined

        try {
          // Call the keyword research API endpoint
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/keyword-research`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              seedKeywords,
              landingPageUrl,
              location: '2036', // Australia
              language: '1000', // English
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            return {
              success: false,
              message: `Keyword research error: ${data.error || 'Unknown error'}`,
            }
          }

          return {
            success: true,
            data: {
              keywords: data.keywords?.slice(0, 20) || [], // Limit to top 20 for chat
              groups: data.groups || [],
            },
            message: `Found ${data.keywords?.length || 0} keyword ideas organized into ${data.groups?.length || 0} themed groups`,
          }
        } catch (error) {
          return {
            success: false,
            message: `Keyword research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }
        }
      }

      case 'get_campaign_performance': {
        const customerId = args.customerId as string
        const dateRange = (args.dateRange as string) || 'LAST_7_DAYS'

        const campaigns = await getCampaignPerformance(customerId, dateRange)
        return {
          success: true,
          data: campaigns,
          message: `Retrieved performance data for ${campaigns.length} campaigns`,
        }
      }

      case 'get_keyword_performance': {
        const customerId = args.customerId as string
        const dateRange = (args.dateRange as string) || 'LAST_7_DAYS'
        const limit = (args.limit as number) || 50

        const keywords = await getKeywordPerformance(customerId, dateRange, limit)
        return {
          success: true,
          data: keywords,
          message: `Retrieved performance data for ${keywords.length} keywords`,
        }
      }

      case 'get_upcoming_meetings': {
        const days = (args.days as number) || 7
        const startDate = args.startDate as string | undefined
        const endDate = args.endDate as string | undefined

        try {
          // Call the meetings API endpoint
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
          const url = new URL(`${baseUrl}/api/meetings`)
          
          if (startDate && endDate) {
            const response = await fetch(`${baseUrl}/api/meetings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ startDate, endDate }),
            })
            const data = await response.json()
            
            if (!response.ok) {
              return {
                success: false,
                message: `Failed to fetch meetings: ${data.error || 'Unknown error'}`,
              }
            }

            return {
              success: true,
              data: data.meetings || [],
              message: `Found ${data.total || 0} meeting${data.total !== 1 ? 's' : ''} in the specified date range`,
            }
          } else {
            url.searchParams.set('days', days.toString())
            const response = await fetch(url.toString())
            const data = await response.json()

            if (!response.ok) {
              return {
                success: false,
                message: `Failed to fetch meetings: ${data.error || 'Unknown error'}`,
              }
            }

            return {
              success: true,
              data: data.meetings || [],
              message: `Found ${data.total || 0} upcoming meeting${data.total !== 1 ? 's' : ''} in the next ${days} day${days !== 1 ? 's' : ''}`,
            }
          }
        } catch (error) {
          return {
            success: false,
            message: `Error fetching meetings: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }
        }
      }

      case 'fetch_website_content': {
        const url = args.url as string

        if (!url || typeof url !== 'string') {
          return {
            success: false,
            message: 'URL is required and must be a string',
          }
        }

        try {
          const content = await fetchWebsiteContent(url)
          
          // Ensure all data is serializable
          const serializableContent = {
            url: String(content.url),
            title: String(content.title || ''),
            metaDescription: String(content.metaDescription || ''),
            headings: Array.isArray(content.headings) 
              ? content.headings.map(h => ({
                  level: Number(h.level) || 0,
                  text: String(h.text || ''),
                }))
              : [],
            paragraphs: Array.isArray(content.paragraphs)
              ? content.paragraphs.map(p => String(p || ''))
              : [],
            links: Array.isArray(content.links)
              ? content.links.map(l => ({
                  text: String(l.text || ''),
                  href: String(l.href || ''),
                }))
              : [],
            content: String(content.content || ''),
            error: content.error ? String(content.error) : undefined,
          }
          
          if (serializableContent.error) {
            return {
              success: false,
              message: `Failed to fetch website: ${serializableContent.error}`,
              error: serializableContent.error,
            }
          }

          return {
            success: true,
            data: serializableContent,
            message: `Successfully fetched content from ${serializableContent.url}. Found ${serializableContent.headings.length} headings, ${serializableContent.paragraphs.length} paragraphs, and ${serializableContent.links.length} links.`,
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error('Error in fetch_website_content:', error)
          return {
            success: false,
            message: `Error fetching website: ${errorMessage}`,
            error: errorMessage,
          }
        }
      }

      default:
        return {
          success: false,
          message: `Unknown function: ${functionName}`,
        }
    }
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error)
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
    }
  }
}

/**
 * Main chat endpoint - handles conversation with Claude using function calling
 */
export async function POST(request: NextRequest) {
  // Require authentication
  const userId = await requireAuth()
  if (userId instanceof NextResponse) return userId

  try {
    const { message, history = [] }: ChatRequest = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Initialize client early to catch API key errors
    let client: Anthropic
    try {
      client = getAnthropicClient()
    } catch (error) {
      console.error('Failed to initialize Anthropic client:', error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to initialize AI client',
        },
        { status: 500 }
      )
    }

    // Get skill IDs (optional - skills enhance but don't replace system prompts)
    const skills = getSkillIds()

    // Build conversation history for Claude
    // Filter and sanitize history to ensure proper message structure
    // Limit history to last 5 messages to avoid rate limit issues (30k tokens/min limit)
    // Only include simple text messages (tool_use/tool_result pairs are handled in the current request)
    const limitedHistory = Array.isArray(history) ? history.slice(-5) : [] // Only keep last 5 messages
    
    const messages: Anthropic.MessageParam[] = limitedHistory
      .filter((msg) => {
        // Only include messages with simple text content
        // The frontend stores only text, so we don't have tool_use blocks in history
        return msg && 
               typeof msg === 'object' && 
               msg.content && 
               typeof msg.content === 'string' && 
               msg.content.trim().length > 0 &&
               (msg.role === 'user' || msg.role === 'assistant')
      })
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content as string,
      }))
      .concat([
        {
          role: 'user' as const,
          content: message,
        },
      ])
    
    // Validate messages array
    if (messages.length === 0) {
      throw new Error('No valid messages to send')
    }

    // Load relevant skill content and embed in system prompt
    // (Skills API may not be available yet, so we embed content directly)
    // Only load skills that are likely needed based on the user's message to avoid rate limits
    const messageLower = message.toLowerCase()
    
    // Always load core Google Ads analysis (essential for dashboard)
    const skillsToLoad: string[] = ['google-ads-analysis']
    
    // Conditionally load other skills based on message content
    if (messageLower.includes('clarity report') || messageLower.includes('business clarity') || 
        messageLower.includes('analyze this business') || messageLower.includes('do a clarity')) {
      skillsToLoad.push('business-clarity-report')
    }
    
    if (messageLower.includes('audit') || messageLower.includes('review account')) {
      skillsToLoad.push('google-ads-audit')
    }
    
    if (messageLower.includes('csv') || messageLower.includes('spreadsheet') || messageLower.includes('export')) {
      skillsToLoad.push('csv-analyzer')
    }
    
    if (messageLower.includes('coach') || messageLower.includes('prioritize') || messageLower.includes('what should i do')) {
      skillsToLoad.push('ppc-coach')
    }
    
    if (messageLower.includes('campaign performance') || messageLower.includes('campaign metrics')) {
      skillsToLoad.push('google-ads-campaign-performance')
    }
    
    if (messageLower.includes('account info') || messageLower.includes('account information')) {
      skillsToLoad.push('google-ads-account-info')
    }
    
    // Only load google-ads skill if user is asking about specific queries or GAQL
    if (messageLower.includes('gaql') || messageLower.includes('query') || messageLower.includes('mcp')) {
      skillsToLoad.push('google-ads')
    }
    
    const loadedSkills: Array<{ name: string; content: string }> = []
    for (const skillName of skillsToLoad) {
      try {
        const content = loadSkillContent(skillName)
        if (content) {
          loadedSkills.push({ name: skillName, content })
        }
      } catch (error) {
        // Log but don't fail if a skill can't be loaded
        console.warn(`Failed to load skill ${skillName}:`, error)
      }
    }
    
    // System prompt to guide Claude's behavior
    // Note: Skills complement system prompts - use both for best results
    let systemPrompt = `You are a helpful Google Ads assistant for BeechPPC. You help users analyze their Google Ads account data, generate reports, and answer questions about their advertising performance.

IMPORTANT INSTRUCTIONS:
- Always use the available functions to fetch real data from their Google Ads accounts
- Format responses in a clear, professional manner with proper structure
- Include specific numbers and metrics when available
- Provide actionable insights and recommendations based on the data
- Be concise but thorough - don't overwhelm with data, highlight key findings
- When showing metrics, use tables or bullet points for clarity
- Proactively suggest next steps or additional analysis

AVAILABLE CAPABILITIES:
1. Account Management:
   - List all accounts with status and currency
   - Get account metrics with date ranges and comparisons

2. Campaign Analysis:
   - View campaign performance (budget, spend, conversions, CTR)
   - Identify best/worst performing campaigns
   - Monitor budget pacing

3. Keyword Insights:
   - Analyze keyword performance (quality score, CTR, conversions)
   - Find high-cost or low-performing keywords
   - Research new keyword opportunities

4. Quality Assurance:
   - Check conversion tracking status
   - Find disapproved ads and policy violations
   - Monitor last conversion dates

5. Reporting:
   - Generate and email performance reports
   - Create custom reports by account or date range

6. Calendar & Meetings:
   - View upcoming meetings from email calendar invites
   - Check meeting schedule for specific date ranges
   - Get meeting details including location, attendees, and times

7. Business Clarity Reports:
   - Generate comprehensive business analysis reports for new PPC prospects
   - Analyze websites to understand business purpose, target market, offerings, USPs, and credibility
   - Create professional Google Slides presentations and PDF reports
   - Use by saying "Do a clarity report on [URL]" or "Create a business clarity analysis for [URL]"

ANALYSIS GUIDELINES:
- When analyzing performance, always consider: ROAS/ROI, conversion rate, CPC trends
- Flag issues like: no recent conversions, high spend with low ROI, disapproved ads, low quality scores
- Provide context: compare to previous periods when possible
- Suggest specific actions: pause campaigns, adjust bids, add negative keywords, etc.

CURRENT CONTEXT:
- Today's date: ${new Date().toLocaleDateString()}
- Date range meanings:
  * "Yesterday" = most recent complete day
  * "This week" = last 7 days
  * "Last 7 days" = LAST_7_DAYS
  * "Last 30 days" = LAST_30_DAYS

TONE:
- Professional but friendly
- Data-driven and analytical
- Action-oriented with clear recommendations
- Transparent about limitations

Always be proactive in suggesting relevant follow-up questions or analysis the user might find valuable.`

    // Append skill content if available (limit total size to avoid rate limits)
    if (loadedSkills.length > 0) {
      systemPrompt += `\n\n## Additional Expertise and Guidelines\n\n`
      let totalSkillLength = 0
      const maxSkillLength = 15000 // Limit total skill content to ~15k chars to stay under token limits
      
      for (const skill of loadedSkills) {
        // Truncate skill content if needed to stay under limits
        let skillContent = skill.content
        const remainingSpace = maxSkillLength - totalSkillLength
        if (skillContent.length > remainingSpace && remainingSpace > 1000) {
          // Truncate but keep it meaningful
          skillContent = skillContent.substring(0, remainingSpace - 100) + '\n\n[... content truncated to stay within token limits ...]'
        }
        
        if (remainingSpace > 1000) {
          // Format skill name: replace hyphens with spaces and capitalize words
          const formattedName = skill.name
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase())
          systemPrompt += `### ${formattedName}\n\n${skillContent}\n\n`
          totalSkillLength += skillContent.length
        } else {
          // Skip remaining skills if we're out of space
          break
        }
      }
    }

    // Initial request to Claude with function calling and skills
    // Validate system prompt before sending
    if (!systemPrompt || systemPrompt.trim().length === 0) {
      throw new Error('System prompt is empty')
    }
    
    // Log system prompt size for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`System prompt size: ${systemPrompt.length} characters`)
      console.log(`Loaded ${loadedSkills.length} skills`)
      console.log(`Messages count: ${messages.length}`)
    }
    
    let response
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        tools: CHAT_FUNCTIONS,
        ...(skills.length > 0 && { skills }), // Only include skills if configured
        messages,
      })
    } catch (apiError) {
      console.error('Anthropic API error:', apiError)
      // Re-throw with more context
      if (apiError instanceof Error) {
        throw new Error(`Anthropic API error: ${apiError.message}`)
      }
      throw apiError
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Claude response received, stop reason:', response.stop_reason)
    }

    // Handle function calling loop
    let continueLoop = true
    let iterationCount = 0
    const maxIterations = 10 // Prevent infinite loops

    while (continueLoop && iterationCount < maxIterations) {
      iterationCount++

      // Find ALL tool_use blocks in the response (Claude can make multiple calls)
      const toolUseBlocks: Anthropic.ToolUseBlock[] = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )

      if (toolUseBlocks.length === 0) {
        // No more tool calls, we're done
        continueLoop = false
        break
      }

      // Execute all tool calls in parallel
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUseBlock) => {
          try {
            const functionResult = await executeFunctionCall(
              toolUseBlock.name,
              toolUseBlock.input as Record<string, unknown>
            )
            
            // Safely stringify the result
            let resultJson: string
            try {
              resultJson = JSON.stringify(functionResult, null, 2)
              console.log(`Function ${toolUseBlock.name} result:`, resultJson)
            } catch (jsonError) {
              console.error(`Error stringifying result for ${toolUseBlock.name}:`, jsonError)
              // If stringification fails, create a safe error response
              resultJson = JSON.stringify({
                success: false,
                error: 'Failed to serialize function result',
                message: 'The function returned data that could not be serialized',
              })
            }
            
            return {
              type: 'tool_result' as const,
              tool_use_id: toolUseBlock.id,
              content: resultJson,
            }
          } catch (error) {
            console.error(`Error executing ${toolUseBlock.name}:`, error)
            try {
              return {
                type: 'tool_result' as const,
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : 'Unknown error occurred',
                }),
              }
            } catch {
              // Last resort - return a minimal error
              return {
                type: 'tool_result' as const,
                tool_use_id: toolUseBlock.id,
                content: '{"success":false,"error":"Failed to process error response"}',
              }
            }
          }
        })
      )

      // Send all results back to Claude in a single message
      try {
        response = await client.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 4096,
          system: systemPrompt,
          tools: CHAT_FUNCTIONS,
          ...(skills.length > 0 && { skills }), // Include skills in follow-up calls
          messages: [
            ...messages,
            {
              role: 'assistant',
              content: response.content,
            },
            {
              role: 'user',
              content: toolResults,
            },
          ],
        })
      } catch (apiError) {
        console.error('Anthropic API error in follow-up call:', apiError)
        throw apiError
      }

      console.log('Claude follow-up response:', JSON.stringify(response, null, 2))
    }

    // Extract the final text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    )

    if (!textBlock) {
      return NextResponse.json(
        { success: false, error: 'No response generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: textBlock.text,
      stopReason: response.stop_reason,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Ensure we always return valid JSON
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Non-Error object:', JSON.stringify(error, null, 2))
    }
    
    try {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
        },
        { status: 500 }
      )
    } catch (jsonError) {
      // Last resort - return a plain text error if JSON fails
      console.error('Failed to create JSON response:', jsonError)
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'An unexpected error occurred',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }
}
