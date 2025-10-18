/**
 * Report Template Definitions
 * Pre-configured report templates for common reporting needs
 */

export const REPORT_TEMPLATES = {
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
      minImpressions: 100, // Only show ads with meaningful data
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
};

/**
 * Get a report template by ID
 * @param {string} templateId - The template ID
 * @returns {Object|null} The template configuration or null if not found
 */
export function getTemplateById(templateId) {
  return Object.values(REPORT_TEMPLATES).find(t => t.id === templateId) || null;
}

/**
 * Get all available report templates
 * @returns {Array} Array of all template configurations
 */
export function getAllTemplates() {
  return Object.values(REPORT_TEMPLATES);
}

/**
 * Get templates by type
 * @param {string} type - The report type (SEARCH_TERMS, ADS, KEYWORDS, etc.)
 * @returns {Array} Array of matching templates
 */
export function getTemplatesByType(type) {
  return Object.values(REPORT_TEMPLATES).filter(t => t.type === type);
}
