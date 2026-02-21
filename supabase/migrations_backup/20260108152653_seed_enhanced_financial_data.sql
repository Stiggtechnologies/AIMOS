/*
  # Seed Enhanced Financial Data

  ## Purpose
  Populate comprehensive financial intelligence data for demo and testing

  ## Data Seeded

  1. **AR Aging Data** - Outstanding receivables by payer with aging buckets
  2. **Cash Flow Forecasts** - 3-month forward cash projections
  3. **Financial Budgets** - Annual and quarterly targets for 2025-2026
  4. **Financial Alerts** - Active risk signals requiring attention
  5. **Service Line Performance** - Profitability analysis by service category

  ## Notes
  - All data is based on AIM's actual financial reports (Aug 2024 - Nov 2025)
  - Uses realistic aging patterns typical of Canadian healthcare clinics
  - Alert thresholds calibrated for healthcare industry standards
*/

DO $$
DECLARE
  v_clinic_id uuid;
BEGIN
  -- Get the first clinic
  SELECT id INTO v_clinic_id FROM clinics ORDER BY created_at LIMIT 1;

  IF v_clinic_id IS NULL THEN
    RAISE EXCEPTION 'No clinic found in database';
  END IF;

  -- ================================================================
  -- 1. Seed AR Aging Data
  -- ================================================================
  
  DELETE FROM accounts_receivable_aging WHERE clinic_id = v_clinic_id;

  INSERT INTO accounts_receivable_aging (
    clinic_id, snapshot_date, payer_name, payer_type,
    current_0_30_days, days_31_60, days_61_90, days_over_90,
    days_sales_outstanding, collection_efficiency_percent,
    at_risk_amount, risk_level, risk_reason, recommended_action
  ) VALUES
  -- WSIB (largest payer - 43% of revenue)
  (v_clinic_id, '2025-12-01', 'WSIB Alberta', 'WSIB',
   45230, 12400, 8100, 3200, 42, 91.5, 3200, 'medium',
   'Some aging past 90 days - typical for WSIB', 
   'Follow up on claims over 90 days'),
  
  -- Private insurance companies
  (v_clinic_id, '2025-12-01', 'Manulife', 'insurance',
   18200, 5600, 2100, 800, 38, 94.2, 800, 'low',
   'Normal aging pattern', 
   'Continue routine follow-up'),
  
  (v_clinic_id, '2025-12-01', 'Sun Life', 'insurance',
   15800, 4200, 1900, 450, 35, 95.1, 450, 'low',
   'Excellent collection rate', 
   'Maintain current process'),
  
  (v_clinic_id, '2025-12-01', 'Great West Life', 'insurance',
   12300, 3800, 1200, 200, 33, 96.3, 200, 'low',
   'Strong payer performance', NULL),
  
  -- Direct patient pay
  (v_clinic_id, '2025-12-01', 'Patient Self-Pay', 'self-pay',
   8900, 4100, 3200, 5100, 58, 76.4, 8300, 'high',
   'High aging and collection risk - typical for self-pay',
   'Consider payment plans or collections agency for 90+ days'),
  
  -- Motor vehicle insurance
  (v_clinic_id, '2025-12-01', 'Various MVA Insurers', 'insurance',
   6200, 2800, 1900, 1400, 48, 88.2, 3300, 'medium',
   'MVA claims often have delays',
   'Escalate claims approaching 90 days'),
  
  -- Other payers
  (v_clinic_id, '2025-12-01', 'Other Insurance', 'other',
   4100, 1200, 800, 600, 41, 89.5, 1400, 'medium',
   'Mixed payer performance', NULL);

  -- ================================================================
  -- 2. Seed Cash Flow Forecasts
  -- ================================================================
  
  DELETE FROM cash_flow_forecasts WHERE clinic_id = v_clinic_id;

  -- December 2025 forecast
  INSERT INTO cash_flow_forecasts (
    clinic_id, forecast_date, forecast_period,
    opening_balance, projected_inflows, projected_outflows,
    patient_payments, insurance_payments, wsib_payments, other_revenue,
    payroll_expenses, rent_utilities, supplies_expenses, other_expenses,
    confidence_score, forecast_method,
    liquidity_risk_flag, minimum_balance_threshold, alert_message
  ) VALUES
  (v_clinic_id, '2025-12-31', 'month',
   9062, 34200, 31800,
   8500, 14200, 10100, 1400,
   18500, 4200, 3800, 5300,
   85, 'Historical average with seasonal adjustment',
   false, 5000, NULL),
  
  -- January 2026 forecast
  (v_clinic_id, '2026-01-31', 'month',
   11462, 36800, 33200,
   9200, 15800, 10500, 1300,
   19200, 4200, 4100, 5700,
   82, 'Historical trend + 8% growth factor',
   false, 5000, NULL),
  
  -- February 2026 forecast
  (v_clinic_id, '2026-02-28', 'month',
   15062, 35400, 32800,
   8900, 15200, 10000, 1300,
   19000, 4200, 3900, 5700,
   78, 'Seasonal patterns from prior years',
   false, 5000, NULL),
  
  -- Q1 2026 forecast
  (v_clinic_id, '2026-03-31', 'quarter',
   9062, 106400, 97800,
   26600, 45200, 30600, 4000,
   56700, 12600, 11800, 16700,
   75, 'Quarterly projection with confidence interval',
   false, 5000, 'Monitor actual vs forecast monthly');

  -- ================================================================
  -- 3. Seed Financial Budgets
  -- ================================================================
  
  DELETE FROM financial_budgets WHERE clinic_id = v_clinic_id;

  INSERT INTO financial_budgets (
    clinic_id, budget_year, budget_period, period_start, period_end,
    target_total_revenue, target_revenue_per_visit, target_visit_volume,
    target_payroll_expense, target_operating_expense, target_total_expense,
    target_operating_margin_percent, target_ebitda, target_net_income,
    actual_revenue, actual_expenses, variance_amount, variance_percent, on_track
  ) VALUES
  -- FY 2025 Annual (actual completed)
  (v_clinic_id, 2025, 'annual', '2025-01-01', '2025-12-31',
   380000, 125, 3040,
   220000, 145000, 365000,
   4.0, 15000, 12000,
   337321, 342000, -4679, -1.2, false),
  
  -- FY 2026 Annual (target)
  (v_clinic_id, 2026, 'annual', '2026-01-01', '2026-12-31',
   420000, 130, 3230,
   240000, 160000, 400000,
   4.8, 20000, 16000,
   NULL, NULL, NULL, NULL, true),
  
  -- Q1 2026
  (v_clinic_id, 2026, 'quarterly', '2026-01-01', '2026-03-31',
   105000, 130, 808,
   60000, 40000, 100000,
   4.8, 5000, 4000,
   NULL, NULL, NULL, NULL, true),
  
  -- Q2 2026
  (v_clinic_id, 2026, 'quarterly', '2026-04-01', '2026-06-30',
   105000, 130, 808,
   60000, 40000, 100000,
   4.8, 5000, 4000,
   NULL, NULL, NULL, NULL, true),
  
  -- December 2025 (month - actual)
  (v_clinic_id, 2025, 'monthly', '2025-12-01', '2025-12-31',
   32000, 128, 250,
   18500, 13000, 31500,
   1.6, 500, 400,
   31676, 30200, 1476, 4.6, true);

  -- ================================================================
  -- 4. Seed Financial Alerts
  -- ================================================================
  
  DELETE FROM financial_alerts WHERE clinic_id = v_clinic_id;

  INSERT INTO financial_alerts (
    clinic_id, alert_date, alert_type, severity,
    title, description, metric_name,
    threshold_value, current_value, variance_amount, variance_percent,
    status, recommended_action
  ) VALUES
  -- Critical alert - AR aging
  (v_clinic_id, '2025-12-01', 'ar_aging', 'high',
   'High Self-Pay AR Aging',
   'Self-pay accounts receivable has $8,300 over 60 days old, representing 39% of total self-pay AR. Collection efficiency is 76.4%, below the 85% target.',
   'self_pay_ar_over_60',
   3500, 8300, 4800, 137,
   'open',
   'Implement payment plans for large balances. Consider collections agency for accounts over 120 days.'),
  
  -- Warning - cash flow
  (v_clinic_id, '2025-12-01', 'cash_flow_risk', 'warning',
   'Low Cash Balance',
   'Current cash balance of $9,062 is below the recommended minimum of $15,000 (30 days operating expenses). While positive cash flow is projected, buffer is thin.',
   'cash_balance',
   15000, 9062, -5938, -40,
   'acknowledged',
   'Review payment terms with major payers. Consider line of credit for working capital buffer.'),
  
  -- Info - budget performance
  (v_clinic_id, '2025-12-01', 'budget_variance', 'info',
   'FY 2025 Below Revenue Target',
   'Annual revenue is tracking at $337K vs $380K budget target, a shortfall of $43K (11.3%). However, Q4 performance has been strong with December exceeding monthly target.',
   'annual_revenue',
   380000, 337321, -42679, -11.3,
   'open',
   'Analyze Q4 improvements and replicate successful strategies in 2026. Update 2026 budget to realistic baseline.'),
  
  -- Warning - payer concentration
  (v_clinic_id, '2025-12-01', 'payer_concentration', 'warning',
   'WSIB Revenue Concentration',
   'WSIB represents 43% of total revenue, creating concentration risk. Loss of WSIB contract or reimbursement rate changes would significantly impact cash flow.',
   'wsib_revenue_percent',
   35, 43, 8, 23,
   'open',
   'Diversify revenue streams. Expand private insurance and direct-pay services. Monitor WSIB contract renewal terms.'),
  
  -- High - service line margin
  (v_clinic_id, '2025-12-01', 'margin_decline', 'high',
   'Negative Margin on Acupuncture',
   'Acupuncture service line is operating at a -5% margin due to low utilization (18% capacity) and high practitioner costs. Losing $150/month.',
   'acupuncture_margin_percent',
   0, -5, -5, NULL,
   'open',
   'Options: 1) Increase marketing/referrals to boost volume, 2) Reduce practitioner hours, 3) Consider discontinuing service.');

  -- ================================================================
  -- 5. Seed Service Line Performance
  -- ================================================================
  
  DELETE FROM service_line_performance WHERE clinic_id = v_clinic_id;

  INSERT INTO service_line_performance (
    clinic_id, period_start, period_end, service_line, service_category,
    total_visits, total_billable_hours, average_visits_per_day,
    total_revenue, revenue_per_visit, revenue_per_hour,
    direct_costs, allocated_overhead,
    gross_margin_percent, contribution_margin_percent,
    capacity_utilization_percent, growth_rate_percent, trend_direction,
    performance_tier, strategic_priority, notes
  ) VALUES
  -- Physical Therapy (largest service)
  (v_clinic_id, '2024-08-01', '2025-07-31', 'Physical Therapy', 'Rehabilitation',
   1679, 420, 6.2,
   200225, 119.25, 476.73,
   110000, 45000,
   47.8, 45.0,
   82, 5.2, 'growing',
   'star', 'expand', 
   'Core service with strong margins and growth. Primary revenue driver.'),
  
  -- Massage Therapy
  (v_clinic_id, '2024-08-01', '2025-07-31', 'Massage Therapy', 'Wellness',
   425, 319, 1.6,
   41021, 96.52, 128.59,
   22000, 9500,
   43.5, 23.1,
   75, 2.1, 'stable',
   'cash_cow', 'maintain',
   'Steady performer with acceptable margins. Referral source for PT.'),
  
  -- MOT (Motor Vehicle Assessments)
  (v_clinic_id, '2024-08-01', '2025-07-31', 'MOT Assessments', 'Assessment',
   270, 135, 1.0,
   36705, 135.94, 271.89,
   14000, 8200,
   55.8, 39.7,
   45, -8.3, 'declining',
   'question_mark', 'optimize',
   'High margin but declining volume. MVA referrals down. Market opportunity exists.'),
  
  -- Shockwave Therapy
  (v_clinic_id, '2024-08-01', '2025-07-31', 'Shockwave Therapy', 'Advanced Treatment',
   131, 65.5, 0.5,
   24940, 190.38, 380.76,
   8500, 4200,
   61.9, 49.2,
   38, 12.4, 'growing',
   'star', 'expand',
   'High margin specialty service. Growing demand. Consider equipment expansion.'),
  
  -- Kinesiology
  (v_clinic_id, '2024-08-01', '2025-07-31', 'Kinesiology', 'Rehabilitation',
   186, 93, 0.7,
   15810, 85.00, 170.00,
   9200, 3800,
   39.3, 17.8,
   65, -3.2, 'stable',
   'cash_cow', 'maintain',
   'Lower revenue per visit but steady volume. Good for patient progression.'),
  
  -- Acupuncture (problem service)
  (v_clinic_id, '2024-08-01', '2025-07-31', 'Acupuncture', 'Alternative Medicine',
   48, 48, 0.2,
   3840, 80.00, 80.00,
   3200, 1500,
   -5.2, -22.4,
   18, -15.8, 'declining',
   'dog', 'discontinue',
   'Negative margin, low utilization. Practitioner costs exceed revenue. Review viability.'),
  
  -- Occupational Therapy
  (v_clinic_id, '2024-08-01', '2025-07-31', 'Occupational Therapy', 'Rehabilitation',
   76, 114, 0.3,
   14780, 194.47, 129.65,
   7800, 3100,
   44.2, 26.1,
   52, 8.9, 'growing',
   'question_mark', 'expand',
   'Growing niche with good margins. Opportunity in workplace injury rehab.');

  RAISE NOTICE 'Successfully seeded enhanced financial data for clinic %', v_clinic_id;

END $$;
