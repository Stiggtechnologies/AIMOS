-- ============================================================
-- Migration: 20260603100300_pp_patients.sql
-- Purpose: PHI patient roster mirror from Practice Perfect ClientListing.
--          Links to canonical public.patients once identity-matched.
--          Additive + idempotent. PHI -> strict clinic-scoped RLS.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.pp_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  pp_external_id text,
  last_name text,
  first_name text,
  normalized_name text NOT NULL,
  dob date,
  phone text,
  email text,
  payer_type text,
  status text,
  match_status text NOT NULL DEFAULT 'unmatched'
    CHECK (match_status IN ('unmatched', 'auto', 'confirmed', 'ignored')),
  match_confidence numeric(5,4),
  raw jsonb,
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Idempotency: external id when present, else normalized name + dob within clinic.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_patients_ext
  ON public.pp_patients (clinic_id, pp_external_id) WHERE pp_external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_patients_natural
  ON public.pp_patients (clinic_id, normalized_name, dob) WHERE pp_external_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_pp_patients_clinic ON public.pp_patients (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pp_patients_match ON public.pp_patients (match_status);
CREATE INDEX IF NOT EXISTS idx_pp_patients_patient ON public.pp_patients (patient_id);

DROP TRIGGER IF EXISTS trg_pp_patients_updated ON public.pp_patients;
CREATE TRIGGER trg_pp_patients_updated BEFORE UPDATE ON public.pp_patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pp_patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_patients_select" ON public.pp_patients;
CREATE POLICY "pp_patients_select" ON public.pp_patients
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));

COMMIT;
