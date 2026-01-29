# AIM OS Scheduler - Quick Start Guide

## ✅ What's Implemented vs Requirements

### ✓ FULLY IMPLEMENTED

**Frame 1 - Day View by Provider**
- ✓ Top navigation bar (Clinic, Date, View Toggle)
- ✓ Filter bar (Providers, Statuses, AI Toggle)
- ✓ Time rail (15-min increments, 8am-7pm)
- ✓ Provider columns with headers
- ✓ Appointment blocks (color-coded, sized by duration)
- ✓ Intelligence panel (right side)
- ✓ AI insights (no-show risk, overbooking, capacity)

**Frame 2 - Appointment Detail Drawer**
- ✓ Slide-in drawer on click
- ✓ Patient details
- ✓ Appointment info
- ✓ AI risk analysis
- ✓ "Open in Practice Perfect" button
- ✓ Read-only enforcement

**Frame 4 - Empty State**
- ✓ No data message
- ✓ Filter reset options

**Data & Backend**
- ✓ Scheduler service with all CRUD operations
- ✓ Practice Perfect field mapping
- ✓ Status color coding
- ✓ AI insight generation
- ✓ Demo data seeded for today

### ⏳ PARTIALLY IMPLEMENTED

**Frame 3 - Week View**
- ❌ Week view toggle exists but renders day view only
- 📝 Marked as Phase 2 feature
- 📝 UI shell is ready, just needs grid logic update

### 📋 WHAT'S MISSING (By Design)

**Phase 2 Features (Intentionally Deferred)**
- Write operations (appointments remain read-only)
- Drag-and-drop scheduling
- Inline editing
- Automated AI actions
- Room/resource view (beyond providers)
- Multi-provider comparison view

These are **intentional omissions** per the phased rollout strategy to ensure Practice Perfect remains the system of record.

---

## 🚀 How to Access the Scheduler

### Step 1: Login

Use one of the demo accounts:
```
Email: jennifer.clinician@aimrehab.ca
Password: Demo2026!Clinician
```

### Step 2: Navigate to AIM OS

1. After login, you'll see the main dashboard
2. Click **"AIM OS"** in the top navigation bar
3. Or click the **"AIM OS"** card if you see it

### Step 3: Open Scheduler

1. On the AIM OS dashboard, you'll see module tiles
2. Click the **"Scheduler"** tile (first one, blue with calendar icon)
3. Stats show: "Today - 24 appts"

### Step 4: You're In!

You should now see:
- **Left**: Time rail (8:00 AM - 7:00 PM)
- **Center**: Provider column (Jennifer Wong)
- **Right**: AI Intelligence Panel
- **Top**: Date picker, clinic selector, view toggle

---

## 📊 Mock Data - What You'll See

### Today's Schedule (12 Appointments)

**Jennifer Wong** - Clinician at Edmonton Central

#### Morning (8am-12pm)
```
08:00-09:00 | WHITLEY, George      | Initial Assessment    | ✅ Completed
09:15-09:45 | JOHNSON, Sarah       | Follow-up Treatment   | ✅ Completed
10:00-10:30 | CHEN, Michael        | Treatment Session     | 🚶 Checked In
10:45-11:30 | RODRIGUEZ, Emily     | Re-assessment         | ⏳ Scheduled
11:45-12:15 | AMIRI, Jahan         | Treatment Session     | ⏳ Scheduled 🧠 95% NO-SHOW RISK
```

#### Lunch
```
12:15-13:00 | [LUNCH BREAK] - Gray Block
```

#### Afternoon (1pm-4pm)
```
13:00-13:30 | THOMPSON, Lisa       | Treatment Session     | ⏳ Scheduled
13:45-14:45 | PARK, David          | Initial Assessment    | ⏳ Scheduled
14:45-15:00 | [CHART REVIEW] - Gray Block
15:00-15:30 | BROWN, Jennifer      | Follow-up Treatment   | ⏳ Scheduled 🧠 95% NO-SHOW RISK
15:45-16:15 | WILSON, Robert       | Treatment Session     | ⏳ Scheduled
```

#### Evening (4pm-7pm)
```
16:30-17:15 | MARTINEZ, Amanda     | Re-assessment         | ⏳ Scheduled
17:30-18:00 | LEE, Kevin           | Treatment Session     | ⏳ Scheduled
18:15-19:00 | DAVIS, Rachel        | Discharge Assessment  | ⏳ Scheduled
```

### AI Intelligence Panel Shows

**2 High No-Show Risk Alerts:**
1. 🔶 **Jahan Amiri - 11:45 AM**
   - Confidence: 95%
   - Suggestion: Send reminder or fill with standby

2. 🔶 **Jennifer Brown - 3:00 PM**
   - Confidence: 95%
   - Suggestion: Send reminder or fill with standby

**Why These Are Flagged:**
- `no_show` field set to `true` in database
- System automatically detects and highlights with orange border
- Appears in intelligence panel with suggested actions

### Color Coding You'll See

- **Light Blue** (#DBEAFE) - Scheduled appointments
- **Green** (#86EFAC) - Completed appointments
- **Yellow** (#FDE68A) - Checked in patients
- **Gray** (#E5E7EB) - Breaks & admin blocks
- **Orange Border** - High no-show risk (AI indicator)

---

## 🎯 Interactive Features to Try

### 1. Click an Appointment Block

**What Happens:**
- Right-side drawer slides in
- Shows patient name
- Displays appointment time
- Shows provider (Jennifer Wong)
- Reveals AI risk analysis (if applicable)
- "Open in Practice Perfect" button

**Try This:**
- Click the **"AMIRI, Jahan - 11:45 AM"** appointment
- Notice the 95% no-show risk warning
- See the AI explanation and suggested action

### 2. Toggle AI Overlays

**Location:** Filter bar (top), right side

**What It Does:**
- ON: Shows orange borders on risky appointments
- OFF: Hides AI visual indicators (intelligence panel still shows)

**Try This:**
- Toggle it off - orange borders disappear
- Toggle it on - they reappear

### 3. Change Date

**Location:** Top navigation bar, center

**What Happens:**
- Today shows 12 appointments
- Other dates will show "No scheduling data available"
- (Mock data only seeded for today)

### 4. Change Clinic

**Location:** Top navigation bar, left

**Options:**
- Edmonton Central (has data)
- Calgary North (empty)
- Calgary South (empty)

**Try This:**
- Switch to Calgary North
- See empty state message
- Switch back to Edmonton Central

### 5. Explore the Intelligence Panel

**What You'll Find:**
- 2 insight cards
- Each shows:
  - Risk type icon
  - Patient name
  - Time
  - Confidence %
  - Suggested action

**Try This:**
- Read the suggestions
- Notice they're advisory only (no "Execute" button)
- This is human-in-the-loop design

---

## 📸 Visual Layout Description

```
┌─────────────────────────────────────────────────────────────────────┐
│ AIM OS SCHEDULER  [📍 Edmonton ▼] [◀ 01/29/2026 ▶] [Day|Week]      │
├─────────────────────────────────────────────────────────────────────┤
│ Filters: [All Providers] [All Statuses]        ☑ Show AI Overlays  │
├──────┬──────────────────────────────────────────┬───────────────────┤
│ TIME │  JENNIFER WONG  👤 Clinician            │ 🧠 Scheduling     │
│ RAIL │  Progress: ████████░░ 85%               │    Intelligence   │
├──────┼──────────────────────────────────────────┤                   │
│ 8:00 │  ┌──────────────────────────┐           │ 🔶 High No-Show   │
│      │  │ WHITLEY, George          │           │    Risk (2)       │
│ 8:15 │  │ ✅ 8:00-9:00 Initial     │           │                   │
│      │  │ Lower back pain          │           │ AMIRI, Jahan      │
│ 8:30 │  │ [Green Background]       │           │ 11:45 AM          │
│      │  └──────────────────────────┘           │ Confidence: 95%   │
│ 8:45 │                                          │ → Send reminder   │
│      │                                          │                   │
│ 9:00 │  ┌──────────────────────────┐           │ BROWN, Jennifer   │
│ 9:15 │  │ JOHNSON, Sarah           │           │ 3:00 PM           │
│      │  │ ✅ 9:15-9:45             │           │ Confidence: 95%   │
│ 9:30 │  │ [Green Background]       │           │ → Send reminder   │
│      │  └──────────────────────────┘           │                   │
│ 9:45 │                                          │                   │
│10:00 │  ┌──────────────────────────┐           │ [Click any card   │
│      │  │ CHEN, Michael            │           │  to highlight     │
│10:15 │  │ 🚶 10:00-10:30           │           │  appointment]     │
│      │  │ [Yellow Background]      │           │                   │
│10:30 │  └──────────────────────────┘           │                   │
│      │                                          │                   │
│10:45 │  ┌──────────────────────────┐           │                   │
│11:00 │  │ RODRIGUEZ, Emily         │           │                   │
│      │  │ ⏳ 10:45-11:30           │           │                   │
│11:15 │  │ [Light Blue]             │           │                   │
│      │  └──────────────────────────┘           │                   │
│11:30 │                                          │                   │
│      │  ┌──────────────────────────┐           │                   │
│11:45 │  │ AMIRI, Jahan             │           │                   │
│12:00 │  │ ⏳ 11:45-12:15           │           │                   │
│      │  │ 🧠 95% no-show risk      │           │                   │
│12:15 │  │ [Orange Border]          │           │                   │
│      │  └──────────────────────────┘           │                   │
│      │  ┌──────────────────────────┐           │                   │
│12:30 │  │ [LUNCH BREAK]            │           │                   │
│      │  │ [Gray Block]             │           │                   │
│12:45 │  └──────────────────────────┘           │                   │
│      │   ...more appointments...                │                   │
└──────┴──────────────────────────────────────────┴───────────────────┘
```

---

## 🔍 How to Verify Everything Works

### Checklist:

- [ ] Can see today's date in the header
- [ ] Time rail shows 8:00 AM to 7:00 PM
- [ ] Jennifer Wong column shows appointments
- [ ] 2 completed appointments (green)
- [ ] 1 checked-in appointment (yellow)
- [ ] 9 scheduled appointments (light blue)
- [ ] 2 appointments have orange borders
- [ ] 2 gray blocks (lunch & admin)
- [ ] Intelligence panel shows 2 alerts
- [ ] Clicking appointment opens drawer
- [ ] Drawer shows patient name
- [ ] "Open in Practice Perfect" button visible
- [ ] AI overlay toggle works
- [ ] Date picker changes date
- [ ] Clinic selector switches clinics

---

## 🐛 Troubleshooting

### "No scheduling data available"

**Causes:**
1. Wrong date selected (data only for today)
2. Wrong clinic selected (data only for Edmonton Central)
3. Migration didn't run

**Solution:**
```sql
-- Check if data exists
SELECT COUNT(*) FROM patient_appointments
WHERE appointment_date = CURRENT_DATE
  AND clinic_id = 'bf3a060f-a018-43da-b45a-e184a40ec94b';

-- Should return 12
```

### "No providers found"

**Cause:** Jennifer Wong user not created

**Solution:**
Run the setup-demo-users edge function or check:
```sql
SELECT * FROM user_profiles WHERE email = 'jennifer.clinician@aimrehab.ca';
```

### Appointments not showing

**Check:**
1. Are you logged in as Jennifer?
2. Is today's date selected?
3. Is Edmonton Central selected?
4. Run migration: `seed_scheduler_appointments_with_scheduled_at`

---

## 💡 Tips for Demo/Presentation

1. **Start with Overview**
   - "This mirrors Practice Perfect but adds AI intelligence"
   - "Everything is read-only - PP remains source of truth"

2. **Show the Problem**
   - Point to orange-bordered appointments
   - "These patients have 95% chance of no-show"
   - "Without AI, we wouldn't know until they don't show"

3. **Click Through**
   - Click high-risk appointment
   - Show AI explanation
   - "System suggests actions but requires human approval"

4. **Highlight Safety**
   - Toggle AI overlays off/on
   - "Staff can focus on core work, check AI when ready"
   - "'Open in Practice Perfect' for any changes"

5. **Discuss Phases**
   - "Phase 1: Intelligence only (now)"
   - "Phase 2: Suggested actions with approval"
   - "Phase 3: Limited automation"

---

## 📚 Additional Resources

- **Full Documentation**: See `AIM_OS_SCHEDULER_GUIDE.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Data Models**: See migration files in `supabase/migrations/`
- **Service Code**: `src/services/schedulerService.ts`
- **UI Component**: `src/components/aim-os/SchedulerView.tsx`

---

## ✅ Success Criteria

You'll know it's working when:
1. You see 12 appointments for Jennifer Wong
2. Two have orange warning borders
3. Intelligence panel shows 2 alerts
4. Clicking opens a detailed drawer
5. Colors match appointment statuses
6. Time blocks are properly sized

---

**Questions?** Check the database:
```sql
-- View all today's appointments
SELECT
  p.first_name || ' ' || p.last_name as patient,
  pa.start_time,
  pa.end_time,
  pa.status,
  pa.no_show
FROM patient_appointments pa
JOIN patients p ON pa.patient_id = p.id
WHERE pa.appointment_date = CURRENT_DATE
ORDER BY pa.start_time;
```

**Ready to explore!** 🚀
