---
name: google-ads-creation
description: Create Google Ads assets and account elements. Use for generating RSAs (responsive search ads), sitelinks, callouts, and other extensions from landing page content. Also for creating campaigns, ad groups, keywords, and negative keywords. Triggers include "create RSA", "generate sitelinks", "write headlines", "create campaign", "add negatives".
---

# Google Ads Creation Skill

Create Google Ads assets, extensions, and account structure from content or specifications.

## Capabilities

### Content Generation (from landing pages)
- **RSAs** - Responsive Search Ads (headlines, descriptions, paths)
- **Sitelinks** - Link text and descriptions
- **Callouts** - Short benefit statements
- **Structured snippets** - Category-based lists

### Account Structure (future)
- Campaigns
- Ad groups
- Keywords
- Negative keywords
- Audiences

## Workflow

### Step 1: Identify What to Create

Parse user request for:
1. **Asset type** - RSA, sitelinks, callouts, etc.
2. **Input** - Landing page URL, CSV file, or manual content
3. **Output format** - Single display, CSV export, or Google Ads Editor format

### Step 2: Load Best Practices

Read the appropriate best practices guide:
- RSA: `references/rsa-best-practices.md`
- Sitelinks: `references/sitelinks-best-practices.md`

### Step 3: Analyze Content

If input is a URL or CSV with page data, extract:
1. **Title Tag** - Main keywords and value proposition
2. **Meta Description** - Marketing copy and benefits
3. **H1** - Primary page focus
4. **Page Content** - Features, benefits, USPs, proof points

### Step 4: Generate Assets

Apply best practices to create compliant, high-performing assets.

**Character limits (critical):**
- Headlines: 30 chars
- Descriptions: 90 chars
- Paths: 15 chars each
- Sitelink text: 25 chars
- Sitelink descriptions: 35 chars each
- Callouts: 25 chars

### Step 5: Validate & Output

- Verify all character limits
- Check for variety (no duplicate messages)
- Format output appropriately

## RSA Generation

### Requirements
- 15 headlines (30 chars each)
- 4 descriptions (90 chars each)
- 2 paths (15 chars each)

### Headline Categories (aim for 2-3 each)
1. **Branded** - Company/brand name
2. **Benefit-focused** - User outcomes
3. **Feature-specific** - Product/service details
4. **CTA-focused** - Action encouragement
5. **Keyword-rich** - With keyword insertion

### Keyword Insertion
Use `{KeyWord:Default Text}` syntax:
- Only default text counts toward character limit
- Use in 3-5 headlines, 1-2 descriptions max
- Default must be grammatically correct standalone

**Example:** `{KeyWord:Yoga Classes} Online` = 18 chars (only "Yoga Classes Online" counts)

### Output Format

**Single URL:**
```
Headlines:
1. [headline] (X/30)
2. [headline] (X/30)
...

Descriptions:
1. [description] (X/90)
...

Paths:
1. [path] (X/15)
2. [path] (X/15)
```

**CSV:** Preserve input columns, add Headline 1-15, Description 1-4, Path 1-2 with lengths.

## Sitelink Generation

### Requirements
- Link Text: 25 chars
- Description Line 1: 35 chars
- Description Line 2: 35 chars

### Writing Principles
- Action-oriented link text (use verbs)
- Complementary descriptions (feature + benefit)
- Natural phrase breaks between lines
- Match landing page tone

### Output Format

```
Link Text (X/25): [text]
Description Line 1 (Y/35): [text]
Description Line 2 (Z/35): [text]
```

## Quality Checklist

Before finalizing any asset:
- [ ] All character limits met
- [ ] No duplicate/repetitive messages
- [ ] Each element works independently
- [ ] Grammar and spelling correct
- [ ] Tone matches landing page
- [ ] No Google Ads policy violations
- [ ] Keyword insertion defaults make sense

## Error Handling

**Content not available:**
- Request URL to fetch, or
- Ask user to provide title/meta/content manually

**Character limit exceeded:**
- Rephrase to shorter wording
- Use abbreviations if clear (CHF, &)
- Remove unnecessary modifiers

## Resources

### Best Practices
- `references/rsa-best-practices.md` - Comprehensive RSA guide
- `references/sitelinks-best-practices.md` - Sitelink writing guide

### Validation Scripts
- `scripts/validate_rsa.py` - Batch RSA validation
- `scripts/validate_sitelinks.py` - Batch sitelink validation

## Examples

**User:** "Create RSAs for this landing page: https://example.com/yoga-classes"

**Process:**
1. Fetch page content (title, meta, H1, body)
2. Read rsa-best-practices.md
3. Extract benefits, features, CTAs, proof points
4. Generate 15 varied headlines, 4 descriptions, 2 paths
5. Validate character limits
6. Output formatted results

**User:** "Generate sitelinks from this CSV"

**Process:**
1. Read CSV with URL metadata
2. Read sitelinks-best-practices.md
3. For each row, generate link text + 2 description lines
4. Validate all limits
5. Output CSV with new columns
