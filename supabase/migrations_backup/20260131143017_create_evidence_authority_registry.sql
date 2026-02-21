/*
  # Evidence Authority Registry (EAR)

  ## Purpose
  Create the authoritative source registry for all clinical domains, enabling domain-aware
  evidence filtering, clinical decision support, and governance.

  ## New Tables
    - `evidence_authorities`
      - `authority_id` (uuid, primary key)
      - `domain` (text, enum) - Clinical domain (spine_mdt, acl, concussion, etc.)
      - `authority_name` (text) - Name of authoritative body
      - `authority_type` (text, enum) - Type: institute, consensus_group, guideline_body, journal
      - `description` (text) - Description of authority
      - `primary_scope` (text) - Primary area of expertise
      - `geographic_scope` (text) - Geographic coverage
      - `update_cycle_months` (int) - How often they publish updates
      - `credibility_level` (int, 1-5) - Authority credibility rating
      - `website_url` (text) - Official website
      - `notes` (text) - Additional notes
      - `is_active` (boolean) - Whether authority is currently active
      - `created_at` (timestamptz) - Record creation timestamp

  ## Schema Enhancements
    - Add `authority_id` to `research_sources` (links evidence to authorities)
    - Add `domain` to `clinical_rules` (enables domain-specific rules)
    - Add `domain` to `care_pathway_templates` (enables domain-specific pathways)

  ## Security
    - Enable RLS on `evidence_authorities`
    - Authenticated users can read all authorities
    - Only admins can insert/update/delete authorities

  ## Seed Data
    - 7 initial authoritative bodies across key clinical domains
    - McKenzie Institute (spine_mdt)
    - IOC (acl)
    - Concussion in Sport Group (concussion)
    - IASP (chronic_pain)
    - WFNR (neuro)
    - ISTS (tendon)
    - ISAKOS (shoulder)
*/

-- =====================================================
-- 1. Create Evidence Authorities Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.evidence_authorities (
  authority_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  domain text NOT NULL CHECK (
    domain IN (
      'spine_mdt',
      'acl',
      'concussion',
      'chronic_pain',
      'neuro',
      'tendon',
      'shoulder',
      'hip_groin',
      'pediatric_msk',
      'general_msk'
    )
  ),

  authority_name text NOT NULL,
  authority_type text NOT NULL CHECK (
    authority_type IN ('institute','consensus_group','guideline_body','journal')
  ),

  description text NOT NULL,

  primary_scope text NOT NULL,
  geographic_scope text NOT NULL,

  update_cycle_months int,
  credibility_level int NOT NULL CHECK (credibility_level BETWEEN 1 AND 5),

  website_url text,
  notes text,

  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. Link Registry to Existing Schema
-- =====================================================

-- Add authority_id to research_sources
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'research_sources'
    AND column_name = 'authority_id'
  ) THEN
    ALTER TABLE public.research_sources
    ADD COLUMN authority_id uuid REFERENCES public.evidence_authorities(authority_id);
  END IF;
END $$;

-- Add domain to clinical_rules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'clinical_rules'
    AND column_name = 'domain'
  ) THEN
    ALTER TABLE public.clinical_rules
    ADD COLUMN domain text;
  END IF;
END $$;

-- Add domain to care_pathway_templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'care_pathway_templates'
    AND column_name = 'domain'
  ) THEN
    ALTER TABLE public.care_pathway_templates
    ADD COLUMN domain text;
  END IF;
END $$;

-- =====================================================
-- 3. Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_evidence_authorities_domain
ON public.evidence_authorities(domain) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_evidence_authorities_type
ON public.evidence_authorities(authority_type) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_research_sources_authority
ON public.research_sources(authority_id) WHERE authority_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_rules_domain
ON public.clinical_rules(domain) WHERE domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_care_pathways_domain
ON public.care_pathway_templates(domain) WHERE domain IS NOT NULL;

-- =====================================================
-- 4. Security (Row Level Security)
-- =====================================================

ALTER TABLE public.evidence_authorities ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all authorities
DROP POLICY IF EXISTS "Authenticated users can read evidence authorities" ON public.evidence_authorities;
CREATE POLICY "Authenticated users can read evidence authorities"
  ON public.evidence_authorities
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert authorities
DROP POLICY IF EXISTS "Admins can insert evidence authorities" ON public.evidence_authorities;
CREATE POLICY "Admins can insert evidence authorities"
  ON public.evidence_authorities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can update authorities
DROP POLICY IF EXISTS "Admins can update evidence authorities" ON public.evidence_authorities;
CREATE POLICY "Admins can update evidence authorities"
  ON public.evidence_authorities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can delete authorities
DROP POLICY IF EXISTS "Admins can delete evidence authorities" ON public.evidence_authorities;
CREATE POLICY "Admins can delete evidence authorities"
  ON public.evidence_authorities
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- 5. Seed Authoritative Sources
-- =====================================================

INSERT INTO public.evidence_authorities
(domain, authority_name, authority_type, description, primary_scope,
 geographic_scope, update_cycle_months, credibility_level, website_url)
VALUES
('spine_mdt','McKenzie Institute International','institute',
 'Global authority for Mechanical Diagnosis and Therapy',
 'Mechanical spine and extremity pain','global',6,5,
 'https://www.mckenzieinstitute.org'),

('acl','International Olympic Committee','consensus_group',
 'Global consensus authority on sports injury prevention and rehabilitation',
 'ACL injury prevention, rehab, RTS','global',24,5,
 'https://www.olympic.org'),

('concussion','Concussion in Sport Group','consensus_group',
 'International concussion consensus statements',
 'Sport-related concussion','global',6,5,
 'https://bjsm.bmj.com'),

('chronic_pain','International Association for the Study of Pain','institute',
 'Global authority defining pain science and classification',
 'Persistent and chronic pain','global',12,5,
 'https://www.iasp-pain.org'),

('neuro','World Federation for NeuroRehabilitation','institute',
 'International neurorehabilitation authority',
 'Stroke, MS, Parkinsons, SCI','global',24,5,
 'https://www.wfnr.co.uk'),

('tendon','International Scientific Tendinopathy Symposium','consensus_group',
 'Global tendon rehabilitation consensus',
 'Tendinopathy load-based rehab','global',24,5,
 'https://www.tendinopathyrehab.com'),

('shoulder','ISAKOS','institute',
 'International orthopaedic sports medicine authority',
 'Shoulder instability and rotator cuff','global',24,4,
 'https://www.isakos.com')
ON CONFLICT DO NOTHING;