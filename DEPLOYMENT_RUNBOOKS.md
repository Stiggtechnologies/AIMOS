# Deployment Runbooks - AIM Rehab Enterprise System

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Initial Production Deployment](#initial-production-deployment)
3. [Standard Deployment Process](#standard-deployment-process)
4. [Database Migrations](#database-migrations)
5. [Edge Function Deployment](#edge-function-deployment)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring Post-Deployment](#monitoring-post-deployment)
8. [Emergency Procedures](#emergency-procedures)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing locally
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Code reviewed and approved
- [ ] Documentation updated

### Security

- [ ] Security audit completed
- [ ] RLS policies verified
- [ ] No hardcoded secrets in code
- [ ] Environment variables configured
- [ ] Dependencies scanned for vulnerabilities (`npm audit`)
- [ ] HTTPS enforced

### Database

- [ ] Migration scripts tested in staging
- [ ] Backup created before migration
- [ ] RLS policies tested
- [ ] Rollback plan documented
- [ ] Data integrity verified

### Testing

- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] End-to-end tests completed
- [ ] Performance testing completed
- [ ] Security testing completed
- [ ] UAT sign-off obtained

### Communication

- [ ] Stakeholders notified of deployment
- [ ] Maintenance window scheduled (if downtime required)
- [ ] Support team briefed
- [ ] Rollback team on standby
- [ ] Deployment timeline communicated

---

## Initial Production Deployment

### Step 1: Set Up Supabase Project

**1.1 Create Project**
1. Log in to https://supabase.com
2. Click "New Project"
3. Enter project details:
   - Name: AIM Rehab Production
   - Database Password: (Strong password, store securely)
   - Region: Choose closest to primary users
4. Wait for project provisioning (2-3 minutes)

**1.2 Configure Project Settings**
1. Navigate to Settings > General
2. Set project name and description
3. Note Project URL and API Keys

**1.3 Enable Required Extensions**
```sql
-- Run in SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

**1.4 Configure Authentication**
1. Navigate to Authentication > Settings
2. Configure:
   - Site URL: https://your-app.vercel.app
   - Redirect URLs: https://your-app.vercel.app/**
   - JWT expiry: 3600 (1 hour)
   - Email templates: Customize as needed
3. Disable email confirmations (if required by business)

### Step 2: Run Database Migrations

**2.1 Apply Schema Migrations**
1. Navigate to SQL Editor in Supabase Dashboard
2. Apply migrations in order:
   ```
   supabase/migrations/20260104084827_create_talent_acquisition_schema.sql
   supabase/migrations/20260104084908_seed_agents_and_workflows.sql
   ...
   (Apply all migrations in timestamp order)
   ```
3. Verify each migration succeeds before proceeding

**2.2 Seed Initial Data**
Run seed scripts for:
- User roles and permissions
- Initial system settings
- Demo clinics (if applicable)
- Reference data

**2.3 Verify Database**
```sql
-- Check tables created
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies exist
SELECT tablename, COUNT(*) FROM pg_policies GROUP BY tablename;
```

### Step 3: Deploy Edge Functions

**For each Edge Function:**

1. Navigate to Edge Functions in Supabase Dashboard
2. Create new function or update existing
3. Upload function code
4. Configure environment variables:
   - `OPENAI_API_KEY` (for openai-assistant)
   - Any other required secrets
5. Deploy function
6. Test function endpoint

### Step 4: Set Up Vercel Project

**4.1 Connect Repository**
1. Log in to https://vercel.com
2. Click "New Project"
3. Import Git Repository
4. Select your repository
5. Configure:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `dist`

**4.2 Configure Environment Variables**
1. Navigate to Settings > Environment Variables
2. Add all required variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   NODE_ENV=production
   ```
3. Save variables

**4.3 Deploy**
1. Click "Deploy"
2. Wait for build to complete
3. Verify deployment successful
4. Test production URL

### Step 5: Post-Deployment Verification

**5.1 Smoke Tests**
- [ ] Can access application URL
- [ ] Can log in with test account
- [ ] Dashboard loads correctly
- [ ] Can navigate between modules
- [ ] Can perform basic CRUD operations

**5.2 Integration Tests**
- [ ] Authentication works
- [ ] Database queries return data
- [ ] Edge Functions respond
- [ ] Real-time subscriptions work
- [ ] File uploads work

**5.3 Performance Tests**
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] No console errors
- [ ] No broken links

### Step 6: Go Live

**6.1 DNS Configuration** (if using custom domain)
1. Add CNAME record pointing to Vercel
2. Wait for DNS propagation
3. Enable HTTPS in Vercel
4. Verify SSL certificate

**6.2 Final Checks**
- [ ] All systems operational
- [ ] Monitoring enabled
- [ ] Support team ready
- [ ] Documentation available
- [ ] Rollback plan ready

**6.3 Announcement**
- Notify users system is live
- Provide login instructions
- Share support contact info
- Send training materials

---

## Standard Deployment Process

### For Feature Updates and Bug Fixes

**Timeline: ~30 minutes**

#### Step 1: Pre-Deployment (10 minutes)

**1.1 Code Preparation**
```bash
# Ensure on main/master branch
git checkout main
git pull origin main

# Run tests
npm test

# Type check
npm run typecheck

# Build verification
npm run build

# Check for security vulnerabilities
npm audit
```

**1.2 Create Deployment Branch**
```bash
git checkout -b deploy/YYYY-MM-DD-feature-name
```

**1.3 Version Bump** (if using semantic versioning)
```bash
npm version patch  # or minor, or major
git push origin deploy/YYYY-MM-DD-feature-name --tags
```

#### Step 2: Staging Deployment (5 minutes)

**2.1 Deploy to Staging**
1. Push to staging branch or use Vercel preview
2. Verify staging environment
3. Run smoke tests

**2.2 Staging Verification**
- [ ] Application loads
- [ ] New features work
- [ ] Existing features unaffected
- [ ] No console errors
- [ ] Performance acceptable

#### Step 3: Production Deployment (10 minutes)

**3.1 Merge to Main**
```bash
git checkout main
git merge deploy/YYYY-MM-DD-feature-name
git push origin main
```

**3.2 Automatic Deployment**
- Vercel automatically deploys on push to main
- Monitor deployment logs
- Wait for "Deployment Ready" status

**3.3 Manual Trigger** (if needed)
1. Navigate to Vercel Dashboard
2. Select project
3. Click "Redeploy"
4. Confirm deployment

#### Step 4: Post-Deployment Verification (5 minutes)

**4.1 Immediate Checks**
- [ ] Production URL accessible
- [ ] Can log in
- [ ] New feature visible and working
- [ ] No regression in existing features
- [ ] Check error logs (should be empty)

**4.2 Monitoring**
```bash
# Monitor Vercel logs
vercel logs your-app --follow

# Check Supabase logs
# Via Dashboard > Logs
```

**4.3 User Communication**
- Send release notes to users
- Update internal documentation
- Post in team chat

---

## Database Migrations

### Safe Migration Process

#### Step 1: Prepare Migration

**1.1 Create Migration File**
```bash
# Filename: supabase/migrations/YYYYMMDDHHMMSS_description.sql
# Example: 20260109120000_add_patient_preferences.sql
```

**1.2 Write Migration**
```sql
/*
  # Add Patient Preferences

  1. Changes
    - Add preferences column to patients table
    - Add default value

  2. Security
    - No changes to RLS policies
*/

-- Add column with IF NOT EXISTS for safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE patients ADD COLUMN preferences jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_patients_preferences ON patients USING gin(preferences);
```

#### Step 2: Test Migration

**2.1 Test in Development**
```sql
-- In local/development environment
-- Run migration
-- Verify:
-- 1. Migration succeeds
-- 2. Existing data unaffected
-- 3. New functionality works
-- 4. Can rollback if needed
```

**2.2 Test Rollback**
```sql
-- Create rollback script
-- 20260109120000_add_patient_preferences_rollback.sql

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patients' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE patients DROP COLUMN preferences;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_patients_preferences;
```

#### Step 3: Backup Production

```bash
# Trigger manual backup in Supabase Dashboard
# Settings > Backups > Create Backup

# Wait for backup to complete
# Note backup ID for recovery
```

#### Step 4: Apply Migration

**4.1 Schedule Maintenance Window** (if needed)
- For large migrations, schedule low-traffic time
- Notify users in advance
- Have rollback team ready

**4.2 Apply Migration**
1. Navigate to Supabase Dashboard > SQL Editor
2. Paste migration SQL
3. Review one final time
4. Click "Run"
5. Monitor execution

**4.3 Verify Migration**
```sql
-- Check column added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'preferences';

-- Check index created
SELECT indexname FROM pg_indexes
WHERE tablename = 'patients' AND indexname = 'idx_patients_preferences';

-- Test functionality
SELECT id, preferences FROM patients LIMIT 1;
UPDATE patients SET preferences = '{"theme": "dark"}' WHERE id = 'test-id';
```

#### Step 5: Deploy Application Code

- Deploy application code that uses new schema
- Verify application works with new schema
- Monitor for errors

---

## Edge Function Deployment

### Deploy Edge Function

**Using Supabase Dashboard:**

1. Navigate to Edge Functions
2. Click function name or "New Function"
3. Update function code in editor
4. Configure environment variables
5. Click "Deploy"
6. Wait for deployment (usually < 1 minute)
7. Test endpoint

**Testing Edge Function:**
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/function-name' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"test": "data"}'
```

### Edge Function Best Practices

**1. Version Your Functions**
```typescript
// Include version in function
export const VERSION = '1.2.0';

Deno.serve(async (req) => {
  // Function logic
  return new Response(JSON.stringify({
    version: VERSION,
    data: result
  }));
});
```

**2. Implement Health Checks**
```typescript
if (req.method === 'GET' && url.pathname === '/health') {
  return new Response(JSON.stringify({
    status: 'healthy',
    version: VERSION,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**3. Handle Errors Gracefully**
```typescript
try {
  // Function logic
} catch (error) {
  console.error('Function error:', error);
  return new Response(JSON.stringify({
    error: 'Internal server error',
    message: error.message
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## Rollback Procedures

### When to Rollback

Initiate rollback if:
- Critical bug affecting all users
- Data corruption detected
- Security vulnerability exposed
- System performance severely degraded
- Authentication/authorization broken

### Application Rollback

**Using Vercel:**

**Method 1: Instant Rollback**
1. Navigate to Vercel Dashboard
2. Select project > Deployments
3. Find previous working deployment
4. Click "..." menu > "Promote to Production"
5. Confirm promotion
6. Verify rollback successful

**Method 2: Git Rollback**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard <previous-commit-hash>
git push origin main --force

# Vercel will auto-deploy the reverted code
```

### Database Rollback

**For Schema Changes:**

**Option 1: Apply Rollback Migration**
```sql
-- Run prepared rollback script
-- Example: 20260109120000_add_patient_preferences_rollback.sql

-- Verify rollback
SELECT column_name FROM information_schema.columns
WHERE table_name = 'patients' AND column_name = 'preferences';
-- Expected: 0 rows
```

**Option 2: Restore from Backup**
1. Navigate to Supabase Dashboard > Settings > Backups
2. Select backup from before migration
3. Click "Restore"
4. Confirm restoration (WARNING: This will overwrite current data)
5. Wait for restore to complete
6. Verify data integrity

**For Data Changes:**
1. Identify affected records
2. Restore from backup if available
3. Or manually correct data:
```sql
-- Example: Revert status changes
UPDATE patients
SET status = old_status
WHERE updated_at > '2026-01-09 12:00:00'
AND status = 'new_status';
```

### Edge Function Rollback

1. Navigate to Supabase Dashboard > Edge Functions
2. Select function
3. Click "History" or "Versions"
4. Select previous version
5. Click "Restore"
6. Verify function works

---

## Monitoring Post-Deployment

### First Hour

**Every 10 minutes:**
- [ ] Check application accessibility
- [ ] Monitor error rate
- [ ] Check response times
- [ ] Review user activity
- [ ] Monitor authentication

**Tools:**
```bash
# Check Vercel logs
vercel logs --follow

# Check application health
curl https://your-app.vercel.app/health

# Monitor Supabase
# Dashboard > Logs > Real-time
```

### First Day

**Every hour:**
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Monitor database load
- [ ] Review user feedback
- [ ] Check for anomalies

**Metrics to Monitor:**
```sql
-- Active users
SELECT COUNT(DISTINCT user_id) FROM audit_log
WHERE created_at > now() - interval '1 hour';

-- Error rate
SELECT COUNT(*) FROM error_logs
WHERE created_at > now() - interval '1 hour';

-- Database performance
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### First Week

**Daily:**
- [ ] Review comprehensive metrics
- [ ] Analyze user behavior
- [ ] Check performance trends
- [ ] Review support tickets
- [ ] Document issues and resolutions

**Weekly Review:**
- Deployment success metrics
- User adoption rate
- Performance compared to baseline
- Issues encountered and resolved
- Lessons learned

---

## Emergency Procedures

### System Down - Complete Outage

**Severity: P0 - Critical**

**Immediate Actions (0-5 minutes):**
1. Verify outage (check from multiple locations)
2. Check Vercel status page
3. Check Supabase status page
4. Notify incident response team
5. Post status update for users

**Diagnosis (5-15 minutes):**
- Check Vercel deployment status
- Review error logs
- Check database connectivity
- Verify DNS resolution
- Check SSL certificates

**Resolution Options:**
1. If recent deployment: Rollback immediately
2. If infrastructure issue: Wait for provider resolution
3. If configuration issue: Correct and redeploy
4. If database issue: Check Supabase dashboard

**Communication:**
- Update status page every 15 minutes
- Notify executive team
- Prepare incident report

### Data Breach - Security Incident

**Severity: P0 - Critical**

**Immediate Actions (0-5 minutes):**
1. Confirm breach
2. Notify security team
3. Notify executive team
4. Preserve evidence

**Containment (5-30 minutes):**
1. Identify affected systems
2. Revoke compromised credentials
3. Block suspicious IP addresses
4. Disable compromised accounts
5. Enable additional monitoring

**Investigation:**
- Determine breach scope
- Identify attack vector
- Assess data accessed
- Document timeline
- Preserve logs

**Remediation:**
- Patch vulnerabilities
- Reset affected credentials
- Notify affected users (if required by law)
- Implement additional security measures

**Follow-up:**
- Incident report
- Security audit
- Update security procedures
- Training for team

### Performance Degradation

**Severity: P1 - High**

**Immediate Actions:**
1. Measure current performance
2. Compare to baseline
3. Identify bottleneck
4. Check server resources

**Common Causes:**
- Slow database queries
- Missing indexes
- Memory leaks
- High traffic
- DDoS attack

**Resolution:**
```sql
-- Find slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Add indexes
CREATE INDEX idx_name ON table(column);

-- Optimize queries
EXPLAIN ANALYZE SELECT ...;
```

**Scaling:**
- Enable Vercel auto-scaling (if not already)
- Upgrade Supabase plan if needed
- Implement caching
- Optimize assets

---

## Deployment Checklist Template

### Pre-Deployment

| Task | Completed | Notes |
|------|-----------|-------|
| Code reviewed | [ ] | |
| Tests passing | [ ] | |
| Security audit done | [ ] | |
| Staging tested | [ ] | |
| Backup created | [ ] | |
| Team notified | [ ] | |
| Rollback plan ready | [ ] | |

### Deployment

| Task | Completed | Time | Notes |
|------|-----------|------|-------|
| Merge to main | [ ] | | |
| Vercel deployment started | [ ] | | |
| Deployment completed | [ ] | | |
| Edge functions updated | [ ] | | |
| Database migrated | [ ] | | |

### Post-Deployment

| Task | Completed | Time | Notes |
|------|-----------|------|-------|
| Smoke tests passed | [ ] | | |
| No errors in logs | [ ] | | |
| Performance acceptable | [ ] | | |
| Users notified | [ ] | | |
| Documentation updated | [ ] | | |
| Monitoring enabled | [ ] | | |

### Sign-Off

| Role | Name | Signature | Date/Time |
|------|------|-----------|-----------|
| Developer | | | |
| Tech Lead | | | |
| QA | | | |
| DevOps | | | |

---

## Contact Information

### Escalation Path

| Level | Role | Contact | Response Time |
|-------|------|---------|---------------|
| L1 | On-call Engineer | | < 15 min |
| L2 | Technical Lead | | < 30 min |
| L3 | Engineering Manager | | < 1 hour |
| L4 | CTO | | < 2 hours |

### External Support

| Service | Contact | SLA |
|---------|---------|-----|
| Vercel Support | support@vercel.com | 1 hour (Pro plan) |
| Supabase Support | support@supabase.io | 4 hours (Pro plan) |
| OpenAI Support | support@openai.com | Best effort |

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Next Review:** February 2026
**Owner:** DevOps Team
