/*
  # Seed EPC 90-Day Launch Plan (Fixed)

  Implements the complete 90-day stand-up plan for AIM Performance West × EPC:
  - 12 weeks of tracked activities
  - Phase-specific deliverables
  - Target metrics at each milestone
  - Daily metrics tracking framework

  Based on "Lease Effective Day 0" operational plan
*/

-- Create EPC clinic launch record
INSERT INTO clinic_launches (
  clinic_id,
  launch_name,
  launch_code,
  target_open_date,
  planned_start_date,
  current_phase,
  status,
  approved_budget,
  is_partner_clinic,
  launch_plan_type,
  metadata
)
SELECT 
  c.id,
  'EPC 90-Day Stand-Up',
  'EPC-LAUNCH-001',
  CURRENT_DATE + interval '90 days',
  CURRENT_DATE,
  'phase_0_deal_authorization',
  'planning',
  250000.00,
  true,
  'partner_90day',
  jsonb_build_object(
    'partner_name', 'Edmonton Pickleball Center',
    'member_base', 5000,
    'footprint_sqft', 400,
    'is_flagship', true,
    'executive_objective', 'Stand up fully operational embedded clinic, begin converting 5000 members, populate AIM OS with live data, deliver board-ready reporting, establish replication template'
  )
FROM clinics c
JOIN partner_clinics pc ON pc.clinic_id = c.id
WHERE pc.partner_name = 'Edmonton Pickleball Center'
ON CONFLICT (launch_code) DO NOTHING;

-- =============================================================================
-- PHASE 1: LEASE → OPERATIONAL READINESS (Day 0-30)
-- =============================================================================

-- WEEK 0 (Day 0-7): Lease Activation & Control Setup
INSERT INTO launch_weeks (
  clinic_launch_id,
  week_number,
  week_label,
  start_day,
  end_day,
  week_objective,
  key_actions
)
SELECT 
  cl.id,
  0,
  'Week 0 (Day 0-7): Lease Activation & Control Setup',
  0,
  7,
  'Lock legal, operational, and governance foundations. Eliminate ambiguity before spending money.',
  ARRAY[
    'Confirm lease effective date and terms',
    'Confirm rent, revenue share %, cap, exclusivity',
    'Confirm gym access and signage rights',
    'Appoint EPC Clinic Launch Lead',
    'Assign single point of contact to EPC',
    'Instantiate EPC clinic in AIM OS',
    'Enable partner flags and revenue share logic',
    'Confirm professional liability coverage',
    'Confirm scope of practice compliance'
  ]
FROM clinic_launches cl
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT (clinic_launch_id, week_number) DO NOTHING;

-- Week 0 Deliverables
INSERT INTO launch_deliverables (
  clinic_launch_id,
  week_id,
  deliverable_name,
  deliverable_description,
  is_critical,
  due_day
)
SELECT 
  cl.id,
  lw.id,
  deliverable,
  description,
  is_crit,
  7
FROM clinic_launches cl
JOIN launch_weeks lw ON lw.clinic_launch_id = cl.id AND lw.week_number = 0
CROSS JOIN (VALUES
  ('EPC clinic live in AIM OS', 'Clinic instantiated with partner flags enabled', true),
  ('Launch roles assigned', 'Launch lead and EPC contact appointed', true),
  ('Zero open governance questions', 'All legal, insurance, and scope confirmed', true),
  ('Revenue share logic configured', 'Rate, cap, and calculation inactive but ready', true),
  ('Lease terms documented', 'All lease details confirmed in writing', true)
) AS d(deliverable, description, is_crit)
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT DO NOTHING;

-- WEEK 1-2 (Day 8-14): Space + System Prep
INSERT INTO launch_weeks (
  clinic_launch_id,
  week_number,
  week_label,
  start_day,
  end_day,
  week_objective,
  key_actions
)
SELECT 
  cl.id,
  1,
  'Week 1-2 (Day 8-14): Space + System Prep',
  8,
  14,
  'Make the space usable. Make the system ready for real data.',
  ARRAY[
    'Confirm treatment room layouts',
    'Install essential fixtures & equipment',
    'Confirm utilities, internet, privacy controls',
    'Approve EPC-facing signage',
    'Approve intake messaging',
    'Align EPC front desk referral script',
    'Finalize intake forms in AIM OS',
    'Finalize EPC member source tagging',
    'Validate reporting and dashboards',
    'Assign initial clinicians',
    'Train on EPC-specific workflows',
    'Enforce AIM OS usage standards'
  ]
FROM clinic_launches cl
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT (clinic_launch_id, week_number) DO NOTHING;

-- Week 1-2 Deliverables
INSERT INTO launch_deliverables (
  clinic_launch_id,
  week_id,
  deliverable_name,
  deliverable_description,
  is_critical,
  due_day
)
SELECT 
  cl.id,
  lw.id,
  deliverable,
  description,
  is_crit,
  14
FROM clinic_launches cl
JOIN launch_weeks lw ON lw.clinic_launch_id = cl.id AND lw.week_number = 1
CROSS JOIN (VALUES
  ('Clinic space usable', 'Treatment rooms ready, equipment installed', true),
  ('Staff trained', 'Clinicians trained on EPC workflows and AIM OS', true),
  ('AIM OS intake + scheduling ready', 'Forms finalized, EPC tagging configured', true),
  ('Signage approved', 'EPC-facing signage and messaging finalized', false),
  ('Front desk script aligned', 'EPC staff trained on referral process', true)
) AS d(deliverable, description, is_crit)
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT DO NOTHING;

-- WEEK 3-4 (Day 15-30): Soft Open & Controlled Volume
INSERT INTO launch_weeks (
  clinic_launch_id,
  week_number,
  week_label,
  start_day,
  end_day,
  week_objective,
  key_actions
)
SELECT 
  cl.id,
  2,
  'Week 3-4 (Day 15-30): Soft Open & Controlled Volume',
  15,
  30,
  'Start seeing patients. Validate workflows before scale.',
  ARRAY[
    'Launch soft open - EPC members only',
    'Limit volume to ensure data quality',
    'Manual review of first 20-30 patient journeys',
    'Enforce episode-of-care mandatory',
    'Enforce visit logging mandatory',
    'Enforce source attribution mandatory',
    'Confirm EPC revenue share math',
    'Confirm EPC dashboard shows no PHI',
    'Confirm utilization tracking accuracy'
  ]
FROM clinic_launches cl
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT (clinic_launch_id, week_number) DO NOTHING;

-- Week 3-4 Deliverables and Targets
INSERT INTO launch_deliverables (
  clinic_launch_id,
  week_id,
  deliverable_name,
  deliverable_description,
  is_critical,
  due_day
)
SELECT 
  cl.id,
  lw.id,
  deliverable,
  description,
  is_crit,
  30
FROM clinic_launches cl
JOIN launch_weeks lw ON lw.clinic_launch_id = cl.id AND lw.week_number = 2
CROSS JOIN (VALUES
  ('30-50 EPC patients treated', 'Soft launch volume target achieved', true),
  ('≥95% data completeness', 'All required fields captured', true),
  ('Zero operational surprises', 'Workflows validated without major issues', true),
  ('EPC confidence established', 'Partner satisfied with execution quality', true),
  ('Revenue share validated', 'First calculation run and verified', true)
) AS d(deliverable, description, is_crit)
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT DO NOTHING;

-- Week 3-4 Target Metrics
INSERT INTO launch_target_metrics (
  clinic_launch_id,
  week_id,
  metric_name,
  target_value,
  target_operator,
  unit,
  is_critical
)
SELECT 
  cl.id,
  lw.id,
  metric,
  target,
  operator,
  unit_val,
  is_crit
FROM launch_weeks lw
JOIN clinic_launches cl ON cl.id = lw.clinic_launch_id
CROSS JOIN (VALUES
  ('cumulative_patients', 30, '>=', 'patients', true),
  ('data_completeness_pct', 95, '>=', '%', true),
  ('episode_of_care_compliance_pct', 100, '>=', '%', true),
  ('source_attribution_pct', 100, '>=', '%', false)
) AS m(metric, target, operator, unit_val, is_crit)
WHERE cl.launch_code = 'EPC-LAUNCH-001'
AND lw.week_number = 2
ON CONFLICT (week_id, metric_name) DO NOTHING;

-- =============================================================================
-- PHASE 2: SCALE & STABILIZE (Day 31-60)
-- =============================================================================

-- WEEK 5-6 (Day 31-45): Volume Ramp
INSERT INTO launch_weeks (
  clinic_launch_id,
  week_number,
  week_label,
  start_day,
  end_day,
  week_objective,
  key_actions
)
SELECT 
  cl.id,
  5,
  'Week 5-6 (Day 31-45): Volume Ramp',
  31,
  45,
  'Increase throughput. Turn process into habit.',
  ARRAY[
    'Expand intake channels',
    'Enable EPC front desk referrals',
    'Deploy courtside QR intake',
    'Integrate EPC email/announcements',
    'Optimize scheduling templates',
    'Balance clinician load',
    'Minimize idle time',
    'Weekly EPC clinic performance review',
    'Weekly AIM OS data audit'
  ]
FROM clinic_launches cl
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT (clinic_launch_id, week_number) DO NOTHING;

-- Week 5-6 Target Metrics
INSERT INTO launch_target_metrics (
  clinic_launch_id,
  week_id,
  metric_name,
  target_value,
  target_operator,
  unit,
  is_critical
)
SELECT 
  cl.id,
  lw.id,
  metric,
  target,
  operator,
  unit_val,
  is_crit
FROM launch_weeks lw
JOIN clinic_launches cl ON cl.id = lw.clinic_launch_id
CROSS JOIN (VALUES
  ('cumulative_patients', 80, '>=', 'patients', true),
  ('clinician_utilization_pct', 70, '>=', '%', true),
  ('avg_intake_to_first_visit_days', 7, '<=', 'days', true)
) AS m(metric, target, operator, unit_val, is_crit)
WHERE cl.launch_code = 'EPC-LAUNCH-001'
AND lw.week_number = 5
ON CONFLICT (week_id, metric_name) DO NOTHING;

-- WEEK 7-8 (Day 46-60): Partner Value Visibility
INSERT INTO launch_weeks (
  clinic_launch_id,
  week_number,
  week_label,
  start_day,
  end_day,
  week_objective,
  key_actions
)
SELECT 
  cl.id,
  7,
  'Week 7-8 (Day 46-60): Partner Value Visibility',
  46,
  60,
  'Make the partnership tangible for EPC. Prepare for board scrutiny.',
  ARRAY[
    'Activate EPC reporting cadence',
    'Deliver weekly anonymized metrics',
    'Track return-to-play averages',
    'Monitor utilization trends',
    'Refine pickleball injury programs',
    'Develop seniors mobility pathway',
    'Document return-to-play protocols',
    'Track revenue per EPC patient',
    'Monitor revenue share YTD vs cap',
    'Analyze early margin indicators'
  ]
FROM clinic_launches cl
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT (clinic_launch_id, week_number) DO NOTHING;

-- Week 7-8 Target Metrics
INSERT INTO launch_target_metrics (
  clinic_launch_id,
  week_id,
  metric_name,
  target_value,
  target_operator,
  unit,
  is_critical
)
SELECT 
  cl.id,
  lw.id,
  metric,
  target,
  operator,
  unit_val,
  is_crit
FROM launch_weeks lw
JOIN clinic_launches cl ON cl.id = lw.clinic_launch_id
CROSS JOIN (VALUES
  ('cumulative_patients', 150, '>=', 'patients', true),
  ('conversion_rate_pct', 10, '>=', '%', true),
  ('epc_dashboard_active', 1, '>=', 'boolean', true)
) AS m(metric, target, operator, unit_val, is_crit)
WHERE cl.launch_code = 'EPC-LAUNCH-001'
AND lw.week_number = 7
ON CONFLICT (week_id, metric_name) DO NOTHING;

-- =============================================================================
-- PHASE 3: OPTIMIZE & PROVE (Day 61-90)
-- =============================================================================

-- WEEK 9-10 (Day 61-75): Optimization
INSERT INTO launch_weeks (
  clinic_launch_id,
  week_number,
  week_label,
  start_day,
  end_day,
  week_objective,
  key_actions
)
SELECT 
  cl.id,
  9,
  'Week 9-10 (Day 61-75): Optimization',
  61,
  75,
  'Improve unit economics. Reduce friction. Prepare replication.',
  ARRAY[
    'Optimize care pathways',
    'Reduce unnecessary visits',
    'Improve completion rates',
    'Identify high-value programs',
    'Adjust staffing to demand',
    'Reduce admin touchpoints',
    'Standardize best practices',
    'Model conversion scenarios (12%/15%/18%)',
    'Forecast revenue share cap timing',
    'Analyze staffing sensitivity'
  ]
FROM clinic_launches cl
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT (clinic_launch_id, week_number) DO NOTHING;

-- WEEK 11-12 (Day 76-90): Board-Ready Closeout
INSERT INTO launch_weeks (
  clinic_launch_id,
  week_number,
  week_label,
  start_day,
  end_day,
  week_objective,
  key_actions
)
SELECT 
  cl.id,
  11,
  'Week 11-12 (Day 76-90): Board-Ready Closeout',
  76,
  90,
  'Lock EPC as flagship success. Prepare next-site rollout.',
  ARRAY[
    'Finalize 90-Day Performance Report',
    'Document conversion results',
    'Document revenue & utilization',
    'Document partner value delivered',
    'Document lessons learned',
    'Clone EPC clinic config',
    'Strip EPC-specific data from template',
    'Validate <14-day launch time for next site',
    'Prepare executive decision point',
    'Greenlight next 1-3 spokes',
    'Lock AIM OS as system of record'
  ]
FROM clinic_launches cl
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT (clinic_launch_id, week_number) DO NOTHING;

-- Day 90 Target State (Final Deliverables)
INSERT INTO launch_deliverables (
  clinic_launch_id,
  week_id,
  deliverable_name,
  deliverable_description,
  is_critical,
  due_day
)
SELECT 
  cl.id,
  lw.id,
  deliverable,
  description,
  is_crit,
  90
FROM clinic_launches cl
JOIN launch_weeks lw ON lw.clinic_launch_id = cl.id AND lw.week_number = 11
CROSS JOIN (VALUES
  ('Clinic fully operational and stable', 'All systems running smoothly without intervention', true),
  ('10-15% EPC member conversion trending', 'Sustainable conversion rate established', true),
  ('Revenue share tracking live and trusted', 'Automated calculations verified and accepted', true),
  ('EPC board-credible reporting in place', 'Dashboard and reports ready for board presentation', true),
  ('AIM OS populated with real operating data', 'System of record established with clean data', true),
  ('EPC configuration clone-ready', 'Template validated and ready for replication', true),
  ('90-Day Performance Report completed', 'Comprehensive launch report delivered', true),
  ('Next-site rollout plan approved', 'Executive greenlight for next 1-3 clinics', false)
) AS d(deliverable, description, is_crit)
WHERE cl.launch_code = 'EPC-LAUNCH-001'
ON CONFLICT DO NOTHING;

-- Day 90 Final Target Metrics
INSERT INTO launch_target_metrics (
  clinic_launch_id,
  week_id,
  metric_name,
  target_value,
  target_operator,
  unit,
  is_critical
)
SELECT 
  cl.id,
  lw.id,
  metric,
  target,
  operator,
  unit_val,
  is_crit
FROM launch_weeks lw
JOIN clinic_launches cl ON cl.id = lw.clinic_launch_id
CROSS JOIN (VALUES
  ('cumulative_patients', 200, '>=', 'patients', true),
  ('conversion_rate_pct', 10, '>=', '%', true),
  ('clinician_utilization_pct', 75, '>=', '%', true),
  ('data_completeness_pct', 98, '>=', '%', true),
  ('revenue_share_tracking_accuracy', 100, '=', '%', true),
  ('epc_dashboard_board_ready', 1, '=', 'boolean', true),
  ('template_clone_validated', 1, '=', 'boolean', true)
) AS m(metric, target, operator, unit_val, is_crit)
WHERE cl.launch_code = 'EPC-LAUNCH-001'
AND lw.week_number = 11
ON CONFLICT (week_id, metric_name) DO NOTHING;