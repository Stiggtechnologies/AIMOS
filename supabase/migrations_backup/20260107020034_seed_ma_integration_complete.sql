/*
  # Seed M&A / Clinic Integration Module Data
  
  Realistic data for 4 clinic acquisitions:
  - Valley Sports ($3.5M): Completed success story
  - Metro PT ($2.8M): Day 90 phase
  - Coastal Rehab ($4.2M): Day 30 phase
  - Summit Wellness ($5.2M): Planning phase
*/

DO $$
DECLARE
  v_clinic_ids uuid[];
  v_int1 uuid := '10000001-0001-0001-0001-000000000001';
  v_int2 uuid := '10000001-0001-0001-0001-000000000002';
  v_int3 uuid := '10000001-0001-0001-0001-000000000003';
  v_int4 uuid := '10000001-0001-0001-0001-000000000004';
BEGIN
  SELECT ARRAY(SELECT id FROM clinics ORDER BY created_at LIMIT 4) INTO v_clinic_ids;
  
  IF array_length(v_clinic_ids, 1) < 4 THEN
    RAISE NOTICE 'Not enough clinics. Skipping M&A data.';
    RETURN;
  END IF;

  -- INTEGRATIONS  
  INSERT INTO clinic_integrations (
    id, clinic_id, integration_code, integration_type, acquisition_date, integration_start_date,
    target_completion_date, actual_completion_date, integration_status, integration_phase,
    progress_percent, health_score, risk_level, deal_size_usd, target_annual_revenue,
    target_patient_volume, target_staff_count, synergy_targets, integration_budget, actual_spend,
    day_0_completion_date, day_30_completion_date, day_90_completion_date, lessons_learned, created_at
  ) VALUES (
    v_int1, v_clinic_ids[1], 'VSC-2024-001', 'acquisition',
    (now() - interval '120 days')::date, (now() - interval '110 days')::date,
    (now() - interval '20 days')::date, (now() - interval '25 days')::date,
    'completed', 'post_integration', 100, 95.5, 'low',
    3500000, 2800000, 12000, 45,
    '{"cost_synergies": 250000, "revenue_synergies": 400000}', 450000, 425000,
    (now() - interval '110 days')::date, (now() - interval '80 days')::date, (now() - interval '25 days')::date,
    'Excellent integration model.', now() - interval '120 days'
  ), (
    v_int2, v_clinic_ids[2], 'MPT-2024-002', 'acquisition',
    (now() - interval '60 days')::date, (now() - interval '55 days')::date,
    (now() + interval '35 days')::date, NULL,
    'in_progress', 'day_90', 72, 78.0, 'medium',
    2800000, 2100000, 9500, 38,
    '{"cost_synergies": 180000, "revenue_synergies": 300000}', 380000, 285000,
    (now() - interval '55 days')::date, (now() - interval '30 days')::date, NULL,
    NULL, now() - interval '60 days'
  ), (
    v_int3, v_clinic_ids[3], 'CRC-2024-003', 'acquisition',
    (now() - interval '20 days')::date, (now() - interval '18 days')::date,
    (now() + interval '72 days')::date, NULL,
    'in_progress', 'day_30', 35, 85.0, 'medium',
    4200000, 3200000, 15000, 52,
    '{"cost_synergies": 320000, "revenue_synergies": 500000}', 520000, 145000,
    (now() - interval '18 days')::date, NULL, NULL,
    NULL, now() - interval '20 days'
  ), (
    v_int4, v_clinic_ids[4], 'SW-2025-001', 'acquisition',
    NULL, (now() + interval '30 days')::date, (now() + interval '120 days')::date, NULL,
    'planning', 'day_0', 15, 88.0, 'medium',
    5200000, 4100000, 18000, 68,
    '{"cost_synergies": 420000, "revenue_synergies": 650000}', 680000, 85000,
    NULL, NULL, NULL, NULL, now() - interval '10 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- MILESTONES
  INSERT INTO integration_milestones (integration_id, milestone_name, milestone_type, target_date, actual_date, status, phase, is_gate, approval_status)
  VALUES
    (v_int1, 'Day 0 - Legal & Systems Cutover', 'day_0', (now() - interval '110 days')::date, (now() - interval '110 days')::date, 'achieved', 'day_0', true, 'approved'),
    (v_int1, 'Day 30 - Operational Integration', 'day_30', (now() - interval '80 days')::date, (now() - interval '80 days')::date, 'achieved', 'day_30', true, 'approved'),
    (v_int1, 'Day 90 - Full Integration', 'day_90', (now() - interval '20 days')::date, (now() - interval '25 days')::date, 'achieved', 'day_90', true, 'approved'),
    (v_int2, 'Day 0 - Legal & Systems Cutover', 'day_0', (now() - interval '55 days')::date, (now() - interval '55 days')::date, 'achieved', 'day_0', true, 'approved'),
    (v_int2, 'Day 30 - Operational Integration', 'day_30', (now() - interval '30 days')::date, (now() - interval '30 days')::date, 'achieved', 'day_30', true, 'approved'),
    (v_int2, 'Day 90 - Full Integration', 'day_90', (now() + interval '35 days')::date, NULL, 'in_progress', 'day_90', true, 'pending'),
    (v_int3, 'Day 0 - Legal & Systems Cutover', 'day_0', (now() - interval '18 days')::date, (now() - interval '18 days')::date, 'achieved', 'day_0', true, 'approved'),
    (v_int3, 'Day 30 - Operational Integration', 'day_30', (now() + interval '10 days')::date, NULL, 'in_progress', 'day_30', true, 'pending'),
    (v_int3, 'Day 90 - Full Integration', 'day_90', (now() + interval '72 days')::date, NULL, 'pending', 'day_90', true, 'not_required'),
    (v_int4, 'Pre-Close Planning Complete', 'custom', (now() + interval '25 days')::date, NULL, 'in_progress', 'day_0', false, 'not_required'),
    (v_int4, 'Day 0 - Legal & Systems Cutover', 'day_0', (now() + interval '30 days')::date, NULL, 'pending', 'day_0', true, 'not_required'),
    (v_int4, 'Day 30 - Operational Integration', 'day_30', (now() + interval '60 days')::date, NULL, 'pending', 'day_30', true, 'not_required'),
    (v_int4, 'Day 90 - Full Integration', 'day_90', (now() + interval '120 days')::date, NULL, 'pending', 'day_90', true, 'not_required');

  -- TASKS
  INSERT INTO integration_tasks (integration_id, task_category, task_title, milestone, priority, status, due_date, completion_date)
  VALUES
    (v_int1, 'legal', 'Execute purchase agreement', 'day_0', 'critical', 'completed', (now() - interval '110 days')::date, (now() - interval '110 days')::date),
    (v_int1, 'technology', 'Migrate EHR data', 'day_0', 'critical', 'completed', (now() - interval '108 days')::date, (now() - interval '108 days')::date),
    (v_int1, 'hr', 'Complete employee onboarding', 'day_30', 'high', 'completed', (now() - interval '85 days')::date, (now() - interval '82 days')::date),
    (v_int1, 'operations', 'Standardize protocols', 'day_30', 'high', 'completed', (now() - interval '80 days')::date, (now() - interval '80 days')::date),
    (v_int1, 'financial', 'Integrate financial reporting', 'day_90', 'high', 'completed', (now() - interval '30 days')::date, (now() - interval '28 days')::date),
    (v_int1, 'clinical', 'Achieve quality benchmarks', 'day_90', 'high', 'completed', (now() - interval '25 days')::date, (now() - interval '25 days')::date),
    (v_int2, 'legal', 'Execute purchase agreement', 'day_0', 'critical', 'completed', (now() - interval '55 days')::date, (now() - interval '55 days')::date),
    (v_int2, 'technology', 'Migrate EHR data', 'day_0', 'critical', 'completed', (now() - interval '52 days')::date, (now() - interval '53 days')::date),
    (v_int2, 'hr', 'Complete employee onboarding', 'day_30', 'high', 'completed', (now() - interval '35 days')::date, (now() - interval '32 days')::date),
    (v_int2, 'operations', 'Standardize protocols', 'day_30', 'high', 'completed', (now() - interval '30 days')::date, (now() - interval '30 days')::date),
    (v_int2, 'financial', 'Integrate financial reporting', 'day_90', 'high', 'in_progress', (now() + interval '25 days')::date, NULL),
    (v_int2, 'clinical', 'Achieve quality benchmarks', 'day_90', 'high', 'in_progress', (now() + interval '35 days')::date, NULL),
    (v_int2, 'operations', 'Complete SOP training', 'day_90', 'medium', 'in_progress', (now() + interval '30 days')::date, NULL),
    (v_int3, 'legal', 'Execute purchase agreement', 'day_0', 'critical', 'completed', (now() - interval '18 days')::date, (now() - interval '18 days')::date),
    (v_int3, 'technology', 'Migrate EHR data', 'day_0', 'critical', 'completed', (now() - interval '16 days')::date, (now() - interval '17 days')::date),
    (v_int3, 'hr', 'Complete employee onboarding', 'day_30', 'high', 'in_progress', (now() + interval '8 days')::date, NULL),
    (v_int3, 'operations', 'Standardize protocols', 'day_30', 'high', 'in_progress', (now() + interval '10 days')::date, NULL),
    (v_int3, 'legal', 'Update compliance docs', 'day_30', 'high', 'not_started', (now() + interval '12 days')::date, NULL),
    (v_int3, 'financial', 'Integrate financial reporting', 'day_90', 'high', 'not_started', (now() + interval '60 days')::date, NULL),
    (v_int4, 'legal', 'Finalize purchase agreement', 'day_0', 'critical', 'in_progress', (now() + interval '25 days')::date, NULL),
    (v_int4, 'cultural', 'Conduct cultural assessment', 'day_0', 'high', 'in_progress', (now() + interval '20 days')::date, NULL),
    (v_int4, 'technology', 'Plan EHR migration', 'day_0', 'critical', 'not_started', (now() + interval '30 days')::date, NULL),
    (v_int4, 'operations', 'Design integration playbook', 'day_0', 'high', 'in_progress', (now() + interval '15 days')::date, NULL);

  -- METRICS
  INSERT INTO performance_normalization_metrics (
    integration_id, metric_code, metric_name, metric_category, unit_of_measure,
    baseline_value, target_value, current_value, status, trend
  ) VALUES
    (v_int1, 'REV_PER_VISIT', 'Revenue Per Visit', 'financial', 'USD', 145, 165, 168.5, 'achieved', 'improving'),
    (v_int1, 'UTIL_RATE', 'Provider Utilization', 'operational', '%', 72, 85, 87.5, 'achieved', 'improving'),
    (v_int1, 'PATIENT_SAT', 'Patient Satisfaction', 'patient_satisfaction', 'score', 4.2, 4.6, 4.7, 'achieved', 'improving'),
    (v_int2, 'REV_PER_VISIT', 'Revenue Per Visit', 'financial', 'USD', 138, 160, 152, 'at_risk', 'improving'),
    (v_int2, 'UTIL_RATE', 'Provider Utilization', 'operational', '%', 68, 82, 76, 'on_track', 'improving'),
    (v_int2, 'PATIENT_SAT', 'Patient Satisfaction', 'patient_satisfaction', 'score', 4.1, 4.5, 4.3, 'on_track', 'stable'),
    (v_int3, 'REV_PER_VISIT', 'Revenue Per Visit', 'financial', 'USD', 152, 172, 155, 'on_track', 'stable'),
    (v_int3, 'UTIL_RATE', 'Provider Utilization', 'operational', '%', 75, 88, 76, 'on_track', 'stable');

  -- CULTURAL TASKS
  INSERT INTO cultural_alignment_tasks (
    integration_id, task_code, task_name, task_type, target_audience,
    participant_count, completed_count, status, engagement_score
  ) VALUES
    (v_int1, 'WELCOME', 'Welcome & Kickoff', 'team_building', 'all_staff', 45, 45, 'completed', 92),
    (v_int1, 'CULTURE', 'Culture Training', 'training', 'all_staff', 45, 45, 'completed', 88),
    (v_int2, 'WELCOME', 'Welcome & Kickoff', 'team_building', 'all_staff', 38, 38, 'completed', 85),
    (v_int2, 'CULTURE', 'Culture Training', 'training', 'all_staff', 38, 32, 'in_progress', 82),
    (v_int2, 'LEADERSHIP', 'Leadership Workshops', 'communication', 'leadership', 8, 8, 'completed', 90),
    (v_int3, 'WELCOME', 'Welcome & Kickoff', 'team_building', 'all_staff', 52, 52, 'completed', 87),
    (v_int3, 'CULTURE', 'Culture Training', 'training', 'all_staff', 52, 18, 'in_progress', NULL),
    (v_int4, 'ASSESS', 'Cultural Assessment', 'assessment', 'leadership', 12, 8, 'in_progress', NULL);

  RAISE NOTICE 'M&A data seeded: 4 integrations ($15.7M), 23 tasks, 13 milestones, 8 metrics, 8 cultural activities';
END $$;