-- ═══════════════════════════════════════════════════════════════
-- AIMOS DIGITAL GOVERNANCE & ACCESS CONTROL MODULE
-- Created: February 22, 2026
-- Purpose: Centralized management of digital assets, workspace users, and access control
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- 1. DIGITAL ASSETS REGISTRY
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.digital_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Asset identification
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'domain', 'workspace', 'hosting', 'ads', 'analytics', 
    'crm', 'email', 'social', 'payment', 'other'
  )),
  vendor TEXT NOT NULL, -- Google, Vercel, Meta, etc.
  
  -- Ownership
  primary_owner_id UUID REFERENCES public.user_profiles(id),
  backup_owner_id UUID REFERENCES public.user_profiles(id),
  
  -- Security
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_required BOOLEAN DEFAULT true,
  shared_credentials_allowed BOOLEAN DEFAULT false,
  
  -- Metadata
  account_email TEXT,
  account_identifier TEXT, -- Account ID, customer ID, etc.
  renewal_date DATE,
  cost_monthly DECIMAL(10,2),
  currency TEXT DEFAULT 'CAD',
  
  -- Compliance
  last_audit_date DATE,
  last_audit_by_id UUID REFERENCES public.user_profiles(id),
  audit_status TEXT CHECK (audit_status IN ('compliant', 'needs_review', 'non_compliant', 'pending')),
  audit_notes TEXT,
  
  -- Access
  credentials_vault_reference TEXT, -- Reference to vault entry (not actual credentials)
  recovery_email TEXT,
  recovery_phone TEXT,
  
  -- Documentation
  runbook_url TEXT,
  documentation_url TEXT,
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_critical BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 2. WORKSPACE USERS (Google Workspace, etc.)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.workspace_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_profile_id UUID REFERENCES public.user_profiles(id), -- Link to AIMOS user
  workspace_email TEXT UNIQUE NOT NULL,
  external_user_id TEXT, -- Google Workspace ID, etc.
  
  -- Role & Access
  role_template TEXT NOT NULL, -- executive, manager, clinician, front_desk, billing
  organizational_unit TEXT, -- /AIM/Staff, /AIM/Contractors, etc.
  groups JSONB DEFAULT '[]', -- ["info@", "billing@", "all-staff@"]
  
  -- Security
  mfa_enrolled BOOLEAN DEFAULT false,
  mfa_enforced BOOLEAN DEFAULT true,
  recovery_email TEXT,
  recovery_phone TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  suspended_at TIMESTAMPTZ,
  suspended_by_id UUID REFERENCES public.user_profiles(id),
  suspension_reason TEXT,
  
  -- Provisioning
  provisioned_at TIMESTAMPTZ,
  provisioned_by_id UUID REFERENCES public.user_profiles(id),
  
  -- Offboarding
  offboarded_at TIMESTAMPTZ,
  offboarded_by_id UUID REFERENCES public.user_profiles(id),
  offboarding_checklist_complete BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 3. ROLE TEMPLATES
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.workspace_role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT UNIQUE NOT NULL, -- executive, manager, clinician, etc.
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Default settings
  default_ou TEXT, -- Organizational unit path
  default_groups JSONB DEFAULT '[]', -- Default group memberships
  
  -- Permissions
  permissions JSONB DEFAULT '{}', -- Custom permission mappings
  
  -- Security requirements
  require_mfa BOOLEAN DEFAULT true,
  require_recovery_email BOOLEAN DEFAULT true,
  require_recovery_phone BOOLEAN DEFAULT false,
  
  -- Lifecycle
  auto_offboard_after_days INTEGER, -- Contractors: 90 days
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 4. ACCESS AUDIT LOG (Immutable)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  performed_by_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  performed_by_email TEXT NOT NULL,
  
  -- What
  action TEXT NOT NULL CHECK (action IN (
    'user_created', 'user_suspended', 'user_activated', 'user_deleted',
    'role_changed', 'group_added', 'group_removed',
    'mfa_enforced', 'mfa_reset',
    'asset_added', 'asset_updated', 'asset_deleted',
    'audit_completed', 'credentials_accessed',
    'template_created', 'template_updated',
    'onboarding_started', 'onboarding_completed',
    'offboarding_started', 'offboarding_completed'
  )),
  
  -- Target
  target_type TEXT, -- user, asset, template, etc.
  target_id UUID,
  target_identifier TEXT, -- Email, asset name, etc.
  
  -- Details
  before_state JSONB, -- State before action
  after_state JSONB, -- State after action
  change_summary TEXT,
  
  -- Context
  reason TEXT,
  ticket_reference TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 5. ONBOARDING QUEUE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.onboarding_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- New hire info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  personal_email TEXT,
  phone TEXT,
  
  -- Position
  role_template_id UUID REFERENCES public.workspace_role_templates(id) NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id),
  department TEXT,
  start_date DATE NOT NULL,
  
  -- Manager
  manager_id UUID REFERENCES public.user_profiles(id),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'failed'
  )),
  
  -- Provisioning results
  workspace_user_id UUID REFERENCES public.workspace_users(id),
  workspace_email TEXT,
  provisioning_error TEXT,
  
  -- Checklist
  account_created BOOLEAN DEFAULT false,
  groups_assigned BOOLEAN DEFAULT false,
  mfa_pending BOOLEAN DEFAULT true,
  welcome_email_sent BOOLEAN DEFAULT false,
  equipment_assigned BOOLEAN DEFAULT false,
  
  -- Workflow
  requested_by_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.user_profiles(id),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 6. OFFBOARDING QUEUE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.offboarding_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User being offboarded
  workspace_user_id UUID REFERENCES public.workspace_users(id) NOT NULL,
  user_email TEXT NOT NULL,
  
  -- Exit info
  last_day DATE NOT NULL,
  offboarding_type TEXT CHECK (offboarding_type IN (
    'voluntary', 'involuntary', 'contract_end', 'other'
  )),
  reason TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed'
  )),
  
  -- Checklist
  account_suspended BOOLEAN DEFAULT false,
  groups_removed BOOLEAN DEFAULT false,
  emails_forwarded BOOLEAN DEFAULT false,
  data_transferred BOOLEAN DEFAULT false,
  equipment_returned BOOLEAN DEFAULT false,
  access_revoked BOOLEAN DEFAULT false,
  
  -- Workflow
  initiated_by_id UUID REFERENCES public.user_profiles(id) NOT NULL,
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by_id UUID REFERENCES public.user_profiles(id),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 7. INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

-- Digital assets
CREATE INDEX idx_digital_assets_type ON public.digital_assets(asset_type);
CREATE INDEX idx_digital_assets_vendor ON public.digital_assets(vendor);
CREATE INDEX idx_digital_assets_primary_owner ON public.digital_assets(primary_owner_id);
CREATE INDEX idx_digital_assets_audit_status ON public.digital_assets(audit_status);
CREATE INDEX idx_digital_assets_active ON public.digital_assets(is_active);

-- Workspace users
CREATE INDEX idx_workspace_users_profile ON public.workspace_users(user_profile_id);
CREATE INDEX idx_workspace_users_email ON public.workspace_users(workspace_email);
CREATE INDEX idx_workspace_users_status ON public.workspace_users(status);
CREATE INDEX idx_workspace_users_mfa ON public.workspace_users(mfa_enrolled);
CREATE INDEX idx_workspace_users_role ON public.workspace_users(role_template);

-- Audit log
CREATE INDEX idx_access_audit_log_performed_by ON public.access_audit_log(performed_by_id);
CREATE INDEX idx_access_audit_log_action ON public.access_audit_log(action);
CREATE INDEX idx_access_audit_log_target ON public.access_audit_log(target_type, target_id);
CREATE INDEX idx_access_audit_log_created ON public.access_audit_log(created_at DESC);

-- Onboarding queue
CREATE INDEX idx_onboarding_queue_status ON public.onboarding_queue(status);
CREATE INDEX idx_onboarding_queue_start_date ON public.onboarding_queue(start_date);
CREATE INDEX idx_onboarding_queue_role ON public.onboarding_queue(role_template_id);

-- Offboarding queue
CREATE INDEX idx_offboarding_queue_status ON public.offboarding_queue(status);
CREATE INDEX idx_offboarding_queue_last_day ON public.offboarding_queue(last_day);
CREATE INDEX idx_offboarding_queue_user ON public.offboarding_queue(workspace_user_id);

-- ═══════════════════════════════════════════════════════════════
-- 8. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Function to get MFA compliance percentage
CREATE OR REPLACE FUNCTION get_mfa_compliance_percentage()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 100
        ELSE ROUND(
          (COUNT(*) FILTER (WHERE mfa_enrolled = true)::DECIMAL / COUNT(*)::DECIMAL) * 100,
          2
        )
      END
    FROM workspace_users
    WHERE status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get admin count
CREATE OR REPLACE FUNCTION get_admin_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM workspace_users
    WHERE status = 'active'
    AND (role_template = 'executive' OR 'admin' = ANY(SELECT jsonb_array_elements_text(groups)))
  );
END;
$$ LANGUAGE plpgsql;

-- Function to log audit action
CREATE OR REPLACE FUNCTION log_audit_action(
  p_performed_by_id UUID,
  p_performed_by_email TEXT,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_identifier TEXT,
  p_before_state JSONB,
  p_after_state JSONB,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO access_audit_log (
    performed_by_id,
    performed_by_email,
    action,
    target_type,
    target_id,
    target_identifier,
    before_state,
    after_state,
    change_summary,
    reason
  ) VALUES (
    p_performed_by_id,
    p_performed_by_email,
    p_action,
    p_target_type,
    p_target_id,
    p_target_identifier,
    p_before_state,
    p_after_state,
    format('Action: %s on %s (%s)', p_action, p_target_type, p_target_identifier),
    p_reason
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- 9. ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.digital_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_role_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offboarding_queue ENABLE ROW LEVEL SECURITY;

-- Digital assets: Executive-level only
CREATE POLICY "Executives can manage digital assets" ON public.digital_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'executive'
    )
  );

-- Workspace users: Executive-level only
CREATE POLICY "Executives can manage workspace users" ON public.workspace_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'executive'
    )
  );

-- Role templates: Executive-level view all, edit
CREATE POLICY "Authenticated can view role templates" ON public.workspace_role_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Executives can manage role templates" ON public.workspace_role_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'executive'
    )
  );

-- Audit log: Executives can view all, inserts allowed via function only
CREATE POLICY "Executives can view audit log" ON public.access_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'executive'
    )
  );

-- Onboarding queue: Executive and managers
CREATE POLICY "Executives and managers can manage onboarding" ON public.onboarding_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('executive', 'clinic_manager')
    )
  );

-- Offboarding queue: Executive only
CREATE POLICY "Executives can manage offboarding" ON public.offboarding_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'executive'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 10. SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- Seed role templates
INSERT INTO public.workspace_role_templates (name, display_name, description, default_ou, default_groups, require_mfa) VALUES
  ('executive', 'Executive', 'C-level executives with full access', '/AIM/Leadership', '["all-staff@aimrehab.ca", "leadership@aimrehab.ca"]', true),
  ('clinic_manager', 'Clinic Manager', 'Clinic managers with operational access', '/AIM/Management', '["all-staff@aimrehab.ca", "managers@aimrehab.ca"]', true),
  ('physiotherapist', 'Physiotherapist', 'Licensed physiotherapists', '/AIM/Clinical', '["all-staff@aimrehab.ca", "clinical@aimrehab.ca"]', true),
  ('front_desk', 'Front Desk', 'Reception and front desk staff', '/AIM/Administrative', '["all-staff@aimrehab.ca", "info@aimrehab.ca"]', true),
  ('billing', 'Billing Coordinator', 'Billing and payment processing', '/AIM/Administrative', '["all-staff@aimrehab.ca", "billing@aimrehab.ca"]', true),
  ('contractor', 'Contractor', 'Temporary contractors', '/AIM/Contractors', '["contractors@aimrehab.ca"]', true)
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- DEPLOYMENT COMPLETE
-- ═══════════════════════════════════════════════════════════════

SELECT 'Digital Governance Module Created Successfully' as status,
       (SELECT COUNT(*) FROM workspace_role_templates) as role_templates_count;
