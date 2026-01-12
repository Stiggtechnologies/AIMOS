/*
  # Seed RevOps Demo Data

  ## Purpose
  Create realistic revenue operations data showing pipeline flow,
  bottlenecks, capacity constraints, and clinician productivity

  ## Data Created
  1. 4 weeks of pipeline metrics (showing bottleneck progression)
  2. 4 weeks of capacity metrics (showing utilization trends)
  3. Active bottlenecks (intake and capacity constraints)
  4. Clinician productivity metrics (varying performance tiers)
  5. Growth alerts (capacity shortage, demand spike)
*/

DO $$
DECLARE
  exec_user_id uuid;
  admin_user_id uuid;
  clinic_id_1 uuid;
  clinician_1 uuid;
  clinician_2 uuid;
  clinician_3 uuid;
BEGIN
  -- Get IDs
  SELECT id INTO exec_user_id FROM user_profiles WHERE role = 'executive' LIMIT 1;
  SELECT id INTO admin_user_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
  SELECT id INTO clinic_id_1 FROM clinics LIMIT 1;
  
  -- Get clinicians
  SELECT id INTO clinician_1 FROM user_profiles WHERE role = 'clinician' LIMIT 1 OFFSET 0;
  SELECT id INTO clinician_2 FROM user_profiles WHERE role = 'clinician' LIMIT 1 OFFSET 1;
  SELECT id INTO clinician_3 FROM user_profiles WHERE role = 'clinician' LIMIT 1 OFFSET 2;

  -- Pipeline Metrics (4 weeks showing progression)
  INSERT INTO revops_pipeline_metrics (
    clinic_id, period_start, period_end, period_type,
    marketing_leads, marketing_spend, cost_per_lead,
    intake_received, intake_qualified, intake_conversion_rate, avg_intake_to_schedule_hours,
    appointments_scheduled, schedule_conversion_rate, avg_schedule_to_first_visit_days,
    appointments_completed, completion_rate, no_show_rate,
    total_revenue, revenue_per_appointment, revenue_per_lead,
    overall_conversion_rate, marketing_roi,
    primary_bottleneck, bottleneck_severity
  ) VALUES
    (
      clinic_id_1, CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '22 days', 'week',
      120, 3600.00, 30.00,
      115, 95, 82.61, 4.5,
      88, 92.63, 3.2,
      82, 93.18, 6.82,
      32800.00, 400.00, 273.33,
      68.33, 811.11,
      'intake', 'minor'
    ),
    (
      clinic_id_1, CURRENT_DATE - INTERVAL '21 days', CURRENT_DATE - INTERVAL '15 days', 'week',
      145, 4350.00, 30.00,
      138, 102, 73.91, 6.2,
      95, 93.14, 3.5,
      88, 92.63, 7.37,
      35200.00, 400.00, 242.76,
      60.69, 709.20,
      'intake', 'moderate'
    ),
    (
      clinic_id_1, CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '8 days', 'week',
      168, 5040.00, 30.00,
      162, 108, 66.67, 8.5,
      98, 90.74, 4.2,
      91, 92.86, 7.14,
      36400.00, 400.00, 216.67,
      54.17, 622.22,
      'intake', 'severe'
    ),
    (
      clinic_id_1, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 day', 'week',
      185, 5550.00, 30.00,
      178, 95, 53.37, 12.0,
      88, 92.63, 5.8,
      82, 93.18, 6.82,
      32800.00, 400.00, 177.30,
      44.32, 490.99,
      'capacity', 'severe'
    );

  -- Capacity Metrics (4 weeks showing constraint development)
  INSERT INTO revops_capacity_metrics (
    clinic_id, period_start, period_end,
    total_clinicians, active_clinicians, total_available_hours,
    booked_hours, completed_hours, utilization_rate, efficiency_rate,
    total_revenue, revenue_per_hour, revenue_per_clinician,
    hours_at_capacity, constrained_demand, estimated_lost_revenue,
    demand_growth_rate, capacity_growth_rate, capacity_gap
  ) VALUES
    (
      clinic_id_1, CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '22 days',
      8, 8, 320.00,
      246.00, 238.00, 76.88, 96.75,
      32800.00, 137.82, 4100.00,
      8.00, 5, 2000.00,
      5.00, 0.00, 0.00
    ),
    (
      clinic_id_1, CURRENT_DATE - INTERVAL '21 days', CURRENT_DATE - INTERVAL '15 days',
      8, 8, 320.00,
      264.00, 255.00, 82.50, 96.59,
      35200.00, 138.04, 4400.00,
      24.00, 12, 4800.00,
      8.00, 0.00, -12.00
    ),
    (
      clinic_id_1, CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '8 days',
      8, 7, 280.00,
      273.00, 264.00, 97.50, 96.70,
      36400.00, 137.88, 5200.00,
      56.00, 22, 8800.00,
      12.00, -12.50, -35.00
    ),
    (
      clinic_id_1, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 day',
      8, 7, 280.00,
      246.00, 238.00, 87.86, 96.75,
      32800.00, 137.82, 4685.71,
      42.00, 35, 14000.00,
      15.00, -12.50, -52.00
    );

  -- Active Bottlenecks
  INSERT INTO revops_bottlenecks (
    clinic_id, bottleneck_stage, severity,
    appointments_delayed, appointments_lost, revenue_delayed, revenue_lost,
    root_cause, contributing_factors,
    current_throughput, optimal_throughput, throughput_gap_percentage,
    recommended_actions, estimated_resolution_time, estimated_impact_if_resolved,
    status, detected_at, assigned_to, priority
  ) VALUES
    (
      clinic_id_1, 'intake', 'severe',
      35, 18, 14000.00, 7200.00,
      'Intake team overwhelmed by increasing lead volume. Processing time increased from 4.5h to 12h.',
      ARRAY['Staff shortage in intake team', 'Manual qualification process', 'Peak demand exceeded capacity', 'No automated triage'],
      95, 178, 46.63,
      ARRAY['Hire 2 additional intake coordinators immediately', 'Implement automated lead qualification system', 'Add evening intake hours', 'Create priority queue for urgent cases'],
      '2-3 weeks',
      28800.00,
      'active', CURRENT_DATE - INTERVAL '10 days', admin_user_id, 10
    ),
    (
      clinic_id_1, 'capacity', 'critical',
      42, 35, 16800.00, 14000.00,
      'Clinician capacity at 97.5% utilization. Cannot accommodate demand growth.',
      ARRAY['Only 7 of 8 clinicians active', '1 clinician on extended leave', 'No backup capacity', 'Demand growing 15% while capacity shrinking'],
      238, 350, 32.00,
      ARRAY['Recruit 2-3 new clinicians urgently', 'Offer overtime incentives to current staff', 'Cross-train admin staff for basic procedures', 'Expand evening and weekend hours', 'Consider temporary contractors'],
      '4-6 weeks',
      56000.00,
      'active', CURRENT_DATE - INTERVAL '5 days', exec_user_id, 10
    ),
    (
      clinic_id_1, 'scheduling', 'moderate',
      12, 4, 4800.00, 1600.00,
      'Suboptimal scheduling creating gaps and underutilized time slots.',
      ARRAY['Manual scheduling process', 'Poor slot optimization', 'Last-minute cancellations not backfilled'],
      88, 105, 16.19,
      ARRAY['Implement intelligent scheduling software', 'Create waitlist for last-minute openings', 'Optimize appointment length by treatment type'],
      '2-4 weeks',
      8000.00,
      'monitoring', CURRENT_DATE - INTERVAL '12 days', admin_user_id, 6
    );

  -- Clinician Productivity (showing performance variation)
  IF clinician_1 IS NOT NULL THEN
    INSERT INTO revops_clinician_productivity (
      clinician_id, clinic_id, period_start, period_end,
      scheduled_hours, worked_hours, productive_hours,
      patients_seen, appointments_completed, treatments_delivered,
      total_revenue, revenue_per_hour, revenue_per_patient,
      utilization_rate, productivity_rate, avg_appointment_duration,
      patient_satisfaction_score, treatment_completion_rate, rebooking_rate,
      performance_tier
    ) VALUES (
      clinician_1, clinic_id_1, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 day',
      40.00, 39.50, 38.00,
      42, 42, 58,
      16800.00, 442.11, 400.00,
      98.75, 96.20, 54.29,
      4.75, 95.24, 78.00,
      'top_performer'
    );
  END IF;

  IF clinician_2 IS NOT NULL THEN
    INSERT INTO revops_clinician_productivity (
      clinician_id, clinic_id, period_start, period_end,
      scheduled_hours, worked_hours, productive_hours,
      patients_seen, appointments_completed, treatments_delivered,
      total_revenue, revenue_per_hour, revenue_per_patient,
      utilization_rate, productivity_rate, avg_appointment_duration,
      patient_satisfaction_score, treatment_completion_rate, rebooking_rate,
      performance_tier
    ) VALUES (
      clinician_2, clinic_id_1, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 day',
      40.00, 38.00, 35.00,
      35, 35, 48,
      14000.00, 368.42, 400.00,
      95.00, 92.11, 60.00,
      4.50, 91.43, 65.00,
      'above_average'
    );
  END IF;

  IF clinician_3 IS NOT NULL THEN
    INSERT INTO revops_clinician_productivity (
      clinician_id, clinic_id, period_start, period_end,
      scheduled_hours, worked_hours, productive_hours,
      patients_seen, appointments_completed, treatments_delivered,
      total_revenue, revenue_per_hour, revenue_per_patient,
      utilization_rate, productivity_rate, avg_appointment_duration,
      patient_satisfaction_score, treatment_completion_rate, rebooking_rate,
      performance_tier
    ) VALUES (
      clinician_3, clinic_id_1, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 day',
      40.00, 36.00, 32.00,
      28, 28, 38,
      11200.00, 311.11, 400.00,
      90.00, 88.89, 68.57,
      4.20, 85.71, 55.00,
      'average'
    );
  END IF;

  -- Growth Alerts
  INSERT INTO revops_growth_alerts (
    clinic_id, alert_type, severity,
    current_demand, current_capacity, gap_percentage,
    potential_revenue_loss, revenue_opportunity,
    forecast_horizon, projected_gap_if_unaddressed,
    recommended_action, action_details, estimated_cost, estimated_revenue_gain, roi_percentage,
    status, triggered_at
  ) VALUES
    (
      clinic_id_1, 'capacity_shortage', 'critical',
      350, 238, 32.00,
      56000.00, 112000.00,
      '8 weeks', 525,
      'Urgent hiring required: Add 3 clinicians to meet growing demand',
      '{"hire_clinicians": 3, "target_date": "2026-02-15", "estimated_onboarding": "4 weeks"}'::jsonb,
      180000.00, 448000.00, 148.89,
      'active', CURRENT_DATE - INTERVAL '5 days'
    ),
    (
      clinic_id_1, 'demand_spike', 'warning',
      185, 120, 35.14,
      26000.00, 52000.00,
      '4 weeks', 245,
      'Marketing effectiveness increased 54% - intake team cannot process lead volume',
      '{"hire_intake_coordinators": 2, "implement_automation": true, "add_evening_hours": true}'::jsonb,
      75000.00, 115200.00, 53.60,
      'active', CURRENT_DATE - INTERVAL '10 days'
    ),
    (
      clinic_id_1, 'utilization_ceiling', 'warning',
      280, 280, 0.00,
      0.00, 67200.00,
      '6 weeks', 112,
      'Utilization at 97.5% - no buffer capacity for growth or emergencies',
      '{"add_buffer_capacity": "15%", "cross_train_staff": true, "overtime_program": true}'::jsonb,
      45000.00, 67200.00, 49.33,
      'acknowledged', CURRENT_DATE - INTERVAL '3 days'
    );

END $$;
