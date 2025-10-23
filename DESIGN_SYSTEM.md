# Beech PPC Design System & Development Notes

## Repository Information

**GitHub Repository:** https://github.com/BeechPPC/beechppc-dashboard

**Branch Structure:**
- `main` - Next.js web dashboard (deploys to Vercel)
- `backend-agent` - Node.js CLI reporting system

**Deployment:**
- Platform: Vercel
- Auto-deploys from `main` branch
- URL: https://beechppc-dashboard.vercel.app (or custom domain)

---

## Brand Identity

### Company Name
**Beech PPC** - AI-powered Google Ads management and reporting

### Brand Colors

#### Primary Palette
- **Primary Yellow:** `#f59e0b` (amber-500)
  - Use for: Primary actions, highlights, CTAs, links
  - Tailwind: `bg-primary`, `text-primary`, `border-primary`

- **Light Yellow:** `#fef3c7` (amber-100)
  - Use for: Backgrounds, subtle highlights, table headers
  - Tailwind: `bg-amber-100`

- **Cream Background:** `#fefce8` (yellow-50)
  - Use for: Page backgrounds, cards on light backgrounds
  - Tailwind: `bg-yellow-50`

#### Neutral Palette
- **Dark Text:** `#111827` (gray-900)
  - Use for: Headings, primary text
  - Tailwind: `text-gray-900`

- **Medium Text:** `#374151` (gray-700)
  - Use for: Secondary text, descriptions
  - Tailwind: `text-gray-700`

- **Muted Text:** `#6b7280` (gray-500)
  - Use for: Tertiary text, captions, metadata
  - Tailwind: `text-muted`, `text-gray-500`

- **Border:** `#fde68a` (amber-200)
  - Use for: Dividers, table borders, card borders
  - Tailwind: `border-border`, `border-amber-200`

#### Status Colors
- **Success:** `#10b981` (green-500)
  - Use for: Success messages, positive metrics, active status
  - Tailwind: `text-success`, `bg-success`

- **Error:** `#ef4444` (red-500)
  - Use for: Error messages, negative metrics, warnings
  - Tailwind: `text-error`, `bg-error`

- **Warning:** `#f59e0b` (amber-500)
  - Use for: Alerts, important notices
  - Tailwind: Same as primary

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes
- **Headings (h1):** `text-2xl sm:text-3xl` (24px / 30px)
- **Headings (h2):** `text-xl sm:text-2xl` (20px / 24px)
- **Body:** `text-sm sm:text-base` (14px / 16px)
- **Small:** `text-xs sm:text-sm` (12px / 14px)
- **Captions:** `text-xs` (12px)

### Font Weights
- **Bold:** `font-bold` (700) - Headings, important metrics
- **Semibold:** `font-semibold` (600) - Subheadings
- **Medium:** `font-medium` (500) - Labels
- **Normal:** `font-normal` (400) - Body text

---

## Component Styles

### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Styling:**
- Background: White (`bg-white`)
- Border radius: `rounded-lg` or `rounded-12px`
- Shadow: `shadow-sm` or `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`
- Padding: `p-6` (24px) for content, `p-4` (16px) for smaller cards

### Buttons

#### Primary Button
```tsx
<Button size="lg">
  <Icon className="h-4 w-4" />
  Button Text
</Button>
```
- Background: Primary yellow (`bg-primary`)
- Text: Dark (`text-gray-900`)
- Hover: Slightly darker yellow
- Icon + text spacing: `gap-2`

#### Secondary/Outline Button
```tsx
<Button variant="outline" size="lg">
  Button Text
</Button>
```
- Background: Transparent
- Border: `border-border`
- Text: `text-gray-700`

### Form Inputs

#### Text Input
```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
/>
```

#### Select Dropdown
```tsx
<select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white">
  <option>Option 1</option>
</select>
```

#### Date Picker
```tsx
import { DatePicker, type DateRange } from '@/components/ui/date-picker'

const [dateRange, setDateRange] = useState<DateRange>({
  from: '2025-01-01',
  to: '2025-01-31',
})

<DatePicker value={dateRange} onChange={setDateRange} />
```

**Features:**
- Preset buttons (Today, Yesterday, Last 7/14/30/90 Days)
- Custom date range selection
- Automatic date validation
- Calendar icon indicators
- Mobile-responsive layout

### Tables

**Header Row:**
```tsx
<thead>
  <tr style="background-color: #fef3c7;">
    <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827;">
      Column Header
    </th>
  </tr>
</thead>
```

**Body Rows:**
```tsx
<tbody>
  <tr>
    <td style="padding: 12px; border-bottom: 1px solid #fde68a;">
      Cell Content
    </td>
  </tr>
</tbody>
```

### Status Indicators

#### Success/Active
```tsx
<span className="flex items-center gap-2 text-sm text-success">
  <div className="h-2 w-2 rounded-full bg-success" />
  Active
</span>
```

#### Loading Spinner
```tsx
<Loader2 className="h-4 w-4 animate-spin" />
```

---

## Email Templates

### Universal Design Standards

All email templates (daily reports, template reports, alerts) MUST follow these design standards:

#### **1. Header Design (All Emails)**
```html
<div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
  <h1 style="margin: 0; color: #111827; font-size: 28px; font-weight: 600;">Beech PPC</h1>
  <p style="margin: 10px 0 0 0; color: #374151; font-size: 16px;">[Report Title]</p>
  <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">[Date]</p>
</div>
```

#### **2. Container Structure**
```html
<div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
  <!-- Content sections -->
</div>
```

#### **3. Table Headers (All Tables)**
```html
<th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left; font-weight: 600; color: #111827;">
  Column Header
</th>
```

#### **4. Table Rows (All Tables)**
```html
<td style="padding: 12px; border-bottom: 1px solid #fde68a;">
  Cell Content
</td>
```

#### **5. Footer (All Emails)**
```html
<div style="margin-top: 20px; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
  <p style="margin: 0;">This is an automated report from Beech PPC</p>
  <p style="margin: 5px 0 0 0;">Generated on [Melbourne Time]</p>
</div>
```

### Daily Report Template

#### **Layout Structure**
1. **Header:** Beech PPC branding with gradient
2. **Summary Cards:** 3-column grid with key metrics
3. **Account Performance Table:** All accounts with performance data
4. **Footer:** Standard Beech PPC footer

#### **Summary Cards Design**
```html
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
  <div style="text-align: center; padding: 20px; background-color: #fefce8; border-radius: 8px;">
    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Metric Label</p>
    <p style="margin: 0; color: #111827; font-size: 24px; font-weight: bold;">Metric Value</p>
  </div>
</div>
```

### Template Report Emails

#### **Layout Structure**
1. **Header:** Beech PPC branding with template name
2. **Account Info:** Account name, date, result count
3. **Description:** Template description
4. **Data Table:** Template-specific data with consistent styling
5. **Footer:** Standard Beech PPC footer

#### **Account Info Section**
```html
<div style="background-color: #fff; padding: 20px 30px; border-bottom: 1px solid #fde68a;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <h2 style="margin: 0; color: #111827; font-size: 20px;">Account Name</h2>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Date</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">X results</p>
    </div>
  </div>
</div>
```

### Mobile Responsive Standards

#### **CSS Media Queries (All Emails)**
```css
@media only screen and (max-width: 600px) {
  .container {
    padding: 10px !important;
  }
  .summary-grid {
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }
  .summary-card {
    padding: 15px !important;
  }
  table {
    font-size: 12px !important;
  }
  th, td {
    padding: 8px !important;
  }
  h1 {
    font-size: 24px !important;
  }
  h2 {
    font-size: 18px !important;
  }
  .account-name {
    font-size: 14px !important;
  }
  .account-id {
    font-size: 11px !important;
  }
}
```

#### **Required CSS Classes**
- `.container` - Main container with responsive padding
- `.summary-grid` - Grid layout for summary cards
- `.summary-card` - Individual summary card styling
- `.account-name` - Account name text
- `.account-id` - Account ID text

### Color Consistency

#### **Primary Colors (All Emails)**
- **Header Gradient:** `#fef3c7` to `#fde68a`
- **Table Headers:** `#fef3c7` background, `#f59e0b` border
- **Table Borders:** `#fde68a`
- **Text Primary:** `#111827`
- **Text Secondary:** `#374151`
- **Text Muted:** `#6b7280`
- **Footer Text:** `#9ca3af`

#### **Highlighted Values**
- **Key Metrics:** `#f59e0b` (bold, primary color)
- **Important Data:** Bold text with primary color
- **Success Indicators:** Green (`#10b981`)
- **Warning Indicators:** Amber (`#f59e0b`)

### Typography Standards

#### **Font Stack (All Emails)**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

#### **Font Sizes**
- **H1 (Headers):** 28px (24px mobile)
- **H2 (Subheaders):** 20px (18px mobile)
- **Body Text:** 16px (14px mobile)
- **Small Text:** 14px (12px mobile)
- **Footer Text:** 12px

#### **Font Weights**
- **Bold:** 700 (headings, important metrics)
- **Semibold:** 600 (subheadings)
- **Medium:** 500 (labels)
- **Normal:** 400 (body text)

---

## Layout Guidelines

### Spacing
- **Section spacing:** `space-y-6 sm:space-y-8` (24px / 32px)
- **Card spacing:** `space-y-4` (16px)
- **Element spacing:** `gap-2` (8px) for icons + text
- **Element spacing:** `gap-3` (12px) for buttons
- **Element spacing:** `gap-4` (16px) for form fields

### Responsive Breakpoints
- **Mobile:** Default (< 640px)
- **Tablet:** `sm:` (≥ 640px)
- **Desktop:** `md:` (≥ 768px)
- **Large:** `lg:` (≥ 1024px)

### Container Widths
- **Dashboard content:** `max-width: 1200px` (email templates)
- **Page content:** Full width with padding (`px-4` to `px-8`)

---

## Icons

**Icon Library:** Lucide React

**Common Icons:**
- Send: `<Send />`
- Eye (Preview): `<Eye />`
- Mail: `<Mail />`
- File/Document: `<FileText />`
- Success: `<CheckCircle />`
- Error: `<XCircle />`
- Loading: `<Loader2 className="animate-spin" />`

**Icon Sizes:**
- Small: `h-4 w-4` (16px)
- Medium: `h-5 w-5` (20px)
- Large: `h-8 w-8` (32px)

---

## Report Templates

### Design Consistency Standards

All report templates MUST follow these design standards for consistency:

#### **Template Structure**
1. **Header:** Beech PPC branding with template name
2. **Account Info:** Account name, date, result count
3. **Description:** Template description
4. **Data Table:** Template-specific data with consistent styling
5. **Footer:** Standard Beech PPC footer

#### **Table Styling Standards**
```html
<!-- Table Headers -->
<th style="padding: 12px; background-color: #fef3c7; border-bottom: 2px solid #f59e0b; text-align: left; font-weight: 600; color: #111827;">
  Column Header
</th>

<!-- Table Rows -->
<td style="padding: 12px; border-bottom: 1px solid #fde68a;">
  Cell Content
</td>

<!-- Highlighted Values -->
<td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right; font-weight: bold; color: #f59e0b;">
  Key Metric
</td>
```

#### **Highlighting Rules**
- **CTR Values:** Bold, primary color (`#f59e0b`)
- **Conversion Values:** Bold, primary color (`#f59e0b`)
- **Cost Values:** Standard formatting
- **Performance Metrics:** Bold when they're the primary sort metric

### Available Templates

1. **Zero Conversion Search Terms**
   - ID: `zero-conversion-search-terms`
   - Date Range: Last 14 days
   - Columns: Search Term, Campaign, Ad Group, Impressions, Clicks, CTR, Cost
   - Highlighted: None (all standard formatting)

2. **Best Performing Ads by CTR**
   - ID: `best-performing-ads-ctr`
   - Date Range: Last 14 days
   - Limit: 20 results
   - Columns: Ad Name, Campaign, Impressions, Clicks, CTR, Conversions, Cost
   - Highlighted: CTR (bold, primary color)

3. **Best Performing Keywords by Conversion**
   - ID: `best-performing-keywords-conversion`
   - Date Range: Last 14 days
   - Limit: 20 results
   - Columns: Keyword, Match Type, Campaign, Impressions, Clicks, Conversions, CTR, Cost/Conv
   - Highlighted: Conversions (bold, primary color)

### Email Template Implementation Standards

#### **File Structure**
```
lib/email/
├── service.ts          # Email sending service
├── template.ts         # Daily report template
└── template-email.ts   # Template report emails
```

#### **Required Functions**
All email templates MUST implement:

```typescript
// Daily Report Template
export function generateEmailTemplate(
  reportData: AccountPerformance[], 
  reportDate: Date
): string

// Template Report Emails
export function generateTemplateEmail(
  template: ReportTemplate,
  accountData: TemplateReportData,
  reportDate: Date
): string
```

#### **HTML Structure Requirements**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Report Title]</title>
</head>
<body style="margin: 0; padding: 0; font-family: [font-stack]; background-color: #fefce8;">
  <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 20px;">
    <!-- Header Section -->
    <!-- Content Sections -->
    <!-- Footer Section -->
  </div>
  
  <!-- Mobile Responsive Styles -->
  <style>
    @media only screen and (max-width: 600px) {
      /* Mobile styles */
    }
  </style>
</body>
</html>
```

#### **CSS Class Requirements**
All templates MUST include these CSS classes:
- `.container` - Main container
- `.summary-grid` - Grid layout for summary cards
- `.summary-card` - Individual summary card
- `.account-name` - Account name text
- `.account-id` - Account ID text

### Adding New Templates

When creating new report templates, follow this structure:

```typescript
// lib/google-ads/report-templates.ts
NEW_TEMPLATE: {
  id: 'unique-template-id',
  name: 'Display Name (Date Range)',
  description: 'Brief description of what this report shows',
  dateRange: 'LAST_14_DAYS', // or LAST_7_DAYS, LAST_30_DAYS, etc.
  type: 'SEARCH_TERMS' | 'ADS' | 'KEYWORDS',
  metrics: ['impressions', 'clicks', 'cost', 'conversions', 'ctr'],
  sorting: {
    metric: 'metricName',
    order: 'DESC' | 'ASC',
  },
  filters: {
    minClicks?: number,
    minImpressions?: number,
    minConversions?: number,
  },
  limit: 20, // optional
}
```

### Template Email Implementation

When implementing new template emails, follow these patterns:

#### **1. Header Generation**
```typescript
const headerHtml = `
  <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="margin: 0; color: #111827; font-size: 28px; font-weight: 600;">Beech PPC</h1>
    <p style="margin: 10px 0 0 0; color: #374151; font-size: 16px;">${template.name}</p>
  </div>
`
```

#### **2. Table Generation**
```typescript
const tableHtml = `
  <table style="width: 100%; border-collapse: collapse; background-color: #fff;">
    <thead>
      <tr>
        ${tableHeaders}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
`
```

#### **3. Footer Generation**
```typescript
const footerHtml = `
  <div style="margin-top: 20px; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">This is an automated report from Beech PPC</p>
    <p style="margin: 5px 0 0 0;">Generated on ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</p>
  </div>
`
```

---

## File Structure

```
beechppc-dashboard/
├── app/
│   ├── (app)/                  # Route group with shared layout + sidebar
│   │   ├── layout.tsx          # Shared layout with sidebar
│   │   ├── dashboard/          # Dashboard page
│   │   │   └── page.tsx
│   │   ├── clients/            # Clients page
│   │   │   └── page.tsx
│   │   ├── reports/            # Reports page with templates
│   │   │   └── page.tsx
│   │   └── settings/           # Settings page
│   │       └── page.tsx
│   ├── api/
│   │   ├── google-ads/         # Google Ads API routes
│   │   │   ├── accounts/
│   │   │   └── dashboard/
│   │   └── reports/            # Report API routes
│   │       ├── send/
│   │       ├── preview/
│   │       ├── templates/      # Get all templates
│   │       └── template-send/  # Send template report
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Root page (redirects to /dashboard)
├── components/
│   ├── ui/                     # Reusable UI components
│   ├── navigation/             # Sidebar, nav
│   │   └── sidebar.tsx         # Main sidebar component
│   └── dashboard/              # Dashboard components
├── lib/
│   ├── google-ads/
│   │   ├── client.ts           # Google Ads client
│   │   ├── types.ts            # TypeScript types
│   │   ├── report-templates.ts # Template definitions
│   │   └── template-queries.ts # Template queries
│   ├── email/
│   │   ├── service.ts          # Email sending
│   │   ├── template.ts         # Standard email template
│   │   └── template-email.ts   # Template report emails
│   └── utils.ts
└── public/
```

### Layout Architecture

**IMPORTANT:** All application pages (dashboard, clients, reports, settings, etc.) MUST be placed inside the `app/(app)/` directory to automatically include the sidebar navigation.

The `(app)` route group provides:
- Sidebar navigation on all pages
- Animated background blobs
- Consistent container padding and responsive layout
- Proper scroll behavior

**When creating new pages:**
1. Create the page inside `app/(app)/your-page/page.tsx`
2. Do NOT create individual `layout.tsx` files for each page
3. The shared layout will automatically apply

**Example new page structure:**
```
app/(app)/new-feature/
└── page.tsx
```

---

## Best Practices

### When Building New Features

1. **Check this file first** - Review existing patterns and colors
2. **Create pages in (app) directory** - ALL new pages MUST go in `app/(app)/` to include sidebar
3. **Use existing components** - Reuse Card, Button, Input components
4. **Follow mobile-first** - Use responsive classes (`sm:`, `md:`, `lg:`)
5. **Maintain consistency** - Use the defined color palette
6. **Update this file** - Add new patterns or components here

### Responsive Design

Always use responsive classes:
```tsx
className="text-sm sm:text-base"        // Font sizes
className="space-y-4 sm:space-y-6"      // Spacing
className="flex-col sm:flex-row"        // Layout direction
className="w-full sm:w-auto"            // Widths
```

### Accessibility

- Use semantic HTML (`<button>`, `<label>`, etc.)
- Include proper ARIA labels when needed
- Ensure sufficient color contrast (all current colors pass WCAG AA)
- Support keyboard navigation

---

## Development Workflow

### Starting New Work

1. **Check GitHub repo:** https://github.com/BeechPPC/beechppc-dashboard
2. **Pull latest:** `git pull origin main`
3. **Read this file:** Review design system before building
4. **Check existing components:** See if needed components exist

### Before Committing

1. **Review this file** - Ensure consistency with design system
2. **Update this file** - Document new patterns or components
3. **Test responsive** - Check mobile, tablet, desktop views
4. **Commit with context** - Include what and why in commit message

### Git Commit Format

```
feat: Brief description of feature

Detailed explanation of what was added/changed.

Features:
- Bullet point 1
- Bullet point 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Notes

**Last Updated:** January 2025

**Key Design Decisions:**
- Yellow/amber theme chosen for warmth and optimism
- White cards on cream background for depth without harshness
- Mobile-first approach for accessibility
- Consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px)
- Icon + text combinations for clarity
- Interactive filters (date range, account selection) for data exploration
- **Email Template Consistency:** All emails follow unified design standards

**Dashboard Filters:**
- Date Range Picker: Preset buttons + custom range selection
- Account Filter: Dropdown to view all accounts or individual account data
- Filters automatically trigger data refresh
- Visual feedback with loading states

**Email Template Standards:**
- **Universal Design:** All emails use consistent header, footer, and table styling
- **Mobile Responsive:** All templates include mobile breakpoints and CSS classes
- **Color Consistency:** Unified color palette across all email types
- **Typography Standards:** Consistent font stack, sizes, and weights
- **Branding:** Beech PPC branding on all email templates

**Future Considerations:**
- Dark mode support (track with `DARK_MODE_SUPPORT.md` if implemented)
- Additional brand colors for categories/tags
- Animation guidelines for transitions
- Data visualization color palette
- Export/download functionality for filtered data
- Email template variations for different report types

---

**IMPORTANT:** Always reference and update this file when building new features to maintain design consistency across the application.
