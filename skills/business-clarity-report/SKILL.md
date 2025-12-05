---
name: business-clarity-report
description: Comprehensive business analysis for PPC client onboarding. Use when the user says "Do a clarity report on [URL]" or requests a business clarity analysis. Generates detailed reports about why a business exists, who they serve, what they do, their USPs, and credibility factors, formatted as Google Slides and PDF deliverables.
---

# Business Clarity Report Skill

This skill automates the creation of comprehensive Business Clarity Reports for new PPC client prospects. It analyzes a business website and generates professional reports in both Google Slides and PDF formats.

## When to Use This Skill

This skill triggers when users request:
- "Do a clarity report on [URL]"
- "Run a business clarity analysis for [URL]"
- "Create a clarity report for [URL]"
- "Analyze this business: [URL]"

**Important**: You have access to the `fetch_website_content` function which allows you to fetch and parse website content. Use this function instead of web_fetch.

## Workflow

### Phase 1: Data Collection

1. **Extract the URL** from the user's request
2. **Use the `fetch_website_content` function** to retrieve website content from:
   - Homepage (start with the main URL)
   - About page (look for /about, /about-us, etc. in links)
   - Services/Products page (look for /services, /products, etc. in links)
   - Testimonials/Reviews page (look for /testimonials, /reviews, etc. in links)
   - Contact page (look for /contact, /contact-us, etc. in links)
   - Any other relevant pages that provide business information

3. **Fetch multiple pages** by:
   - First fetching the main URL
   - Examining the links returned to find relevant pages
   - Calling `fetch_website_content` for each relevant page
   - Combining the content from all pages for comprehensive analysis

### Phase 2: Business Analysis

Analyze the business across six key dimensions:

#### 1. Existential Purpose (Why they exist)
- Mission and vision statements
- Core problem they solve
- Market positioning
- Industry context

#### 2. Target Market (Who they serve)
- **Demographics**: Measurable attributes (age, location, income, business size, etc.)
- **Psychographics**: Values, behaviors, preferences
- **Pain points**: Specific problems they experience
- **Goals**: What they're trying to achieve

#### 3. Offerings (What they do)
- Primary services/products
- Secondary offerings
- Deliverables and scope
- Pricing models (if available)

#### 4. Differentiation (USPs)
- Competitive advantages
- Unique processes or approaches
- Guarantees and promises
- What makes them different from competitors

#### 5. Trust Signals (Proof & credibility)
- Social proof (testimonials, reviews)
- Case studies and results
- Credentials and certifications
- Statistics and milestones
- Awards and recognition

#### 6. PPC Strategy Opportunities
- **Keyword themes**: Primary keyword categories for campaigns
- **Audience targeting**: Specific audiences to target
- **Messaging angles**: Key messages for ad copy
- **Conversion optimization**: Landing page and conversion suggestions

### Phase 3: Data Structuring

Create a structured JSON data file with the following schema:

```json
{
  "metadata": {
    "url": "string",
    "company_name": "string (if available)",
    "analyzed_date": "YYYY-MM-DD",
    "report_type": "Business Clarity Report"
  },
  "sections": {
    "existential_purpose": {
      "title": "Why [Company] Exists",
      "content": "paragraph overview",
      "problems_solved": ["array"],
      "mission": "string",
      "vision": "string",
      "market_positioning": "string"
    },
    "target_market": {
      "title": "Who [Company] Serves",
      "content": "paragraph overview",
      "demographics": ["array"],
      "psychographics": ["array"],
      "pain_points": ["array"],
      "goals": ["array"]
    },
    "offerings": {
      "title": "What [Company] Does",
      "content": "paragraph overview",
      "primary_services": ["array"],
      "secondary_offerings": ["array"],
      "deliverables": ["array"]
    },
    "differentiation": {
      "title": "Unique Selling Points",
      "content": "paragraph overview",
      "competitive_advantages": ["array"],
      "unique_processes": ["array"],
      "guarantees": ["array"]
    },
    "trust_signals": {
      "title": "Proof & Credibility",
      "content": "paragraph overview",
      "testimonials": ["array"],
      "case_studies": ["array"],
      "credentials": ["array"],
      "statistics": ["array"]
    },
    "ppc_strategy": {
      "title": "PPC Strategy Opportunities",
      "content": "paragraph overview",
      "keyword_themes": ["array"],
      "audience_targeting": ["array"],
      "messaging_angles": ["array"],
      "conversion_suggestions": ["array"]
    }
  }
}
```

Save this JSON to `skills/business-clarity-report/spacegenie_analysis_data.json` (or similar filename based on company name).

### Phase 4: Report Generation

Generate two professional reports:

#### Google Slides Presentation (.pptx)

Use the `pptx` skill to create a presentation with:

1. **Title Slide**
   - Company name and logo (if available)
   - "Business Clarity Report"
   - Date of analysis
   - Beech PPC branding

2. **Executive Summary Slide**
   - 3-4 key insights
   - Overview of the business
   - Main opportunities

3. **Six Section Slides** (one for each analysis dimension)
   - Clear section title
   - Key bullet points
   - Visual hierarchy

4. **Brand Colors**:
   - Primary: #003366 (dark blue)
   - Secondary: #0066CC (medium blue)
   - Accent: #00CC99 (teal)
   - Text: #333333 (dark gray)

#### PDF Report

Use the `pdf` skill to create a comprehensive written report with:

1. **Cover Page**
   - Company name
   - Report title
   - Date
   - Beech PPC branding

2. **Executive Summary**
   - Overview paragraph
   - Key findings

3. **Detailed Sections**
   - One section for each of the six dimensions
   - Bullet points for key information
   - Professional typography

4. **Professional Formatting**
   - Clear headings
   - Consistent spacing
   - Print-ready layout

### Phase 5: Delivery

1. Save both files to `skills/business-clarity-report/reports/`
2. Provide download links to the user
3. Offer customization options:
   - "Would you like me to focus more on [specific section]?"
   - "Should I adjust the tone or add additional analysis?"
   - "Would you like me to regenerate with changes?"

## Quality Standards

- **Comprehensive**: Cover all six dimensions thoroughly
- **Specific**: Use concrete examples from the website
- **Actionable**: PPC strategy section should provide specific, actionable insights
- **Professional**: Reports should be client-ready
- **Accurate**: Base all analysis on actual website content
- **Gap Identification**: Note when information is missing and suggest discussing with client

## Tips for Best Results

1. **Fetch multiple pages** - Don't rely only on the homepage
2. **Look for hidden gems** - Check footer, blog, case studies
3. **Identify gaps** - Note missing information that would strengthen the report
4. **Be specific** - Avoid generic statements, use actual examples
5. **PPC focus** - The PPC strategy section should be detailed and actionable

## Customization

Users can request:
- Focus on specific sections
- Adjust tone (more casual/formal)
- Add competitive analysis
- Industry-specific variations
- Additional sections

## Brand Guidelines

Always use Beech PPC brand colors:
- Primary: #003366
- Secondary: #0066CC
- Accent: #00CC99
- Text: #333333

Apply these consistently across both Google Slides and PDF reports.

