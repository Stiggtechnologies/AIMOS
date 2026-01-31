-- Example Seed Bundle SQL File
-- This is a template showing the structure for seeding evidence data
-- Copy this to seed_bundle.sql and customize with your actual data

-- ============================================================================
-- EVIDENCE AUTHORITIES
-- ============================================================================
INSERT INTO public.evidence_authorities (
  authority_id,
  domain,
  authority_name,
  authority_type,
  description,
  primary_scope,
  geographic_scope,
  update_cycle_months,
  credibility_level,
  website_url,
  is_active
) VALUES (
  gen_random_uuid(),
  'example_domain',
  'Example Clinical Authority',
  'guideline_body',
  'Example authority for demonstration',
  'Example clinical domain',
  'Global',
  12,
  90,
  'https://example.org',
  true
) ON CONFLICT (authority_id) DO NOTHING;

-- ============================================================================
-- RESEARCH SOURCES
-- ============================================================================
INSERT INTO public.research_sources (
  id,
  authority_id,
  title,
  source_type,
  publication_year,
  last_updated,
  url,
  is_active
) VALUES (
  gen_random_uuid(),
  (SELECT authority_id FROM evidence_authorities WHERE authority_name = 'Example Clinical Authority' LIMIT 1),
  'Example Research Source',
  'guideline',
  2024,
  current_date,
  'https://example.org/guidelines',
  true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EVIDENCE CLAIMS
-- ============================================================================
INSERT INTO public.evidence_claims (
  claim_id,
  source_id,
  claim_text,
  effect_direction,
  outcomes,
  population,
  evidence_level,
  risk_of_bias,
  clinical_tags,
  confidence_score,
  status
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM research_sources WHERE title = 'Example Research Source' LIMIT 1),
  'Example evidence claim demonstrating the structure',
  'benefit',
  ARRAY['function', 'pain'],
  '{"domain": "example_domain", "condition": "example_condition"}'::jsonb,
  'systematic_review',
  'low',
  ARRAY['example', 'demonstration'],
  0.85,
  'approved'
) ON CONFLICT (claim_id) DO NOTHING;

-- ============================================================================
-- CLINICAL RULES
-- ============================================================================
INSERT INTO public.clinical_rules (
  rule_id,
  domain,
  rule_name,
  trigger,
  recommendation_text,
  patient_explanation_text,
  priority,
  is_active
) VALUES (
  gen_random_uuid(),
  'example_domain',
  'Example Clinical Rule',
  '{"and": [{"==": [{"var": "condition"}, "example"]}]}'::jsonb,
  'Example recommendation for clinicians',
  'Example explanation for patients',
  1,
  true
) ON CONFLICT (rule_id) DO NOTHING;

-- ============================================================================
-- CARE PATHWAY TEMPLATES
-- ============================================================================
INSERT INTO public.care_pathway_templates (
  pathway_id,
  domain,
  name,
  intended_population,
  phases,
  visit_guidance,
  home_program_guidance,
  is_active
) VALUES (
  gen_random_uuid(),
  'example_domain',
  'Example Care Pathway',
  '{"domain": "example_domain", "condition": "example_condition"}'::jsonb,
  '{"phase1": {"name": "Initial", "duration_weeks": 2}}'::jsonb,
  '{"frequency": "2x per week", "duration": "45 min"}'::jsonb,
  '{"daily_exercises": ["example exercise"]}'::jsonb,
  true
) ON CONFLICT (pathway_id) DO NOTHING;

-- ============================================================================
-- PATIENT EDUCATION ASSETS
-- ============================================================================
INSERT INTO public.patient_education_assets (
  asset_id,
  title,
  reading_level,
  topic_tags,
  content_md,
  is_active
) VALUES (
  gen_random_uuid(),
  'Example Patient Education',
  6,
  ARRAY['example', 'education'],
  '# Example Education\n\nThis is example content.',
  true
) ON CONFLICT (asset_id) DO NOTHING;
