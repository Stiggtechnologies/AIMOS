# 🚀 START HERE - AIM OS Quick Setup

**Last Updated:** March 13, 2026

---

## GET UP AND RUNNING IN 5 MINUTES

### Step 1: Access Your System

Your AIM OS application is already deployed and running!

**Local Development:**
```bash
npm run dev
```

**Production URL:**
Your app is live at your Vercel/hosting URL

---

### Step 2: First Login

**Test User Credentials:**

The system comes with demo users for each role:

```
EXECUTIVE / OWNER
Email: orville@aim.clinic
Role: Executive, Owner
Access: All modules, all clinics

OPERATIONS MANAGER
Email: sarah.operations@aim.clinic
Role: Operations Manager
Access: Operations, Scheduler, Analytics

FRONT DESK
Email: jessica.frontdesk@aim.clinic
Role: Front Desk
Access: Scheduler, Patient intake, Communications

CLINICIAN
Email: dr.patel@aim.clinic
Role: Physiotherapist
Access: Scheduler, Clinical charting, Patient portal

MARKETING MANAGER
Email: emma.marketing@aim.clinic
Role: Marketing Manager
Access: CRM, Growth OS, Analytics
```

**Note:** To get actual passwords or create new users, use the admin seed endpoint (see below).

---

### Step 3: Create Your First Real User

#### Option A: Use Admin Seed Endpoint

1. Navigate to your deployment URL
2. Go to `/test-admin-seed.html`
3. Click "Seed Demo Users"
4. Login with the created credentials

#### Option B: Use SQL Directly

Run this in your Supabase SQL Editor:

```sql
-- Create a new user account
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'your.email@aim.clinic',
  crypt('your-password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Your","last_name":"Name"}',
  now(),
  now()
) RETURNING id;

-- Note the returned ID, then create profile:
INSERT INTO user_profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  department
) VALUES (
  'USER_ID_FROM_ABOVE',
  'your.email@aim.clinic',
  'Your',
  'Name',
  'executive',
  'Leadership'
);

-- Grant clinic access
INSERT INTO clinic_access (
  user_id,
  clinic_id,
  access_level
) VALUES (
  'USER_ID_FROM_ABOVE',
  (SELECT id FROM clinics WHERE name = 'AIM South Commons'),
  'full'
);
```

---

### Step 4: Navigate the Dashboard

After logging in, you'll see the main dashboard:

**Left Sidebar Navigation:**
- Dashboard
- Scheduler
- Operations
- CRM
- Growth OS
- AIM OS (Executive Intelligence)
- Intranet
- Launches
- Partners
- Analytics

**Try These First Actions:**

1. **View Today's Schedule**
   - Click "Scheduler" in sidebar
   - See current week's appointments
   - Click any time slot to book

2. **Check Clinic Capacity**
   - Click "Operations" → "Capacity View"
   - See real-time room utilization
   - Monitor clinician schedules

3. **Review Financial Metrics**
   - Click "AIM OS" → "Financial View"
   - See revenue, expenses, cash flow
   - Review accounts receivable

4. **Access Evidence Library**
   - Click "AIM OS" → "Clinical Intelligence"
   - Browse evidence-based protocols
   - Search for conditions

---

## 📚 KEY DOCUMENTS TO READ

### For Executives & Owners
1. **REQUIREMENTS_COVERAGE_MATRIX.md** - What the system does (95% coverage)
2. **QUICK_START_ACCESS_GUIDE.md** - How to use everything
3. **GAP_CLOSURE_PLAN.md** - What's being finished before launch
4. **DEPLOYMENT_COMPLETE.md** - Technical deployment status

### For Operations Managers
1. **QUICK_START_ACCESS_GUIDE.md** - Complete feature walkthrough
2. **SCHEDULER_QUICK_START.md** - Scheduling and capacity
3. **STAFF_QUICK_REFERENCE.md** - Daily operational procedures
4. **OPERATIONS_DATA_MODELS_VERIFICATION.md** - How data is organized

### For Clinicians
1. **QUICK_START_ACCESS_GUIDE.md** - Feature guide
2. **CDS_QUICK_START.md** - Clinical decision support usage
3. **STARTER_PACKS_IMPLEMENTATION.md** - Evidence-based protocols
4. **PATIENT_COMMUNICATION_TEMPLATES.md** - Patient messaging

### For IT/Admin
1. **DEPLOYMENT_COMPLETE.md** - Technical setup
2. **SECURITY_AUDIT.md** - Security implementation
3. **TESTING_QA_PLAN.md** - QA procedures
4. **PERFORMANCE_OPTIMIZATION_GUIDE.md** - Performance tuning

---

## 🎯 COMMON FIRST TASKS

### Book Your First Appointment

1. Go to **Scheduler**
2. Click a time slot (e.g., tomorrow at 9:00 AM)
3. Fill in patient details:
   ```
   First Name: John
   Last Name: Smith
   Phone: 780-555-0123
   Email: john.smith@email.com
   Service: Physiotherapy Initial Assessment
   Clinician: Dr. Patel
   Room: Treatment Room 1
   ```
4. Click **Book Appointment**
5. System sends confirmation automatically

### Add a New Lead to CRM

1. Go to **CRM** → **Intake Pipeline**
2. Click **New Lead**
3. Fill in:
   ```
   Name: Sarah Johnson
   Phone: 780-555-0456
   Source: Google Search
   Complaint: Low back pain
   Insurance: WCB
   ```
4. Click **Save**
5. System tracks conversion funnel automatically

### Document a Patient Visit (SOAP Note)

1. Go to **Scheduler**
2. Find patient appointment
3. Click **Chart**
4. Complete SOAP sections:
   - Subjective: Patient complaints
   - Objective: Measurements and findings
   - Assessment: Diagnosis
   - Plan: Treatment plan
5. Click **Save & Sign**
6. System stores in clinical record

### Run a Financial Report

1. Go to **AIM OS** → **Revenue Analytics**
2. Select date range (e.g., "Last 30 Days")
3. View metrics:
   - Total Revenue
   - Collections Rate
   - AR Aging
   - Revenue by Service
4. Click **Export** for detailed CSV

### Set Up a New Clinic Launch

1. Go to **Launches**
2. Click **New Launch Program**
3. Fill in:
   ```
   Clinic Name: AIM West Edmonton
   Address: [address]
   Target Date: [date]
   Template: Partner Clinic Launch
   ```
4. System generates 90-day project plan
5. Track through phase gates

---

## 🔧 QUICK TROUBLESHOOTING

### "I can't see any data"

**Cause:** Fresh database or wrong clinic selected

**Fix:**
1. Run the admin seed endpoint: `/test-admin-seed.html`
2. OR run: `/supabase/functions/seed-south-commons-launch`
3. Check clinic switcher (top right) - select "AIM South Commons"

### "I don't have permission"

**Cause:** User role doesn't have access

**Fix:**
1. Check your role in user profile
2. Have admin grant clinic access via SQL:
   ```sql
   INSERT INTO clinic_access (user_id, clinic_id, access_level)
   VALUES ('YOUR_USER_ID', 'CLINIC_ID', 'full');
   ```

### "Calendar is empty"

**Cause:** No appointments seeded yet

**Fix:**
1. Book test appointments manually
2. OR run scheduler seed: Check `SCHEDULER_QUICK_START.md`

### "Voice dictation not working"

**Cause:** Browser doesn't support or microphone not allowed

**Fix:**
1. Use Chrome or Edge (Safari/Firefox limited support)
2. Allow microphone access when prompted
3. Check browser permissions

---

## 📞 GETTING HELP

### Documentation

All documentation is in the project root:
- `QUICK_START_ACCESS_GUIDE.md` - Feature guide
- `GAP_CLOSURE_PLAN.md` - What's being built
- `REQUIREMENTS_COVERAGE_MATRIX.md` - Coverage analysis
- `DEPLOYMENT_COMPLETE.md` - Technical details

### In-App Help

- Click "?" icon (top right) for context help
- Navigate to **Intranet** → **Help Center**
- Check **Intranet** → **Academy** for video tutorials

### Support Channels

- **Technical Issues:** Create ticket in system
- **Training:** Check Intranet → Academy
- **Feature Requests:** Intranet → Ideas

---

## ✅ INITIAL SETUP CHECKLIST

### For First-Time Setup

- [ ] Logged in successfully
- [ ] Reviewed main dashboard
- [ ] Navigated to 3+ different modules
- [ ] Created or viewed a patient appointment
- [ ] Accessed Clinical Intelligence module
- [ ] Viewed Financial metrics
- [ ] Checked CRM/Lead pipeline
- [ ] Explored Intranet resources
- [ ] Read Quick Start Access Guide
- [ ] Bookmarked key documentation

### For Daily Operations

- [ ] Check Dashboard for alerts
- [ ] Review Scheduler for today
- [ ] Monitor Capacity View
- [ ] Check new leads in CRM
- [ ] Review after-hours calls
- [ ] Complete clinical documentation
- [ ] Check financial metrics
- [ ] Review automated daily report (7 PM)

---

## 🚀 NEXT STEPS

### Week 1: Learning
- [ ] Complete role-specific training (Intranet → Academy)
- [ ] Practice booking appointments
- [ ] Practice clinical documentation
- [ ] Review all dashboard views

### Week 2: Testing
- [ ] Book real test appointments
- [ ] Complete SOAP notes for test patients
- [ ] Run financial reports
- [ ] Test CRM lead workflow
- [ ] Test approval workflows

### Week 3: Training Team
- [ ] Train front desk staff
- [ ] Train clinicians
- [ ] Train operations staff
- [ ] Create clinic-specific SOPs

### Week 4: Go Live Prep
- [ ] Migrate real patient data
- [ ] Configure clinic-specific settings
- [ ] Set up real user accounts
- [ ] Final testing
- [ ] Go/No-Go decision

---

## 🎉 YOU'RE READY!

The system is **95% complete** and production-ready. The remaining 5% (multi-level approvals, voice dictation) will be finished before May 1 launch.

**What works right now:**
✅ Complete scheduler with real-time availability
✅ Full clinical charting and documentation
✅ Revenue cycle management and billing
✅ CRM with lead tracking and conversion
✅ Marketing analytics and ROI tracking
✅ Evidence-based clinical protocols
✅ Multi-clinic launch management
✅ Executive dashboards and reporting
✅ AI-powered insights and automation
✅ 25+ autonomous AI agents
✅ After-hours communication system
✅ Call tracking and attribution
✅ Partner clinic management

**Start exploring and contact your team with any questions!**

---

**Document Version:** 1.0
**Last Updated:** March 13, 2026
**Questions?** Check QUICK_START_ACCESS_GUIDE.md or contact your administrator
