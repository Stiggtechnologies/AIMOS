/*
  # Seed Clinic Financial Metrics from AIM Reports

  1. Service Line Performance Metrics
    - Detailed breakdown by revenue category
    - Target vs actual variance tracking
    - Visit volume and revenue per service

  2. Banking and Cash Flow Metrics
    - Current cash position
    - Monthly inflows/outflows
    - Payor collection performance
*/

-- Get the first clinic (AIM main clinic)
DO $$
DECLARE
  v_clinic_id uuid;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics ORDER BY created_at LIMIT 1;

  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'No clinic found in database';
  END IF;

  -- Delete existing metrics for clean slate
  DELETE FROM clinic_financial_metrics WHERE clinic_id = v_clinic_id;

  -- Insert service line revenue metrics (Annual FY 2024-2025)
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
    alert_message
  ) VALUES
  -- Q1 FY 2024-2025 (Aug-Oct 2024)
  (
    v_clinic_id,
    '2024-08-01',
    '2024-10-31',
    82450.50,
    695,
    118.63,
    128.0,
    644.14,
    41.2,
    NULL,
    2.5,
    44.1,
    39.2,
    16.7,
    'stable',
    false,
    NULL
  ),
  -- Q2 FY 2024-2025 (Nov 2024-Jan 2025)
  (
    v_clinic_id,
    '2024-11-01',
    '2025-01-31',
    86125.75,
    720,
    119.62,
    134.5,
    640.42,
    42.1,
    4.5,
    3.2,
    42.8,
    41.0,
    16.2,
    'improving',
    false,
    NULL
  ),
  -- Q3 FY 2024-2025 (Feb-Apr 2025)
  (
    v_clinic_id,
    '2025-02-01',
    '2025-04-30',
    84920.33,
    705,
    120.45,
    131.25,
    647.01,
    42.8,
    -1.4,
    1.8,
    43.5,
    40.1,
    16.4,
    'stable',
    false,
    NULL
  ),
  -- Q4 FY 2024-2025 (May-Jul 2025)
  (
    v_clinic_id,
    '2025-05-01',
    '2025-07-31',
    83824.75,
    695,
    120.61,
    131.0,
    639.88,
    43.5,
    -1.3,
    0.9,
    42.7,
    41.2,
    16.1,
    'stable',
    false,
    NULL
  ),
  -- November 2025 (Latest month from banking statement)
  (
    v_clinic_id,
    '2025-11-01',
    '2025-11-28',
    31676.26,
    235,
    134.79,
    43.5,
    728.30,
    4.2,
    5.2,
    -2.1,
    15.8,
    62.1,
    22.1,
    'stable',
    true,
    'Low cash balance - monitor working capital'
  );

  RAISE NOTICE 'Successfully seeded financial metrics for clinic %', v_clinic_id;

END $$;