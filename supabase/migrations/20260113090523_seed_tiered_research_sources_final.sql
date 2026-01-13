/*
  # Seed Tiered Research Sources and Research Priorities

  Seeds the approved research sources with proper tier classification and ingest rules,
  plus priority conditions and outcomes for the focus engine.
*/

-- ============================================================================
-- ADD UNIQUE CONSTRAINT TO RESEARCH SOURCES
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'research_sources_name_key'
  ) THEN
    ALTER TABLE research_sources ADD CONSTRAINT research_sources_name_key UNIQUE (name);
  END IF;
END $$;

-- ============================================================================
-- UPDATE EXISTING SOURCES WITH TIER CLASSIFICATION
-- ============================================================================

UPDATE research_sources
SET 
  tier = 1,
  ingest_frequency = 'weekly',
  ingest_rules = jsonb_build_object(
    'peer_reviewed', true,
    'requires_methods', true,
    'requires_outcomes', true,
    'requires_limitations', true
  )
WHERE name IN ('Cochrane Database', 'ACOEM Practice Guidelines');

UPDATE research_sources
SET 
  tier = 1,
  ingest_frequency = 'weekly',
  ingest_rules = jsonb_build_object(
    'peer_reviewed', true,
    'filters', jsonb_build_array('musculoskeletal', 'rehabilitation', 'return_to_work')
  )
WHERE name = 'PubMed';

-- ============================================================================
-- SEED TIER-1 SOURCES (Auto-Ingest, High Trust)
-- ============================================================================

INSERT INTO research_sources (name, source_type, url, credibility_score, tier, approved, auto_ingest, ingest_frequency, ingest_rules)
VALUES
  ('NICE Guidelines', 'guideline', 'https://www.nice.org.uk', 98, 1, true, true, 'monthly',
    '{"peer_reviewed": true, "guideline_type": "clinical", "requires_evidence_grade": true}'::jsonb),
  ('Canadian Clinical Practice Guidelines', 'guideline', 'https://www.canada.ca/en/public-health', 95, 1, true, true, 'monthly',
    '{"peer_reviewed": true, "focus": "rehabilitation"}'::jsonb),
  ('Journal of Orthopaedic & Sports Physical Therapy (JOSPT)', 'journal', 'https://www.jospt.org', 96, 1, true, true, 'weekly',
    '{"peer_reviewed": true, "focus": ["msk", "sports", "rehabilitation"]}'::jsonb),
  ('British Journal of Sports Medicine (BJSM)', 'journal', 'https://bjsm.bmj.com', 97, 1, true, true, 'weekly',
    '{"peer_reviewed": true, "focus": ["sports_medicine", "injury_prevention"]}'::jsonb),
  ('American Journal of Sports Medicine (AJSM)', 'journal', 'https://journals.sagepub.com/home/ajs', 96, 1, true, true, 'weekly',
    '{"peer_reviewed": true, "focus": ["orthopaedics", "sports_injuries"]}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  tier = EXCLUDED.tier,
  approved = EXCLUDED.approved,
  auto_ingest = EXCLUDED.auto_ingest,
  ingest_frequency = EXCLUDED.ingest_frequency,
  ingest_rules = EXCLUDED.ingest_rules;

-- ============================================================================
-- SEED TIER-2 SOURCES (Conditional Ingest)
-- ============================================================================

INSERT INTO research_sources (name, source_type, url, credibility_score, tier, approved, auto_ingest, ingest_frequency, ingest_rules)
VALUES
  ('medRxiv', 'preprint', 'https://www.medrxiv.org', 70, 2, true, true, 'weekly',
    '{"peer_reviewed": false, "label": "Preliminary - Preprint", "requires_tier1_corroboration": true, "cannot_drive_sop_change": true}'::jsonb),
  ('Rehabilitation Conference Proceedings', 'conference', null, 65, 2, true, false, 'manual',
    '{"peer_reviewed": false, "label": "Preliminary - Conference", "requires_review": true}'::jsonb),
  ('Rehab Technology White Papers', 'database', null, 60, 2, true, false, 'manual',
    '{"peer_reviewed": false, "label": "Industry White Paper", "requires_review": true, "industry_source": true}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  tier = EXCLUDED.tier,
  approved = EXCLUDED.approved,
  ingest_rules = EXCLUDED.ingest_rules;

-- ============================================================================
-- SEED TIER-3 SOURCES (Manual Approval Only)
-- ============================================================================

INSERT INTO research_sources (name, source_type, url, credibility_score, tier, approved, auto_ingest, ingest_frequency, ingest_rules)
VALUES
  ('Vendor-Sponsored Studies', 'database', null, 40, 3, false, false, 'manual',
    '{"requires_human_approval": true, "vendor_sponsored": true, "bias_risk": "high"}'::jsonb),
  ('Marketing Case Studies', 'database', null, 30, 3, false, false, 'manual',
    '{"requires_human_approval": true, "marketing_material": true, "cannot_drive_practice_change": true}'::jsonb),
  ('Opinion Pieces', 'database', null, 35, 3, false, false, 'manual',
    '{"requires_human_approval": true, "opinion_only": true, "evidence_level": "lowest"}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  tier = EXCLUDED.tier,
  approved = EXCLUDED.approved,
  ingest_rules = EXCLUDED.ingest_rules;

-- ============================================================================
-- SEED PRIORITY CONDITIONS
-- ============================================================================

INSERT INTO research_priorities (priority_type, priority_name, priority_score, keywords, active)
VALUES
  ('condition', 'Shoulder (Rotator Cuff)', 90, ARRAY['shoulder', 'rotator cuff', 'impingement', 'shoulder pain'], true),
  ('condition', 'Shoulder (Impingement)', 85, ARRAY['shoulder impingement', 'subacromial', 'shoulder pain'], true),
  ('condition', 'Low Back Pain', 95, ARRAY['low back pain', 'lbp', 'lumbar', 'back pain'], true),
  ('condition', 'Knee (Osteoarthritis)', 80, ARRAY['knee osteoarthritis', 'knee oa', 'knee pain'], true),
  ('condition', 'Knee (Post-Surgical)', 85, ARRAY['post-surgical knee', 'knee surgery', 'acl', 'meniscus'], true),
  ('condition', 'Workplace MSK Injuries', 88, ARRAY['workplace injury', 'occupational injury', 'workers comp', 'industrial injury'], true),
  ('condition', 'Repetitive Strain Injuries', 82, ARRAY['repetitive strain', 'rsi', 'overuse injury', 'cumulative trauma'], true)
ON CONFLICT (priority_type, priority_name) DO UPDATE SET
  priority_score = EXCLUDED.priority_score,
  keywords = EXCLUDED.keywords;

-- ============================================================================
-- SEED PRIORITY OUTCOMES
-- ============================================================================

INSERT INTO research_priorities (priority_type, priority_name, priority_score, keywords, active)
VALUES
  ('outcome', 'Time to Return-to-Work', 100, ARRAY['return to work', 'rtw', 'work return', 'days to rtw'], true),
  ('outcome', 'Visit Count Reduction', 95, ARRAY['visit count', 'number of visits', 'treatment duration', 'episode length'], true),
  ('outcome', 'Functional Improvement', 90, ARRAY['functional outcome', 'function', 'disability', 'functional status'], true),
  ('outcome', 'Claim Acceptance', 88, ARRAY['claim acceptance', 'claim approval', 'payer acceptance', 'reimbursement'], true),
  ('outcome', 'Pain Reduction', 85, ARRAY['pain reduction', 'pain improvement', 'pain score', 'vas'], true),
  ('outcome', 'Patient Satisfaction', 80, ARRAY['patient satisfaction', 'patient experience', 'satisfaction score'], true)
ON CONFLICT (priority_type, priority_name) DO UPDATE SET
  priority_score = EXCLUDED.priority_score,
  keywords = EXCLUDED.keywords;

-- ============================================================================
-- SAMPLE EVIDENCE DIGEST
-- ============================================================================

INSERT INTO evidence_digests (
  digest_period,
  digest_month,
  top_findings,
  changes_vs_last_month,
  adoption_recommendations,
  not_ready_yet,
  clinician_view,
  operations_view,
  executive_view,
  status
)
SELECT
  'January 2026',
  '2026-01-01'::date,
  '[
    {"finding": "Early mobilization for rotator cuff reduces visits by 1.5 per episode", "confidence": 85, "evidence_quality": "strong", "source_count": 5},
    {"finding": "Telehealth follow-ups maintain outcomes for low back pain", "confidence": 80, "evidence_quality": "moderate", "source_count": 3},
    {"finding": "Work-hardening programs reduce RTW time by 5 days", "confidence": 78, "evidence_quality": "moderate", "source_count": 4}
  ]'::jsonb,
  'New evidence on early mobilization vs last month showed stronger support. Telehealth evidence remains consistent.',
  'Consider piloting early mobilization protocol for rotator cuff cases at 2 clinics.',
  'Work-hardening programs need more outcome data before platform-wide adoption.',
  'Early mobilization for rotator cuff is well-supported. Consider updating treatment pathways. Telehealth can replace in-person follow-ups for stable LBP cases.',
  'Early mobilization could reduce visits by 1.5 per episode (15% reduction). Telehealth adoption could improve capacity utilization by 10%.',
  'Early mobilization evidence is strong enough to pilot (confidence: 85%). Potential for significant visit reduction and cost savings. Recommend pilot at 2 flagship clinics.',
  'published'
WHERE NOT EXISTS (
  SELECT 1 FROM evidence_digests WHERE digest_month = '2026-01-01'::date
);
