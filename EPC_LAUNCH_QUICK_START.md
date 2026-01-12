# EPC Launch Quick Start Guide

## Day 0: Lease Signing - Start the Clock

### Step 1: Verify Launch Record Exists
```typescript
import { launchService } from './services/launchService';

// Find EPC launch
const launches = await launchService.getAllLaunches();
const epcLaunch = launches.find(l => l.launch_code === 'EPC-LAUNCH-001');
console.log('EPC Launch:', epcLaunch.launch_name);
```

### Step 2: Start the Launch
```typescript
// This sets actual_start_date and status to 'in_progress'
const launch = await launchService.startLaunch(epcLaunch.id);
console.log('Launch started on:', launch.actual_start_date);
```

### Step 3: View Week 0 Objectives
```typescript
const currentWeek = await launchService.getCurrentWeek(launch.id);
console.log('Current Week:', currentWeek.week_label);
console.log('Objective:', currentWeek.week_objective);
console.log('Key Actions:', currentWeek.key_actions);
```

### Step 4: Get Week 0 Deliverables
```typescript
const deliverables = await launchService.getDeliverables(
  launch.id,
  currentWeek.id
);

deliverables.forEach(d => {
  console.log(`${d.is_critical ? '🔴' : '⚪'} ${d.deliverable_name}`);
  console.log(`   Status: ${d.status}`);
  console.log(`   Due: Day ${d.due_day}`);
});
```

---

## Daily Routine

### Morning Check (5 minutes)

```typescript
// 1. What day are we on?
const dayNumber = await launchService.getLaunchDayNumber(launch.id);
console.log(`Day ${dayNumber} of 90`);

// 2. What week are we in?
const week = await launchService.getCurrentWeek(launch.id);
console.log(`Week ${week.week_number}: ${week.week_label}`);

// 3. What's due today?
const deliverables = await launchService.getDeliverables(launch.id, week.id);
const dueSoon = deliverables.filter(d =>
  d.due_day && d.due_day <= dayNumber + 3 && d.status !== 'completed'
);
console.log(`${dueSoon.length} deliverables due soon`);
```

### End of Day Logging (5 minutes)

```typescript
// Log today's metrics
await launchService.logDailyMetric({
  clinic_launch_id: launch.id,
  partner_clinic_id: epcPartnerId, // From partner_clinics table
  metric_date: new Date().toISOString().split('T')[0],
  day_number: dayNumber,

  // Volume metrics (from AIM OS data)
  patients_treated_today: 8,
  cumulative_patients: 45,
  new_conversions_today: 2,

  // Operational metrics
  clinician_utilization_pct: 68.5,
  data_completeness_pct: 97.2,
  avg_intake_to_first_visit_days: 5.3,

  // Compliance metrics
  episode_of_care_compliance_pct: 100,
  source_attribution_pct: 100,

  // Financial metrics (partner clinics only)
  revenue_today: 1920.00,
  cumulative_revenue: 32400.00,
  revenue_per_patient: 720.00,

  notes: 'Smooth day, all workflows followed',
  metadata: {}
});
```

---

## Weekly Routine

### Friday: Week Review (30 minutes)

```typescript
// 1. Check week completion
const week = await launchService.getCurrentWeek(launch.id);
const completionPct = await launchService.getWeekCompletionPercentage(week.id);
console.log(`Week ${week.week_number} is ${completionPct}% complete`);

// 2. Review deliverables
const deliverables = await launchService.getDeliverables(launch.id, week.id);
const pending = deliverables.filter(d => d.status !== 'completed');

console.log(`${pending.length} deliverables still pending:`);
pending.forEach(d => {
  console.log(`- ${d.deliverable_name} (Due: Day ${d.due_day})`);
});

// 3. Check target metrics
const targets = await launchService.getTargetMetrics(week.id);
const metrics = await launchService.getDailyMetrics(launch.id);
const latestMetrics = metrics[0]; // Most recent

targets.forEach(target => {
  const actualValue = latestMetrics[target.metric_name];
  const metTarget = checkTarget(actualValue, target.target_operator, target.target_value);
  console.log(
    `${metTarget ? '✅' : '❌'} ${target.metric_name}: ${actualValue} ${target.target_operator} ${target.target_value}`
  );
});

// Helper function
function checkTarget(actual, operator, target) {
  switch (operator) {
    case '>=': return actual >= target;
    case '<=': return actual <= target;
    case '=': return actual === target;
    case '>': return actual > target;
    case '<': return actual < target;
    default: return false;
  }
}
```

### End of Week: Mark Deliverables Complete

```typescript
// As you complete each deliverable during the week
await launchService.updateDeliverable(deliverableId, {
  status: 'completed',
  notes: 'All staff trained on EPC workflows. Documentation in Notion.'
});

// When ALL critical deliverables are done, complete the week
if (completionPct === 100) {
  await launchService.completeWeek(week.id);
  console.log(`Week ${week.week_number} completed! Moving to next week.`);
}
```

---

## Key Milestones

### Day 7: Week 0 Complete
**Must Have**:
- ✅ EPC clinic active in AIM OS
- ✅ Launch lead assigned
- ✅ All legal/insurance confirmed
- ✅ Revenue share configured

```typescript
const week0 = await launchService.getWeekById(week0Id);
if (week0.completion_pct === 100) {
  console.log('✅ Week 0 complete - ready for space setup');
}
```

### Day 14: Week 1-2 Complete
**Must Have**:
- ✅ Clinic space usable
- ✅ Staff trained
- ✅ AIM OS intake forms ready
- ✅ EPC front desk aligned

### Day 30: Soft Launch Complete (CRITICAL GATE)
**Must Have**:
- ✅ 30-50 patients treated
- ✅ ≥95% data completeness
- ✅ 100% episode-of-care compliance
- ✅ EPC partner confidence established

```typescript
// Check Day 30 metrics
const day30Metrics = await launchService.getDailyMetrics(
  launch.id,
  '2026-01-30', // Actual date
  '2026-01-30'
);

const m = day30Metrics[0];
console.log(`Day 30 Status:`);
console.log(`- Patients: ${m.cumulative_patients} (target: 30-50)`);
console.log(`- Data Quality: ${m.data_completeness_pct}% (target: ≥95%)`);
console.log(`- Compliance: ${m.episode_of_care_compliance_pct}% (target: 100%)`);

// If targets met, proceed to Phase 2
if (m.cumulative_patients >= 30 && m.data_completeness_pct >= 95) {
  console.log('✅ Phase 1 complete - ready to scale');
}
```

### Day 60: Value Visibility Established
**Must Have**:
- ✅ 150-200 patients treated
- ✅ 10%+ conversion rate
- ✅ EPC dashboard active
- ✅ Weekly reporting to EPC

### Day 90: Launch Complete (FINAL GATE)
**Must Have**:
- ✅ 200+ patients
- ✅ 10-15% conversion trending
- ✅ Revenue share trusted
- ✅ Board-ready reporting
- ✅ Template clone-ready

```typescript
// Day 90 Final Check
const summary = await launchService.getLaunchStatusSummary(launch.id);
console.log('Day 90 Final Status:');
console.log(`- Completed Deliverables: ${summary.completed_deliverables}/${summary.total_deliverables}`);
console.log(`- Completed Weeks: ${summary.completed_weeks}/${summary.total_weeks}`);
console.log(`- Blocked Items: ${summary.blocked_deliverables}`);

const day90Metrics = summary.latest_metrics;
console.log(`- Total Patients: ${day90Metrics.cumulative_patients}`);
console.log(`- Total Revenue: $${day90Metrics.cumulative_revenue}`);
console.log(`- Conversion Rate: ${(day90Metrics.cumulative_patients / 5000 * 100).toFixed(1)}%`);

// If all targets met, mark launch as completed
if (summary.blocked_deliverables === 0 && day90Metrics.cumulative_patients >= 200) {
  await launchService.updateLaunch(launch.id, {
    status: 'completed',
    actual_open_date: '2026-03-31' // Day 90 date
  });
  console.log('🎉 EPC Launch Complete - Ready for Replication!');
}
```

---

## Common Tasks

### Mark a Deliverable Complete
```typescript
await launchService.updateDeliverable(deliverableId, {
  status: 'completed',
  notes: 'Completed successfully'
});
```

### Block a Deliverable
```typescript
await launchService.updateDeliverable(deliverableId, {
  status: 'blocked',
  notes: 'Waiting on vendor equipment delivery - ETA 3 days'
});
```

### Update Week Status
```typescript
// Start a week
await launchService.updateWeek(weekId, {
  status: 'in_progress',
  actual_start_date: new Date().toISOString().split('T')[0]
});

// Complete a week
await launchService.completeWeek(weekId);
```

### Get Launch Overview
```typescript
const summary = await launchService.getLaunchStatusSummary(launch.id);
console.log(`Day ${summary.current_day} - Week ${summary.current_week}`);
console.log(`Progress: ${summary.completed_deliverables}/${summary.total_deliverables} deliverables`);
console.log(`Blocked: ${summary.blocked_deliverables}`);
console.log(`Latest Metrics:`, summary.latest_metrics);
```

---

## Troubleshooting

### "I don't see the EPC launch"
```typescript
// Check if it exists
const launches = await launchService.getAllLaunches();
const epc = launches.find(l => l.launch_code === 'EPC-LAUNCH-001');

if (!epc) {
  console.error('EPC launch not found. Check migration applied.');
}
```

### "Day number seems wrong"
```typescript
// Day number is calculated from actual_start_date
const launch = await launchService.getLaunchById(launchId);
console.log('Start date:', launch.actual_start_date);

// If null, launch hasn't started
if (!launch.actual_start_date) {
  console.log('Launch not started yet. Call startLaunch()');
}
```

### "Deliverables aren't updating week completion"
```typescript
// Week completion is auto-calculated from deliverables
const weekId = 'xxx';

// Manually trigger calculation
const completion = await launchService.getWeekCompletionPercentage(weekId);
console.log(`Week is ${completion}% complete`);

// Update the week record
await launchService.updateWeek(weekId, {
  completion_pct: completion
});
```

---

## Reporting

### Weekly Report to EPC Partner
```typescript
const week = await launchService.getCurrentWeek(launch.id);
const metrics = await launchService.getDailyMetrics(launch.id);
const thisWeekMetrics = metrics.filter(m =>
  m.day_number >= week.start_day && m.day_number <= week.end_day
);

const report = {
  week_label: week.week_label,
  members_treated: thisWeekMetrics.reduce((sum, m) => sum + m.patients_treated_today, 0),
  new_conversions: thisWeekMetrics.reduce((sum, m) => sum + m.new_conversions_today, 0),
  avg_satisfaction: calculateAvg(thisWeekMetrics, 'satisfaction_score'),
  total_patients_ytd: thisWeekMetrics[0]?.cumulative_patients || 0
};

console.log('Weekly Report for EPC:', report);
```

### Executive Dashboard View
```typescript
const summary = await launchService.getLaunchStatusSummary(launch.id);
const phase = Math.floor(summary.current_week / 4); // 0=Phase1, 1=Phase2, 2=Phase3

const dashboard = {
  phase: ['Phase 1: Operational Readiness', 'Phase 2: Scale & Stabilize', 'Phase 3: Optimize & Prove'][phase],
  day: summary.current_day,
  week: summary.current_week,
  progress_pct: (summary.completed_weeks / summary.total_weeks * 100).toFixed(1),
  at_risk_deliverables: summary.blocked_deliverables,
  patients_to_date: summary.latest_metrics?.cumulative_patients || 0,
  conversion_rate: ((summary.latest_metrics?.cumulative_patients / 5000 * 100) || 0).toFixed(1),
  revenue_to_date: summary.latest_metrics?.cumulative_revenue || 0,
  on_track: summary.blocked_deliverables === 0
};

console.log('Executive Dashboard:', dashboard);
```

---

## Next Steps

1. **Before Launch**: Review this guide and `EPC_90_DAY_LAUNCH_PLAN.md`
2. **Day 0**: Execute `startLaunch()` when lease is signed
3. **Daily**: Log metrics every evening
4. **Weekly**: Review deliverables and complete week when ready
5. **Day 90**: Generate final report and prepare for replication

---

## Support

The 90-day plan is self-documenting. Every question you have should be answerable by:

1. Current week objective and key actions
2. Week deliverables checklist
3. Target metrics for this milestone
4. Latest daily metrics

**Trust the system. Follow the plan. Track the metrics. Reach Day 90.**
