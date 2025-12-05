/**
 * Claude Function Definitions
 * Defines the tools/functions that Claude can call
 */

import type { FunctionTool } from './types'

export const CHAT_FUNCTIONS: FunctionTool[] = [
  {
    name: 'get_accounts',
    description:
      'Get a list of all Google Ads customer accounts under the MCC. Returns account IDs, names, status, and currency.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_account_metrics',
    description:
      'Get performance metrics for a specific Google Ads account. Returns cost, conversions, clicks, impressions, avg CPC, and cost per conversion. Can optionally compare against a previous period.',
    input_schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'The Google Ads customer account ID (without dashes)',
        },
        dateFrom: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional, defaults to yesterday)',
        },
        dateTo: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional, defaults to yesterday)',
        },
        comparisonDateFrom: {
          type: 'string',
          description: 'Comparison period start date in YYYY-MM-DD format (optional)',
        },
        comparisonDateTo: {
          type: 'string',
          description: 'Comparison period end date in YYYY-MM-DD format (optional)',
        },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'get_conversion_actions',
    description:
      'Get all conversion actions for a Google Ads account, including the last conversion date and days since last conversion. Useful for checking if conversion tracking is working.',
    input_schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'The Google Ads customer account ID (without dashes)',
        },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'get_disapproved_ads',
    description:
      'Get all disapproved ads for a Google Ads account, including the disapproval reasons and policy violations. Useful for identifying ads that need attention.',
    input_schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'The Google Ads customer account ID (without dashes)',
        },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'generate_report',
    description:
      'Generate and send a performance report via email. Can create daily reports or use specific templates (zero conversion search terms, best performing ads, best performing keywords). The report will be sent to the specified email recipients.',
    input_schema: {
      type: 'object',
      properties: {
        accountIds: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Array of Google Ads account IDs to include in the report. Use empty array [] for all accounts.',
        },
        templateType: {
          type: 'string',
          enum: ['daily', 'zero_conversion', 'best_ads', 'best_keywords'],
          description:
            'Type of report template. Options: daily (standard performance), zero_conversion (search terms with no conversions), best_ads (top performing ads by CTR), best_keywords (top keywords by conversions)',
        },
        recipients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of email addresses to send the report to',
        },
        dateFrom: {
          type: 'string',
          description: 'Report start date in YYYY-MM-DD format (optional, defaults to yesterday)',
        },
        dateTo: {
          type: 'string',
          description: 'Report end date in YYYY-MM-DD format (optional, defaults to yesterday)',
        },
      },
      required: ['recipients'],
    },
  },
  {
    name: 'search_keywords',
    description:
      'Search for keyword ideas using Google Ads Keyword Planner and analyze them with AI. Returns keyword suggestions with search volume, competition, and AI-generated thematic groups.',
    input_schema: {
      type: 'object',
      properties: {
        seedKeywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of seed keywords to generate ideas from',
        },
        landingPageUrl: {
          type: 'string',
          description: 'Optional landing page URL to extract keyword ideas from',
        },
      },
      required: ['seedKeywords'],
    },
  },
  {
    name: 'get_campaign_performance',
    description:
      'Get detailed performance metrics for all campaigns in a Google Ads account. Returns campaign-level data including budget, spend, conversions, CTR, and conversion rate. Useful for identifying best/worst performing campaigns.',
    input_schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'The Google Ads customer account ID (without dashes)',
        },
        dateRange: {
          type: 'string',
          enum: ['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_14_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH'],
          description: 'Date range for the metrics (default: LAST_7_DAYS)',
        },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'get_keyword_performance',
    description:
      'Get detailed performance metrics for keywords in a Google Ads account. Returns keyword-level data including match type, quality score, spend, conversions, and CTR. Useful for identifying high-performing or wasteful keywords.',
    input_schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'The Google Ads customer account ID (without dashes)',
        },
        dateRange: {
          type: 'string',
          enum: ['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_14_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH'],
          description: 'Date range for the metrics (default: LAST_7_DAYS)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of keywords to return (default: 50)',
        },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'get_upcoming_meetings',
    description:
      'Get upcoming meetings and calendar events extracted from email. Returns meeting details including title, start/end time, location, organizer, and attendees. Useful for checking what meetings are scheduled.',
    input_schema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days ahead to look for meetings (default: 7)',
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional, for custom date range)',
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional, for custom date range)',
        },
      },
      required: [],
    },
  },
  {
    name: 'fetch_website_content',
    description:
      'Fetch and parse website content from a URL. Returns structured data including title, meta description, headings, paragraphs, links, and full text content. Useful for analyzing business websites, creating clarity reports, or extracting information from web pages.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch. Can include or omit http:// or https:// protocol.',
        },
      },
      required: ['url'],
    },
  },
]
