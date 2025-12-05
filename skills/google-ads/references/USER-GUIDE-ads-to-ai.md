# Google Ads Data & Operations System

**For: Ads to AI Community Members**
**Updated: November 2025**

A token-efficient system for querying Google Ads data and executing account operations through Claude Code.

---

## What This Is

A set of tools that lets Claude Code work with your Google Ads accounts without flooding the context window with data.

**The problem it solves:**
- Running a Google Ads query for 1000 rows through MCP = 98,000 tokens
- That's half your context window gone before Claude even responds
- With large datasets, you'd hit token limits constantly

**How this system works:**
- Queries run as standalone scripts
- Data saves directly to CSV files
- Claude only sees: "File saved. 1000 rows."
- That's ~20 tokens instead of 98,000 tokens

**Result:** You can work with large Google Ads datasets without context window problems.

---

## What's Included

### 1. Query Tool (`google-ads-query.js`)

Execute saved GAQL queries and export to CSV:

**Features:**
- 30+ pre-built queries for common reports
- Dynamic date range calculation (respects account timezone)
- Outputs CSV for analysis/visualization
- Returns only file path to context (not the data)

**Use cases:**
- Search term analysis (find expensive queries, negative keyword opportunities)
- Campaign performance reports
- Keyword analysis (quality score, spend, conversions)
- Ad performance and strength reviews
- Extension coverage audits
- Conversion tracking analysis

### 2. Mutation Tool (`google-ads-mutate.js`)

Execute write operations on Google Ads accounts:

**Current operations:**
- Create campaigns (with budget, targeting, bidding strategy)
- Pause campaigns
- Update campaign budgets

**Safety features:**
- Dry-run by default (shows preview without making changes)
- Requires `--execute` flag for real mutations
- All operations logged for audit trail
- Campaigns created as PAUSED for safety

**Future operations** (build as needed):
- Keyword management (add, remove, update bids, negatives)
- Ad creation and management (RSAs, pausing, copying)
- Location targeting updates
- Extension management (sitelinks, callouts)

### 3. Pre-Built Query Library

30+ saved GAQL queries organized by use case:

**Campaign analysis:**
- Performance metrics with ROAS
- Budget and target settings
- Budget constraints (lost impression share)
- Settings and configuration audits

**Keyword analysis:**
- Keywords by cost/performance
- Quality score breakdowns
- Duplicate keyword detection
- Zero-conversion keywords

**Creative analysis:**
- Ad performance metrics
- RSA strength and coverage
- Disapproved ads
- Ad distribution per ad group

**Extension analysis:**
- Coverage by campaign
- Sitelink, callout, call extension details

**Conversion tracking:**
- Conversion actions and attribution
- Campaign-level conversion performance

---

## Getting Started

### Prerequisites

1. **Claude Code** (desktop app or CLI)
2. **Node.js** installed on your machine
3. **Google Ads API credentials** (`~/google-ads.yaml` file)
4. **Access to your Google Ads accounts** via API

### Setup Steps

**1. Copy the system to your Brain repo**

The system lives in `code/google-ads/`:
```
code/google-ads/
├── google-ads-query.js          # Query tool
├── google-ads-mutate.js         # Mutation tool
├── lib/                         # Shared utilities
│   ├── auth.js
│   ├── accounts.js
│   └── logger.js
├── queries/                     # 30+ saved queries
│   ├── search-terms.gaql
│   ├── campaigns-performance.gaql
│   └── ... (30 total)
└── package.json
```

**2. Install dependencies**

```bash
cd code/google-ads
npm install
```

This installs:
- `google-ads-api` (v21.0.1) - Official Google Ads API library
- `yaml` (v2.6.1) - For reading credentials

**3. Configure your accounts**

Create `.claude/accounts.json` with your Google Ads accounts:

```json
{
  "my_main_account": {
    "id": "1234567890",
    "name": "My Business",
    "currency": "USD",
    "type": "client",
    "login_customer_id": "9876543210",
    "aliases": ["main", "primary"]
  }
}
```

Fields:
- `id` - Google Ads customer ID (digits only, no dashes)
- `name` - Friendly name for the account
- `currency` - Account currency (USD, AUD, GBP, etc.)
- `type` - "client" or "manager" (MCC)
- `login_customer_id` - MCC ID if account is managed by an MCC
- `aliases` - Short names you can use to reference the account

**4. Test the query tool**

```bash
node google-ads-query.js \
  --customer-id=1234567890 \
  --login-customer-id=9876543210 \
  --query="SELECT campaign.name, metrics.clicks FROM campaign LIMIT 10" \
  --output=test.csv
```

You should see:
```
File: /path/to/test.csv
Rows: 10
```

---

## Using the Query Tool

### Basic Usage

```bash
node google-ads-query.js \
  --customer-id=YOUR_CUSTOMER_ID \
  --login-customer-id=YOUR_MCC_ID \
  --query="$(cat queries/search-terms.gaql)" \
  --output=data/search-terms.csv
```

### With Custom Date Range

Override the default 30-day lookback:

```bash
node google-ads-query.js \
  --customer-id=YOUR_CUSTOMER_ID \
  --query="$(cat queries/campaigns-performance.gaql)" \
  --days=90 \
  --output=data/campaigns-90days.csv
```

The script:
1. Gets your account timezone
2. Calculates date range (today minus 90 days)
3. Replaces `DURING LAST_30_DAYS` with `BETWEEN '2025-08-01' AND '2025-11-05'`

### With Claude Code (Natural Language)

Once set up, you can ask Claude:

> "Get search terms for my main account from the last 120 days"

Claude will:
1. Map "my main account" to customer ID from accounts.json
2. Select the search-terms.gaql query
3. Run with --days=120
4. Save to CSV and report: "File saved. 1000 rows."

---

## Using the Mutation Tool

### Dry-Run Mode (Default)

**Always run dry-run first** to preview changes:

```bash
node google-ads-mutate.js create-campaign \
  --account="My Business" \
  --name="Spring Sale Campaign" \
  --budget=50.00
```

Output:
```json
{
  "status": "dry_run",
  "operation": "create_campaign",
  "account": "My Business",
  "customer_id": "1234567890",
  "campaign_name": "Spring Sale Campaign",
  "budget_amount": "$50.00",
  "message": "Dry run - no changes made. Run with --execute to create campaign."
}
```

### Execute Mode

When you're ready to make real changes:

```bash
node google-ads-mutate.js create-campaign \
  --account="My Business" \
  --name="Spring Sale Campaign" \
  --budget=50.00 \
  --execute
```

Output:
```json
{
  "status": "success",
  "operation": "create_campaign",
  "account": "My Business",
  "campaign_id": "customers/1234567890/campaigns/9999999",
  "campaign_status": "PAUSED",
  "message": "Campaign created successfully (PAUSED for safety)"
}
```

**Note:** Campaigns are created PAUSED. Enable them manually in Google Ads UI after reviewing settings.

### Available Operations

**Create campaign:**
```bash
node google-ads-mutate.js create-campaign \
  --account="My Business" \
  --name="Campaign Name" \
  --budget=50.00 \
  [--execute]
```

**Pause campaign:**
```bash
node google-ads-mutate.js pause-campaign \
  --account="My Business" \
  --campaign-id=12345 \
  [--execute]
```

**Update budget:**
```bash
node google-ads-mutate.js update-budget \
  --account="My Business" \
  --campaign-id=12345 \
  --budget=75.00 \
  [--execute]
```

### Audit Trail

All mutations are logged to `logs/google-ads-mutations/YYYYMMDD.log`:

```json
{"timestamp":"2025-11-05T10:30:00.000Z","status":"success","operation":"create_campaign","account":"My Business","customer_id":"1234567890","campaign_id":"customers/1234567890/campaigns/9999999"}
```

---

## Available Queries

See `queries/README.md` for full list. Highlights:

**Campaign analysis:**
- `campaign-budgets-and-targets.gaql` - Budgets and bidding strategies
- `campaigns-performance.gaql` - Performance metrics with ROAS
- `budget-constraints.gaql` - Budget-limited campaigns

**Search terms & keywords:**
- `search-terms.gaql` - Search query performance (ordered by cost)
- `keywords-by-cost.gaql` - Top spending keywords
- `quality-score.gaql` - Quality score breakdown

**Creative:**
- `ad-performance.gaql` - Individual ad metrics
- `ad-coverage-and-strength.gaql` - RSA strength ratings

**Extensions:**
- `sitelink-extensions.gaql` - Sitelink details
- `callout-extensions.gaql` - Callout text

---

## Common Workflows

### 1. Search Term Analysis → Negative Keywords

```bash
# Get expensive search terms
node google-ads-query.js \
  --customer-id=YOUR_ID \
  --query="$(cat queries/search-terms.gaql)" \
  --days=30 \
  --output=data/search-terms.csv

# Analyze in spreadsheet
# Identify wasted spend terms

# Add negative keywords (manually in UI for now)
# Future: Use google-ads-mutate.js add-negative-keywords
```

### 2. Campaign Performance Review

```bash
# Get campaign metrics
node google-ads-query.js \
  --customer-id=YOUR_ID \
  --query="$(cat queries/campaigns-performance.gaql)" \
  --days=90 \
  --output=data/campaigns-90days.csv

# Identify underperformers

# Pause low performers
node google-ads-mutate.js pause-campaign \
  --account="My Business" \
  --campaign-id=12345 \
  --execute
```

### 3. Budget Reallocation

```bash
# Check current budgets and performance
node google-ads-query.js \
  --customer-id=YOUR_ID \
  --query="$(cat queries/campaign-budgets-and-targets.gaql)" \
  --output=data/budgets.csv

# Update high-performer budgets
node google-ads-mutate.js update-budget \
  --account="My Business" \
  --campaign-id=12345 \
  --budget=150.00 \
  --execute
```

---

## Tips & Best Practices

### Query Tips

**1. Start with saved queries**
Don't write GAQL from scratch. Use the 30+ queries in `queries/` folder as starting points.

**2. Use appropriate date ranges**
- Last 7 days: Recent trends, quick checks
- Last 30 days: Standard reporting
- Last 90 days: Seasonal patterns, longer-term trends

**3. Export large datasets**
Don't try to analyze 10,000 rows in Claude's context. Export to CSV and use spreadsheets/BI tools.

**4. Save custom queries**
If you write a useful query, save it as a `.gaql` file in `queries/` for reuse.

### Mutation Tips

**1. Always dry-run first**
Preview changes before executing. Catch mistakes early.

**2. Start with low-risk operations**
- Pause campaigns (easily reversible)
- Update budgets (can change back)
- Create campaigns (created PAUSED)

**3. Check audit logs**
Review `logs/google-ads-mutations/` to see operation history.

**4. Test on non-critical accounts first**
If you have test accounts, practice there before touching production.

---

## Extending the System

### Adding New Queries

1. Write GAQL query
2. Save as `queries/your-query-name.gaql`
3. Use `DURING LAST_30_DAYS` for date filtering (enables dynamic ranges)
4. Test with google-ads-query.js
5. Add description to `queries/README.md`

### Requesting New Operations

Current operations are just the foundation. As you use the system, you'll identify operations you need frequently.

**To request new operations:**
1. Describe the task (what you want to accomplish)
2. Ask Claude Code to implement it
3. Implementation takes ~2-4 hours per operation
4. Test dry-run, then execute
5. Operation is now available for future use

**Examples of operations you might need:**
- Add keywords to ad groups
- Create RSAs with specific copy
- Add negative keywords at scale
- Copy top-performing campaigns
- Update location targeting

Build operations organically based on actual needs rather than trying to build everything upfront.

---

## Troubleshooting

### "Error: Accounts file not found"

Create `.claude/accounts.json` with your account details (see Setup step 3).

### "Error: Cannot read credentials"

Ensure `~/google-ads.yaml` exists with valid API credentials.

### "Permission denied" errors

Check that your Google Ads API credentials have access to the accounts you're querying.

### "Unknown resource" in query

The field you're trying to query doesn't exist. Check the Google Ads API field documentation or use a pre-built query as reference.

### Dry-run works but execute fails

This is usually a validation error (budget too low, targeting conflicts, etc.). Check the error details in the response.

---

## Support

This system is community-supported through Ads to AI.

**For help:**
- Post in the Ads to AI community (technical questions, implementation help)
- Share your workflows (show others what you've built)
- Request features (new operations you need)

**Contribute back:**
- Share useful queries you create
- Document workflows that work well
- Help other community members get started

---

## What This Enables

With this system, you can:

**Analyze at scale:**
- Pull large datasets without context window limits
- Run complex queries across multiple accounts
- Export data for visualization and deeper analysis

**Automate operations:**
- Create campaign structures programmatically
- Bulk update budgets based on performance
- Pause/enable campaigns based on rules
- Build custom workflows with Claude Code

**Work efficiently:**
- Token-efficient queries (20 tokens vs 98,000)
- Pre-built queries for common tasks
- Audit trail for all changes
- Safe dry-run mode

This bridges the gap between manual Google Ads management and full automation. You get the power of programmatic access with the safety and flexibility of Claude Code's natural language interface.
