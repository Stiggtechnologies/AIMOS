# AIMOS Test Data Cleanup Guide

**Status:** Ready to execute  
**Purpose:** Remove all test/demo data before Facebook Ads integration goes live  
**Created:** 2026-02-12  
**Estimated Time:** 10 minutes

---

## Why Clean Test Data?

Before ingesting real Facebook leads into AIMOS, we need to ensure:
1. ✅ **Clean analytics** - No test leads skewing conversion metrics
2. ✅ **Clean CRM** - Front desk sees only real leads in queue
3. ✅ **Clean user list** - No demo accounts in production
4. ✅ **Clean reporting** - Revenue/performance dashboards accurate
5. ✅ **HIPAA compliance** - No mock patient data mixed with real PHI

---

## What Gets Removed

### 1. Demo Users (5 accounts)
- `sarah.executive@aimrehab.ca`
- `michael.manager@aimrehab.ca`
- `jennifer.clinician@aimrehab.ca`
- `david.admin@aimrehab.ca`
- `amanda.contractor@aimrehab.ca`

**Why:** These were created for system testing. No real humans behind them.

### 2. Test CRM Leads
Leads matching these patterns:
- Names: "Test", "Demo", "Sample", "Example"
- Emails: Contains "test", "demo", or "@example.com"
- Phone: Contains "555" (North American test numbers)
- External IDs: Starts with "test_", "demo_", "sample_"

**Why:** Fake leads created during integration testing.

### 3. Test Communications
- Conversations with phone numbers like `+15551234567`
- Inbound SMS messages from test numbers

**Why:** Sandbox Twilio testing messages.

### 4. Sample Bookings & Appointments
- Appointments with notes containing "sample", "test", or "demo"
- Old treatment room bookings (>30 days)

**Why:** Demo scheduler data from development.

---

## What Gets KEPT (Important!)

✅ **Reference data:**
- Lead sources (Facebook Ads, referrals, etc.)
- Service lines (Physio, WCB, MVA, etc.)
- Payor types (WCB, Insurance, Private Pay, etc.)
- CLV tiers (High/Medium/Low value)
- Clinics (AIM Edmonton, etc.)
- Treatment rooms and configurations

✅ **System configuration:**
- Clinical protocols and evidence
- Starter packs (ACL, Concussion, etc.)
- AI agent definitions
- Workflow templates

✅ **Real patient data:**
- Any leads that don't match test patterns
- Actual appointments with real patients
- Real staff user accounts

---

## Pre-Cleanup Verification (Required)

Run this query in Supabase SQL Editor to see what will be removed:

```bash
# From AIMOS directory
psql [your-connection-string] -f verify-test-data-cleanup.sql > before-cleanup.txt
```

Or in Supabase Dashboard → SQL Editor:
1. Copy contents of `verify-test-data-cleanup.sql`
2. Run query
3. Review results carefully
4. **Export results** for your records

**What to look for:**
- Aggregate Counts section shows number of test records
- If "Total Real Leads" is 0, you have no production data yet (expected)
- If "Total Real Leads" > 0, verify those leads won't be affected

---

## Cleanup Procedure

### Step 1: Backup Current State (Optional but Recommended)

```bash
# From AIMOS directory
cd /Users/orvilledavis/.openclaw/workspace/AIMOS

# Backup via Supabase Dashboard
# Dashboard → Database → Backups → Create Backup
# Or use CLI:
supabase db dump -f backup-before-cleanup-$(date +%Y%m%d).sql
```

### Step 2: Run Database Cleanup Migration

```bash
# Deploy the cleanup migration
supabase db push

# Or run specific migration:
supabase migration up 20260212230000_cleanup_test_data
```

**Expected output:**
```
Applying migration: 20260212230000_cleanup_test_data
Cleanup Complete:
- Remaining test leads: 0
- Remaining demo users: 0
- Remaining test bookings: 0
✅ Migration applied successfully
```

### Step 3: Clean Auth Users (Manual)

```bash
# Run the auth cleanup script
./cleanup-test-users.sh

# When prompted, enter:
# - Project URL: https://[your-project-id].supabase.co
# - Service Role Key: [from Supabase Dashboard → Settings → API]
```

**Expected output:**
```
📊 Summary:
  Deleted: 5 users
  Errors: 0
✅ All demo users removed successfully!
```

**Alternative (Manual via Dashboard):**
1. Go to Supabase Dashboard → Authentication → Users
2. Search for each demo email
3. Click "..." → Delete User
4. Confirm deletion

### Step 4: Post-Cleanup Verification

Run the verification query again:

```bash
psql [your-connection-string] -f verify-test-data-cleanup.sql > after-cleanup.txt

# Compare before and after
diff before-cleanup.txt after-cleanup.txt
```

**Expected results:**
- ✅ Total Test Users: 0
- ✅ Total Test Leads: 0
- ✅ Total Test Conversations: 0
- ✅ Production Readiness: READY

---

## Verification Checklist

After cleanup, verify these in Supabase Dashboard:

### CRM Module
- [ ] Go to Table Editor → `crm_leads`
- [ ] Run: `SELECT * FROM crm_leads WHERE phone LIKE '%555%';`
- [ ] Expected: 0 rows
- [ ] Run: `SELECT * FROM crm_leads ORDER BY created_at DESC LIMIT 10;`
- [ ] Expected: Only real leads (or empty if no production data yet)

### Authentication
- [ ] Go to Authentication → Users
- [ ] Search: "demo"
- [ ] Expected: 0 results
- [ ] Search: "@aimrehab.ca"
- [ ] Expected: 0 results (unless you have real staff with that domain)

### Reference Data (Should NOT be empty)
- [ ] `SELECT * FROM crm_lead_sources;`
- [ ] Expected: Facebook Ads, Referrals, etc.
- [ ] `SELECT * FROM crm_service_lines;`
- [ ] Expected: Physio, WCB, MVA, etc.
- [ ] `SELECT * FROM clinics;`
- [ ] Expected: AIM Edmonton, etc.

---

## If Something Goes Wrong

### Scenario 1: Migration fails midway

```sql
-- Check migration status
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 5;

-- If partially applied, roll back manually:
BEGIN;
-- Restore from backup
-- Re-run cleanup migration
COMMIT;
```

### Scenario 2: Real data was accidentally deleted

```bash
# Restore from backup taken in Step 1
supabase db restore backup-before-cleanup-YYYYMMDD.sql
```

### Scenario 3: Auth users won't delete

**Possible causes:**
- Service Role Key lacks admin permissions
- Users have active sessions

**Solution:**
1. Verify Service Role Key in Dashboard → Settings → API
2. Use Supabase Dashboard manual delete (always works)
3. Check for dependent records (shouldn't be any after DB cleanup)

---

## Post-Cleanup Actions

After successful cleanup:

### 1. Deploy Facebook Ads Integration

```bash
cd /Users/orvilledavis/.openclaw/workspace/AIMOS
./deploy-facebook-integration.sh
```

### 2. Set Up Zapier

Follow: `FACEBOOK-ADS-AIMOS-INTEGRATION-SUMMARY.md`

### 3. Test with Real Lead

1. Submit a real lead through your Facebook form
2. Verify it appears in AIMOS CRM within seconds
3. Check email notification to `aim2recover@albertainjurymanagement.ca`
4. Verify lead details are correct
5. Contact the lead (high priority!)

### 4. Monitor First 24 Hours

**Check hourly:**
- AIMOS → CRM → Live Lead Queue
- Supabase → Functions → facebook-leads-webhook → Logs
- Email inbox for lead notifications

**Look for:**
- ✅ Leads appearing correctly
- ✅ Phone numbers formatted properly (+1...)
- ✅ Service line auto-matched correctly
- ✅ Priority set to HIGH
- ❌ Any error logs in webhook

---

## FAQ

**Q: What if I need the demo users back for testing?**

A: Re-create them via `DEMO_USERS.md` guide. They're just test accounts.

---

**Q: Will this affect my current ad campaign?**

A: No. The cleanup only removes database records. Your Facebook ads keep running. Once Zapier is set up, new leads will flow in automatically.

---

**Q: What if a real lead came in during development and matches a test pattern?**

A: Review the `verify-test-data-cleanup.sql` output BEFORE running cleanup. Manually adjust the cleanup SQL to exclude specific records if needed.

---

**Q: Can I test the integration before cleaning test data?**

A: Yes! You can deploy the Facebook integration first and test with a single lead. That lead will be marked as test if it has a test phone number (555...). Clean up afterward.

**Recommended:** Clean first, then deploy. Cleaner that way.

---

**Q: How do I know cleanup worked?**

A: Run `verify-test-data-cleanup.sql` after cleanup. Look for:
- Total Test Users: 0
- Total Test Leads: 0
- Production Readiness: ✅ READY

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| 1. Pre-cleanup verification | 2 min | ⏳ Pending |
| 2. Run DB cleanup migration | 1 min | ⏳ Pending |
| 3. Clean auth users | 2 min | ⏳ Pending |
| 4. Post-cleanup verification | 2 min | ⏳ Pending |
| 5. Deploy FB integration | 5 min | ⏳ Pending |
| 6. Set up Zapier | 15 min | ⏳ Pending |
| **Total** | **~30 min** | |

---

## Ready to Execute?

1. ✅ Read this guide
2. ✅ Run pre-cleanup verification
3. ✅ Review what will be deleted
4. ✅ Take backup (optional but recommended)
5. ✅ Run cleanup migration
6. ✅ Clean auth users
7. ✅ Verify cleanup worked
8. ✅ Deploy Facebook integration
9. ✅ Test with real lead
10. ✅ Celebrate clean data! 🎉

---

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20260212230000_cleanup_test_data.sql` | Main cleanup migration |
| `cleanup-test-users.sh` | Auth users cleanup script |
| `verify-test-data-cleanup.sql` | Before/after verification queries |
| `TEST_DATA_CLEANUP_GUIDE.md` | This guide |
| `deploy-facebook-integration.sh` | Next step after cleanup |

---

## Support

**Questions?** Ask Axium or check:
- Supabase Dashboard → Database → Logs
- Supabase Dashboard → Functions → Logs
- `verify-test-data-cleanup.sql` results

---

**Status:** Ready to execute. Clean test data → Deploy FB integration → Capture real leads.

**Decision:** Execute cleanup now to prepare for production Facebook Ads integration.
