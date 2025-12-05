# Google Ads Workflows

Structured analysis workflows for different time periods and purposes.

## Monthly Account Review

**Purpose:** Comprehensive analysis covering all key areas for strategic decisions.

**Components:**

### 1. Account Performance Summary (30 days)
```
/google-ads {account} campaigns 30d
```
- Total spend, conversions, conversion value
- ROAS calculation
- Compare to previous 30 days if available

### 2. Search Term Analysis
```
/google-ads {account} search-terms 30d
```
Focus on:
- High-cost zero-conversion terms (negatives candidates)
- High-converting terms not matched to keywords (keyword additions)
- Competitor names in search terms

### 3. Keyword Performance
```
/google-ads {account} keywords 30d
```
Identify:
- Top performers by ROAS
- Underperformers (high cost, low conversion)
- Quality Score issues

### 4. Landing Page Analysis
```
/google-ads {account} landing-pages 30d
```
Check:
- Pages with high traffic but low conversion
- ROAS by landing page
- Mobile vs desktop performance

### 5. Budget & Bidding Review
```
/google-ads {account} budgets 30d
```
Review:
- Limited by budget campaigns
- Bid strategy performance
- Opportunity for budget reallocation

### 6. Daily Conversion Trends
```
/google-ads {account} daily-conv 30d
```
Analyze:
- Day-over-day trends
- Weekly patterns
- Any sudden drops or spikes

### 7. Asset Performance
```
/google-ads {account} assets 30d
```
Review:
- Best performing headlines (BEST label)
- Low performers to replace
- Pinned asset performance

### 8. Ad Group Structure
```
/google-ads {account} adgroups 30d
```
Check:
- Ad groups with low/no spend
- Imbalanced spend across ad groups
- Campaign organization

### 9. Geographic Performance
```
/google-ads {account} geo-targeting 30d
```
Identify:
- Top performing locations
- Underperforming regions to exclude
- Expansion opportunities

### 10. Negative Keywords Audit
```
/google-ads {account} negatives
```
Review:
- Completeness of negative lists
- Potential conflicts with positive keywords

### 11. Action Items Generation
After running all analyses, generate:
- [ ] Negative keywords to add
- [ ] Keywords to add/expand
- [ ] Landing pages to improve
- [ ] Budget reallocations
- [ ] Bid strategy changes
- [ ] Assets to replace
- [ ] Geographic targeting changes

---

## Weekly Performance Check

**Purpose:** Quick health check, catch issues early.

**Components:**

### 1. Yesterday vs 7-day Average
```
/google-ads {account} campaigns 1d
/google-ads {account} campaigns 7d
```
Flag significant deviations in:
- Cost
- Conversions
- ROAS

### 2. Search Terms (7 days)
```
/google-ads {account} search-terms 7d
```
Quick scan for:
- New high-spend terms
- Obvious negatives

---

## Daily Monitoring (for briefing)

**Purpose:** Quick snapshot of all accounts for daily briefing.

**Query:** Yesterday's performance for all accounts

**Metrics per account:**
- Cost
- Conversions
- Conversion Value
- ROAS (value/cost)

**Format:**
```
### Google Ads - Yesterday

| Account | Cost | Conv | Value | ROAS |
|---------|------|------|-------|------|
| SWG     | $245 | 12   | $1,847| 7.5x |
| MPM     | $189 | 8    | $923  | 4.9x |
| SSC     | £156 | 3    | £892  | 5.7x |
```

**Alerts:**
- Flag accounts with ROAS < 3x
- Flag accounts with spend but 0 conversions
- Flag accounts with >20% cost increase from 7-day average

---

## 90-Day Deep Dive

**Purpose:** Strategic review, trend analysis, major optimizations.

**Components:**

1. **Campaign trends** - 90d data with weekly breakdown
2. **Keyword lifecycle** - New vs mature keyword performance
3. **Audience insights** - Demographics, devices, locations
4. **Competitor analysis** - Auction insights, IS trends
5. **Quality Score trends** - QS changes over time

---

## Running Workflows

### Full Monthly Review
```bash
# Run all monthly components sequentially
/google-ads {account} campaigns 30d
# Analyze output, then:
/google-ads {account} search-terms 30d
# Analyze output, then:
/google-ads {account} keywords 30d
# etc.
```

### Automated Daily Check
See briefing-generator skill for daily monitoring integration.

The google-ads skill can be called programmatically by the briefing script to pull yesterday's data for all accounts.
