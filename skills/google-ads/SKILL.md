---
name: google-ads
description: |
  Get Google Ads data using natural language. AUTO-ACTIVATE for ANY mention of: search terms, campaigns, keywords, ad groups, ads, quality score, conversions, performance, budgets, CPC, CTR, cost, clicks, impressions. Account names (Mr Pool Man, MPM, Scottish Shutters, SSC, SWG, etc.). Phrases: "get", "pull", "show me", "top X", "highest", "lowest". Also triggered by /google-ads command.
---

# Google Ads Skill

Get Google Ads data via natural language, save to CSV, generate auto-insights, and offer numbered actions.

## CRITICAL: Follow ALL Steps

**You MUST complete every step in the Process section below.** Do not stop after the query executes successfully. The full workflow is:

1. Parse request
2. Load/build query
3. Execute query
4. **Generate auto-insights** (analyze the data)
5. **Present summary with numbered options** (give user next steps)
6. Handle user selection

**Common mistake:** Stopping after Step 3 and just reporting "Query completed, X rows". This is incomplete. Always continue through Steps 4 and 5.

## Command Format

```
/google-ads <account> <resource> [days] [sort:<field>]
```

**Examples:**
- `/google-ads swg search-terms` - Swimwear Galore, search terms, 30d, cost desc
- `/google-ads mpm keywords 90d` - Mr Pool Man, keywords, 90 days
- `/google-ads ssc campaigns 7d sort:clicks` - Scottish Shutters, 7 days, sort by clicks

**Defaults:**
- Days: 30
- Sort: cost DESC
- Account: Uses `default: true` from accounts.json if not specified

## Process

### Step 1: Parse Request

Extract from user input:
1. **Account** - Name or alias (resolve from `.claude/accounts.json`)
2. **Resource** - Short name (see `references/resources.md` for mappings)
3. **Days** - Time period (default 30)
4. **Sort** - Field to sort by (default: cost DESC)

**Account Resolution:**
- Read `.claude/accounts.json`
- Match by name, key, or alias (case-insensitive)
- If no account specified, use the one with `"default": true`
- If no match found, list available accounts and ask user

**Resource Resolution:**
- Read `references/resources.md` for short name → .gaql file mapping
- Use fuzzy matching for variations (e.g., "search", "queries" → `search-terms`)
- If ambiguous, ask user to clarify

### Step 2: Load or Build GAQL Query

**If saved query exists:** Read the GAQL template from `references/{resource}.gaql`

**If no saved query exists:** Build query dynamically using Google Ads API docs:

1. **Look up resource documentation:**
   - Start at: https://developers.google.com/google-ads/api/fields/v22/overview
   - This lists all available resources (campaign, ad_group, keyword_view, landing_page_view, etc.)
   - Click through to see available fields and segments for each resource

2. **Build GAQL query:**
   - SELECT relevant fields and metrics
   - FROM the appropriate resource
   - WHERE segments.date DURING LAST_30_DAYS (for date filtering)
   - ORDER BY metrics.cost_micros DESC (or appropriate sort)

3. **Execute the query** (Step 3)

4. **Save the new query:**
   - Write to `references/{resource}.gaql`
   - Add entry to `references/resources.md` with short name mapping
   - Add entry to `code/google-ads/queries/README.md` in appropriate category
   - This ensures future requests use the saved query

**Example - building landing-pages query:**
```
User asks for "landing pages" but no landing-pages.gaql exists

1. Look up landing_page_view resource at:
   https://developers.google.com/google-ads/api/fields/v22/landing_page_view

2. Build query:
   SELECT
     landing_page_view.unexpanded_final_url,
     metrics.clicks, metrics.impressions, metrics.cost_micros,
     metrics.conversions, metrics.conversions_value, metrics.ctr
   FROM landing_page_view
   WHERE segments.date DURING LAST_30_DAYS
   ORDER BY metrics.cost_micros DESC

3. Execute query

4. Save as references/landing-pages.gaql and update docs
```

### Step 3: Execute Query

**IMPORTANT: Date Range Handling**

GAQL files use `{DATE_RANGE}` as a placeholder. Before executing:
1. Calculate start and end dates based on user's `--days` parameter (default 30)
2. Replace `{DATE_RANGE}` with `BETWEEN 'YYYY-MM-DD' AND 'YYYY-MM-DD'`

**Example for 90 days:**
```sql
WHERE segments.date BETWEEN '2025-08-22' AND '2025-11-19'
```

**Execution:**

Read the .gaql file, replace `{DATE_RANGE}` with calculated dates, then run:

```bash
node /Users/mikerhodes/Projects/brain/.claude/skills/google-ads/scripts/query.js \
  --customer-id={customer_id} \
  --login-customer-id={login_customer_id} \
  --query="{GAQL with dates inserted}" \
  --output=/Users/mikerhodes/Projects/brain/data/google-ads/{YYYYMMDD}-{account-slug}-{resource}.csv
```

**Output location:** `data/google-ads/YYYYMMDD-account-resource.csv`

**Note:** Do not use `--days` parameter with the script - handle date replacement yourself before passing the query.

### Step 4: Generate Auto-Insights

After data retrieval, automatically generate 3-5 quick insights about the data shape:

1. **Read sample of CSV** - First 100 rows to understand structure
2. **Calculate basic stats** - Value ranges, medians, distributions
3. **Identify patterns** - Zeros, outliers, concentration

Use the auto-insight template from `references/insight-prompts.md`.

**Example output:**
```
Quick Insights:
- Cost ranges from $0.12 to $892.45 (median: $4.23)
- 847 terms with 0 conversions (30% of total)
- Top 10 terms account for 42% of total spend
- CTR ranges from 0.1% to 12.8% (median: 2.1%)
```

### Step 5: Present Summary with Numbered Options

Format the response with:
1. Query confirmation
2. File location and row count
3. Sample data (headers + 3 rows)
4. Auto-insights
5. Numbered action options

**Template:**
```
## Query Complete

**Account:** {account_name}
**Resource:** {resource} ({days} days)
**File:** data/google-ads/{filename}.csv
**Rows:** {row_count}

### Sample Data

| {header1} | {header2} | {header3} | {header4} | {header5} |
|-----------|-----------|-----------|-----------|-----------|
| {row1}    |           |           |           |           |
| {row2}    |           |           |           |           |
| {row3}    |           |           |           |           |

### Quick Insights

- {insight1}
- {insight2}
- {insight3}
- {insight4}

### What's Next?

1. Filter data (e.g., high-cost zero-conversion)
2. Re-sort by different field
3. Generate detailed AI analysis
4. Create visualization
5. Export filtered subset
6. Run another query

Type a number or describe what you need.
```

### Step 6: Handle User Selection

**Option 1 - Filter:** Ask what filter criteria, then use pandas/csvkit to filter and save new file

**Option 2 - Re-sort:** Ask which field, re-read CSV, sort, present new sample

**Option 3 - Detailed AI Analysis:**
- Read full prompt from `references/insight-prompts.md` for this resource type
- Read more of the CSV (up to token limits)
- Generate comprehensive analysis with specific recommendations

**Option 4 - Visualization:**
- Determine appropriate chart type from insight-prompts.md suggestions
- Generate Python/Matplotlib code
- Execute and save image to `data/google-ads/charts/`
- Return image path

**Option 5 - Export Subset:**
- Ask for filter criteria
- Create new CSV with filtered data
- Report file path

**Option 6 - New Query:**
- Ask for new resource/account/timeframe

## Resources Reference

See `references/resources.md` for complete mapping of short names to GAQL files.

**Common resources:**
- `search-terms` - Search query report
- `campaigns` - Campaign performance
- `keywords` - Keyword performance
- `quality` - Quality Score breakdown
- `ads` - Ad performance
- `budgets` - Campaign budgets and targets
- `conversions` - Conversion actions
- `devices` - Performance by device
- `geo` - Geographic performance
- `zero-conv` - Keywords with spend but no conversions
- `disapproved` - Disapproved ads

## Data Formatting

When displaying data:
- **Currency:** Divide cost_micros by 1,000,000, use account currency symbol
- **Percentages:** Multiply decimals by 100 (CTR: 0.0633 → 6.33%)
- **Large numbers:** Use thousands separators

## Error Handling

**Account not found:**
```
Account "{input}" not found.

Available accounts:
- Swimwear Galore (swg, swimwear)
- Mr Pool Man (mpm)
- Scottish Shutters (ssc)

Which account did you mean?
```

**Resource not recognized:**
```
Resource "{input}" not recognized.

Did you mean one of these?
1. search-terms - Search query report
2. campaigns - Campaign performance
3. keywords - Keyword performance

Type the number or resource name.
```

**Query fails:**
- Show error message from API
- Suggest common fixes (invalid date range, missing permissions)
- Offer to try with different parameters

## Bundled Resources

- **scripts/query.js** - Execute GAQL queries, save to CSV
- **references/resources.md** - Short name → GAQL file mappings
- **references/insight-prompts.md** - AI analysis prompts per resource
- **references/*.gaql** - 31 GAQL query templates

## Configuration

- **Credentials:** `~/google-ads.yaml`
- **Account aliases:** `.claude/accounts.json`
- **Output directory:** `data/google-ads/`

## Example Interaction

**User:** `/google-ads swg search-terms 60d`

**Assistant:**
```
## Query Complete

**Account:** Swimwear Galore
**Resource:** search-terms (60 days)
**File:** data/google-ads/20251120-swg-search-terms.csv
**Rows:** 3,847

### Sample Data

| search_term | clicks | impressions | cost | conversions |
|-------------|--------|-------------|------|-------------|
| pool pump   | 342    | 8,291       | $892 | 12          |
| chlorine    | 289    | 6,102       | $654 | 8           |
| pool filter | 156    | 4,823       | $423 | 5           |

### Quick Insights

- Cost ranges from $0.08 to $892.45 (median: $3.12)
- 1,247 terms with 0 conversions (32% of total, $4,892 spend)
- Top 10 terms account for 38% of total spend ($12,456)
- Avg CTR: 3.8%, range 0.1% to 14.2%

### What's Next?

1. Filter high-cost zero-conversion terms
2. Re-sort by impressions
3. Generate detailed AI analysis
4. Create visualization (cost vs. conversions scatter)
5. Export filtered subset
6. Run another query

Type a number or describe what you need.
```

**User:** `3`

**Assistant:** [Generates detailed analysis using search-terms prompt from insight-prompts.md]
