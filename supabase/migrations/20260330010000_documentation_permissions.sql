-- ============================================================
-- Migration: 20260330010000_documentation_permissions.sql
-- Purpose: Documentation module permissions and role bindings
-- ============================================================

BEGIN;

-- Documentation permissions (if not already present in digital governance)
CREATE TABLE IF NOT EXISTS documentation_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Role-to-permission mapping for documentation
CREATE TABLE IF NOT EXISTS documentation_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_key)
);

-- Seed default documentation permissions
INSERT INTO documentation_permissions (permission_key, display_name, description)
VALUES
  ('documentation.view', 'View Documentation', 'View clinical documentation and notes'),
  ('documentation.edit_draft', 'Edit Draft Notes', 'Create and edit draft clinical notes'),
  ('documentation.sign', 'Sign Clinical Notes', 'Sign and finalize clinical notes'),
  ('documentation.addendum', 'Add Addenda', 'Add addenda to signed clinical notes'),
  ('communications.log', 'Log Communications', 'Log patient communications'),
  ('documents.clinical_upload', 'Upload Clinical Documents', 'Upload clinical documents'),
  ('requests.manage', 'Manage Record Requests', 'Create and manage record requests'),
  ('disclosures.release', 'Release Disclosures', 'Approve and release disclosures'),
  ('compliance.documentation_review', 'Review Compliance', 'View documentation compliance metrics'),
  ('ai_governance.documentation_manage', 'Manage AI Governance', 'Configure AI models and prompts for documentation')
ON CONFLICT (permission_key) DO NOTHING;

COMMIT;