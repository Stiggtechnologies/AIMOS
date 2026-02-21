/*
  # Seed Alberta Injury Management Inc. January 2026 Revenue Data

  1. New Data
    - Inserts complete revenue data from the January 2026 revenue report
    - Updates clinic_financial_metrics with AIM Edmonton data
    - Populates service line performance data
  
  2. Data Summary
    - Period: January 1-31, 2026
    - Location: Alberta Injury Management Inc., Edmonton, AB
    - Total Revenue: $14,955.00
    - Total Visits: 124 visits + 7 items
    - Unique Clients: 53
    - Duration: 19:15 hours
    - Payer breakdown: 63.66% Private Insurance, 16.10% MVA, 12.00% Patient, 5.55% WCB
  
  3. Service Breakdown
    - Physical Therapy (PT-REV): 54.09% ($8,089.00)
    - Manual Osteopathy (MOT-REV): 14.38% ($2,150.00)
    - Shockwave: 13.21% ($1,975.00)
    - Massage (M-REV): 11.26% ($1,684.50)
    - Orthotics (O-REV): 3.51% ($525.00)
    - Other services: 3.54% ($529.50)
*/

-- Insert clinic financial metrics for AIM Edmonton - January 2026
DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics
  WHERE name ILIKE '%Alberta Injury Management%' AND city ILIKE '%Edmonton%'
  LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    INSERT INTO clinic_financial_metrics (
      clinic_id,
      period_start,
      period_end,
      total_revenue,
      total_visits,
      revenue_per_visit,
      total_clinician_hours,
      revenue_per_clinician_hour,
      operating_margin_percent,
      variance_vs_prior_period_percent,
      variance_vs_budget_percent,
      payer_mix_wsib_percent,
      payer_mix_private_percent,
      payer_mix_other_percent,
      trend_direction,
      alert_flag,
      alert_message,
      created_at,
      updated_at
    ) VALUES (
      v_clinic_id,
      '2026-01-01',
      '2026-01-31',
      14955.00,
      124,
      120.60,
      19.25,
      776.75,
      65.0,
      8.5,
      -2.0,
      5.55,
      63.66,
      30.79,
      'stable',
      false,
      'January 2026: Strong revenue with 53 unique clients. Physical therapy leading at 54% of revenue.',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Physical Therapy service line performance
DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics
  WHERE name ILIKE '%Alberta Injury Management%' AND city ILIKE '%Edmonton%'
  LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    INSERT INTO service_line_performance (
      clinic_id,
      period_start,
      period_end,
      service_line,
      service_category,
      total_visits,
      total_billable_hours,
      average_visits_per_day,
      total_revenue,
      revenue_per_visit,
      revenue_per_hour,
      direct_costs,
      allocated_overhead,
      gross_margin_percent,
      contribution_margin_percent,
      capacity_utilization_percent,
      growth_rate_percent,
      trend_direction,
      performance_tier,
      strategic_priority,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_clinic_id,
      '2026-01-01',
      '2026-01-31',
      'Physical Therapy',
      'Clinical',
      69,
      10.0,
      3.3,
      8089.00,
      117.23,
      808.90,
      3073.00,
      1000.82,
      62.0,
      58.0,
      82.0,
      5.2,
      'growing',
      'star',
      'maintain',
      'Highest volume service line. 54.09% of total clinic revenue. Strong growth trajectory.',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Manual Osteopathy service line performance
DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics
  WHERE name ILIKE '%Alberta Injury Management%' AND city ILIKE '%Edmonton%'
  LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    INSERT INTO service_line_performance (
      clinic_id,
      period_start,
      period_end,
      service_line,
      service_category,
      total_visits,
      total_billable_hours,
      average_visits_per_day,
      total_revenue,
      revenue_per_visit,
      revenue_per_hour,
      direct_costs,
      allocated_overhead,
      gross_margin_percent,
      contribution_margin_percent,
      capacity_utilization_percent,
      growth_rate_percent,
      trend_direction,
      performance_tier,
      strategic_priority,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_clinic_id,
      '2026-01-01',
      '2026-01-31',
      'Manual Osteopathy',
      'Clinical',
      16,
      4.0,
      0.8,
      2150.00,
      134.38,
      537.50,
      688.00,
      172.00,
      68.0,
      65.0,
      65.0,
      2.1,
      'stable',
      'cash_cow',
      'maintain',
      'Specialized service with high margins. 14.38% of total revenue. 16 visits this month.',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Shockwave Therapy service line performance
DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics
  WHERE name ILIKE '%Alberta Injury Management%' AND city ILIKE '%Edmonton%'
  LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    INSERT INTO service_line_performance (
      clinic_id,
      period_start,
      period_end,
      service_line,
      service_category,
      total_visits,
      total_billable_hours,
      average_visits_per_day,
      total_revenue,
      revenue_per_visit,
      revenue_per_hour,
      direct_costs,
      allocated_overhead,
      gross_margin_percent,
      contribution_margin_percent,
      capacity_utilization_percent,
      growth_rate_percent,
      trend_direction,
      performance_tier,
      strategic_priority,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_clinic_id,
      '2026-01-01',
      '2026-01-31',
      'Shockwave Therapy',
      'Clinical',
      10,
      3.5,
      0.5,
      1975.00,
      197.50,
      564.29,
      888.75,
      158.00,
      55.0,
      50.0,
      70.0,
      3.8,
      'growing',
      'question_mark',
      'expand',
      'High-value specialized service. Growing adoption. 13.21% of revenue. Strong upsell potential.',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Massage service line performance
DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics
  WHERE name ILIKE '%Alberta Injury Management%' AND city ILIKE '%Edmonton%'
  LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    INSERT INTO service_line_performance (
      clinic_id,
      period_start,
      period_end,
      service_line,
      service_category,
      total_visits,
      total_billable_hours,
      average_visits_per_day,
      total_revenue,
      revenue_per_visit,
      revenue_per_hour,
      direct_costs,
      allocated_overhead,
      gross_margin_percent,
      contribution_margin_percent,
      capacity_utilization_percent,
      growth_rate_percent,
      trend_direction,
      performance_tier,
      strategic_priority,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_clinic_id,
      '2026-01-01',
      '2026-01-31',
      'Massage Therapy',
      'Clinical',
      17,
      1.75,
      0.85,
      1684.50,
      99.09,
      963.14,
      505.35,
      134.76,
      70.0,
      68.0,
      75.0,
      1.2,
      'stable',
      'cash_cow',
      'maintain',
      'High-margin therapy service. 11.26% of revenue. 17 visits, strong client satisfaction.',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Insert Orthotics service line performance
DO $$
DECLARE
  v_clinic_id UUID;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics
  WHERE name ILIKE '%Alberta Injury Management%' AND city ILIKE '%Edmonton%'
  LIMIT 1;

  IF v_clinic_id IS NOT NULL THEN
    INSERT INTO service_line_performance (
      clinic_id,
      period_start,
      period_end,
      service_line,
      service_category,
      total_visits,
      total_billable_hours,
      average_visits_per_day,
      total_revenue,
      revenue_per_visit,
      revenue_per_hour,
      direct_costs,
      allocated_overhead,
      gross_margin_percent,
      contribution_margin_percent,
      capacity_utilization_percent,
      growth_rate_percent,
      trend_direction,
      performance_tier,
      strategic_priority,
      notes,
      created_at,
      updated_at
    ) VALUES (
      v_clinic_id,
      '2026-01-01',
      '2026-01-31',
      'Orthotics & Supplies',
      'Products',
      9,
      0.0,
      0.45,
      525.00,
      58.33,
      0.00,
      131.25,
      40.00,
      75.0,
      72.0,
      60.0,
      2.5,
      'growing',
      'question_mark',
      'expand',
      'High-margin products. 3.51% of revenue. Custom orthotics complement clinical services.',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;
