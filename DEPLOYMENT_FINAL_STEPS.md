# Final Deployment Steps

Your AIM OS application is ready for deployment! Follow these final steps to deploy to Vercel.

## Quick Deployment (5 minutes)

### Step 1: Authenticate with Vercel

Open a terminal in the project directory and run:

```bash
npx vercel login
```

Choose your authentication method:
- Email
- GitHub
- GitLab
- Bitbucket

### Step 2: Deploy to Production

```bash
cd /tmp/cc-agent/62161131/project
npx vercel --prod
```

Answer the prompts:
1. **Set up and deploy**: `Y`
2. **Which scope**: Select your account/team
3. **Link to existing project**: `N` (first time)
4. **Project name**: `aim-os` (or your preferred name)
5. **Directory**: `.` (current directory)
6. **Override settings**: `N`

Vercel will:
- Build your project
- Deploy to production
- Provide a URL (e.g., `https://aim-os.vercel.app`)

### Step 3: Configure Environment Variables

After deployment, you need to add environment variables:

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click on your `aim-os` project
3. Navigate to **Settings** → **Environment Variables**
4. Add these variables for **Production**, **Preview**, and **Development**:

```
VITE_SUPABASE_URL=https://tfnoogotbyshsznpjspk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDY2ODAsImV4cCI6MjA4MzA4MjY4MH0.RGOuBG_vrZhtrtSfhQ_ij72ctznWn0dAkQHYjT7FT_M
```

#### Option B: Via CLI

```bash
npx vercel env add VITE_SUPABASE_URL production
# Paste: https://tfnoogotbyshsznpjspk.supabase.co

npx vercel env add VITE_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDY2ODAsImV4cCI6MjA4MzA4MjY4MH0.RGOuBG_vrZhtrtSfhQ_ij72ctznWn0dAkQHYjT7FT_M
```

### Step 4: Redeploy with Environment Variables

```bash
npx vercel --prod
```

This redeploys with the environment variables you just added.

### Step 5: Update Supabase Auth Configuration

Add your Vercel URL to Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project (`tfnoogotbyshsznpjspk`)
3. Navigate to **Authentication** → **URL Configuration**
4. Add to **Redirect URLs**:
   - Your Vercel URL (e.g., `https://aim-os.vercel.app`)
   - With wildcard: `https://aim-os.vercel.app/**`
5. Update **Site URL** to your Vercel URL
6. Click **Save**

### Step 6: Create Demo Users

Follow the instructions in `DEMO_USERS.md` to create test users in Supabase.

### Step 7: Test Your Deployment

Visit your Vercel URL and test:

1. **Login Page**: Should load without errors
2. **Executive Login**:
   - Email: `sarah.executive@aimrehab.ca`
   - Password: `Demo2026!Executive`
   - Should see Talent Acquisition module
3. **Test Other Roles**: Verify each role has appropriate access

## Deployment Complete!

Your application is now live at your Vercel URL.

## Next Steps

### 1. Custom Domain (Optional)

Add a custom domain:

```bash
npx vercel domains add aim-os.yourdomain.com
```

Then update your DNS records as instructed.

### 2. Enable Analytics

In Vercel Dashboard:
1. Go to your project
2. Click **Analytics** tab
3. Click **Enable Analytics**

### 3. Set Up Monitoring

Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **PostHog** for product analytics

### 4. Production Checklist

- [ ] All environment variables configured
- [ ] Supabase Auth URLs updated
- [ ] Demo users created and tested
- [ ] All roles tested (Executive, Manager, Clinician, Admin, Contractor)
- [ ] Database RLS policies working
- [ ] SSL/HTTPS enabled (automatic)
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled
- [ ] Team members invited to Vercel project

## Troubleshooting

### "VITE_SUPABASE_URL is not defined"

**Solution**: Environment variables not configured
1. Add them in Vercel Dashboard
2. Redeploy: `npx vercel --prod`

### "Login not working"

**Solution**: Check Supabase Auth configuration
1. Verify Vercel URL is in Supabase Redirect URLs
2. Check browser console for CORS errors
3. Verify environment variables are correct

### "404 on page refresh"

**Solution**: Already handled by `vercel.json`
- If issue persists, ensure `vercel.json` is in project root
- Redeploy the project

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Project Documentation**: See `README.md`
- **Deployment Guide**: See `VERCEL_DEPLOYMENT.md`
- **Demo Users**: See `DEMO_USERS.md`

## Estimated Deployment Time

- **Authentication**: 2 minutes
- **First deployment**: 2-3 minutes
- **Environment variables**: 1 minute
- **Testing**: 2-3 minutes
- **Total**: ~10 minutes

---

**You're ready to deploy! Run the commands above to get your application live.**
