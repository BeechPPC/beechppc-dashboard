# Business Clarity Report - Technical Documentation

## Skill Architecture

### Core Components

1. **SKILL.md** (Main instruction file)
   - Defines when the skill triggers
   - Contains step-by-step workflow
   - Guides Claude through the analysis and report generation process

2. **references/analysis_framework.md** (Analysis methodology)
   - Detailed framework for business analysis
   - Question prompts for each section
   - Best practices and quality standards
   - Red flags and opportunities to identify

3. **scripts/** (Optional automation scripts)
   - Python scripts for programmatic execution
   - Can be used directly or serve as reference implementations

## Workflow Breakdown

### Phase 1: Data Collection
- Triggers on: "Do a clarity report on [URL]"
- Uses `web_fetch` to retrieve website content
- Targets key pages: home, about, services, testimonials, contact
- May fetch multiple pages for comprehensive coverage

### Phase 2: Business Analysis
Claude analyzes six key dimensions:

1. **Existential Purpose** (Why they exist)
   - Mission and vision
   - Problem they solve
   - Market positioning

2. **Target Market** (Who they serve)
   - Demographics (measurable attributes)
   - Psychographics (values, behaviors)
   - Pain points and goals

3. **Offerings** (What they do)
   - Primary services/products
   - Secondary offerings
   - Deliverables and scope

4. **Differentiation** (USPs)
   - Competitive advantages
   - Unique processes
   - Guarantees and promises

5. **Trust Signals** (Proof & credibility)
   - Social proof (testimonials, reviews)
   - Case studies and results
   - Credentials and certifications
   - Statistics and milestones

6. **PPC Strategy** (Marketing opportunities)
   - Keyword themes
   - Audience targeting
   - Messaging angles
   - Conversion optimization suggestions

### Phase 3: Data Structuring
Claude creates a JSON data file with:
- Metadata (URL, date, report type)
- Six section objects with:
  - Title
  - Content (paragraph overview)
  - Category-specific arrays (e.g., demographics, USPs, testimonials)

### Phase 4: Report Generation
Two parallel outputs:

**Google Slides (.pptx)**
- Uses `pptx` skill
- 8-9 slides total
- Beech PPC brand colors
- Professional layouts

**PDF Report**
- Uses `pdf` skill
- Full document format
- Cover page + sections
- Print-ready formatting

### Phase 5: Delivery
- Both files saved to `.claude/skills/business-clarity-report/reports/`
- Download links provided to user
- Offers customization options

## Technical Requirements

### Dependencies
The skill leverages Claude's built-in capabilities:
- `web_fetch` - Website content retrieval
- `pptx` skill - PowerPoint generation
- `pdf` skill - PDF creation
- JSON data structuring

### Optional Python Dependencies
If running scripts directly:
```bash
pip install python-pptx reportlab
```

## Data Structure Schema

```json
{
  "metadata": {
    "url": "string",
    "analyzed_date": "YYYY-MM-DD",
    "report_type": "Business Clarity Report"
  },
  "sections": {
    "section_name": {
      "title": "string",
      "content": "string (paragraph)",
      "key_points": ["array of strings"],
      // Section-specific arrays
    }
  }
}
```

## Customization Points

### Brand Colors
Currently set to:
```
Primary:   #003366 (Beech PPC dark blue)
Secondary: #0066CC (Beech PPC medium blue)
Accent:    #00CC99 (teal)
Text:      #333333 (dark gray)
```

Can be modified in SKILL.md step 4.

### Report Sections
Six core sections are standard but can be:
- Expanded with additional analysis
- Customized per industry
- Reordered based on priority
- Enhanced with competitive analysis

### Analysis Depth
Framework supports varying depths:
- **Quick scan**: 5-10 minute analysis
- **Standard**: 15-20 minute comprehensive review
- **Deep dive**: 30+ minutes with competitive research

## Skill Triggering

### Primary Triggers
- "Do a clarity report on [URL]"
- "Run a business clarity analysis for [URL]"
- "Create a clarity report for [URL]"
- "Analyze this business: [URL]"

### Skill Description (in frontmatter)
The description field determines when Claude loads this skill:
```yaml
description: Comprehensive business analysis for PPC client onboarding. 
  Use when the user says "Do a clarity report on [URL]" or requests a 
  business clarity analysis. Generates detailed reports about why a 
  business exists, who they serve, what they do, their USPs, and 
  credibility factors, formatted as Google Slides and PDF deliverables.
```

## File Organization

```
business-clarity-report/
├── SKILL.md                              # Main instruction file
├── references/
│   └── analysis_framework.md             # Detailed analysis methodology
└── scripts/
    ├── business_clarity_analysis.py      # Data extraction script
    ├── generate_slides.py                # PowerPoint generation
    └── generate_pdf.py                   # PDF generation
```

## Future Enhancement Opportunities

1. **Email Integration**
   - Add email delivery capability
   - Automated sending to Chris's inbox
   - Custom email templates

2. **Data Persistence**
   - Store analyses for comparison
   - Track changes over time
   - Build a client database

3. **Competitive Analysis**
   - Automated competitor research
   - Side-by-side comparisons
   - Market positioning analysis

4. **Industry Templates**
   - Pre-configured analysis for specific industries
   - Industry-specific keyword libraries
   - Vertical-specific insights

5. **CRM Integration**
   - Export to CRM systems
   - Automated follow-up workflows
   - Pipeline tracking

## Maintenance Notes

### Updating the Skill
1. Modify files in the source directory
2. Test changes with real URLs
3. Re-package using: `python package_skill.py business-clarity-report`
4. Upload new .skill file to Claude

### Quality Checks
- Test with diverse business types (e-commerce, services, B2B, B2C)
- Verify brand colors render correctly
- Check PDF formatting on different devices
- Validate JSON data structure

### Version History
- v1.0 (2025-11-27): Initial release with core functionality

## Support and Troubleshooting

### Common Issues

**Issue**: Website content not fully captured
**Solution**: Manually specify additional pages to fetch

**Issue**: Missing brand elements
**Solution**: Verify Beech PPC colors are in the SKILL.md instructions

**Issue**: Generic analysis
**Solution**: Reference analysis_framework.md more explicitly, add specific prompts

### Getting Help
Ask Claude to:
- Review the SKILL.md file
- Check the analysis_framework.md
- Debug specific sections
- Modify report formatting
