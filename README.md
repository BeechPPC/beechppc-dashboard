# Beech PPC Dashboard

A modern Next.js 14 web dashboard for managing Google Ads MCC (My Client Center) accounts, with automated daily reporting via email.

## Features

- **Real-time Dashboard**: View performance metrics across all MCC accounts
- **Client Management**: Monitor individual account performance and status
- **Email Reports**: Automated daily reports sent at scheduled times
- **Manual Reporting**: Generate and preview reports on-demand
- **Data Visualization**: Interactive charts showing spend and conversion trends
- **Settings Management**: Configure report schedules, recipients, and more

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **API Integration**: Google Ads API v21
- **Email**: Nodemailer (Gmail SMTP)
- **Deployment**: Vercel

## Prerequisites

1. **Google Ads API Credentials**:
   - MCC Account ID
   - Developer Token (from Google Ads API Center)
   - OAuth 2.0 Client ID and Secret
   - Refresh Token (generated via OAuth flow)

2. **Email Configuration**:
   - Gmail account with App Password enabled
   - Or custom SMTP server credentials

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/BeechPPC/Beech-PPC-AI-Agent.git
cd beechppc-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_LOGIN_CUSTOMER_ID=your_mcc_id

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_TO=recipient@example.com
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import your GitHub repository
   - Select the `beechppc-dashboard` directory if using monorepo

2. **Configure Environment Variables**:
   - In Vercel project settings, add all variables from `.env.local`
   - Ensure all Google Ads API and Email credentials are set

3. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your application
   - Future commits to `main` branch will trigger automatic deployments

### Scheduled Reports (Production)

For production scheduled reports, you have two options:

**Option A: GitHub Actions** (Recommended for Vercel deployments)
- Set up GitHub Actions workflow to trigger `/api/reports/send` endpoint daily
- Add schedule in `.github/workflows/daily-report.yml`

**Option B: Localhost Service** (Current setup)
- Keep the existing BeechPPCAIAgent LaunchAgent running
- Sends reports from your local machine at 11 AM Melbourne time

## Project Structure

```
beechppc-dashboard/
├── app/
│   ├── dashboard/          # Main dashboard page
│   ├── clients/            # Client accounts listing
│   ├── reports/            # Reports management
│   ├── settings/           # Configuration page
│   ├── api/
│   │   ├── google-ads/     # Google Ads API routes
│   │   └── reports/        # Report generation routes
│   └── layout.tsx          # Root layout with sidebar
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── navigation/         # Sidebar navigation
│   └── dashboard/          # Dashboard-specific components
├── lib/
│   ├── google-ads/         # Google Ads client and types
│   ├── email/              # Email service and templates
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## API Routes

### Google Ads
- `GET /api/google-ads/accounts` - List all MCC accounts
- `GET /api/google-ads/dashboard` - Aggregated dashboard metrics

### Reports
- `POST /api/reports/send` - Send report to specified recipients
- `GET /api/reports/preview` - Preview report HTML in browser

## Features Roadmap

### Implemented
- ✅ Real-time dashboard with metrics
- ✅ Client account listing
- ✅ Manual report generation
- ✅ Email report delivery
- ✅ Performance charts
- ✅ Settings page

### Coming Soon
- 🔄 Google OAuth Authentication
- 🔄 Database integration (Supabase)
- 🔄 Historical reports storage
- 🔄 Competitor monitoring
- 🔄 Keyword research automation
- 🔄 Budget management tools
- 🔄 AI copywriting assistance
- 🔄 Alert notifications

## Branding

The dashboard uses Beech PPC's brand colors:
- **Primary**: Yellow (#f59e0b)
- **Accent**: Warm yellow variations
- **Background**: Light cream (#fefce8)
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)

## Support

For issues or questions, please open an issue on [GitHub](https://github.com/BeechPPC/Beech-PPC-AI-Agent/issues).

## License

Proprietary - Beech PPC © 2025
