-- ============================================================
-- Migration: 20260330060000_documentation_governance.sql
-- Purpose: AI governance, retention policies, vendors, break-glass
-- ============================================================

BEGIN;

-- Break-glass events: emergency access overrides logged
CREATE TABLE IF NOT EXISTS documentation_break_glass_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  approved_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_bg_patient_id ON documentation_break_glass_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_bg_clinic_id ON documentation_break_glass_events(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_bg_user_id ON documentation_break_glass_events(user_id);

-- Retention policies: per-organization record retention rules
CREATE TABLE IF NOT EXISTS documentation_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  record_category text NOT NULL,
  retain_years integer NOT NULL DEFAULT 7 CHECK (retain_years > 0),
  minor_rule boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, record_category)
);

CREATE INDEX IF NOT EXISTS idx_doc_rp_org_id ON documentation_retention_policies(organization_id);

-- AI models: approved AI model registry for clinical documentation
CREATE TABLE IF NOT EXISTS documentation_ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vendor text NOT NULL,
  purpose text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  config jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_ai_model_vendor ON documentation_ai_models(vendor);
CREATE INDEX IF NOT EXISTS idx_doc_ai_model_approved ON documentation_ai_models(approved);

-- AI prompt versions: versioned prompts for AI-assisted documentation
CREATE TABLE IF NOT EXISTS documentation_ai_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES documentation_ai_models(id) ON DELETE CASCADE,
  prompt_key text NOT NULL,
  version integer NOT NULL,
  prompt_text text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prompt_key, version)
);

CREATE INDEX IF NOT EXISTS idx_doc_ai_pv_model_id ON documentation_ai_prompt_versions(model_id);
CREATE INDEX IF NOT EXISTS idx_doc_ai_pv_active ON documentation_ai_prompt_versions(active);

-- AI runs: audit log of every AI inference in the documentation workflow
CREATE TABLE IF NOT EXISTS documentation_ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES documentation_encounters(id) ON DELETE SET NULL,
  note_draft_id uuid REFERENCES documentation_note_drafts(id) ON DELETE SET NULL,
  model_id uuid NOT NULL REFERENCES documentation_ai_models(id) ON DELETE RESTRICT,
  prompt_version_id uuid REFERENCES documentation_ai_prompt_versions(id) ON DELETE SET NULL,
  task_type text NOT NULL,
  input_metadata jsonb,
  output_metadata jsonb,
  human_review_required boolean NOT NULL DEFAULT false,
  created_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_ai_run_clinic_id ON documentation_ai_runs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_ai_run_patient_id ON documentation_ai_runs(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_ai_run_model_id ON documentation_ai_runs(model_id);
CREATE INDEX IF NOT EXISTS idx_doc_ai_run_task_type ON documentation_ai_runs(task_type);
CREATE INDEX IF NOT EXISTS idx_doc_ai_run_created ON documentation_ai_runs(created_at);

-- Vendors: approved AI vendor registry
CREATE TABLE IF NOT EXISTS documentation_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  service_type text NOT NULL,
  contract_status text NOT NULL DEFAULT 'pending' CHECK (contract_status IN ('active', 'pending', 'expired', 'terminated')),
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  security_controls jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_vendor_org_id ON documentation_vendors(organization_id);
CREATE INDEX IF NOT EXISTS idx_doc_vendor_status ON documentation_vendors(contract_status);

-- Pre-visit briefs: AI-generated summaries before appointments
CREATE TABLE IF NOT EXISTS documentation_pre_visit_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  case_id uuid NOT NULL REFERENCES documentation_cases(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES documentation_encounters(id) ON DELETE SET NULL,
  visit_date date NOT NULL,
  brief_data jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_pvb_patient_id ON documentation_pre_visit_briefs(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_pvb_case_id ON documentation_pre_visit_briefs(case_id);
CREATE INDEX IF NOT EXISTS idx_doc_pvb_visit_date ON documentation_pre_visit_briefs(visit_date);

-- Clinical documents: uploaded file attachments
CREATE TABLE IF NOT EXISTS documentation_clinical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  case_id uuid REFERENCES documentation_cases(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  document_type text NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  uploaded_by_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_cd_patient_id ON documentation_clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_cd_case_id ON documentation_clinical_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_doc_cd_clinic_id ON documentation_clinical_documents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_cd_type ON documentation_clinical_documents(document_type);

COMMIT;