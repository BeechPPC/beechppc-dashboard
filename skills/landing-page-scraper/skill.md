---
name: landing-page-scraper
description: Extract landing page metadata (title tags, meta descriptions, H1 headings, and content) from URLs to prepare data for Google Ads RSA and sitelinks generation. Use when asked to scrape pages, fetch landing page data, extract page metadata, or prepare URLs for ad copy generation.
---

# Landing Page Scraper Skill

Extract metadata from landing page URLs for Google Ads campaign creation. Works with `google-ads-rsa-project` and `google-ads-sitelinks` skills.

## What It Extracts

- **Title Tag** - Main value proposition
- **Meta Description** - Marketing copy
- **H1 Heading** - Primary page focus
- **Main Content** - Body text (~500 chars from paragraphs/lists)

## Workflow

### Step 1: Get URLs

**From user**: Direct URL list provided in conversation

**From Google Ads**: Use MCP tools to query `landing_page_view` or `ad_group_ad` for final URLs

**From CSV**: Extract from "Final URL" or "URL" column

### Step 2: Run Scraper

1. **Start Chrome** (if not running):
   ```bash
   /Users/mikerhodes/Projects/brain/.claude/skills/browser/scripts/start.js
   ```

2. **Run scraper script**:
   ```bash
   node /Users/mikerhodes/Projects/brain/.claude/skills/landing-page-scraper/scripts/scrape.mjs \
     https://example.com/page1 \
     https://example.com/page2 \
     --output /tmp/landing-pages.csv
   ```

   Or with URLs from file:
   ```bash
   node /Users/mikerhodes/Projects/brain/.claude/skills/landing-page-scraper/scripts/scrape.mjs \
     --urls-file /tmp/urls.txt \
     --output /tmp/landing-pages.csv
   ```

### Step 3: Output

CSV file with columns: `Final URL,Title Tag,Meta Description,H1,Content`

Ready for use with:
- `google-ads-rsa-project` skill - Generate RSA headlines/descriptions
- `google-ads-sitelinks` skill - Generate sitelink text/descriptions

## Script Details

**Location**: `scripts/scrape.mjs`

**Dependencies**: `puppeteer-core` (uses project root's node_modules)

**Requirements**: Chrome running with CDP on port 9222

**Options**:
- URLs as arguments: `node scrape.mjs <url1> <url2> ...`
- URLs from file: `node scrape.mjs --urls-file <file.txt>`
- Custom output: `--output <path.csv>`

**Performance**: ~2-3 seconds per URL (sequential scraping)

**Errors**: Returns "ERROR" for failed pages (404s, timeouts) - filter these from output

## Integration Examples

**Scrape and generate RSAs**:
1. Scrape URLs with this skill
2. Pass CSV to `google-ads-rsa-project` skill
3. Get complete RSAs for Google Ads Editor

**Scrape from Google Ads account**:
1. Query account for final URLs
2. Save URLs to file
3. Run scraper
4. Return CSV path
