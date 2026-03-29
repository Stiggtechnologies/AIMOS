-- ============================================================
-- Migration: 20260330040000_documentation_notes.sql
-- Purpose: Note drafts, versions, signed notes, and addenda
-- ============================================================

BEGIN;

-- Note drafts: in-progress clinical note documents
CREATE TABLE IF NOT EXISTS documentation_note_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid REFERENCES documentation_encounters(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  case_id uuid REFERENCES documentation_cases(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  author_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  note_type text NOT NULL CHECK (note_type IN ('soap', 'progress', 'initial', 'discharge', 'assessment', 'referral', 'letter', 'custom')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'signed', 'amended', 'archived')),
  source_mode text NOT NULL DEFAULT 'manual' CHECK (source_mode IN ('manual', 'ai_assisted', 'transcribed', 'imported')),
  structured_payload jsonb,
  plain_text text,
  completeness_score numeric(5,4),
  risk_score numeric(5,4),
  payer_readiness_score numeric(5,4),
  current_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_draft_patient_id ON documentation_note_drafts(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_draft_encounter_id ON documentation_note_drafts(encounter_id);
CREATE INDEX IF NOT EXISTS idx_doc_draft_case_id ON documentation_note_drafts(case_id);
CREATE INDEX IF NOT EXISTS idx_doc_draft_clinic_id ON documentation_note_drafts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_draft_author_id ON documentation_note_drafts(author_user_id);
CREATE INDEX IF NOT EXISTS idx_doc_draft_status ON documentation_note_drafts(status);
CREATE INDEX IF NOT EXISTS idx_doc_draft_type ON documentation_note_drafts(note_type);

-- Note draft versions: immutable audit trail of draft edits
CREATE TABLE IF NOT EXISTS documentation_note_draft_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_draft_id uuid NOT NULL REFERENCES documentation_note_drafts(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  structured_payload jsonb,
  plain_text text,
  provenance_payload jsonb,
  ai_output_metadata jsonb,
  created_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(note_draft_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_doc_dv_draft_id ON documentation_note_draft_versions(note_draft_id);

-- Signed notes: immutable finalized clinical notes
CREATE TABLE IF NOT EXISTS documentation_signed_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_draft_id uuid NOT NULL REFERENCES documentation_note_drafts(id) ON DELETE RESTRICT,
  encounter_id uuid REFERENCES documentation_encounters(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  case_id uuid REFERENCES documentation_cases(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  note_type text NOT NULL CHECK (note_type IN ('soap', 'progress', 'initial', 'discharge', 'assessment', 'referral', 'letter', 'custom')),
  signed_payload jsonb,
  signed_text text,
  version_number integer NOT NULL,
  signed_by_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  signed_at timestamptz NOT NULL DEFAULT now(),
  version_hash text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'amended', 'superseded', 'locked'))
);

CREATE INDEX IF NOT EXISTS idx_doc_sn_patient_id ON documentation_signed_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_sn_draft_id ON documentation_signed_notes(note_draft_id);
CREATE INDEX IF NOT EXISTS idx_doc_sn_encounter_id ON documentation_signed_notes(encounter_id);
CREATE INDEX IF NOT EXISTS idx_doc_sn_clinic_id ON documentation_signed_notes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_sn_signed_by ON documentation_signed_notes(signed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_doc_sn_signed_at ON documentation_signed_notes(signed_at);

-- Note addenda: corrections/clarifications to signed notes
CREATE TABLE IF NOT EXISTS documentation_note_addenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signed_note_id uuid NOT NULL REFERENCES documentation_signed_notes(id) ON DELETE RESTRICT,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  addendum_type text NOT NULL CHECK (addendum_type IN ('correction', 'clarification', 'addition', 'restatement')),
  reason text NOT NULL,
  addendum_text text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  approved_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_add_signed_note_id ON documentation_note_addenda(signed_note_id);

-- Documentation risks: AI-flagged risk events on drafts
CREATE TABLE IF NOT EXISTS documentation_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_draft_id uuid REFERENCES documentation_note_drafts(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_category text NOT NULL,
  risk_description text NOT NULL,
  flagged_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_doc_risk_patient_id ON documentation_risks(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_risk_draft_id ON documentation_risks(note_draft_id);
CREATE INDEX IF NOT EXISTS idx_doc_risk_level ON documentation_risks(risk_level);

COMMIT;