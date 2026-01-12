/*
  # Intranet Chunk 2: Dashboards, SOP Hub, and Forms

  ## Summary
  Extends the intranet system with three major modules:
  1. Dashboard widgets and personalized layouts
  2. Standard Operating Procedures (SOP) hub with version control
  3. Dynamic forms builder and submission system

  ## New Tables

  ### Dashboard Module
    - `dashboard_widgets` - Widget definitions and configurations
    - `user_dashboard_layouts` - Personalized dashboard layouts per user

  ### SOP Hub Module
    - `sop_categories` - Organize SOPs by department/function
    - `sops` - Standard Operating Procedures master records
    - `sop_versions` - Version control for SOP documents
    - `sop_reviews` - Staff review and acknowledgment tracking

  ### Forms Module
    - `form_templates` - Reusable form definitions
    - `form_fields` - Field definitions (JSON schema approach)
    - `form_submissions` - Completed form responses
    - `form_field_responses` - Individual field values

  ## Security
    - RLS enabled on all tables
    - Role-based access for creation/editing
    - Users can view content relevant to their role and clinic
    - Form submissions are private to submitter and managers
*/

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE widget_type AS ENUM (
    'metrics',
    'tasks',
    'announcements',
    'forms',
    'reports',
    'quick_links',
    'calendar',
    'sop_quick_access'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sop_status AS ENUM ('draft', 'review', 'approved', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE form_field_type AS ENUM (
    'text',
    'textarea',
    'number',
    'date',
    'datetime',
    'select',
    'multiselect',
    'radio',
    'checkbox',
    'file_upload',
    'signature',
    'rating',
    'email',
    'phone',
    'url'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE form_status AS ENUM ('draft', 'active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'in_review', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- DASHBOARD WIDGETS
-- =====================================================

CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  widget_type widget_type NOT NULL,
  configuration JSONB DEFAULT '{}',
  default_size TEXT DEFAULT 'medium',
  is_system BOOLEAN DEFAULT false,
  available_for_roles JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  layout_name TEXT DEFAULT 'default',
  widgets JSONB DEFAULT '[]',
  layout_config JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, layout_name)
);

-- =====================================================
-- SOP HUB
-- =====================================================

CREATE TABLE IF NOT EXISTS sop_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES sop_categories(id),
  department TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sop_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category_id UUID REFERENCES sop_categories(id),
  purpose TEXT,
  scope TEXT,
  owner_id UUID REFERENCES user_profiles(id),
  status sop_status DEFAULT 'draft',
  current_version_id UUID,
  requires_review BOOLEAN DEFAULT true,
  review_frequency_days INTEGER DEFAULT 365,
  next_review_date DATE,
  applicable_roles JSONB DEFAULT '[]',
  applicable_clinics JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sop_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  content TEXT NOT NULL,
  change_summary TEXT,
  attachments JSONB DEFAULT '[]',
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  effective_date DATE,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sop_id, version_number)
);

CREATE TABLE IF NOT EXISTS sop_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sop_id UUID NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
  version_id UUID REFERENCES sop_versions(id),
  reviewer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reviewed_at TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT true,
  feedback TEXT,
  UNIQUE(sop_id, reviewer_id, version_id)
);

-- Add foreign key to link current version
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sops_current_version_fkey'
  ) THEN
    ALTER TABLE sops
    ADD CONSTRAINT sops_current_version_fkey
    FOREIGN KEY (current_version_id)
    REFERENCES sop_versions(id);
  END IF;
END $$;

-- =====================================================
-- FORMS SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status form_status DEFAULT 'draft',
  icon TEXT,
  allows_multiple_submissions BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  approval_workflow JSONB DEFAULT '[]',
  available_for_roles JSONB DEFAULT '[]',
  available_for_clinics JSONB DEFAULT '[]',
  notification_settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  is_public BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type form_field_type NOT NULL,
  placeholder TEXT,
  help_text TEXT,
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}',
  options JSONB DEFAULT '[]',
  default_value TEXT,
  conditional_logic JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  grid_column_span INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  submission_number TEXT UNIQUE NOT NULL,
  status submission_status DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  approval_notes TEXT,
  clinic_id UUID REFERENCES clinics(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_field_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  field_value TEXT,
  file_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(submission_id, field_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_active ON dashboard_widgets(is_active);

CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_user ON user_dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_default ON user_dashboard_layouts(user_id, is_default);

CREATE INDEX IF NOT EXISTS idx_sop_categories_parent ON sop_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_sop_categories_department ON sop_categories(department);

CREATE INDEX IF NOT EXISTS idx_sops_category ON sops(category_id);
CREATE INDEX IF NOT EXISTS idx_sops_status ON sops(status);
CREATE INDEX IF NOT EXISTS idx_sops_owner ON sops(owner_id);
CREATE INDEX IF NOT EXISTS idx_sops_number ON sops(sop_number);

CREATE INDEX IF NOT EXISTS idx_sop_versions_sop ON sop_versions(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_versions_created ON sop_versions(created_at);

CREATE INDEX IF NOT EXISTS idx_sop_reviews_sop ON sop_reviews(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_reviews_reviewer ON sop_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_form_templates_status ON form_templates(status);
CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category);
CREATE INDEX IF NOT EXISTS idx_form_templates_created_by ON form_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_form_fields_form ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_sort ON form_fields(form_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_clinic ON form_submissions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_number ON form_submissions(submission_number);

CREATE INDEX IF NOT EXISTS idx_form_field_responses_submission ON form_field_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_form_field_responses_field ON form_field_responses(field_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

DO $$
BEGIN
  DROP TRIGGER IF EXISTS dashboard_widgets_updated_at ON dashboard_widgets;
  CREATE TRIGGER dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS user_dashboard_layouts_updated_at ON user_dashboard_layouts;
  CREATE TRIGGER user_dashboard_layouts_updated_at BEFORE UPDATE ON user_dashboard_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS sop_categories_updated_at ON sop_categories;
  CREATE TRIGGER sop_categories_updated_at BEFORE UPDATE ON sop_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS sops_updated_at ON sops;
  CREATE TRIGGER sops_updated_at BEFORE UPDATE ON sops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS form_templates_updated_at ON form_templates;
  CREATE TRIGGER form_templates_updated_at BEFORE UPDATE ON form_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS form_fields_updated_at ON form_fields;
  CREATE TRIGGER form_fields_updated_at BEFORE UPDATE ON form_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS form_submissions_updated_at ON form_submissions;
  CREATE TRIGGER form_submissions_updated_at BEFORE UPDATE ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS form_field_responses_updated_at ON form_field_responses;
  CREATE TRIGGER form_field_responses_updated_at BEFORE UPDATE ON form_field_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_responses ENABLE ROW LEVEL SECURITY;

-- Dashboard Widgets: Everyone can view active widgets available to their role
CREATE POLICY "Users can view available widgets"
  ON dashboard_widgets FOR SELECT
  USING (
    is_active = true AND (
      available_for_roles = '[]'::jsonb OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role::text = ANY(SELECT jsonb_array_elements_text(available_for_roles))
      )
    )
  );

CREATE POLICY "Admins can manage widgets"
  ON dashboard_widgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin')
    )
  );

-- User Dashboard Layouts: Users manage their own layouts
CREATE POLICY "Users can view own dashboard layouts"
  ON user_dashboard_layouts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own dashboard layouts"
  ON user_dashboard_layouts FOR ALL
  USING (user_id = auth.uid());

-- SOP Categories: Everyone can view active categories
CREATE POLICY "Users can view active SOP categories"
  ON sop_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage SOP categories"
  ON sop_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- SOPs: Users can view approved SOPs applicable to their role
CREATE POLICY "Users can view approved SOPs"
  ON sops FOR SELECT
  USING (
    status = 'approved' AND (
      applicable_roles = '[]'::jsonb OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role::text = ANY(SELECT jsonb_array_elements_text(applicable_roles))
      )
    )
  );

CREATE POLICY "Managers can manage SOPs"
  ON sops FOR ALL
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- SOP Versions: Users can view versions of SOPs they can access
CREATE POLICY "Users can view SOP versions"
  ON sop_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sops
      WHERE sops.id = sop_versions.sop_id
      AND (
        sops.status = 'approved' OR
        sops.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
        )
      )
    )
  );

CREATE POLICY "Owners and managers can create SOP versions"
  ON sop_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sops
      WHERE sops.id = sop_versions.sop_id
      AND (
        sops.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
        )
      )
    )
  );

-- SOP Reviews: Users can view and create their own reviews
CREATE POLICY "Users can view own SOP reviews"
  ON sop_reviews FOR SELECT
  USING (reviewer_id = auth.uid());

CREATE POLICY "Managers can view all SOP reviews"
  ON sop_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Users can create SOP reviews"
  ON sop_reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- Form Templates: Users can view active forms available to their role
CREATE POLICY "Users can view available forms"
  ON form_templates FOR SELECT
  USING (
    status = 'active' AND (
      is_public = true OR
      available_for_roles = '[]'::jsonb OR
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role::text = ANY(SELECT jsonb_array_elements_text(available_for_roles))
      )
    )
  );

CREATE POLICY "Form creators can view own forms"
  ON form_templates FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Managers can manage forms"
  ON form_templates FOR ALL
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Form Fields: Users can view fields of forms they can access
CREATE POLICY "Users can view form fields"
  ON form_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM form_templates
      WHERE form_templates.id = form_fields.form_id
      AND (
        form_templates.status = 'active' OR
        form_templates.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
        )
      )
    )
  );

CREATE POLICY "Form creators can manage fields"
  ON form_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM form_templates
      WHERE form_templates.id = form_fields.form_id
      AND (
        form_templates.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
        )
      )
    )
  );

-- Form Submissions: Users can view own submissions, managers can view all
CREATE POLICY "Users can view own submissions"
  ON form_submissions FOR SELECT
  USING (submitted_by = auth.uid());

CREATE POLICY "Managers can view all submissions"
  ON form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Users can create submissions"
  ON form_submissions FOR INSERT
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Users can update own draft submissions"
  ON form_submissions FOR UPDATE
  USING (submitted_by = auth.uid() AND status = 'draft')
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Managers can update submissions for approval"
  ON form_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Form Field Responses: Users can view responses of submissions they can access
CREATE POLICY "Users can view own submission responses"
  ON form_field_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM form_submissions
      WHERE form_submissions.id = form_field_responses.submission_id
      AND form_submissions.submitted_by = auth.uid()
    )
  );

CREATE POLICY "Managers can view all responses"
  ON form_field_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Users can manage responses for own submissions"
  ON form_field_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM form_submissions
      WHERE form_submissions.id = form_field_responses.submission_id
      AND form_submissions.submitted_by = auth.uid()
    )
  );
