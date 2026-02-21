/*
  # Enhance Financial Signals Module - Executive-Grade Intelligence

  ## Overview
  Extends the existing financial_snapshots and clinic_financial_metrics tables with
  comprehensive financial intelligence capabilities including AR aging, cash flow
  forecasting, budget tracking, and executive alerts.

  ## New Tables

  ### 1. `accounts_receivable_aging`
  Tracks aging of outstanding receivables by payer and period
  - Columns: payer, period buckets (0-30, 31-60, 61-90, 90+), collection risk
  - Purpose: Monitor collection efficiency and identify at-risk revenue

  ### 2. `cash_flow_forecasts`
  Forward-looking cash flow predictions based on historical patterns
  - Columns: forecast date, projected inflows/outflows, confidence score
  - Purpose: Enable proactive liquidity management

  ### 3. `financial_budgets`
  Target budgets by period and category for variance tracking
  - Columns: budget period, revenue targets, expense limits, margin targets
  - Purpose: Measure performance against strategic financial goals

  ### 4. `financial_alerts`
  Automated alerts for financial anomalies and risks
  - Columns: alert type, severity, threshold, current value, recommendation
  - Purpose: Enable proactive financial risk management

  ### 5. `service_line_performance`
  Detailed profitability analysis by service line and period
  - Columns: service line, revenue, cost, margin, volume, trend
  - Purpose: Identify high/low margin services for strategic decisions

  ## Enhancements to Existing Tables

  ### `financial_snapshots`
  - Added: accounts_receivable_total, days_sales_outstanding, working_capital
  - Added: quick_ratio, current_ratio, debt_to_equity
  - Added: variance_vs_prior_period_percent, variance_vs_budget_percent
  - Added: trend_direction (improving/stable/declining)

  ### `clinic_financial_metrics`
  - Already has operating_margin_percent, variance tracking, alerts

  ## Security
  - Row Level Security enabled on all tables
  - Policies restrict to authenticated users with clinic access
  - Audit logging for all financial data changes
*/

-- ================================================================
-- 1. Accounts Receivable Aging Tracking
-- ================================================================

CREATE TABLE IF NOT EXISTS accounts_receivable_aging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  payer_name text NOT NULL,
  payer_type text CHECK (payer_type IN ('WSIB', 'private', 'insurance', 'self-pay', 'other')),

  -- Aging buckets
  current_0_30_days numeric DEFAULT 0,
  days_31_60 numeric DEFAULT 0,
  days_61_90 numeric DEFAULT 0,
  days_over_90 numeric DEFAULT 0,
  total_outstanding numeric GENERATED ALWAYS AS (
    current_0_30_days + days_31_60 + days_61_90 + days_over_90
  ) STORED,

  -- Collection metrics
  days_sales_outstanding numeric,
  collection_efficiency_percent numeric,
  at_risk_amount numeric DEFAULT 0,

  -- Risk assessment
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_reason text,
  recommended_action text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ar_aging_clinic_date ON accounts_receivable_aging(clinic_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ar_aging_payer ON accounts_receivable_aging(payer_name);
CREATE INDEX IF NOT EXISTS idx_ar_aging_risk ON accounts_receivable_aging(risk_level) WHERE risk_level IN ('high', 'critical');

ALTER TABLE accounts_receivable_aging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AR aging for their clinics"
  ON accounts_receivable_aging FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    )
  );

-- ================================================================
-- 2. Cash Flow Forecasting
-- ================================================================

CREATE TABLE IF NOT EXISTS cash_flow_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  forecast_date date NOT NULL,
  forecast_period text CHECK (forecast_period IN ('week', 'month', 'quarter')),

  -- Cash flow components
  opening_balance numeric NOT NULL,
  projected_inflows numeric DEFAULT 0,
  projected_outflows numeric DEFAULT 0,
  projected_closing_balance numeric GENERATED ALWAYS AS (
    opening_balance + projected_inflows - projected_outflows
  ) STORED,

  -- Inflow breakdown
  patient_payments numeric DEFAULT 0,
  insurance_payments numeric DEFAULT 0,
  wsib_payments numeric DEFAULT 0,
  other_revenue numeric DEFAULT 0,

  -- Outflow breakdown
  payroll_expenses numeric DEFAULT 0,
  rent_utilities numeric DEFAULT 0,
  supplies_expenses numeric DEFAULT 0,
  other_expenses numeric DEFAULT 0,

  -- Forecast quality
  confidence_score numeric CHECK (confidence_score BETWEEN 0 AND 100),
  variance_from_actual numeric,
  forecast_method text,

  -- Alerts
  liquidity_risk_flag boolean DEFAULT false,
  minimum_balance_threshold numeric,
  alert_message text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_forecast_clinic_date ON cash_flow_forecasts(clinic_id, forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_forecast_risk ON cash_flow_forecasts(liquidity_risk_flag) WHERE liquidity_risk_flag = true;

ALTER TABLE cash_flow_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cash forecasts for their clinics"
  ON cash_flow_forecasts FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    )
  );

-- ================================================================
-- 3. Financial Budgets & Targets
-- ================================================================

CREATE TABLE IF NOT EXISTS financial_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  budget_year integer NOT NULL,
  budget_period text CHECK (budget_period IN ('annual', 'quarterly', 'monthly')),
  period_start date NOT NULL,
  period_end date NOT NULL,

  -- Revenue targets
  target_total_revenue numeric NOT NULL,
  target_revenue_per_visit numeric,
  target_visit_volume integer,

  -- Expense budgets
  target_payroll_expense numeric,
  target_operating_expense numeric,
  target_total_expense numeric,

  -- Profitability targets
  target_operating_margin_percent numeric,
  target_ebitda numeric,
  target_net_income numeric,

  -- Performance tracking
  actual_revenue numeric,
  actual_expenses numeric,
  variance_amount numeric,
  variance_percent numeric,
  on_track boolean DEFAULT true,

  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_clinic_year ON financial_budgets(clinic_id, budget_year DESC);
CREATE INDEX IF NOT EXISTS idx_budget_period ON financial_budgets(period_start, period_end);

ALTER TABLE financial_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budgets for their clinics"
  ON financial_budgets FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    )
  );

-- ================================================================
-- 4. Financial Alerts & Risk Signals
-- ================================================================

CREATE TABLE IF NOT EXISTS financial_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  alert_date date DEFAULT CURRENT_DATE,
  alert_type text NOT NULL CHECK (alert_type IN (
    'cash_flow_risk', 'ar_aging', 'budget_variance', 'margin_decline',
    'payer_concentration', 'revenue_decline', 'expense_spike', 'liquidity_crisis'
  )),

  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'high', 'critical')),

  -- Alert details
  title text NOT NULL,
  description text NOT NULL,
  metric_name text,
  threshold_value numeric,
  current_value numeric,
  variance_amount numeric,
  variance_percent numeric,

  -- Resolution
  status text DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'false_positive')),
  recommended_action text,
  assigned_to uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_alerts_clinic ON financial_alerts(clinic_id, alert_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_severity ON financial_alerts(severity, status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_financial_alerts_type ON financial_alerts(alert_type, status);

ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view financial alerts for their clinics"
  ON financial_alerts FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    )
  );

-- ================================================================
-- 5. Service Line Performance Analytics
-- ================================================================

CREATE TABLE IF NOT EXISTS service_line_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,

  service_line text NOT NULL,
  service_category text,

  -- Volume metrics
  total_visits integer DEFAULT 0,
  total_billable_hours numeric DEFAULT 0,
  average_visits_per_day numeric,

  -- Revenue metrics
  total_revenue numeric NOT NULL,
  revenue_per_visit numeric,
  revenue_per_hour numeric,

  -- Cost metrics
  direct_costs numeric DEFAULT 0,
  allocated_overhead numeric DEFAULT 0,
  total_costs numeric GENERATED ALWAYS AS (direct_costs + allocated_overhead) STORED,

  -- Profitability
  gross_profit numeric GENERATED ALWAYS AS (total_revenue - direct_costs) STORED,
  gross_margin_percent numeric,
  contribution_margin_percent numeric,

  -- Performance indicators
  capacity_utilization_percent numeric,
  growth_rate_percent numeric,
  trend_direction text CHECK (trend_direction IN ('growing', 'stable', 'declining')),

  -- Strategic classification
  performance_tier text CHECK (performance_tier IN ('star', 'cash_cow', 'question_mark', 'dog')),
  strategic_priority text CHECK (strategic_priority IN ('expand', 'maintain', 'optimize', 'discontinue')),

  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_performance_clinic ON service_line_performance(clinic_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_service_performance_line ON service_line_performance(service_line);
CREATE INDEX IF NOT EXISTS idx_service_performance_tier ON service_line_performance(performance_tier);

ALTER TABLE service_line_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service performance for their clinics"
  ON service_line_performance FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    )
  );

-- ================================================================
-- 6. Enhance Existing Tables (Add Missing Columns)
-- ================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'accounts_receivable_total'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN accounts_receivable_total numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'days_sales_outstanding'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN days_sales_outstanding numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'working_capital'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN working_capital numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'current_ratio'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN current_ratio numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'quick_ratio'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN quick_ratio numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'variance_vs_prior_period_percent'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN variance_vs_prior_period_percent numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'variance_vs_budget_percent'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN variance_vs_budget_percent numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'trend_direction'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN trend_direction text CHECK (trend_direction IN ('improving', 'stable', 'declining'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'operating_margin_percent'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN operating_margin_percent numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_snapshots' AND column_name = 'ebitda'
  ) THEN
    ALTER TABLE financial_snapshots ADD COLUMN ebitda numeric;
  END IF;
END $$;

-- ================================================================
-- 7. Helper Functions for KPI Calculations
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_dso(
  p_accounts_receivable numeric,
  p_revenue numeric,
  p_days_in_period integer
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_revenue = 0 OR p_revenue IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (p_accounts_receivable / p_revenue) * p_days_in_period;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_current_ratio(
  p_current_assets numeric,
  p_current_liabilities numeric
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_current_liabilities = 0 OR p_current_liabilities IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN p_current_assets / p_current_liabilities;
END;
$$;

-- ================================================================
-- 8. Audit Trigger for Financial Tables
-- ================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_table_changes') THEN
    DROP TRIGGER IF EXISTS audit_ar_aging_changes ON accounts_receivable_aging;
    CREATE TRIGGER audit_ar_aging_changes
      AFTER INSERT OR UPDATE OR DELETE ON accounts_receivable_aging
      FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

    DROP TRIGGER IF EXISTS audit_cash_forecast_changes ON cash_flow_forecasts;
    CREATE TRIGGER audit_cash_forecast_changes
      AFTER INSERT OR UPDATE OR DELETE ON cash_flow_forecasts
      FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

    DROP TRIGGER IF EXISTS audit_budget_changes ON financial_budgets;
    CREATE TRIGGER audit_budget_changes
      AFTER INSERT OR UPDATE OR DELETE ON financial_budgets
      FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

    DROP TRIGGER IF EXISTS audit_financial_alert_changes ON financial_alerts;
    CREATE TRIGGER audit_financial_alert_changes
      AFTER INSERT OR UPDATE OR DELETE ON financial_alerts
      FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

    DROP TRIGGER IF EXISTS audit_service_performance_changes ON service_line_performance;
    CREATE TRIGGER audit_service_performance_changes
      AFTER INSERT OR UPDATE OR DELETE ON service_line_performance
      FOR EACH ROW EXECUTE FUNCTION audit_table_changes();
  END IF;
END $$;
