/*
  # Enterprise Organizational Hierarchy Schema
  
  This migration creates the foundational data model for a multi-clinic
  physiotherapy network supporting $100M+ scale operations.
  
  ## Organizational Structure
  
  1. Organizations (Corporate entities)
  2. Regions (Geographic territories)  
  3. Clinics (Physical locations - extended)
  4. Departments (Functional units within clinics)
  
  ## New Tables
  
  - organizations - Corporate entities
  - regions - Geographic territories with hierarchy support
  - departments - Functional units within clinics
  - enterprise_roles - 20+ role definitions with permissions
  - employee_assignments - User-to-org/region/clinic assignments
  
  ## Security
  
  - RLS enabled on all tables
  - Organization-scoped access for enterprise tables
  - Proper policy hierarchy based on role level
*/

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  legal_name text,
  tax_id text,
  address_line1 text,
  address_line2 text,
  city text,
  province text,
  postal_code text,
  country text DEFAULT 'Canada',
  phone text,
  email text,
  website text,
  logo_url text,
  fiscal_year_start_month int DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  currency text DEFAULT 'CAD',
  timezone text DEFAULT 'America/Toronto',
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view organizations" ON organizations;
CREATE POLICY "Authenticated users can view organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Executives can manage organizations" ON organizations;
CREATE POLICY "Executives can manage organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- ============================================
-- REGIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  parent_region_id uuid REFERENCES regions(id),
  regional_director_id uuid,
  target_clinic_count int,
  target_revenue numeric(15,2),
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_regions_organization ON regions(organization_id);
CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_region_id);

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active regions" ON regions;
CREATE POLICY "Authenticated users can view active regions"
  ON regions FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Regional directors can manage their regions" ON regions;
CREATE POLICY "Regional directors can manage their regions"
  ON regions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
    OR regional_director_id = auth.uid()
  );

-- ============================================
-- UPDATE CLINICS TABLE - Add region relationship
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE clinics ADD COLUMN organization_id uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'region_id'
  ) THEN
    ALTER TABLE clinics ADD COLUMN region_id uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'clinic_type'
  ) THEN
    ALTER TABLE clinics ADD COLUMN clinic_type text DEFAULT 'corporate';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'opened_date'
  ) THEN
    ALTER TABLE clinics ADD COLUMN opened_date date;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'clinic_director_id'
  ) THEN
    ALTER TABLE clinics ADD COLUMN clinic_director_id uuid;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'target_revenue'
  ) THEN
    ALTER TABLE clinics ADD COLUMN target_revenue numeric(15,2);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics' AND column_name = 'target_utilization'
  ) THEN
    ALTER TABLE clinics ADD COLUMN target_utilization numeric(5,2);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clinics_organization ON clinics(organization_id);
CREATE INDEX IF NOT EXISTS idx_clinics_region ON clinics(region_id);

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  department_type text NOT NULL CHECK (department_type IN (
    'clinical',
    'administrative', 
    'support',
    'retail',
    'gym'
  )),
  manager_id uuid,
  cost_center_code text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_clinic ON departments(clinic_id);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active departments" ON departments;
CREATE POLICY "Authenticated users can view active departments"
  ON departments FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Managers can manage departments" ON departments;
CREATE POLICY "Managers can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- ============================================
-- ENTERPRISE ROLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS enterprise_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  role_level text NOT NULL CHECK (role_level IN (
    'corporate',
    'regional',
    'clinic',
    'clinical',
    'support',
    'external'
  )),
  role_category text NOT NULL CHECK (role_category IN (
    'executive',
    'operations',
    'clinical',
    'growth',
    'finance',
    'technology',
    'support',
    'partner'
  )),
  description text,
  permissions jsonb DEFAULT '[]',
  default_modules text[] DEFAULT '{}',
  can_delegate boolean DEFAULT false,
  delegation_limit numeric(15,2),
  reports_to text,
  display_order int DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE enterprise_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active roles" ON enterprise_roles;
CREATE POLICY "Authenticated users can view active roles"
  ON enterprise_roles FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage roles" ON enterprise_roles;
CREATE POLICY "Admins can manage roles"
  ON enterprise_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- ============================================
-- EMPLOYEE ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS employee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  region_id uuid REFERENCES regions(id),
  clinic_id uuid REFERENCES clinics(id),
  department_id uuid REFERENCES departments(id),
  role_id uuid NOT NULL REFERENCES enterprise_roles(id),
  is_primary boolean DEFAULT true,
  employment_type text DEFAULT 'full_time' CHECK (employment_type IN (
    'full_time',
    'part_time',
    'contract',
    'casual'
  )),
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  cost_center text,
  reporting_to uuid REFERENCES user_profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_assignments_user ON employee_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_org ON employee_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_region ON employee_assignments(region_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_clinic ON employee_assignments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_role ON employee_assignments(role_id);

ALTER TABLE employee_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own assignments" ON employee_assignments;
CREATE POLICY "Users can view their own assignments"
  ON employee_assignments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Managers can manage assignments" ON employee_assignments;
CREATE POLICY "Managers can manage assignments"
  ON employee_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- ============================================
-- CLINIC FINANCIAL METRICS TABLE (for clinic-level reporting)
-- ============================================

CREATE TABLE IF NOT EXISTS clinic_financial_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  total_revenue numeric(15,2) DEFAULT 0,
  total_visits int DEFAULT 0,
  revenue_per_visit numeric(10,2) DEFAULT 0,
  total_clinician_hours numeric(10,2) DEFAULT 0,
  revenue_per_hour numeric(10,2) DEFAULT 0,
  utilization_rate numeric(5,2) DEFAULT 0,
  margin_percentage numeric(5,2) DEFAULT 0,
  new_patients int DEFAULT 0,
  returning_patients int DEFAULT 0,
  payer_mix jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, period_start, period_type)
);

CREATE INDEX IF NOT EXISTS idx_clinic_financial_snapshots_clinic ON clinic_financial_snapshots(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_financial_snapshots_period ON clinic_financial_snapshots(period_start, period_end);

ALTER TABLE clinic_financial_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view clinic financials" ON clinic_financial_snapshots;
CREATE POLICY "Authenticated users can view clinic financials"
  ON clinic_financial_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- ============================================
-- SEED ENTERPRISE ROLES
-- ============================================

INSERT INTO enterprise_roles (name, code, role_level, role_category, description, permissions, default_modules, can_delegate, reports_to, display_order) VALUES
-- Corporate Leadership
('Chief Executive Officer', 'CEO', 'corporate', 'executive', 'Overall organizational leadership', 
  '["full_access", "financial_approval", "strategic_planning", "board_reporting"]'::jsonb,
  ARRAY['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence', 'strategy', 'admin'],
  true, NULL, 1),
  
('Chief Operating Officer', 'COO', 'corporate', 'executive', 'Operations leadership across all regions',
  '["operations_full", "clinic_management", "staffing_approval", "vendor_management"]'::jsonb,
  ARRAY['command_center', 'operations', 'clinical', 'intelligence', 'strategy'],
  true, 'CEO', 2),
  
('Chief Financial Officer', 'CFO', 'corporate', 'executive', 'Financial leadership and governance',
  '["financial_full", "budget_approval", "capital_allocation", "audit_access"]'::jsonb,
  ARRAY['command_center', 'revenue', 'intelligence', 'strategy'],
  true, 'CEO', 3),
  
('Chief Clinical Officer', 'CCO', 'corporate', 'executive', 'Clinical quality and outcomes leadership',
  '["clinical_full", "quality_governance", "credentialing_approval", "protocol_management"]'::jsonb,
  ARRAY['command_center', 'clinical', 'intelligence', 'strategy'],
  true, 'CEO', 4),
  
('Chief Growth Officer', 'CGO', 'corporate', 'executive', 'Growth and expansion leadership',
  '["growth_full", "marketing_approval", "partnership_management", "expansion_planning"]'::jsonb,
  ARRAY['command_center', 'growth', 'intelligence', 'strategy'],
  true, 'CEO', 5),
  
('Chief Technology Officer', 'CTO', 'corporate', 'executive', 'Technology and digital strategy',
  '["technology_full", "integration_management", "data_governance", "security_oversight"]'::jsonb,
  ARRAY['command_center', 'intelligence', 'strategy', 'admin'],
  true, 'CEO', 6),

-- Regional Roles
('Regional Director', 'RD', 'regional', 'operations', 'Regional P&L and operations leadership',
  '["region_full", "clinic_oversight", "budget_management", "staffing_approval"]'::jsonb,
  ARRAY['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence'],
  true, 'COO', 10),
  
('Regional Clinical Director', 'RCD', 'regional', 'clinical', 'Regional clinical quality oversight',
  '["clinical_region", "quality_monitoring", "credentialing_oversight", "training_approval"]'::jsonb,
  ARRAY['command_center', 'clinical', 'intelligence'],
  true, 'CCO', 11),
  
('Regional Growth Manager', 'RGM', 'regional', 'growth', 'Regional growth and partnerships',
  '["growth_region", "partnership_management", "campaign_approval", "referral_management"]'::jsonb,
  ARRAY['command_center', 'growth', 'intelligence'],
  false, 'CGO', 12),
  
('Regional Operations Manager', 'ROM', 'regional', 'operations', 'Regional operational support',
  '["operations_region", "scheduling_oversight", "vendor_coordination", "compliance_monitoring"]'::jsonb,
  ARRAY['command_center', 'operations', 'intelligence'],
  false, 'RD', 13),

-- Clinic Roles
('Clinic Director', 'CD', 'clinic', 'operations', 'Clinic P&L and daily operations',
  '["clinic_full", "staffing_management", "budget_clinic", "patient_escalations"]'::jsonb,
  ARRAY['command_center', 'operations', 'clinical', 'revenue', 'growth'],
  true, 'RD', 20),
  
('Clinical Lead', 'CL', 'clinic', 'clinical', 'Clinical team leadership and quality',
  '["clinical_clinic", "caseload_management", "peer_review", "training_delivery"]'::jsonb,
  ARRAY['command_center', 'clinical', 'operations'],
  false, 'CD', 21),
  
('Front Desk Supervisor', 'FDS', 'clinic', 'support', 'Front desk operations and scheduling',
  '["scheduling_full", "patient_intake", "billing_support", "inventory_basic"]'::jsonb,
  ARRAY['command_center', 'operations', 'revenue'],
  false, 'CD', 22),

-- Clinical Staff
('Physiotherapist', 'PT', 'clinical', 'clinical', 'Registered Physiotherapist',
  '["patient_care", "assessment", "treatment_planning", "documentation"]'::jsonb,
  ARRAY['clinical', 'command_center'],
  false, 'CL', 30),
  
('Kinesiologist', 'KIN', 'clinical', 'clinical', 'Registered Kinesiologist',
  '["exercise_therapy", "functional_assessment", "rtw_support", "documentation"]'::jsonb,
  ARRAY['clinical', 'command_center'],
  false, 'CL', 31),
  
('Massage Therapist', 'RMT', 'clinical', 'clinical', 'Registered Massage Therapist',
  '["manual_therapy", "patient_care", "documentation"]'::jsonb,
  ARRAY['clinical', 'command_center'],
  false, 'CL', 32),
  
('Exercise Therapist', 'ET', 'clinical', 'clinical', 'Exercise Therapy Specialist',
  '["exercise_therapy", "gym_supervision", "documentation"]'::jsonb,
  ARRAY['clinical', 'command_center'],
  false, 'CL', 33),
  
('Chiropractor', 'DC', 'clinical', 'clinical', 'Doctor of Chiropractic',
  '["patient_care", "chiropractic_assessment", "treatment_planning", "documentation"]'::jsonb,
  ARRAY['clinical', 'command_center'],
  false, 'CL', 34),

-- Support Staff
('Patient Care Coordinator', 'PCC', 'support', 'support', 'Patient scheduling and coordination',
  '["scheduling", "patient_communication", "intake_support"]'::jsonb,
  ARRAY['operations', 'command_center'],
  false, 'FDS', 40),
  
('Billing Specialist', 'BS', 'support', 'finance', 'Claims and billing processing',
  '["billing_full", "claims_processing", "ar_management", "payment_posting"]'::jsonb,
  ARRAY['revenue', 'command_center'],
  false, 'FDS', 41),
  
('Marketing Coordinator', 'MC', 'support', 'growth', 'Local marketing and engagement',
  '["marketing_local", "social_media", "event_coordination", "review_management"]'::jsonb,
  ARRAY['growth', 'command_center'],
  false, 'RGM', 42),

-- External Roles
('Trainer Referral Partner', 'TRP', 'external', 'partner', 'Athletic trainer referral partner',
  '["referral_submission", "patient_status_view", "outcome_reports"]'::jsonb,
  ARRAY['growth'],
  false, 'RGM', 50),
  
('Employer Account', 'EA', 'external', 'partner', 'Employer partner account',
  '["employee_referral", "utilization_reports", "program_status"]'::jsonb,
  ARRAY['growth'],
  false, 'RGM', 51),
  
('Physician Referrer', 'PHY', 'external', 'partner', 'Physician referral source',
  '["referral_submission", "patient_updates", "outcome_summary"]'::jsonb,
  ARRAY['growth'],
  false, 'RGM', 52)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  role_level = EXCLUDED.role_level,
  role_category = EXCLUDED.role_category,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  default_modules = EXCLUDED.default_modules,
  can_delegate = EXCLUDED.can_delegate,
  reports_to = EXCLUDED.reports_to,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- ============================================
-- SEED DEFAULT ORGANIZATION AND REGIONS
-- ============================================

INSERT INTO organizations (id, name, code, legal_name, fiscal_year_start_month, settings)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'AIM Physiotherapy Network',
  'AIM',
  'Advanced Injury Management Inc.',
  1,
  '{"brand_color": "#0066CC", "default_appointment_duration": 30, "enable_ai_insights": true, "enable_outcome_tracking": true}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings,
  updated_at = now();

INSERT INTO regions (id, organization_id, name, code, description, target_clinic_count, target_revenue) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 
  'Greater Toronto Area', 'GTA', 'Toronto and surrounding municipalities', 15, 25000000),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
  'Southwestern Ontario', 'SWO', 'London, Windsor, and surrounding areas', 8, 12000000),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
  'Eastern Ontario', 'EO', 'Ottawa, Kingston, and surrounding areas', 6, 9000000),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
  'Northern Ontario', 'NO', 'Sudbury, Thunder Bay, and northern communities', 4, 6000000),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
  'Alberta', 'AB', 'Calgary, Edmonton, and Alberta expansion', 5, 8000000)
ON CONFLICT DO NOTHING;

-- Update existing clinics to link to organization
UPDATE clinics 
SET organization_id = 'a0000000-0000-0000-0000-000000000001',
    region_id = 'b0000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_scope(p_user_id uuid)
RETURNS TABLE (
  organization_id uuid,
  region_ids uuid[],
  clinic_ids uuid[],
  role_level text,
  role_code text,
  permissions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ea.organization_id,
    ARRAY_AGG(DISTINCT ea.region_id) FILTER (WHERE ea.region_id IS NOT NULL) as region_ids,
    ARRAY_AGG(DISTINCT ea.clinic_id) FILTER (WHERE ea.clinic_id IS NOT NULL) as clinic_ids,
    er.role_level,
    er.code as role_code,
    er.permissions
  FROM employee_assignments ea
  JOIN enterprise_roles er ON er.id = ea.role_id
  WHERE ea.user_id = p_user_id
    AND (ea.end_date IS NULL OR ea.end_date > CURRENT_DATE)
  GROUP BY ea.organization_id, er.role_level, er.code, er.permissions;
END;
$$;

CREATE OR REPLACE FUNCTION get_accessible_clinics(p_user_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_level text;
  v_clinic_ids uuid[];
  v_region_ids uuid[];
BEGIN
  SELECT er.role_level, 
         ARRAY_AGG(DISTINCT ea.clinic_id) FILTER (WHERE ea.clinic_id IS NOT NULL),
         ARRAY_AGG(DISTINCT ea.region_id) FILTER (WHERE ea.region_id IS NOT NULL)
  INTO v_role_level, v_clinic_ids, v_region_ids
  FROM employee_assignments ea
  JOIN enterprise_roles er ON er.id = ea.role_id
  WHERE ea.user_id = p_user_id
    AND (ea.end_date IS NULL OR ea.end_date > CURRENT_DATE)
  GROUP BY er.role_level;
  
  IF v_role_level = 'corporate' THEN
    RETURN (SELECT ARRAY_AGG(id) FROM clinics WHERE is_active = true);
  ELSIF v_role_level = 'regional' THEN
    RETURN (SELECT ARRAY_AGG(id) FROM clinics WHERE region_id = ANY(v_region_ids) AND is_active = true);
  ELSE
    RETURN COALESCE(v_clinic_ids, ARRAY[]::uuid[]);
  END IF;
END;
$$;

-- ============================================
-- AGGREGATION VIEWS FOR ENTERPRISE REPORTING
-- ============================================

DROP VIEW IF EXISTS v_regional_performance;
CREATE VIEW v_regional_performance AS
SELECT 
  r.id as region_id,
  r.name as region_name,
  r.code as region_code,
  COUNT(DISTINCT c.id) as clinic_count,
  COALESCE(SUM(cfs.total_revenue), 0) as total_revenue,
  COALESCE(AVG(cfs.utilization_rate), 0) as avg_utilization,
  COALESCE(AVG(cfs.margin_percentage), 0) as avg_margin,
  r.target_revenue,
  CASE 
    WHEN r.target_revenue > 0 
    THEN ROUND((COALESCE(SUM(cfs.total_revenue), 0) / r.target_revenue * 100)::numeric, 1)
    ELSE 0 
  END as target_achievement_pct
FROM regions r
LEFT JOIN clinics c ON c.region_id = r.id AND c.is_active = true
LEFT JOIN clinic_financial_snapshots cfs ON cfs.clinic_id = c.id 
  AND cfs.period_start >= date_trunc('year', CURRENT_DATE)
WHERE r.is_active = true
GROUP BY r.id, r.name, r.code, r.target_revenue;

DROP VIEW IF EXISTS v_organization_summary;
CREATE VIEW v_organization_summary AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  COUNT(DISTINCT r.id) as region_count,
  COUNT(DISTINCT c.id) as clinic_count,
  COUNT(DISTINCT ea.user_id) as employee_count,
  COALESCE(SUM(cfs.total_revenue), 0) as ytd_revenue,
  COALESCE(AVG(cfs.utilization_rate), 0) as avg_utilization,
  COALESCE(AVG(cfs.margin_percentage), 0) as avg_margin
FROM organizations o
LEFT JOIN regions r ON r.organization_id = o.id AND r.is_active = true
LEFT JOIN clinics c ON c.organization_id = o.id AND c.is_active = true
LEFT JOIN employee_assignments ea ON ea.organization_id = o.id 
  AND (ea.end_date IS NULL OR ea.end_date > CURRENT_DATE)
LEFT JOIN clinic_financial_snapshots cfs ON cfs.clinic_id = c.id
  AND cfs.period_start >= date_trunc('year', CURRENT_DATE)
WHERE o.is_active = true
GROUP BY o.id, o.name;

DROP VIEW IF EXISTS v_clinic_performance;
CREATE VIEW v_clinic_performance AS
SELECT 
  c.id as clinic_id,
  c.name as clinic_name,
  c.code as clinic_code,
  r.name as region_name,
  c.clinic_type,
  c.opened_date,
  COALESCE(cfs.total_revenue, 0) as mtd_revenue,
  COALESCE(cfs.total_visits, 0) as mtd_visits,
  COALESCE(cfs.utilization_rate, 0) as utilization_rate,
  COALESCE(cfs.revenue_per_visit, 0) as revenue_per_visit,
  c.target_revenue,
  c.target_utilization,
  CASE 
    WHEN c.target_revenue > 0 
    THEN ROUND((COALESCE(cfs.total_revenue, 0) / c.target_revenue * 100)::numeric, 1)
    ELSE 0 
  END as revenue_target_pct,
  CASE
    WHEN COALESCE(cfs.utilization_rate, 0) >= COALESCE(c.target_utilization, 80) THEN 'on_track'
    WHEN COALESCE(cfs.utilization_rate, 0) >= COALESCE(c.target_utilization, 80) * 0.9 THEN 'at_risk'
    ELSE 'behind'
  END as performance_status
FROM clinics c
LEFT JOIN regions r ON r.id = c.region_id
LEFT JOIN clinic_financial_snapshots cfs ON cfs.clinic_id = c.id 
  AND cfs.period_start = date_trunc('month', CURRENT_DATE)
  AND cfs.period_type = 'monthly'
WHERE c.is_active = true;
