-- ============================================================
-- Migration: 20260330050000_documentation_comms_requests.sql
-- Purpose: Communications, record requests, disclosures, corrections
-- ============================================================

BEGIN;

-- Communications: patient communication logs
CREATE TABLE IF NOT EXISTS documentation_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  case_id uuid REFERENCES documentation_cases(id) ON DELETE SET NULL,
  encounter_id uuid REFERENCES documentation_encounters(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  communication_type text NOT NULL CHECK (communication_type IN ('phone', 'email', 'portal_message', 'sms', 'in_person', 'video', 'letter', 'other')),
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  summary_text text,
  participants jsonb,
  captured_by_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  requires_follow_up boolean NOT NULL DEFAULT false,
  converted_to_note_id uuid REFERENCES documentation_note_drafts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_comm_patient_id ON documentation_communications(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_comm_case_id ON documentation_communications(case_id);
CREATE INDEX IF NOT EXISTS idx_doc_comm_encounter_id ON documentation_communications(encounter_id);
CREATE INDEX IF NOT EXISTS idx_doc_comm_clinic_id ON documentation_communications(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_comm_type ON documentation_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_doc_comm_occurred ON documentation_communications(occurred_at);

-- Record requests: patient access / third-party information requests
CREATE TABLE IF NOT EXISTS documentation_record_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  case_id uuid REFERENCES documentation_cases(id) ON DELETE SET NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  request_type text NOT NULL CHECK (request_type IN ('patient_access', 'third_party', 'legal', 'insurance', 'research', 'quality_review')),
  requester_name text NOT NULL,
  requester_role text,
  authority_basis text,
  scope_description text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'reviewing', 'approved', 'partially_released', 'released', 'denied', 'cancelled', 'expired')),
  received_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_rr_patient_id ON documentation_record_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_rr_case_id ON documentation_record_requests(case_id);
CREATE INDEX IF NOT EXISTS idx_doc_rr_clinic_id ON documentation_record_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_rr_type ON documentation_record_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_doc_rr_status ON documentation_record_requests(status);
CREATE INDEX IF NOT EXISTS idx_doc_rr_received ON documentation_record_requests(received_at);

-- Disclosures: records of information released
CREATE TABLE IF NOT EXISTS documentation_disclosures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_request_id uuid NOT NULL REFERENCES documentation_record_requests(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  disclosed_by_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  recipient_name text NOT NULL,
  recipient_details jsonb,
  scope_description text,
  delivery_method text NOT NULL CHECK (delivery_method IN ('email', 'portal', 'mail', 'fax', 'in_person', 'encrypted_electronic')),
  disclosed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_disc_req_id ON documentation_disclosures(record_request_id);
CREATE INDEX IF NOT EXISTS idx_doc_disc_patient_id ON documentation_disclosures(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_disc_clinic_id ON documentation_disclosures(clinic_id);

-- Correction requests: patient-requested amendments to signed notes
CREATE TABLE IF NOT EXISTS documentation_correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  signed_note_id uuid NOT NULL REFERENCES documentation_signed_notes(id) ON DELETE RESTRICT,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE RESTRICT,
  requested_by text NOT NULL,
  request_text text NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'reviewing', 'approved', 'denied', 'partially_corrected', 'implemented')),
  received_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution_notes text,
  created_by_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_cr_patient_id ON documentation_correction_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_doc_cr_note_id ON documentation_correction_requests(signed_note_id);
CREATE INDEX IF NOT EXISTS idx_doc_cr_clinic_id ON documentation_correction_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doc_cr_status ON documentation_correction_requests(status);

COMMIT;