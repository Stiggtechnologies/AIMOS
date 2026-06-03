-- ============================================================
-- Migration: 20260603100400_pp_scheduling.sql
-- Purpose: PP appointment/schedule mirror ("external booking blocks").
--          Ports the prior scaffold's AimosExternalBookingBlock contract.
--          Net-new (NOT crm_bookings, which is lead-funnel-oriented).
--          PHI -> clinic-scoped RLS. Additive + idempotent.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.pp_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  external_source text NOT NULL DEFAULT 'practice_perfect',
  external_id text NOT NULL,
  external_updated_at timestamptz,
  pp_provider_id uuid REFERENCES public.pp_providers(id) ON DELETE SET NULL,
  provider_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  pp_patient_id uuid REFERENCES public.pp_patients(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  appointment_type text,
  start_at timestamptz,
  end_at timestamptz,
  status text NOT NULL DEFAULT 'unknown'
    CHECK (status IN ('booked', 'cancelled', 'noshow', 'completed', 'unknown')),
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb,
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- The scaffold's idempotency contract: one row per (source, external id).
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_appt_external
  ON public.pp_appointments (external_source, external_id);
CREATE INDEX IF NOT EXISTS idx_pp_appt_clinic ON public.pp_appointments (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pp_appt_start ON public.pp_appointments (start_at);
CREATE INDEX IF NOT EXISTS idx_pp_appt_provider ON public.pp_appointments (pp_provider_id);
CREATE INDEX IF NOT EXISTS idx_pp_appt_patient ON public.pp_appointments (pp_patient_id);

DROP TRIGGER IF EXISTS trg_pp_appt_updated ON public.pp_appointments;
CREATE TRIGGER trg_pp_appt_updated BEFORE UPDATE ON public.pp_appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pp_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_appt_select" ON public.pp_appointments;
CREATE POLICY "pp_appt_select" ON public.pp_appointments
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));

COMMIT;
