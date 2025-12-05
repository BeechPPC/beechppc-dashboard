# Business Clarity Report Skill - User Guide

## What It Does

The Business Clarity Report skill automates the creation of comprehensive Business Clarity Reports for new PPC client prospects. It analyzes a business website and generates professional reports in both Google Slides and PDF formats.

## How to Use It

Simply say to Claude:

**"Do a clarity report on [website URL]"**

For example:
- "Do a clarity report on https://example.com"
- "Run a business clarity analysis for acmeplumbing.com"
- "Create a clarity report for this website: shopify.com/merchants"

## What You'll Get

The skill will automatically:

1. **Fetch and analyze the website** - Pulls content from homepage, about page, services, testimonials, etc.

2. **Generate comprehensive analysis** covering:
   - Why the business exists (mission, purpose, problem solved)
   - Who they serve (demographics, psychographics, pain points)
   - What they do (services, products, deliverables)
   - Unique selling points (competitive differentiators)
   - Proof & credibility (testimonials, case studies, awards)
   - PPC strategy opportunities (keywords, audiences, messaging)


3. **Create two professional reports**:
   - **Google Slides (.pptx)** - Professional presentation with Beech PPC branding
   - **PDF Report** - Comprehensive written report

## Report Structure

### Google Slides Presentation
- Title slide with company info
- Executive summary
- 6 detailed section slides (one for each analysis category)
- Professional formatting with Beech PPC brand colors

### PDF Report
- Cover page
- Executive summary
- Detailed sections with bullet points
- Professional typography and layout

## Brand Colors Used

The reports use Beech PPC's brand colors:
- Primary: #003366 (dark blue)
- Secondary: #0066CC (medium blue)
- Accent: #00CC99 (teal)
- Text: #333333 (dark gray)

## Tips for Best Results

1. **Use complete URLs** - Include https:// for best results
2. **Review and customize** - The reports are comprehensive but you can ask Claude to adjust specific sections
3. **Multiple pages** - Claude will automatically fetch multiple pages from the site to get comprehensive information
4. **Missing information** - If the website lacks certain details, the report will note gaps and suggest discussing with the client

## What's Inside the Skill

- **SKILL.md** - Main workflow instructions for Claude
- **analysis_framework.md** - Detailed framework for conducting the analysis
- **Python scripts** (optional automation):
  - business_clarity_analysis.py
  - generate_slides.py
  - generate_pdf.py

## Customization

You can ask Claude to:
- "Focus more on the PPC opportunities section"
- "Add more competitor analysis"
- "Adjust the tone to be more casual/formal"
- "Add a section about [specific topic]"
- "Regenerate just the PDF with changes"

## Installation

1. Upload the `business-clarity-report.skill` file to Claude
2. Claude will automatically have access to this capability
3. Start using it by saying "Do a clarity report on [URL]"

## Example Use Cases

- **New prospect research** - Quickly understand a potential client's business
- **Proposal preparation** - Generate insights before creating a proposal
- **Client onboarding** - Create comprehensive analysis for new retainer clients
- **Competitive analysis** - Understand how prospects compare to their market
- **Strategy sessions** - Use as foundation for campaign planning discussions

## Need Help?

Ask Claude:
- "Show me an example clarity report"
- "What information does the clarity report include?"
- "Can you customize the report format?"
- "How do I adjust the analysis for B2B vs B2C?"
