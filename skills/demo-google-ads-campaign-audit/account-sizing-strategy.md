# Adaptive Query Strategy (Account Size Intelligence)

**Referenced from:** SKILL.md
**Usage:** Read this file when determining query strategy based on account size.

---

**CRITICAL:** Always assess account scale first to determine query strategy. Large accounts require focused analysis on high-impact areas.

## Step 1: Check Account Scale (Run First)

Execute these queries to understand account size:

**Query 1: Get all campaign statuses** (count client-side)
```sql
SELECT
  campaign.id,
  campaign.status
FROM campaign
WHERE campaign.status != 'REMOVED'
```

After retrieving results, count them client-side:
- Total campaigns = total rows returned
- Enabled campaigns = count where status = 'ENABLED'
- Paused campaigns = count where status = 'PAUSED'

**Query 2: Get spend concentration** (top 20 campaigns)
```sql
SELECT
  campaign.id,
  campaign.name,
  metrics.cost_micros
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY metrics.cost_micros DESC
LIMIT 20
```

## Step 2: Calculate Spend Concentration

Analyze the top 20 campaigns query result:
- Sum the cost_micros from top 20
- Calculate % of total account spend
- **High concentration:** Top 20 = 90%+ of spend → Focus on top performers
- **Distributed spend:** Top 20 = <70% of spend → Need broader sampling

## Step 3: Determine Query Strategy

| Account Size | Enabled Campaigns | Strategy | Date Range | Limits | Focus |
|--------------|-------------------|----------|------------|--------|-------|
| **Small** | < 20 | Full audit | 30 days | None | Complete coverage |
| **Medium** | 20-100 | Standard audit | 30 days | LIMIT 500 | Top performers + samples |
| **Large** | 100-300 | Focused audit | 14 days | LIMIT 300 | Top 80% of spend |
| **Enterprise** | > 300 | Strategic audit | 7 days | LIMIT 100 | Top 20% of spend only |

## Step 4: Apply Strategy-Specific Query Modifications

**Small Accounts (<20 campaigns):**
- Use all queries as written (30-day windows, no limits)
- Analyze every campaign, ad group, segment in detail
- Deep dive approach

**Medium Accounts (20-100 campaigns):**
- Use 30-day windows for performance queries
- Add LIMIT 500 to ad-group-structure query
- Filter segmentation: `AND metrics.impressions > 100`

**Large Accounts (100-300 campaigns):**
- Use 14-day windows for segmentation queries (device/hour/day)
- Add LIMIT 300 to structure queries
- Focus campaign analysis on top 50 by spend: `ORDER BY metrics.cost_micros DESC LIMIT 50`
- Filter aggressively: `AND metrics.cost_micros > [80th percentile value]`

**Enterprise Accounts (>300 campaigns):**
- Use 7-day windows for all segmentation queries
- Analyze top 100 campaigns only: `LIMIT 100`
- Skip low-volume segments entirely: `AND metrics.cost_micros > 1000000` (min $1)
- State clearly in output: "Analysis focused on top 100 campaigns representing X% of total spend"

## Step 5: Sorting Strategy by Analysis Type

**Choose ORDER BY based on what you're analyzing:**

| Analysis Type | Sort By | Rationale |
|--------------|---------|-----------|
| Performance overview | `metrics.cost_micros DESC` | 80/20 rule: highest spend = highest impact |
| Budget constraints | `metrics.search_budget_lost_impression_share DESC` | Biggest scale opportunities first |
| Waste identification | `metrics.cost_micros DESC WHERE conversions = 0` | High spend + no results = biggest waste |
| Optimization targets | `metrics.conversions DESC` | High volume = statistical significance |
| Structure audit | `campaign.name ASC` | Naming patterns reveal logic |
| Segmentation | `campaign.name, metrics.cost_micros DESC` | Keep campaigns together, prioritize spend |

## Step 6: Communicate Your Reasoning

**Always explain your approach to the user:**

**Small account example:**
"This account has 5 enabled campaigns with spend highly concentrated (top 5 = 100%). I'll run a comprehensive 30-day audit covering all campaigns, ad groups, and segments."

**Large account example:**
"This account has 312 enabled campaigns. The top 20 campaigns represent 87% of spend ($892k of $1.02M). I'll focus my analysis on the top 50 campaigns by spend (representing ~95% of total spend) using 14-day windows for segmentation to manage data volume. This strategic approach ensures we identify the highest-impact opportunities."

**Enterprise account example:**
"This is a large enterprise account with 847 total campaigns (312 enabled). To provide actionable insights, I'm analyzing the top 100 campaigns by spend which represent 98% of total spend. Segmentation analysis (device/hour/day) uses 7-day windows to balance statistical significance with data manageability. Lower-spend campaigns (<$100/month) are summarized in aggregate rather than analyzed individually."

## Smart Filtering Examples

**When spend is concentrated (top 20 = 90%+ of spend):**

Focus queries on top performers by adding cost threshold and limits:
- Calculate 80th percentile from spend data client-side
- Add `WHERE metrics.cost_micros > [threshold]` to filter low spenders
- Use `ORDER BY metrics.cost_micros DESC LIMIT 50` to focus on top campaigns

**When spend is distributed (top 20 = <70% of spend):**

Use lighter filtering for broader coverage:
- Filter by impression volume: `WHERE metrics.impressions > 100`
- Increase limits: `LIMIT 200` or `LIMIT 500` depending on account size
- Still prioritize by spend: `ORDER BY metrics.cost_micros DESC`

**For segmentation queries on large accounts:**

Since GAQL doesn't support CTEs or subqueries, use a two-query approach:
1. First, get top campaign IDs by running the spend concentration query
2. Store campaign IDs in memory
3. Then query segmentation data, manually filtering to include only those campaign IDs in your analysis

This client-side filtering maintains focus on high-impact campaigns without complex SQL.
