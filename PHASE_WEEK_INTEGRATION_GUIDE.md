# Launch Module: Phase 0-5 + 90-Day Integration

## Overview

The EPC launch now has **TWO COMPLEMENTARY FRAMEWORKS** working together:

### 1. Phase 0-5 Gates (WHAT must be done)
Traditional phase-gate launch framework with mandatory tasks and approval gates.

### 2. 90-Day Week Plan (WHEN it gets done)
Day-by-day operational execution timeline with daily metrics and deliverables.

**They work together**: Phases define the quality gates, weeks define the execution cadence.

---

## Current EPC Launch Status

```
✅ 6 Phases (Phase 0-5)
✅ 5 Workstreams (Partner-adapted)
✅ 36 Tasks (Gate-blocking + optional)
✅ 7 Key Weeks (Major milestones)
✅ 48 Deliverables (Week-end outputs)
✅ 21 Target Metrics (Performance thresholds)
```

---

## Phase-to-Week Mapping

| Phase | Phase Name | Week(s) | Days | Status Gate |
|-------|-----------|---------|------|-------------|
| **Phase 0** | Deal & Authorization | Week 0 | 0-7 | Approved to launch |
| **Phase 1** | Site, Build & Compliance | Week 1 | 8-14 | Physically & legally operable |
| **Phase 2** | Staffing & Credentialing | Week 1 | 8-14 (parallel) | Clinically staffable |
| **Phase 3** | Systems & Ops Readiness | Week 2 | 15-30 | Operationally ready |
| **Phase 4** | Go-Live | Week 2 | 15-30 (overlap) | Treating patients |
| **Phase 5** | Stabilization | Weeks 5-11 | 31-90 | Meets performance thresholds |

---

## Phase 0: Deal & Authorization (Week 0, Day 0-7)

### Status Gate: **Approved to Launch**

**Must Have Before Proceeding**:
- ✅ Lease executed
- ✅ Budget approved
- ✅ Target opening date set
- ✅ Launch owner assigned
- ✅ Clinic record created in AIM OS

### Critical Tasks (7)

```typescript
// Get Phase 0 tasks
const phase0Tasks = await launchService.getTasks(launchId, {
  phase: 'phase_0_deal_authorization',
  requiredOnly: true
});

// Example tasks:
// 1. Execute Lease Agreement
// 2. Confirm Revenue Share Terms
// 3. Approve Launch Budget
// 4. Assign Launch Owner
// 5. Create EPC Clinic in AIM OS
// 6. Confirm Professional Liability Insurance
// 7. Confirm Scope of Practice Compliance
```

### Week 0 Deliverables
- EPC clinic live in AIM OS
- Launch roles assigned
- Zero open governance questions
- Revenue share logic configured
- Lease terms documented

### Can't Proceed Until:
All 7 tasks marked complete AND Phase 0 gate passed.

---

## Phase 1: Site, Build & Compliance (Week 1, Day 8-14)

### Status Gate: **Physically & Legally Operable**

**Must Have Before Proceeding**:
- ✅ Treatment space usable
- ✅ Equipment installed
- ✅ Utilities & IT operational
- ✅ Signage approved
- ✅ EPC front desk aligned

### Critical Tasks (5)

```typescript
const phase1Tasks = await launchService.getTasks(launchId, {
  phase: 'phase_1_site_build_compliance',
  requiredOnly: true
});

// Workstream: Embedded Space Setup
// 1. Confirm Treatment Room Layouts
// 2. Install Equipment & Fixtures
// 3. Verify Utilities & Internet
// 4. Approve Signage & Branding
// 5. Align EPC Front Desk Referral Process
```

### Week 1 Deliverables
- Clinic space usable
- Equipment operational
- Signage and branding approved
- Front desk script aligned

### For Partner Clinics:
Much lighter than greenfield clinic. No major construction, just allocated space setup.

---

## Phase 2: Staffing & Credentialing (Week 1, Day 8-14, PARALLEL)

### Status Gate: **Clinically Staffable**

**Must Have Before Proceeding**:
- ✅ Initial clinicians assigned
- ✅ All credentials verified and current
- ✅ EPC-specific training complete
- ✅ AIM OS training complete
- ✅ Credential expiry dates logged

### Critical Tasks (5)

```typescript
const phase2Tasks = await launchService.getTasks(launchId, {
  phase: 'phase_2_staffing_credentialing',
  requiredOnly: true
});

// Workstream: Clinical Staffing & Training
// 1. Assign Initial Clinicians
// 2. Verify All Credentials
// 3. Complete EPC-Specific Training
// 4. Complete AIM OS Training
// 5. Log Credential Expiry Dates
```

### Week 1 Deliverables
- Staff trained on EPC workflows
- Staff trained on AIM OS
- All credentials verified

### Integration:
Credentials feed into Credential Engine (operations module).

---

## Phase 3: Systems & Ops Readiness (Week 2, Day 15-30)

### Status Gate: **Operationally Ready**

**Must Have Before Proceeding**:
- ✅ AIM OS intake configured
- ✅ EPC member tagging active
- ✅ Revenue share calculation tested
- ✅ Partner dashboard validated
- ✅ Episode-of-care enforcement enabled
- ✅ Source attribution mandatory

### Critical Tasks (7)

```typescript
const phase3Tasks = await launchService.getTasks(launchId, {
  phase: 'phase_3_systems_ops_readiness',
  requiredOnly: true
});

// Workstream: AIM OS Configuration & Partner Dashboard
// 1. Finalize AIM OS Intake Forms
// 2. Configure EPC Member Source Tagging
// 3. Activate Revenue Share Calculation Logic
// 4. Validate EPC Partner Dashboard
// 5. Load Scheduling Templates

// Workstream: Clinical Workflows & Data Quality
// 6. Define Episode-of-Care Requirements
// 7. Enforce Source Attribution
```

### Week 2 Deliverables
- AIM OS intake + scheduling ready
- EPC member auto-tagging configured
- Revenue share logic validated
- Partner dashboard tested

### THIS IS CRITICAL:
Data quality enforcement starts HERE. Episode-of-care and source attribution become mandatory.

---

## Phase 4: Go-Live (Week 2, Day 15-30, OVERLAPS Phase 3)

### Status Gate: **Treating Patients**

**Must Have Before Proceeding**:
- ✅ First patient treated
- ✅ First 20 patient journeys reviewed
- ✅ Data completeness ≥95%
- ✅ Revenue share calculation verified
- ✅ Utilization tracking accurate

### Critical Tasks (5)

```typescript
const phase4Tasks = await launchService.getTasks(launchId, {
  phase: 'phase_4_go_live',
  requiredOnly: true
});

// Workstream: Clinical Operations & Quality
// 1. Treat First EPC Patient
// 2. Manual Review of First 20 Patient Journeys
// 3. Validate Data Completeness ≥95%
// 4. Verify Revenue Share Calculation
// 5. Confirm Utilization Tracking Accuracy
```

### Week 2 Target Metrics (Day 30)
- 30-50 patients treated ✅
- ≥95% data completeness ✅
- 100% episode-of-care compliance ✅
- 100% source attribution ✅

### THIS IS THE CRITICAL GATE:
If Day 30 metrics aren't met, DO NOT PROCEED to scale. Fix workflows first.

---

## Phase 5: Stabilization (Weeks 5-11, Day 31-90)

### Status Gate: **Meets Performance Thresholds**

**Must Have Before Completing**:
- ✅ Target patient volume achieved (200+)
- ✅ Conversion rate ≥10%
- ✅ Staffing stable (no unplanned turnover)
- ✅ Utilization ≥75%
- ✅ Weekly EPC reporting active
- ✅ 90-day performance report complete
- ✅ Configuration template validated

### Critical Tasks (7)

```typescript
const phase5Tasks = await launchService.getTasks(launchId, {
  phase: 'phase_5_stabilization',
  requiredOnly: true
});

// 1. Achieve Target Patient Volume (200+ by Day 90)
// 2. Achieve 10%+ Conversion Rate
// 3. Verify Staffing Stable
// 4. Verify Utilization ≥75%
// 5. Activate Weekly EPC Reporting
// 6. Prepare 90-Day Performance Report
// 7. Clone EPC Configuration for Replication
```

### Week-by-Week Milestones

**Week 5 (Day 45)**:
- 80-120 patients cumulative
- ≥70% utilization
- <7 days intake-to-first-visit

**Week 7 (Day 60)**:
- 150-200 patients cumulative
- 10-12% conversion trending
- EPC dashboard actively used

**Week 11 (Day 90)**:
- 200+ patients
- 10-15% conversion established
- Template clone-ready

### Final Deliverables (Day 90)
- Clinic fully operational and stable
- Revenue share tracking trusted
- Board-ready reporting active
- AIM OS system of record established
- EPC configuration cloned for replication

---

## Workstreams (Cross-Phase)

### 1. Partner Integration & Governance
**Owner**: Executive
**Type**: Compliance & Licensing
**Tasks**: 10 across all phases
- Legal, insurance, partnership agreements
- Revenue share tracking
- Board reporting

### 2. Embedded Space Setup
**Owner**: Operations Manager
**Type**: Real Estate & Build
**Tasks**: 5 in Phase 1
- Minimal buildout (using EPC's facility)
- Equipment installation
- Signage

### 3. Clinical Staffing & Training
**Owner**: Clinical Director
**Type**: Staffing & Credentials
**Tasks**: 7 in Phases 2 & 5
- Clinician assignment
- Credential verification
- Training delivery
- Staffing stability

### 4. AIM OS Configuration & Partner Dashboard
**Owner**: Admin
**Type**: Systems & IT
**Tasks**: 7 in Phases 0, 3, 5
- Clinic instantiation
- Intake forms
- Member tagging
- Revenue share logic
- Partner dashboard
- Template cloning

### 5. Clinical Workflows & Data Quality
**Owner**: Clinic Manager
**Type**: Clinical Operations
**Tasks**: 7 in Phases 3, 4, 5
- Episode-of-care enforcement
- Source attribution
- Data quality validation
- Volume targets
- Utilization metrics

---

## Using Both Frameworks Together

### Day 0: Launch Starts

```typescript
// 1. Start the launch (sets actual_start_date)
const launch = await launchService.startLaunch(launchId);

// 2. Check current phase
console.log('Phase:', launch.current_phase); // 'phase_0_deal_authorization'

// 3. Check current week
const currentWeek = await launchService.getCurrentWeek(launchId);
console.log('Week:', currentWeek.week_label); // 'Week 0 (Day 0-7)'

// 4. Get Phase 0 tasks
const tasks = await launchService.getTasks(launchId, {
  phase: 'phase_0_deal_authorization'
});

// 5. Get Week 0 deliverables
const deliverables = await launchService.getDeliverables(launchId, currentWeek.id);
```

### Daily: Check Both

```typescript
// Phase progress
const phases = await launchService.getPhases(launchId);
const activePhase = phases.find(p => p.status === 'in_progress');

// Week progress
const currentWeek = await launchService.getCurrentWeek(launchId);
const weekCompletion = await launchService.getWeekCompletionPercentage(currentWeek.id);

console.log(`Phase ${activePhase.phase_name}: ${activePhase.completion_pct}%`);
console.log(`Week ${currentWeek.week_number}: ${weekCompletion}%`);
```

### Completing Tasks vs Deliverables

**Tasks** (Phase-based):
```typescript
// Mark task complete
await launchService.updateTask(taskId, {
  status: 'completed',
  completion_pct: 100
});

// Check if phase gate can pass
const validation = await launchService.validatePhaseGate(phaseId);
if (validation.can_pass) {
  await launchService.passPhaseGate(phaseId, userId, 'All tasks complete');
}
```

**Deliverables** (Week-based):
```typescript
// Mark deliverable complete
await launchService.updateDeliverable(deliverableId, {
  status: 'completed'
});

// Auto-updates week completion percentage
const weekCompletion = await launchService.getWeekCompletionPercentage(weekId);

// Complete week when ready
if (weekCompletion === 100) {
  await launchService.completeWeek(weekId);
}
```

---

## Key Differences

| Aspect | Phase 0-5 Gates | 90-Day Week Plan |
|--------|----------------|------------------|
| **Focus** | Quality gates & compliance | Operational execution |
| **Structure** | 6 phases with tasks | 7 milestone weeks with deliverables |
| **Tracking** | Task completion % | Daily metrics + deliverables |
| **Approval** | Phase gates require approval | Weeks auto-advance |
| **Blocking** | Gate-blocking tasks prevent phase advance | Critical deliverables prevent week completion |
| **Metrics** | Launch KPIs (days to open, budget) | Daily operational metrics (patients, utilization) |
| **Purpose** | Ensure readiness & compliance | Track daily progress & performance |

---

## Summary

**Phase 0-5** ensures you don't skip critical steps.
**90-Day Weeks** ensure you execute on schedule.
**Together** they create a complete launch management system.

**Start with Phase 0, Week 0, Day 0. Track both daily. Finish with Phase 5 passed and Week 11 complete on Day 90.**

---

## Verification

Check your EPC launch has everything:

```sql
SELECT
  cl.launch_code,
  COUNT(DISTINCT lp.id) as phases,
  COUNT(DISTINCT lw.id) as workstreams,
  COUNT(DISTINCT lt.id) as tasks,
  COUNT(DISTINCT week.id) as weeks,
  COUNT(DISTINCT ld.id) as deliverables,
  COUNT(DISTINCT ltm.id) as target_metrics
FROM clinic_launches cl
LEFT JOIN launch_phases lp ON lp.clinic_launch_id = cl.id
LEFT JOIN launch_workstreams lw ON lw.clinic_launch_id = cl.id
LEFT JOIN launch_tasks lt ON lt.clinic_launch_id = cl.id
LEFT JOIN launch_weeks week ON week.clinic_launch_id = cl.id
LEFT JOIN launch_deliverables ld ON ld.clinic_launch_id = cl.id
LEFT JOIN launch_target_metrics ltm ON ltm.clinic_launch_id = cl.id
WHERE cl.launch_code = 'EPC-LAUNCH-001'
GROUP BY cl.id, cl.launch_code;
```

Expected result:
- 6 phases
- 5 workstreams
- 36 tasks
- 7 weeks
- 48 deliverables
- 21 target_metrics
