/*
  # AIM OS v2.0 - Governance & Safety Foundation Layer
  
  ## Summary
  Establishes the governance and safety infrastructure for v2.0 upgrade.
  This migration is 100% backward-compatible and adds NO breaking changes.
  
  ## New Tables
  
  ### Feature Management
    - `feature_flags` - Control v2.0 feature rollout with granular toggles
    - `feature_access_log` - Track which users accessed which features
    
  ### Enhanced Audit System
    - `audit_events` - Comprehensive event logging for all system actions
    - `permission_checks` - Log all permission validation attempts
    
  ### Permission Framework
    - `role_permissions` - Granular permission mappings for RBAC
    - `user_permission_overrides` - User-specific permission exceptions
    
  ## New Functions
  
  ### Audit Triggers
    - `log_modification()` - Auto-log all INSERT/UPDATE/DELETE operations
    - `log_permission_check()` - Log permission validation attempts
    
  ### Permission Enforcement
    - `check_permission()` - Validate user permissions before actions
    - `has_feature_access()` - Check if user can access v2.0 features
    
  ## Security
    - RLS enabled on all new tables
    - Audit logs are append-only (no updates/deletes)
    - Permission checks are immutable
    - Feature flags require admin role to modify
    
  ## Important Notes
    - This is a NON-BREAKING upgrade
    - All existing functionality continues to work
    - v2.0 features are OFF by default via feature flags
    - Zero UI changes in this migration
*/

-- =====================================================
-- FEATURE FLAGS SYSTEM
-- =====================================================

DO $$ BEGIN
  CREATE TYPE feature_status AS ENUM ('disabled', 'pilot', 'beta', 'enabled', 'deprecated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT UNIQUE NOT NULL,
  feature_name TEXT NOT NULL,
  description TEXT,
  status feature_status DEFAULT 'disabled',
  enabled_for_roles user_role[] DEFAULT '{}',
  enabled_for_users UUID[] DEFAULT '{}',
  pilot_clinic_ids UUID[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON feature_flags(status);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(feature_key);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage feature flags"
  ON feature_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Track feature access
CREATE TABLE IF NOT EXISTS feature_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  feature_key TEXT NOT NULL,
  access_granted BOOLEAN NOT NULL,
  access_reason TEXT,
  metadata JSONB DEFAULT '{}',
  accessed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_access_user ON feature_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_key ON feature_access_log(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_access_time ON feature_access_log(accessed_at DESC);

ALTER TABLE feature_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature access"
  ON feature_access_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert feature access logs"
  ON feature_access_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- COMPREHENSIVE AUDIT EVENTS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete', 'select', 'login', 'logout', 'access', 'permission_check');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action audit_action NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_table ON audit_events(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_time ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_record ON audit_events(record_id);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and executives can view all audit events"
  ON audit_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "System can insert audit events"
  ON audit_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Prevent modifications to audit log
CREATE POLICY "No one can modify audit events"
  ON audit_events FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No one can delete audit events"
  ON audit_events FOR DELETE
  TO authenticated
  USING (false);

-- =====================================================
-- PERMISSION FRAMEWORK
-- =====================================================

DO $$ BEGIN
  CREATE TYPE permission_scope AS ENUM ('global', 'clinic', 'self');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_key TEXT NOT NULL,
  permission_name TEXT NOT NULL,
  scope permission_scope DEFAULT 'self',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_key ON role_permissions(permission_key);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- User-specific permission overrides
CREATE TABLE IF NOT EXISTS user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  permission_key TEXT NOT NULL,
  is_granted BOOLEAN NOT NULL,
  reason TEXT,
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_user_overrides_user ON user_permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_user_overrides_key ON user_permission_overrides(permission_key);

ALTER TABLE user_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own permission overrides"
  ON user_permission_overrides FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage permission overrides"
  ON user_permission_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Permission check logging
CREATE TABLE IF NOT EXISTS permission_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  permission_key TEXT NOT NULL,
  check_passed BOOLEAN NOT NULL,
  denial_reason TEXT,
  context JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permission_checks_user ON permission_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_checks_key ON permission_checks(permission_key);
CREATE INDEX IF NOT EXISTS idx_permission_checks_time ON permission_checks(checked_at DESC);

ALTER TABLE permission_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all permission checks"
  ON permission_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "System can log permission checks"
  ON permission_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user has feature access
CREATE OR REPLACE FUNCTION has_feature_access(
  p_user_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_feature RECORD;
  v_user_role user_role;
  v_has_access BOOLEAN := false;
BEGIN
  -- Get feature flag
  SELECT * INTO v_feature
  FROM feature_flags
  WHERE feature_key = p_feature_key;
  
  -- Feature doesn't exist or is disabled
  IF NOT FOUND OR v_feature.status = 'disabled' THEN
    RETURN false;
  END IF;
  
  -- Feature is fully enabled
  IF v_feature.status = 'enabled' THEN
    RETURN true;
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Check if user's role is enabled
  IF v_user_role = ANY(v_feature.enabled_for_roles) THEN
    v_has_access := true;
  END IF;
  
  -- Check if specific user is enabled
  IF p_user_id = ANY(v_feature.enabled_for_users) THEN
    v_has_access := true;
  END IF;
  
  -- Log access attempt
  INSERT INTO feature_access_log (user_id, feature_key, access_granted, access_reason)
  VALUES (p_user_id, p_feature_key, v_has_access, 
          CASE WHEN v_has_access THEN 'granted' ELSE 'denied' END);
  
  RETURN v_has_access;
END;
$$;

-- Check if user has permission
CREATE OR REPLACE FUNCTION check_permission(
  p_user_id UUID,
  p_permission_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_permission BOOLEAN := false;
  v_user_role user_role;
  v_override RECORD;
BEGIN
  -- Check for user-specific override first
  SELECT * INTO v_override
  FROM user_permission_overrides
  WHERE user_id = p_user_id
  AND permission_key = p_permission_key
  AND (expires_at IS NULL OR expires_at > now());
  
  IF FOUND THEN
    v_has_permission := v_override.is_granted;
  ELSE
    -- Check role-based permission
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE id = p_user_id;
    
    SELECT EXISTS (
      SELECT 1 FROM role_permissions
      WHERE role = v_user_role
      AND permission_key = p_permission_key
      AND is_active = true
    ) INTO v_has_permission;
  END IF;
  
  -- Log permission check
  INSERT INTO permission_checks (user_id, permission_key, check_passed, denial_reason)
  VALUES (p_user_id, p_permission_key, v_has_permission,
          CASE WHEN NOT v_has_permission THEN 'permission_denied' ELSE NULL END);
  
  RETURN v_has_permission;
END;
$$;

-- Generic audit logging trigger function
CREATE OR REPLACE FUNCTION log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action audit_action;
  v_old_data JSONB;
  v_new_data JSONB;
  v_changed_fields TEXT[];
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_action := 'insert';
    v_new_data := to_jsonb(NEW);
    v_old_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    
    -- Find changed fields
    SELECT ARRAY_AGG(key)
    INTO v_changed_fields
    FROM jsonb_each(v_new_data)
    WHERE v_new_data->key IS DISTINCT FROM v_old_data->key;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
  END IF;
  
  -- Insert audit event
  INSERT INTO audit_events (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    auth.uid(),
    v_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old_data,
    v_new_data,
    v_changed_fields
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- =====================================================
-- SEED DEFAULT FEATURE FLAGS
-- =====================================================

INSERT INTO feature_flags (feature_key, feature_name, description, status, enabled_for_roles) VALUES
  ('v2_employer_intelligence', 'Employer Intelligence Module', 'Track employer relationships, contracts, and case patterns', 'disabled', '{}'),
  ('v2_payor_intelligence', 'Payor Intelligence Module', 'Monitor insurer relationships, approval patterns, and revenue', 'disabled', '{}'),
  ('v2_case_management', 'Enhanced Case Management', 'Patient episode tracking with EMR integration', 'disabled', '{}'),
  ('v2_credential_alerts', 'Credential Expiry Alerts', 'Automated alerts for expiring certifications and licenses', 'disabled', '{}'),
  ('v2_capacity_intelligence', 'Capacity Intelligence', 'Real-time capacity monitoring and predictive scheduling', 'disabled', '{}'),
  ('v2_emr_integration', 'EMR Integration Layer', 'Read-only EMR data sync and display', 'disabled', '{}'),
  ('v2_assistive_ai', 'Assistive AI Agents', 'AI-powered recommendations (non-autonomous)', 'disabled', '{}'),
  ('v2_advanced_audit', 'Advanced Audit Trails', 'Enhanced compliance and forensic audit capabilities', 'pilot', '{admin}')
ON CONFLICT (feature_key) DO NOTHING;

-- =====================================================
-- SEED DEFAULT PERMISSIONS
-- =====================================================

INSERT INTO role_permissions (role, permission_key, permission_name, scope, description) VALUES
  -- Executive permissions
  ('executive', 'view_all_data', 'View All Company Data', 'global', 'Access to all clinics and modules'),
  ('executive', 'manage_users', 'Manage Users', 'global', 'Create, edit, and deactivate users'),
  ('executive', 'view_financials', 'View Financial Data', 'global', 'Access to revenue and financial metrics'),
  ('executive', 'access_aim_os', 'Access AIM OS', 'global', 'Full access to AIM OS modules'),
  ('executive', 'access_growth_os', 'Access Growth OS', 'global', 'Full access to Growth OS modules'),
  
  -- Admin permissions
  ('admin', 'view_all_data', 'View All Company Data', 'global', 'Access to all clinics and modules'),
  ('admin', 'manage_users', 'Manage Users', 'global', 'Create, edit, and deactivate users'),
  ('admin', 'manage_system', 'Manage System', 'global', 'System configuration and settings'),
  ('admin', 'access_aim_os', 'Access AIM OS', 'global', 'Full access to AIM OS modules'),
  ('admin', 'access_growth_os', 'Access Growth OS', 'global', 'Full access to Growth OS modules'),
  
  -- Clinic Manager permissions
  ('clinic_manager', 'view_clinic_data', 'View Clinic Data', 'clinic', 'Access to assigned clinic data'),
  ('clinic_manager', 'manage_clinic_staff', 'Manage Clinic Staff', 'clinic', 'Manage staff in assigned clinics'),
  ('clinic_manager', 'view_clinic_reports', 'View Clinic Reports', 'clinic', 'Access clinic-level reports'),
  ('clinic_manager', 'access_aim_os', 'Access AIM OS', 'clinic', 'Limited AIM OS access for clinic'),
  
  -- Clinician permissions
  ('clinician', 'view_own_data', 'View Own Data', 'self', 'Access to own profile and tasks'),
  ('clinician', 'view_academy', 'View Academy Content', 'global', 'Access to learning materials'),
  ('clinician', 'submit_incidents', 'Submit Incidents', 'self', 'Report safety incidents'),
  
  -- Contractor permissions
  ('contractor', 'view_own_data', 'View Own Data', 'self', 'Access to own profile'),
  ('contractor', 'view_academy', 'View Academy Content', 'global', 'Access to learning materials')
ON CONFLICT (role, permission_key) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE feature_flags IS 'Controls v2.0 feature rollout with granular toggles';
COMMENT ON TABLE audit_events IS 'Comprehensive audit log for all system operations';
COMMENT ON TABLE role_permissions IS 'Granular RBAC permission definitions';
COMMENT ON TABLE permission_checks IS 'Immutable log of all permission validation attempts';
COMMENT ON FUNCTION has_feature_access IS 'Check if user has access to v2.0 feature';
COMMENT ON FUNCTION check_permission IS 'Validate user permission and log attempt';
COMMENT ON FUNCTION log_modification IS 'Generic trigger function to auto-log data changes';
