-- ============================================================
-- Migration: 20260603100000_pp_import_provenance.sql
-- Purpose: Practice Perfect (PP) import provenance + staging + sync cursors.
--          Foundation for the PP -> AIM OS data mirror. Additive + idempotent.
-- ============================================================

BEGIN;

-- Shared clinic-access helper used by all pp_* RLS policies. Mirrors the
-- phase1 pattern (EXISTS over public.user_clinics) as a STABLE SECURITY DEFINER
-- function so policies stay terse and consistent.
CREATE OR REPLACE FUNCTION public.pp_user_can_access_clinic(p_clinic_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
AS $$
  SELECT p_clinic_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_clinics uc
    WHERE uc.user_id = auth.uid()
      AND uc.clinic_id = p_clinic_id
  );
$$;

-- One row per uploaded/fetched PP export file.
CREATE TABLE IF NOT EXISTS public.pp_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  report_type text NOT NULL CHECK (report_type IN (
    'revenue', 'accounts_receivable', 'client_listing', 'patient_calendar',
    'office_day', 'payment_journal', 'invoice_journal', 'daily_reconciliation',
    'compensation', 'provider_performance', 'unbilled_services',
    'unpaid_services', 'patient_falloff'
  )),
  source_format text NOT NULL DEFAULT 'pdf' CHECK (source_format IN ('pdf', 'csv', 'json', 'api')),
  source_filename text,
  source_sha256 text,
  period_start date,
  period_end date,
  snapshot_date date,
  row_count_raw integer NOT NULL DEFAULT 0,
  row_count_loaded integer NOT NULL DEFAULT 0,
  row_count_rejected integer NOT NULL DEFAULT 0,
  raw_payload jsonb,
  status text NOT NULL DEFAULT 'received' CHECK (status IN (
    'received', 'validating', 'staged', 'upserted', 'failed', 'superseded'
  )),
  connector text NOT NULL DEFAULT 'manual_export',
  imported_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Identical file (same report type + content hash) is a no-op on re-upload.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_import_batches_dedupe
  ON public.pp_import_batches (report_type, source_sha256)
  WHERE source_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pp_batches_clinic ON public.pp_import_batches (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pp_batches_type ON public.pp_import_batches (report_type);
CREATE INDEX IF NOT EXISTS idx_pp_batches_status ON public.pp_import_batches (status);

DROP TRIGGER IF EXISTS trg_pp_import_batches_updated ON public.pp_import_batches;
CREATE TRIGGER trg_pp_import_batches_updated
  BEFORE UPDATE ON public.pp_import_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Raw + cleaned staged rows (audit + reprocess without re-parsing the file).
CREATE TABLE IF NOT EXISTS public.pp_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.pp_import_batches(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  raw jsonb,
  cleaned jsonb,
  validation_status text NOT NULL DEFAULT 'ok' CHECK (validation_status IN ('ok', 'warning', 'rejected')),
  validation_messages jsonb,
  target_table text,
  target_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pp_rows_batch ON public.pp_import_rows (batch_id);
CREATE INDEX IF NOT EXISTS idx_pp_rows_status ON public.pp_import_rows (validation_status);

-- Structured per-row errors surfaced in the import-status UI.
CREATE TABLE IF NOT EXISTS public.pp_import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.pp_import_batches(id) ON DELETE CASCADE,
  row_index integer,
  severity text NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error')),
  code text,
  message text NOT NULL,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pp_errors_batch ON public.pp_import_errors (batch_id);

-- Incremental-sync cursors for the future API/CSV connector.
CREATE TABLE IF NOT EXISTS public.pp_sync_cursors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE,
  cursor_key text NOT NULL,
  cursor_value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_sync_cursors ON public.pp_sync_cursors (clinic_id, cursor_key);

-- RLS: clinic members may read; writes are service-role only (importer bypasses RLS).
ALTER TABLE public.pp_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_sync_cursors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_batches_select" ON public.pp_import_batches;
CREATE POLICY "pp_batches_select" ON public.pp_import_batches
  FOR SELECT TO authenticated
  USING (public.pp_user_can_access_clinic(clinic_id));

DROP POLICY IF EXISTS "pp_rows_select" ON public.pp_import_rows;
CREATE POLICY "pp_rows_select" ON public.pp_import_rows
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pp_import_batches b
    WHERE b.id = pp_import_rows.batch_id
      AND public.pp_user_can_access_clinic(b.clinic_id)
  ));

DROP POLICY IF EXISTS "pp_errors_select" ON public.pp_import_errors;
CREATE POLICY "pp_errors_select" ON public.pp_import_errors
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pp_import_batches b
    WHERE b.id = pp_import_errors.batch_id
      AND public.pp_user_can_access_clinic(b.clinic_id)
  ));

DROP POLICY IF EXISTS "pp_cursors_select" ON public.pp_sync_cursors;
CREATE POLICY "pp_cursors_select" ON public.pp_sync_cursors
  FOR SELECT TO authenticated
  USING (public.pp_user_can_access_clinic(clinic_id));

COMMIT;
