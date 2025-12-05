---
name: Analyzing Google Ads Campaign Performance
description: Retrieves and analyzes Google Ads campaign performance metrics including clicks, impressions, cost, conversions, and CTR. Use when analyzing campaign performance, comparing campaigns, or generating performance reports.
allowed-tools: mcp__google-ads__execute_gaql
---

# Analyzing Google Ads Campaign Performance

## Instructions

When analyzing campaign performance:

1. **Basic campaign performance query**:
   ```sql
   SELECT
     campaign.id,
     campaign.name,
     campaign.status,
     metrics.impressions,
     metrics.clicks,
     metrics.cost_micros,
     metrics.conversions,
     metrics.conversions_value,
     metrics.ctr,
     metrics.average_cpc
   FROM campaign
   WHERE segments.date DURING LAST_30_DAYS
   ```

2. **Convert cost_micros to currency**:
   - Divide by 1,000,000 to get actual cost
   - Example: 5000000 micros = $5.00

3. **Date range options**:
   - `LAST_7_DAYS`, `LAST_30_DAYS`, `THIS_MONTH`, `LAST_MONTH`
   - Custom: `BETWEEN '2024-01-01' AND '2024-01-31'`

4. **Performance by day**:
   ```sql
   SELECT
     segments.date,
     campaign.name,
     metrics.impressions,
     metrics.clicks,
     metrics.cost_micros
   FROM campaign
   WHERE segments.date DURING LAST_7_DAYS
   ORDER BY segments.date DESC
   ```

## Output Format

Present performance data in clear tables:

| Campaign | Status | Impressions | Clicks | Cost | Conv | CTR | Avg CPC |
|----------|--------|-------------|--------|------|------|-----|---------|

Always convert micros to readable currency amounts.

## Common Metrics

- **impressions**: Ad views
- **clicks**: Ad clicks
- **cost_micros**: Cost in micros (divide by 1M)
- **conversions**: Total conversions
- **conversions_value**: Conversion value in micros
- **ctr**: Click-through rate (as decimal, multiply by 100 for %)
- **average_cpc**: Avg cost per click in micros

## Common Use Cases

- "Show me campaign performance for the last 30 days"
- "Which campaigns are performing best?"
- "What's the cost and conversion data?"
- "Compare campaigns by CTR"
