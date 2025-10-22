# Vercel KV Setup for Alert Storage

This application uses Vercel KV (Redis) to store alerts persistently across all serverless instances and sessions.

## Why Vercel KV?

- **Persistent**: Alerts are stored permanently, not lost on server restarts
- **Global**: Same alerts visible from any computer/browser
- **Fast**: Redis-based storage with sub-millisecond response times
- **Serverless-friendly**: Works perfectly with Vercel's deployment model

## Setup Instructions

### 1. Create a Vercel KV Database

1. Go to your Vercel dashboard
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **KV** (Redis)
5. Give it a name (e.g., `beechppc-alerts`)
6. Choose a region close to your users
7. Click **Create**

### 2. Get Your Environment Variables

**Method 1: From KV Database Page**
1. After creating the database, click on it
2. Look for the **Connect** or **Quickstart** tab
3. Scroll down to find the environment variables section
4. You should see:
   ```
   KV_REST_API_URL="https://..."
   KV_REST_API_TOKEN="..."
   KV_REST_API_READ_ONLY_TOKEN="..."
   ```
5. Click **Copy** or **Copy Snippet**

**Method 2: From Project Settings**
1. Go to your **Project** → **Settings** → **Environment Variables**
2. Vercel may have auto-added them when you created the KV database
3. Look for variables starting with `KV_`

**Method 3: Manually Get Credentials**
1. In your KV database page
2. Look for **REST API** section or **Settings**
3. Find **REST API URL** and **Token** fields
4. You may need to click "Show" or "Reveal" to see the token

### 3. Add Environment Variables

**For Local Development:**
1. Create/update your `.env.local` file
2. Paste the environment variables
3. Restart your dev server: `npm run dev`

**For Vercel Deployment (Automatic):**
- Vercel automatically adds these variables to your deployment
- No manual configuration needed!

### 4. Verify It Works

1. Open your app in browser #1
2. Create a new alert
3. Open your app in browser #2 (or different computer)
4. The alert should appear! ✅

## Storage Structure

Alerts are stored in a single key:
```
beechppc:alerts -> Array<Alert>
```

## Default Alerts

When no alerts exist (first time setup), the system creates 3 default alerts:
1. High Daily Spend (>$500)
2. Low Conversion Count (<5)
3. CTR Performance Drop (decreases by 20%)

## Troubleshooting

**Problem**: Alerts not persisting
- Check environment variables are set in Vercel dashboard
- Verify KV database is created and connected to project

**Problem**: `Error: KV_REST_API_URL is not defined`
- Environment variables not loaded
- Redeploy after adding variables
- For local dev: restart `npm run dev`

**Problem**: Alerts reset to defaults
- KV database might have been reset
- Check Vercel KV dashboard for stored data

## Cost

Vercel KV is free for:
- Up to 256 MB storage
- 30,000 requests per month

This is more than enough for alert storage! Each alert is ~500 bytes, so you can store thousands of alerts.

## Migration from In-Memory Storage

If you were previously using in-memory storage:
- Alerts will reset to defaults on first KV deployment
- You'll need to recreate any custom alerts
- This is a one-time migration

## Alternative: File Storage (Local Only)

If you want to use file storage for local development:
1. Change imports in `app/api/alerts/route.ts`:
   ```ts
   import { getAllAlerts } from '@/lib/alerts/storage'
   ```
2. This only works locally, not on Vercel
