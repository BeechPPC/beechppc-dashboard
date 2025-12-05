import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { CHAT_FUNCTIONS } from '@/lib/chat/functions'
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
 */
function loadSkillContent(skillName: string): string | null {
  try {
    const skillPath = join(process.cwd(), 'skills', skillName, 'SKILL.md')
    const content = readFileSync(skillPath, 'utf-8')
    // Remove YAML frontmatter (lines between --- and ---)
    const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '')
    return contentWithoutFrontmatter.trim()
  } catch (error) {
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
  try {
    const { message, history = [] }: ChatRequest = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    const client = getAnthropicClient()

    // Get skill IDs (optional - skills enhance but don't replace system prompts)
    const skills = getSkillIds()

    // Build conversation history for Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ]

    // Load skill content and embed in system prompt
    // (Skills API may not be available yet, so we embed content directly)
    const googleAdsAnalysisSkill = loadSkillContent('google-ads-analysis')
    
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

    // Append skill content if available
    if (googleAdsAnalysisSkill) {
      systemPrompt += `\n\n## Google Ads Analysis Guidelines\n\n${googleAdsAnalysisSkill}`
    }

    // Initial request to Claude with function calling and skills
    let response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      tools: CHAT_FUNCTIONS,
      ...(skills.length > 0 && { skills }), // Only include skills if configured
      messages,
    })

    console.log('Claude response:', JSON.stringify(response, null, 2))

    // Handle function calling loop
    let continueLoop = true
    let iterationCount = 0
    const maxIterations = 10 // Prevent infinite loops

    while (continueLoop && iterationCount < maxIterations) {
      iterationCount++

      // Check if Claude wants to use a tool
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )

      if (!toolUseBlock) {
        // No more tool calls, we're done
        continueLoop = false
        break
      }

      // Execute the function
      const functionResult = await executeFunctionCall(
        toolUseBlock.name,
        toolUseBlock.input as Record<string, unknown>
      )

      console.log('Function result:', JSON.stringify(functionResult, null, 2))

      // Send the result back to Claude (include skills in follow-up calls too)
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
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify(functionResult),
              },
            ],
          },
        ],
      })

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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
