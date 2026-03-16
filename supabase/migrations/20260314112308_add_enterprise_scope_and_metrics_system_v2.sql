/*
  # Enterprise Scope Management and KPI Metrics System
  
  ## Overview
  This migration adds critical enterprise components identified from the deep research spec:
  1. User scope memberships for RLS enforcement (clinic/region/org access)
  2. Enhanced audit events with Alberta PLAS compliance fields
  3. Metric definitions and values for standardized KPI tracking
  4. Helper functions for scope-based access control

  ## New Tables
  - `user_scope_memberships` - Binds users to organizational scopes with role-based access
  - `metric_definitions` - Defines standardized KPIs (HFMA MAP Keys, APTA PPS, etc.)
  - `metric_values` - Stores computed KPI values by period and scope
  - `metric_targets` - Stores targets/benchmarks for metrics

  ## Modified Tables
  - `audit_events` - Enhanced with patient_id, clinic_id, organization_id, entity_type, reason per PLAS

  ## Security
  - RLS enabled on all new tables
  - Proper scope-based access policies
*/

-- 1. User Scope Memberships table for RLS enforcement
CREATE TABLE IF NOT EXISTS user_scope_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  role_code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  granted_by uuid REFERENCES auth.users(id),
  grant_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_scope CHECK (
    (region_id IS NULL AND clinic_id IS NULL) OR
    (region_id IS NOT NULL AND clinic_id IS NULL) OR
    (region_id IS NOT NULL AND clinic_id IS NOT NULL) OR
    (region_id IS NULL AND clinic_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_user_scope_user ON user_scope_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scope_org ON user_scope_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_scope_region ON user_scope_memberships(region_id);
CREATE INDEX IF NOT EXISTS idx_user_scope_clinic ON user_scope_memberships(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_scope_active ON user_scope_memberships(is_active) WHERE is_active = true;

-- 2. Add missing columns to audit_events for Alberta PLAS compliance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_events' AND column_name = 'patient_id') THEN
    ALTER TABLE audit_events ADD COLUMN patient_id uuid REFERENCES patients(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_events' AND column_name = 'clinic_id') THEN
    ALTER TABLE audit_events ADD COLUMN clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_events' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_events ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_events' AND column_name = 'entity_type') THEN
    ALTER TABLE audit_events ADD COLUMN entity_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_events' AND column_name = 'reason') THEN
    ALTER TABLE audit_events ADD COLUMN reason text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_events' AND column_name = 'success') THEN
    ALTER TABLE audit_events ADD COLUMN success boolean DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_patient_time ON audit_events(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_clinic_time ON audit_events(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org_time ON audit_events(organization_id, created_at DESC);

-- 3. Metric Definitions table for standardized KPIs
CREATE TABLE IF NOT EXISTS metric_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_code text UNIQUE NOT NULL,
  metric_name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN (
    'revenue', 'operations', 'clinical', 'growth', 
    'workforce', 'quality', 'access', 'financial'
  )),
  subcategory text,
  unit_of_measure text NOT NULL DEFAULT 'number',
  format text DEFAULT 'number' CHECK (format IN (
    'currency', 'percentage', 'number', 'duration', 'ratio'
  )),
  calculation_logic text,
  source_standard text,
  aggregation_method text DEFAULT 'sum' CHECK (aggregation_method IN (
    'sum', 'avg', 'min', 'max', 'count', 'weighted_avg', 'latest'
  )),
  comparison_direction text DEFAULT 'higher_is_better' CHECK (comparison_direction IN (
    'higher_is_better', 'lower_is_better', 'target_is_optimal'
  )),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  refresh_frequency text DEFAULT 'daily' CHECK (refresh_frequency IN (
    'realtime', 'hourly', 'daily', 'weekly', 'monthly'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Metric Values table for actual KPI data
CREATE TABLE IF NOT EXISTS metric_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_definition_id uuid NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  period_type text NOT NULL CHECK (period_type IN (
    'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'ytd', 'mtd', 'wtd'
  )),
  period_start date NOT NULL,
  period_end date NOT NULL,
  metric_value numeric NOT NULL,
  target_value numeric,
  prior_period_value numeric,
  variance_value numeric,
  variance_pct numeric,
  source_reference text,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_period CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_metric_values_def ON metric_values(metric_definition_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_org ON metric_values(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_clinic ON metric_values(clinic_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_period ON metric_values(period_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_metric_values_lookup ON metric_values(metric_definition_id, organization_id, clinic_id, period_type, period_start);

-- 5. Metric Targets table for benchmarks and goals
CREATE TABLE IF NOT EXISTS metric_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_definition_id uuid NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id) ON DELETE SET NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN (
    'budget', 'stretch', 'minimum', 'benchmark', 'industry_avg'
  )),
  fiscal_year integer NOT NULL,
  period_type text NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_number integer,
  target_value numeric NOT NULL,
  notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metric_targets_def ON metric_targets(metric_definition_id);
CREATE INDEX IF NOT EXISTS idx_metric_targets_org ON metric_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_targets_fy ON metric_targets(fiscal_year);

-- 6. Enable RLS on new tables
ALTER TABLE user_scope_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_targets ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for user_scope_memberships
CREATE POLICY "Users can view their own scope memberships"
  ON user_scope_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage scope memberships"
  ON user_scope_memberships FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'executive')
    )
  );

-- 8. RLS Policies for metric_definitions (read by all authenticated, write by admins)
CREATE POLICY "Authenticated users can view metric definitions"
  ON metric_definitions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage metric definitions"
  ON metric_definitions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'executive')
    )
  );

-- 9. RLS Policies for metric_values (scope-based access)
CREATE POLICY "Users can view metrics within their scope"
  ON metric_values FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_scope_memberships usm
      WHERE usm.user_id = auth.uid()
      AND usm.is_active = true
      AND usm.organization_id = metric_values.organization_id
      AND (
        usm.clinic_id IS NULL OR usm.clinic_id = metric_values.clinic_id
      )
      AND (
        usm.region_id IS NULL OR usm.region_id = metric_values.region_id
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'executive')
    )
  );

-- 10. RLS Policies for metric_targets
CREATE POLICY "Users can view targets within their scope"
  ON metric_targets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_scope_memberships usm
      WHERE usm.user_id = auth.uid()
      AND usm.is_active = true
      AND usm.organization_id = metric_targets.organization_id
      AND (
        usm.clinic_id IS NULL OR usm.clinic_id = metric_targets.clinic_id
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('admin', 'executive')
    )
  );

-- 11. Helper function to get user's accessible clinics
CREATE OR REPLACE FUNCTION get_user_accessible_clinics(p_user_id uuid)
RETURNS TABLE(clinic_id uuid, clinic_name text, access_level text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    CASE 
      WHEN usm.clinic_id IS NOT NULL THEN 'direct'
      WHEN usm.region_id IS NOT NULL THEN 'regional'
      ELSE 'organization'
    END as access_level
  FROM clinics c
  JOIN user_scope_memberships usm ON usm.organization_id = c.organization_id
  WHERE usm.user_id = p_user_id
  AND usm.is_active = true
  AND c.is_active = true
  AND (
    usm.clinic_id IS NULL 
    OR usm.clinic_id = c.id
  )
  AND (
    usm.region_id IS NULL 
    OR usm.region_id = c.region_id
  )
  ORDER BY c.name;
END;
$$;

-- 12. Helper function to check if user has access to a specific clinic
CREATE OR REPLACE FUNCTION user_has_clinic_access(p_user_id uuid, p_clinic_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM clinics c
    JOIN user_scope_memberships usm ON usm.organization_id = c.organization_id
    WHERE usm.user_id = p_user_id
    AND usm.is_active = true
    AND c.id = p_clinic_id
    AND (
      usm.clinic_id IS NULL 
      OR usm.clinic_id = c.id
    )
    AND (
      usm.region_id IS NULL 
      OR usm.region_id = c.region_id
    )
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

-- 13. Seed standard metric definitions (HFMA MAP Keys + APTA PPS + Custom)
INSERT INTO metric_definitions (metric_code, metric_name, description, category, subcategory, unit_of_measure, format, source_standard, comparison_direction, display_order)
VALUES
  -- Revenue/Financial KPIs (HFMA MAP Keys)
  ('NET_COLLECTION_RATE', 'Net Collection Rate', 'Net collections divided by net charges', 'financial', 'collections', '%', 'percentage', 'HFMA MAP Keys', 'higher_is_better', 1),
  ('AR_DAYS', 'AR Days Outstanding', 'Average days to collect receivables', 'financial', 'receivables', 'days', 'number', 'HFMA MAP Keys', 'lower_is_better', 2),
  ('DENIAL_RATE', 'Claim Denial Rate', 'Percentage of claims denied by payers', 'financial', 'claims', '%', 'percentage', 'HFMA MAP Keys', 'lower_is_better', 3),
  ('CLEAN_CLAIM_RATE', 'Clean Claim Rate', 'Percentage of claims paid on first submission', 'financial', 'claims', '%', 'percentage', 'HFMA MAP Keys', 'higher_is_better', 4),
  ('COLLECTION_COST', 'Cost to Collect', 'Cost per dollar collected', 'financial', 'collections', '$', 'currency', 'HFMA MAP Keys', 'lower_is_better', 5),
  
  -- Clinical Productivity KPIs (APTA PPS)
  ('REV_PER_VISIT', 'Revenue per Visit', 'Total revenue divided by total visits', 'revenue', 'productivity', '$', 'currency', 'APTA PPS', 'higher_is_better', 10),
  ('VISITS_PER_CLINICAL_HR', 'Visits per Clinical Hour', 'Total visits divided by clinical hours worked', 'operations', 'productivity', 'visits/hr', 'ratio', 'APTA PPS', 'target_is_optimal', 11),
  ('ARRIVAL_RATE', 'Arrival Rate', 'Percentage of scheduled appointments that arrive', 'operations', 'access', '%', 'percentage', 'APTA PPS', 'higher_is_better', 12),
  ('NO_SHOW_RATE', 'No-Show Rate', 'Percentage of appointments marked no-show', 'operations', 'access', '%', 'percentage', 'APTA PPS', 'lower_is_better', 13),
  ('CANCEL_RATE', 'Cancellation Rate', 'Percentage of appointments cancelled', 'operations', 'access', '%', 'percentage', 'APTA PPS', 'lower_is_better', 14),
  
  -- Operations KPIs
  ('UTILIZATION_RATE', 'Clinician Utilization Rate', 'Billable hours as percentage of available hours', 'operations', 'capacity', '%', 'percentage', 'Custom', 'target_is_optimal', 20),
  ('FILL_RATE', 'Schedule Fill Rate', 'Percentage of available slots filled', 'operations', 'capacity', '%', 'percentage', 'Custom', 'higher_is_better', 21),
  ('DAYS_TO_FIRST_APPT', 'Days to First Appointment', 'Average days from inquiry to first appointment', 'access', 'intake', 'days', 'number', 'Custom', 'lower_is_better', 22),
  ('AVG_WAIT_TIME', 'Average Wait Time', 'Average minutes patients wait past appointment time', 'operations', 'service', 'minutes', 'number', 'Custom', 'lower_is_better', 23),
  
  -- Clinical Quality KPIs
  ('OUTCOME_IMPROVEMENT', 'Outcome Improvement Rate', 'Percentage of patients showing outcome improvement', 'clinical', 'outcomes', '%', 'percentage', 'Custom', 'higher_is_better', 30),
  ('REASSESS_COMPLIANCE', 'Reassessment Compliance Rate', 'Percentage of cases with timely reassessments', 'clinical', 'compliance', '%', 'percentage', 'Custom', 'higher_is_better', 31),
  ('DOC_TIMELINESS', 'Documentation Timeliness', 'Percentage of notes signed within 24 hours', 'clinical', 'compliance', '%', 'percentage', 'Custom', 'higher_is_better', 32),
  ('EXERCISE_ADHERENCE', 'Exercise Adherence Rate', 'Average patient adherence to exercise programs', 'clinical', 'adherence', '%', 'percentage', 'Custom', 'higher_is_better', 33),
  
  -- Growth KPIs
  ('NEW_PATIENTS', 'New Patients', 'Number of new patients in period', 'growth', 'acquisition', 'patients', 'number', 'Custom', 'higher_is_better', 40),
  ('CONVERSION_RATE', 'Lead Conversion Rate', 'Percentage of leads converted to patients', 'growth', 'acquisition', '%', 'percentage', 'Custom', 'higher_is_better', 41),
  ('REFERRAL_VOLUME', 'Referral Volume', 'Number of referrals received', 'growth', 'referrals', 'referrals', 'number', 'Custom', 'higher_is_better', 42),
  ('REVIEW_VELOCITY', 'Review Velocity', 'Number of new Google reviews per month', 'growth', 'reputation', 'reviews', 'number', 'Custom', 'higher_is_better', 43),
  ('NPS_SCORE', 'Net Promoter Score', 'Patient likelihood to recommend', 'quality', 'satisfaction', 'score', 'number', 'Custom', 'higher_is_better', 44),
  
  -- Workforce KPIs
  ('TURNOVER_RATE', 'Staff Turnover Rate', 'Annual staff turnover percentage', 'workforce', 'retention', '%', 'percentage', 'Custom', 'lower_is_better', 50),
  ('TIME_TO_HIRE', 'Time to Hire', 'Average days to fill open positions', 'workforce', 'hiring', 'days', 'number', 'Custom', 'lower_is_better', 51),
  ('TRAINING_COMPLETION', 'Training Completion Rate', 'Percentage of required training completed', 'workforce', 'development', '%', 'percentage', 'Custom', 'higher_is_better', 52),
  ('BURNOUT_RISK_INDEX', 'Burnout Risk Index', 'Composite score of burnout indicators', 'workforce', 'wellbeing', 'score', 'number', 'Custom', 'lower_is_better', 53)
ON CONFLICT (metric_code) DO NOTHING;
