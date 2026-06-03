-- ============================================================
-- Migration: 20260603100200_pp_provider_identity.sql
-- Purpose: Practice Perfect provider identity resolution + per-provider
--          performance metrics. PP exports have NO stable provider IDs and
--          inconsistent name strings, so we canonicalize + alias them and
--          fuzzy-link to user_profiles. Additive + idempotent.
-- ============================================================

BEGIN;

-- Trigram fuzzy matching for name resolution.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Canonical PP provider identity (one row per real person per clinic).
CREATE TABLE IF NOT EXISTS public.pp_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  canonical_name text NOT NULL,
  normalized_name text NOT NULL,
  user_profile_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  provider_kind text,
  is_active boolean NOT NULL DEFAULT true,
  match_status text NOT NULL DEFAULT 'unmatched'
    CHECK (match_status IN ('unmatched', 'auto', 'confirmed', 'ignored')),
  match_confidence numeric(5,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_providers ON public.pp_providers (clinic_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_pp_providers_clinic ON public.pp_providers (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pp_providers_canon_trgm ON public.pp_providers USING gin (canonical_name gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_pp_providers_updated ON public.pp_providers;
CREATE TRIGGER trg_pp_providers_updated BEFORE UPDATE ON public.pp_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Every raw PP name string seen, mapped to one canonical provider.
CREATE TABLE IF NOT EXISTS public.pp_provider_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pp_provider_id uuid NOT NULL REFERENCES public.pp_providers(id) ON DELETE CASCADE,
  raw_name text NOT NULL,
  normalized_name text NOT NULL,
  source_report text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_provider_alias_norm ON public.pp_provider_aliases (normalized_name);
CREATE INDEX IF NOT EXISTS idx_pp_provider_alias_provider ON public.pp_provider_aliases (pp_provider_id);

-- Per-provider per-period KPIs (source: Provider Performance Summary).
CREATE TABLE IF NOT EXISTS public.pp_provider_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  pp_provider_id uuid REFERENCES public.pp_providers(id) ON DELETE SET NULL,
  provider_name text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_scheduled_visits integer,
  total_scheduled_hours numeric(10,2),
  avg_visits_per_hour numeric(10,4),
  client_scheduled_hours numeric(10,2),
  discharged_clients integer,
  change_in_client_load integer,
  client_cancels_no_shows integer,
  actual_visits integer,
  pct_cancel_no_show numeric(7,4),
  revenue numeric(14,2),
  avg_revenue_per_hour numeric(12,2),
  pct_client_scheduled_hours numeric(7,4),
  new_clients integer,
  avg_revenue_per_visit numeric(12,2),
  unscheduled_hours numeric(10,2),
  units numeric(12,2),
  therapist_cancels integer,
  raw_values jsonb,
  source text NOT NULL DEFAULT 'practiceperfect_pdf',
  import_batch_id uuid REFERENCES public.pp_import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_provider_perf
  ON public.pp_provider_performance (clinic_id, provider_name, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_pp_provider_perf_clinic ON public.pp_provider_performance (clinic_id);
CREATE INDEX IF NOT EXISTS idx_pp_provider_perf_provider ON public.pp_provider_performance (pp_provider_id);

DROP TRIGGER IF EXISTS trg_pp_provider_perf_updated ON public.pp_provider_performance;
CREATE TRIGGER trg_pp_provider_perf_updated BEFORE UPDATE ON public.pp_provider_performance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: provider identity + performance is sensitive staff data ->
-- clinic members may read; writes service-role only.
ALTER TABLE public.pp_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_provider_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pp_provider_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pp_providers_select" ON public.pp_providers;
CREATE POLICY "pp_providers_select" ON public.pp_providers
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));

DROP POLICY IF EXISTS "pp_provider_aliases_select" ON public.pp_provider_aliases;
CREATE POLICY "pp_provider_aliases_select" ON public.pp_provider_aliases
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.pp_providers p
    WHERE p.id = pp_provider_aliases.pp_provider_id
      AND public.pp_user_can_access_clinic(p.clinic_id)
  ));

DROP POLICY IF EXISTS "pp_provider_perf_select" ON public.pp_provider_performance;
CREATE POLICY "pp_provider_perf_select" ON public.pp_provider_performance
  FOR SELECT TO authenticated USING (public.pp_user_can_access_clinic(clinic_id));

COMMIT;
