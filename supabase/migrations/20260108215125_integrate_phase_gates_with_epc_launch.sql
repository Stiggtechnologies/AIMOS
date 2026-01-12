/*
  # Integrate Phase 0-5 Gates with EPC Launch

  1. Purpose
    - Create Phase 0-5 launch gates for EPC
    - Adapted for embedded partner clinic model
    - Map phases to 90-day week structure
    - Create partner-specific workstreams and tasks

  2. Phase-to-Week Mapping
    - Phase 0: Deal & Authorization → Week 0 (Day 0-7)
    - Phase 1: Site, Build & Compliance → Week 1-2 (Day 8-14)
    - Phase 2: Staffing & Credentialing → Week 1-2 (Day 8-14, parallel)
    - Phase 3: Systems & Ops Readiness → Week 3-4 (Day 15-30)
    - Phase 4: Go-Live → Week 3-4 (Day 15-30, soft launch)
    - Phase 5: Stabilization → Week 5-12 (Day 31-90)

  3. Changes
    - Create 6 launch phases for EPC
    - Create 5 workstreams adapted for partner model
    - Create phase-specific tasks
    - Link weeks to phases
*/

-- Get EPC launch ID
DO $$
DECLARE
  v_launch_id uuid;
  v_week0_id uuid;
  v_week1_id uuid;
  v_week2_id uuid;
  v_week5_id uuid;
  v_phase0_id uuid;
  v_phase1_id uuid;
  v_phase2_id uuid;
  v_phase3_id uuid;
  v_phase4_id uuid;
  v_phase5_id uuid;
  v_ws_partner_id uuid;
  v_ws_site_id uuid;
  v_ws_staff_id uuid;
  v_ws_systems_id uuid;
  v_ws_clinical_id uuid;
BEGIN
  -- Get launch ID
  SELECT id INTO v_launch_id
  FROM clinic_launches
  WHERE launch_code = 'EPC-LAUNCH-001';

  IF v_launch_id IS NULL THEN
    RAISE EXCEPTION 'EPC launch not found';
  END IF;

  -- Get week IDs for linking
  SELECT id INTO v_week0_id FROM launch_weeks WHERE clinic_launch_id = v_launch_id AND week_number = 0;
  SELECT id INTO v_week1_id FROM launch_weeks WHERE clinic_launch_id = v_launch_id AND week_number = 1;
  SELECT id INTO v_week2_id FROM launch_weeks WHERE clinic_launch_id = v_launch_id AND week_number = 2;
  SELECT id INTO v_week5_id FROM launch_weeks WHERE clinic_launch_id = v_launch_id AND week_number = 5;

  -- ============================================================================
  -- PHASE 0: DEAL & AUTHORIZATION (Week 0, Day 0-7)
  -- ============================================================================
  INSERT INTO launch_phases (
    clinic_launch_id,
    phase_name,
    phase_order,
    status,
    planned_start_date,
    planned_end_date,
    gate_passed,
    completion_pct
  ) VALUES (
    v_launch_id,
    'phase_0_deal_authorization',
    0,
    'not_started',
    CURRENT_DATE,
    CURRENT_DATE + interval '7 days',
    false,
    0
  ) RETURNING id INTO v_phase0_id;

  -- Link Week 0 to Phase 0
  UPDATE launch_weeks
  SET phase_id = v_phase0_id
  WHERE id = v_week0_id;

  -- ============================================================================
  -- PHASE 1: SITE, BUILD & COMPLIANCE (Week 1-2, Day 8-14)
  -- ============================================================================
  INSERT INTO launch_phases (
    clinic_launch_id,
    phase_name,
    phase_order,
    status,
    planned_start_date,
    planned_end_date,
    gate_passed,
    completion_pct
  ) VALUES (
    v_launch_id,
    'phase_1_site_build_compliance',
    1,
    'not_started',
    CURRENT_DATE + interval '8 days',
    CURRENT_DATE + interval '14 days',
    false,
    0
  ) RETURNING id INTO v_phase1_id;

  -- Link Week 1 to Phase 1
  UPDATE launch_weeks
  SET phase_id = v_phase1_id
  WHERE id = v_week1_id;

  -- ============================================================================
  -- PHASE 2: STAFFING & CREDENTIALING (Week 1-2, Day 8-14, parallel)
  -- ============================================================================
  INSERT INTO launch_phases (
    clinic_launch_id,
    phase_name,
    phase_order,
    status,
    planned_start_date,
    planned_end_date,
    gate_passed,
    completion_pct
  ) VALUES (
    v_launch_id,
    'phase_2_staffing_credentialing',
    2,
    'not_started',
    CURRENT_DATE + interval '8 days',
    CURRENT_DATE + interval '14 days',
    false,
    0
  ) RETURNING id INTO v_phase2_id;

  -- ============================================================================
  -- PHASE 3: SYSTEMS & OPS READINESS (Week 3-4, Day 15-30)
  -- ============================================================================
  INSERT INTO launch_phases (
    clinic_launch_id,
    phase_name,
    phase_order,
    status,
    planned_start_date,
    planned_end_date,
    gate_passed,
    completion_pct
  ) VALUES (
    v_launch_id,
    'phase_3_systems_ops_readiness',
    3,
    'not_started',
    CURRENT_DATE + interval '15 days',
    CURRENT_DATE + interval '30 days',
    false,
    0
  ) RETURNING id INTO v_phase3_id;

  -- Link Week 2 (soft open) to Phase 3
  UPDATE launch_weeks
  SET phase_id = v_phase3_id
  WHERE id = v_week2_id;

  -- ============================================================================
  -- PHASE 4: GO-LIVE (Week 3-4, Day 15-30, overlaps with Phase 3)
  -- ============================================================================
  INSERT INTO launch_phases (
    clinic_launch_id,
    phase_name,
    phase_order,
    status,
    planned_start_date,
    planned_end_date,
    gate_passed,
    completion_pct
  ) VALUES (
    v_launch_id,
    'phase_4_go_live',
    4,
    'not_started',
    CURRENT_DATE + interval '15 days',
    CURRENT_DATE + interval '30 days',
    false,
    0
  ) RETURNING id INTO v_phase4_id;

  -- ============================================================================
  -- PHASE 5: STABILIZATION (Week 5-12, Day 31-90)
  -- ============================================================================
  INSERT INTO launch_phases (
    clinic_launch_id,
    phase_name,
    phase_order,
    status,
    planned_start_date,
    planned_end_date,
    gate_passed,
    completion_pct
  ) VALUES (
    v_launch_id,
    'phase_5_stabilization',
    5,
    'not_started',
    CURRENT_DATE + interval '31 days',
    CURRENT_DATE + interval '90 days',
    false,
    0
  ) RETURNING id INTO v_phase5_id;

  -- Link Week 5 onwards to Phase 5
  UPDATE launch_weeks
  SET phase_id = v_phase5_id
  WHERE clinic_launch_id = v_launch_id
  AND week_number >= 5;

  -- ============================================================================
  -- WORKSTREAMS (Partner Clinic Adapted)
  -- ============================================================================

  -- Workstream 1: Partner Integration & Governance
  INSERT INTO launch_workstreams (
    clinic_launch_id,
    workstream_type,
    workstream_name,
    description,
    owner_role,
    status,
    total_tasks,
    completed_tasks,
    completion_pct
  ) VALUES (
    v_launch_id,
    'compliance_licensing',
    'Partner Integration & Governance',
    'Legal, insurance, and partnership agreement execution',
    'Executive',
    'not_started',
    0, 0, 0
  ) RETURNING id INTO v_ws_partner_id;

  -- Workstream 2: Site Setup (Minimal for Embedded Clinic)
  INSERT INTO launch_workstreams (
    clinic_launch_id,
    workstream_type,
    workstream_name,
    description,
    owner_role,
    status,
    total_tasks,
    completed_tasks,
    completion_pct
  ) VALUES (
    v_launch_id,
    'real_estate_build',
    'Embedded Space Setup',
    'Equipment installation, signage, space readiness within partner facility',
    'Operations Manager',
    'not_started',
    0, 0, 0
  ) RETURNING id INTO v_ws_site_id;

  -- Workstream 3: Staffing & Credentials
  INSERT INTO launch_workstreams (
    clinic_launch_id,
    workstream_type,
    workstream_name,
    description,
    owner_role,
    status,
    total_tasks,
    completed_tasks,
    completion_pct
  ) VALUES (
    v_launch_id,
    'staffing_credentials',
    'Clinical Staffing & Training',
    'Assign clinicians, verify credentials, train on partner workflows',
    'Clinical Director',
    'not_started',
    0, 0, 0
  ) RETURNING id INTO v_ws_staff_id;

  -- Workstream 4: AIM OS & Systems Integration
  INSERT INTO launch_workstreams (
    clinic_launch_id,
    workstream_type,
    workstream_name,
    description,
    owner_role,
    status,
    total_tasks,
    completed_tasks,
    completion_pct
  ) VALUES (
    v_launch_id,
    'systems_it',
    'AIM OS Configuration & Partner Dashboard',
    'Intake forms, member tagging, revenue share logic, partner reporting',
    'Admin',
    'not_started',
    0, 0, 0
  ) RETURNING id INTO v_ws_systems_id;

  -- Workstream 5: Clinical Operations & Quality
  INSERT INTO launch_workstreams (
    clinic_launch_id,
    workstream_type,
    workstream_name,
    description,
    owner_role,
    status,
    total_tasks,
    completed_tasks,
    completion_pct
  ) VALUES (
    v_launch_id,
    'clinical_ops',
    'Clinical Workflows & Data Quality',
    'Episode-of-care compliance, source attribution, outcome tracking',
    'Clinic Manager',
    'not_started',
    0, 0, 0
  ) RETURNING id INTO v_ws_clinical_id;

  -- ============================================================================
  -- PHASE 0 TASKS
  -- ============================================================================

  INSERT INTO launch_tasks (
    clinic_launch_id,
    workstream_id,
    phase_name,
    task_name,
    description,
    is_required,
    is_gate_blocker,
    assigned_role,
    status,
    completion_pct
  ) VALUES
  (v_launch_id, v_ws_partner_id, 'phase_0_deal_authorization', 'Execute Lease Agreement', 'Lease signed with effective date confirmed', true, true, 'Executive', 'not_started', 0),
  (v_launch_id, v_ws_partner_id, 'phase_0_deal_authorization', 'Confirm Revenue Share Terms', 'Percentage, cap, exclusivity, calculation method documented', true, true, 'Executive', 'not_started', 0),
  (v_launch_id, v_ws_partner_id, 'phase_0_deal_authorization', 'Approve Launch Budget', 'Budget approved and allocated in financial system', true, true, 'Executive', 'not_started', 0),
  (v_launch_id, v_ws_partner_id, 'phase_0_deal_authorization', 'Assign Launch Owner', 'Single point of accountability for launch success', true, true, 'Executive', 'not_started', 0),
  (v_launch_id, v_ws_systems_id, 'phase_0_deal_authorization', 'Create EPC Clinic in AIM OS', 'Clinic record instantiated with partner flags', true, true, 'Admin', 'not_started', 0),
  (v_launch_id, v_ws_partner_id, 'phase_0_deal_authorization', 'Confirm Professional Liability Insurance', 'Coverage active, EPC named where required', true, true, 'Admin', 'not_started', 0),
  (v_launch_id, v_ws_partner_id, 'phase_0_deal_authorization', 'Confirm Scope of Practice Compliance', 'Services aligned with provincial regulations', true, true, 'Clinical Director', 'not_started', 0);

  -- ============================================================================
  -- PHASE 1 TASKS (Site Setup)
  -- ============================================================================

  INSERT INTO launch_tasks (
    clinic_launch_id,
    workstream_id,
    phase_name,
    task_name,
    description,
    is_required,
    is_gate_blocker,
    assigned_role,
    status,
    completion_pct
  ) VALUES
  (v_launch_id, v_ws_site_id, 'phase_1_site_build_compliance', 'Confirm Treatment Room Layouts', 'Space allocation within EPC facility confirmed', true, true, 'Operations Manager', 'not_started', 0),
  (v_launch_id, v_ws_site_id, 'phase_1_site_build_compliance', 'Install Equipment & Fixtures', 'Treatment tables, supplies, privacy controls installed', true, true, 'Operations Manager', 'not_started', 0),
  (v_launch_id, v_ws_site_id, 'phase_1_site_build_compliance', 'Verify Utilities & Internet', 'Power, HIPAA-compliant WiFi, phone lines operational', true, true, 'Operations Manager', 'not_started', 0),
  (v_launch_id, v_ws_site_id, 'phase_1_site_build_compliance', 'Approve Signage & Branding', 'EPC-facing signage and intake messaging approved', true, false, 'Executive', 'not_started', 0),
  (v_launch_id, v_ws_partner_id, 'phase_1_site_build_compliance', 'Align EPC Front Desk Referral Process', 'Front desk staff trained on referral script and process', true, true, 'Clinic Manager', 'not_started', 0);

  -- ============================================================================
  -- PHASE 2 TASKS (Staffing)
  -- ============================================================================

  INSERT INTO launch_tasks (
    clinic_launch_id,
    workstream_id,
    phase_name,
    task_name,
    description,
    is_required,
    is_gate_blocker,
    assigned_role,
    status,
    completion_pct
  ) VALUES
  (v_launch_id, v_ws_staff_id, 'phase_2_staffing_credentialing', 'Assign Initial Clinicians', 'Clinicians identified and assigned to EPC clinic', true, true, 'Clinical Director', 'not_started', 0),
  (v_launch_id, v_ws_staff_id, 'phase_2_staffing_credentialing', 'Verify All Credentials', 'Licenses, CPR, malpractice insurance current and documented', true, true, 'Admin', 'not_started', 0),
  (v_launch_id, v_ws_staff_id, 'phase_2_staffing_credentialing', 'Complete EPC-Specific Training', 'Staff trained on partner workflows, member communication', true, true, 'Clinic Manager', 'not_started', 0),
  (v_launch_id, v_ws_staff_id, 'phase_2_staffing_credentialing', 'Complete AIM OS Training', 'Staff trained on intake, scheduling, episode tracking, source attribution', true, true, 'Clinic Manager', 'not_started', 0),
  (v_launch_id, v_ws_staff_id, 'phase_2_staffing_credentialing', 'Log Credential Expiry Dates', 'All expiry dates in credential engine for monitoring', true, true, 'Admin', 'not_started', 0);

  -- ============================================================================
  -- PHASE 3 TASKS (Systems & Ops Readiness)
  -- ============================================================================

  INSERT INTO launch_tasks (
    clinic_launch_id,
    workstream_id,
    phase_name,
    task_name,
    description,
    is_required,
    is_gate_blocker,
    assigned_role,
    status,
    completion_pct
  ) VALUES
  (v_launch_id, v_ws_systems_id, 'phase_3_systems_ops_readiness', 'Finalize AIM OS Intake Forms', 'EPC-specific intake forms configured and tested', true, true, 'Admin', 'not_started', 0),
  (v_launch_id, v_ws_systems_id, 'phase_3_systems_ops_readiness', 'Configure EPC Member Source Tagging', 'All EPC patients auto-tagged for reporting and revenue share', true, true, 'Admin', 'not_started', 0),
  (v_launch_id, v_ws_systems_id, 'phase_3_systems_ops_readiness', 'Activate Revenue Share Calculation Logic', 'Automated calculation configured and tested (inactive until revenue)', true, true, 'Admin', 'not_started', 0),
  (v_launch_id, v_ws_systems_id, 'phase_3_systems_ops_readiness', 'Validate EPC Partner Dashboard', 'Anonymized metrics dashboard tested, no PHI exposure', true, true, 'Admin', 'not_started', 0),
  (v_launch_id, v_ws_systems_id, 'phase_3_systems_ops_readiness', 'Load Scheduling Templates', 'EPC clinic scheduling templates configured in AIM OS', true, true, 'Clinic Manager', 'not_started', 0),
  (v_launch_id, v_ws_clinical_id, 'phase_3_systems_ops_readiness', 'Define Episode-of-Care Requirements', 'Episode tracking made mandatory, no exceptions', true, true, 'Clinical Director', 'not_started', 0),
  (v_launch_id, v_ws_clinical_id, 'phase_3_systems_ops_readiness', 'Enforce Source Attribution', 'All patients must have source attribution captured', true, true, 'Clinic Manager', 'not_started', 0);

  -- ============================================================================
  -- PHASE 4 TASKS (Go-Live)
  -- ============================================================================

  INSERT INTO launch_tasks (
    clinic_launch_id,
    workstream_id,
    phase_name,
    task_name,
    description,
    is_required,
    is_gate_blocker,
    assigned_role,
    status,
    completion_pct
  ) VALUES
  (v_launch_id, v_ws_clinical_id, 'phase_4_go_live', 'Treat First EPC Patient', 'Soft launch with first patient encounter documented', true, true, 'Clinic Manager', 'not_started', 0),
  (v_launch_id, v_ws_clinical_id, 'phase_4_go_live', 'Manual Review of First 20 Patient Journeys', 'Quality check workflows, data capture, compliance', true, true, 'Clinical Director', 'not_started', 0),
  (v_launch_id, v_ws_clinical_id, 'phase_4_go_live', 'Validate Data Completeness ≥95%', 'All required fields captured for first cohort', true, true, 'Clinic Manager', 'not_started', 0),
  (v_launch_id, v_ws_systems_id, 'phase_4_go_live', 'Verify Revenue Share Calculation', 'First calculation run matches expected logic', true, true, 'Admin', 'not_started', 0),
  (v_launch_id, v_ws_clinical_id, 'phase_4_go_live', 'Confirm Utilization Tracking Accuracy', 'Clinician hours, patient volume, utilization % validated', true, false, 'Clinic Manager', 'not_started', 0);

  -- ============================================================================
  -- PHASE 5 TASKS (Stabilization)
  -- ============================================================================

  INSERT INTO launch_tasks (
    clinic_launch_id,
    workstream_id,
    phase_name,
    task_name,
    description,
    is_required,
    is_gate_blocker,
    assigned_role,
    status,
    completion_pct
  ) VALUES
  (v_launch_id, v_ws_clinical_id, 'phase_5_stabilization', 'Achieve Target Patient Volume', '150+ patients treated by Day 60, 200+ by Day 90', true, true, 'Clinic Manager', 'not_started', 0),
  (v_launch_id, v_ws_clinical_id, 'phase_5_stabilization', 'Achieve 10%+ Conversion Rate', 'Sustainable member conversion established', true, true, 'Executive', 'not_started', 0),
  (v_launch_id, v_ws_staff_id, 'phase_5_stabilization', 'Verify Staffing Stable', 'No unplanned clinician turnover, coverage ≥target', true, true, 'Clinical Director', 'not_started', 0),
  (v_launch_id, v_ws_clinical_id, 'phase_5_stabilization', 'Verify Utilization ≥75%', 'Clinician utilization meets or exceeds target', true, true, 'Clinic Manager', 'not_started', 0),
  (v_launch_id, v_ws_partner_id, 'phase_5_stabilization', 'Activate Weekly EPC Reporting', 'Anonymized metrics delivered to EPC weekly', true, true, 'Executive', 'not_started', 0),
  (v_launch_id, v_ws_partner_id, 'phase_5_stabilization', 'Prepare 90-Day Performance Report', 'Board-ready report with conversion, revenue, lessons learned', true, true, 'Executive', 'not_started', 0),
  (v_launch_id, v_ws_systems_id, 'phase_5_stabilization', 'Clone EPC Configuration for Replication', 'Template validated and ready for next partner clinic', true, true, 'Admin', 'not_started', 0);

  -- Update task counts for workstreams
  UPDATE launch_workstreams ws
  SET total_tasks = (
    SELECT COUNT(*)
    FROM launch_tasks lt
    WHERE lt.workstream_id = ws.id
  )
  WHERE ws.clinic_launch_id = v_launch_id;

END $$;