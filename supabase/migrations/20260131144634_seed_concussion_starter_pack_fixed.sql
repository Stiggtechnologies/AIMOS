/*
  # Concussion Starter Pack (AIM OS) - Complete Implementation
  
  1. Research Sources (6 authoritative sources)
  2. Evidence Claims (32 claims linked to sources)
  3. Clinical Rules (10 safety-first rules)
  4. Care Pathway Templates (4 pathways)
  5. Patient Education Assets (10 assets)
  
  Domain: concussion
  Anchor Authority: Concussion in Sport Group (CISG)
  Secondary: Ontario Neurotrauma Foundation, CDC
*/

-- =============================================================================
-- 1️⃣ RESEARCH SOURCES (6)
-- =============================================================================

DO $$
DECLARE
  v_concussion_authority_id uuid;
BEGIN
  SELECT authority_id INTO v_concussion_authority_id
  FROM evidence_authorities
  WHERE domain = 'concussion'
  LIMIT 1;

  -- Insert 6 foundational research sources
  INSERT INTO public.research_sources
  (id, name, source_type, authority_id, credibility_score, approved, auto_ingest, tier, created_at, updated_at)
  SELECT gen_random_uuid(), name, source_type, v_concussion_authority_id, credibility_score, approved, auto_ingest, tier, NOW(), NOW()
  FROM (VALUES
    ('CISG Amsterdam Consensus 2022', 'journal', 95, true, false, 1),
    ('CISG Berlin Consensus 2016', 'journal', 95, true, false, 1),
    ('ONF Pediatric Concussion Guideline 2021', 'journal', 90, true, false, 1),
    ('CDC mTBI Guideline 2018', 'journal', 90, true, false, 1),
    ('Leddy Exercise Research 2019', 'journal', 85, true, false, 2),
    ('Ellis Autonomic Dysfunction 2015', 'journal', 85, true, false, 2)
  ) AS t(name, source_type, credibility_score, approved, auto_ingest, tier)
  WHERE NOT EXISTS (
    SELECT 1 FROM research_sources WHERE research_sources.name = t.name
  );
END $$;

-- =============================================================================
-- 2️⃣ EVIDENCE CLAIMS (32)
-- =============================================================================

-- A) Core Principles (8) - CISG Amsterdam
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(),
  rs.id,
  claim_text,
  'benefit',
  ARRAY['recovery','safety'],
  '{"domain":"concussion","population":"general"}'::jsonb,
  '{"approach":"graduated_rehab"}'::jsonb,
  ARRAY['strict_rest'],
  'systematic_review',
  'low',
  ARRAY['consensus','safety'],
  0.95,
  'approved'
FROM (
  VALUES
  ('Early education and reassurance improves concussion recovery.'),
  ('Strict rest beyond 24–48 hours delays recovery.'),
  ('Graduated return to activity is safer than prolonged inactivity.'),
  ('Symptom-guided progression reduces prolonged symptoms.'),
  ('Multidomain assessment improves care planning.'),
  ('Early identification of red flags improves safety.'),
  ('Active rehabilitation is preferred over passive rest.'),
  ('Concussion recovery is individualized.')
) AS t(claim_text)
CROSS JOIN (
  SELECT id FROM research_sources 
  WHERE name = 'CISG Amsterdam Consensus 2022'
  LIMIT 1
) rs
WHERE NOT EXISTS (
  SELECT 1 FROM public.evidence_claims ec
  WHERE ec.claim_text = t.claim_text
);

-- B) Exercise & Physiology (8) - Leddy Research
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(),
  rs.id,
  claim_text,
  'benefit',
  ARRAY['symptoms','tolerance'],
  '{"domain":"concussion","stage":"subacute_chronic"}'::jsonb,
  '{"approach":"subsymptom_exercise"}'::jsonb,
  ARRAY['complete_rest'],
  'rct',
  'low',
  ARRAY['exercise','autonomic'],
  0.9,
  'approved'
FROM (
  VALUES
  ('Subsymptom aerobic exercise improves recovery time.'),
  ('Controlled exertion improves autonomic regulation.'),
  ('Exercise tolerance testing guides safe progression.'),
  ('Physiological recovery may lag behind symptom resolution.'),
  ('Heart rate response reflects concussion recovery stage.'),
  ('Exercise reduces persistent post-concussion symptoms.'),
  ('Gradual exertion improves functional tolerance.'),
  ('Autonomic dysfunction is common after concussion.')
) AS t(claim_text)
CROSS JOIN (
  SELECT id FROM research_sources 
  WHERE name = 'Leddy Exercise Research 2019'
  LIMIT 1
) rs
WHERE NOT EXISTS (
  SELECT 1 FROM public.evidence_claims ec
  WHERE ec.claim_text = t.claim_text
);

-- C) Cognitive / Sensory Load (8) - ONF Guideline
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(),
  rs.id,
  claim_text,
  'benefit',
  ARRAY['symptoms','function'],
  '{"domain":"concussion"}'::jsonb,
  '{"approach":"load_management"}'::jsonb,
  ARRAY['unrestricted_activity'],
  'cohort',
  'some_concerns',
  ARRAY['cognitive_load','sensory'],
  0.85,
  'approved'
FROM (
  VALUES
  ('Graduated return-to-learn improves outcomes.'),
  ('Cognitive overload exacerbates symptoms.'),
  ('Screen time moderation reduces symptom provocation.'),
  ('Multisensory sensitivity is common post-concussion.'),
  ('Task pacing improves tolerance.'),
  ('Visual motion sensitivity impacts recovery.'),
  ('Cognitive rest should be brief and structured.'),
  ('Environmental modification supports recovery.')
) AS t(claim_text)
CROSS JOIN (
  SELECT id FROM research_sources 
  WHERE name = 'ONF Pediatric Concussion Guideline 2021'
  LIMIT 1
) rs
WHERE NOT EXISTS (
  SELECT 1 FROM public.evidence_claims ec
  WHERE ec.claim_text = t.claim_text
);

-- D) Risk & Safety (8) - CISG Berlin
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(),
  rs.id,
  claim_text,
  'benefit',
  ARRAY['safety'],
  '{"domain":"concussion"}'::jsonb,
  '{"approach":"risk_screening"}'::jsonb,
  ARRAY['no_screening'],
  'systematic_review',
  'low',
  ARRAY['red_flags','safety'],
  0.95,
  'approved'
FROM (
  VALUES
  ('Worsening symptoms require medical reassessment.'),
  ('Repeated concussion increases recovery time.'),
  ('History of migraine increases risk of prolonged symptoms.'),
  ('Mood disorders impact recovery trajectory.'),
  ('Sleep disruption delays recovery.'),
  ('Neck injury commonly coexists with concussion.'),
  ('Vestibular symptoms predict prolonged recovery.'),
  ('Early referral improves complex case outcomes.')
) AS t(claim_text)
CROSS JOIN (
  SELECT id FROM research_sources 
  WHERE name = 'CISG Berlin Consensus 2016'
  LIMIT 1
) rs
WHERE NOT EXISTS (
  SELECT 1 FROM public.evidence_claims ec
  WHERE ec.claim_text = t.claim_text
);

-- =============================================================================
-- 3️⃣ CLINICAL RULES (10) — Safety-First
-- =============================================================================

INSERT INTO public.clinical_rules
(rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active)
SELECT rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active
FROM (VALUES
  ('Red flag symptoms present', 'concussion', '{"==":[{"var":"red_flags"},true]}'::jsonb, 'Stop rehab progression and refer for medical assessment.', 'Some symptoms need immediate medical review.', 1, true),
  ('First 48 hours post-injury', 'concussion', '{"<=":[{"var":"hours_since_injury"},48]}'::jsonb, 'Limit activity; avoid strict rest.', 'Light activity is better than total rest.', 1, true),
  ('Symptom increase >2/10', 'concussion', '{">":[{"var":"symptom_increase"},2]}'::jsonb, 'Reduce load and regress activity stage.', 'We reduce intensity if symptoms spike.', 1, true),
  ('Exercise tolerance achieved', 'concussion', '{"==":[{"var":"exercise_tolerated"},true]}'::jsonb, 'Progress aerobic load gradually.', 'You are ready to increase activity slightly.', 2, true),
  ('Persistent symptoms >4 weeks', 'concussion', '{">":[{"var":"weeks_since_injury"},4]}'::jsonb, 'Initiate multidisciplinary management.', 'Some people need extra support to recover.', 2, true),
  ('Cognitive intolerance', 'concussion', '{"==":[{"var":"cognitive_symptoms"},true]}'::jsonb, 'Adjust return-to-learn demands.', 'We pace thinking tasks to avoid overload.', 2, true),
  ('Vestibular symptoms present', 'concussion', '{"==":[{"var":"vestibular_symptoms"},true]}'::jsonb, 'Include vestibular rehabilitation.', 'Balance and dizziness can be retrained.', 2, true),
  ('Sleep disruption', 'concussion', '{"==":[{"var":"sleep_disrupted"},true]}'::jsonb, 'Address sleep hygiene immediately.', 'Better sleep supports recovery.', 2, true),
  ('Previous concussion history', 'concussion', '{">":[{"var":"prior_concussions"},0]}'::jsonb, 'Progress conservatively.', 'Previous concussions may slow recovery.', 2, true),
  ('Cleared by physician', 'concussion', '{"==":[{"var":"medical_clearance"},true]}'::jsonb, 'Proceed with full functional progression.', 'You are cleared to advance safely.', 3, true)
) AS t(rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM clinical_rules cr WHERE cr.rule_name = t.rule_name AND cr.domain = t.domain
);

-- =============================================================================
-- 4️⃣ CARE PATHWAY TEMPLATES (4)
-- =============================================================================

INSERT INTO public.care_pathway_templates
(name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active)
SELECT name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active
FROM (VALUES
  ('Acute Concussion – Early Management', 'concussion', '{"stage":"acute"}'::jsonb, '{"educate":"reassurance","manage":"light activity","monitor":"symptoms"}'::jsonb, '{"visits":"1–2"}'::jsonb, '{"emphasis":"relative rest + light activity"}'::jsonb, true),
  ('Subacute Concussion – Active Rehab', 'concussion', '{"stage":"subacute"}'::jsonb, '{"exercise":"subsymptom aerobic","educate":"load pacing"}'::jsonb, '{"visits":"3–6"}'::jsonb, '{"emphasis":"graded activity"}'::jsonb, true),
  ('Persistent Concussion Symptoms', 'concussion', '{"stage":"chronic"}'::jsonb, '{"multidomain":"exercise, vestibular, cognitive"}'::jsonb, '{"visits":"6–10"}'::jsonb, '{"emphasis":"structured progression"}'::jsonb, true),
  ('Return to Activity / Sport', 'concussion', '{"goal":"RTS"}'::jsonb, '{"progress":"stepwise","monitor":"symptoms"}'::jsonb, '{"visits":"2–4"}'::jsonb, '{"emphasis":"criteria-based progression"}'::jsonb, true)
) AS t(name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM care_pathway_templates cpt WHERE cpt.name = t.name AND cpt.domain = t.domain
);

-- =============================================================================
-- 5️⃣ PATIENT EDUCATION ASSETS (10)
-- =============================================================================

INSERT INTO public.patient_education_assets
(title, reading_level, topic_tags, content_md, is_active)
SELECT title, reading_level, topic_tags, content_md, is_active
FROM (VALUES
  ('What a Concussion Is', 6, ARRAY['education'], 'A concussion affects how the brain works, not how it looks.', true),
  ('Why Rest Is Limited', 6, ARRAY['education'], 'Too much rest can slow recovery.', true),
  ('How Activity Helps Recovery', 6, ARRAY['exercise'], 'Light activity helps the brain heal.', true),
  ('Managing Screen Time', 6, ARRAY['cognitive_load'], 'Limit screens if symptoms increase.', true),
  ('Tracking Symptoms', 6, ARRAY['monitoring'], 'Notice patterns, not just intensity.', true),
  ('Sleep and Concussion', 6, ARRAY['sleep'], 'Good sleep speeds recovery.', true),
  ('When to Seek Help', 6, ARRAY['safety'], 'Some symptoms need medical review.', true),
  ('Returning to School or Work', 6, ARRAY['RTL'], 'Gradual return works best.', true),
  ('Returning to Sport Safely', 6, ARRAY['RTS'], 'Progress step by step.', true),
  ('Your Role in Recovery', 6, ARRAY['self_management'], 'You play a key role in healing.', true)
) AS t(title, reading_level, topic_tags, content_md, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM patient_education_assets pea WHERE pea.title = t.title
);
