---
name: search-term-classifier
description: |
  Classify search terms by intent at scale. AUTO-ACTIVATE when user mentions: classify search terms, categorize queries, intent classification, search term analysis.
---

# Search Term Classifier Skill

Classifies search terms from Search, Shopping, and PMax campaigns into intent categories.

## Usage

**Always use the pipeline script.** This is the ONLY way to run classification:

```bash
node .claude/skills/search-term-classifier/scripts/pipeline.js \
  --account=<alias> \
  --days=<days>
```

### Examples

```bash
# Classify SWG search terms for last 90 days
node .claude/skills/search-term-classifier/scripts/pipeline.js --account=swg --days=90

# Classify MPM with LLM for remaining terms
node .claude/skills/search-term-classifier/scripts/pipeline.js --account=mpm --days=180 --run-llm

# Classify with limited LLM calls
node .claude/skills/search-term-classifier/scripts/pipeline.js --account=ssc --days=30 --run-llm --llm-limit=500
```

### Pipeline Options

| Option | Description |
|--------|-------------|
| `--account` | **Required.** Account alias (swg, mpm, ssc, etc.) |
| `--days` | Date range in days (default: 30) |
| `--run-llm` | Run LLM classification on unclassified terms |
| `--llm-limit` | Max terms for LLM (default: 1000) |
| `--skip-open` | Don't open report in browser |

## What the Pipeline Does

The pipeline automatically handles everything:

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Fetch search terms (Search + Shopping campaigns)   │
│          Includes campaign.advertising_channel_type         │
├─────────────────────────────────────────────────────────────┤
│  STEP 2: Aggregate by term + channel type                   │
│          Deduplicates ad group level → account level        │
├─────────────────────────────────────────────────────────────┤
│  STEP 3: Fetch PMax categories                              │
│          Gracefully skips if no PMax campaigns exist        │
├─────────────────────────────────────────────────────────────┤
│  STEP 4: Combine all sources                                │
│          S=Search, Sh=Shopping, P=PMax                      │
├─────────────────────────────────────────────────────────────┤
│  STEP 5: Classify (rules + cache + optional LLM)            │
│          See classification pipeline below                   │
├─────────────────────────────────────────────────────────────┤
│  STEP 6: Generate HTML report                               │
│          Interactive with source toggles (S/Sh/P)           │
├─────────────────────────────────────────────────────────────┤
│  STEP 7: Open report in browser                             │
└─────────────────────────────────────────────────────────────┘
```

## Intent Categories

| Category | Description | Detection Method |
|----------|-------------|-----------------|
| `brand` | Your brand terms | Matched from `brand_strings` in accounts.json |
| `navigational` | Competitor brand searches | Matched from `competitor_brands` in accounts.json |
| `high_intent` | Ready to buy | Signal words: buy, price, near me, sale, discount, best, compare |
| `medium_intent` | Product searches, unclear signal | Default for product terms without clear signals |
| `low_intent` | Learning, researching | Signal words: how to, what is, why, guide, tutorial, tips |
| `negative` | Won't convert | Signal words: jobs, reddit, images, free pdf, login |
| `low_volume` | Bottom 5% by impressions | Low volume terms - insufficient data for classification |
| `non_latin` | Non-Latin characters | >50% non-Latin in Latin-dominant account |

## Classification Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  1. LANGUAGE CHECK - Flag non-Latin if <50% Latin chars     │
├─────────────────────────────────────────────────────────────┤
│  2. LOW VOLUME - Bottom 5% by impressions → low_volume      │
├─────────────────────────────────────────────────────────────┤
│  3. BRAND STRINGS - Match against accounts.json             │
│     (Can override low_volume for brand terms)               │
├─────────────────────────────────────────────────────────────┤
│  4. COMPETITOR STRINGS - Match competitors/sold brands      │
├─────────────────────────────────────────────────────────────┤
│  5. CACHE LOOKUP - Prior LLM classifications                │
├─────────────────────────────────────────────────────────────┤
│  6. SIGNAL-BASED - TRUE intent signals only                 │
├─────────────────────────────────────────────────────────────┤
│  7. SIMILARITY - Levenshtein/Soundex for brand typos        │
├─────────────────────────────────────────────────────────────┤
│  8. CACHE PREDICTION - Word→category from cached data       │
├─────────────────────────────────────────────────────────────┤
│  9. LLM CLASSIFICATION (if --run-llm)                       │
│     Classifies TOP N terms by impressions                   │
├─────────────────────────────────────────────────────────────┤
│ 10. ML PROPAGATION (automatic after LLM)                    │
│     TF-IDF, n-grams, word patterns, KNN similarity          │
├─────────────────────────────────────────────────────────────┤
│ 11. DEFAULT REMAINING → medium_intent                       │
└─────────────────────────────────────────────────────────────┘
```

## Signal-Based Classification

Only TRUE intent signals are used - NOT modifiers like "australia", "womens", "size".

### High Intent Signals
```
Purchase: buy, buying, purchase, order, ordering
Price:    price, prices, pricing, cost, costs, quote
Deals:    cheap, cheapest, discount, deal, sale, clearance, outlet
Local:    near, nearby, closest, nearest, local
Compare:  best, top, vs, versus, compare, review, reviews
Shopping: shop, store, stockist, retailer, buy online
```

### Low Intent Signals
```
Questions: how, what, why, when, where, which, should
Learning:  guide, tutorial, learn, meaning, definition, tips, advice
Problems:  problem, issue, trouble, fix, broken, repair
```

### Negative Signals
```
Jobs:       job, jobs, career, salary, hiring, vacancy
DIY:        diy, homemade, make your own
Free:       free download, free pdf, free template
Platforms:  reddit, pinterest, youtube, tiktok, forum, wiki
Media:      images, photos, pictures, wallpaper, meme, video
Account:    login, sign in, account, password
Complaints: scam, legit, complaint, refund
```

## Cache

**Location:** `data/search-term-cache.db`

SQLite database storing **only LLM-classified terms** for reuse across runs. Rule-based classifications (signals, brands, low-volume, etc.) are NOT cached since rules can be reapplied instantly.

**Schema (lean, 3 columns):**
```sql
CREATE TABLE classifications (
    account_id TEXT NOT NULL,
    search_term_normalized TEXT NOT NULL,
    category TEXT NOT NULL,
    UNIQUE(account_id, search_term_normalized)
);
```

## Brand Detection Setup

Configure in `.claude/accounts.json`:

```json
{
  "account_alias": {
    "id": "1234567890",
    "name": "Account Name",
    "brand_strings": ["mybrand", "my brand"],
    "competitor_brands": ["competitor1", "competitor2"],
    "currency": "AUD"
  }
}
```

## LLM Cost/Time Estimates

| LLM Terms | Model | Est. Cost | Est. Time |
|-----------|-------|-----------|-----------|
| 500 | Gemini 2.5 Flash | ~$0.01 | ~15s |
| 1,000 | Gemini 2.5 Flash | ~$0.02 | ~25s |
| 2,000 | Gemini 2.5 Flash | ~$0.04 | ~45s |

## Output Files

All files saved to `data/google-ads/{account}/`:

| File | Description |
|------|-------------|
| `{date}-{account}-raw.csv` | Raw search terms from API |
| `{date}-{account}-aggregated.csv` | Aggregated by term + channel |
| `{date}-{account}-pmax.csv` | PMax categories |
| `{date}-{account}-combined.csv` | All sources combined |
| `{date}-{account}-classified.csv` | Final classified data |
| `{date}-{account}-report.html` | Interactive HTML report |

## Report Features

The HTML report includes:
- **Source toggles**: Filter by Search (S), Shopping (Sh), or PMax (P)
- **Category breakdown**: Visual charts showing intent distribution
- **Sortable table**: All terms with metrics
- **Search/filter**: Find specific terms
- **Export**: Download filtered data
