-- ============================================================
-- Migration: 20260603100100_resolve_finance_drift.sql
-- Purpose: Create the financial tables the LIVE edge functions
--          (import-revenue-report, import-ar-aggregate) already write to but
--          which exist in no migration -> they fail silently in prod today.
--          Columns match the edge-function payloads exactly. Additive + idempotent.
-- ============================================================

BEGIN;

-- ---- clinic_financial_metrics (target of import-revenue-report) ----
CREATE TABLE IF NOT EXISTS public.clinic_financial_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_revenue numeric(14,2) NOT NULL DEFAULT 0,
  total_visits integer NOT NULL DEFAULT 0,
  revenue_per_visit numeric(12,2) NOT NULL DEFAULT 0,
  total_clinician_hours numeric(12,2) NOT NULL DEFAULT 0,
  revenue_per_clinician_hour numeric(12,2) NOT NULL DEFAULT 0,
  operating_margin_percent numeric(7,4) NOT NULL DEFAULT 0,
  variance_vs_prior_period_percent numeric(7,4) NOT NULL DEFAULT 0,
  variance_vs_budget_percent numeric(7,4) NOT NULL DEFAULT 0,
  payer_mix_wsib_percent numeric(7,4) NOT NULL DEFAULT 0,
  payer_mix_private_percent numeric(7,4) NOT NULL DEFAULT 0,
  payer_mix_other_percent numeric(7,4) NOT NULL DEFAULT 0,
  trend_direction text NOT NULL DEFAULT 'stable',
  alert_flag boolean NOT NULL DEFAULT false,
  alert_message text,
  source text NOT NULL DEFAULT 'practiceperfect_pdf',
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cfm_period
  ON public.clinic_financial_metrics (clinic_id, period_start, period_end, source);
CREATE INDEX IF NOT EXISTS idx_cfm_clinic ON public.clinic_financial_metrics (clinic_id);

DROP TRIGGER IF EXISTS trg_cfm_updated ON public.clinic_financial_metrics;
CREATE TRIGGER trg_cfm_updated BEFORE UPDATE ON public.clinic_financial_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- service_line_performance (target of import-revenue-report) ----
CREATE TABLE IF NOT EXISTS public.service_line_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  service_line text NOT NULL,
  service_category text,
  fee_code text NOT NULL DEFAULT '',
  total_visits integer NOT NULL DEFAULT 0,
  total_billable_hours numeric(12,2) NOT NULL DEFAULT 0,
  average_visits_per_day numeric(10,2) NOT NULL DEFAULT 0,
  total_revenue numeric(14,2) NOT NULL DEFAULT 0,
  revenue_per_visit numeric(12,2) NOT NULL DEFAULT 0,
  revenue_per_hour numeric(12,2) NOT NULL DEFAULT 0,
  direct_costs numeric(14,2) NOT NULL DEFAULT 0,
  allocated_overhead numeric(14,2) NOT NULL DEFAULT 0,
  gross_margin_percent numeric(7,4) NOT NULL DEFAULT 0,
  contribution_margin_percent numeric(7,4) NOT NULL DEFAULT 0,
  capacity_utilization_percent numeric(7,4) NOT NULL DEFAULT 0,
  growth_rate_percent numeric(7,4) NOT NULL DEFAULT 0,
  trend_direction text NOT NULL DEFAULT 'stable',
  performance_tier text NOT NULL DEFAULT 'cash_cow',
  strategic_priority text NOT NULL DEFAULT 'maintain',
  notes text,
  source text NOT NULL DEFAULT 'practiceperfect_pdf',
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_slp_period_line
  ON public.service_line_performance (clinic_id, period_start, period_end, service_line, fee_code);
CREATE INDEX IF NOT EXISTS idx_slp_clinic ON public.service_line_performance (clinic_id);

DROP TRIGGER IF EXISTS trg_slp_updated ON public.service_line_performance;
CREATE TRIGGER trg_slp_updated BEFORE UPDATE ON public.service_line_performance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- accounts_receivable_aging (target of import-ar-aggregate) ----
-- total_outstanding is GENERATED (the edge fn selects it back but never inserts it).
CREATE TABLE IF NOT EXISTS public.accounts_receivable_aging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  payer_name text NOT NULL DEFAULT 'ALL',
  payer_type text NOT NULL DEFAULT 'other',
  current_0_30_days numeric(14,2) NOT NULL DEFAULT 0,
  days_31_60 numeric(14,2) NOT NULL DEFAULT 0,
  days_61_90 numeric(14,2) NOT NULL DEFAULT 0,
  days_over_90 numeric(14,2) NOT NULL DEFAULT 0,
  total_outstanding numeric(14,2) GENERATED ALWAYS AS
    (current_0_30_days + days_31_60 + days_61_90 + days_over_90) STORED,
  invoiced_total numeric(14,2),
  invoice_count integer,
  risk_level text NOT NULL DEFAULT 'medium',
  risk_reason text,
  recommended_action text,
  source text NOT NULL DEFAULT 'practiceperfect_pdf',
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ara_snapshot
  ON public.accounts_receivable_aging (clinic_id, snapshot_date, payer_name);
CREATE INDEX IF NOT EXISTS idx_ara_clinic ON public.accounts_receivable_aging (clinic_id);

-- ---- clinic_access compatibility view (resolves drift: 5 RLS policies reference it) ----
-- Canonical membership remains public.user_clinics; this view satisfies the
-- existing policies' `... IN (SELECT clinic_id FROM clinic_access WHERE user_id=auth.uid() AND revoked_at IS NULL)`.
CREATE OR REPLACE VIEW public.clinic_access AS
  SELECT uc.user_id, uc.clinic_id, NULL::timestamptz AS revoked_at
  FROM public.user_clinics uc;

-- ---- RLS: aggregate (non-PHI) -> readable by clinic staff; writes service-role only ----
ALTER TABLE public.clinic_financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_line_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable_aging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cfm_select" ON public.clinic_financial_metrics;
CREATE POLICY "cfm_select" ON public.clinic_financial_metrics
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));

DROP POLICY IF EXISTS "slp_select" ON public.service_line_performance;
CREATE POLICY "slp_select" ON public.service_line_performance
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));

DROP POLICY IF EXISTS "ara_select" ON public.accounts_receivable_aging;
CREATE POLICY "ara_select" ON public.accounts_receivable_aging
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));

COMMIT;
