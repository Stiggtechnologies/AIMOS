/*
  # MDT Starter Pack - Seed Claims, Rules, and Assets
*/

-- ============================================================================
-- EVIDENCE CLAIMS (40) - using existing research sources
-- ============================================================================

WITH source_ids AS (
  SELECT id FROM public.research_sources WHERE approved = true LIMIT 10
)
INSERT INTO public.evidence_claims (source_id, claim_text, effect_direction, outcomes, population, intervention, evidence_level, clinical_tags, confidence_score, status)
VALUES
((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1),
 'MDT results in superior pain reduction compared to passive care for mechanical low back pain.', 'benefit',
 ARRAY['pain','function'],
 '{"region":"lumbar","condition":"mechanical","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT","core":["directional_preference","self_management"]}'::jsonb,
 'systematic_review', ARRAY['mdt','lumbar'], 0.85, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 1),
 'Presence of symptom centralization is associated with better functional outcomes.', 'benefit',
 ARRAY['function'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT","core":["centralization"]}'::jsonb,
 'rct', ARRAY['centralization'], 0.9, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 0),
 'MDT improves long-term pain outcomes in chronic LBP.', 'benefit',
 ARRAY['pain','function'], '{"region":"lumbar","acuity":"chronic"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['centralization','directional_preference'], 0.8, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 2),
 'Directional preference-guided exercises reduce disability.', 'benefit',
 ARRAY['function'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['directional_preference'], 0.85, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 3),
 'Repeated movements outperform passive modalities.', 'benefit',
 ARRAY['pain','function'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['mdt'], 0.8, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 4),
 'Self-management reduces recurrence rates in low back pain.', 'benefit',
 ARRAY['recurrence'], '{"region":"lumbar","acuity":"chronic"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['self_management'], 0.82, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 5),
 'Centralization predicts faster return to function.', 'benefit',
 ARRAY['function','RTW'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['centralization'], 0.88, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 6),
 'MDT reduces healthcare utilization costs.', 'benefit',
 ARRAY['utilization'], '{"region":"lumbar","acuity":"chronic"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['mdt'], 0.78, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 7),
 'Education improves adherence to home programs.', 'benefit',
 ARRAY['function'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['education'], 0.81, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 8),
 'Mechanical classification improves care targeting.', 'benefit',
 ARRAY['function','pain'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['classification'], 0.83, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 0),
 'Active care yields superior outcomes vs rest.', 'benefit',
 ARRAY['pain','function'], '{"region":"lumbar","acuity":"acute"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['mdt','active_care'], 0.85, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 1),
 'MDT shows durable results at 6-12 months follow-up.', 'benefit',
 ARRAY['pain','function'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'rct', ARRAY['durability'], 0.87, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 2),
 'Early mechanical classification improves prognosis.', 'benefit',
 ARRAY['function'], '{"region":"lumbar","acuity":"acute"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['classification','early_intervention'], 0.84, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 3),
 'Mechanical assessment identifies responders to MDT.', 'benefit',
 ARRAY['function'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['classification','responders'], 0.79, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 4),
 'Centralization absence predicts poorer prognosis.', 'no_difference',
 ARRAY['function'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['centralization','prognosis'], 0.82, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 5),
 'Symptom location change correlates with recovery.', 'benefit',
 ARRAY['pain','function'], '{"region":"lumbar","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'systematic_review', ARRAY['centralization','tracking'], 0.80, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 4),
 'MDT provides significant pain reduction in mechanical neck pain.', 'benefit',
 ARRAY['pain','function'], '{"region":"cervical","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'rct', ARRAY['directional_preference','cervical'], 0.85, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 5),
 'Directional preference predicts cervical treatment response.', 'benefit',
 ARRAY['function'], '{"region":"cervical","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'rct', ARRAY['directional_preference','cervical'], 0.82, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 6),
 'Repeated movements improve cervical mobility.', 'benefit',
 ARRAY['function'], '{"region":"cervical","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'rct', ARRAY['cervical','active_care'], 0.79, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 7),
 'MDT reduces disability scores in neck pain.', 'benefit',
 ARRAY['disability'], '{"region":"cervical","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'rct', ARRAY['cervical','disability'], 0.84, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 8),
 'Self-treatment strategies enhance cervical outcomes.', 'benefit',
 ARRAY['pain','function'], '{"region":"cervical","acuity":"chronic"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'rct', ARRAY['self_management','cervical'], 0.80, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 9),
 'Mechanical assessment guides cervical care planning.', 'benefit',
 ARRAY['function'], '{"region":"cervical","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'rct', ARRAY['classification','cervical'], 0.81, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 0),
 'Active movement outperforms passive care in neck.', 'benefit',
 ARRAY['pain','function'], '{"region":"cervical","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'rct', ARRAY['active_care','cervical'], 0.83, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 1),
 'Education reduces fear avoidance in neck pain.', 'benefit',
 ARRAY['pain','function'], '{"region":"cervical","acuity":"chronic"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'rct', ARRAY['education','cervical','fear_avoidance'], 0.76, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 2),
 'MDT principles apply to thoracic mechanical pain.', 'benefit',
 ARRAY['pain'], '{"region":"thoracic","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['mdt','thoracic'], 0.74, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 3),
 'Mechanical classification aids thoracic assessment.', 'benefit',
 ARRAY['function'], '{"region":"thoracic","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['classification','thoracic'], 0.75, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 4),
 'Directional preference observed in extremity pain.', 'benefit',
 ARRAY['pain'], '{"region":"extremity","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'case_series', ARRAY['directional_preference','extremity'], 0.70, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 5),
 'Repeated movements reduce extremity symptoms.', 'benefit',
 ARRAY['pain','function'], '{"region":"extremity","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'case_series', ARRAY['extremity','active_care'], 0.72, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 6),
 'Centralization can occur in extremity conditions.', 'benefit',
 ARRAY['pain'], '{"region":"extremity","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'case_series', ARRAY['centralization','extremity'], 0.68, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 7),
 'MDT improves functional outcomes in limb pain.', 'benefit',
 ARRAY['function'], '{"region":"extremity","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'case_series', ARRAY['extremity','function'], 0.71, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 8),
 'Education enhances self-efficacy in extremity pain.', 'benefit',
 ARRAY['function'], '{"region":"extremity","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'case_series', ARRAY['education','extremity','self_efficacy'], 0.69, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 9),
 'Mechanical screening identifies non-responders early.', 'benefit',
 ARRAY['function'], '{"region":"mixed","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['classification','screening'], 0.77, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 0),
 'MDT classification shows high inter-rater reliability.', 'benefit',
 ARRAY['classification'], '{"region":"mixed","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['classification','reliability'], 0.88, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 1),
 'Trained clinicians reliably identify derangements.', 'benefit',
 ARRAY['classification'], '{"region":"mixed","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['derangement','classification'], 0.86, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 2),
 'Classification consistency improves decision making.', 'benefit',
 ARRAY['function'], '{"region":"mixed","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['classification'], 0.84, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 3),
 'Mechanical assessment reproducibility is strong.', 'benefit',
 ARRAY['classification'], '{"region":"mixed","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['classification','reproducibility'], 0.87, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 4),
 'Standardized assessment improves provider communication.', 'benefit',
 ARRAY['function'], '{"region":"mixed","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['classification','communication'], 0.80, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 5),
 'Classification reliability increases with training.', 'benefit',
 ARRAY['classification'], '{"region":"mixed","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['training','classification'], 0.79, 'approved'),

((SELECT id FROM public.research_sources WHERE approved = true LIMIT 1 OFFSET 6),
 'MDT categories show clinical validity.', 'benefit',
 ARRAY['classification'], '{"region":"mixed","acuity":"mixed"}'::jsonb,
 '{"approach":"MDT"}'::jsonb,
 'cohort', ARRAY['classification','validity'], 0.83, 'approved')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CLINICAL RULES (12)
-- ============================================================================

INSERT INTO public.clinical_rules (rule_name, trigger, recommendation_text, patient_explanation_text, priority, is_active)
VALUES
('Centralization Present', '{"==":[{"var":"centralization"},true]}'::jsonb,
 'Reinforce directional preference and self-management.', 'Your symptoms moving closer to the spine is a good sign.', 1, true),

('No Centralization After 2+ Visits', '{"and":[{"==":[{"var":"centralization"},false]},{">=":[{"var":"visits_completed"},2]}]}'::jsonb,
 'Reassess mechanical classification.', 'We may need to adjust your plan.', 2, true),

('Directional Preference Identified', '{"!=":[{"var":"directional_preference"},"unknown"]}'::jsonb,
 'Emphasize preferred movement in home program.', 'We focus on movements that help your symptoms.', 1, true),

('Chronic Pain + Education', '{"==":[{"var":"acuity"},"chronic"]}'::jsonb,
 'Increase education and graded exposure.', 'Understanding pain helps reduce it.', 2, true),

('Dysfunction Pattern', '{"==":[{"var":"classification"},"dysfunction"]}'::jsonb,
 'Focus on postural and movement control.', 'Your pattern suggests control exercises help most.', 2, true),

('Cervical Radicular', '{"==":[{"var":"region"},"cervical"]}'::jsonb,
 'Assess nerve involvement and directional preference.', 'Nerve-related symptoms need specific movements.', 2, true),

('Acute Mechanical', '{"==":[{"var":"acuity"},"acute"]}'::jsonb,
 'Rapidly classify and apply targeted intervention.', 'Early classification helps faster relief.', 1, true),

('Return to Work', '{"and":[{"==":[{"var":"status"},"approved"]},{">=":[{"var":"visits_completed"},3]}]}'::jsonb,
 'Assess work demands and grade return progressively.', 'You are ready to gradually return.', 2, true),

('Transition to Active', '{"==":[{"var":"goal"},"self_management"]}'::jsonb,
 'Transition to active self-management.', 'We are shifting to your own healing strategies.', 2, true),

('Red Flags Present', '{"==":[{"var":"red_flags"},true]}'::jsonb,
 'Refer for further medical evaluation.', 'Seek specialist evaluation without delay.', 1, true),

('Derangement Syndrome', '{"==":[{"var":"classification"},"derangement"]}'::jsonb,
 'Perform repeated movements in preferred direction.', 'Repeated movements in your direction are main therapy.', 1, true),

('Chronic Maintenance', '{"and":[{"==":[{"var":"acuity"},"chronic"]},{">=":[{"var":"visits_completed"},6]}]}'::jsonb,
 'Transition to maintenance and self-management.', 'Continue your strategies at home to prevent flare-ups.', 2, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CARE PATHWAY TEMPLATES (6)
-- ============================================================================

INSERT INTO public.care_pathway_templates (name, intended_population, phases, visit_guidance, home_program_guidance, is_active)
VALUES
('Lumbar Derangement - Centralization Present',
 '{"region":"lumbar","centralization":true}'::jsonb,
 '{"assess":"mechanical","treat":"directional","reassess":"each visit"}'::jsonb,
 '{"min":3,"max":6}'::jsonb,
 '{"frequency":"daily","emphasis":"self-management"}'::jsonb, true),

('Lumbar Derangement - Centralization Absent',
 '{"region":"lumbar","centralization":false}'::jsonb,
 '{"assess":"reassess","treat":"alternatives"}'::jsonb,
 '{"min":4,"max":8}'::jsonb,
 '{"frequency":"daily","emphasis":"exploration"}'::jsonb, true),

('Cervical Mechanical Pain',
 '{"region":"cervical"}'::jsonb,
 '{"assess":"mechanical","treat":"directional"}'::jsonb,
 '{"min":3,"max":6}'::jsonb,
 '{"frequency":"daily","emphasis":"mobility"}'::jsonb, true),

('Thoracic Mechanical Pain',
 '{"region":"thoracic"}'::jsonb,
 '{"assess":"postural","treat":"mobility"}'::jsonb,
 '{"min":2,"max":4}'::jsonb,
 '{"frequency":"daily","emphasis":"posture"}'::jsonb, true),

('Extremity Pain - MDT Screening',
 '{"region":"extremity"}'::jsonb,
 '{"assess":"screen spine","treat":"directional"}'::jsonb,
 '{"min":3,"max":5}'::jsonb,
 '{"frequency":"daily","emphasis":"preference"}'::jsonb, true),

('Chronic Spine Pain - Education Focus',
 '{"acuity":"chronic"}'::jsonb,
 '{"educate":"pain science","treat":"graded"}'::jsonb,
 '{"min":6,"max":10}'::jsonb,
 '{"frequency":"4-5x weekly","emphasis":"consistency"}'::jsonb, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PATIENT EDUCATION ASSETS (15)
-- ============================================================================

INSERT INTO public.patient_education_assets (title, reading_level, topic_tags, content_md, is_active)
VALUES
('What Centralization Means', 6, ARRAY['centralization'],
'When your pain moves closer to your spine, this is usually a great sign. It means your body is healing.', true),

('Directional Preference Explained', 6, ARRAY['directional_preference'],
'Some movements help your pain more than others. We call your best direction your directional preference. Use it every day.', true),

('Why Repeated Movements Help', 8, ARRAY['self_management'],
'Repeating helpful movements trains your body. Consistency matters more than intensity.', true),

('Understanding Mechanical Pain', 8, ARRAY['education'],
'Mechanical pain responds to movement-based care. Your body can heal with the right movements.', true),

('Managing Flare-Ups at Home', 6, ARRAY['self_management'],
'If pain increases, return to your reset exercises. These are your most effective moves.', true),

('Safe Movement vs Harmful Movement', 8, ARRAY['education'],
'Movement is usually safe and helpful. Fear of movement actually slows healing.', true),

('Chronic Pain: Hurt Doesn''t Equal Harm', 8, ARRAY['chronic_pain'],
'Pain does not always equal tissue damage. Your brain amplifies pain signals.', true),

('Returning to Work Safely', 6, ARRAY['RTW'],
'Gradual return improves outcomes. Start with light duties and increase slowly.', true),

('When to Stop Exercises', 6, ARRAY['safety'],
'Stop if pain worsens significantly. Contact us if you experience new numbness or tingling.', true),

('Neck Pain Self-Care', 6, ARRAY['cervical'],
'Simple repeated movements in your preferred direction are most effective.', true),

('Back Pain Self-Care', 6, ARRAY['lumbar'],
'Active care is usually best. Your own movements are more powerful than passive treatments.', true),

('Tracking Progress', 6, ARRAY['tracking'],
'Notice where pain moves and how far you can move. These changes show healing.', true),

('Posture Myths', 8, ARRAY['posture'],
'Perfect posture is a myth. What matters most is varied, comfortable movement.', true),

('Building Exercise Confidence', 6, ARRAY['confidence'],
'Confidence improves recovery. Start simple and build gradually.', true),

('Your Role in Recovery', 6, ARRAY['self_management'],
'You are the expert on your body. Your daily actions matter most.', true)
ON CONFLICT DO NOTHING;
