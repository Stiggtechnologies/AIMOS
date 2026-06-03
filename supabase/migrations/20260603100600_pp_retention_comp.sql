-- ============================================================
-- Migration: 20260603100600_pp_retention_comp.sql
-- Purpose: Patient retention/attrition (PatientFallOff) + provider
--          compensation (Compensation report) mirrors.
--          Additive + idempotent. Falloff = PHI; comp = manager-restricted.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.pp_patient_falloff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pp_patient_id uuid REFERENCES public.pp_patients(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  pp_provider_id uuid REFERENCES public.pp_providers(id) ON DELETE SET NULL,
  last_visit_date date,
  expected_return_date date,
  falloff_reason text,
  period_start date,
  period_end date,
  raw jsonb,
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_falloff
  ON public.pp_patient_falloff (clinic_id, pp_patient_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_pp_falloff_clinic ON public.pp_patient_falloff (clinic_id);

CREATE TABLE IF NOT EXISTS public.pp_compensation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pp_provider_id uuid REFERENCES public.pp_providers(id) ON DELETE SET NULL,
  provider_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  provider_name text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_revenue numeric(14,2),
  comp_amount numeric(14,2),
  comp_model text,
  raw jsonb,
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_comp
  ON public.pp_compensation (clinic_id, provider_name, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_pp_comp_clinic ON public.pp_compensation (clinic_id);

ALTER TABLE public.pp_patient_falloff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_compensation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_falloff_select" ON public.pp_patient_falloff;
CREATE POLICY "pp_falloff_select" ON public.pp_patient_falloff
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));

-- Compensation is restricted to clinic managers/executives (mirrors invoices policy intent).
DROP POLICY IF EXISTS "pp_comp_select" ON public.pp_compensation;
CREATE POLICY "pp_comp_select" ON public.pp_compensation
  FOR SELECT TO authenticated USING (
    public.pp_user_can_access_clinic(clinic_id)
    AND EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.role IN ('admin', 'clinic_manager', 'executive', 'regional_director')
    )
  );

COMMIT;
