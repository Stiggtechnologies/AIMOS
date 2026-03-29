-- ============================================================
-- Migration: 20260330020000_documentation_cases_consents.sql
-- Purpose: Cases and consent management for clinical documentation
-- ============================================================

BEGIN;

-- Cases table: links a patient to a payer/referral context for billing/reporting
CREATE TABLE IF NOT EXISTS documentation_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  payer_type text,
  payer_name text,
  referral_source text,
  case_status text NOT NULL DEFAULT 'active' CHECK (case_status IN ('active', 'closed', 'suspended', 'pending_discharge')),
  tags text[],
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_cases_patient_id ON documentation_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_cases_clinic_id ON documentation_cases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_cases_status ON documentation_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_doc_cases_org_id ON documentation_cases(organization_id);

-- Consents table: tracks patient consent for treatment, AI assistance, data sharing, etc.
CREATE TABLE IF NOT EXISTS documentation_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  case_id uuid REFERENCES documentation_cases(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  consent_type text NOT NULL CHECK (consent_type IN ('treatment', 'research', 'communication', 'data_sharing', 'ai_assisted')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'revoked', 'expired', 'withdrawn')),
  granted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  captured_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  document_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_consent_dates CHECK (
    revoked_at IS NULL OR granted_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_doc_consents_patient_id ON documentation_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_consents_case_id ON documentation_consents(case_id);
CREATE INDEX IF NOT EXISTS idx_doc_consents_clinic_id ON documentation_consents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_consents_type ON documentation_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_doc_consents_status ON documentation_consents(status);

COMMIT;