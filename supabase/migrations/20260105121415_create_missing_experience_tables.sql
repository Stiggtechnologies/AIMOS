/*
  # Create Missing Experience & Reputation Tables

  ## Purpose
  Create only the missing tables for experience and reputation intelligence.

  ## Security
  - RLS enabled on all tables
  - Executives and clinic managers only
*/

-- Satisfaction Signals Table
CREATE TABLE IF NOT EXISTS satisfaction_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  service_line_id uuid,
  period_start date NOT NULL,
  period_end date NOT NULL,
  responses_collected integer DEFAULT 0,
  average_overall_score numeric DEFAULT 0,
  nps_score integer DEFAULT 0,
  promoters_count integer DEFAULT 0,
  passives_count integer DEFAULT 0,
  detractors_count integer DEFAULT 0,
  would_recommend_percentage numeric DEFAULT 0,
  ease_of_booking_score numeric DEFAULT 0,
  staff_friendliness_score numeric DEFAULT 0,
  facility_cleanliness_score numeric DEFAULT 0,
  wait_time_satisfaction_score numeric DEFAULT 0,
  treatment_effectiveness_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_satisfaction_signals_clinic ON satisfaction_signals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_signals_service ON satisfaction_signals(service_line_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_signals_period ON satisfaction_signals(period_start, period_end);

-- Reputation Monitoring Table
CREATE TABLE IF NOT EXISTS reputation_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  platform text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  average_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  new_reviews_count integer DEFAULT 0,
  positive_reviews_count integer DEFAULT 0,
  negative_reviews_count integer DEFAULT 0,
  response_rate_percentage numeric DEFAULT 0,
  average_response_time_hours numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reputation_monitoring_clinic ON reputation_monitoring(clinic_id);
CREATE INDEX IF NOT EXISTS idx_reputation_monitoring_platform ON reputation_monitoring(platform);
CREATE INDEX IF NOT EXISTS idx_reputation_monitoring_period ON reputation_monitoring(period_start, period_end);

-- Churn Risk Indicators Table
CREATE TABLE IF NOT EXISTS churn_risk_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  service_line_id uuid,
  period_start date NOT NULL,
  period_end date NOT NULL,
  patients_at_risk_count integer DEFAULT 0,
  missed_appointments_count integer DEFAULT 0,
  declined_rebookings_count integer DEFAULT 0,
  negative_feedback_count integer DEFAULT 0,
  payment_issues_count integer DEFAULT 0,
  long_gaps_between_visits_count integer DEFAULT 0,
  risk_level text DEFAULT 'low',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_churn_risk_indicators_clinic ON churn_risk_indicators(clinic_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_indicators_service ON churn_risk_indicators(service_line_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_indicators_period ON churn_risk_indicators(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_churn_risk_indicators_risk ON churn_risk_indicators(risk_level);

-- Experience Improvement Actions Table
CREATE TABLE IF NOT EXISTS experience_improvement_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  action_category text NOT NULL,
  description text NOT NULL,
  triggered_by text,
  status text NOT NULL DEFAULT 'planned',
  start_date date NOT NULL,
  completion_date date,
  expected_impact text,
  actual_impact_measured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experience_improvement_actions_clinic ON experience_improvement_actions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_experience_improvement_actions_category ON experience_improvement_actions(action_category);
CREATE INDEX IF NOT EXISTS idx_experience_improvement_actions_status ON experience_improvement_actions(status);

-- Enable RLS
ALTER TABLE satisfaction_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_risk_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_improvement_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_partner_satisfaction ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Executives and clinic managers can view satisfaction signals" ON satisfaction_signals;
DROP POLICY IF EXISTS "Executives and clinic managers can manage satisfaction signals" ON satisfaction_signals;
DROP POLICY IF EXISTS "Executives and clinic managers can view complaint themes" ON complaint_themes;
DROP POLICY IF EXISTS "Executives and clinic managers can manage complaint themes" ON complaint_themes;
DROP POLICY IF EXISTS "Executives and clinic managers can view referral partner satisfaction" ON referral_partner_satisfaction;
DROP POLICY IF EXISTS "Executives and clinic managers can manage referral partner satisfaction" ON referral_partner_satisfaction;
DROP POLICY IF EXISTS "Executives and clinic managers can view reputation monitoring" ON reputation_monitoring;
DROP POLICY IF EXISTS "Executives and clinic managers can manage reputation monitoring" ON reputation_monitoring;
DROP POLICY IF EXISTS "Executives and clinic managers can view churn risk indicators" ON churn_risk_indicators;
DROP POLICY IF EXISTS "Executives and clinic managers can manage churn risk indicators" ON churn_risk_indicators;
DROP POLICY IF EXISTS "Executives and clinic managers can view improvement actions" ON experience_improvement_actions;
DROP POLICY IF EXISTS "Executives and clinic managers can manage improvement actions" ON experience_improvement_actions;

-- RLS Policies for satisfaction_signals
CREATE POLICY "Executives and clinic managers can view satisfaction signals"
  ON satisfaction_signals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage satisfaction signals"
  ON satisfaction_signals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for complaint_themes
CREATE POLICY "Executives and clinic managers can view complaint themes"
  ON complaint_themes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage complaint themes"
  ON complaint_themes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for referral_partner_satisfaction
CREATE POLICY "Executives and clinic managers can view referral partner satisfaction"
  ON referral_partner_satisfaction FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage referral partner satisfaction"
  ON referral_partner_satisfaction FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for reputation_monitoring
CREATE POLICY "Executives and clinic managers can view reputation monitoring"
  ON reputation_monitoring FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage reputation monitoring"
  ON reputation_monitoring FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for churn_risk_indicators
CREATE POLICY "Executives and clinic managers can view churn risk indicators"
  ON churn_risk_indicators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage churn risk indicators"
  ON churn_risk_indicators FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

-- RLS Policies for experience_improvement_actions
CREATE POLICY "Executives and clinic managers can view improvement actions"
  ON experience_improvement_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );

CREATE POLICY "Executives and clinic managers can manage improvement actions"
  ON experience_improvement_actions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'clinic_manager')
    )
  );
