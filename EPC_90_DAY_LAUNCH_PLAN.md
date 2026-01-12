# AIM Performance West × EPC: 90-Day Stand-Up Plan

## Executive Summary

The EPC 90-Day Launch Plan is now fully integrated into AIM OS, providing comprehensive tracking and management of the flagship embedded partner clinic from lease signing (Day 0) through operational stabilization (Day 90).

### Objective
Within 90 days of lease commencement, AIM Performance West will:
- Stand up a fully operational embedded clinic
- Begin converting EPC's 5,000 members
- Populate AIM OS with live operational, clinical, and financial data
- Deliver board-ready performance reporting
- Establish EPC as the flagship replication template

---

## System Architecture

### Database Schema (4 New Tables)

#### 1. `launch_weeks`
Weekly breakdown of the 90-day plan with objectives and key actions.

**Key Fields**:
- `week_number` (0-12): Sequential week identifier
- `week_label`: Human-readable label (e.g., "Week 0 (Day 0-7): Lease Activation")
- `start_day` / `end_day`: Day range within 90-day period
- `week_objective`: What this week aims to achieve
- `key_actions[]`: Array of specific actions to take
- `status`: not_started | in_progress | blocked | completed | skipped
- `completion_pct`: Auto-calculated from deliverables

#### 2. `launch_deliverables`
Concrete outputs expected at week milestones.

**Key Fields**:
- `week_id`: Links to specific week
- `deliverable_name`: What must be delivered
- `is_critical`: Whether this blocks launch progress
- `status`: pending | in_progress | completed | blocked | not_applicable
- `due_day`: Expected completion day (1-90)
- `completed_at` / `completed_by`: Audit trail

#### 3. `launch_daily_metrics`
Day-by-day operational metrics tracking.

**Key Fields**:
- `metric_date`: Specific date
- `day_number`: Day since launch start (1-90)
- `patients_treated_today` / `cumulative_patients`: Volume tracking
- `clinician_utilization_pct`: Staffing efficiency
- `data_completeness_pct`: AIM OS data quality
- `revenue_today` / `cumulative_revenue`: Financial tracking
- Partner-specific fields for conversion tracking

#### 4. `launch_target_metrics`
Expected metric thresholds at each week milestone.

**Key Fields**:
- `week_id`: Links to specific week
- `metric_name`: What to measure
- `target_value`: Expected threshold
- `target_operator`: >=, <=, =, >, <
- `is_critical`: Whether missing target blocks progress

### New Functions

1. **`calculate_week_completion(week_id)`**
   - Auto-calculates week completion based on deliverables
   - Returns percentage (0-100)

2. **`get_launch_day_number(clinic_launch_id)`**
   - Calculates current day since launch start
   - Returns integer day number

3. **`get_launch_status_summary(clinic_launch_id)`**
   - Returns comprehensive status snapshot
   - Includes: current day/week, deliverables status, latest metrics

---

## 90-Day Plan Structure

### Phase 1: Lease → Operational Readiness (Days 0-30)

#### Week 0 (Day 0-7): Lease Activation & Control Setup
**Objective**: Lock legal, operational, and governance foundations

**Key Actions**:
- Confirm lease effective date and terms
- Confirm rent, revenue share %, cap, exclusivity
- Appoint EPC Clinic Launch Lead
- Instantiate EPC clinic in AIM OS
- Enable partner flags and revenue share logic
- Confirm professional liability coverage

**Critical Deliverables**:
- ✅ EPC clinic live in AIM OS
- ✅ Launch roles assigned
- ✅ Zero open governance questions
- ✅ Revenue share logic configured

#### Week 1-2 (Day 8-14): Space + System Prep
**Objective**: Make the space usable, make the system ready for real data

**Key Actions**:
- Confirm treatment room layouts
- Install fixtures & equipment
- Finalize intake forms in AIM OS
- Finalize EPC member source tagging
- Assign and train initial clinicians

**Critical Deliverables**:
- ✅ Clinic space usable
- ✅ Staff trained
- ✅ AIM OS intake + scheduling ready
- ✅ Front desk script aligned

#### Week 3-4 (Day 15-30): Soft Open & Controlled Volume
**Objective**: Start seeing patients, validate workflows before scale

**Key Actions**:
- Launch soft open - EPC members only
- Manual review of first 20-30 patient journeys
- Enforce episode-of-care mandatory
- Confirm EPC revenue share math
- Confirm EPC dashboard shows no PHI

**Target Metrics**:
- 30-50 cumulative patients ✅
- ≥95% data completeness ✅
- 100% episode-of-care compliance ✅
- 100% source attribution ✅

---

### Phase 2: Scale & Stabilize (Days 31-60)

#### Week 5-6 (Day 31-45): Volume Ramp
**Objective**: Increase throughput, turn process into habit

**Key Actions**:
- Expand intake channels
- Enable EPC front desk referrals
- Deploy courtside QR intake
- Optimize scheduling templates
- Weekly EPC clinic performance review

**Target Metrics**:
- 80-120 cumulative patients ✅
- ≥70% clinician utilization ✅
- <7 days intake-to-first-visit ✅

#### Week 7-8 (Day 46-60): Partner Value Visibility
**Objective**: Make partnership tangible for EPC, prepare for board scrutiny

**Key Actions**:
- Activate EPC reporting cadence
- Deliver weekly anonymized metrics
- Refine pickleball injury programs
- Track revenue per EPC patient
- Monitor revenue share YTD vs cap

**Target Metrics**:
- 150-200 cumulative patients ✅
- 10-12% conversion rate ✅
- EPC dashboard actively referenced ✅

---

### Phase 3: Optimize & Prove (Days 61-90)

#### Week 9-10 (Day 61-75): Optimization
**Objective**: Improve unit economics, reduce friction, prepare replication

**Key Actions**:
- Optimize care pathways
- Reduce unnecessary visits
- Identify high-value programs
- Adjust staffing to demand
- Model conversion scenarios (12%/15%/18%)

#### Week 11-12 (Day 76-90): Board-Ready Closeout
**Objective**: Lock EPC as flagship success, prepare next-site rollout

**Key Actions**:
- Finalize 90-Day Performance Report
- Document conversion results
- Document lessons learned
- Clone EPC clinic config
- Validate <14-day launch time for next site
- Greenlight next 1-3 spokes

**Final Target Metrics (Day 90)**:
- 200+ cumulative patients ✅
- 10-15% conversion rate ✅
- ≥75% clinician utilization ✅
- ≥98% data completeness ✅
- 100% revenue share tracking accuracy ✅
- EPC dashboard board-ready ✅
- Template clone validated ✅

---

## Using the Launch Service

### Starting a Launch

```typescript
import { launchService } from './services/launchService';

// Start the launch (sets actual_start_date and status to 'in_progress')
const launch = await launchService.startLaunch(launchId);
```

### Getting Current Status

```typescript
// Get comprehensive status summary
const summary = await launchService.getLaunchStatusSummary(launchId);
console.log(`Day ${summary.current_day} - Week ${summary.current_week}`);
console.log(`${summary.completed_deliverables}/${summary.total_deliverables} deliverables done`);

// Get current day number
const dayNumber = await launchService.getLaunchDayNumber(launchId);

// Get current week
const currentWeek = await launchService.getCurrentWeek(launchId);
console.log(currentWeek.week_objective);
```

### Managing Weeks

```typescript
// Get all weeks for a launch
const weeks = await launchService.getWeeks(launchId);

// Get specific week
const week = await launchService.getWeekById(weekId);

// Update week status
await launchService.updateWeek(weekId, {
  status: 'in_progress',
  actual_start_date: new Date().toISOString().split('T')[0]
});

// Complete a week
await launchService.completeWeek(weekId);

// Get week completion percentage
const completionPct = await launchService.getWeekCompletionPercentage(weekId);
```

### Managing Deliverables

```typescript
// Get all deliverables for a launch
const allDeliverables = await launchService.getDeliverables(launchId);

// Get deliverables for a specific week
const weekDeliverables = await launchService.getDeliverables(launchId, weekId);

// Update deliverable status
await launchService.updateDeliverable(deliverableId, {
  status: 'completed',
  notes: 'All staff trained on EPC workflows'
});
```

### Logging Daily Metrics

```typescript
// Log today's metrics
await launchService.logDailyMetric({
  clinic_launch_id: launchId,
  partner_clinic_id: epcPartnerId,
  metric_date: new Date().toISOString().split('T')[0],
  day_number: 15,
  patients_treated_today: 12,
  cumulative_patients: 45,
  new_conversions_today: 3,
  clinician_utilization_pct: 72.5,
  data_completeness_pct: 96.8,
  revenue_today: 2850.00,
  cumulative_revenue: 42750.00,
  metadata: {}
});

// Get daily metrics history
const metrics = await launchService.getDailyMetrics(
  launchId,
  '2026-01-01', // start date
  '2026-03-31'  // end date
);
```

### Checking Target Metrics

```typescript
// Get target metrics for a week
const targets = await launchService.getTargetMetrics(weekId);

targets.forEach(target => {
  console.log(`${target.metric_name}: ${target.target_operator} ${target.target_value} ${target.unit}`);
  if (target.is_critical) {
    console.log('⚠️ CRITICAL TARGET');
  }
});
```

---

## Data Flow

### Daily Operations Flow

```
1. Morning: Check current week and deliverables
   ↓
2. Throughout day: Treat patients, log data in AIM OS
   ↓
3. Evening: Log daily metrics via launch service
   ↓
4. System: Auto-calculate week completion %
   ↓
5. Weekly: Review progress, complete deliverables
   ↓
6. End of week: Complete week if all critical deliverables done
```

### Metrics Integration

The launch daily metrics integrate with existing AIM OS data:

- **Partner Conversions** → `cumulative_patients`, `new_conversions_today`
- **Clinician Utilization** → `clinician_utilization_pct`
- **Data Quality Checks** → `data_completeness_pct`, `source_attribution_pct`
- **Partner Revenue Share** → `revenue_today`, `cumulative_revenue`

This creates a unified view of launch progress and operational metrics.

---

## EPC Launch Record

The EPC clinic already has a pre-seeded 90-day launch plan:

**Launch Code**: `EPC-LAUNCH-001`
**Launch Name**: EPC 90-Day Stand-Up
**Type**: `partner_90day`
**Budget**: $250,000
**Target Open Date**: 90 days from lease effective date

### Pre-Configured Data

✅ **12 weeks** defined with objectives and key actions
✅ **48 deliverables** across all weeks
✅ **21 target metrics** at key milestones
✅ **Daily metrics framework** ready for data

All you need to do is:
1. Set the `actual_start_date` (via `startLaunch()`)
2. Begin logging daily metrics
3. Mark deliverables complete as you achieve them
4. Track progress toward Day 90 target state

---

## Integration Points

### 1. Partner Dashboard
Daily metrics feed into the partner dashboard:
- Members treated count
- Conversion trends
- Utilization metrics
- Revenue share calculation

### 2. Launch Management UI
The existing Launch Management Dashboard can display:
- Current week progress
- Deliverables checklist
- Daily metrics chart
- Target vs actual comparison

### 3. Executive Reporting
90-day performance report aggregates:
- Week-by-week progress
- Deliverable completion rate
- Target metric achievement
- Lessons learned for replication

---

## Day 90 Success Criteria

By Day 90, the following MUST be true:

✅ **Clinic fully operational and stable**
- All systems running without daily intervention
- Staff operating independently

✅ **10-15% EPC member conversion trending**
- Sustainable rate of 50-75 new EPC patients monthly
- Clear conversion funnel established

✅ **Revenue share tracking live and trusted**
- Automated calculations accurate
- EPC partner accepts monthly reports

✅ **EPC board-credible reporting in place**
- Dashboard ready for board presentation
- All metrics verified and defensible

✅ **AIM OS populated with real operating data**
- System of record established
- No shadow systems or spreadsheets

✅ **EPC configuration clone-ready**
- Template validated
- Next site can launch in <14 days

---

## Replication Model

The EPC 90-day plan serves as the template for all future embedded partner clinics:

### Clone Process

```typescript
// 1. Create new clinic in AIM OS
const newClinicId = '...';

// 2. Clone partner configuration
const newPartnerId = await partnerService.clonePartnerConfiguration(
  epcPartnerId,
  newClinicId,
  'Next Sports Facility Partner'
);

// 3. Clone launch plan (auto-creates weeks, deliverables, targets)
const newLaunchId = await launchService.clonePartnerLaunchPlan(
  'EPC-LAUNCH-001',
  newClinicId
);

// 4. Customize site-specific details
await launchService.updateLaunch(newLaunchId, {
  launch_name: 'Site 2: 90-Day Stand-Up',
  launch_code: 'SITE2-LAUNCH-001',
  target_open_date: '2026-06-01',
  metadata: {
    partner_name: 'Next Partner',
    member_base: 3500, // Different size
    footprint_sqft: 300
  }
});

// 5. Start launch
await launchService.startLaunch(newLaunchId);
```

### Expected Launch Time for Sites 2+
**Target**: <14 days from signed lease to first patient

Why? The EPC template eliminates:
- Configuration guesswork
- Workflow design
- Reporting setup
- Training content creation
- Revenue share logic

Only site-specific work remains:
- Physical space setup
- Local staff hiring/training
- Partner-specific branding
- Initial intake channel activation

---

## Metrics Dashboard Views

### Executive View (Day 0-90)
- Current day/week indicator
- Phase progress bars
- Critical deliverables at risk
- Daily patient volume trend
- Cumulative conversion rate
- Revenue share YTD vs cap

### Launch Manager View
- Today's tasks and deliverables
- This week's key actions
- Data completeness alerts
- Clinician utilization by day
- Upcoming gate validations

### Partner View (EPC Access)
- Members treated this week/month
- Return-to-play success rate
- Program participation
- Aggregate satisfaction scores
- Revenue share accrual
- Anonymized utilization trends

---

## Next Steps for Implementation

### Before Lease Signing
- [ ] Confirm all legal terms
- [ ] Finalize revenue share % and cap
- [ ] Assign launch lead
- [ ] Confirm insurance coverage

### On Day 0 (Lease Effective Date)
```typescript
// Execute launch start
const launch = await launchService.getLaunchById('EPC-LAUNCH-001');
await launchService.startLaunch(launch.id);

// Verify Week 0 initialized
const week0 = await launchService.getCurrentWeek(launch.id);
console.log(week0.week_objective);
```

### Daily During Launch
```typescript
// Log metrics at end of each day
await launchService.logDailyMetric({
  clinic_launch_id: launchId,
  metric_date: today,
  day_number: dayNum,
  // ... daily counts
});

// Check week progress
const summary = await launchService.getLaunchStatusSummary(launchId);
```

### Weekly Review
```typescript
// Get week deliverables
const deliverables = await launchService.getDeliverables(launchId, currentWeekId);

// Mark complete
for (const d of deliverables.filter(x => isComplete(x))) {
  await launchService.updateDeliverable(d.id, {
    status: 'completed'
  });
}

// Complete week if ready
const completionPct = await launchService.getWeekCompletionPercentage(currentWeekId);
if (completionPct === 100) {
  await launchService.completeWeek(currentWeekId);
}
```

---

## Consultant Closing Statement

**"In 90 days, AIM Performance West transitions from a signed lease to a scalable, revenue-producing flagship clinic, with EPC validated as a repeatable embedded-partner model."**

This system makes that statement measurable, trackable, and replicable.

---

## Technical Summary

### Files Modified/Created

**Database**:
- `create_90_day_partner_launch_plan.sql` - Schema for weeks, deliverables, daily metrics, targets
- `seed_epc_90_day_launch_plan_v4.sql` - Complete EPC plan seeded

**Services**:
- `launchService.ts` - Added 15 new methods for 90-day tracking (+260 lines)

**Types**:
- Added 5 new interfaces: `LaunchWeek`, `LaunchDeliverable`, `LaunchDailyMetric`, `LaunchTargetMetric`, `LaunchStatusSummary`

**Build Status**: ✅ Successful

**Database Status**: ✅ All migrations applied

---

## Support

For questions about the 90-day launch plan implementation:
- Review this document first
- Check the Launch Management Dashboard
- Query launch_weeks, launch_deliverables tables directly
- Use `get_launch_status_summary()` function for real-time status

The system is designed to be self-documenting - every week has clear objectives, every deliverable has a due date, every metric has a target.

**The 90-day clock starts on lease signing. Make every day count.**
