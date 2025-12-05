# Google Ads Campaign Audit Queries

This directory contains GAQL query templates for the Campaign Audit skill, organized by execution phase.

## Query Execution Strategy

Queries are organized into 3 phases with a **hierarchical execution model**:

### Phase 1: Account Intelligence (Always Run - 2 queries)

These queries determine account scale and spend concentration:

**1. account-scale.gaql** - Campaign counts by status
- Returns: `campaign.id`, `campaign.status`
- Purpose: Classify account size (SMALL <20, MEDIUM 20-100, LARGE 100+ enabled campaigns)
- Date range: Not applicable (structural query)

**2. spend-concentration.gaql** - Top campaigns by spend
- Returns: `campaign.id`, `campaign.name`, `metrics.cost_micros`
- Purpose: Identify which campaigns represent 80% of spend
- Date range: LAST_30_DAYS
- Sorting: DESC by cost
- Limit: 20 campaigns

**Phase 1 Output:** "Focus on top 20 campaigns representing 85% of spend"

### Phase 2: Core Structural Audit (Always Run - 3 queries)

These queries identify structural and budget issues:

**3. campaign-settings.gaql** - Configuration audit
- Returns: Location targeting, network settings, bid strategies
- Purpose: Find PRESENCE_OR_INTEREST, Search Partners issues, bid strategy mismatches
- Filters: Apply LIMIT based on account size (all for SMALL, top 50 for MEDIUM/LARGE)
- Date range: Not applicable (structural query)

**4. budget-constraints.gaql** - Budget utilization and Lost IS
- Returns: Budget amount, spend, Lost IS (Budget), Lost IS (Rank)
- Purpose: Identify budget-constrained campaigns vs bid/quality issues
- Date range: LAST_7_DAYS (recent data for current constraints)
- Filters: ENABLED campaigns only, apply LIMIT based on account size

**5. campaign-performance.gaql** - Full performance metrics
- Returns: Spend, impressions, clicks, conversions, ROAS
- Purpose: Context for structural issues (which campaigns matter most?)
- Date range: LAST_30_DAYS
- Sorting: DESC by cost
- Filters: Apply LIMIT based on account size

**Phase 2 Output:** Prioritized list of structural issues with quantified impact

### Phase 3: Optional Segmentation Deep-Dive (Conditional - 3 queries)

**ONLY run these queries if Phase 2 identifies specific issues warranting deeper analysis.**

**6. device-performance.gaql** - Device segmentation
- Returns: Performance by device (MOBILE, DESKTOP, TABLET)
- Date range: LAST_14_DAYS (shorter for large data volume)
- **Decision criteria:** Run if ANY of:
  - Device bid adjustments already exist in account
  - Need to recommend device bid adjustments
  - Mobile CPA appears significantly different from desktop in Phase 2 data

**7. geographic-performance.gaql** - Geographic analysis
- Returns: Performance by location
- Date range: LAST_30_DAYS
- **Decision criteria:** Run if ANY of:
  - 3+ countries/regions actively targeted
  - Phase 2 shows campaigns using PRESENCE_OR_INTEREST (to quantify waste)
  - Geographic exclusions needed

**8. network-performance.gaql** - Search vs Search Partners
- Returns: Performance by network segment
- Date range: LAST_30_DAYS
- **Decision criteria:** Run if ANY of:
  - Search Partners enabled on high-spend campaigns (>$5k/month)
  - Phase 2 shows multiple campaigns with Search Partners enabled
  - Need to quantify Search Partners waste

**Phase 3 Output:** Specific segmentation recommendations with quantified impact

## Queries Removed from Original Library

The following queries were removed as they are **not relevant for campaign audits** (too granular, not structural):

- ~~`ad-group-structure.gaql`~~ - Ad group hierarchy is keyword audit territory, not campaign audit
- ~~`day-of-week-performance.gaql`~~ - Day patterns too granular for structural audit
- ~~`hour-of-day-performance.gaql`~~ - Hour patterns too granular for structural audit

**Rationale:** Campaign audits focus on **structural inefficiencies** and **budget misallocations**. Granular performance patterns are optimization work, not structural work.

## Query Modifications for Large Accounts

When executing queries on LARGE accounts (100+ enabled campaigns):

**Add LIMIT clauses:**
```sql
-- Campaign-level queries
LIMIT 50  -- Focus on top campaigns

-- Segmentation queries (Phase 3)
LIMIT 60-100  -- Limit rows to manage data volume
```

**Add spend filters:**
```sql
-- Filter low-spend data
WHERE metrics.cost_micros > 1000000  -- $1+ spend
```

**Use shorter date ranges:**
```sql
-- Phase 3 segmentation
WHERE segments.date DURING LAST_14_DAYS  -- Instead of 30 days
```

## Date Range Syntax

**Valid GAQL date ranges:**
- `DURING LAST_7_DAYS` - Recent budget constraint analysis
- `DURING LAST_14_DAYS` - Segmentation on large accounts
- `DURING LAST_30_DAYS` - Standard performance period
- `WHERE segments.date BETWEEN "YYYY-MM-DD" AND "YYYY-MM-DD"` - Specific dates

**NEVER use `LAST_90_DAYS`** - This syntax does not exist in GAQL and will cause errors.

## Data Transformation

**CRITICAL:** Always transform raw query results before analysis:

1. Execute queries → Save to JSON files (`01-account-scale.json`, etc.)
2. Run `transform_data.py` → Creates `transformed-analysis-ready.md`
3. Analyze transformed markdown (NOT raw JSON) → Eliminates calculation errors

See parent directory's `transform_data.py` for the general-purpose transformation script.

## Query Execution Order

**Always execute in this order:**

1. Phase 1 queries (account-scale, spend-concentration)
2. Analyze Phase 1 results → Determine account classification and focus
3. Phase 2 queries (campaign-settings, budget-constraints, campaign-performance) with appropriate filters
4. Transform all data → Create markdown tables
5. Analyze Phase 2 results → Identify structural and budget issues
6. **Decision point:** Do issues warrant Phase 3?
7. If yes: Execute specific Phase 3 query(ies)
8. If no: Skip to report writing

**Why this matters:** Hierarchical execution prevents running unnecessary queries and keeps LLM context focused on relevant data.

## Common Structural Issues

**Geographic Targeting Waste:**
- Issue: Campaigns using PRESENCE_OR_INTEREST targeting
- Impact: Ads show to people searching ABOUT the location, not IN it
- Example: Pool supply store in Sydney shows ads to someone in London searching "pool supplies Sydney"
- Fix: Change to PRESENCE only
- Priority: CRITICAL if affecting high-spend campaigns

**Search Partners Waste:**
- Issue: Search Partners enabled on campaigns where it underperforms
- Impact: Typically 30-50% lower ROAS than Google Search
- Fix: Disable Search Partners, reallocate budget to Google Search
- Priority: HIGH if affecting campaigns spending >$5k/month

**Bid Strategy Mismatch:**
- Issue: Using Target ROAS/CPA with <30 conversions/month
- Impact: Insufficient data for automated bidding to learn effectively
- Fix: Switch to Maximize Conversions or consolidate campaigns
- Priority: HIGH if affecting multiple campaigns

**Budget Constraints:**
- Issue: Lost IS Budget >10%
- Impact: Missing impression opportunities due to insufficient budget
- Fix: Increase daily budget or reallocate from underperforming campaigns
- Priority: CRITICAL if affecting high-ROAS campaigns

**Budget Misallocation:**
- Issue: High budget on low-ROAS campaigns while high-ROAS campaigns are constrained
- Impact: Suboptimal overall account ROAS
- Fix: Reduce budget on low-ROAS campaigns, increase on high-ROAS campaigns
- Priority: HIGH if gap is >2x ROAS difference

## Data Formatting Notes

**Micros to Currency:**
- `cost_micros` ÷ 1,000,000 = currency
- `amount_micros` ÷ 1,000,000 = budget amount
- `target_cpa_micros` ÷ 1,000,000 = target CPA

**Already in Currency (do NOT divide):**
- `conversions_value` - Already in currency, NOT micros

**Decimals to Percentages:**
- `ctr` × 100 = percentage
- Lost Impression Share metrics × 100 = percentage
- `conversion_rate` × 100 = percentage

**Calculate ROAS:**
```
Actual ROAS = conversions_value ÷ (cost_micros ÷ 1,000,000)
```

**Bid Strategy Target Fields (CRITICAL):**

Different bid strategies store targets in different API fields:
- **TARGET_CPA strategy** → `campaign.target_cpa.target_cpa_micros`
- **TARGET_ROAS strategy** → `campaign.target_roas.target_roas`
- **MAXIMIZE_CONVERSIONS with CPA target** → `campaign.maximize_conversions.target_cpa_micros`
- **MAXIMIZE_CONVERSION_VALUE with ROAS target** → `campaign.maximize_conversion_value.target_roas`

Both sets of fields are included in campaign-settings.gaql and campaign-performance.gaql to capture targets regardless of which strategy type is used.

## The 80/20 Rule (Mike Rhodes)

Review which campaigns drive 80% of results:
- Top 20% of campaigns typically generate 80% of conversions
- Ensure budget allocation matches performance contribution
- Calculate: Does spend distribution match conversion distribution?

**Campaign audits focus on campaigns that matter** - use spend concentration to determine focus areas.

## Remember

**Campaign audits are about structure and budget, not optimization.**

Focus ruthlessly on:
- Geographic targeting waste (PRESENCE_OR_INTEREST)
- Network settings issues (Search Partners)
- Bid strategy mismatches (automated bidding without conversion volume)
- Budget constraints (Lost IS Budget >10%)
- Budget misallocation (high spend on low ROAS)

Everything else is secondary.
