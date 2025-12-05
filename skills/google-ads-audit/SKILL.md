---
name: google-ads-audit
description: |
  Comprehensive Google Ads account audit with charts, insights, and multi-format reports (HTML, PDF, email).
  USE WHEN user asks to audit an account, create account report, monthly review, or comprehensive analysis.
  Triggers: "audit", "account audit", "monthly review", "comprehensive report", "account analysis"
---

# Google Ads Account Audit

Generate comprehensive account audits with data analysis, charts, and professional reports.

## Command Format

```
/google-ads-audit <account> [days]
```

**Examples:**
- `/google-ads-audit swg` - Swimwear Galore, 30 days (default)
- `/google-ads-audit mpm 90d` - Mr Pool Man, 90 days

## Process

### Step 1: Run Audit

Execute the main audit script:

```bash
python3 /Users/mikerhodes/Projects/brain/.claude/skills/google-ads-audit/scripts/run_audit.py \
  --account {account} \
  --days {days}
```

**Parameters:**
- `--account` (required) - Account name, alias, or key from accounts.json (e.g., "swg", "swimwear", "Swimwear Galore")
- `--account-name` (optional) - Explicit folder name in data/google-ads/. If not provided, auto-detects based on existing folders matching account aliases.
- `--days` (optional) - Number of days, default 30

**Examples:**
```bash
# Auto-detect folder (finds existing 'swg' folder)
python3 run_audit.py --account swg --days 30

# Explicit folder name
python3 run_audit.py --account swimwear_galore --account-name swg --days 30

# Using full account name (will match 'mpm' folder from aliases)
python3 run_audit.py --account "Mr Pool Man" --days 90
```

This script:
1. Resolves account from aliases in accounts.json
2. Auto-detects or creates account folder in data/google-ads/
3. Runs all audit queries via google-ads skill
4. Filters data (removes 0-impression rows)
5. Calculates metrics and insights
6. Generates charts
7. Creates HTML and PDF reports
8. Optionally sends email

### Step 2: Review Output

The audit creates files in per-account folders:
```
data/google-ads/{account-name}/{YYYYMMDD}-audit/
├── data/
│   ├── campaigns.csv
│   ├── keywords.csv
│   ├── search-terms.csv
│   ├── assets.csv
│   ├── daily-conv.csv
│   └── ...
├── charts/
│   ├── daily-conversions.png
│   ├── campaign-spend.png
│   ├── roas-by-campaign.png
│   ├── forecast.png
│   ├── period-comparison.png
│   └── conversion-actions.png
├── report.html
├── report.pdf
└── audit-data.json
```

**Example output paths:**
- `data/google-ads/swg/20251130-audit/report.html`
- `data/google-ads/mpm/20251130-audit/report.html`

### Step 3: Present Results

After audit completes, present:
1. Summary stats (total spend, conversions, ROAS)
2. Key findings (top 5 issues/opportunities)
3. File locations
4. Offer to email report or export to Slides

## Audit Components

### Data Collected

| Component | Query | Purpose |
|-----------|-------|---------|
| Campaigns | campaigns-performance | Overall campaign health |
| Keywords | keywords-by-cost | Keyword performance |
| Search Terms | search-terms | Query analysis |
| Assets | asset-performance | RSA headline/description performance |
| Ad Groups | adgroup-structure | Account structure |
| Daily Trends | daily-conversions | Performance over time |
| Geographic | geo-targeting | Location performance |
| Negatives | negatives-* | Negative keyword audit |
| Unmatched | unmatched-search-terms | Missing keyword opportunities |

### Charts Generated

1. **Daily Conversions Trend** - Line chart showing conversions and cost over time
2. **Campaign Spend Distribution** - Bar chart of top campaigns by spend
3. **ROAS by Campaign** - Bar chart comparing ROAS across campaigns
4. **Device Performance** - Pie chart of spend by device
5. **Top Keywords** - Horizontal bar chart of top 10 keywords by conversions

### Insights Generated

- Total account metrics (spend, conversions, value, ROAS)
- Top/bottom performers
- Zero-conversion spend analysis
- Quality Score distribution
- Asset performance labels (BEST/LOW)
- Negative keyword coverage
- Geographic opportunities

## Report Sections

1. **Executive Summary** - Key metrics and highlights
2. **Campaign Performance** - Table with all campaigns
3. **Keyword Analysis** - Top performers and issues
4. **Search Term Insights** - Opportunities and negatives
5. **Asset Performance** - Headlines/descriptions by performance label
6. **Geographic Analysis** - Performance by location
7. **Trends** - Charts showing performance over time
8. **Recommendations** - Prioritized action items

## Email Delivery

To email the report:

```bash
python3 scripts/send_report.py \
  --audit-dir data/google-ads/{account-name}/{YYYYMMDD}-audit/ \
  --to mike@example.com
```

Sends:
- HTML report as email body (charts inline)
- PDF attached

## Google Slides Export

To create a presentation:

```bash
python3 scripts/export_slides.py \
  --audit-dir data/google-ads/{account-name}/{YYYYMMDD}-audit/ \
  --title "Account Audit - {Account Name}"
```

Creates a Google Slides presentation with:
- Title slide with date and summary
- One slide per major section
- Charts embedded
- Key metrics highlighted

## Dependencies

- Python 3.9+
- pandas
- matplotlib
- weasyprint (for PDF)
- google-auth, google-api-python-client (for Slides)

Install:
```bash
pip3 install pandas matplotlib weasyprint google-auth google-api-python-client
```

## Configuration

- **Accounts:** `.claude/accounts.json`
- **Output:** `data/google-ads/{account-name}/{YYYYMMDD}-audit/`
- **Templates:** `templates/report.html`

## Error Handling

- If a query fails, log error and continue with others
- If charts fail, include placeholder in report
- If email fails, report is still saved locally
- Always produce at least the markdown report

## Example Output

```
## Audit Complete

**Account:** Swimwear Galore
**Folder:** swg
**Period:** Oct 22 - Nov 20, 2025 (30 days)
**Report:** data/google-ads/swg/20251121-audit/

### Summary
- **Spend:** A$55,523
- **Conversions:** 3,587
- **Value:** A$534,732
- **ROAS:** 9.6x

### Key Findings
1. 847 search terms with $4,892 spend and 0 conversions
2. Top 10 keywords drive 42% of conversions
3. 3 assets marked LOW performance need replacement
4. Mobile ROAS (7.2x) underperforms Desktop (11.3x)
5. 156 unmatched search terms identified as opportunities

### Actions
1. Email report
2. Export to Google Slides
3. View detailed data
4. Run specific analysis
```
