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
} from '@/lib/google-ads/client'
import { sendEmail } from '@/lib/email/service'
import { generateEmailTemplate } from '@/lib/email/template'

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
        // This would call the keyword research API endpoint
        // For now, return a message that this feature requires the keyword research tool
        return {
          success: false,
          message: 'Keyword research is available through the Automations > Keyword Research page',
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

    // System prompt to guide Claude's behavior
    const systemPrompt = `You are a helpful Google Ads assistant for BeechPPC. You help users analyze their Google Ads account data, generate reports, and answer questions about their advertising performance.

When users ask questions:
- Use the available functions to fetch real data from their Google Ads accounts
- Format responses in a clear, professional manner
- Include specific numbers and metrics when available
- Provide actionable insights and recommendations
- Be concise but thorough

Available data includes:
- Account information and metrics (spend, conversions, clicks, impressions, CPC, cost per conversion)
- Conversion tracking status
- Disapproved ads and policy violations
- Report generation and emailing

Current date: ${new Date().toLocaleDateString()}

When referring to dates:
- "Yesterday" means the most recent complete day
- "This week" means the last 7 days
- "Last week" means 7-14 days ago

Always be helpful and proactive in suggesting next steps or additional analysis.`

    // Initial request to Claude with function calling
    let response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      tools: CHAT_FUNCTIONS,
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
        toolUseBlock.input
      )

      console.log('Function result:', JSON.stringify(functionResult, null, 2))

      // Send the result back to Claude
      response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        tools: CHAT_FUNCTIONS,
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
