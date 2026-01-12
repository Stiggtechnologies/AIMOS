/*
  # 90-Day Partner Clinic Launch Plan

  1. New Tables
    - launch_weeks - Weekly breakdown within phases
    - launch_daily_metrics - Day-by-day progress tracking
    - launch_deliverables - Week-end deliverables
    - launch_target_metrics - Expected metric thresholds by week

  2. Purpose
    - Track 90-day operational stand-up for partner clinics
    - Weekly objectives and key actions
    - Daily metrics against targets
    - Phase-gate validation with hard metrics

  3. Security
    - RLS enabled on all tables
    - Clinic launch team access only
*/

-- Launch weeks table (weekly breakdown within phases)
CREATE TABLE IF NOT EXISTS launch_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES launch_phases(id) ON DELETE CASCADE,
  
  week_number integer NOT NULL CHECK (week_number BETWEEN 0 AND 12),
  week_label text NOT NULL,
  start_day integer NOT NULL,
  end_day integer NOT NULL,
  
  week_objective text NOT NULL,
  key_actions text[] DEFAULT '{}',
  
  status phase_status DEFAULT 'not_started',
  completion_pct numeric(5, 2) DEFAULT 0,
  
  actual_start_date date,
  actual_end_date date,
  
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(clinic_launch_id, week_number)
);

-- Launch deliverables (tied to weeks)
CREATE TABLE IF NOT EXISTS launch_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  week_id uuid REFERENCES launch_weeks(id) ON DELETE CASCADE,
  
  deliverable_name text NOT NULL,
  deliverable_description text,
  is_critical boolean DEFAULT true,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'not_applicable')),
  
  due_day integer,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  
  evidence_url text,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily metrics tracking
CREATE TABLE IF NOT EXISTS launch_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  partner_clinic_id uuid REFERENCES partner_clinics(id),
  
  metric_date date NOT NULL,
  day_number integer NOT NULL,
  
  -- Volume metrics
  patients_treated_today integer DEFAULT 0,
  cumulative_patients integer DEFAULT 0,
  new_conversions_today integer DEFAULT 0,
  
  -- Operational metrics
  clinician_utilization_pct numeric(5, 2),
  data_completeness_pct numeric(5, 2),
  avg_intake_to_first_visit_days numeric(5, 2),
  
  -- Quality metrics
  episode_of_care_compliance_pct numeric(5, 2),
  source_attribution_pct numeric(5, 2),
  
  -- Financial (partner clinics only)
  revenue_today numeric(10, 2),
  cumulative_revenue numeric(10, 2),
  revenue_per_patient numeric(8, 2),
  
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(clinic_launch_id, metric_date)
);

-- Target metrics (what we expect by each week)
CREATE TABLE IF NOT EXISTS launch_target_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  week_id uuid REFERENCES launch_weeks(id) ON DELETE CASCADE,
  
  metric_name text NOT NULL,
  target_value numeric(12, 2) NOT NULL,
  target_operator text DEFAULT '>=' CHECK (target_operator IN ('>=', '<=', '=', '>', '<')),
  unit text,
  
  is_critical boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(week_id, metric_name)
);

-- Add partner-specific flags to clinic_launches
ALTER TABLE clinic_launches 
ADD COLUMN IF NOT EXISTS is_partner_clinic boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS launch_plan_type text DEFAULT 'standard' CHECK (launch_plan_type IN ('standard', 'partner_90day', 'acquisition_integration', 'greenfield'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_launch_weeks_clinic ON launch_weeks(clinic_launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_weeks_phase ON launch_weeks(phase_id);
CREATE INDEX IF NOT EXISTS idx_launch_weeks_number ON launch_weeks(week_number);

CREATE INDEX IF NOT EXISTS idx_launch_deliverables_clinic ON launch_deliverables(clinic_launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_deliverables_week ON launch_deliverables(week_id);
CREATE INDEX IF NOT EXISTS idx_launch_deliverables_status ON launch_deliverables(status);

CREATE INDEX IF NOT EXISTS idx_launch_daily_metrics_clinic ON launch_daily_metrics(clinic_launch_id);
CREATE INDEX IF NOT EXISTS idx_launch_daily_metrics_date ON launch_daily_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_launch_daily_metrics_partner ON launch_daily_metrics(partner_clinic_id);

CREATE INDEX IF NOT EXISTS idx_launch_target_metrics_week ON launch_target_metrics(week_id);

-- Enable RLS
ALTER TABLE launch_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_target_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Launch team can view weeks"
  ON launch_weeks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Launch team can manage weeks"
  ON launch_weeks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Launch team can view deliverables"
  ON launch_deliverables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Launch team can manage deliverables"
  ON launch_deliverables FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Launch team can view daily metrics"
  ON launch_daily_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Admins can manage daily metrics"
  ON launch_daily_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Launch team can view target metrics"
  ON launch_target_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Admins can manage target metrics"
  ON launch_target_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- Function to calculate week completion based on deliverables
CREATE OR REPLACE FUNCTION calculate_week_completion(p_week_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_deliverables integer;
  v_completed_deliverables integer;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_deliverables, v_completed_deliverables
  FROM launch_deliverables
  WHERE week_id = p_week_id
  AND status != 'not_applicable';
  
  IF v_total_deliverables = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((v_completed_deliverables::numeric / v_total_deliverables::numeric) * 100, 2);
END;
$$;

-- Function to get current launch day number
CREATE OR REPLACE FUNCTION get_launch_day_number(p_clinic_launch_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date date;
  v_current_day integer;
BEGIN
  SELECT actual_start_date INTO v_start_date
  FROM clinic_launches
  WHERE id = p_clinic_launch_id;
  
  IF v_start_date IS NULL THEN
    RETURN 0;
  END IF;
  
  v_current_day := CURRENT_DATE - v_start_date + 1;
  
  RETURN GREATEST(0, v_current_day);
END;
$$;

-- Function to get launch status summary
CREATE OR REPLACE FUNCTION get_launch_status_summary(p_clinic_launch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_current_day integer;
  v_current_week integer;
  v_total_weeks integer;
  v_completed_weeks integer;
  v_total_deliverables integer;
  v_completed_deliverables integer;
  v_blocked_deliverables integer;
  v_latest_metrics record;
BEGIN
  -- Get current day
  SELECT get_launch_day_number(p_clinic_launch_id) INTO v_current_day;
  
  -- Calculate current week (0-indexed)
  v_current_week := LEAST(FLOOR(v_current_day / 7), 12);
  
  -- Get week stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_total_weeks, v_completed_weeks
  FROM launch_weeks
  WHERE clinic_launch_id = p_clinic_launch_id;
  
  -- Get deliverable stats
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'blocked')
  INTO v_total_deliverables, v_completed_deliverables, v_blocked_deliverables
  FROM launch_deliverables
  WHERE clinic_launch_id = p_clinic_launch_id;
  
  -- Get latest metrics
  SELECT * INTO v_latest_metrics
  FROM launch_daily_metrics
  WHERE clinic_launch_id = p_clinic_launch_id
  ORDER BY metric_date DESC
  LIMIT 1;
  
  v_result := jsonb_build_object(
    'current_day', v_current_day,
    'current_week', v_current_week,
    'total_weeks', v_total_weeks,
    'completed_weeks', v_completed_weeks,
    'total_deliverables', v_total_deliverables,
    'completed_deliverables', v_completed_deliverables,
    'blocked_deliverables', v_blocked_deliverables,
    'latest_metrics', row_to_json(v_latest_metrics)
  );
  
  RETURN v_result;
END;
$$;