# Google Ads Resources

Short name mappings for the `/google-ads` command. Users type short names; skill maps to GAQL files.

## Resource Mappings

| Short Name | GAQL File | Description |
|------------|-----------|-------------|
| `search-terms` | search-terms.gaql | Search query report with clicks, cost, conversions |
| `campaigns` | campaigns-performance.gaql | Campaign performance metrics |
| `keywords` | keywords-by-cost.gaql | Keyword performance sorted by cost |
| `quality` | quality-score.gaql | Quality Score breakdown (expected CTR, ad relevance, landing page) |
| `ads` | ad-performance.gaql | Ad performance with headlines, descriptions |
| `budgets` | campaign-budgets-and-targets.gaql | Campaign budgets and bidding targets |
| `conversions` | conversion-actions.gaql | Conversion action performance |
| `devices` | device-performance.gaql | Performance by device type |
| `geo` | geographic-performance.gaql | Geographic performance by location |
| `settings` | campaign-settings.gaql | Campaign settings and configuration |
| `disapproved` | disapproved-ads.gaql | Disapproved ads with policy details |
| `duplicates` | duplicate-keywords.gaql | Duplicate keywords across ad groups |
| `zero-conv` | zero-conversion-keywords.gaql | Keywords with spend but no conversions |
| `sitelinks` | sitelink-extensions.gaql | Sitelink extension performance |
| `callouts` | callout-extensions.gaql | Callout extension performance |
| `calls` | call-extensions.gaql | Call extension performance |
| `snippets` | structured-snippet-extensions.gaql | Structured snippet performance |
| `network` | network-performance.gaql | Performance by network (Search, Display, etc.) |
| `attribution` | conversion-attribution.gaql | Conversion attribution data |
| `ad-strength` | ad-coverage-and-strength.gaql | Ad coverage and RSA strength |
| `budget-constraints` | budget-constraints.gaql | Budget-constrained campaigns |
| `conv-performance` | campaign-conversion-performance.gaql | Campaign conversion performance detail |
| `ext-coverage` | extension-coverage.gaql | Extension coverage analysis |
| `account-scale` | account-scale.gaql | Account scale metrics |
| `ad-concentration` | ad-concentration.gaql | Ad spend concentration |
| `keyword-concentration` | keyword-concentration.gaql | Keyword spend concentration |
| `spend-concentration` | spend-concentration.gaql | Overall spend concentration |
| `conv-concentration` | conversion-concentration.gaql | Conversion concentration analysis |
| `landing-pages` | landing-pages.gaql | Landing page performance (clicks, cost, conversions by URL) |
| `unmatched` | unmatched-search-terms.gaql | Search terms with no matching keyword (status=NONE) |
| `account-yesterday` | account-yesterday.gaql | Account-level yesterday metrics for daily monitoring |
| `daily-conv` | daily-conversions.gaql | Daily conversion trends over time |
| `assets` | asset-performance.gaql | Asset (headline/description) performance with labels |
| `geo-targeting` | geo-targeting.gaql | Geographic targeting and performance |
| `negatives-campaign` | negatives-campaign.gaql | Campaign-level negative keywords (filter for negative=true, keyword.text not empty) |
| `negatives-adgroup` | negatives-adgroup.gaql | Ad group-level negative keywords (filter for negative=true, keyword.text not empty) |
| `negatives-lists` | negatives-lists.gaql | Negative keyword lists (shared sets, type=2) |
| `adgroups` | adgroup-structure.gaql | Ad group structure with performance |

## Fuzzy Matching

When user input doesn't exactly match, use these patterns:

- "search", "queries", "terms" → `search-terms`
- "campaign", "camps" → `campaigns`
- "keyword", "kw", "kws" → `keywords`
- "qs", "quality score" → `quality`
- "ad", "ads", "creatives" → `ads`
- "budget", "budgets", "spend limits" → `budgets`
- "conversion", "conv", "goals" → `conversions`
- "device", "mobile", "desktop" → `devices`
- "location", "geo", "geographic" → `geo`
- "disapproved", "policy", "violations" → `disapproved`
- "duplicate", "dupe", "dupes" → `duplicates`
- "zero", "no conversions", "wasted" → `zero-conv`
- "sitelink", "site link" → `sitelinks`
- "callout" → `callouts`
- "call", "phone" → `calls`
- "snippet", "structured" → `snippets`
- "landing", "landing page", "pages", "urls" → `landing-pages`
- "unmatched", "no match", "none status" → `unmatched`
- "yesterday", "daily", "account yesterday" → `account-yesterday`
- "daily conversions", "conversion trend", "daily conv" → `daily-conv`
- "asset", "assets", "headlines", "descriptions", "rsa assets" → `assets`
- "geo", "geographic", "targeting", "locations" → `geo-targeting`
- "negative campaign", "campaign negatives" → `negatives-campaign`
- "negative adgroup", "adgroup negatives" → `negatives-adgroup`
- "negative lists", "shared negatives", "exclusion lists" → `negatives-lists`
- "adgroup", "ad group", "structure", "adgroups" → `adgroups`

## Default Sorting

Most resources default to `cost DESC`. Exceptions:

- `quality` → `quality_score ASC` (show worst first)
- `disapproved` → `impressions DESC`
- `duplicates` → `keyword_text ASC`

## Common Combinations

Users often want these together:

- **Account health**: `quality`, `disapproved`, `zero-conv`
- **Performance**: `campaigns`, `keywords`, `search-terms`
- **Extensions**: `sitelinks`, `callouts`, `calls`, `snippets`
- **Budget**: `budgets`, `budget-constraints`
- **Concentration**: `ad-concentration`, `keyword-concentration`, `spend-concentration`
