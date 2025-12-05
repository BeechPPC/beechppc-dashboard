---
name: Building Google Ads GAQL Queries
description: Constructs Google Ads Query Language (GAQL) queries with proper syntax, field selection, and filtering. Use when building custom Google Ads reports, exploring available fields, or troubleshooting GAQL syntax.
allowed-tools: mcp__google-ads__get_gaql_doc, mcp__google-ads__get_reporting_view_doc, mcp__google-ads__execute_gaql
---

# Building Google Ads GAQL Queries

## Instructions

When building GAQL queries:

1. **Get documentation** if needed:
   - `mcp__google-ads__get_gaql_doc` for GAQL syntax guide
   - `mcp__google-ads__get_reporting_view_doc` for available fields by resource

2. **Basic query structure**:
   ```sql
   SELECT
     resource.field1,
     resource.field2,
     metrics.metric1
   FROM resource_name
   WHERE conditions
   ORDER BY field
   LIMIT number
   ```

3. **Common resources**:
   - `campaign` - Campaign data
   - `ad_group` - Ad group data
   - `ad_group_ad` - Ad-level data
   - `keyword_view` - Keyword performance
   - `customer` - Account information
   - `customer_client` - Client accounts (for MCCs)

4. **Date filtering**:
   - Use `segments.date` for time-series data
   - Predefined ranges: `LAST_7_DAYS`, `LAST_30_DAYS`, `THIS_MONTH`, `LAST_MONTH`
   - Custom range: `BETWEEN '2024-01-01' AND '2024-01-31'`

5. **Common field patterns**:
   - Resource fields: `campaign.name`, `ad_group.status`
   - Metrics: `metrics.clicks`, `metrics.cost_micros`
   - Segments: `segments.date`, `segments.device`

## Best Practices

- Always include the resource ID field (e.g., `campaign.id`)
- Use segments when querying metrics by dimension
- Remember cost is in micros (divide by 1,000,000)
- Percentages are decimals (multiply by 100 for display)
- Filter inactive items: `WHERE campaign.status = 'ENABLED'`

## Common Query Templates

**Campaign overview**:
```sql
SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
```

**Keyword performance**:
```sql
SELECT campaign.name, ad_group.name, ad_group_criterion.keyword.text, metrics.clicks, metrics.cost_micros
FROM keyword_view
WHERE segments.date DURING LAST_7_DAYS
```

**Performance by device**:
```sql
SELECT segments.device, metrics.clicks, metrics.impressions, metrics.ctr
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
```

## Troubleshooting

- **Field not compatible**: Check if fields can be used together with `get_reporting_view_doc`
- **Syntax error**: Verify SQL-like syntax (SELECT, FROM, WHERE order)
- **No results**: Check date range and status filters
- **Wrong data type**: Remember micros for money, decimals for percentages

## Reference

Use `mcp__google-ads__get_reporting_view_doc` with a specific view name (e.g., "campaign", "keyword_view") to see all available fields and their metadata.
