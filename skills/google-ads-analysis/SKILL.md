---
name: google-ads-analysis
description: Expert guidance for analyzing Google Ads account performance, identifying optimization opportunities, and making data-driven recommendations for BeechPPC clients
---

# Google Ads Analysis Skill

This skill provides comprehensive guidelines for analyzing Google Ads account data and providing actionable insights for BeechPPC clients.

## Analysis Framework

When analyzing Google Ads performance, always follow this structured approach:

### 1. ROAS/ROI Analysis

- **Target ROAS**: > 4:1 for most industries (e-commerce), > 2:1 for lead generation
- **Calculation**: Revenue / Cost
- **Red Flags**: 
  - ROAS < 2:1 requires immediate attention
  - ROAS < 1:1 indicates losing money
- **Context**: Consider industry benchmarks and account maturity

### 2. Conversion Rate Trends

- **Industry Averages**: 
  - E-commerce: 2-5%
  - Lead generation: 3-7%
  - B2B services: 1-3%
- **Monitoring**: Track week-over-week and month-over-month changes
- **Action Required**: Declines > 20% need investigation

### 3. Cost Per Click (CPC) Analysis

- **Benchmarking**: Compare to industry averages and historical data
- **Trend Analysis**: Identify sudden spikes (>30% increase)
- **Optimization**: High CPCs may indicate:
  - Low Quality Score
  - High competition
  - Poor keyword targeting

### 4. Quality Score Assessment

- **Excellent**: 8-10 (rare, indicates strong account health)
- **Good**: 7 (target for most accounts)
- **Average**: 5-6 (room for improvement)
- **Poor**: <5 (requires immediate attention)
- **Factors**: Ad relevance, expected CTR, landing page experience

## Red Flags to Identify

Always flag these issues immediately:

1. **No Conversions**: No conversions in last 7 days (check tracking first)
2. **High Spend, Low ROAS**: Spending >$100/day with ROAS < 1:1
3. **Disapproved Ads**: Any ads requiring policy review
4. **Low Quality Scores**: Average Quality Score < 5 across account
5. **Conversion Tracking Issues**: Last conversion > 30 days ago
6. **Budget Pacing Problems**: 
   - Spending too fast (exhausted by midday)
   - Spending too slow (<50% of daily budget used)
7. **High CPC Spikes**: Sudden increases >30% without explanation
8. **Low CTR**: <1% for Search campaigns, <0.5% for Display

## Recommended Actions by Issue

### Low ROAS (< 2:1)
1. Pause underperforming campaigns (ROAS < 1:1)
2. Adjust bids downward by 10-20%
3. Add negative keywords to exclude irrelevant traffic
4. Review and improve ad copy relevance
5. Check landing page quality and conversion optimization

### No Recent Conversions
1. Verify conversion tracking is working (check last conversion date)
2. Review landing pages for usability issues
3. Check if targeting is too broad or too narrow
4. Review ad copy for relevance to keywords
5. Consider adjusting bid strategy

### High CPC
1. Improve Quality Score (better ad relevance, landing pages)
2. Refine keyword targeting (remove broad match if too expensive)
3. Test new ad copy variations
4. Consider using bid adjustments for device/location
5. Review competitor activity

### Disapproved Ads
1. Review policy violation reasons immediately
2. Create compliant alternative ads
3. Update landing pages if needed
4. Resubmit for review
5. Document learnings to prevent future violations

### Low Quality Score
1. Improve ad relevance to keywords
2. Optimize landing pages (speed, mobile experience, relevance)
3. Improve expected CTR (better ad copy, more specific keywords)
4. Use more specific keyword match types
5. Remove underperforming keywords

## Analysis Output Structure

When presenting analysis to users, always follow this structure:

### 1. Executive Summary (2-3 key findings)
- Start with the most critical finding
- Include one positive highlight if available
- Mention any urgent actions needed

### 2. Detailed Metrics
- Present in clear tables or bullet points
- Include current period and comparison period when available
- Use formatting: **bold** for important numbers, *italics* for context

### 3. Period Comparisons
- Always compare to previous period when data available
- Calculate percentage changes
- Highlight significant changes (>20%)

### 4. Action Items (3-5 specific recommendations)
- Number each action item
- Be specific (e.g., "Pause Campaign X" not "Review campaigns")
- Prioritize by impact (highest impact first)
- Include timeline when relevant

## Industry Benchmarks Reference

Use these benchmarks for context (adjust by industry):

| Metric | Search | Display | Video |
|--------|--------|---------|-------|
| Average CTR | 2-5% | 0.5-2% | 0.5-1% |
| Average CPC | $1-5 | $0.50-2 | $0.10-1 |
| Conversion Rate | 2-5% | 1-3% | 1-2% |
| Quality Score | 7+ | N/A | N/A |

## Tone and Communication

- **Professional but friendly**: Use conversational but expert tone
- **Data-driven**: Always back recommendations with numbers
- **Action-oriented**: Every analysis should lead to specific actions
- **Transparent**: Acknowledge limitations and uncertainties
- **Proactive**: Suggest follow-up analysis or monitoring

## Example Analysis Output

```
## Executive Summary

Your account shows strong performance overall with a ROAS of 4.2:1, but Campaign X requires immediate attention with a ROAS of 0.8:1 and $150/day spend.

## Key Metrics (Last 7 Days)

| Account | Spend | Conversions | ROAS | CTR |
|---------|-------|-------------|------|-----|
| Account A | $500 | 25 | 4.2:1 | 3.2% |
| Account B | $300 | 12 | 3.8:1 | 2.8% |

**Comparison to Previous Period**: ROAS improved 15% week-over-week

## Action Items

1. **URGENT**: Pause Campaign X (Account A) - ROAS 0.8:1, losing $120/day
2. Increase budget for Campaign Y (Account B) - ROAS 5.1:1, limited by budget
3. Add negative keywords to Campaign Z - 30% of clicks from irrelevant terms
4. Review and improve Quality Scores for Account A - average 5.2
5. Schedule follow-up analysis in 3 days to monitor Campaign X pause impact
```

## Guidelines for BeechPPC Context

- Always use available functions to fetch real data
- Don't make assumptions - verify with actual account data
- Consider client-specific goals and KPIs
- Provide context about account maturity and industry
- Suggest next steps for deeper analysis when appropriate
- Be transparent about data limitations or missing information

