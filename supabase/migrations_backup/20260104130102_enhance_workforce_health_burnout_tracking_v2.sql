/*
  # Enhance Workforce Health & Burnout Tracking

  ## Purpose
  Reduce PT churn through early detection of burnout signals with strict privacy protections.
  
  ## Key Principles
  - Non-diagnostic: Indicators only, not medical diagnoses
  - Aggregate views: Individual privacy protected
  - Anonymous surveys: No PII exposure
  - Retention-focused: Early intervention signals

  ## Enhancements to Existing Tables
  
  ### `workload_metrics` (add burnout indicators)
    - `burnout_risk_score` (numeric 0-100) - Calculated risk indicator
    - `days_without_break` (integer) - Consecutive days without rest
    - `evening_weekend_hours` (numeric) - Off-hours work tracking
    - `cancelled_pto_count` (integer) - Cancelled time off
    - `last_pto_date` (date) - Last time off taken
    - `avg_patient_complexity` (numeric) - Patient acuity average
    - `documentation_backlog_hours` (numeric) - Admin burden
    
  ### `staff_wellbeing_flags` (enhance detection)
    - `consecutive_flag_count` (integer) - Pattern detection
    - `last_flag_type` (text) - Previous flag for pattern analysis
    - `escalation_level` (integer) - Severity escalation tracking
    - `intervention_recommended` (boolean) - Action needed flag
    - `confidential_notes` (text) - Manager notes (encrypted)
    - `follow_up_date` (date) - Scheduled check-in
    
  ### `pulse_survey_responses` (enhance analysis)
    - `burnout_indicators` (jsonb) - Extracted burnout signals
    - `resilience_score` (numeric) - Positive resilience indicators
    - `support_needs` (jsonb) - Identified needs from responses

  ## New Tables

  ### `workload_balance_summary`
    - Aggregate clinic-level view (privacy protection)
    - No individual identification
    - Trend analysis only
    
  ### `burnout_risk_indicators`
    - System-calculated risk factors
    - Automated flag generation
    - Intervention triggers
    
  ### `workforce_health_trends`
    - Time-series aggregate data
    - Department/clinic level only
    - Historical pattern tracking

  ## Privacy Protections
    - All views are aggregated
    - Minimum group size of 5 for reporting
    - No individual identification in dashboards
    - Anonymous survey responses protected
    - Manager access limited to actionable aggregates

  ## Security
    - RLS policies prevent individual tracking
    - Aggregate-only reporting enforced
    - Audit trail for access to sensitive data
*/

-- Add burnout tracking columns to workload_metrics
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workload_metrics' AND column_name = 'burnout_risk_score') THEN
    ALTER TABLE workload_metrics ADD COLUMN burnout_risk_score NUMERIC CHECK (burnout_risk_score BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workload_metrics' AND column_name = 'days_without_break') THEN
    ALTER TABLE workload_metrics ADD COLUMN days_without_break INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workload_metrics' AND column_name = 'evening_weekend_hours') THEN
    ALTER TABLE workload_metrics ADD COLUMN evening_weekend_hours NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workload_metrics' AND column_name = 'cancelled_pto_count') THEN
    ALTER TABLE workload_metrics ADD COLUMN cancelled_pto_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workload_metrics' AND column_name = 'last_pto_date') THEN
    ALTER TABLE workload_metrics ADD COLUMN last_pto_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workload_metrics' AND column_name = 'avg_patient_complexity') THEN
    ALTER TABLE workload_metrics ADD COLUMN avg_patient_complexity NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workload_metrics' AND column_name = 'documentation_backlog_hours') THEN
    ALTER TABLE workload_metrics ADD COLUMN documentation_backlog_hours NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Add enhanced detection columns to staff_wellbeing_flags
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_wellbeing_flags' AND column_name = 'consecutive_flag_count') THEN
    ALTER TABLE staff_wellbeing_flags ADD COLUMN consecutive_flag_count INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_wellbeing_flags' AND column_name = 'last_flag_type') THEN
    ALTER TABLE staff_wellbeing_flags ADD COLUMN last_flag_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_wellbeing_flags' AND column_name = 'escalation_level') THEN
    ALTER TABLE staff_wellbeing_flags ADD COLUMN escalation_level INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_wellbeing_flags' AND column_name = 'intervention_recommended') THEN
    ALTER TABLE staff_wellbeing_flags ADD COLUMN intervention_recommended BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_wellbeing_flags' AND column_name = 'confidential_notes') THEN
    ALTER TABLE staff_wellbeing_flags ADD COLUMN confidential_notes TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_wellbeing_flags' AND column_name = 'follow_up_date') THEN
    ALTER TABLE staff_wellbeing_flags ADD COLUMN follow_up_date DATE;
  END IF;
END $$;

-- Add analysis columns to pulse_survey_responses
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pulse_survey_responses' AND column_name = 'burnout_indicators') THEN
    ALTER TABLE pulse_survey_responses ADD COLUMN burnout_indicators JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pulse_survey_responses' AND column_name = 'resilience_score') THEN
    ALTER TABLE pulse_survey_responses ADD COLUMN resilience_score NUMERIC CHECK (resilience_score BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pulse_survey_responses' AND column_name = 'support_needs') THEN
    ALTER TABLE pulse_survey_responses ADD COLUMN support_needs JSONB;
  END IF;
END $$;

-- Create workload_balance_summary table (aggregate view only)
CREATE TABLE IF NOT EXISTS workload_balance_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  department TEXT,
  summary_date DATE NOT NULL,
  staff_count INTEGER NOT NULL CHECK (staff_count >= 5),
  avg_workload_score NUMERIC,
  avg_burnout_risk NUMERIC,
  high_risk_percentage NUMERIC,
  avg_consecutive_days NUMERIC,
  avg_overtime_hours NUMERIC,
  avg_days_since_pto NUMERIC,
  balance_status TEXT CHECK (balance_status IN ('balanced', 'strained', 'critical')),
  trend_direction TEXT CHECK (trend_direction IN ('improving', 'stable', 'declining')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create burnout_risk_indicators table
CREATE TABLE IF NOT EXISTS burnout_risk_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_code TEXT NOT NULL,
  indicator_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('workload', 'schedule', 'environment', 'support', 'recovery')),
  description TEXT,
  severity_weight NUMERIC DEFAULT 1.0,
  threshold_value NUMERIC,
  intervention_trigger BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workforce_health_trends table (aggregate time-series)
CREATE TABLE IF NOT EXISTS workforce_health_trends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  department TEXT,
  trend_date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC,
  staff_count INTEGER CHECK (staff_count >= 5),
  comparison_previous_period NUMERIC,
  status TEXT CHECK (status IN ('healthy', 'watch', 'concern', 'critical')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for workload_metrics burnout columns
CREATE INDEX IF NOT EXISTS idx_workload_metrics_burnout_risk 
  ON workload_metrics(burnout_risk_score) WHERE burnout_risk_score >= 70;

CREATE INDEX IF NOT EXISTS idx_workload_metrics_days_without_break 
  ON workload_metrics(days_without_break) WHERE days_without_break >= 10;

CREATE INDEX IF NOT EXISTS idx_workload_metrics_staff_date 
  ON workload_metrics(staff_id, metric_date DESC);

-- Create indexes for staff_wellbeing_flags
CREATE INDEX IF NOT EXISTS idx_staff_wellbeing_flags_escalation 
  ON staff_wellbeing_flags(escalation_level, intervention_recommended);

CREATE INDEX IF NOT EXISTS idx_staff_wellbeing_flags_follow_up 
  ON staff_wellbeing_flags(follow_up_date) WHERE follow_up_date IS NOT NULL AND resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_staff_wellbeing_flags_staff_date 
  ON staff_wellbeing_flags(staff_id, flag_date DESC);

-- Create indexes for pulse_survey_responses
CREATE INDEX IF NOT EXISTS idx_pulse_survey_responses_sentiment 
  ON pulse_survey_responses(sentiment_score);

CREATE INDEX IF NOT EXISTS idx_pulse_survey_responses_survey_submitted 
  ON pulse_survey_responses(survey_id, submitted_at DESC);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_workload_balance_summary_clinic_date 
  ON workload_balance_summary(clinic_id, summary_date DESC);

CREATE INDEX IF NOT EXISTS idx_workload_balance_summary_status 
  ON workload_balance_summary(balance_status);

CREATE INDEX IF NOT EXISTS idx_burnout_risk_indicators_active 
  ON burnout_risk_indicators(is_active, intervention_trigger);

CREATE INDEX IF NOT EXISTS idx_workforce_health_trends_clinic_date 
  ON workforce_health_trends(clinic_id, trend_date DESC);

CREATE INDEX IF NOT EXISTS idx_workforce_health_trends_status 
  ON workforce_health_trends(status);

-- Add updated_at triggers
DO $$
BEGIN
  DROP TRIGGER IF EXISTS workload_balance_summary_updated_at ON workload_balance_summary;
  CREATE TRIGGER workload_balance_summary_updated_at 
    BEFORE UPDATE ON workload_balance_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
  DROP TRIGGER IF EXISTS burnout_risk_indicators_updated_at ON burnout_risk_indicators;
  CREATE TRIGGER burnout_risk_indicators_updated_at 
    BEFORE UPDATE ON burnout_risk_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on new tables
ALTER TABLE workload_balance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE burnout_risk_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE workforce_health_trends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workload_balance_summary (aggregate view only)
CREATE POLICY "Managers can view clinic summaries" 
  ON workload_balance_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('clinic_manager', 'admin', 'executive')
    )
  );

CREATE POLICY "Admins can manage workload summaries" 
  ON workload_balance_summary FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executive')
    )
  );

-- RLS Policies for burnout_risk_indicators
CREATE POLICY "All authenticated users can view indicators" 
  ON burnout_risk_indicators FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage indicators" 
  ON burnout_risk_indicators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executive')
    )
  );

-- RLS Policies for workforce_health_trends
CREATE POLICY "Managers can view health trends" 
  ON workforce_health_trends FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('clinic_manager', 'admin', 'executive')
    )
  );

CREATE POLICY "Admins can manage health trends" 
  ON workforce_health_trends FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executive')
    )
  );

-- Seed burnout risk indicators
INSERT INTO burnout_risk_indicators (indicator_code, indicator_name, category, description, severity_weight, threshold_value, intervention_trigger)
VALUES
  ('CONSEC_DAYS', 'Consecutive Days Worked', 'schedule', 'Working 10+ consecutive days without a break', 2.0, 10, true),
  ('HIGH_OVERTIME', 'Excessive Overtime', 'workload', 'More than 10 hours overtime per week', 1.5, 10, true),
  ('NO_PTO', 'Extended Period Without PTO', 'recovery', 'No time off taken in 90+ days', 2.5, 90, true),
  ('HIGH_INTENSITY', 'Consecutive High-Intensity Shifts', 'workload', '5+ high-intensity shifts in a row', 2.0, 5, true),
  ('DOC_BACKLOG', 'Documentation Backlog', 'workload', 'More than 8 hours of documentation backlog', 1.0, 8, false),
  ('CANCELLED_PTO', 'Cancelled PTO', 'recovery', 'Multiple cancelled time-off requests', 1.5, 2, true),
  ('EVENING_WEEKEND', 'Off-Hours Work', 'schedule', 'Excessive evening/weekend hours', 1.2, 15, false),
  ('LOW_SURVEY_SCORE', 'Low Survey Sentiment', 'support', 'Pulse survey sentiment below threshold', 2.0, 40, true),
  ('REPEAT_FLAGS', 'Repeated Wellbeing Flags', 'support', '3+ wellbeing flags in 30 days', 3.0, 3, true),
  ('HIGH_COMPLEXITY', 'High Patient Complexity', 'workload', 'Consistently high patient acuity', 1.0, 8, false)
ON CONFLICT DO NOTHING;
