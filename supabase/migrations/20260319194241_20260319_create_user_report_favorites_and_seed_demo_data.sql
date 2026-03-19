/*
  # User Report Favorites + Demo Seed Data

  ## New Tables
  - `user_report_favorites`: Persists per-user report favorites.

  ## Demo Data
  Seeds all five shallow-view tables using correct constraint-compliant values.

  ### Constraints observed:
  - job_requisitions.priority: 'urgent', 'standard', 'low'
  - job_requisitions.status: 'open', 'filled', 'on_hold', 'cancelled'
  - employer_programs.contract_type: 'Corporate', 'WCB Partner', 'Group Benefits', 'MVA Partner', 'Custom'
  - employer_programs.status: 'active', 'prospect', 'inactive', 'negotiating'
  - expansion_pipeline.stage: 'target_identified', 'due_diligence', 'approved', 'launch_planning', 'under_construction', 'opening_soon', 'open'
  - expansion_pipeline.site_type: 'new_clinic', 'acquisition', 'satellite', 'relocation'
  - expansion_pipeline.competition_level: 'low', 'medium', 'high'

  ## Security
  - RLS enabled on user_report_favorites
*/

-- ─── USER REPORT FAVORITES ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_report_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id   text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, report_id)
);

ALTER TABLE user_report_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own report favorites"
  ON user_report_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report favorites"
  ON user_report_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own report favorites"
  ON user_report_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_report_favorites_user_id ON user_report_favorites(user_id);

-- ─── SEED: BUDGET LINE ITEMS ──────────────────────────────────────────────────

INSERT INTO budget_line_items (category, allocated_amount, ytd_spent, full_year_forecast, fiscal_year, owner)
SELECT * FROM (VALUES
  ('Clinical Staffing',     2400000::numeric, 580000::numeric, 2350000::numeric, 2026, 'Operations'),
  ('Marketing & Growth',     420000::numeric, 115000::numeric,  435000::numeric, 2026, 'Growth'),
  ('Technology & Systems',   280000::numeric,  64000::numeric,  275000::numeric, 2026, 'IT'),
  ('Facilities & Rent',      660000::numeric, 165000::numeric,  660000::numeric, 2026, 'Operations'),
  ('Equipment & Supplies',   195000::numeric,  42000::numeric,  190000::numeric, 2026, 'Operations'),
  ('Training & Development',  85000::numeric,  18000::numeric,   82000::numeric, 2026, 'HR'),
  ('Administrative',         145000::numeric,  36000::numeric,  148000::numeric, 2026, 'Finance')
) AS v(category, allocated_amount, ytd_spent, full_year_forecast, fiscal_year, owner)
WHERE NOT EXISTS (SELECT 1 FROM budget_line_items LIMIT 1);

-- ─── SEED: JOB REQUISITIONS ───────────────────────────────────────────────────

INSERT INTO job_requisitions (title, status, applicant_count, posted_date, priority, employment_type, salary_range_min, salary_range_max)
SELECT * FROM (VALUES
  ('Registered Physiotherapist',    'open',   12, '2026-03-01'::date, 'urgent',   'full_time', 80000::numeric, 100000::numeric),
  ('Massage Therapist',             'open',    8, '2026-03-05'::date, 'urgent',   'part_time', 45000::numeric,  55000::numeric),
  ('Clinic Receptionist',           'open',   21, '2026-02-20'::date, 'standard', 'full_time', 42000::numeric,  50000::numeric),
  ('Kinesiologist',                 'open',    5, '2026-02-28'::date, 'standard', 'full_time', 55000::numeric,  68000::numeric),
  ('Clinic Manager — South Commons','open',    3, '2026-02-10'::date, 'urgent',   'full_time', 70000::numeric,  85000::numeric),
  ('Administrative Coordinator',    'filled', 18, '2026-01-15'::date, 'low',      'full_time', 40000::numeric,  48000::numeric)
) AS v(title, status, applicant_count, posted_date, priority, employment_type, salary_range_min, salary_range_max)
WHERE NOT EXISTS (SELECT 1 FROM job_requisitions LIMIT 1);

-- ─── SEED: EMPLOYER PROGRAMS ──────────────────────────────────────────────────

INSERT INTO employer_programs (company_name, industry, total_employees, enrolled_employees, referrals_mtd, contract_type, status, annual_contract_value)
SELECT * FROM (VALUES
  ('Syncrude Canada',           'Energy',       4200, 312, 28, 'Corporate',     'active',   185000::numeric),
  ('PCL Construction',          'Construction', 2800, 198, 19, 'WCB Partner',   'active',   124000::numeric),
  ('Government of Alberta',     'Government',  12000, 445, 41, 'Corporate',     'active',   265000::numeric),
  ('Canadian Natural Resources','Energy',       6500, 287, 23, 'Group Benefits','active',   172000::numeric),
  ('ATCO Group',                'Utilities',    3100, 156, 14, 'Corporate',     'active',    93000::numeric),
  ('Stantec',                   'Engineering',  1800,  89,  8, 'Custom',        'prospect',      0::numeric)
) AS v(company_name, industry, total_employees, enrolled_employees, referrals_mtd, contract_type, status, annual_contract_value)
WHERE NOT EXISTS (SELECT 1 FROM employer_programs LIMIT 1);

-- ─── SEED: EXPANSION PIPELINE ─────────────────────────────────────────────────

INSERT INTO expansion_pipeline (name, city, stage, target_open_date, capex_budget, projected_annual_revenue, catchment_population, competition_level, site_type)
SELECT * FROM (VALUES
  ('AIM South Commons',    'Edmonton',     'open',             '2026-04-01'::date, 420000::numeric, 1200000::numeric, 48000, 'medium', 'new_clinic'),
  ('AIM Windermere',       'Edmonton',     'launch_planning',  '2026-08-15'::date, 480000::numeric, 1350000::numeric, 62000, 'low',    'new_clinic'),
  ('AIM Sherwood Park',    'Sherwood Park','due_diligence',    '2026-11-01'::date, 520000::numeric, 1450000::numeric, 71000, 'medium', 'new_clinic'),
  ('AIM Red Deer North',   'Red Deer',     'target_identified','2027-02-01'::date, 390000::numeric, 1100000::numeric, 44000, 'low',    'new_clinic'),
  ('AIM Calgary Beltline', 'Calgary',      'target_identified','2027-06-01'::date, 650000::numeric, 1800000::numeric, 95000, 'high',   'new_clinic')
) AS v(name, city, stage, target_open_date, capex_budget, projected_annual_revenue, catchment_population, competition_level, site_type)
WHERE NOT EXISTS (SELECT 1 FROM expansion_pipeline LIMIT 1);
