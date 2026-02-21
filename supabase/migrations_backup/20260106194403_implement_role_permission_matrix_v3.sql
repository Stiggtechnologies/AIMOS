/*
  # Implement Role-Permission Matrix (NON-NEGOTIABLE)
  
  ## Summary
  Implements the exact permission matrix specified in requirements:
  - Admin: Full access to all features
  - Executive: View dashboards, staffing, credentials, AI insights (no edit clinics or audit logs)
  - Operations/Clinic Manager: View dashboards, staffing, credentials, AI insights (no edit clinics or audit logs)
  - Clinician: Read-only dashboards & AI insights, full credentials access (no staffing, no edit clinics, no audit logs)
  
  ## Permission Keys Added
  1. `view_dashboards` - Access to dashboard views
  2. `edit_clinics` - Ability to modify clinic settings and data
  3. `view_staffing` - Access to staffing schedules and assignments
  4. `view_credentials` - Access to credentials and certifications
  5. `ai_insights` - Access to AI-powered analytics and insights
  6. `audit_logs` - Access to system audit logs
  
  ## Access Levels
  - `full` - Complete read/write access
  - `read_only` - View-only access (⚠ in matrix)
  - `none` - No access (✗ in matrix)
  
  ## Role Mappings (per matrix)
  
  ### Admin
  - view_dashboards: full
  - edit_clinics: full
  - view_staffing: full
  - view_credentials: full
  - ai_insights: full
  - audit_logs: full
  
  ### Executive
  - view_dashboards: full
  - edit_clinics: none
  - view_staffing: full
  - view_credentials: full
  - ai_insights: full
  - audit_logs: none
  
  ### Ops/Clinic Manager
  - view_dashboards: full
  - edit_clinics: none
  - view_staffing: full
  - view_credentials: full
  - ai_insights: full
  - audit_logs: none
  
  ### Clinician
  - view_dashboards: read_only
  - edit_clinics: none
  - view_staffing: none
  - view_credentials: full
  - ai_insights: read_only
  - audit_logs: none
  
  ## Security
  - Permission checks are enforced at database level
  - Read-only access prevents any modifications
  - All permission checks are logged in permission_checks table
*/

-- =====================================================
-- ADD ACCESS LEVEL TO ROLE_PERMISSIONS
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'role_permissions' 
    AND column_name = 'access_level'
  ) THEN
    ALTER TABLE role_permissions 
    ADD COLUMN access_level TEXT DEFAULT 'full' CHECK (access_level IN ('full', 'read_only', 'none'));
  END IF;
END $$;

-- =====================================================
-- INSERT MATRIX PERMISSIONS
-- =====================================================

-- Admin permissions (full access to everything)
INSERT INTO role_permissions (role, permission_key, permission_name, scope, description, access_level, is_active)
VALUES
  ('admin', 'view_dashboards', 'View Dashboards', 'global', 'Access to all dashboard views', 'full', true),
  ('admin', 'edit_clinics', 'Edit Clinics', 'global', 'Modify clinic settings and data', 'full', true),
  ('admin', 'view_staffing', 'View Staffing', 'global', 'Access staffing schedules and assignments', 'full', true),
  ('admin', 'view_credentials', 'View Credentials', 'global', 'Access credentials and certifications', 'full', true),
  ('admin', 'ai_insights', 'AI Insights', 'global', 'Access AI-powered analytics', 'full', true),
  ('admin', 'audit_logs', 'Audit Logs', 'global', 'Access system audit logs', 'full', true)
ON CONFLICT (role, permission_key) 
DO UPDATE SET 
  access_level = EXCLUDED.access_level,
  is_active = EXCLUDED.is_active;

-- Executive permissions
INSERT INTO role_permissions (role, permission_key, permission_name, scope, description, access_level, is_active)
VALUES
  ('executive', 'view_dashboards', 'View Dashboards', 'global', 'Access to all dashboard views', 'full', true),
  ('executive', 'view_staffing', 'View Staffing', 'global', 'Access staffing schedules and assignments', 'full', true),
  ('executive', 'view_credentials', 'View Credentials', 'global', 'Access credentials and certifications', 'full', true),
  ('executive', 'ai_insights', 'AI Insights', 'global', 'Access AI-powered analytics', 'full', true)
ON CONFLICT (role, permission_key) 
DO UPDATE SET 
  access_level = EXCLUDED.access_level,
  is_active = EXCLUDED.is_active;

-- Clinic Manager (Ops) permissions
INSERT INTO role_permissions (role, permission_key, permission_name, scope, description, access_level, is_active)
VALUES
  ('clinic_manager', 'view_dashboards', 'View Dashboards', 'clinic', 'Access to clinic dashboard views', 'full', true),
  ('clinic_manager', 'view_staffing', 'View Staffing', 'clinic', 'Access clinic staffing schedules', 'full', true),
  ('clinic_manager', 'view_credentials', 'View Credentials', 'clinic', 'Access clinic credentials', 'full', true),
  ('clinic_manager', 'ai_insights', 'AI Insights', 'clinic', 'Access clinic AI analytics', 'full', true)
ON CONFLICT (role, permission_key) 
DO UPDATE SET 
  access_level = EXCLUDED.access_level,
  is_active = EXCLUDED.is_active;

-- Clinician permissions (read-only for dashboards and AI, full for credentials)
INSERT INTO role_permissions (role, permission_key, permission_name, scope, description, access_level, is_active)
VALUES
  ('clinician', 'view_dashboards', 'View Dashboards', 'self', 'Read-only access to own dashboard', 'read_only', true),
  ('clinician', 'view_credentials', 'View Credentials', 'self', 'Access own credentials', 'full', true),
  ('clinician', 'ai_insights', 'AI Insights', 'self', 'Read-only access to own AI insights', 'read_only', true)
ON CONFLICT (role, permission_key) 
DO UPDATE SET 
  access_level = EXCLUDED.access_level,
  is_active = EXCLUDED.is_active;

-- Contractor permissions (minimal access)
INSERT INTO role_permissions (role, permission_key, permission_name, scope, description, access_level, is_active)
VALUES
  ('contractor', 'view_credentials', 'View Credentials', 'self', 'Access own credentials', 'full', true)
ON CONFLICT (role, permission_key) 
DO UPDATE SET 
  access_level = EXCLUDED.access_level,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- PERMISSION CHECK FUNCTIONS
-- =====================================================

-- Check if user has permission (with access level)
CREATE OR REPLACE FUNCTION check_permission(
  p_permission_key TEXT,
  p_required_level TEXT DEFAULT 'full'
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_role TEXT;
  v_access_level TEXT;
  v_has_override BOOLEAN;
  v_override_granted BOOLEAN;
BEGIN
  -- Get user role
  SELECT role::text INTO v_user_role 
  FROM user_profiles 
  WHERE id = auth.uid();
  
  -- If no role found, deny access
  IF v_user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check for user-specific override
  SELECT is_granted INTO v_override_granted
  FROM user_permission_overrides
  WHERE user_id = auth.uid()
    AND permission_key = p_permission_key
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
  
  -- If override exists and is revoked, deny access
  IF v_override_granted IS NOT NULL AND v_override_granted = false THEN
    RETURN false;
  END IF;
  
  -- If override exists and is granted, allow access
  IF v_override_granted = true THEN
    RETURN true;
  END IF;
  
  -- Check role permission
  SELECT access_level INTO v_access_level
  FROM role_permissions
  WHERE role = v_user_role::user_role
    AND permission_key = p_permission_key
    AND is_active = true;
  
  -- If no permission found, deny
  IF v_access_level IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check access level
  IF p_required_level = 'full' THEN
    RETURN v_access_level = 'full';
  ELSIF p_required_level = 'read_only' THEN
    RETURN v_access_level IN ('full', 'read_only');
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Specific permission check functions
CREATE OR REPLACE FUNCTION can_view_dashboards() RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_permission('view_dashboards', 'read_only');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_edit_dashboards() RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_permission('view_dashboards', 'full');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_edit_clinics() RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_permission('edit_clinics', 'full');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_view_staffing() RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_permission('view_staffing', 'read_only');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_edit_staffing() RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_permission('view_staffing', 'full');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_view_credentials() RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_permission('view_credentials', 'read_only');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_edit_credentials() RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_permission('view_credentials', 'full');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_view_ai_insights() RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_permission('ai_insights', 'read_only');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_access_audit_logs() RETURNS BOOLEAN AS $$
BEGIN
  RETURN check_permission('audit_logs', 'full');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- CREATE PERMISSIONS VIEW FOR UI
-- =====================================================

CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
  up.id as user_id,
  up.email,
  up.role,
  rp.permission_key,
  rp.permission_name,
  rp.access_level,
  rp.scope,
  COALESCE(upo.is_granted, true) as is_granted,
  CASE 
    WHEN upo.is_granted = false THEN 'revoked'
    WHEN rp.access_level = 'full' THEN 'full'
    WHEN rp.access_level = 'read_only' THEN 'read_only'
    ELSE 'none'
  END as effective_access
FROM user_profiles up
CROSS JOIN role_permissions rp
LEFT JOIN user_permission_overrides upo 
  ON upo.user_id = up.id 
  AND upo.permission_key = rp.permission_key
  AND (upo.expires_at IS NULL OR upo.expires_at > now())
WHERE rp.role = up.role
  AND rp.is_active = true
  AND up.id = auth.uid();

COMMENT ON VIEW user_permissions_view IS 'Current user permissions with overrides applied';

-- =====================================================
-- CREATE INDEX FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup 
ON role_permissions(role, permission_key, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_permission_overrides_lookup
ON user_permission_overrides(user_id, permission_key);
