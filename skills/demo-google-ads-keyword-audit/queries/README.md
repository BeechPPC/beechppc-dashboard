# Keyword & Search Terms Audit Queries

This folder contains GAQL queries for analyzing search terms, Quality Score, negative keywords, and keyword performance.

## IMPORTANT: Date Range Syntax

**Google Ads API v18+ requires finite date ranges using `BETWEEN`.**

**Deprecated (DO NOT USE):**
```sql
WHERE segments.date DURING LAST_30_DAYS  -- ❌ INVALID - causes INVALID_VALUE_WITH_DURING_OPERATOR error
```

**Correct syntax:**
```sql
WHERE segments.date BETWEEN "2025-09-19" AND "2025-10-19"  -- ✓ VALID
```

The skill should calculate these dates dynamically:
- Last 30 days: `current_date - 30 days` to `current_date - 1 day`
- Last 90 days: `current_date - 90 days` to `current_date - 1 day`

## IMPORTANT: MCC Account Access

Some accounts are **client accounts** managed by an MCC (Manager Account). When accessing client accounts, you MUST provide the `login_customer_id` parameter.

**Check `.claude/accounts.json` for the account hierarchy:**
```json
{
  "example_client": {
    "id": "1234567890",
    "login_customer_id": "9876543210"  // ← Required for MCC access
  }
}
```

**Example execution:**
```python
execute_gaql(
  customer_id="1234567890",        # Client account ID
  login_customer_id="9876543210",  # Managing MCC ID
  query="..."
)
```

**Without login_customer_id, you'll get:**
```
USER_PERMISSION_DENIED: User doesn't have permission to access customer.
Note: If you're accessing a client customer, the manager's customer id
must be set in the 'login-customer-id' header.
```

## Query Files

### 1. search-terms.gaql
**Purpose:** Review search terms triggering ads to identify waste and opportunities

**Returns:**
- Campaign and ad group name
- Search term and match type that triggered the ad
- Performance metrics: impressions, clicks, cost, conversions, conversion value

**Use when:**
- Identifying wasted spend on irrelevant search terms
- Finding negative keyword opportunities
- Discovering high-performing terms to add as keywords
- Performing N-gram analysis for patterns

**Time period:** Last 30 days

**Typical findings:**
- 10-30% of spend on irrelevant terms
- High-cost zero-conversion search terms
- Brand vs non-brand cannibalization patterns

---

### 2. quality-score.gaql
**Purpose:** Analyze keyword-level Quality Score with all components

**Returns:**
- Campaign, ad group, keyword text, and match type
- Quality Score (1-10)
- Components: Creative Quality, Post-Click Quality, Search Predicted CTR
- Performance: impressions, clicks, cost, conversions, avg CPC

**Use when:**
- Identifying keywords with QS <7 requiring optimization
- Finding "Below Average" components (Expected CTR, Landing Page, Ad Relevance)
- Calculating impression-weighted Quality Score
- Correlating QS with CPC costs

**Time period:** Last 90 days (QS based on 90-day comparison)

**Impact:**
- QS below 5 = paying 2-4x more than competitors
- Focus on high-impression low-QS keywords first

---

### 3. keyword-performance.gaql
**Purpose:** Review keyword performance by match type

**Returns:**
- Campaign, ad group, keyword text, match type
- Metrics: impressions, clicks, CTR, cost, conversions, cost per conversion, avg CPC

**Use when:**
- Analyzing performance differences by match type
- Identifying top and bottom performers
- Reviewing match type distribution
- Finding high-spend keywords to optimize

**Time period:** Last 30 days

---

### 4. zero-conversion-keywords.gaql
**Purpose:** Find high-spend keywords with zero conversions

**Returns:**
- Campaign, ad group, keyword text, match type
- Cost, clicks, conversions (filtered to 0)

**Use when:**
- Identifying wasted spend on non-performing keywords
- Finding candidates for pausing or match type changes
- Calculating waste percentage (91% of keywords generate 0 conversions - Disruptive research)

**Time period:** Last 90 days

**Action threshold:**
- Keywords with >$50 spend and 0 conversions = pause or add negatives

---

### 5. duplicate-keywords.gaql
**Purpose:** Identify duplicate keywords across campaigns causing self-bidding competition

**Returns:**
- Keyword text, match type, campaign ID, campaign name, ad group name
- Status, cost, clicks, conversions, impressions
- Sorted by keyword text → match type → cost (highest first)

**Use when:**
- Finding keywords competing against themselves
- Identifying consolidation opportunities
- Resolving auction conflicts

**Time period:** Last 30 days

**How to detect duplicates:**
GAQL doesn't support GROUP BY. Results are sorted for manual duplicate detection:
1. Parse results and group by (keyword.text + match_type)
2. Count distinct campaign.id for each group
3. If count > 1 = duplicate found
4. Within duplicates, highest cost listed first = best performer

**Action:**
- Keep best-performing version in most relevant campaign
- Pause or remove duplicates in other campaigns

---

## Typical Audit Workflow

1. **Start with search-terms.gaql**
   - Identify irrelevant search terms wasting spend
   - Perform N-gram analysis (2-word, 3-word phrase patterns)
   - Calculate waste by category
   - Generate negative keyword suggestions

2. **Run quality-score.gaql**
   - Calculate impression-weighted QS (NOT simple average)
   - Identify keywords with QS <5 (CRITICAL)
   - Find "Below Average" components requiring attention
   - Prioritize by impression volume

3. **Execute keyword-performance.gaql**
   - Review match type distribution
   - Compare performance by match type
   - Identify top 20% performers vs bottom 80%

4. **Run zero-conversion-keywords.gaql**
   - Calculate total waste on non-performers
   - Identify pause candidates (>90 days, 0 conversions)
   - Find patterns indicating wrong match type

5. **Check duplicate-keywords.gaql**
   - Find self-competing keywords
   - Determine which campaign should own each keyword
   - Consolidate to eliminate auction conflicts

## Common Findings

**Critical Issues:**
- 91% of keywords generate 0 conversions (consume 61% of spend)
- No negative keywords at all in account
- Quality Score below 5 on high-impression keywords
- Heavy broad match without Smart Bidding or negatives
- Duplicate keywords across 3+ campaigns

**High Priority:**
- Search terms waste: 10-30% of spend on irrelevance
- Negative keyword conflicts blocking desired terms
- Poor keyword-to-ad-group alignment (20+ unrelated keywords)
- Impression-weighted QS below 6 (account-level)

## Impression-Weighted Quality Score Calculation

**CRITICAL:** Do NOT use simple average Quality Score.

Use Brad Geddes' methodology:
```
Impression-Weighted QS = Σ(Quality Score × Impressions) / Σ(Impressions)
```

A keyword with QS=3 and 100,000 impressions has far more cost impact than QS=10 keyword with 100 impressions.

## Data Formatting Notes

- `cost_micros` ÷ 1,000,000 = currency
- `ctr` × 100 = percentage
- Quality Score components: "BELOW_AVERAGE", "AVERAGE", "ABOVE_AVERAGE"
- Focus on 40% weighted components first: Expected CTR, Landing Page Experience
