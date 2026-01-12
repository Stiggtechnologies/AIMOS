# Administrator Guide - AIM Rehab Enterprise System

## Table of Contents
1. [System Overview](#system-overview)
2. [User Management](#user-management)
3. [Access Control & Permissions](#access-control--permissions)
4. [Database Administration](#database-administration)
5. [System Configuration](#system-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)
9. [Security Administration](#security-administration)

---

## System Overview

### Architecture

**Frontend:** React + TypeScript + Vite
- Hosted on Vercel
- Static site generation
- Edge caching enabled

**Backend:** Supabase
- PostgreSQL database
- Row Level Security (RLS)
- Real-time subscriptions
- Edge Functions for serverless compute

**Authentication:** Supabase Auth
- Email/password authentication
- JWT tokens
- Role-based access control

**AI Integration:** OpenAI
- GPT-4 for intelligent assistance
- Context-aware responses
- Secured via Edge Functions

### System Requirements

**Client Requirements:**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- Minimum 1280x720 resolution
- Stable internet connection (minimum 5 Mbps)

**Admin Workstation:**
- Same as client, plus:
- Access to Supabase dashboard
- Access to Vercel dashboard
- PostgreSQL client (optional)

---

## User Management

### Creating New Users

#### Method 1: Supabase Dashboard
1. Log in to Supabase dashboard
2. Navigate to Authentication > Users
3. Click "Add User"
4. Enter email address
5. Generate temporary password
6. Assign user to appropriate role
7. Send credentials to user securely

#### Method 2: SQL
```sql
-- Create user in auth.users
-- This is handled by Supabase Auth

-- Create user profile
INSERT INTO user_profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  primary_clinic_id,
  phone,
  is_active
) VALUES (
  'user-uuid-from-auth',
  'user@aimrehab.ca',
  'John',
  'Doe',
  'clinician',
  'clinic-uuid',
  '403-555-0123',
  true
);
```

### User Roles

| Role | Access Level | Typical Users |
|------|--------------|---------------|
| executive | Full system access | C-suite executives |
| admin | Administrative access | IT staff, system admins |
| clinic_manager | Clinic-level access | Clinic directors |
| clinician | Clinical workflows | Therapists, physicians |
| contractor | Limited access | Contract staff |
| partner_read_only | Partner clinic data | Partner administrators |

### Assigning Clinic Access

```sql
-- Grant user access to specific clinic
INSERT INTO clinic_access (
  user_id,
  clinic_id,
  access_level,
  granted_by,
  granted_at
) VALUES (
  'user-uuid',
  'clinic-uuid',
  'full',
  auth.uid(),
  now()
);
```

### Deactivating Users

```sql
-- Deactivate user (recommended over deletion)
UPDATE user_profiles
SET is_active = false
WHERE id = 'user-uuid';

-- Alternative: Delete user from Supabase Auth
-- Use Supabase Dashboard > Authentication > Users > Delete
```

### Resetting Passwords

**Via Supabase Dashboard:**
1. Navigate to Authentication > Users
2. Find user by email
3. Click "Send Password Recovery Email"
4. User receives email with reset link

**Programmatically:**
```javascript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@aimrehab.ca',
  {
    redirectTo: 'https://your-app.vercel.app/reset-password',
  }
);
```

---

## Access Control & Permissions

### Understanding Row Level Security (RLS)

RLS policies control who can access what data at the database level.

**Key Principles:**
- Policies are enforced at the database level
- Cannot be bypassed by application code
- Uses `auth.uid()` to identify current user
- Policies can be restrictive or permissive

### Common RLS Patterns

**Pattern 1: Own Data Only**
```sql
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (id = auth.uid());
```

**Pattern 2: Role-Based Access**
```sql
CREATE POLICY "Admins can view all users"
ON user_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'executive')
  )
);
```

**Pattern 3: Clinic-Based Access**
```sql
CREATE POLICY "View own clinic patients"
ON patients FOR SELECT
TO authenticated
USING (
  clinic_id IN (
    SELECT clinic_id FROM clinic_access
    WHERE user_id = auth.uid()
  )
);
```

### Modifying Permissions

**Grant Additional Access:**
```sql
-- Give user executive access
UPDATE user_profiles
SET role = 'executive'
WHERE id = 'user-uuid';

-- Grant access to additional clinic
INSERT INTO clinic_access (user_id, clinic_id, access_level)
VALUES ('user-uuid', 'new-clinic-uuid', 'full');
```

**Revoke Access:**
```sql
-- Remove clinic access
DELETE FROM clinic_access
WHERE user_id = 'user-uuid'
AND clinic_id = 'clinic-uuid';

-- Downgrade role
UPDATE user_profiles
SET role = 'clinician'
WHERE id = 'user-uuid';
```

### Permission Troubleshooting

**User Reports "Cannot Access Data"**
1. Verify user is authenticated
2. Check user role in user_profiles
3. Verify clinic_access entries
4. Test RLS policies as that user
5. Check for policy conflicts

**Testing Policies as User:**
```sql
-- Temporarily assume user identity for testing
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid"}';

-- Test query
SELECT * FROM patients;

-- Reset
RESET role;
```

---

## Database Administration

### Database Structure

**Schema Organization:**
- `public` - Main application tables
- `auth` - Supabase authentication (managed)
- `storage` - File storage metadata (managed)

**Key Table Categories:**
1. Core: user_profiles, clinics, clinic_access
2. Operations: patients, patient_appointments, cases
3. Financial: financial_metrics, revenue_data
4. Launch: launch_projects, phase_gates
5. Analytics: Various reporting tables

### Running Migrations

**Via Supabase Dashboard:**
1. Navigate to SQL Editor
2. Paste migration SQL
3. Click "Run"
4. Verify success

**Via Project Files:**
Migrations are stored in `supabase/migrations/`
- Filename format: `YYYYMMDDHHMMSS_description.sql`
- Applied sequentially by timestamp

### Database Maintenance

**Weekly Tasks:**
```sql
-- Check database size
SELECT
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum analyze (improves performance)
VACUUM ANALYZE;
```

**Monthly Tasks:**
```sql
-- Check for slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Adding Indexes

```sql
-- Add index for frequently queried columns
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_appointments_date ON patient_appointments(appointment_date);

-- Add composite index
CREATE INDEX idx_appointments_clinic_date
ON patient_appointments(clinic_id, appointment_date);

-- Add partial index (for specific conditions)
CREATE INDEX idx_active_patients
ON patients(status)
WHERE status = 'active';
```

---

## System Configuration

### Environment Variables

**Required Variables:**
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (for AI Assistant)
OPENAI_API_KEY=sk-your-key

# Application
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

**Setting Environment Variables (Vercel):**
1. Log in to Vercel dashboard
2. Select project
3. Navigate to Settings > Environment Variables
4. Add/update variables
5. Redeploy for changes to take effect

**Setting Environment Variables (Supabase Edge Functions):**
1. Log in to Supabase dashboard
2. Navigate to Edge Functions
3. Select function
4. Add environment variables
5. Redeploy function

### Feature Flags

Enable/disable features without code deployment:

```sql
-- Create feature_flags table
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT false,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Enable a feature
UPDATE feature_flags
SET is_enabled = true
WHERE flag_name = 'ai_assistant';

-- Check feature in application
SELECT is_enabled FROM feature_flags WHERE flag_name = 'ai_assistant';
```

### System Settings

```sql
-- Create system_settings table
CREATE TABLE system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Example settings
INSERT INTO system_settings (key, value, description) VALUES
('session_timeout_minutes', '30', 'User session timeout'),
('max_upload_size_mb', '10', 'Maximum file upload size'),
('enable_notifications', 'true', 'Enable system notifications'),
('maintenance_mode', 'false', 'System maintenance mode');
```

---

## Monitoring & Maintenance

### System Health Checks

**Daily Checks:**
- [ ] System accessibility (can users log in?)
- [ ] Database connectivity
- [ ] Error rate in logs
- [ ] Response times
- [ ] Failed authentication attempts

**Weekly Checks:**
- [ ] Database performance
- [ ] Storage usage
- [ ] Backup verification
- [ ] Security alerts
- [ ] User feedback review

**Monthly Checks:**
- [ ] Dependency updates
- [ ] Security patches
- [ ] Performance optimization
- [ ] Capacity planning
- [ ] Compliance audit

### Monitoring Dashboards

**Vercel Analytics:**
- Visit: Vercel Dashboard > Your Project > Analytics
- Monitor: Page views, load times, user metrics

**Supabase Dashboard:**
- Visit: Supabase Dashboard > Project > Overview
- Monitor: Database size, API requests, active connections

**Custom Monitoring:**
```sql
-- Active user sessions
SELECT COUNT(*) FROM user_profiles WHERE is_active = true;

-- Recent errors (if logging to database)
SELECT * FROM error_logs
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

-- System usage metrics
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_active = true) as active_users,
  COUNT(*) FILTER (WHERE last_login_at > now() - interval '7 days') as recent_users
FROM user_profiles;
```

### Performance Optimization

**Slow Query Identification:**
```sql
-- Enable pg_stat_statements if not enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT
  substring(query, 1, 50) AS query_snippet,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries averaging over 100ms
ORDER BY mean_time DESC
LIMIT 20;
```

**Query Optimization:**
1. Add appropriate indexes
2. Optimize RLS policies
3. Use EXPLAIN ANALYZE
4. Denormalize if necessary
5. Implement caching

**Frontend Optimization:**
1. Enable Vercel Edge caching
2. Optimize images and assets
3. Code splitting
4. Lazy loading
5. Service worker caching

---

## Backup & Recovery

### Automated Backups

**Supabase Backups:**
- Daily automated backups (retained 7 days)
- Accessible via Supabase Dashboard
- Point-in-time recovery available

**Verify Backups:**
1. Log in to Supabase Dashboard
2. Navigate to Settings > Backups
3. Verify latest backup timestamp
4. Test restore to staging environment monthly

### Manual Backups

**Database Dump:**
```bash
# Export entire database
pg_dump -h your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_$(date +%Y%m%d).sql

# Export specific table
pg_dump -h your-project.supabase.co \
  -U postgres \
  -d postgres \
  -t public.patients \
  -f patients_backup_$(date +%Y%m%d).sql
```

**Data Export via SQL:**
```sql
-- Export to CSV
COPY (SELECT * FROM patients) TO '/tmp/patients.csv' CSV HEADER;

-- Export JSON
COPY (SELECT row_to_json(patients) FROM patients) TO '/tmp/patients.json';
```

### Recovery Procedures

**Restoring from Backup:**
1. Access Supabase Dashboard
2. Navigate to Settings > Backups
3. Select backup to restore
4. Choose restore point
5. Confirm restoration
6. Verify data integrity
7. Notify users of downtime

**Point-in-Time Recovery:**
```bash
# Contact Supabase support for PITR
# Requires enterprise plan
# Can restore to any point within retention period
```

**Disaster Recovery Plan:**
1. Declare incident
2. Notify stakeholders
3. Assess data loss
4. Begin restoration from last good backup
5. Verify system functionality
6. Resume operations
7. Conduct post-mortem

---

## Troubleshooting

### Common Issues

#### Users Cannot Log In
**Diagnosis:**
1. Check Supabase Auth status
2. Verify user exists in auth.users
3. Check is_active flag in user_profiles
4. Review failed login logs
5. Test with known-good credentials

**Solutions:**
- Reset user password
- Reactivate user account
- Check browser compatibility
- Clear browser cache/cookies

#### RLS Policy Errors
**Symptoms:** Users see "permission denied" or empty results

**Diagnosis:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'problematic_table';

-- List policies on table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'problematic_table';

-- Test as user
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid"}';
SELECT * FROM problematic_table;
RESET role;
```

**Solutions:**
- Add missing policies
- Fix policy logic
- Grant appropriate role/clinic access

#### Slow Performance
**Diagnosis:**
1. Check query execution plans
2. Review missing indexes
3. Monitor database load
4. Check network latency
5. Review RLS policy complexity

**Solutions:**
```sql
-- Add missing indexes
CREATE INDEX idx_name ON table_name(column_name);

-- Optimize RLS policies (cache role check)
-- Instead of checking role on every row:
CREATE POLICY "Optimized policy"
ON table_name FOR SELECT
TO authenticated
USING (
  CASE
    WHEN (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'executive')
    THEN true
    ELSE condition_check
  END
);

-- Analyze and vacuum
ANALYZE table_name;
VACUUM table_name;
```

#### Edge Function Failures
**Diagnosis:**
1. Check Edge Function logs in Supabase
2. Verify environment variables
3. Test locally
4. Check timeout settings
5. Review error messages

**Solutions:**
- Increase timeout if needed
- Add error handling
- Verify API keys
- Check CORS configuration
- Redeploy function

---

## Security Administration

### Security Best Practices

**Access Control:**
- [ ] Principle of least privilege
- [ ] Regular access reviews
- [ ] Remove inactive users
- [ ] Audit admin actions
- [ ] Require MFA for admins (when available)

**Data Protection:**
- [ ] Encryption at rest (Supabase default)
- [ ] Encryption in transit (HTTPS enforced)
- [ ] Secure environment variables
- [ ] Regular security audits
- [ ] HIPAA compliance verification

**Monitoring:**
- [ ] Failed login attempts
- [ ] Unusual access patterns
- [ ] Large data exports
- [ ] Permission changes
- [ ] Schema modifications

### Security Incident Response

**Level 1: Suspicious Activity**
1. Document the incident
2. Review logs
3. Investigate user account
4. Take preventive action if needed

**Level 2: Confirmed Breach**
1. Immediately revoke access
2. Notify security team
3. Preserve evidence
4. Assess scope of breach
5. Notify affected parties if required
6. Implement corrective measures

**Level 3: Major Security Event**
1. Activate incident response team
2. Notify executive leadership
3. Engage legal counsel
4. Comply with breach notification laws
5. Conduct forensic analysis
6. Implement comprehensive remediation

### Audit Logging

**View Audit Logs:**
```sql
-- Recent user activities
SELECT * FROM audit_log
ORDER BY created_at DESC
LIMIT 100;

-- Specific user actions
SELECT * FROM audit_log
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Sensitive data access
SELECT * FROM patient_access_logs
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Failed authentication attempts
SELECT * FROM auth.audit_log_entries
WHERE action = 'user_signedin'
AND result = 'failure'
ORDER BY created_at DESC;
```

---

## Appendix

### Useful SQL Queries

**User Management:**
```sql
-- List all users with roles
SELECT
  up.email,
  up.first_name,
  up.last_name,
  up.role,
  up.is_active,
  up.last_login_at,
  c.name as primary_clinic
FROM user_profiles up
LEFT JOIN clinics c ON up.primary_clinic_id = c.id
ORDER BY up.last_name;

-- Users by role
SELECT role, COUNT(*) as count
FROM user_profiles
WHERE is_active = true
GROUP BY role
ORDER BY count DESC;

-- Inactive users
SELECT email, first_name, last_name, last_login_at
FROM user_profiles
WHERE is_active = true
AND (last_login_at IS NULL OR last_login_at < now() - interval '90 days')
ORDER BY last_login_at DESC;
```

**System Metrics:**
```sql
-- Total patients
SELECT COUNT(*) FROM patients;

-- Appointments by status
SELECT status, COUNT(*) as count
FROM patient_appointments
GROUP BY status
ORDER BY count DESC;

-- Active clinics
SELECT COUNT(*) FROM clinics WHERE status = 'active';

-- Recent system activity
SELECT
  DATE(created_at) as date,
  COUNT(*) as activities
FROM audit_log
WHERE created_at > now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Emergency Contacts

| Role | Contact | Phone | Email |
|------|---------|-------|-------|
| System Administrator | | | |
| Database Administrator | | | |
| Security Officer | | | |
| Supabase Support | | | support@supabase.io |
| Vercel Support | | | support@vercel.com |
| Executive Sponsor | | | |

### Change Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | January 2026 | Initial release | |
| | | | |

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Next Review:** April 2026
