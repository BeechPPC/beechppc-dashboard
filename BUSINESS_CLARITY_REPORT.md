# Business Clarity Report Tool - Progress & Documentation

## Overview

The Business Clarity Report tool is an automated business analysis system that generates comprehensive reports for PPC client onboarding. It analyzes a prospect's website and delivers insights as both Google Slides presentations and PDF reports.

## Features

### ✅ Completed Features

1. **Website Content Fetching**
   - Fetches homepage content using Puppeteer
   - Automatically discovers and fetches additional pages (About, Services, Products, Testimonials)
   - Extracts title, meta description, and body content
   - Location: `lib/web/fetcher.ts`

2. **AI-Powered Business Analysis**
   - Uses Claude Sonnet 4.5 for analysis
   - Analyzes six key dimensions:
     - Existential Purpose (Why they exist)
     - Target Market (Who they serve)
     - Offerings (What they do)
     - Differentiation (USPs)
     - Trust Signals (Proof & credibility)
     - PPC Strategy Opportunities
   - Returns structured JSON data
   - Location: `app/api/tools/business-clarity-report/route.ts`

3. **PDF Report Generation**
   - Professional PDF with Beech PPC branding (yellow/amber colors)
   - Includes all six analysis sections
   - Key insights displayed as bullet points
   - Next steps section
   - Saves to `public/reports/` directory
   - Location: `lib/business-clarity/pdf-generator.ts`

4. **Google Slides Generation**
   - Creates branded presentations with Beech PPC colors
   - Title slide with company name and date
   - Section slides for each analysis dimension
   - Proper RGB color conversion (0-1 range)
   - Location: `lib/business-clarity/slides-generator.ts`

5. **Google Drive Organization**
   - Searches for existing "Business Clarity Reports" folder
   - Creates folder if it doesn't exist
   - Moves presentations into the folder
   - Makes presentations shareable (anyone with link can view)
   - Location: `lib/business-clarity/slides-generator.ts:563-600`

6. **Frontend UI**
   - Clean, professional interface
   - URL input with validation
   - Progress indicators during generation
   - Download buttons for PDF and Slides
   - Collapsible sections to preview analysis
   - Error handling with user-friendly messages
   - Location: `app/(app)/tools/business-clarity-report/page.tsx`

### 🔧 Brand Colors (Beech PPC)

**Hex Colors:**
- Primary: `#f59e0b` (amber-500)
- Light Yellow: `#fef3c7` (amber-100)
- Cream: `#fefce8` (yellow-50)
- Dark Text: `#111827` (gray-900)
- Medium Text: `#374151` (gray-700)
- Muted Text: `#6b7280` (gray-500)

**RGB (for Google Slides - 0-1 range):**
- Primary: `{ red: 0.96, green: 0.62, blue: 0.04 }`
- Light Yellow: `{ red: 0.996, green: 0.953, blue: 0.78 }`
- Cream: `{ red: 0.996, green: 0.988, blue: 0.91 }`
- Dark Text: `{ red: 0.067, green: 0.094, blue: 0.153 }`
- Medium Text: `{ red: 0.216, green: 0.255, blue: 0.318 }`
- Muted Text: `{ red: 0.42, green: 0.447, blue: 0.502 }`
- White: `{ red: 1, green: 1, blue: 1 }`

## Current Status

### ⚠️ Known Issues

1. **400 Bad Request Error** (ACTIVE ISSUE)
   - Error occurs when trying to generate a report
   - Changed from 500 to 400 after color scheme fixes
   - Likely an authentication or OAuth scope issue
   - Enhanced logging added but not yet tested with actual error output

### 🔍 Recent Changes

1. **Color Scheme Update** (Completed)
   - Updated `slides-generator.ts` from blue to yellow/amber Beech PPC colors
   - Fixed all color references (COLORS.accent → COLORS.primary/lightYellow)
   - Fixed text color references (COLORS.text → COLORS.mediumText)
   - Build succeeds without errors

2. **Enhanced Error Logging** (Completed)
   - Added OAuth credential validation logging in `slides-generator.ts:44-49`
   - Added detailed error logging in `route.ts:275-278`
   - Updated frontend to display actual error messages from server
   - Location: `app/(app)/tools/business-clarity-report/page.tsx:60-63`

## OAuth Setup

### Required Environment Variables (.env)

```bash
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_with_all_scopes
```

### Required OAuth Scopes

1. `https://www.googleapis.com/auth/adwords` - Google Ads
2. `https://www.googleapis.com/auth/calendar.readonly` - Calendar
3. `https://www.googleapis.com/auth/presentations` - Google Slides API
4. `https://www.googleapis.com/auth/drive.file` - Google Drive API

### Refresh Token Generation

Run the script to generate a new refresh token with all required scopes:

```bash
node scripts/get-slides-drive-refresh-token.js
```

**Important:** After generating a new refresh token, update the `GOOGLE_ADS_REFRESH_TOKEN` in your `.env` file and restart the dev server.

See `GOOGLE_SLIDES_DRIVE_SETUP.md` for detailed setup instructions.

## File Structure

```
BeechPPCAIAgent/
├── app/
│   ├── (app)/
│   │   └── tools/
│   │       └── business-clarity-report/
│   │           └── page.tsx              # Frontend UI
│   └── api/
│       └── tools/
│           └── business-clarity-report/
│               └── route.ts              # API endpoint
├── lib/
│   ├── business-clarity/
│   │   ├── pdf-generator.ts             # PDF generation
│   │   └── slides-generator.ts          # Google Slides generation
│   └── web/
│       └── fetcher.ts                   # Website content fetching
├── scripts/
│   ├── get-slides-drive-refresh-token.js
│   └── get-calendar-refresh-token.js
├── public/
│   └── reports/                         # Generated PDF reports saved here
├── GOOGLE_SLIDES_DRIVE_SETUP.md         # OAuth setup guide
└── BUSINESS_CLARITY_REPORT.md           # This file
```

## API Flow

1. **POST** `/api/tools/business-clarity-report`
   - Request body: `{ url: "https://example.com" }`

2. **Phase 1:** Fetch website content
   - Main page + up to 3 additional relevant pages
   - Extracts text content, title, meta description

3. **Phase 2:** Analyze with Claude AI
   - Sends combined content to Claude Sonnet 4.5
   - Returns structured JSON with 6 analysis sections

4. **Phase 3:** Generate PDF
   - Creates branded PDF report
   - Saves to `public/reports/` directory
   - Returns URL path for download

5. **Phase 4:** Generate Google Slides
   - Creates presentation with Google Slides API
   - Organizes in "Business Clarity Reports" folder
   - Makes shareable with link
   - Returns Google Slides edit URL

6. **Response:**
   ```json
   {
     "success": true,
     "reportData": { /* analysis data */ },
     "pdfUrl": "/reports/business-clarity-report-company-123456.pdf",
     "slideUrl": "https://docs.google.com/presentation/d/abc123/edit",
     "driveFileId": "abc123",
     "driveFolderId": "xyz789"
   }
   ```

## Debugging Checklist

When troubleshooting the 400 error:

- [ ] Verify all 3 OAuth environment variables are set in `.env`
- [ ] Check that refresh token includes all 4 required scopes
- [ ] Verify Google Slides API is enabled in Google Cloud Console
- [ ] Verify Google Drive API is enabled in Google Cloud Console
- [ ] Check OAuth client type matches redirect URI (Desktop vs Web)
- [ ] Review dev server console logs for detailed error messages
- [ ] Test with a simple URL like `https://example.com`
- [ ] Check browser console for frontend errors
- [ ] Verify Clerk authentication is working

## Next Steps

### Immediate (Fix 400 Error)

1. **Test and capture actual error message**
   - Run report generation in browser
   - Check error message displayed on page
   - Review dev server terminal logs
   - Look for `[Slides Generator]` and `[Business Clarity Report]` logs

2. **Diagnose root cause**
   - OAuth credential issues?
   - Insufficient scopes?
   - Google API errors?
   - Authentication failures?

3. **Apply fix based on diagnosis**

### Future Enhancements

1. **Report Customization**
   - Allow users to select which sections to include
   - Custom branding options (colors, logo)
   - Add/remove sections dynamically

2. **Report History**
   - Save report metadata to database
   - View previously generated reports
   - Re-download existing reports

3. **Batch Processing**
   - Generate reports for multiple URLs
   - Queue system for large batches
   - Progress tracking

4. **Enhanced Analysis**
   - Competitor analysis
   - Industry benchmarking
   - SEO insights
   - Social media presence

5. **Export Options**
   - Microsoft Word (.docx)
   - Markdown (.md)
   - Email delivery

## Testing

### Manual Testing Steps

1. Navigate to `/tools/business-clarity-report`
2. Enter URL: `https://example.com`
3. Click "Generate Report"
4. Monitor console for errors
5. Verify PDF is generated and downloadable
6. Verify Google Slides is created and shareable
7. Check that Slides are in "Business Clarity Reports" folder
8. Verify report preview shows all 6 sections

### Test URLs

- Simple test: `https://example.com`
- Real business: `https://beechppc.com`
- Complex site: `https://anthropic.com`

## Dependencies

```json
{
  "googleapis": "^164.1.0",      // Google Slides & Drive APIs
  "jspdf": "^3.0.4",              // PDF generation
  "@anthropic-ai/sdk": "latest",  // Claude AI
  "puppeteer": "^24.29.1"         // Website content fetching
}
```

## Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "URL is required" | Empty URL field | Enter a valid URL |
| "Invalid URL format" | Malformed URL | Include https:// prefix |
| "Failed to fetch website" | Website inaccessible | Check URL, firewall, or DNS |
| "Google OAuth credentials not configured" | Missing env vars | Set OAuth credentials in .env |
| "insufficient authentication scopes" | Refresh token missing scopes | Generate new refresh token with all scopes |
| "redirect_uri_mismatch" | OAuth client config | Fix redirect URI in Google Cloud Console |

## Support Resources

- OAuth Setup: `GOOGLE_SLIDES_DRIVE_SETUP.md`
- Google Cloud Console: https://console.cloud.google.com/
- Google API Library: https://console.cloud.google.com/apis/library
- Revoke Access: https://myaccount.google.com/permissions

## Last Updated

- Date: 2025-12-16
- Status: Debugging 400 error
- Next Action: Test with enhanced error logging to capture actual error message