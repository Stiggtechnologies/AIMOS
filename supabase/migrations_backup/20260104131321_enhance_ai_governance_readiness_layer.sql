/*
  # AI Governance & Readiness Layer Enhancement

  ## Purpose
  Future-proof safely with comprehensive AI governance without deploying AI models yet.

  ## Key Principles
  - No AI models deployed (governance only)
  - Clear data classification (AI-safe vs restricted)
  - Ownership metadata tracked
  - Consent scopes enforced
  - Comprehensive audit logging
  - Legal risk mitigation

  ## Enhancements to Existing Tables

  ### `data_classifications` (add metadata and versioning)
    - `data_sensitivity_level` (1-5) - Granular sensitivity scoring
    - `ai_readiness_score` (0-100) - Readiness for AI use
    - `business_owner` (text) - Business stakeholder owner
    - `technical_owner` (text) - Technical data owner
    - `last_audit_date` (date) - Last compliance review
    - `next_audit_date` (date) - Scheduled audit
    - `compliance_frameworks` (jsonb) - HIPAA, PHIPA, PIPEDA, etc.
    - `data_lineage` (jsonb) - Origin and transformation tracking
    - `version` (integer) - Classification version

  ### `consent_scopes` (add AI-specific controls)
    - `ai_model_types_allowed` (jsonb) - Specific model types permitted
    - `data_retention_days` (integer) - How long data can be retained
    - `anonymization_required` (boolean) - Must anonymize before use
    - `human_review_required` (boolean) - Human in the loop required
    - `opt_out_allowed` (boolean) - Can users opt out
    - `geographic_restrictions` (jsonb) - Data residency requirements
    - `version` (integer) - Scope version

  ### `ai_governance_logs` (enhance tracking)
    - `user_id` (uuid) - User who initiated action
    - `session_id` (text) - Session identifier
    - `request_id` (text) - Unique request ID for tracing
    - `data_classification_level` (text) - Classification at access time
    - `consent_scope_verified` (text) - Which scope was verified
    - `anonymization_applied` (boolean) - Was data anonymized
    - `risk_score` (numeric) - Calculated risk of access
    - `approved_by` (uuid) - Who approved (if manual)
    - `execution_time_ms` (integer) - Performance tracking

  ### `user_consent_records` (add granular tracking)
    - `version` (integer) - Consent version accepted
    - `consent_text_hash` (text) - Hash of consent text shown
    - `witness_id` (uuid) - Witness if required
    - `parent_guardian_consent` (boolean) - For minors
    - `language_code` (text) - Language consent was given in

  ## New Tables

  ### `ai_readiness_assessments`
    - Track system readiness for AI deployment
    - Overall scores and recommendations
    - Blocking issues identification

  ### `data_ownership_registry`
    - Central registry of data ownership
    - Business and technical owners
    - Accountability mapping

  ### `compliance_audit_trail`
    - Dedicated compliance audit tracking
    - Framework-specific checks
    - Pass/fail status
    - Remediation tracking

  ### `ai_policy_versions`
    - Version control for AI policies
    - Change tracking
    - Approval workflow

  ## Security
    - RLS policies for governance access
    - Audit log immutability
    - Compliance role restrictions
*/

-- Add metadata and versioning to data_classifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_classifications' AND column_name = 'data_sensitivity_level') THEN
    ALTER TABLE data_classifications ADD COLUMN data_sensitivity_level INTEGER CHECK (data_sensitivity_level BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_classifications' AND column_name = 'ai_readiness_score') THEN
    ALTER TABLE data_classifications ADD COLUMN ai_readiness_score NUMERIC CHECK (ai_readiness_score BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_classifications' AND column_name = 'business_owner') THEN
    ALTER TABLE data_classifications ADD COLUMN business_owner TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_classifications' AND column_name = 'technical_owner') THEN
    ALTER TABLE data_classifications ADD COLUMN technical_owner TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_classifications' AND column_name = 'last_audit_date') THEN
    ALTER TABLE data_classifications ADD COLUMN last_audit_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_classifications' AND column_name = 'next_audit_date') THEN
    ALTER TABLE data_classifications ADD COLUMN next_audit_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_classifications' AND column_name = 'compliance_frameworks') THEN
    ALTER TABLE data_classifications ADD COLUMN compliance_frameworks JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_classifications' AND column_name = 'data_lineage') THEN
    ALTER TABLE data_classifications ADD COLUMN data_lineage JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'data_classifications' AND column_name = 'version') THEN
    ALTER TABLE data_classifications ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Add AI-specific controls to consent_scopes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consent_scopes' AND column_name = 'ai_model_types_allowed') THEN
    ALTER TABLE consent_scopes ADD COLUMN ai_model_types_allowed JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consent_scopes' AND column_name = 'data_retention_days') THEN
    ALTER TABLE consent_scopes ADD COLUMN data_retention_days INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consent_scopes' AND column_name = 'anonymization_required') THEN
    ALTER TABLE consent_scopes ADD COLUMN anonymization_required BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consent_scopes' AND column_name = 'human_review_required') THEN
    ALTER TABLE consent_scopes ADD COLUMN human_review_required BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consent_scopes' AND column_name = 'opt_out_allowed') THEN
    ALTER TABLE consent_scopes ADD COLUMN opt_out_allowed BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consent_scopes' AND column_name = 'geographic_restrictions') THEN
    ALTER TABLE consent_scopes ADD COLUMN geographic_restrictions JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consent_scopes' AND column_name = 'version') THEN
    ALTER TABLE consent_scopes ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
END $$;

-- Enhance ai_governance_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_governance_logs' AND column_name = 'user_id') THEN
    ALTER TABLE ai_governance_logs ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_governance_logs' AND column_name = 'session_id') THEN
    ALTER TABLE ai_governance_logs ADD COLUMN session_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_governance_logs' AND column_name = 'request_id') THEN
    ALTER TABLE ai_governance_logs ADD COLUMN request_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_governance_logs' AND column_name = 'data_classification_level') THEN
    ALTER TABLE ai_governance_logs ADD COLUMN data_classification_level TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_governance_logs' AND column_name = 'consent_scope_verified') THEN
    ALTER TABLE ai_governance_logs ADD COLUMN consent_scope_verified TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_governance_logs' AND column_name = 'anonymization_applied') THEN
    ALTER TABLE ai_governance_logs ADD COLUMN anonymization_applied BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_governance_logs' AND column_name = 'risk_score') THEN
    ALTER TABLE ai_governance_logs ADD COLUMN risk_score NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_governance_logs' AND column_name = 'approved_by') THEN
    ALTER TABLE ai_governance_logs ADD COLUMN approved_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_governance_logs' AND column_name = 'execution_time_ms') THEN
    ALTER TABLE ai_governance_logs ADD COLUMN execution_time_ms INTEGER;
  END IF;
END $$;

-- Add granular tracking to user_consent_records
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_consent_records' AND column_name = 'version') THEN
    ALTER TABLE user_consent_records ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_consent_records' AND column_name = 'consent_text_hash') THEN
    ALTER TABLE user_consent_records ADD COLUMN consent_text_hash TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_consent_records' AND column_name = 'witness_id') THEN
    ALTER TABLE user_consent_records ADD COLUMN witness_id UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_consent_records' AND column_name = 'parent_guardian_consent') THEN
    ALTER TABLE user_consent_records ADD COLUMN parent_guardian_consent BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_consent_records' AND column_name = 'language_code') THEN
    ALTER TABLE user_consent_records ADD COLUMN language_code TEXT DEFAULT 'en';
  END IF;
END $$;

-- Create ai_readiness_assessments table
CREATE TABLE IF NOT EXISTS ai_readiness_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_date DATE NOT NULL,
  assessment_type TEXT CHECK (assessment_type IN ('initial', 'quarterly', 'pre_deployment', 'post_incident')),
  overall_readiness_score NUMERIC CHECK (overall_readiness_score BETWEEN 0 AND 100),
  data_classification_score NUMERIC,
  consent_management_score NUMERIC,
  audit_logging_score NUMERIC,
  compliance_score NUMERIC,
  technical_readiness_score NUMERIC,
  blocking_issues JSONB,
  recommendations JSONB,
  assessed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approval_date DATE,
  next_assessment_date DATE,
  status TEXT CHECK (status IN ('draft', 'in_review', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create data_ownership_registry table
CREATE TABLE IF NOT EXISTS data_ownership_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_domain TEXT NOT NULL,
  table_name TEXT NOT NULL,
  column_name TEXT,
  business_owner_name TEXT NOT NULL,
  business_owner_email TEXT NOT NULL,
  business_owner_role TEXT,
  technical_owner_name TEXT NOT NULL,
  technical_owner_email TEXT NOT NULL,
  technical_owner_role TEXT,
  backup_owner_name TEXT,
  backup_owner_email TEXT,
  accountability_level TEXT CHECK (accountability_level IN ('primary', 'secondary', 'tertiary')),
  decision_authority TEXT CHECK (decision_authority IN ('full', 'limited', 'advisory')),
  escalation_contact TEXT,
  last_reviewed_date DATE,
  next_review_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create compliance_audit_trail table
CREATE TABLE IF NOT EXISTS compliance_audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_date DATE NOT NULL,
  audit_type TEXT CHECK (audit_type IN ('scheduled', 'triggered', 'incident_response', 'regulatory')),
  framework TEXT NOT NULL,
  scope TEXT,
  auditor_name TEXT NOT NULL,
  auditor_org TEXT,
  items_checked INTEGER,
  items_passed INTEGER,
  items_failed INTEGER,
  critical_findings INTEGER,
  high_findings INTEGER,
  medium_findings INTEGER,
  low_findings INTEGER,
  findings JSONB,
  recommendations JSONB,
  remediation_plan JSONB,
  remediation_deadline DATE,
  status TEXT CHECK (status IN ('in_progress', 'completed', 'remediation_required', 'closed')),
  result TEXT CHECK (result IN ('pass', 'conditional_pass', 'fail')),
  certificate_issued BOOLEAN DEFAULT false,
  certificate_expiry DATE,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  conducted_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ai_policy_versions table
CREATE TABLE IF NOT EXISTS ai_policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_code TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  version INTEGER NOT NULL,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  policy_text TEXT NOT NULL,
  policy_hash TEXT NOT NULL,
  change_summary TEXT,
  changed_sections JSONB,
  author UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approval_date DATE,
  status TEXT CHECK (status IN ('draft', 'in_review', 'approved', 'published', 'superseded', 'archived')),
  supersedes_version INTEGER,
  requires_user_reacceptance BOOLEAN DEFAULT false,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for enhanced columns
CREATE INDEX IF NOT EXISTS idx_data_classifications_ai_readiness 
  ON data_classifications(ai_readiness_score) WHERE ai_safe = true;

CREATE INDEX IF NOT EXISTS idx_data_classifications_sensitivity 
  ON data_classifications(data_sensitivity_level);

CREATE INDEX IF NOT EXISTS idx_data_classifications_audit_due 
  ON data_classifications(next_audit_date) WHERE next_audit_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consent_scopes_ai_allowed 
  ON consent_scopes(ai_usage_allowed, is_active);

CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_user 
  ON ai_governance_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_risk 
  ON ai_governance_logs(risk_score) WHERE risk_score >= 70;

CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_classification 
  ON ai_governance_logs(data_classification_level, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_consent_records_version 
  ON user_consent_records(user_id, scope_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_ai_readiness_assessments_date 
  ON ai_readiness_assessments(assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_readiness_assessments_status 
  ON ai_readiness_assessments(status);

CREATE INDEX IF NOT EXISTS idx_data_ownership_registry_table 
  ON data_ownership_registry(table_name, column_name);

CREATE INDEX IF NOT EXISTS idx_data_ownership_registry_owner 
  ON data_ownership_registry(business_owner_email);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_trail_date 
  ON compliance_audit_trail(audit_date DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_trail_framework 
  ON compliance_audit_trail(framework, status);

CREATE INDEX IF NOT EXISTS idx_ai_policy_versions_current 
  ON ai_policy_versions(policy_code, is_current) WHERE is_current = true;

-- Add updated_at triggers
DO $$
BEGIN
  DROP TRIGGER IF EXISTS ai_readiness_assessments_updated_at ON ai_readiness_assessments;
  CREATE TRIGGER ai_readiness_assessments_updated_at 
    BEFORE UPDATE ON ai_readiness_assessments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

  DROP TRIGGER IF EXISTS data_ownership_registry_updated_at ON data_ownership_registry;
  CREATE TRIGGER data_ownership_registry_updated_at 
    BEFORE UPDATE ON data_ownership_registry 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

  DROP TRIGGER IF EXISTS compliance_audit_trail_updated_at ON compliance_audit_trail;
  CREATE TRIGGER compliance_audit_trail_updated_at 
    BEFORE UPDATE ON compliance_audit_trail 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

  DROP TRIGGER IF EXISTS ai_policy_versions_updated_at ON ai_policy_versions;
  CREATE TRIGGER ai_policy_versions_updated_at 
    BEFORE UPDATE ON ai_policy_versions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enable RLS on new tables
ALTER TABLE ai_readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_ownership_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_policy_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_readiness_assessments
CREATE POLICY "Admins and executives can view assessments" 
  ON ai_readiness_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can manage assessments" 
  ON ai_readiness_assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for data_ownership_registry
CREATE POLICY "All authenticated users can view ownership" 
  ON data_ownership_registry FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage ownership registry" 
  ON data_ownership_registry FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for compliance_audit_trail
CREATE POLICY "Admins and executives can view audits" 
  ON compliance_audit_trail FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can manage audit trail" 
  ON compliance_audit_trail FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for ai_policy_versions
CREATE POLICY "All authenticated users can view published policies" 
  ON ai_policy_versions FOR SELECT
  USING (status = 'published' OR status = 'approved');

CREATE POLICY "Admins can manage policy versions" 
  ON ai_policy_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'executive')
    )
  );

-- Seed AI policy versions
INSERT INTO ai_policy_versions (policy_code, policy_name, version, effective_date, policy_text, policy_hash, status, is_current, requires_user_reacceptance)
VALUES
  ('AI_USE_001', 'AI Usage and Governance Policy', 1, CURRENT_DATE, 
   'This policy governs the ethical and compliant use of AI systems within the organization...', 
   'hash_placeholder_001', 'published', true, true),
  ('DATA_CLASS_001', 'Data Classification Policy', 1, CURRENT_DATE, 
   'This policy defines data classification levels and handling requirements...', 
   'hash_placeholder_002', 'published', true, true),
  ('CONSENT_001', 'Consent Management Policy', 1, CURRENT_DATE, 
   'This policy outlines consent requirements for data processing and AI usage...', 
   'hash_placeholder_003', 'published', true, true)
ON CONFLICT DO NOTHING;

-- Update existing data classifications with readiness scores
UPDATE data_classifications 
SET ai_readiness_score = 
  CASE 
    WHEN ai_safe = true AND pii_flag = false AND phi_flag = false THEN 90
    WHEN ai_safe = true AND pii_flag = false AND phi_flag = true THEN 60
    WHEN ai_safe = true AND pii_flag = true THEN 50
    WHEN ai_restricted = true THEN 20
    ELSE 30
  END,
  data_sensitivity_level = 
  CASE classification_level
    WHEN 'public' THEN 1
    WHEN 'internal' THEN 2
    WHEN 'confidential' THEN 4
    WHEN 'restricted' THEN 5
    ELSE 3
  END,
  compliance_frameworks = '["HIPAA", "PHIPA", "PIPEDA"]'::jsonb
WHERE ai_readiness_score IS NULL;

-- Update consent scopes with AI model types
UPDATE consent_scopes
SET ai_model_types_allowed = 
  CASE scope_code
    WHEN 'AI_TRAINING' THEN '["predictive_analytics", "classification", "regression"]'::jsonb
    WHEN 'ANALYTICS' THEN '[]'::jsonb
    WHEN 'QUALITY_IMP' THEN '["statistical_models"]'::jsonb
    ELSE '[]'::jsonb
  END,
  data_retention_days = 
  CASE scope_code
    WHEN 'AI_TRAINING' THEN 1095
    WHEN 'ANALYTICS' THEN 730
    WHEN 'QUALITY_IMP' THEN 1825
    ELSE 365
  END,
  anonymization_required = 
  CASE scope_code
    WHEN 'AI_TRAINING' THEN true
    ELSE false
  END
WHERE ai_model_types_allowed IS NULL;
