-- ============================================================
-- Migration: 20260603100500_pp_financial_ledger.sql
-- Purpose: Full-fidelity PP financial ledger mirror — charges, invoices,
--          payments, client-level AR detail. PHI -> clinic-scoped RLS.
--          Additive + idempotent. Distinct from AIM OS-native billing tables
--          (those are the eventual takeover target).
-- ============================================================

BEGIN;

-- ---- pp_charges (line-item ledger: PaymentJournal/InvoiceJournal/Unbilled/Unpaid) ----
CREATE TABLE IF NOT EXISTS public.pp_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  external_id text,
  pp_patient_id uuid REFERENCES public.pp_patients(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  pp_provider_id uuid REFERENCES public.pp_providers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  fee_code text,
  description text,
  charge_date date,
  quantity numeric(12,2),
  unit_amount numeric(12,2),
  total_amount numeric(14,2),
  payer_type text,
  billed boolean,
  paid boolean,
  status text,
  raw jsonb,
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_charges_ext
  ON public.pp_charges (clinic_id, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pp_charges_clinic ON public.pp_charges (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pp_charges_patient ON public.pp_charges (pp_patient_id);
CREATE INDEX IF NOT EXISTS idx_pp_charges_date ON public.pp_charges (charge_date);

-- ---- pp_invoices (InvoiceJournal) ----
CREATE TABLE IF NOT EXISTS public.pp_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  external_id text,
  pp_patient_id uuid REFERENCES public.pp_patients(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  invoice_number text,
  invoice_date date,
  total_amount numeric(14,2),
  amount_paid numeric(14,2),
  balance_due numeric(14,2),
  payer_type text,
  status text,
  raw jsonb,
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_invoices_ext
  ON public.pp_invoices (clinic_id, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_invoices_num
  ON public.pp_invoices (clinic_id, invoice_number) WHERE external_id IS NULL AND invoice_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pp_invoices_clinic ON public.pp_invoices (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pp_invoices_patient ON public.pp_invoices (pp_patient_id);

-- ---- pp_payments (PaymentJournal; also resolves the missing `payments` reference) ----
CREATE TABLE IF NOT EXISTS public.pp_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  external_id text,
  pp_invoice_id uuid REFERENCES public.pp_invoices(id) ON DELETE SET NULL,
  pp_patient_id uuid REFERENCES public.pp_patients(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  payment_date date,
  amount numeric(14,2),
  payment_method text,
  payer_type text,
  reference_number text,
  raw jsonb,
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_payments_ext
  ON public.pp_payments (clinic_id, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pp_payments_clinic ON public.pp_payments (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pp_payments_patient ON public.pp_payments (pp_patient_id);

-- ---- pp_ar_detail (client-level AR aging; populated when CSV w/ buckets arrives) ----
CREATE TABLE IF NOT EXISTS public.pp_ar_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  pp_patient_id uuid REFERENCES public.pp_patients(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  payer_type text,
  current_0_30 numeric(14,2) NOT NULL DEFAULT 0,
  days_31_60 numeric(14,2) NOT NULL DEFAULT 0,
  days_61_90 numeric(14,2) NOT NULL DEFAULT 0,
  days_over_90 numeric(14,2) NOT NULL DEFAULT 0,
  total_due numeric(14,2) GENERATED ALWAYS AS (current_0_30 + days_31_60 + days_61_90 + days_over_90) STORED,
  raw jsonb,
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_ar_detail
  ON public.pp_ar_detail (clinic_id, snapshot_date, pp_patient_id, payer_type);
CREATE INDEX IF NOT EXISTS idx_pp_ar_detail_clinic ON public.pp_ar_detail (clinic_id);

-- ---- RLS (PHI: clinic-scoped read; service-role write) ----
ALTER TABLE public.pp_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_ar_detail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_charges_select" ON public.pp_charges;
CREATE POLICY "pp_charges_select" ON public.pp_charges
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));
DROP POLICY IF EXISTS "pp_invoices_select" ON public.pp_invoices;
CREATE POLICY "pp_invoices_select" ON public.pp_invoices
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));
DROP POLICY IF EXISTS "pp_payments_select" ON public.pp_payments;
CREATE POLICY "pp_payments_select" ON public.pp_payments
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));
DROP POLICY IF EXISTS "pp_ar_detail_select" ON public.pp_ar_detail;
CREATE POLICY "pp_ar_detail_select" ON public.pp_ar_detail
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));

COMMIT;
