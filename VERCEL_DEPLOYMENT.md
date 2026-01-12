# Vercel Deployment Guide

Complete guide to deploying the AIM OS application to Vercel.

## Prerequisites

- [x] Vercel CLI installed (already done)
- [ ] Vercel account (create at [vercel.com](https://vercel.com))
- [x] Production build successful
- [x] Supabase database with all migrations applied

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

#### Step 1: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate with your Vercel account.

#### Step 2: Deploy to Production

From the project root directory:

```bash
cd /tmp/cc-agent/62161131/project
vercel --prod
```

The CLI will:
1. Detect that this is a Vite project
2. Ask you to link to an existing project or create a new one
3. Build your application
4. Deploy to Vercel's global CDN

#### Step 3: Set Environment Variables

After deployment, set environment variables in Vercel Dashboard:

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://tfnoogotbyshsznpjspk.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDY2ODAsImV4cCI6MjA4MzA4MjY4MH0.RGOuBG_vrZhtrtSfhQ_ij72ctznWn0dAkQHYjT7FT_M` | Production, Preview, Development |

#### Step 4: Redeploy to Apply Environment Variables

```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard (Git Integration)

#### Step 1: Push to Git Repository

If you haven't already, push your code to GitHub, GitLab, or Bitbucket:

```bash
git init
git add .
git commit -m "Initial commit - AIM OS"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

#### Step 2: Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Step 3: Add Environment Variables

Before deploying, add environment variables in the import screen:

- `VITE_SUPABASE_URL` = `https://tfnoogotbyshsznpjspk.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDY2ODAsImV4cCI6MjA4MzA4MjY4MH0.RGOuBG_vrZhtrtSfhQ_ij72ctznWn0dAkQHYjT7FT_M`

#### Step 4: Deploy

Click **Deploy** and wait for the build to complete.

## Post-Deployment Configuration

### 1. Update Supabase Auth Settings

Add your Vercel deployment URL to Supabase Auth allowed URLs:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **URL Configuration**
3. Add to **Site URL**: `https://your-app.vercel.app`
4. Add to **Redirect URLs**:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/auth/callback`

### 2. Test the Deployment

Visit your deployment URL and verify:
- [ ] Login page loads correctly
- [ ] Can log in with demo credentials
- [ ] Dashboard displays properly
- [ ] Role-based navigation works
- [ ] Database queries return data

### 3. Create Demo Users

Follow the instructions in `DEMO_USERS.md` to create test users in Supabase Auth.

## Custom Domain (Optional)

### Add a Custom Domain

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain (e.g., `aim-os.yourdomain.com`)
4. Update DNS records as instructed by Vercel
5. Update Supabase Auth allowed URLs with the custom domain

## Monitoring and Analytics

### Vercel Analytics

Enable Vercel Analytics for performance monitoring:

1. Go to **Analytics** in your project dashboard
2. Click **Enable Analytics**
3. Choose your plan (free tier available)

### Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- PostHog for product analytics

## Troubleshooting

### Build Fails

**Problem**: Build fails with TypeScript errors

**Solution**:
```bash
npm run typecheck
npm run build
```
Fix any TypeScript errors before deploying.

### Environment Variables Not Working

**Problem**: Application can't connect to Supabase

**Solution**:
1. Verify environment variables are set in Vercel Dashboard
2. Ensure variable names start with `VITE_` prefix
3. Redeploy after setting variables

### 404 Errors on Client-Side Routes

**Problem**: Refreshing the page shows 404 error

**Solution**: This is already handled by `vercel.json` rewrites configuration. If the issue persists:
1. Verify `vercel.json` exists in the project root
2. Redeploy the project

### Authentication Issues

**Problem**: Login fails or redirects incorrectly

**Solution**:
1. Check Supabase Auth allowed URLs include your Vercel domain
2. Verify environment variables are correct
3. Check browser console for CORS errors

## Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Supabase Auth URLs updated
- [ ] Demo users created and tested
- [ ] All migrations applied to database
- [ ] RLS policies tested with different roles
- [ ] Production build successful
- [ ] Custom domain configured (if applicable)
- [ ] SSL/HTTPS enabled (automatic with Vercel)
- [ ] Analytics and monitoring configured
- [ ] Error tracking set up
- [ ] Backup and disaster recovery plan in place

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and pushes to other branches

Configure branch protection and deployment settings in:
**Settings** → **Git** → **Deployment Protection**

## Performance Optimization

### Recommended Settings

1. **Enable Edge Functions** (if using Supabase Edge Functions)
2. **Configure Caching Headers** (already in vercel.json)
3. **Enable Compression** (automatic with Vercel)
4. **Use Image Optimization** (if adding images)

### Lighthouse Score Goals

Target these scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

Run Lighthouse in Chrome DevTools to check.

## Support

For deployment issues:
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- Project Issues: Contact your development team

## Cost Estimation

### Vercel Pricing
- **Hobby (Free)**: Perfect for testing
  - Unlimited deployments
  - 100 GB bandwidth/month
  - Serverless function executions

- **Pro ($20/month)**: Recommended for production
  - Everything in Hobby
  - 1 TB bandwidth/month
  - Priority support
  - Team collaboration

### Supabase Pricing
- **Free Tier**: Good for MVP
  - 500 MB database
  - 1 GB file storage
  - 50,000 monthly active users

- **Pro ($25/month)**: Recommended for production
  - 8 GB database
  - 100 GB file storage
  - 100,000 monthly active users

**Estimated Monthly Cost**: $45-50 for production deployment
