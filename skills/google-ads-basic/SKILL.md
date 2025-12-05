---
name: google-ads-basic
description: |
  Basic Google Ads data using MCP tools. Requires MCP server configured. Get campaigns, search terms, products, and landing pages with LIMIT 10. Only activates via /ads-basic command.
---

# Google Ads Basic Skill

A simplified Google Ads skill for learning MCP integration. Limited to 10 rows per query.

## Requirements

**MCP Server must be configured.** If not working, see setup guide:
https://8020brain.com/google-ads/guides/mcp-server-guide

## Available Resources

1. **campaigns** - Campaign performance
2. **search-terms** - Search query report
3. **products** - Shopping product performance
4. **landing-pages** - Landing page performance

## Usage

```
get campaigns for MPM
show search terms for Scottish Shutters
products for swg
landing pages for mr pool man
```

## Process

### Step 1: Parse Request

Extract:
1. **Account** - Name or alias (resolve from `.claude/accounts.json`)
2. **Resource** - One of: campaigns, search-terms, products, landing-pages

**Account Resolution:**
- Read `.claude/accounts.json`
- Match by name, key, or alias (case-insensitive)
- Get `id` (customer_id) and `login_customer_id`

### Step 2: Build Query

Load GAQL from `queries/{resource}.gaql` in this skill folder.

Replace `{DATE_RANGE}` with `BETWEEN 'YYYY-MM-DD' AND 'YYYY-MM-DD'` for last 30 days.

### Step 3: Execute via MCP

Use the MCP tool `mcp__google-ads__execute_gaql`:

```
mcp__google-ads__execute_gaql
  customer_id: {customer_id}
  query: {GAQL with dates}
  login_customer_id: {login_customer_id}
```

### Step 4: Display Results

Format the data:
- **Currency:** Divide cost_micros by 1,000,000
- **Percentages:** Multiply decimals by 100 (CTR: 0.0633 → 6.33%)

Show all results (max 10 rows) in a table.

## Example Output

```
## Campaigns for Mr Pool Man (30 days)

| Campaign | Status | Clicks | Impressions | Cost | Conv |
|----------|--------|--------|-------------|------|------|
| Brand    | ENABLED| 245    | 3,892       | $423 | 18   |
| Non-Brand| ENABLED| 189    | 5,621       | $612 | 8    |
...

10 rows returned (limited to 10)
```

## Error Handling

**MCP not configured:**
```
MCP server not available. Please configure it first:
https://8020brain.com/google-ads/guides/mcp-server-guide
```

**Account not found:**
```
Account "{input}" not found.

Available accounts:
- Mr Pool Man (mpm, Pool Man)
- Scottish Shutters (ssc, SSC)

Which account did you mean?
```

## Bundled Queries

- `queries/campaigns.gaql` - Campaign performance
- `queries/search-terms.gaql` - Search term report
- `queries/products.gaql` - Shopping products
- `queries/landing-pages.gaql` - Landing page URLs

## Configuration

- **Account aliases:** `.claude/accounts.json`
- **MCP settings:** `~/.claude/mcp_settings.json`

## Limitations

- **10 rows max** - This is a learning/demo skill
- **30 days only** - Fixed date range
- **4 resources only** - campaigns, search-terms, products, landing-pages
- **MCP only** - Requires MCP server (no API fallback)

For full functionality, use the `google-ads` skill (December update).
