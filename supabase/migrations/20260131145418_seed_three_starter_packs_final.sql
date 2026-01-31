/*
  # Three Starter Packs Bundle (AIM OS)
  
  A) Chronic Pain Starter Pack (IASP-anchored)
  B) ACL / Return-to-Sport Starter Pack (IOC-anchored)
  C) Neuro Rehab Starter Pack (WFNR-anchored)
  
  Each pack includes:
  - 6 Research Sources
  - 32 Evidence Claims
  - 10 Clinical Rules
  - 4 Care Pathway Templates
  - 10 Patient Education Assets
  
  Total: 18 sources, 96 claims, 30 rules, 12 pathways, 30 education assets
*/

-- =============================================================================
-- A) CHRONIC PAIN STARTER PACK (IASP-anchored)
-- =============================================================================

-- A1) Research Sources (6)
DO $$
DECLARE
  v_chronic_pain_authority_id uuid;
BEGIN
  SELECT authority_id INTO v_chronic_pain_authority_id
  FROM evidence_authorities
  WHERE domain = 'chronic_pain'
  LIMIT 1;

  INSERT INTO public.research_sources
  (id, name, source_type, authority_id, credibility_score, approved, auto_ingest, tier, created_at, updated_at)
  SELECT gen_random_uuid(), name, source_type, v_chronic_pain_authority_id, credibility_score, approved, auto_ingest, tier, NOW(), NOW()
  FROM (VALUES
    ('IASP Pain Terminology & Classification Overview', 'journal', 95, true, false, 1),
    ('Biopsychosocial Approaches in Chronic Pain Rehab', 'journal', 90, true, false, 1),
    ('Graded Activity for Chronic Low Back Pain', 'journal', 85, true, false, 2),
    ('Pain Neuroscience Education for Chronic Pain', 'journal', 88, true, false, 1),
    ('Exercise Therapy for Chronic Pain Conditions', 'journal', 90, true, false, 1),
    ('Central Sensitization Features and Outcomes', 'journal', 84, true, false, 2)
  ) AS t(name, source_type, credibility_score, approved, auto_ingest, tier)
  WHERE NOT EXISTS (
    SELECT 1 FROM research_sources WHERE research_sources.name = t.name
  );
END $$;

-- A2) Evidence Claims (32) - Core Principles
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['function','quality_of_life'],
  '{"domain":"chronic_pain","population":"general"}'::jsonb,
  '{"approach":"education_plus_activity","core":["pain_education","graded_activity","self_management"]}'::jsonb,
  ARRAY['passive_care'], 'systematic_review', 'low',
  ARRAY['biopsychosocial','education','self_management'], 0.92, 'approved'
FROM (VALUES
 ('Pain is influenced by biological, psychological, and social factors.'),
 ('Education improves pain beliefs and coping.'),
 ('Active rehabilitation improves function more than passive care.'),
 ('Graded exposure reduces fear-avoidance behaviors.'),
 ('Self-management reduces flare impact and improves confidence.'),
 ('Sleep quality strongly affects pain sensitivity and recovery.'),
 ('Mood and stress influence pain intensity and disability.'),
 ('Goal-setting improves adherence and outcomes.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Biopsychosocial%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- A2) Evidence Claims - PNE + beliefs
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['pain','function'],
  '{"domain":"chronic_pain","population":"general"}'::jsonb,
  '{"approach":"pain_neuroscience_education","core":["education","reassurance"]}'::jsonb,
  ARRAY['no_education'], 'systematic_review', 'low',
  ARRAY['pne','education'], 0.88, 'approved'
FROM (VALUES
 ('Pain neuroscience education improves understanding of pain.'),
 ('Education can reduce catastrophizing in some patients.'),
 ('Education supports safer return to activity.'),
 ('Education improves confidence with movement.'),
 ('Reassurance reduces threat perception and improves participation.'),
 ('Combining education with exercise improves functional gains.'),
 ('Short, repeated education doses improve retention.'),
 ('Language and framing influence pain experience.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Pain Neuroscience%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- A2) Evidence Claims - Exercise
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['function','quality_of_life'],
  '{"domain":"chronic_pain","population":"general"}'::jsonb,
  '{"approach":"exercise","core":["aerobic","strength","dose_progression"]}'::jsonb,
  ARRAY['no_exercise'], 'systematic_review', 'low',
  ARRAY['exercise','dose'], 0.9, 'approved'
FROM (VALUES
 ('Exercise improves function across chronic pain conditions.'),
 ('Dose progression should be gradual and individualized.'),
 ('Consistency matters more than intensity early on.'),
 ('Aerobic exercise can reduce pain sensitivity over time.'),
 ('Strength training supports capacity and confidence.'),
 ('Flare-ups are expected; plans should include regressions.'),
 ('Exercise improves sleep and mood.'),
 ('Function can improve even if pain persists.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Exercise Therapy%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- A2) Evidence Claims - Sensitization
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['risk','planning'],
  '{"domain":"chronic_pain","population":"general"}'::jsonb,
  '{"approach":"phenotyping","core":["screening","tailoring"]}'::jsonb,
  ARRAY['standard_care'], 'cohort', 'some_concerns',
  ARRAY['sensitization','risk_stratification'], 0.84, 'approved'
FROM (VALUES
 ('Sensitization features can signal higher risk of prolonged disability.'),
 ('Widespread symptoms may require pacing and education emphasis.'),
 ('High symptom reactivity suggests slower load progression.'),
 ('Sleep disruption can amplify pain sensitivity.'),
 ('Stress reactivity impacts flare frequency.'),
 ('Comorbid anxiety/depression may slow recovery.'),
 ('Over-reliance on passive care can reinforce disability.'),
 ('Tailored plans improve adherence.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Central Sensitization%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- A3) Clinical Rules (10)
INSERT INTO public.clinical_rules
(rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active)
SELECT rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active
FROM (VALUES
  ('High fear avoidance', 'chronic_pain', '{"==":[{"var":"fear_avoidance_high"},true]}'::jsonb, 'Use graded exposure, reassure safety, emphasize function goals.', 'We build confidence with small safe steps.', 1, true),
  ('Sleep disrupted', 'chronic_pain', '{"==":[{"var":"sleep_disrupted"},true]}'::jsonb, 'Prioritize sleep hygiene; adjust training load.', 'Better sleep often improves pain and recovery.', 1, true),
  ('High symptom reactivity', 'chronic_pain', '{"==":[{"var":"symptom_reactivity_high"},true]}'::jsonb, 'Reduce intensity; increase pacing and education.', 'We pace progress if symptoms spike easily.', 1, true),
  ('Catastrophizing high', 'chronic_pain', '{"==":[{"var":"catastrophizing_high"},true]}'::jsonb, 'Use reassurance + education + achievable goals.', 'Understanding pain can reduce worry and improve movement.', 2, true),
  ('Low self-efficacy', 'chronic_pain', '{"==":[{"var":"self_efficacy_low"},true]}'::jsonb, 'Increase self-management coaching and tracking wins.', 'You will learn what helps and how to manage flares.', 2, true),
  ('Flare-up detected', 'chronic_pain', '{"==":[{"var":"flare_up"},true]}'::jsonb, 'Regress to flare plan for 48 hours; then resume progression.', 'Flare-ups happen. We use a reset plan.', 1, true),
  ('Passive care dependency', 'chronic_pain', '{"==":[{"var":"passive_dependency"},true]}'::jsonb, 'Shift emphasis to active care and home plan ownership.', 'Active steps give you more control over symptoms.', 2, true),
  ('Low activity baseline', 'chronic_pain', '{"==":[{"var":"activity_baseline_low"},true]}'::jsonb, 'Start with very small daily targets; progress weekly.', 'Small consistent steps beat big swings.', 2, true),
  ('Mood stress high', 'chronic_pain', '{"==":[{"var":"stress_high"},true]}'::jsonb, 'Add stress strategies; coordinate supports if needed.', 'Stress can amplify pain—managing it helps recovery.', 2, true),
  ('Progress plateau 3+ visits', 'chronic_pain', '{"and":[{">=":[{"var":"visits"},3]},{"==":[{"var":"progress_plateau"},true]}]}'::jsonb, 'Reassess barriers; simplify plan; adjust goals and dosing.', 'If progress stalls, we adjust the plan together.', 2, true)
) AS t(rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active)
WHERE NOT EXISTS (SELECT 1 FROM clinical_rules cr WHERE cr.rule_name = t.rule_name AND cr.domain = t.domain);

-- A4) Care Pathway Templates (4)
INSERT INTO public.care_pathway_templates
(name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active)
SELECT name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active
FROM (VALUES
  ('Chronic Pain – Education + Graded Activity', 'chronic_pain', '{"stage":"general"}'::jsonb, '{"phase1":"education + baseline","phase2":"graded progression","phase3":"function goals","phase4":"independence"}'::jsonb, '{"visits":"6–10"}'::jsonb, '{"frequency":"most days","emphasis":"pacing + progression"}'::jsonb, true),
  ('Chronic Pain – High Reactivity / Pacing First', 'chronic_pain', '{"symptom_reactivity_high":true}'::jsonb, '{"phase1":"pacing + sleep","phase2":"micro-progressions","phase3":"graded exposure"}'::jsonb, '{"visits":"8–12"}'::jsonb, '{"frequency":"daily micro-doses","emphasis":"pacing + confidence"}'::jsonb, true),
  ('Chronic Pain – Fear Avoidance Dominant', 'chronic_pain', '{"fear_avoidance_high":true}'::jsonb, '{"phase1":"reassurance","phase2":"graded exposure","phase3":"return to activity"}'::jsonb, '{"visits":"6–10"}'::jsonb, '{"frequency":"most days","emphasis":"exposure + tracking"}'::jsonb, true),
  ('Chronic Pain – Flare Management Program', 'chronic_pain', '{"flare_prone":true}'::jsonb, '{"phase1":"flare plan","phase2":"stabilize baseline","phase3":"progress"}'::jsonb, '{"visits":"4–8"}'::jsonb, '{"frequency":"as prescribed","emphasis":"flare reset + return"}'::jsonb, true)
) AS t(name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active)
WHERE NOT EXISTS (SELECT 1 FROM care_pathway_templates cpt WHERE cpt.name = t.name AND cpt.domain = t.domain);

-- A5) Patient Education Assets (10)
INSERT INTO public.patient_education_assets
(title, reading_level, topic_tags, content_md, is_active)
SELECT title, reading_level, topic_tags, content_md, is_active
FROM (VALUES
  ('Pain is Real — and Changeable', 6, ARRAY['education'], 'Pain is real. It can be influenced by many factors, and improvement is possible.', true),
  ('Hurt vs Harm', 6, ARRAY['education'], 'Feeling pain does not always mean damage. Safe movement helps recovery.', true),
  ('Pacing Basics', 6, ARRAY['pacing'], 'Pacing means doing a little, often, without big crashes.', true),
  ('Flare-Up Reset Plan', 6, ARRAY['self_management'], 'Use your reset plan for 48 hours, then return to steady progress.', true),
  ('Graded Exposure', 6, ARRAY['confidence'], 'We build confidence by slowly increasing activities that feel scary.', true),
  ('Sleep and Pain', 6, ARRAY['sleep'], 'Better sleep often reduces pain sensitivity.', true),
  ('Stress and Pain', 6, ARRAY['stress'], 'Stress can turn pain volume up. Small stress tools help.', true),
  ('Tracking Wins', 6, ARRAY['tracking'], 'Track function wins, not just pain numbers.', true),
  ('Why Exercise Helps', 6, ARRAY['exercise'], 'Exercise builds capacity. Progress is gradual.', true),
  ('Your Recovery Role', 6, ARRAY['self_management'], 'You are the key driver of progress. We guide the plan.', true)
) AS t(title, reading_level, topic_tags, content_md, is_active)
WHERE NOT EXISTS (SELECT 1 FROM patient_education_assets pea WHERE pea.title = t.title);

-- =============================================================================
-- B) ACL / RETURN-TO-SPORT STARTER PACK (IOC-anchored)
-- =============================================================================

-- B1) Research Sources (6)
DO $$
DECLARE
  v_acl_authority_id uuid;
BEGIN
  SELECT authority_id INTO v_acl_authority_id
  FROM evidence_authorities
  WHERE domain = 'acl'
  LIMIT 1;

  INSERT INTO public.research_sources
  (id, name, source_type, authority_id, credibility_score, approved, auto_ingest, tier, created_at, updated_at)
  SELECT gen_random_uuid(), name, source_type, v_acl_authority_id, credibility_score, approved, auto_ingest, tier, NOW(), NOW()
  FROM (VALUES
    ('IOC Consensus: ACL Injury Prevention & Return to Sport', 'journal', 95, true, false, 1),
    ('Neuromuscular Training Reduces ACL Injury Risk', 'journal', 90, true, false, 1),
    ('Criteria-Based Return to Sport After ACLR', 'journal', 92, true, false, 1),
    ('Strength Symmetry and Reinjury Risk After ACL', 'journal', 88, true, false, 2),
    ('Psychological Readiness and RTS Outcomes', 'journal', 88, true, false, 2),
    ('Rehabilitation Dose and Functional Outcomes After ACL', 'journal', 85, true, false, 2)
  ) AS t(name, source_type, credibility_score, approved, auto_ingest, tier)
  WHERE NOT EXISTS (
    SELECT 1 FROM research_sources WHERE research_sources.name = t.name
  );
END $$;

-- B2) Evidence Claims (32) - Prevention + NMT
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['risk_reduction','performance'],
  '{"domain":"acl","stage":"prevention"}'::jsonb,
  '{"approach":"neuromuscular_training","core":["landing","strength","agility"]}'::jsonb,
  ARRAY['no_prevention'], 'systematic_review', 'low',
  ARRAY['prevention','neuromuscular'], 0.92, 'approved'
FROM (VALUES
 ('Neuromuscular training programs reduce ACL injury risk.'),
 ('Landing mechanics training reduces high-risk movement patterns.'),
 ('Hip and trunk control reduces knee valgus risk.'),
 ('Strength training supports injury prevention.'),
 ('Multi-component programs are more effective than single exercises.'),
 ('High adherence improves prevention effectiveness.'),
 ('Prevention works best when started before season.'),
 ('Warm-up based programs improve adoption.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Neuromuscular Training%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- B2) Evidence Claims - Rehab progression
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['function','performance'],
  '{"domain":"acl","stage":"rehab"}'::jsonb,
  '{"approach":"progressive_rehab","core":["strength","plyometric","running_progression"]}'::jsonb,
  ARRAY['standard_rehab'], 'systematic_review', 'low',
  ARRAY['rehab','progression'], 0.9, 'approved'
FROM (VALUES
 ('Progressive strength restores knee function after ACL injury.'),
 ('Running progression should be criteria-based.'),
 ('Plyometrics support RTS readiness.'),
 ('Quadriceps strength is a key recovery marker.'),
 ('Hip strength supports knee control under load.'),
 ('Dose progression should match tissue tolerance and symptoms.'),
 ('Early overloading increases symptoms and setbacks.'),
 ('Testing supports targeted progression.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Rehabilitation Dose%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- B2) Evidence Claims - RTS criteria
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['RTS','risk_reduction'],
  '{"domain":"acl","stage":"RTS"}'::jsonb,
  '{"approach":"criteria_based_RTS","core":["strength_symmetry","hop_tests","movement_quality"]}'::jsonb,
  ARRAY['time_based_RTS'], 'systematic_review', 'low',
  ARRAY['RTS','testing','risk'], 0.93, 'approved'
FROM (VALUES
 ('Criteria-based RTS reduces reinjury risk.'),
 ('Strength symmetry is important before RTS.'),
 ('Hop tests reflect functional readiness.'),
 ('Movement quality assessment adds safety.'),
 ('Time alone is not sufficient for RTS decisions.'),
 ('Deficits increase risk of secondary injury.'),
 ('Gradual exposure to sport demands supports safe RTS.'),
 ('Reinjury risk is highest early after return.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Criteria-Based Return%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- B2) Evidence Claims - Psych readiness
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['RTS','adherence'],
  '{"domain":"acl","stage":"RTS"}'::jsonb,
  '{"approach":"psych_support","core":["confidence","goal_setting"]}'::jsonb,
  ARRAY['no_psych_support'], 'systematic_review', 'low',
  ARRAY['psychology','readiness'], 0.88, 'approved'
FROM (VALUES
 ('Psychological readiness predicts successful return to sport.'),
 ('Fear of reinjury can limit performance and participation.'),
 ('Confidence-building improves adherence to rehab.'),
 ('Goal-setting supports long-term engagement.'),
 ('Education improves understanding of progression and risk.'),
 ('Early expectations influence motivation.'),
 ('Supportive coaching improves rehab completion.'),
 ('Screening identifies high-risk psychological barriers.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Psychological Readiness%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- B3) Clinical Rules (10)
INSERT INTO public.clinical_rules
(rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active)
SELECT rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active
FROM (VALUES
  ('Early swelling/high pain', 'acl', '{"or":[{">":[{"var":"swelling"},0]},{">":[{"var":"pain"},6]}]}'::jsonb, 'Reduce load; emphasize ROM, swelling control, and basic activation.', 'We reduce load until swelling and pain settle.', 1, true),
  ('Quad strength deficit high', 'acl', '{">":[{"var":"quad_deficit_pct"},20]}'::jsonb, 'Prioritize quadriceps strengthening before high-level plyometrics.', 'We build key strength before harder drills.', 1, true),
  ('Hop test asymmetry', 'acl', '{">":[{"var":"hop_asymmetry_pct"},10]}'::jsonb, 'Delay RTS progression; address deficits and movement quality.', 'We need better symmetry before return-to-sport steps.', 1, true),
  ('Poor landing mechanics', 'acl', '{"==":[{"var":"landing_faults"},true]}'::jsonb, 'Add landing mechanics training and neuromuscular drills.', 'We improve how you land to reduce risk.', 2, true),
  ('Psych readiness low', 'acl', '{"==":[{"var":"psych_readiness_low"},true]}'::jsonb, 'Add confidence plan, graded exposure, and coaching support.', 'We build confidence step-by-step.', 2, true),
  ('RTS criteria met', 'acl', '{"==":[{"var":"RTS_criteria_met"},true]}'::jsonb, 'Begin graded return to sport with monitoring.', 'You are ready to start sport-specific progression safely.', 3, true),
  ('High reinjury risk profile', 'acl', '{"==":[{"var":"high_reinjury_risk"},true]}'::jsonb, 'Progress conservatively; increase monitoring frequency.', 'We progress carefully to reduce reinjury risk.', 2, true),
  ('Low adherence', 'acl', '{"==":[{"var":"adherence_low"},true]}'::jsonb, 'Simplify plan; set minimum effective dose; schedule check-ins.', 'We will make the plan easier to follow consistently.', 2, true),
  ('Running readiness achieved', 'acl', '{"==":[{"var":"running_ready"},true]}'::jsonb, 'Start a graded running progression.', 'You can begin a safe return to running plan.', 2, true),
  ('Pain spike after progression', 'acl', '{">":[{"var":"pain_increase"},2]}'::jsonb, 'Regress one stage; adjust volume.', 'If pain increases, we step back and stabilize.', 1, true)
) AS t(rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active)
WHERE NOT EXISTS (SELECT 1 FROM clinical_rules cr WHERE cr.rule_name = t.rule_name AND cr.domain = t.domain);

-- B4) Care Pathway Templates (4)
INSERT INTO public.care_pathway_templates
(name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active)
SELECT name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active
FROM (VALUES
  ('ACL Rehab – Early Phase', 'acl', '{"stage":"early"}'::jsonb, '{"phase1":"ROM + swelling control","phase2":"activation + gait","phase3":"basic strength"}'::jsonb, '{"visits":"4–8"}'::jsonb, '{"frequency":"most days","emphasis":"ROM + activation"}'::jsonb, true),
  ('ACL Rehab – Strength & Control', 'acl', '{"stage":"mid"}'::jsonb, '{"phase1":"progressive strength","phase2":"neuromuscular control","phase3":"intro plyometrics"}'::jsonb, '{"visits":"6–10"}'::jsonb, '{"frequency":"3–5x/week","emphasis":"strength + control"}'::jsonb, true),
  ('ACL Rehab – Running & Plyometrics', 'acl', '{"stage":"late"}'::jsonb, '{"phase1":"running progression","phase2":"plyometrics","phase3":"sport drills"}'::jsonb, '{"visits":"4–8"}'::jsonb, '{"frequency":"3–5x/week","emphasis":"graded exposure"}'::jsonb, true),
  ('ACL Return to Sport – Criteria-Based', 'acl', '{"stage":"RTS"}'::jsonb, '{"phase1":"testing","phase2":"graded sport","phase3":"monitor + reduce risk"}'::jsonb, '{"visits":"2–6"}'::jsonb, '{"frequency":"per plan","emphasis":"criteria + monitoring"}'::jsonb, true)
) AS t(name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active)
WHERE NOT EXISTS (SELECT 1 FROM care_pathway_templates cpt WHERE cpt.name = t.name AND cpt.domain = t.domain);

-- B5) Patient Education Assets (10)
INSERT INTO public.patient_education_assets
(title, reading_level, topic_tags, content_md, is_active)
SELECT title, reading_level, topic_tags, content_md, is_active
FROM (VALUES
  ('Why Strength Matters After ACL', 6, ARRAY['strength'], 'Strength—especially quadriceps strength—supports safe return to activity.', true),
  ('Swelling and Pain Management', 6, ARRAY['early_phase'], 'Swelling control helps movement and strength come back faster.', true),
  ('Running Progression Basics', 6, ARRAY['running'], 'Running returns step-by-step based on readiness.', true),
  ('Landing Mechanics', 6, ARRAY['neuromuscular'], 'How you land matters. We train safer mechanics.', true),
  ('Return to Sport Is Criteria-Based', 6, ARRAY['RTS'], 'Time is not enough. We use tests to guide return.', true),
  ('Hop Tests Explained', 6, ARRAY['testing'], 'Hop tests help measure readiness and symmetry.', true),
  ('Confidence After Injury', 6, ARRAY['psychology'], 'Confidence is part of recovery. We build it gradually.', true),
  ('Adherence Wins', 6, ARRAY['adherence'], 'Small consistent work beats big bursts.', true),
  ('Setbacks and Flare-Ups', 6, ARRAY['self_management'], 'Setbacks happen. We adjust and move forward.', true),
  ('Your Role in Risk Reduction', 6, ARRAY['prevention'], 'A good warm-up and strength plan can reduce future risk.', true)
) AS t(title, reading_level, topic_tags, content_md, is_active)
WHERE NOT EXISTS (SELECT 1 FROM patient_education_assets pea WHERE pea.title = t.title);

-- =============================================================================
-- C) NEURO REHAB STARTER PACK (WFNR-anchored)
-- =============================================================================

-- C1) Research Sources (6)
DO $$
DECLARE
  v_neuro_authority_id uuid;
BEGIN
  SELECT authority_id INTO v_neuro_authority_id
  FROM evidence_authorities
  WHERE domain = 'neuro'
  LIMIT 1;

  INSERT INTO public.research_sources
  (id, name, source_type, authority_id, credibility_score, approved, auto_ingest, tier, created_at, updated_at)
  SELECT gen_random_uuid(), name, source_type, v_neuro_authority_id, credibility_score, approved, auto_ingest, tier, NOW(), NOW()
  FROM (VALUES
    ('Neurorehabilitation Principles & Neuroplasticity Overview', 'journal', 95, true, false, 1),
    ('Task-Specific Training After Stroke', 'journal', 92, true, false, 1),
    ('Intensity and Repetition in Neuro Rehab', 'journal', 88, true, false, 2),
    ('Balance Training in Neurological Conditions', 'journal', 87, true, false, 2),
    ('Fatigue Management in MS Rehabilitation', 'journal', 84, true, false, 2),
    ('Gait Training and Mobility Recovery', 'journal', 90, true, false, 1)
  ) AS t(name, source_type, credibility_score, approved, auto_ingest, tier)
  WHERE NOT EXISTS (
    SELECT 1 FROM research_sources WHERE research_sources.name = t.name
  );
END $$;

-- C2) Evidence Claims (32) - Neuroplasticity
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['function','participation'],
  '{"domain":"neuro","population":"general"}'::jsonb,
  '{"approach":"neurorehab","core":["task_specific","repetition","salience"]}'::jsonb,
  ARRAY['standard_care'], 'expert', 'low',
  ARRAY['neuroplasticity','principles'], 0.9, 'approved'
FROM (VALUES
 ('Task-specific practice supports functional recovery.'),
 ('Repetition and intensity drive skill improvement.'),
 ('Meaningful tasks improve engagement and outcomes.'),
 ('Progression should match capacity and safety.'),
 ('Feedback improves motor learning.'),
 ('Consistency matters for skill retention.'),
 ('Practice should be varied and goal-driven.'),
 ('Fatigue management is essential for dosing.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Neurorehabilitation Principles%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- C2) Evidence Claims - Stroke task-specific
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['function','mobility'],
  '{"domain":"neuro","condition":"stroke"}'::jsonb,
  '{"approach":"task_specific_training"}'::jsonb,
  ARRAY['standard_care'], 'systematic_review', 'low',
  ARRAY['stroke','task_specific'], 0.92, 'approved'
FROM (VALUES
 ('Task-specific training improves functional outcomes after stroke.'),
 ('Upper-limb practice improves arm function.'),
 ('Walking practice improves gait outcomes.'),
 ('More practice tends to improve results.'),
 ('Goal setting supports participation.'),
 ('Home practice increases total dosage.'),
 ('Early mobility supports better recovery.'),
 ('Progress should be measured and adjusted.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Task-Specific Training%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- C2) Evidence Claims - Gait & balance
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['mobility','falls_risk'],
  '{"domain":"neuro","population":"general"}'::jsonb,
  '{"approach":"gait_balance_training"}'::jsonb,
  ARRAY['no_training'], 'systematic_review', 'low',
  ARRAY['gait','balance','falls'], 0.9, 'approved'
FROM (VALUES
 ('Gait training improves walking function.'),
 ('Balance training improves stability and mobility.'),
 ('Progressive challenge improves balance gains.'),
 ('Dual-task training can improve real-world function.'),
 ('Assistive devices may improve safety and independence.'),
 ('Strength contributes to balance and gait.'),
 ('Practice frequency affects outcomes.'),
 ('Monitoring reduces falls risk.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Gait Training%' OR name LIKE 'Balance Training%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- C2) Evidence Claims - Fatigue
INSERT INTO public.evidence_claims
(claim_id, source_id, claim_text, effect_direction, outcomes, population, intervention, 
 comparators, evidence_level, risk_of_bias, clinical_tags, confidence_score, status)
SELECT 
  gen_random_uuid(), rs.id, claim_text, 'benefit',
  ARRAY['adherence','function'],
  '{"domain":"neuro","condition":"MS"}'::jsonb,
  '{"approach":"fatigue_management","core":["pacing","energy_conservation"]}'::jsonb,
  ARRAY['no_pacing'], 'cohort', 'some_concerns',
  ARRAY['fatigue','pacing'], 0.86, 'approved'
FROM (VALUES
 ('Fatigue limits rehab dosage and requires pacing.'),
 ('Energy conservation improves participation.'),
 ('Sleep and stress affect fatigue severity.'),
 ('Short, frequent sessions can improve tolerance.'),
 ('Overexertion can reduce adherence.'),
 ('Self-monitoring helps regulate activity.'),
 ('Rest breaks support quality practice.'),
 ('Consistency supports steady gains.')
) AS t(claim_text)
CROSS JOIN (SELECT id FROM research_sources WHERE name LIKE 'Fatigue Management%' LIMIT 1) rs
WHERE NOT EXISTS (SELECT 1 FROM evidence_claims ec WHERE ec.claim_text = t.claim_text);

-- C3) Clinical Rules (10)
INSERT INTO public.clinical_rules
(rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active)
SELECT rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active
FROM (VALUES
  ('High fall risk', 'neuro', '{"==":[{"var":"fall_risk_high"},true]}'::jsonb, 'Prioritize safety, balance training, and home risk reduction.', 'We focus on safety and stability first.', 1, true),
  ('Fatigue high', 'neuro', '{"==":[{"var":"fatigue_high"},true]}'::jsonb, 'Use pacing; shorten sessions; increase rest breaks.', 'We pace sessions to protect your energy.', 1, true),
  ('Low adherence', 'neuro', '{"==":[{"var":"adherence_low"},true]}'::jsonb, 'Reduce plan complexity; focus on 1–2 key tasks daily.', 'We simplify the plan so it is easier to follow.', 2, true),
  ('Gait deviation significant', 'neuro', '{"==":[{"var":"gait_issue_significant"},true]}'::jsonb, 'Emphasize gait training and assistive strategy if needed.', 'We practice walking in a safer way.', 2, true),
  ('Balance improves', 'neuro', '{"==":[{"var":"balance_improving"},true]}'::jsonb, 'Progress challenge and dual-task demands gradually.', 'We will slowly make balance work more challenging.', 3, true),
  ('Spasticity high', 'neuro', '{"==":[{"var":"spasticity_high"},true]}'::jsonb, 'Adjust dosing; add mobility and positioning strategies.', 'We adjust the plan to reduce tightness effects.', 2, true),
  ('Plateau 4+ visits', 'neuro', '{"and":[{">=":[{"var":"visits"},4]},{"==":[{"var":"progress_plateau"},true]}]}'::jsonb, 'Change task selection, increase salience, reassess barriers.', 'If progress stalls, we change the plan to target what matters.', 2, true),
  ('Home safety concerns', 'neuro', '{"==":[{"var":"home_safety_concerns"},true]}'::jsonb, 'Initiate home safety checklist and caregiver education.', 'We reduce risks at home.', 1, true),
  ('Goal achieved', 'neuro', '{"==":[{"var":"goal_achieved"},true]}'::jsonb, 'Set next functional goal and progress practice.', 'Great—now we build on that success.', 3, true),
  ('Cognitive overload', 'neuro', '{"==":[{"var":"cognitive_overload"},true]}'::jsonb, 'Reduce complexity; focus on one task at a time.', 'We keep tasks simple when concentration is harder.', 2, true)
) AS t(rule_name, domain, trigger, recommendation_text, patient_explanation_text, priority, is_active)
WHERE NOT EXISTS (SELECT 1 FROM clinical_rules cr WHERE cr.rule_name = t.rule_name AND cr.domain = t.domain);

-- C4) Care Pathway Templates (4)
INSERT INTO public.care_pathway_templates
(name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active)
SELECT name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active
FROM (VALUES
  ('Neuro Rehab – Task-Specific Recovery', 'neuro', '{"focus":"task_specific"}'::jsonb, '{"phase1":"baseline + safety","phase2":"task practice","phase3":"progress + independence"}'::jsonb, '{"visits":"8–12"}'::jsonb, '{"frequency":"daily practice","emphasis":"task-specific reps"}'::jsonb, true),
  ('Stroke – Mobility & Gait Focus', 'neuro', '{"condition":"stroke","focus":"gait"}'::jsonb, '{"phase1":"safe mobility","phase2":"gait practice","phase3":"community walking"}'::jsonb, '{"visits":"8–14"}'::jsonb, '{"frequency":"most days","emphasis":"walking practice"}'::jsonb, true),
  ('Neuro – Balance & Falls Reduction', 'neuro', '{"focus":"balance"}'::jsonb, '{"phase1":"safety","phase2":"progressive balance","phase3":"dual-task"}'::jsonb, '{"visits":"6–10"}'::jsonb, '{"frequency":"most days","emphasis":"balance challenge"}'::jsonb, true),
  ('MS – Fatigue-Smart Rehab', 'neuro', '{"condition":"MS"}'::jsonb, '{"phase1":"pacing + baseline","phase2":"short practice blocks","phase3":"capacity build"}'::jsonb, '{"visits":"6–12"}'::jsonb, '{"frequency":"micro-doses","emphasis":"pacing + consistency"}'::jsonb, true)
) AS t(name, domain, intended_population, phases, visit_guidance, home_program_guidance, is_active)
WHERE NOT EXISTS (SELECT 1 FROM care_pathway_templates cpt WHERE cpt.name = t.name AND cpt.domain = t.domain);

-- C5) Patient Education Assets (10)
INSERT INTO public.patient_education_assets
(title, reading_level, topic_tags, content_md, is_active)
SELECT title, reading_level, topic_tags, content_md, is_active
FROM (VALUES
  ('Why Repetition Matters', 6, ARRAY['neuroplasticity'], 'Practice helps the brain build new pathways.', true),
  ('Task Practice at Home', 6, ARRAY['self_management'], 'Short daily practice can improve function.', true),
  ('Balance Safety Tips', 6, ARRAY['safety'], 'Use supports, clear clutter, and take your time.', true),
  ('Falls Prevention Basics', 6, ARRAY['falls'], 'Small changes at home can reduce fall risk.', true),
  ('Fatigue and Pacing', 6, ARRAY['fatigue'], 'Pacing helps you do more over time with fewer crashes.', true),
  ('Walking Practice', 6, ARRAY['gait'], 'Walking practice improves walking.', true),
  ('Rest Breaks Are Part of Training', 6, ARRAY['pacing'], 'Rest helps keep practice quality high.', true),
  ('Tracking Progress', 6, ARRAY['tracking'], 'Track function wins: walking, stairs, transfers.', true),
  ('When to Ask for Help', 6, ARRAY['support'], 'If safety feels uncertain, ask for support.', true),
  ('Your Role in Recovery', 6, ARRAY['self_management'], 'Small consistent practice is powerful.', true)
) AS t(title, reading_level, topic_tags, content_md, is_active)
WHERE NOT EXISTS (SELECT 1 FROM patient_education_assets pea WHERE pea.title = t.title);
