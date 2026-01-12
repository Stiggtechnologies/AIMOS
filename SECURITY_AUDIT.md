# Security Audit Checklist

## Overview
This document provides a comprehensive security audit checklist for the AIM Rehab Enterprise System. All items must be verified before production deployment.

## 1. Row Level Security (RLS) Audit

### 1.1 Core Tables

#### user_profiles
```sql
-- Test 1: Users can view their own profile
-- Execute as regular user
SELECT * FROM user_profiles WHERE id = auth.uid();
-- ✓ Expected: 1 row (own profile)

-- Test 2: Users cannot view other profiles (unless authorized)
SELECT * FROM user_profiles WHERE id != auth.uid();
-- ✓ Expected: 0 rows for regular users, all rows for executives/admins

-- Test 3: Verify policy coverage
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'user_profiles';
-- ✓ Expected: Policies for SELECT, UPDATE at minimum
```

**Status:** [ ] Verified

#### patients
```sql
-- Test 1: Patient can only see own record
-- Execute as patient user
SELECT * FROM patients WHERE user_id = auth.uid();
-- ✓ Expected: 1 row (own record)

SELECT * FROM patients WHERE user_id != auth.uid();
-- ✓ Expected: 0 rows

-- Test 2: Clinicians can see assigned patients only
-- Execute as clinician
SELECT p.* FROM patients p
JOIN patient_assignments pa ON p.id = pa.patient_id
WHERE pa.clinician_id = auth.uid();
-- ✓ Expected: Only assigned patients

-- Test 3: Admins can see all patients
-- Execute as admin
SELECT COUNT(*) FROM patients;
-- ✓ Expected: All patient records
```

**Status:** [ ] Verified

#### patient_documents
```sql
-- Test 1: Patients can only see visible documents
SELECT * FROM patient_documents
WHERE patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
AND is_visible_to_patient = false;
-- ✓ Expected: 0 rows

-- Test 2: Staff can see all documents
-- Execute as staff
SELECT * FROM patient_documents WHERE is_visible_to_patient = false;
-- ✓ Expected: Hidden documents visible to staff only
```

**Status:** [ ] Verified

#### patient_messages
```sql
-- Test 1: Users can only see their own messages
SELECT * FROM patient_messages
WHERE sender_id != auth.uid()
AND recipient_id != auth.uid();
-- ✓ Expected: 0 rows

-- Test 2: Cannot insert messages as other users
INSERT INTO patient_messages (sender_id, recipient_id, subject, message)
VALUES ('different-user-id', 'recipient-id', 'Test', 'Test');
-- ✓ Expected: Permission denied
```

**Status:** [ ] Verified

#### clinics
```sql
-- Test 1: Clinic managers can only see their clinics
SELECT * FROM clinics
WHERE id NOT IN (
  SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
);
-- ✓ Expected: 0 rows for clinic managers

-- Test 2: Executives can see all clinics
-- Execute as executive
SELECT COUNT(*) FROM clinics;
-- ✓ Expected: All clinics
```

**Status:** [ ] Verified

#### financial_metrics
```sql
-- Test 1: Regular staff cannot access financial data
-- Execute as clinician
SELECT * FROM financial_metrics;
-- ✓ Expected: 0 rows or permission denied

-- Test 2: Executives can access financial data
-- Execute as executive
SELECT * FROM financial_metrics;
-- ✓ Expected: All financial data visible
```

**Status:** [ ] Verified

### 1.2 RLS Policy Verification Queries

Run these queries to verify all tables have RLS enabled:

```sql
-- Check all tables for RLS
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
-- ✓ Expected: No results (all tables should have RLS enabled)

-- Check for tables without policies
SELECT
  t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND p.policyname IS NULL;
-- ✓ Expected: No results (all RLS-enabled tables should have policies)

-- Verify policy coverage by operation
SELECT
  tablename,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
  COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- ✓ Review: Ensure critical operations are covered
```

**Status:** [ ] Verified

## 2. Authentication & Authorization

### 2.1 Password Security
- [ ] Minimum password length enforced (8+ characters)
- [ ] Password complexity requirements
- [ ] Password hashing using bcrypt or stronger
- [ ] No passwords stored in plain text
- [ ] Password reset requires email verification
- [ ] Old passwords cannot be reused

### 2.2 Session Management
- [ ] Session timeout configured (recommended: 30 minutes)
- [ ] Secure session cookies (httpOnly, secure, sameSite)
- [ ] Session invalidation on logout
- [ ] Concurrent session handling
- [ ] JWT tokens have expiration
- [ ] Refresh tokens securely managed

### 2.3 Access Control
- [ ] Role-based access control (RBAC) implemented
- [ ] Principle of least privilege applied
- [ ] Permission checks on all sensitive operations
- [ ] API endpoints protected
- [ ] Frontend route guards implemented
- [ ] Middleware validates permissions

**Test Scenarios:**
```javascript
// Test 1: Access protected route without authentication
fetch('/api/patients')
// Expected: 401 Unauthorized

// Test 2: Access resource without permission
// Login as clinician, try to access executive data
fetch('/api/financial-metrics')
// Expected: 403 Forbidden

// Test 3: Verify JWT expiration
// Use expired token
fetch('/api/patients', { headers: { Authorization: 'Bearer expired-token' }})
// Expected: 401 Unauthorized
```

**Status:** [ ] Verified

## 3. Data Protection

### 3.1 Encryption
- [ ] HTTPS enforced on all connections
- [ ] TLS 1.2 or higher
- [ ] Database encryption at rest (Supabase default)
- [ ] Sensitive fields encrypted in database
- [ ] API keys encrypted in environment variables
- [ ] No encryption keys in source code

### 3.2 Data Sanitization
- [ ] Input validation on all forms
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (output encoding)
- [ ] CSRF protection enabled
- [ ] File upload validation (type, size)
- [ ] HTML sanitization for rich text

**Test Scenarios:**
```javascript
// Test 1: SQL Injection
const maliciousInput = "'; DROP TABLE patients; --";
// Attempt to insert in search field
// Expected: Input sanitized, query returns safely

// Test 2: XSS
const xssPayload = "<script>alert('XSS')</script>";
// Attempt to insert in text field
// Expected: Script tags encoded, not executed

// Test 3: File Upload
const maliciousFile = "malware.exe";
// Attempt to upload
// Expected: Rejected due to file type validation
```

**Status:** [ ] Verified

### 3.3 Data Exposure Prevention
- [ ] No sensitive data in URLs
- [ ] No sensitive data in logs
- [ ] No sensitive data in error messages
- [ ] API responses don't leak internal details
- [ ] Database errors not exposed to users
- [ ] Source maps disabled in production

**Verify:**
```bash
# Check for exposed secrets in code
grep -r "password\s*=\s*['\"]" src/
grep -r "api[_-]?key\s*=\s*['\"]" src/
grep -r "secret\s*=\s*['\"]" src/
# Expected: No hardcoded secrets
```

**Status:** [ ] Verified

## 4. HIPAA Compliance

### 4.1 Access Controls
- [ ] Unique user identification
- [ ] Emergency access procedures
- [ ] Automatic logoff
- [ ] Encryption and decryption
- [ ] Audit controls
- [ ] Integrity controls
- [ ] Person or entity authentication
- [ ] Transmission security

### 4.2 Audit Controls
- [ ] All access to PHI logged
- [ ] User actions tracked
- [ ] Audit logs protected from modification
- [ ] Audit logs retained for 6 years
- [ ] Failed login attempts logged
- [ ] Data access logged (who, what, when)

**Verify Audit Logging:**
```sql
-- Check patient_access_logs
SELECT * FROM patient_access_logs
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC
LIMIT 10;
-- ✓ Expected: Access events logged

-- Check audit_log table
SELECT * FROM audit_log
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC
LIMIT 10;
-- ✓ Expected: All CRUD operations logged
```

**Status:** [ ] Verified

### 4.3 Data Integrity
- [ ] Data cannot be altered or destroyed inappropriately
- [ ] Electronic PHI validated for accuracy
- [ ] Mechanisms to authenticate PHI
- [ ] Version control for documents
- [ ] Change tracking enabled

**Status:** [ ] Verified

### 4.4 Business Associate Agreements
- [ ] BAA signed with Supabase
- [ ] BAA signed with Vercel
- [ ] BAA signed with OpenAI (if using)
- [ ] BAA signed with any other third-party vendors
- [ ] Vendor security assessments completed

**Status:** [ ] Verified

## 5. API Security

### 5.1 API Endpoint Protection
- [ ] All endpoints require authentication
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Output encoding applied
- [ ] Error handling doesn't leak information
- [ ] CORS properly configured

**Test Rate Limiting:**
```bash
# Test rate limiting
for i in {1..100}; do
  curl -X POST https://your-api/endpoint
done
# Expected: Rate limit exceeded error after threshold
```

**Status:** [ ] Verified

### 5.2 Edge Functions Security
- [ ] Environment variables secured
- [ ] CORS headers properly set
- [ ] Authentication required
- [ ] Input validation
- [ ] Error handling implemented
- [ ] Timeout configured

**Review Edge Functions:**
```typescript
// Verify CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Should be specific domain in production
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Verify authentication check
const token = req.headers.get('Authorization');
if (!token) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Status:** [ ] Verified

## 6. Infrastructure Security

### 6.1 Environment Variables
- [ ] All secrets in environment variables
- [ ] Environment variables not committed to git
- [ ] Different keys for development/production
- [ ] Regular key rotation policy
- [ ] Access to environment variables restricted

**Verify:**
```bash
# Check .gitignore
cat .gitignore | grep ".env"
# Expected: .env files ignored

# Check for exposed .env in git history
git log --all --full-history -- "*.env"
# Expected: No .env files committed
```

**Status:** [ ] Verified

### 6.2 Dependency Security
- [ ] No known vulnerabilities in dependencies
- [ ] Regular dependency updates
- [ ] Security patches applied promptly
- [ ] Dependency scanning enabled

**Run Security Audit:**
```bash
npm audit
# Expected: 0 vulnerabilities

# Check for outdated packages
npm outdated
# Expected: Review and update as needed
```

**Status:** [ ] Verified

### 6.3 Database Security
- [ ] Database not publicly accessible
- [ ] Strong database passwords
- [ ] Database backups encrypted
- [ ] Point-in-time recovery enabled
- [ ] Database connection pooling configured
- [ ] Prepared statements used (SQL injection prevention)

**Status:** [ ] Verified

## 7. Application Security

### 7.1 Frontend Security
- [ ] Content Security Policy (CSP) headers
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy set
- [ ] No inline JavaScript (CSP compliant)

**Check Headers:**
```bash
curl -I https://your-app.vercel.app
# Verify security headers present
```

**Status:** [ ] Verified

### 7.2 Error Handling
- [ ] Generic error messages to users
- [ ] Detailed errors logged server-side only
- [ ] Stack traces not exposed
- [ ] Error logging sanitized (no sensitive data)
- [ ] 404 pages don't leak path information

**Status:** [ ] Verified

## 8. Third-Party Integrations

### 8.1 Supabase Security
- [ ] Row Level Security enabled on all tables
- [ ] Service role key secured (not in client code)
- [ ] Anon key has limited permissions
- [ ] Real-time subscriptions secured
- [ ] File storage policies configured
- [ ] Database backups enabled

**Status:** [ ] Verified

### 8.2 OpenAI Integration
- [ ] API key secured in environment variables
- [ ] User input sanitized before sending
- [ ] Response validation implemented
- [ ] Rate limiting on AI requests
- [ ] Error handling for API failures
- [ ] Data retention policy understood

**Status:** [ ] Verified

## 9. Monitoring & Alerting

### 9.1 Security Monitoring
- [ ] Failed login attempts monitored
- [ ] Unusual access patterns detected
- [ ] Database query monitoring
- [ ] API usage monitoring
- [ ] Error rate monitoring
- [ ] Real-time security alerts

**Status:** [ ] Verified

### 9.2 Incident Response
- [ ] Incident response plan documented
- [ ] Security team contacts defined
- [ ] Escalation procedures clear
- [ ] Data breach notification process
- [ ] Recovery procedures tested
- [ ] Post-incident review process

**Status:** [ ] Verified

## 10. Penetration Testing

### 10.1 Recommended Tests
- [ ] Authentication bypass attempts
- [ ] Authorization bypass attempts
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Session hijacking attempts
- [ ] API fuzzing
- [ ] File upload vulnerabilities

### 10.2 Tools to Use
- OWASP ZAP
- Burp Suite
- SQLMap
- Metasploit
- Nmap
- Nikto

**Status:** [ ] Penetration Test Completed

## Security Audit Sign-Off

### Audit Completion

| Audit Section | Status | Auditor | Date | Notes |
|---------------|--------|---------|------|-------|
| RLS Policies | | | | |
| Authentication | | | | |
| Data Protection | | | | |
| HIPAA Compliance | | | | |
| API Security | | | | |
| Infrastructure | | | | |
| Application Security | | | | |
| Third-Party Integrations | | | | |
| Monitoring | | | | |
| Penetration Testing | | | | |

### Final Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Security Officer | | | |
| Technical Lead | | | |
| Compliance Officer | | | |
| Chief Information Officer | | | |

### Issues Found

| ID | Severity | Description | Status | Resolution |
|----|----------|-------------|--------|------------|
| | Critical | | | |
| | High | | | |
| | Medium | | | |
| | Low | | | |

**Production Deployment:** Approved / Not Approved

**Date:** _______________

**Next Audit Due:** _______________
