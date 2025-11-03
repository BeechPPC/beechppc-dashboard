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
        query: {
          type: 'string',
          description: 'The keyword or phrase to search for',
        },
        customerId: {
          type: 'string',
          description: 'The Google Ads customer account ID to use for the search',
        },
      },
      required: ['query', 'customerId'],
    },
  },
]
