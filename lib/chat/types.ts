/**
 * Chat Types and Interfaces
 * Defines the structure for chat messages and function calling
 */

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  functionCalls?: FunctionCall[]
}

export interface FunctionCall {
  name: string
  arguments: Record<string, unknown>
  result?: unknown
  status?: 'pending' | 'success' | 'error'
}

export interface ChatRequest {
  message: string
  history?: ChatMessage[]
}

export interface ChatResponse {
  message: string
  functionCalls?: FunctionCall[]
}

// Function tool definitions for Claude
export interface FunctionTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}

// Supported function names
export type FunctionName =
  | 'get_accounts'
  | 'get_account_metrics'
  | 'get_conversion_actions'
  | 'get_disapproved_ads'
  | 'generate_report'
  | 'search_keywords'

// Function arguments types
export interface GetAccountMetricsArgs {
  customerId: string
  dateFrom?: string
  dateTo?: string
  comparisonDateFrom?: string
  comparisonDateTo?: string
}

export interface GetConversionActionsArgs {
  customerId: string
}

export interface GetDisapprovedAdsArgs {
  customerId: string
}

export interface GenerateReportArgs {
  accountIds: string[]
  templateType?: 'daily' | 'zero_conversion' | 'best_ads' | 'best_keywords'
  recipients: string[]
  dateFrom?: string
  dateTo?: string
}

export interface SearchKeywordsArgs {
  query: string
  customerId: string
}
