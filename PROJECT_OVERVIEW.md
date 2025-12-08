# Beech PPC AI Agent - Project Overview

> **Last Updated:** January 2025  
> **Status:** Active Development  
> **Version:** 2.0.0  
> **This is a living document** - Updated frequently to reflect current state

---

## Table of Contents

1. [What is Beech PPC AI Agent?](#what-is-beech-ppc-ai-agent)
2. [Core Achievements](#core-achievements)
3. [Features](#features)
4. [Design System & Color Scheme](#design-system--color-scheme)
5. [GitHub Repository](#github-repository)
6. [Functionality & Architecture](#functionality--architecture)
7. [Technical Stack](#technical-stack)
8. [Current Implementation Status](#current-implementation-status)
9. [Future Roadmap](#future-roadmap)
10. [Quick Reference](#quick-reference)

---

## What is Beech PPC AI Agent?

**Beech PPC AI Agent** is an intelligent, AI-powered Google Ads management platform designed for PPC agencies and professionals. It combines automated reporting, real-time performance monitoring, AI-powered insights, and comprehensive campaign management tools into a single, unified dashboard.

### Core Purpose

The platform serves as a **central command center** for PPC professionals to:

- **Automate repetitive tasks** - Daily reports, meeting extraction, alert monitoring
- **Gain AI-powered insights** - Claude AI integration for campaign analysis and recommendations
- **Manage multiple accounts** - Unified view of all Google Ads MCC accounts
- **Enhance client relationships** - Professional reporting, meeting tracking, client management
- **Optimize workflows** - Task management, automation tools, keyword research

### Target Users

- **PPC Agencies** managing multiple client accounts
- **In-house PPC managers** overseeing large portfolios
- **Freelance PPC consultants** needing professional reporting tools
- **PPC specialists** requiring AI-powered analysis and recommendations

---

## Core Achievements

### 🎯 What the Platform Achieves

1. **Time Savings**
   - Automated daily/monthly report generation and delivery
   - AI-powered analysis reduces manual research time
   - Meeting extraction from emails eliminates manual calendar entry
   - Automated alert monitoring for performance issues

2. **Professional Reporting**
   - Branded email reports with consistent design
   - Multiple report templates for different use cases
   - PDF and Google Slides export capabilities
   - Automated scheduling and delivery

3. **Intelligent Insights**
   - Claude AI integration for campaign analysis
   - Natural language queries about account performance
   - Keyword research automation
   - Performance trend analysis

4. **Unified Management**
   - Single dashboard for all Google Ads accounts
   - Client relationship management with meeting notes
   - Task tracking and automation workflows
   - Calendar integration for meeting management

5. **Scalability**
   - Handles multiple MCC accounts simultaneously
   - Supports unlimited client accounts
   - Cloud-based architecture for reliability
   - Serverless deployment for cost efficiency

---

## Features

### 📊 Dashboard & Analytics

**Location:** `/dashboard`

- **Real-time Performance Metrics**
  - Total spend, conversions, clicks, impressions
  - CTR, average CPC, cost per conversion
  - Conversion rate, impression share
  - Period-over-period comparisons with percentage changes

- **Interactive Charts**
  - Performance over time (spend, conversions, clicks)
  - Campaign performance visualization
  - Keyword performance trends

- **Filtering & Date Ranges**
  - Preset ranges (Last 7/14/30 days, This month, Last month)
  - Custom date range picker
  - Account-specific filtering
  - Real-time data refresh

### 👥 Account Management

**Location:** `/accounts` and `/accounts/[id]`

- **MCC Account Overview**
  - List all customer accounts from Google Ads MCC
  - Account cards with key metrics
  - Status indicators (Active, Paused, etc.)
  - Currency and account ID display

- **Individual Account Details**
  - Detailed performance metrics
  - Campaign performance breakdown
  - Keyword performance analysis
  - Historical data viewing

### 🤝 Client Management

**Location:** `/clients`

- **Client Database**
  - All Google Ads accounts automatically synced as clients
  - Client detail cards with contact information
  - Account ID and status tracking
  - Monthly spend tracking

- **Meeting Notes**
  - Timestamped notes per client
  - Rich text formatting support
  - Historical note viewing
  - Persistent storage (Redis + localStorage fallback)

- **Client Details**
  - Business information
  - Contact persons
  - Billing details
  - Campaign objectives

### 💬 AI Chat Assistant

**Location:** `/chat`

- **Claude AI Integration**
  - Powered by Claude 3.5 Sonnet
  - Context-aware responses about PPC strategies
  - Natural language queries about account data

- **Capabilities**
  - Campaign optimization strategies
  - Keyword research suggestions
  - Ad copy recommendations
  - Bid management advice
  - Performance analysis
  - Meeting queries ("What meetings do I have this week?")

- **22 Integrated Skills**
  - Google Ads analysis and queries
  - CSV data analysis
  - PPC coaching and prioritization
  - Account audits
  - Campaign performance analysis
  - And more (see Skills section)

### 📅 Meetings Calendar

**Location:** `/meetings`

- **Calendar View**
  - Month view with navigation (previous/next month)
  - Today button for quick navigation
  - Meetings displayed on calendar dates
  - Visual indicators for today's date

- **Integration Options**
  - **Google Calendar API** (Primary) - Direct access to all calendars
  - **Email Parsing** (Fallback) - Extracts meetings from email invites

- **Meeting Details**
  - Click any date to see meetings for that day
  - Meeting details: title, time, location, attendees, organizer
  - Summary sidebar with upcoming/past meeting counts
  - Filters out cancelled and declined events

### 📧 Automated Reporting

**Location:** `/reports`

- **Report Templates**
  - Zero Conversion Search Terms
  - Best Performing Ads by CTR
  - Best Performing Keywords by Conversion
  - Custom template support

- **Report Generation**
  - On-demand report generation
  - Email delivery with professional templates
  - PDF export capability
  - Google Slides export (for Business Clarity Reports)

- **Scheduling**
  - Automated daily reports (11 AM Melbourne time)
  - Monthly report generation
  - Custom scheduling options

### ⚙️ Automations

**Location:** `/automations/*`

- **Alerts** (`/automations/alerts`)
  - Performance threshold monitoring
  - Automated email notifications
  - Custom alert rules

- **Budget Management** (`/automations/budget-management`)
  - Budget tracking and recommendations
  - Overspend alerts
  - Budget optimization suggestions

- **Competitor Monitoring** (`/automations/competitor-monitoring`)
  - Competitor tracking (planned)
  - Auction insights analysis

- **Copywriting** (`/automations/copywriting`)
  - AI-powered ad copy generation
  - Copy suggestions and variations

- **Keyword Research** (`/automations/keyword-research`)
  - Automated keyword discovery
  - Search volume analysis
  - Keyword opportunity identification

### ✅ Task Management

**Location:** `/tasks`

- **Kanban Board**
  - Drag-and-drop task organization
  - Multiple columns (To Do, In Progress, Done)
  - Task cards with details
  - Client association

### ⚙️ Settings

**Location:** `/settings`

- **Email Configuration**
  - SMTP settings for report delivery
  - Email recipient management
  - Test email functionality

- **Branding**
  - Logo upload
  - Favicon customization
  - Brand color preferences

- **Claude Skills Management**
  - Skill configuration
  - Skill enablement/disablement

---

## Design System & Color Scheme

### Brand Identity

**Company:** Beech PPC  
**Tagline:** AI-powered Google Ads management and reporting

### Color Palette

#### Primary Colors

- **Primary Yellow:** `#f59e0b` (amber-500)
  - Usage: Primary actions, CTAs, links, highlights
  - Tailwind: `bg-primary`, `text-primary`, `border-primary`

- **Light Yellow:** `#fef3c7` (amber-100)
  - Usage: Backgrounds, subtle highlights, table headers
  - Tailwind: `bg-amber-100`

- **Cream Background:** `#fefce8` (yellow-50)
  - Usage: Page backgrounds, card backgrounds
  - Tailwind: `bg-yellow-50`

- **Mid Yellow:** `#fde68a` (amber-200)
  - Usage: Borders, dividers, animated blobs
  - Tailwind: `border-amber-200`

#### Neutral Colors

- **Dark Text:** `#111827` (gray-900)
  - Usage: Headings, primary text
  - Tailwind: `text-gray-900`

- **Medium Text:** `#374151` (gray-700)
  - Usage: Secondary text, descriptions
  - Tailwind: `text-gray-700`

- **Muted Text:** `#6b7280` (gray-500)
  - Usage: Tertiary text, captions, metadata
  - Tailwind: `text-muted`, `text-gray-500`

#### Status Colors

- **Success:** `#10b981` (green-500)
  - Usage: Success messages, positive metrics, active status
  - Tailwind: `text-success`, `bg-success`

- **Error:** `#ef4444` (red-500)
  - Usage: Error messages, negative metrics, warnings
  - Tailwind: `text-error`, `bg-error`

- **Warning:** `#f59e0b` (amber-500)
  - Usage: Alerts, important notices
  - Same as primary color

### Typography

**Font Stack:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Font Sizes:**
- H1: `text-2xl sm:text-3xl` (24px / 30px)
- H2: `text-xl sm:text-2xl` (20px / 24px)
- Body: `text-sm sm:text-base` (14px / 16px)
- Small: `text-xs sm:text-sm` (12px / 14px)

**Font Weights:**
- Bold (700): Headings, important metrics
- Semibold (600): Subheadings
- Medium (500): Labels
- Normal (400): Body text

### Visual Design Elements

- **Animated Background Blobs:** Floating yellow/amber blobs for visual interest
- **Card-based Layout:** White cards on cream background
- **Rounded Corners:** `rounded-lg` (8px) for cards and buttons
- **Subtle Shadows:** `shadow-sm` for depth
- **Responsive Grid:** Mobile-first design with breakpoints

### Email Template Design

All email templates follow consistent design standards:

- **Header:** Gradient background (`#fef3c7` to `#fde68a`) with Beech PPC branding
- **Table Headers:** Light yellow background (`#fef3c7`) with amber border
- **Table Borders:** Amber-200 (`#fde68a`)
- **Mobile Responsive:** Breakpoints at 600px for optimal mobile viewing
- **Typography:** System font stack with consistent sizing

---

## GitHub Repository

### Repository Information

**URL:** https://github.com/BeechPPC/beechppc-dashboard  
**Primary Branch:** `main`  
**Deployment:** Automatic via Vercel on push to `main`

### Repository Structure

```
beechppc-dashboard/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Route group with shared layout
│   │   ├── dashboard/            # Dashboard page
│   │   ├── accounts/             # Account management
│   │   ├── clients/              # Client management
│   │   ├── meetings/             # Calendar view
│   │   ├── reports/              # Report generation
│   │   ├── automations/          # Automation tools
│   │   ├── tasks/                # Task management
│   │   ├── chat/                 # AI chat assistant
│   │   └── settings/             # Settings page
│   ├── api/                      # API routes
│   │   ├── google-ads/           # Google Ads API
│   │   ├── meetings/             # Meetings API
│   │   ├── reports/              # Report generation
│   │   ├── chat/                 # Claude AI chat
│   │   └── settings/             # Settings API
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── navigation/               # Sidebar navigation
│   ├── dashboard/                # Dashboard components
│   ├── meetings/                 # Calendar components
│   └── clients/                  # Client components
├── lib/                          # Core libraries
│   ├── google-ads/               # Google Ads client
│   ├── email/                    # Email services
│   ├── calendar/                 # Google Calendar integration
│   ├── chat/                     # Claude AI functions
│   ├── reports/                  # Report generation
│   └── settings/                 # Settings management
├── skills/                       # Claude Skills (22 skills)
│   ├── google-ads/               # Google Ads skills
│   ├── business-clarity-report/  # Business analysis
│   ├── csv-analyzer/             # CSV analysis
│   └── [19 more skills...]
└── scripts/                      # Utility scripts
    ├── get-calendar-refresh-token.js
    └── setup-skills.ts
```

### Branch Strategy

- **`main`** - Production branch, auto-deploys to Vercel
- **Feature branches** - Created for new features (merged to main)

### Deployment

- **Platform:** Vercel
- **Auto-deploy:** Enabled on push to `main`
- **Environment:** Production and Preview deployments
- **URL:** https://beechppc-dashboard.vercel.app (or custom domain)

---

## Functionality & Architecture

### Core Functionality

#### 1. Google Ads Integration

- **API Client:** `lib/google-ads/client.ts`
- **Authentication:** OAuth 2.0 with refresh tokens
- **Capabilities:**
  - Fetch all MCC accounts
  - Get account performance metrics
  - Query campaign data
  - Retrieve keyword performance
  - Access conversion data
  - Auction insights (where available)

#### 2. Email Services

- **Sending:** SMTP via Nodemailer (Gmail, custom SMTP)
- **Reading:** IMAP integration for email parsing
- **Templates:**
  - Daily reports
  - Monthly reports
  - Template-based reports
  - Alert notifications

#### 3. Calendar Integration

- **Primary:** Google Calendar API
  - Direct access to all calendars
  - Fetches events from all accessible calendars
  - Filters cancelled/declined events
- **Fallback:** Email parsing
  - Extracts ICS calendar invites from emails
  - Parses meeting details from email text

#### 4. AI Integration

- **Claude AI:** Anthropic Claude 3.5 Sonnet
- **Functions:**
  - `get_upcoming_meetings` - Query meetings
  - `get_account_metrics` - Get performance data
  - `get_campaign_performance` - Campaign analysis
  - And more (see Skills section)

#### 5. Data Storage

- **Redis/Vercel KV:** Persistent storage for alerts, settings, meeting notes
- **localStorage:** Client-side caching and fallback
- **In-memory:** Fallback for development

### Architecture Patterns

- **Serverless:** Next.js API routes on Vercel
- **Component-based:** React components with TypeScript
- **API-first:** RESTful API design
- **Mobile-first:** Responsive design approach
- **Progressive Enhancement:** Works without JavaScript for core features

---

## Technical Stack

### Frontend

- **Framework:** Next.js 16.0.7 (App Router)
- **Build Tool:** Turbopack
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS v4
- **UI Components:** Custom components + Radix UI primitives
- **Icons:** Lucide React
- **Charts:** Recharts
- **State Management:** React hooks + Context API
- **Forms:** React hooks form (where needed)

### Backend

- **Runtime:** Node.js
- **API Framework:** Next.js API Routes
- **Authentication:** OAuth 2.0 (Google)
- **Email:** Nodemailer (SMTP) + IMAP
- **Storage:** Vercel KV (Redis) + localStorage fallback

### External Integrations

- **Google Ads API:** v21
- **Google Calendar API:** v3
- **Anthropic Claude AI:** SDK v0.67.0
- **Email Services:** Gmail SMTP, IMAP

### Development Tools

- **Package Manager:** npm
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **Version Control:** Git
- **CI/CD:** Vercel (automatic)

---

## Current Implementation Status

### ✅ Fully Implemented

1. **Dashboard**
   - Real-time metrics
   - Performance charts
   - Date range filtering
   - Account filtering

2. **Account Management**
   - MCC account listing
   - Individual account details
   - Performance metrics

3. **Client Management**
   - Client database
   - Meeting notes
   - Client details

4. **Meetings Calendar**
   - Calendar view with month navigation
   - Google Calendar API integration
   - Email parsing fallback
   - Meeting details display

5. **Automated Reporting**
   - Daily reports
   - Monthly reports
   - Template reports
   - Email delivery

6. **AI Chat Assistant**
   - Claude AI integration
   - 22 integrated skills
   - Natural language queries
   - Meeting queries

7. **Task Management**
   - Kanban board
   - Drag-and-drop
   - Task cards

8. **Settings**
   - Email configuration
   - Branding customization
   - Skills management

### 🚧 Partially Implemented

1. **Alerts System**
   - Basic alert creation
   - Email notifications
   - ⚠️ Advanced alert rules (in progress)

2. **Automations**
   - Budget management UI
   - Competitor monitoring UI
   - ⚠️ Full automation workflows (in progress)

### 📋 Planned Features

See [Future Roadmap](#future-roadmap) section below.

---

## Future Roadmap

### Phase 1: Enhanced Features (Next 1-3 months)

#### Calendar & Meetings
- [ ] Meeting notes integration with calendar events
- [ ] Recurring meeting detection
- [ ] Meeting reminders
- [ ] Calendar sync status indicators

#### Reporting Enhancements
- [ ] More report templates
- [ ] Custom report builder
- [ ] Scheduled report variations
- [ ] Report comparison tools

#### AI Improvements
- [ ] More Claude skills integration
- [ ] Voice-activated commands
- [ ] Automated campaign recommendations
- [ ] Predictive analytics

#### Client Management
- [ ] Client portal access
- [ ] Document sharing
- [ ] Communication history
- [ ] Client satisfaction tracking

### Phase 2: Advanced Features (3-6 months)

#### Predictive Analytics
- [ ] Budget forecasting
- [ ] Performance predictions
- [ ] Seasonal trend analysis
- [ ] ROI projections

#### Automated Optimization
- [ ] Auto-pause poor performers
- [ ] Bid adjustment automation
- [ ] Budget reallocation
- [ ] Ad schedule optimization

#### Expanded Integrations
- [ ] Google Analytics 4 integration
- [ ] Facebook Ads integration
- [ ] Microsoft Ads integration
- [ ] CRM integrations (Salesforce, HubSpot)

#### Advanced AI Features
- [ ] Custom GPT model for PPC
- [ ] Automated ad copy generation and deployment
- [ ] Competitor ad monitoring
- [ ] Voice-activated commands

### Phase 3: Enterprise Features (6-12 months)

#### White-Label Platform
- [ ] Custom domain support
- [ ] Full branding customization
- [ ] Client portal access
- [ ] Branded mobile app

#### API & Webhooks
- [ ] Public API for third-party integrations
- [ ] Webhook support for events
- [ ] API documentation
- [ ] Rate limiting and authentication

#### Advanced Collaboration
- [ ] Task assignment and tracking
- [ ] Team chat integration
- [ ] Approval workflows
- [ ] Activity audit logs

#### Enterprise Security
- [ ] SSO (Single Sign-On)
- [ ] 2FA (Two-Factor Authentication)
- [ ] IP whitelisting
- [ ] SOC 2 compliance

### Feature Requests Under Consideration

- [ ] Browser extension for quick access
- [ ] Mobile app (iOS/Android)
- [ ] Video reporting (automated video summaries)
- [ ] AI-powered campaign builder
- [ ] Competitor benchmarking database
- [ ] Training mode/tutorials
- [ ] Performance comparison across industries
- [ ] Automated QA/QC for campaigns

---

## Quick Reference

### Key URLs

- **GitHub Repository:** https://github.com/BeechPPC/beechppc-dashboard
- **Production URL:** https://beechppc-dashboard.vercel.app
- **Documentation:**
  - `DESIGN_SYSTEM.md` - Design guidelines
  - `MEETINGS_SETUP_VERIFICATION.md` - Calendar setup
  - `GOOGLE_CALENDAR_SETUP.md` - Calendar API setup
  - `SKILLS_SETUP.md` - Claude Skills configuration

### Environment Variables

Required for full functionality:

```env
# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=

# Email (SMTP)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_TO=

# Email (IMAP - for reading)
EMAIL_IMAP_PORT=993

# AI
ANTHROPIC_API_KEY=

# Storage (optional)
REDIS_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Calendar Setup
node scripts/get-calendar-refresh-token.js

# Skills Setup
npx tsx scripts/setup-skills.ts
```

### API Endpoints

- `GET /api/google-ads/accounts` - List all accounts
- `GET /api/google-ads/dashboard` - Dashboard metrics
- `GET /api/meetings` - Fetch meetings
- `GET /api/meetings/test` - Test calendar API
- `POST /api/reports/send` - Send report
- `POST /api/chat` - AI chat

---

## Maintenance Notes

### Updating This Document

This document should be updated whenever:

1. **New features are added** - Add to Features section
2. **Design changes** - Update Design System section
3. **New integrations** - Add to Technical Stack
4. **Roadmap changes** - Update Future Roadmap
5. **Architecture changes** - Update Architecture section
6. **Repository changes** - Update GitHub Repository section

### Version History

- **v2.0.0** (January 2025) - Added calendar integration, enhanced meetings, Google Calendar API
- **v1.0.0** (November 2024) - Initial release with dashboard, reporting, AI chat

---

**Last Updated:** January 2025  
**Maintained By:** Development Team  
**For Questions:** See GitHub Issues or Documentation

