/*
  # Create profiles table and RIE evidence tables
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'clinician' CHECK (role IN ('admin', 'curator', 'clinician', 'staff', 'patient')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (user_id = auth.uid() OR role = 'admin');

DO $$ BEGIN CREATE TYPE effect_direction AS ENUM ('benefit', 'no_difference', 'harm', 'uncertain'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE evidence_level AS ENUM ('systematic_review', 'rct', 'cohort', 'case_series', 'expert'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE risk_of_bias AS ENUM ('low', 'some_concerns', 'high', 'not_reported'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE job_status AS ENUM ('queued', 'extracting', 'needs_review', 'approved', 'rejected', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.evidence_claims (
  claim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.research_sources(id) ON DELETE CASCADE,
  claim_text text NOT NULL,
  effect_direction effect_direction NOT NULL DEFAULT 'uncertain',
  effect_metric text,
  effect_value double precision,
  ci_low double precision,
  ci_high double precision,
  p_value double precision,
  outcomes text[] NOT NULL DEFAULT '{}',
  population jsonb NOT NULL DEFAULT '{}'::jsonb,
  intervention jsonb NOT NULL DEFAULT '{}'::jsonb,
  comparators text[] NOT NULL DEFAULT '{}',
  evidence_level evidence_level NOT NULL DEFAULT 'expert',
  risk_of_bias risk_of_bias NOT NULL DEFAULT 'not_reported',
  generalizability_notes text,
  clinical_tags text[] NOT NULL DEFAULT '{}',
  confidence_score double precision NOT NULL DEFAULT 0.5,
  status job_status NOT NULL DEFAULT 'needs_review',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.claim_citations (
  citation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.evidence_claims(claim_id) ON DELETE CASCADE,
  location text NOT NULL,
  excerpt text NOT NULL,
  confidence double precision NOT NULL DEFAULT 0.75,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clinical_rules (
  rule_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  trigger jsonb NOT NULL,
  recommendation_text text NOT NULL,
  patient_explanation_text text NOT NULL,
  safety_notes text,
  priority int NOT NULL DEFAULT 3,
  review_cycle_days int NOT NULL DEFAULT 180,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rule_claim_links (
  rule_id uuid NOT NULL REFERENCES public.clinical_rules(rule_id) ON DELETE CASCADE,
  claim_id uuid NOT NULL REFERENCES public.evidence_claims(claim_id) ON DELETE CASCADE,
  PRIMARY KEY (rule_id, claim_id)
);

CREATE TABLE IF NOT EXISTS public.care_pathway_templates (
  pathway_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  intended_population jsonb NOT NULL DEFAULT '{}'::jsonb,
  phases jsonb NOT NULL DEFAULT '{}'::jsonb,
  visit_guidance jsonb NOT NULL DEFAULT '{}'::jsonb,
  home_program_guidance jsonb NOT NULL DEFAULT '{}'::jsonb,
  linked_rule_ids uuid[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_education_assets (
  asset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  reading_level int NOT NULL DEFAULT 8,
  topic_tags text[] NOT NULL DEFAULT '{}',
  content_md text NOT NULL,
  linked_claim_ids uuid[] NOT NULL DEFAULT '{}',
  contraindications_banner text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evidence_version_sets (
  version_set_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher text NOT NULL,
  name text NOT NULL,
  release_date date NOT NULL,
  diff_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.curation_reviews (
  review_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  decision text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evidence_jobs (
  job_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.research_sources(id) ON DELETE CASCADE,
  status job_status NOT NULL DEFAULT 'queued',
  job_type text NOT NULL DEFAULT 'extraction',
  logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_source ON public.evidence_claims(source_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.evidence_claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_tags ON public.evidence_claims USING GIN (clinical_tags);
CREATE INDEX IF NOT EXISTS idx_citations_claim ON public.claim_citations(claim_id);
CREATE INDEX IF NOT EXISTS idx_rules_active ON public.clinical_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_rule_claim_links_claim ON public.rule_claim_links(claim_id);
CREATE INDEX IF NOT EXISTS idx_pathways_active ON public.care_pathway_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_assets_active ON public.patient_education_assets(is_active);
CREATE INDEX IF NOT EXISTS idx_assets_topic_tags ON public.patient_education_assets USING GIN (topic_tags);
CREATE INDEX IF NOT EXISTS idx_reviews_object ON public.curation_reviews(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.evidence_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.evidence_jobs(source_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN new.updated_at = now(); RETURN new; END $$;

DROP TRIGGER IF EXISTS trg_rules_updated_at ON public.clinical_rules;
CREATE TRIGGER trg_rules_updated_at BEFORE UPDATE ON public.clinical_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_pathways_updated_at ON public.care_pathway_templates;
CREATE TRIGGER trg_pathways_updated_at BEFORE UPDATE ON public.care_pathway_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_assets_updated_at ON public.patient_education_assets;
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON public.patient_education_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON public.evidence_jobs;
CREATE TRIGGER trg_jobs_updated_at BEFORE UPDATE ON public.evidence_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.evidence_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_claim_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_pathway_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_education_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_version_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_jobs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT COALESCE((SELECT role FROM public.profiles WHERE user_id = auth.uid()), 'patient'); $$;

DROP POLICY IF EXISTS "claims_select" ON public.evidence_claims;
CREATE POLICY "claims_select" ON public.evidence_claims FOR SELECT USING (public.current_role() IN ('admin', 'curator') OR status = 'approved');
DROP POLICY IF EXISTS "claims_write" ON public.evidence_claims;
CREATE POLICY "claims_write" ON public.evidence_claims FOR ALL USING (public.current_role() IN ('admin', 'curator'));

DROP POLICY IF EXISTS "citations_select" ON public.claim_citations;
CREATE POLICY "citations_select" ON public.claim_citations FOR SELECT USING (true);
DROP POLICY IF EXISTS "citations_write" ON public.claim_citations;
CREATE POLICY "citations_write" ON public.claim_citations FOR ALL USING (public.current_role() IN ('admin', 'curator'));

DROP POLICY IF EXISTS "rules_select" ON public.clinical_rules;
CREATE POLICY "rules_select" ON public.clinical_rules FOR SELECT USING (public.current_role() IN ('admin', 'curator') OR is_active = true);
DROP POLICY IF EXISTS "rules_write" ON public.clinical_rules;
CREATE POLICY "rules_write" ON public.clinical_rules FOR ALL USING (public.current_role() IN ('admin', 'curator'));

DROP POLICY IF EXISTS "rule_links_select" ON public.rule_claim_links;
CREATE POLICY "rule_links_select" ON public.rule_claim_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "rule_links_write" ON public.rule_claim_links;
CREATE POLICY "rule_links_write" ON public.rule_claim_links FOR ALL USING (public.current_role() IN ('admin', 'curator'));

DROP POLICY IF EXISTS "pathways_select" ON public.care_pathway_templates;
CREATE POLICY "pathways_select" ON public.care_pathway_templates FOR SELECT USING (public.current_role() IN ('admin', 'curator') OR is_active = true);
DROP POLICY IF EXISTS "pathways_write" ON public.care_pathway_templates;
CREATE POLICY "pathways_write" ON public.care_pathway_templates FOR ALL USING (public.current_role() IN ('admin', 'curator'));

DROP POLICY IF EXISTS "assets_select" ON public.patient_education_assets;
CREATE POLICY "assets_select" ON public.patient_education_assets FOR SELECT USING (public.current_role() IN ('admin', 'curator') OR is_active = true);
DROP POLICY IF EXISTS "assets_write" ON public.patient_education_assets;
CREATE POLICY "assets_write" ON public.patient_education_assets FOR ALL USING (public.current_role() IN ('admin', 'curator'));

DROP POLICY IF EXISTS "version_sets_select" ON public.evidence_version_sets;
CREATE POLICY "version_sets_select" ON public.evidence_version_sets FOR SELECT USING (public.current_role() IN ('admin', 'curator', 'clinician', 'staff'));
DROP POLICY IF EXISTS "version_sets_write" ON public.evidence_version_sets;
CREATE POLICY "version_sets_write" ON public.evidence_version_sets FOR ALL USING (public.current_role() IN ('admin', 'curator'));

DROP POLICY IF EXISTS "reviews_role" ON public.curation_reviews;
CREATE POLICY "reviews_role" ON public.curation_reviews FOR ALL USING (public.current_role() IN ('admin', 'curator'));

DROP POLICY IF EXISTS "jobs_role" ON public.evidence_jobs;
CREATE POLICY "jobs_role" ON public.evidence_jobs FOR ALL USING (public.current_role() IN ('admin', 'curator'));
