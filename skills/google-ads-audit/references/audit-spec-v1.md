# Google Ads Audit Specification v1

Questions the audit should answer, queries to use, and how to display the data.

---

## 1. Account Performance Overview

### Q: How is the account performing overall?
**Query:** campaigns-performance.gaql (30 days)
**Display:** Summary cards showing total spend, conversions, value, ROAS, clicks, impressions

### Q: How does this compare to the previous period?
**Query:** campaigns-performance.gaql (current 30 days vs previous 30 days)
**Display:** Summary cards with delta arrows (up/down %) and color coding (green=better, red=worse)

---

## 2. Budget Pacing & Forecasting

### Q: What will I spend in the next 30 days if current trends continue?
**Query:** daily-conversions.gaql (last 30 days) + campaign-budgets-and-targets.gaql
**Display:**
- Projected spend for next 30 days based on daily average
- Projected spend by end of current month
- Projected conversions and conversion value for both periods
- Table with: Campaign, Daily Avg, Projected 30d, Projected Month-End

### Q: Are campaigns limited by budget?
**Query:** budget-constraints.gaql
**Display:** Table of campaigns with limited by budget status, current budget, recommended budget

---

## 3. Campaign Performance

### Q: Which campaigns are performing well/poorly?
**Query:** campaigns-performance.gaql (30 days)
**Display:**
- Bar chart: Top campaigns by spend
- Bar chart: ROAS by campaign (color coded: green ≥5x, orange ≥3x, red <3x)
- Table: All campaigns with key metrics

### Q: How does performance compare to previous period?
**Query:** campaigns-performance.gaql (current vs previous 30 days)
**Display:** Table with columns: Campaign, Cost (current/prev/%), Conv (current/prev/%), ROAS (current/prev)

---

## 4. Keyword Analysis

### Q: Which keywords are driving conversions?
**Query:** keywords-by-cost.gaql (30 days)
**Display:** Horizontal bar chart of top 10 keywords by conversions

### Q: What are the highest CPC keywords?
**Query:** keywords-by-cost.gaql (7 days and 30 days)
**Display:**
- Table: Top 10 highest CPC keywords (7 days)
- Table: Top 10 highest CPC keywords (30 days)
- Highlight any with CPC > $20 or unusual spikes

### Q: Which keywords are wasting spend?
**Query:** zero-conversion-keywords.gaql (30 days)
**Display:** Table of keywords with spend but 0 conversions, sorted by cost desc

---

## 5. Search Term Analysis

### Q: Which search terms are converting?
**Query:** search-terms.gaql (30 days)
**Display:** Table of top search terms by conversions

### Q: What are the highest CPC search terms?
**Query:** search-terms.gaql (7 days and 30 days)
**Display:**
- Table: Top 10 highest CPC search terms (7 days)
- Table: Top 10 highest CPC search terms (30 days)
- Compare to keyword CPCs - large gaps indicate broad match expansion

### Q: Which search terms should be added as negatives?
**Query:** search-terms.gaql filtered for cost > 0, conversions = 0
**Display:** Table of wasted spend search terms, sorted by cost desc

### Q: Which search terms should be added as keywords?
**Query:** unmatched-search-terms.gaql (status = NONE with conversions)
**Display:** Table of unmatched terms with conversions, sorted by conversions desc

---

## 6. Conversion Tracking Health

### Q: How many conversion actions are recording?
**Query:** conversion-actions.gaql (30 days)
**Display:**
- Count of active conversion actions
- Line chart: All conversion actions over 30 days (one line per action)
- Helps spot broken tracking (sudden drops to zero)

### Q: Are conversion values reasonable?
**Query:** conversion-actions.gaql + keywords-by-cost.gaql
**Display:**
- Average conversion value by action
- Flag any with $0 value or unusually high/low values
- Compare top keyword CPC to average conversion value (CPC > conv value = problem)

---

## 7. Bid Management Insights

### Q: What bidding strategies are in use?
**Query:** campaign-settings.gaql
**Display:** Pie chart of campaigns by bid strategy type

### Q: Are target ROAS/CPA being met?
**Query:** campaign-budgets-and-targets.gaql + campaigns-performance.gaql
**Display:** Table: Campaign, Target ROAS/CPA, Actual ROAS/CPA, Delta

### Q: Are there concerning CPC outliers?
**Query:** keywords-by-cost.gaql + search-terms.gaql (7 and 30 days)
**Display:**
- Highest CPC keyword (7d): $X.XX - [keyword]
- Highest CPC keyword (30d): $X.XX - [keyword]
- Highest CPC search term (7d): $X.XX - [term]
- Highest CPC search term (30d): $X.XX - [term]
- Flag if any > average conversion value

---

## 8. Ad Performance

### Q: Which ads are performing best?
**Query:** ad-performance.gaql (30 days)
**Display:** Table of top ads by conversions with CTR and conversion rate

### Q: How are RSA assets performing?
**Query:** asset-performance.gaql (30 days)
**Display:**
- Count of assets by performance label (BEST, GOOD, LOW, LEARNING)
- Table of LOW performing assets that need replacement
- Table of BEST performing assets to replicate

---

## 9. Quality Score

### Q: What's the Quality Score distribution?
**Query:** quality-score.gaql
**Display:**
- Histogram of QS distribution (1-10)
- Count/% of keywords with QS < 5 (needs attention)
- Table of lowest QS keywords with component breakdown (expected CTR, ad relevance, landing page)

---

## 10. Geographic Performance

### Q: Which locations perform best?
**Query:** geo-targeting.gaql (30 days)
**Display:** Table of locations by ROAS, identify underperformers to exclude

---

## 11. Device Performance

### Q: How does performance vary by device?
**Query:** device-performance.gaql (30 days)
**Display:**
- Pie chart of spend by device
- Table: Device, Cost, Conv, ROAS - compare mobile vs desktop

---

## 12. Negative Keywords

### Q: Are negative keywords properly configured?
**Query:** negatives-adgroup.gaql + negatives-lists.gaql
**Display:**
- Total negative keywords count
- Negatives per campaign average
- Flag campaigns with < 10 negatives

---

## 13. Trends Over Time

### Q: How has performance trended?
**Query:** daily-conversions.gaql (30 days)
**Display:**
- Line chart: Daily conversions and cost (dual axis)
- Line chart: Daily ROAS
- Highlight any significant drops or spikes

---

## Priority for v1 Implementation

### Must Have
1. Account Overview with period comparison
2. Budget pacing & forecasting
3. Highest CPC keywords/search terms (7d and 30d)
4. Conversion actions line chart (tracking health)
5. Wasted spend (zero conversion keywords/terms)
6. Campaign performance table

### Nice to Have
1. Asset performance labels
2. Quality Score distribution
3. Device/Geo breakdowns
4. Negative keyword audit

---

## Data Display Patterns

### Summary Cards
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Spend       │  │ Conversions │  │ ROAS        │
│ $55,952     │  │ 3,593       │  │ 9.6x        │
│ ↑ 12%       │  │ ↑ 8%        │  │ ↓ 3%        │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Comparison Table
| Metric | Current | Previous | Change |
|--------|---------|----------|--------|
| Spend  | $55,952 | $49,872  | +12%   |

### Alert Box
```
⚠️ Highest CPC keyword (30d): $45.23 - "emergency plumber"
   Average conversion value: $32.00
   This keyword costs more than it returns per conversion
```

---

## Queries Needed (not yet created)

1. **conversion-actions-daily.gaql** - Segmented by date and conversion action name
2. Period comparison logic in Python (run same query twice with different dates)

---

## Notes

- All monetary values in account currency
- All percentages to 1 decimal place
- Period comparison = current 30 days vs previous 30 days
- Forecasting assumes linear trends (simple average * days remaining)
