/*
  # Extend Launch Module for Embedded Partner Clinics (EPC Model)

  1. New Tables
    - `partner_clinics` - Partner clinic configuration
    - `partner_revenue_share` - Revenue share tracking
    - `partner_conversions` - Partner member conversion tracking
    - `partner_dashboard_metrics` - Aggregated metrics for partner view

  2. Schema Extensions
    - Add partner fields to `clinic_launches`
    - Add partner source tracking to intake
    - Add partner-specific KPIs

  3. Partner Types
    - Embedded partner locations (like EPC)
    - Replication templates for future spokes
*/

-- Create partner clinic type enum
CREATE TYPE partner_clinic_type AS ENUM (
  'embedded_partner',
  'on_site_employer',
  'sports_facility',
  'recreation_center',
  'standalone'
);

-- Create partner status enum
CREATE TYPE partner_status AS ENUM (
  'prospect',
  'negotiating',
  'active',
  'paused',
  'terminated'
);

-- Partner clinics master table
CREATE TABLE IF NOT EXISTS partner_clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  
  -- Partner identification
  partner_name text NOT NULL,
  partner_type partner_clinic_type DEFAULT 'embedded_partner',
  partner_contact_name text,
  partner_contact_email text,
  partner_contact_phone text,
  
  -- Partner business details
  partner_member_base integer DEFAULT 0,
  partner_location_type text,
  
  -- Strategic flags
  is_flagship_location boolean DEFAULT false,
  is_replication_template boolean DEFAULT false,
  template_name text,
  
  -- Partnership agreement
  partnership_start_date date,
  partnership_end_date date,
  status partner_status DEFAULT 'active',
  
  -- Revenue share configuration
  revenue_share_enabled boolean DEFAULT false,
  revenue_share_rate numeric(5, 2) DEFAULT 0,
  revenue_share_cap numeric(12, 2),
  revenue_share_cap_period text DEFAULT 'annual',
  
  -- Footprint
  square_footage integer,
  space_description text,
  
  -- Metadata
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Partner revenue share tracking
CREATE TABLE IF NOT EXISTS partner_revenue_share (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_clinic_id uuid NOT NULL REFERENCES partner_clinics(id) ON DELETE CASCADE,
  
  -- Period
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text DEFAULT 'monthly',
  
  -- Revenue metrics
  total_revenue numeric(12, 2) DEFAULT 0,
  partner_sourced_revenue numeric(12, 2) DEFAULT 0,
  revenue_share_amount numeric(12, 2) DEFAULT 0,
  
  -- Volume metrics
  total_patients integer DEFAULT 0,
  partner_sourced_patients integer DEFAULT 0,
  partner_conversion_rate numeric(5, 2),
  
  -- Cap tracking
  ytd_revenue_share numeric(12, 2) DEFAULT 0,
  cap_remaining numeric(12, 2),
  cap_exhausted boolean DEFAULT false,
  cap_exhausted_date date,
  
  -- Status
  is_paid boolean DEFAULT false,
  paid_date date,
  payment_reference text,
  
  -- Metadata
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(partner_clinic_id, period_start, period_end)
);

-- Partner member conversion tracking
CREATE TABLE IF NOT EXISTS partner_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_clinic_id uuid NOT NULL REFERENCES partner_clinics(id) ON DELETE CASCADE,
  
  -- Patient reference (anonymized for partner view)
  patient_id uuid,
  patient_ref_code text,
  
  -- Source tracking
  partner_member_id text,
  referral_source text DEFAULT 'partner_member',
  referral_date date DEFAULT CURRENT_DATE,
  
  -- Conversion funnel
  first_contact_date date,
  first_appointment_date date,
  first_visit_date date,
  
  -- Episode tracking
  total_visits integer DEFAULT 0,
  total_revenue numeric(10, 2) DEFAULT 0,
  episode_status text,
  
  -- Program participation
  programs_enrolled text[] DEFAULT ARRAY[]::text[],
  return_to_play_completed boolean DEFAULT false,
  
  -- Outcomes (aggregated only)
  satisfaction_score integer,
  outcome_achieved boolean,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Partner dashboard metrics (aggregated, PHI-free)
CREATE TABLE IF NOT EXISTS partner_dashboard_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_clinic_id uuid NOT NULL REFERENCES partner_clinics(id) ON DELETE CASCADE,
  
  -- Period
  metric_date date NOT NULL,
  metric_period text DEFAULT 'daily',
  
  -- Volume metrics
  partner_members_treated integer DEFAULT 0,
  new_patient_conversions integer DEFAULT 0,
  total_visits integer DEFAULT 0,
  
  -- Utilization
  clinic_utilization_pct numeric(5, 2),
  appointment_availability_pct numeric(5, 2),
  
  -- Program metrics
  injury_prevention_enrollments integer DEFAULT 0,
  return_to_play_completions integer DEFAULT 0,
  performance_programs integer DEFAULT 0,
  
  -- Outcomes (aggregated)
  avg_satisfaction_score numeric(3, 2),
  avg_visits_per_episode numeric(5, 2),
  successful_outcomes_pct numeric(5, 2),
  
  -- Service mix
  physiotherapy_visits integer DEFAULT 0,
  performance_rehab_visits integer DEFAULT 0,
  injury_prevention_visits integer DEFAULT 0,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  recorded_at timestamptz DEFAULT now(),
  
  UNIQUE(partner_clinic_id, metric_date, metric_period)
);

-- Extend clinic_launches for partner clinics
ALTER TABLE clinic_launches ADD COLUMN IF NOT EXISTS partner_clinic_id uuid REFERENCES partner_clinics(id) ON DELETE SET NULL;
ALTER TABLE clinic_launches ADD COLUMN IF NOT EXISTS is_partner_launch boolean DEFAULT false;

-- Add partner source type to launch tasks
ALTER TABLE launch_tasks ADD COLUMN IF NOT EXISTS partner_specific boolean DEFAULT false;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_clinics_clinic ON partner_clinics(clinic_id);
CREATE INDEX IF NOT EXISTS idx_partner_clinics_status ON partner_clinics(status);
CREATE INDEX IF NOT EXISTS idx_partner_clinics_flagship ON partner_clinics(is_flagship_location) WHERE is_flagship_location = true;

CREATE INDEX IF NOT EXISTS idx_partner_revenue_share_clinic ON partner_revenue_share(partner_clinic_id);
CREATE INDEX IF NOT EXISTS idx_partner_revenue_share_period ON partner_revenue_share(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_partner_conversions_clinic ON partner_conversions(partner_clinic_id);
CREATE INDEX IF NOT EXISTS idx_partner_conversions_date ON partner_conversions(referral_date);

CREATE INDEX IF NOT EXISTS idx_partner_dashboard_clinic ON partner_dashboard_metrics(partner_clinic_id);
CREATE INDEX IF NOT EXISTS idx_partner_dashboard_date ON partner_dashboard_metrics(metric_date);

-- Enable RLS
ALTER TABLE partner_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_revenue_share ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_clinics
CREATE POLICY "Executives and admins can view partner clinics"
  ON partner_clinics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Admins can manage partner clinics"
  ON partner_clinics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- RLS Policies for partner_revenue_share
CREATE POLICY "Authorized users can view revenue share"
  ON partner_revenue_share FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Admins can manage revenue share"
  ON partner_revenue_share FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- RLS Policies for partner_conversions (PHI protected)
CREATE POLICY "Authorized users can view conversions"
  ON partner_conversions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinician')
    )
  );

CREATE POLICY "Clinical staff can manage conversions"
  ON partner_conversions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinician')
    )
  );

-- RLS Policies for partner_dashboard_metrics (aggregated, PHI-free)
CREATE POLICY "Authorized users can view partner metrics"
  ON partner_dashboard_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "System can record metrics"
  ON partner_dashboard_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin')
    )
  );

-- Function to calculate partner revenue share
CREATE OR REPLACE FUNCTION calculate_partner_revenue_share(
  p_partner_clinic_id uuid,
  p_period_start date,
  p_period_end date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner record;
  v_partner_revenue numeric DEFAULT 0;
  v_partner_patients integer DEFAULT 0;
  v_share_amount numeric DEFAULT 0;
  v_ytd_share numeric DEFAULT 0;
  v_cap_remaining numeric;
  v_cap_exhausted boolean DEFAULT false;
BEGIN
  -- Get partner configuration
  SELECT * INTO v_partner
  FROM partner_clinics
  WHERE id = p_partner_clinic_id;
  
  IF NOT FOUND OR NOT v_partner.revenue_share_enabled THEN
    RETURN jsonb_build_object(
      'revenue_share_amount', 0,
      'reason', 'Revenue share not enabled'
    );
  END IF;
  
  -- Calculate YTD revenue share
  SELECT COALESCE(SUM(revenue_share_amount), 0) INTO v_ytd_share
  FROM partner_revenue_share
  WHERE partner_clinic_id = p_partner_clinic_id
  AND period_start >= DATE_TRUNC('year', p_period_start);
  
  -- Check if cap is already exhausted
  IF v_partner.revenue_share_cap IS NOT NULL THEN
    v_cap_remaining := v_partner.revenue_share_cap - v_ytd_share;
    
    IF v_cap_remaining <= 0 THEN
      RETURN jsonb_build_object(
        'revenue_share_amount', 0,
        'reason', 'Annual cap exhausted',
        'cap_exhausted', true,
        'ytd_share', v_ytd_share
      );
    END IF;
  END IF;
  
  -- Get partner-sourced revenue for period (from conversions)
  SELECT 
    COALESCE(SUM(total_revenue), 0),
    COUNT(DISTINCT patient_id)
  INTO v_partner_revenue, v_partner_patients
  FROM partner_conversions
  WHERE partner_clinic_id = p_partner_clinic_id
  AND first_visit_date BETWEEN p_period_start AND p_period_end;
  
  -- Calculate share amount
  v_share_amount := v_partner_revenue * (v_partner.revenue_share_rate / 100);
  
  -- Apply cap if exists
  IF v_partner.revenue_share_cap IS NOT NULL THEN
    IF v_share_amount > v_cap_remaining THEN
      v_share_amount := v_cap_remaining;
      v_cap_exhausted := true;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'partner_sourced_revenue', v_partner_revenue,
    'partner_sourced_patients', v_partner_patients,
    'revenue_share_amount', v_share_amount,
    'ytd_share', v_ytd_share + v_share_amount,
    'cap_remaining', CASE WHEN v_partner.revenue_share_cap IS NOT NULL 
                          THEN v_cap_remaining - v_share_amount 
                          ELSE NULL END,
    'cap_exhausted', v_cap_exhausted
  );
END;
$$;

-- Function to get partner dashboard data (PHI-free)
CREATE OR REPLACE FUNCTION get_partner_dashboard_summary(
  p_partner_clinic_id uuid,
  p_start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_members_treated', COUNT(DISTINCT patient_id),
    'total_visits', SUM(total_visits),
    'avg_satisfaction', ROUND(AVG(satisfaction_score), 2),
    'return_to_play_completions', COUNT(*) FILTER (WHERE return_to_play_completed = true),
    'avg_visits_per_episode', ROUND(AVG(total_visits), 1),
    'successful_outcomes_pct', ROUND(
      (COUNT(*) FILTER (WHERE outcome_achieved = true)::numeric / 
       NULLIF(COUNT(*), 0)::numeric) * 100, 
      1
    )
  ) INTO v_summary
  FROM partner_conversions
  WHERE partner_clinic_id = p_partner_clinic_id
  AND first_visit_date BETWEEN p_start_date AND p_end_date;
  
  RETURN v_summary;
END;
$$;