# AI Insight Prompts

Prompts for generating AI insights from Google Ads data. Each resource type has tailored analysis.

## Auto-Insights (Always Run)

Generate these automatically after data retrieval. Keep brief (3-5 bullet points).

### Template
```
Analyze this Google Ads {resource_type} data and provide 3-5 quick insights:

Data shape:
- Rows: {row_count}
- Date range: {date_range}
- Account: {account_name}

Focus on:
1. Value ranges (min, max, median for key metrics)
2. Distribution patterns (concentration, outliers)
3. Notable observations (zeros, extremes, patterns)

Be specific with numbers. Format currency with proper symbols.
```

## Detailed Analysis Prompts (User-Requested)

### search-terms
```
Analyze this search terms report for {account_name}:

Provide insights on:
1. **Top performers**: Which terms drive most conversions at good CPA?
2. **Wasted spend**: Terms with high cost but zero/low conversions
3. **Opportunities**: High-impression terms with low clicks (potential negatives or ad copy issues)
4. **Intent patterns**: What user intents emerge from the search terms?
5. **Negative keyword candidates**: Terms that should be excluded

Quantify findings with specific costs, conversion counts, and CTR figures.
```

### campaigns
```
Analyze this campaign performance data for {account_name}:

Provide insights on:
1. **Performance tiers**: Group campaigns by performance (stars, average, underperformers)
2. **Budget efficiency**: Which campaigns are limited by budget vs. well-paced?
3. **CPA/ROAS trends**: Which campaigns hit targets vs. miss?
4. **Spend distribution**: Is spend concentrated or balanced?
5. **Recommendations**: Top 3 actions to improve performance

Use specific metrics (CPA, ROAS, conversion rate) with values.
```

### keywords
```
Analyze this keyword performance data for {account_name}:

Provide insights on:
1. **Top converters**: Keywords driving most value
2. **Expensive underperformers**: High-cost keywords with poor returns
3. **Quality issues**: Keywords likely dragging down Quality Score
4. **Match type analysis**: Performance by match type if available
5. **Bid recommendations**: Keywords that need bid adjustments

Include specific costs, CPCs, and conversion metrics.
```

### quality
```
Analyze this Quality Score data for {account_name}:

Provide insights on:
1. **Score distribution**: How many keywords at each QS level (1-10)?
2. **Component breakdown**: Which component (expected CTR, ad relevance, landing page) is weakest?
3. **Cost impact**: Estimated cost savings from improving low QS keywords
4. **Priority fixes**: Which keywords to fix first (high spend + low QS)
5. **Landing page issues**: Keywords with "Below Average" landing page experience

Focus on actionable improvements with estimated impact.
```

### ads
```
Analyze this ad performance data for {account_name}:

Provide insights on:
1. **Top performers**: Which ads have best CTR and conversion rate?
2. **Underperformers**: Ads with low CTR or poor conversion rate
3. **Ad strength**: Distribution of ad strength ratings
4. **Testing opportunities**: Ad groups with too few ads or no testing
5. **Copy patterns**: What messaging themes work best?

Compare metrics against benchmarks where possible.
```

### budgets
```
Analyze this budget and targets data for {account_name}:

Provide insights on:
1. **Budget utilization**: Which campaigns are capped vs. underspending?
2. **Target alignment**: Are bid strategies hitting CPA/ROAS targets?
3. **Scaling opportunities**: Campaigns that could benefit from more budget
4. **Efficiency issues**: Campaigns where targets seem misconfigured
5. **Recommendations**: Budget reallocation suggestions

Include specific budget amounts and target values.
```

### conversions
```
Analyze this conversion action data for {account_name}:

Provide insights on:
1. **Primary actions**: Which conversions drive most value?
2. **Attribution**: How are conversions attributed across campaigns?
3. **Lag patterns**: Any conversion lag patterns visible?
4. **Micro vs. macro**: Balance of primary vs. secondary conversions
5. **Tracking health**: Any signs of tracking issues?

Focus on conversion value and volume patterns.
```

### devices
```
Analyze this device performance data for {account_name}:

Provide insights on:
1. **Device distribution**: Where is traffic and spend going?
2. **Conversion rates**: Which devices convert best?
3. **CPA by device**: Cost efficiency across devices
4. **Bid adjustment opportunities**: Recommended device bid modifiers
5. **Mobile issues**: Signs of mobile landing page problems

Include specific metrics and recommended bid adjustments (e.g., +20%, -30%).
```

### geo
```
Analyze this geographic performance data for {account_name}:

Provide insights on:
1. **Top locations**: Best performing cities/regions
2. **Underperformers**: Locations with poor ROI
3. **Opportunities**: High-potential locations with low spend
4. **Exclusion candidates**: Locations to remove from targeting
5. **Bid adjustments**: Recommended location bid modifiers

Be specific with location names and performance metrics.
```

### zero-conv
```
Analyze this zero-conversion keyword data for {account_name}:

Provide insights on:
1. **Wasted spend total**: Total cost on zero-conversion keywords
2. **High-risk keywords**: Most expensive keywords with no conversions
3. **Patterns**: Common themes among non-converters
4. **Action plan**: Pause, reduce bids, or give more time?
5. **Budget recovery**: Estimated savings from optimization

Prioritize by cost and provide specific recommendations.
```

### disapproved
```
Analyze this disapproved ads data for {account_name}:

Provide insights on:
1. **Policy violations**: Which policies are being violated?
2. **Impact**: Lost impressions/clicks from disapprovals
3. **Patterns**: Common issues across disapproved ads
4. **Priority fixes**: Which disapprovals to fix first (by volume)
5. **Prevention**: How to avoid future disapprovals

Group by policy type and include specific ad examples.
```

## Visualization Suggestions

After detailed analysis, suggest appropriate charts:

- **search-terms**: Scatter plot (cost vs. conversions), bar chart (top 20 by spend)
- **campaigns**: Bar chart (spend by campaign), pie chart (spend distribution)
- **keywords**: Scatter plot (CPC vs. conversion rate), histogram (CPC distribution)
- **quality**: Histogram (QS distribution), stacked bar (components by QS)
- **devices**: Pie chart (spend by device), bar chart (CPA by device)
- **geo**: Map visualization, bar chart (top locations)
- **budgets**: Bar chart (budget vs. spend), gauge charts for pacing
