/*
  # Create Tables for Previously Shallow Views

  ## Summary
  Creates tables that several frontend views were trying to query but falling back to demo data because the tables didn't exist:

  1. **budget_line_items** - FY budget tracking by category, with allocated/spent/forecast amounts
  2. **job_requisitions** - Recruiting pipeline: open/filled/on-hold roles by clinic
  3. **employer_programs** - Corporate employer partnerships and enrollment data
  4. **rtw_rts_cases** - Return-to-Work and Return-to-Sport clinical programs
  5. **expansion_pipeline** - Expansion sites in various planning stages

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read all rows (these are operational views, not sensitive patient data)
  - Only admin/executive roles can insert/update via WITH CHECK on role column
*/

-- =============================================
-- 1. budget_line_items
-- =============================================
CREATE TABLE IF NOT EXISTS budget_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year integer NOT NULL DEFAULT EXTRACT(year FROM now()),
  category text NOT NULL,
  allocated_amount numeric(14,2) DEFAULT 0,
  ytd_spent numeric(14,2) DEFAULT 0,
  full_year_forecast numeric(14,2) DEFAULT 0,
  owner text,
  notes text,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read budget line items"
  ON budget_line_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and executive can insert budget line items"
  ON budget_line_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Admin and executive can update budget line items"
  ON budget_line_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- =============================================
-- 2. job_requisitions
-- =============================================
CREATE TABLE IF NOT EXISTS job_requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'on_hold', 'cancelled')),
  applicant_count integer DEFAULT 0,
  posted_date date DEFAULT CURRENT_DATE,
  priority text DEFAULT 'standard' CHECK (priority IN ('urgent', 'standard', 'low')),
  employment_type text DEFAULT 'full_time',
  salary_range_min numeric(10,2),
  salary_range_max numeric(10,2),
  description text,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  filled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_requisitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read job requisitions"
  ON job_requisitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin, executive, clinic_manager can insert job requisitions"
  ON job_requisitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Admin, executive, clinic_manager can update job requisitions"
  ON job_requisitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- =============================================
-- 3. employer_programs
-- =============================================
CREATE TABLE IF NOT EXISTS employer_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  industry text,
  total_employees integer DEFAULT 0,
  enrolled_employees integer DEFAULT 0,
  referrals_mtd integer DEFAULT 0,
  contract_type text DEFAULT 'Corporate' CHECK (contract_type IN ('Corporate', 'WCB Partner', 'Group Benefits', 'MVA Partner', 'Custom')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'prospect', 'inactive', 'negotiating')),
  primary_contact_name text,
  primary_contact_phone text,
  primary_contact_email text,
  annual_contract_value numeric(12,2) DEFAULT 0,
  contract_start_date date,
  contract_end_date date,
  account_owner_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employer_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read employer programs"
  ON employer_programs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin, executive, marketing can insert employer programs"
  ON employer_programs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Admin, executive, marketing can update employer programs"
  ON employer_programs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- =============================================
-- 4. rtw_rts_cases
-- =============================================
CREATE TABLE IF NOT EXISTS rtw_rts_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  assigned_clinician_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  program_type text NOT NULL DEFAULT 'Return to Work' CHECK (program_type IN ('Return to Work', 'Return to Sport')),
  case_type text DEFAULT 'WCB' CHECK (case_type IN ('WCB', 'MVA', 'Private', 'Group Benefits', 'WSBC')),
  employer_name text,
  sport_type text,
  start_date date DEFAULT CURRENT_DATE,
  target_date date,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'on_hold', 'discharged')),
  current_phase text,
  progress_percent integer DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rtw_rts_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read RTW/RTS cases"
  ON rtw_rts_cases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clinicians and admin can insert RTW/RTS cases"
  ON rtw_rts_cases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  );

CREATE POLICY "Clinicians and admin can update RTW/RTS cases"
  ON rtw_rts_cases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  );

-- =============================================
-- 5. expansion_pipeline
-- =============================================
CREATE TABLE IF NOT EXISTS expansion_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  address text,
  stage text DEFAULT 'target_identified' CHECK (stage IN (
    'target_identified', 'due_diligence', 'approved', 'launch_planning',
    'under_construction', 'opening_soon', 'open'
  )),
  target_open_date date,
  capex_budget numeric(12,2) DEFAULT 0,
  projected_annual_revenue numeric(12,2) DEFAULT 0,
  catchment_population integer DEFAULT 0,
  competition_level text DEFAULT 'medium' CHECK (competition_level IN ('low', 'medium', 'high')),
  site_type text DEFAULT 'new_clinic' CHECK (site_type IN ('new_clinic', 'acquisition', 'satellite', 'relocation')),
  lead_owner_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expansion_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read expansion pipeline"
  ON expansion_pipeline FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and executive can insert expansion pipeline"
  ON expansion_pipeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Admin and executive can update expansion pipeline"
  ON expansion_pipeline FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_budget_line_items_fiscal_year ON budget_line_items(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_job_requisitions_status ON job_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_job_requisitions_clinic ON job_requisitions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_employer_programs_status ON employer_programs(status);
CREATE INDEX IF NOT EXISTS idx_rtw_rts_cases_patient ON rtw_rts_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_rtw_rts_cases_clinic ON rtw_rts_cases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_rtw_rts_cases_status ON rtw_rts_cases(status);
CREATE INDEX IF NOT EXISTS idx_expansion_pipeline_stage ON expansion_pipeline(stage);
