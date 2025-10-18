/**
 * Report Template Definitions
 * Pre-configured report templates for common reporting needs
 */

export interface ReportTemplate {
  id: string
  name: string
  description: string
  dateRange: string
  type: 'SEARCH_TERMS' | 'ADS' | 'KEYWORDS'
  metrics: string[]
  sorting?: {
    metric: string
    order: 'ASC' | 'DESC'
  }
  filters?: {
    minClicks?: number
    minImpressions?: number
    minConversions?: number
    conversions?: number
  }
  limit?: number
}

export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  ZERO_CONVERSION_SEARCH_TERMS: {
    id: 'zero-conversion-search-terms',
    name: 'Search Terms with Zero Conversions (Last 14 Days)',
    description: 'Identifies search terms that received clicks but generated no conversions in the last 14 days',
    dateRange: 'LAST_14_DAYS',
    type: 'SEARCH_TERMS',
    metrics: ['impressions', 'clicks', 'cost', 'conversions', 'ctr'],
    filters: {
      minClicks: 1,
      conversions: 0,
    },
  },
  BEST_PERFORMING_ADS_CTR: {
    id: 'best-performing-ads-ctr',
    name: 'Best Performing Ads by CTR (Last 14 Days)',
    description: 'Top performing ads ranked by click-through rate over the last 14 days',
    dateRange: 'LAST_14_DAYS',
    type: 'ADS',
    metrics: ['impressions', 'clicks', 'cost', 'conversions', 'ctr'],
    sorting: {
      metric: 'ctr',
      order: 'DESC',
    },
    filters: {
      minImpressions: 100,
    },
    limit: 20,
  },
  BEST_PERFORMING_KEYWORDS_CONVERSION: {
    id: 'best-performing-keywords-conversion',
    name: 'Best Performing Keywords by Conversions (Last 14 Days)',
    description: 'Top performing keywords ranked by total conversions over the last 14 days',
    dateRange: 'LAST_14_DAYS',
    type: 'KEYWORDS',
    metrics: ['impressions', 'clicks', 'cost', 'conversions', 'ctr', 'cost_per_conversion'],
    sorting: {
      metric: 'conversions',
      order: 'DESC',
    },
    filters: {
      minConversions: 1,
    },
    limit: 20,
  },
}

/**
 * Get a report template by ID
 */
export function getTemplateById(templateId: string): ReportTemplate | null {
  return Object.values(REPORT_TEMPLATES).find(t => t.id === templateId) || null
}

/**
 * Get all available report templates
 */
export function getAllTemplates(): ReportTemplate[] {
  return Object.values(REPORT_TEMPLATES)
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: 'SEARCH_TERMS' | 'ADS' | 'KEYWORDS'): ReportTemplate[] {
  return Object.values(REPORT_TEMPLATES).filter(t => t.type === type)
}
