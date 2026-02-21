/*
  # Seed Excellence Baselines

  Seeds the 5 core baseline metrics for operational excellence demos.
*/

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get a user ID or use NULL
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  INSERT INTO excellence_baselines (
    id, metric_key, metric_name, metric_category, target_value, target_min, target_max,
    unit, clinic_type, is_mandatory, green_band_min, green_band_max,
    yellow_band_min, yellow_band_max, version, effective_from,
    rationale, created_by
  )
  VALUES
    (
      gen_random_uuid(), 'clinician_utilization', 'Clinician Utilization', 'productivity',
      75, 70, 80, 'percentage', 'all', true, 70, 80, 60, 70, 1, NOW(),
      'Platform-wide standard for clinician productivity', v_user_id
    ),
    (
      gen_random_uuid(), 'credential_compliance_rate', 'Credential Compliance Rate', 'compliance',
      100, 100, 100, 'percentage', 'all', true, 100, 100, 95, 100, 1, NOW(),
      'Zero-tolerance policy for credential compliance', v_user_id
    ),
    (
      gen_random_uuid(), 'patient_no_show_rate', 'No-Show Rate', 'patient_experience',
      5, 0, 5, 'percentage', 'all', true, 0, 5, 5, 10, 1, NOW(),
      'Target maximum patient no-show rate', v_user_id
    ),
    (
      gen_random_uuid(), 'wcb_case_aging_days', 'WCB Case Aging', 'operations',
      14, 0, 14, 'days', 'all', true, 0, 14, 14, 21, 1, NOW(),
      'Maximum days for WCB case resolution', v_user_id
    ),
    (
      gen_random_uuid(), 'patient_stabilization_days', 'Time to Stabilization', 'clinical',
      30, 0, 30, 'days', 'all', true, 0, 30, 30, 45, 1, NOW(),
      'Target time to achieve patient clinical stabilization', v_user_id
    )
  ON CONFLICT (metric_key) DO NOTHING;
END $$;
