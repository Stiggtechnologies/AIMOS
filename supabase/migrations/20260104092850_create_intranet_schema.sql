/*
  # AIM Intranet System - Core Schema
  
  ## Summary
  Complete database schema for AIM internal intranet system with role-based access,
  clinic management, staff directory, compliance, and learning modules.
  
  ## New Tables
  
  ### User & Access Management
    - `user_roles` - Role definitions and permissions
    - `user_profiles` - Extended user profile information
    - `clinic_access` - User-clinic associations
    
  ### Clinic Management
    - `clinics` - Clinic locations and details
    - `clinic_metrics` - Real-time clinic KPIs
    
  ### Staff & People
    - `staff_profiles` - Complete staff information
    - `staff_certifications` - Professional certifications
    - `staff_availability` - Schedule and availability
    
  ### Learning & Development
    - `academy_categories` - Learning content categories
    - `academy_content` - Documents, videos, training materials
    - `learning_progress` - User progress tracking
    
  ### Compliance & Safety
    - `policies` - Company policies and procedures
    - `policy_acknowledgments` - User policy acceptance tracking
    - `incident_reports` - Safety incidents and near-misses
    - `audit_logs` - Security and compliance audit trail
    
  ### Communication
    - `announcements` - Company-wide and clinic-specific announcements
    - `announcement_reads` - Read tracking
    
  ### Onboarding
    - `onboarding_templates` - Onboarding checklist templates
    - `onboarding_tasks` - Individual onboarding tasks
    - `onboarding_progress` - Task completion tracking
    
  ## Security
    - RLS enabled on all tables
    - Role-based policies
    - Clinic-based data isolation (except executives)
*/

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('executive', 'clinic_manager', 'clinician', 'admin', 'contractor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contractor', 'casual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('document', 'video', 'course', 'quiz', 'link');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM ('draft', 'submitted', 'under_review', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CLINICS
-- =====================================================

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT DEFAULT 'AB',
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  operating_hours JSONB DEFAULT '{}',
  services_offered JSONB DEFAULT '[]',
  treatment_rooms INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- USER PROFILES & ROLES
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  display_name TEXT,
  role user_role NOT NULL,
  primary_clinic_id UUID REFERENCES clinics(id),
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  can_manage BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

-- =====================================================
-- STAFF PROFILES (Extended Information)
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  employment_type employment_type NOT NULL,
  primary_clinic_id UUID REFERENCES clinics(id),
  job_title TEXT,
  department TEXT,
  specialization TEXT,
  hire_date DATE,
  termination_date DATE,
  hourly_rate NUMERIC(10, 2),
  annual_salary NUMERIC(10, 2),
  is_licensed BOOLEAN DEFAULT false,
  license_number TEXT,
  license_expiry DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  skills JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  bio TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT,
  credential_id TEXT,
  issue_date DATE,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ACADEMY / LEARNING
-- =====================================================

CREATE TABLE IF NOT EXISTS academy_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES academy_categories(id),
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academy_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  category_id UUID REFERENCES academy_categories(id),
  file_url TEXT,
  video_url TEXT,
  external_link TEXT,
  content_text TEXT,
  duration_minutes INTEGER,
  is_required BOOLEAN DEFAULT false,
  required_for_roles JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  author_id UUID REFERENCES user_profiles(id),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES academy_content(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  quiz_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- =====================================================
-- COMPLIANCE & POLICIES
-- =====================================================

CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  policy_number TEXT UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  file_url TEXT,
  version TEXT DEFAULT '1.0',
  effective_date DATE NOT NULL,
  review_date DATE,
  is_active BOOLEAN DEFAULT true,
  requires_acknowledgment BOOLEAN DEFAULT false,
  applicable_roles JSONB DEFAULT '[]',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  signature TEXT,
  UNIQUE(policy_id, user_id)
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date TIMESTAMPTZ NOT NULL,
  reported_date TIMESTAMPTZ DEFAULT now(),
  clinic_id UUID REFERENCES clinics(id),
  location_details TEXT,
  severity incident_severity NOT NULL,
  status incident_status DEFAULT 'draft',
  reported_by UUID NOT NULL REFERENCES user_profiles(id),
  involved_staff JSONB DEFAULT '[]',
  involved_patients JSONB DEFAULT '[]',
  witnesses JSONB DEFAULT '[]',
  immediate_action_taken TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  root_cause_analysis TEXT,
  corrective_actions JSONB DEFAULT '[]',
  assigned_to UUID REFERENCES user_profiles(id),
  resolved_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  clinic_id UUID REFERENCES clinics(id),
  severity TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ANNOUNCEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority announcement_priority DEFAULT 'normal',
  author_id UUID NOT NULL REFERENCES user_profiles(id),
  target_roles JSONB DEFAULT '[]',
  target_clinics JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- =====================================================
-- ONBOARDING
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  for_role user_role,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  days_to_complete INTEGER DEFAULT 7,
  is_required BOOLEAN DEFAULT true,
  assigned_to_role TEXT,
  instructions TEXT,
  completion_criteria TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  template_id UUID REFERENCES onboarding_templates(id),
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES user_profiles(id),
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES user_profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- =====================================================
-- CLINIC METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS clinic_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  patient_visits INTEGER DEFAULT 0,
  revenue NUMERIC(10, 2) DEFAULT 0,
  utilization_rate NUMERIC(5, 2) DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  new_patients INTEGER DEFAULT 0,
  cancellations INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, metric_date)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);
CREATE INDEX IF NOT EXISTS idx_clinics_city ON clinics(city);
CREATE INDEX IF NOT EXISTS idx_clinics_active ON clinics(is_active);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic ON user_profiles(primary_clinic_id);

CREATE INDEX IF NOT EXISTS idx_clinic_access_user ON clinic_access(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_access_clinic ON clinic_access(clinic_id);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_user ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_clinic ON staff_profiles(primary_clinic_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_employee_id ON staff_profiles(employee_id);

CREATE INDEX IF NOT EXISTS idx_academy_content_category ON academy_content(category_id);
CREATE INDEX IF NOT EXISTS idx_academy_content_published ON academy_content(is_published);
CREATE INDEX IF NOT EXISTS idx_academy_content_type ON academy_content(content_type);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_content ON learning_progress(content_id);

CREATE INDEX IF NOT EXISTS idx_policies_active ON policies(is_active);
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);

CREATE INDEX IF NOT EXISTS idx_incident_reports_clinic ON incident_reports(clinic_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_date ON incident_reports(incident_date);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_status ON onboarding_progress(status);

CREATE INDEX IF NOT EXISTS idx_clinic_metrics_clinic_date ON clinic_metrics(clinic_id, metric_date);

-- =====================================================
-- TRIGGERS
-- =====================================================

DO $$
BEGIN
  DROP TRIGGER IF EXISTS clinics_updated_at ON clinics;
  CREATE TRIGGER clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
  CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS staff_profiles_updated_at ON staff_profiles;
  CREATE TRIGGER staff_profiles_updated_at BEFORE UPDATE ON staff_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS academy_content_updated_at ON academy_content;
  CREATE TRIGGER academy_content_updated_at BEFORE UPDATE ON academy_content FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS policies_updated_at ON policies;
  CREATE TRIGGER policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS incident_reports_updated_at ON incident_reports;
  CREATE TRIGGER incident_reports_updated_at BEFORE UPDATE ON incident_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS announcements_updated_at ON announcements;
  CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_metrics ENABLE ROW LEVEL SECURITY;

-- Clinics: Executives see all, others see their assigned clinics
CREATE POLICY "Executives can view all clinics" ON clinics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Users can view their assigned clinics" ON clinics FOR SELECT
  USING (
    id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    ) OR id = (
      SELECT primary_clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- User Profiles: Users can view their own profile and colleagues
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles in their clinics" ON user_profiles FOR SELECT
  USING (
    primary_clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'executive'
    )
  );

CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Staff Profiles: Based on clinic access
CREATE POLICY "Users can view staff in their clinics" ON staff_profiles FOR SELECT
  USING (
    primary_clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    ) OR user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- Academy Content: Everyone can view published content
CREATE POLICY "Users can view published academy content" ON academy_content FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authors and admins can manage content" ON academy_content FOR ALL
  USING (
    author_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- Learning Progress: Users can view and update their own progress
CREATE POLICY "Users can view own learning progress" ON learning_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own learning progress" ON learning_progress FOR ALL
  USING (user_id = auth.uid());

-- Policies: Everyone can view active policies
CREATE POLICY "Users can view active policies" ON policies FOR SELECT
  USING (is_active = true);

-- Policy Acknowledgments: Users manage their own
CREATE POLICY "Users can view own acknowledgments" ON policy_acknowledgments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own acknowledgments" ON policy_acknowledgments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Incident Reports: Clinic-based access
CREATE POLICY "Users can view incidents in their clinics" ON incident_reports FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    ) OR reported_by = auth.uid() OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Users can create incident reports" ON incident_reports FOR INSERT
  WITH CHECK (reported_by = auth.uid());

-- Announcements: Role and clinic-based visibility
CREATE POLICY "Users can view relevant announcements" ON announcements FOR SELECT
  USING (
    is_published = true AND (
      target_roles = '[]'::jsonb OR
      (SELECT role FROM user_profiles WHERE id = auth.uid()) = ANY(
        SELECT jsonb_array_elements_text(target_roles)::user_role
      )
    ) AND (
      target_clinics = '[]'::jsonb OR
      (SELECT primary_clinic_id FROM user_profiles WHERE id = auth.uid()) IN (
        SELECT (jsonb_array_elements_text(target_clinics))::uuid
      )
    )
  );

-- Onboarding: Users see their own tasks
CREATE POLICY "Users can view own onboarding" ON onboarding_progress FOR SELECT
  USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can update assigned onboarding tasks" ON onboarding_progress FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Clinic Metrics: Clinic-based access
CREATE POLICY "Users can view metrics for their clinics" ON clinic_metrics FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_access WHERE user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- Audit Logs: Executives and admins only
CREATE POLICY "Executives and admins can view audit logs" ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );
