# Deployment Guide - Beech PPC Dashboard

This guide walks you through deploying the Beech PPC Dashboard to Vercel and setting up automated daily reports.

## Prerequisites

- GitHub account
- Vercel account (free tier is sufficient to start)
- Google Ads API credentials
- Gmail account with App Password

## Step 1: Push to GitHub

1. **Create a new repository** on GitHub:
   - Go to https://github.com/new
   - Repository name: `beechppc-dashboard` (or your preferred name)
   - Make it private (recommended for security)
   - Don't initialize with README (we already have one)

2. **Push your local repository**:
   ```bash
   cd /Users/chrisbeechey/beechppc-dashboard
   git remote add origin https://github.com/BeechPPC/beechppc-dashboard.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

1. **Import Repository**:
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

2. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

3. **Add Environment Variables**:
   Click "Environment Variables" and add the following:

   ```
   GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
   GOOGLE_ADS_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_ADS_CLIENT_SECRET=your-client-secret
   GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token
   GOOGLE_ADS_LOGIN_CUSTOMER_ID=your-mcc-account-id
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_TO=recipient@example.com
   ```

   **Important**: Replace all placeholder values with your actual credentials from `.env.local`

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your dashboard will be live at `https://your-project.vercel.app`

## Step 3: Configure Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `dashboard.beechppc.com`)
4. Follow Vercel's DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)

## Step 4: Set Up Automated Daily Reports

### Option A: GitHub Actions (Recommended)

1. **Add GitHub Secrets**:
   - Go to your GitHub repository
   - Click "Settings" → "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Add the following secrets:
     - `VERCEL_URL`: Your Vercel deployment URL (e.g., `https://your-project.vercel.app`)
     - `EMAIL_TO`: Recipient email (e.g., `chris@beechppc.com`)

2. **Enable GitHub Actions**:
   - Go to "Actions" tab in your repository
   - If prompted, click "I understand my workflows, go ahead and enable them"
   - The workflow will run automatically at 11 AM Melbourne time daily

3. **Test the Workflow**:
   - Go to "Actions" tab
   - Click on "Send Daily Google Ads Report" workflow
   - Click "Run workflow" → "Run workflow"
   - Wait for completion and check your email

### Option B: Keep Localhost Service Running

If you prefer to keep the existing LaunchAgent setup:

1. Ensure the LaunchAgent is still running:
   ```bash
   launchctl list | grep com.beechppc.dailyreport
   ```

2. The service will continue sending reports at 11 AM Melbourne time from your local machine

**Note**: This requires your Mac to be running and connected to the internet at 11 AM daily.

## Step 5: Verify Deployment

1. **Access Dashboard**:
   - Open your Vercel URL in a browser
   - Navigate through all pages: Dashboard, Clients, Reports, Settings

2. **Test API Endpoints**:
   ```bash
   # Check accounts endpoint
   curl https://your-project.vercel.app/api/google-ads/accounts
   
   # Check dashboard endpoint
   curl https://your-project.vercel.app/api/google-ads/dashboard
   ```

3. **Send Test Report**:
   - Go to Reports page
   - Enter your email
   - Click "Send Report Now"
   - Check your inbox for the email

## Troubleshooting

### Build Fails on Vercel

**Problem**: Build fails with TypeScript errors
**Solution**: 
- Check Vercel build logs for specific errors
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally to reproduce the error

### API Endpoints Return 500 Error

**Problem**: `/api/google-ads/accounts` returns error
**Solution**:
- Verify all environment variables are set in Vercel
- Check that refresh token is still valid
- Review Vercel function logs (click on deployment → "Functions" tab)

### Reports Not Sending

**Problem**: GitHub Actions workflow succeeds but no email received
**Solution**:
- Check spam/junk folder
- Verify `EMAIL_TO` environment variable in Vercel
- Test email configuration by clicking "Send Report Now" on Reports page
- Check Gmail App Password is still valid

### Google Ads API Authentication Errors

**Problem**: "Invalid grant" or "Token expired" errors
**Solution**:
- Refresh token may have expired
- Generate new refresh token using the OAuth flow
- Update `GOOGLE_ADS_REFRESH_TOKEN` in Vercel environment variables
- Redeploy the application

## Monitoring and Maintenance

### View Logs

**Vercel Logs**:
- Go to your project dashboard
- Click on a deployment
- Click "Functions" to see serverless function logs
- Click "Build Logs" to see build output

**GitHub Actions Logs**:
- Go to "Actions" tab in repository
- Click on a workflow run
- View logs for each step

### Update Environment Variables

1. Go to Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Update the variable
4. Click "Save"
5. Redeploy (Vercel → Deployments → latest → "..." → "Redeploy")

### Update Application Code

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. Vercel automatically deploys the latest commit to production

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use GitHub secret scanning** - Enable in repository settings
3. **Rotate credentials regularly** - Update tokens every 6 months
4. **Keep dependencies updated** - Run `npm audit` and `npm update` monthly
5. **Monitor API usage** - Check Google Ads API quota in Google Cloud Console

## Cost Considerations

### Free Tier Limits

**Vercel**:
- 100 GB bandwidth/month
- 100 hours serverless function execution/month
- Unlimited static requests

**GitHub Actions**:
- 2,000 minutes/month for private repos
- Unlimited for public repos

**Estimated Usage** (with daily reports):
- ~30 workflow runs/month
- ~1 minute per run
- Total: ~30 minutes/month (well within free tier)

## Next Steps

After successful deployment, consider:

1. **Add Google OAuth Authentication** - Secure dashboard access
2. **Set up Supabase Database** - Store historical reports
3. **Configure Monitoring** - Add error tracking (Sentry, LogRocket)
4. **Create Backups** - Export data regularly
5. **Document Processes** - Create runbooks for common tasks

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Vercel and GitHub Actions logs
3. Search for similar issues in Next.js and google-ads-api documentation
4. Create an issue in the GitHub repository

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
