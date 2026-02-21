/*
  # Seed Sales & Intake Pipeline Demo Data

  ## Purpose
  Populate intake pipeline with realistic patient journey data

  ## Data Seeded
  - Intake pipeline records across all stages
  - Intake actions (calls, emails, assessments)
  - Intake outcomes (conversions, drop-offs)
  - Assignment rules for routing
  - Demonstrates SLA tracking and drop-off analysis
*/

-- Get some lead IDs to convert to intake
WITH lead_ids AS (
  SELECT id, clinic_id, first_name, last_name, email, phone, injury_type
  FROM leads
  LIMIT 5
)
-- Intake Pipeline Records (various stages)
INSERT INTO intake_pipeline (
  lead_id, clinic_id, patient_first_name, patient_last_name,
  patient_email, patient_phone, injury_type, injury_date,
  referral_source, insurance_type, stage, priority, assigned_to,
  first_contact_at, assessed_at, booked_at, first_visit_at,
  estimated_value, actual_value, notes, created_at
)
-- Stage: Attended (successful conversion)
SELECT 
  (SELECT id FROM lead_ids LIMIT 1 OFFSET 0),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'John', 'Mitchell',
  'john.mitchell@email.com', '403-555-0101',
  'Back strain', (CURRENT_DATE - INTERVAL '15 days')::date,
  'Google Ads', 'WCB',
  'attended', 'normal',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '13 days',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '10 days',
  2500.00, 2800.00,
  'Patient attended first visit. Excellent engagement.',
  NOW() - INTERVAL '15 days'
UNION ALL
-- Stage: Booked (waiting for first visit)
SELECT 
  (SELECT id FROM lead_ids LIMIT 1 OFFSET 1),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'Sarah', 'Thompson',
  'sarah.t@email.com', '403-555-0102',
  'Shoulder injury', (CURRENT_DATE - INTERVAL '8 days')::date,
  'Google Ads', 'Private Insurance',
  'booked', 'high',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '5 days',
  NULL,
  2200.00, NULL,
  'First appointment scheduled for next week.',
  NOW() - INTERVAL '8 days'
UNION ALL
-- Stage: Contacted (assessment pending)
SELECT 
  (SELECT id FROM lead_ids LIMIT 1 OFFSET 2),
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'Michael', 'Chen',
  'mchen@email.com', '403-555-0103',
  'Knee injury', (CURRENT_DATE - INTERVAL '4 days')::date,
  'Referral', 'WCB',
  'contacted', 'urgent',
  '28d35bde-fdeb-49a1-b13d-a67a0e049673'::uuid,
  NOW() - INTERVAL '3 days',
  NULL, NULL, NULL,
  3000.00, NULL,
  'Waiting for insurance pre-approval.',
  NOW() - INTERVAL '4 days'
UNION ALL
-- Stage: Lead In (new inquiry)
SELECT 
  NULL,
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'Emma', 'Rodriguez',
  'emma.r@email.com', '403-555-0104',
  'Ankle sprain', (CURRENT_DATE - INTERVAL '2 days')::date,
  'Facebook Ads', 'MVA',
  'lead_in', 'normal',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NULL, NULL, NULL, NULL,
  1800.00, NULL,
  'New lead from social media campaign.',
  NOW() - INTERVAL '2 days'
UNION ALL
-- Additional records without lead_id
SELECT 
  NULL,
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'David', 'Park',
  'dpark@email.com', '403-555-0105',
  'Rotator cuff', (CURRENT_DATE - INTERVAL '6 days')::date,
  'Instagram Ads', 'Private Insurance',
  'assessed', 'normal',
  '28d35bde-fdeb-49a1-b13d-a67a0e049673'::uuid,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '4 days',
  NULL, NULL,
  2400.00, NULL,
  'Assessment complete. Waiting for patient to confirm booking.',
  NOW() - INTERVAL '6 days'
UNION ALL
SELECT 
  NULL,
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'Lisa', 'Anderson',
  'lisa.anderson@email.com', '403-555-0106',
  'Whiplash', (CURRENT_DATE - INTERVAL '20 days')::date,
  'Display Ads', 'MVA',
  'ongoing_care', 'normal',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '19 days',
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '17 days',
  NOW() - INTERVAL '15 days',
  3500.00, 3200.00,
  'Patient progressing well. 8 visits completed.',
  NOW() - INTERVAL '20 days'
UNION ALL
SELECT 
  NULL,
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'Robert', 'Wilson',
  'rwilson@email.com', '403-555-0107',
  'Back pain', (CURRENT_DATE - INTERVAL '3 days')::date,
  'Display Ads', 'WCB',
  'lead_in', 'high',
  '28d35bde-fdeb-49a1-b13d-a67a0e049673'::uuid,
  NULL, NULL, NULL, NULL,
  2000.00, NULL,
  'Urgent case. Requires follow-up within 24 hours.',
  NOW() - INTERVAL '3 days'
UNION ALL
SELECT 
  NULL,
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'Jennifer', 'Lee',
  'jennifer.lee@company.com', '403-555-0108',
  'Neck strain', (CURRENT_DATE - INTERVAL '10 days')::date,
  'LinkedIn', 'Employer Direct',
  'discharged', 'normal',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '9 days',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '5 days',
  1500.00, 1600.00,
  'Treatment complete. Patient fully recovered.',
  NOW() - INTERVAL '10 days'
UNION ALL
SELECT 
  NULL,
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  'Brian', 'Taylor',
  'btaylor@business.com', '403-555-0109',
  'Wrist injury', (CURRENT_DATE - INTERVAL '1 day')::date,
  'LinkedIn', 'Employer Direct',
  'lead_in', 'normal',
  NULL,
  NULL, NULL, NULL, NULL,
  1800.00, NULL,
  'New lead. Not yet assigned.',
  NOW() - INTERVAL '1 day'
UNION ALL
-- Drop-off example
SELECT 
  NULL,
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  'Amanda', 'Brown',
  'abrown@email.com', '403-555-0110',
  'Wrist pain', (CURRENT_DATE - INTERVAL '12 days')::date,
  'Google Ads', 'Self-Pay',
  'contacted', 'normal',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '11 days',
  NULL, NULL, NULL,
  1200.00, 0.00,
  'Patient decided to seek care elsewhere.',
  NOW() - INTERVAL '12 days'
ON CONFLICT DO NOTHING;

-- Intake Actions (activity log for each intake)
WITH intake_records AS (
  SELECT id, patient_first_name, patient_last_name, stage FROM intake_pipeline
)
INSERT INTO intake_actions (
  intake_id, action_type, action_by, action_date, outcome, next_action_due, notes
)
-- Actions for John Mitchell (attended)
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'John' AND patient_last_name = 'Mitchell'),
  'call',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '14 days',
  'connected',
  NOW() - INTERVAL '13 days',
  'Initial contact made. Patient interested in booking.'
UNION ALL
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'John' AND patient_last_name = 'Mitchell'),
  'email',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '13 days',
  'responded',
  NOW() - INTERVAL '12 days',
  'Sent intake forms and insurance information.'
UNION ALL
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'John' AND patient_last_name = 'Mitchell'),
  'meeting',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '12 days',
  'scheduled',
  NOW() - INTERVAL '10 days',
  'Appointment booked for initial assessment.'
UNION ALL
-- Actions for Sarah Thompson (booked)
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Sarah' AND patient_last_name = 'Thompson'),
  'call',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '7 days',
  'connected',
  NOW() - INTERVAL '6 days',
  'Patient responded quickly. High engagement.'
UNION ALL
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Sarah' AND patient_last_name = 'Thompson'),
  'email',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '6 days',
  'responded',
  NOW() - INTERVAL '5 days',
  'Insurance verification completed.'
UNION ALL
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Sarah' AND patient_last_name = 'Thompson'),
  'call',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '5 days',
  'scheduled',
  NULL,
  'Appointment confirmed for next week.'
UNION ALL
-- Actions for Michael Chen (contacted)
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Michael' AND patient_last_name = 'Chen'),
  'call',
  '28d35bde-fdeb-49a1-b13d-a67a0e049673'::uuid,
  NOW() - INTERVAL '3 days',
  'connected',
  NOW() - INTERVAL '1 day',
  'Waiting for WCB approval. Following up in 2 days.'
UNION ALL
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Michael' AND patient_last_name = 'Chen'),
  'email',
  '28d35bde-fdeb-49a1-b13d-a67a0e049673'::uuid,
  NOW() - INTERVAL '2 days',
  'sent',
  NOW() + INTERVAL '1 day',
  'Sent WCB documentation requirements.'
UNION ALL
-- Actions for Amanda Brown (drop-off)
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Amanda' AND patient_last_name = 'Brown'),
  'call',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '11 days',
  'no_answer',
  NOW() - INTERVAL '10 days',
  'Left voicemail.'
UNION ALL
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Amanda' AND patient_last_name = 'Brown'),
  'call',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '9 days',
  'no_answer',
  NOW() - INTERVAL '8 days',
  'Second attempt. No response.'
UNION ALL
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Amanda' AND patient_last_name = 'Brown'),
  'email',
  'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
  NOW() - INTERVAL '8 days',
  'bounced',
  NULL,
  'Email bounced. Patient unreachable.'
ON CONFLICT DO NOTHING;

-- Intake Outcomes
WITH intake_records AS (
  SELECT id, patient_first_name, patient_last_name, stage, estimated_value FROM intake_pipeline
)
INSERT INTO intake_outcomes (
  intake_id, outcome_type, outcome_date, outcome_reason,
  revenue_generated, days_in_pipeline, touches_to_conversion, notes
)
-- Successful conversion
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'John' AND patient_last_name = 'Mitchell'),
  'converted',
  (CURRENT_DATE - INTERVAL '10 days')::date,
  'Patient attended first visit',
  2800.00,
  5,
  3,
  'Excellent conversion. Patient highly engaged throughout process.'
UNION ALL
-- Drop-off
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Amanda' AND patient_last_name = 'Brown'),
  'lost',
  (CURRENT_DATE - INTERVAL '8 days')::date,
  'Patient chose competitor',
  0.00,
  4,
  3,
  'Patient found closer clinic. Price was not the issue.'
UNION ALL
-- Discharged successfully
SELECT 
  (SELECT id FROM intake_records WHERE patient_first_name = 'Jennifer' AND patient_last_name = 'Lee'),
  'converted',
  (CURRENT_DATE - INTERVAL '5 days')::date,
  'Treatment completed',
  1600.00,
  5,
  3,
  'Full treatment cycle completed. Patient fully recovered.'
ON CONFLICT DO NOTHING;

-- Intake Assignment Rules
INSERT INTO intake_assignments (
  clinic_id, rule_name, rule_type, conditions, assigned_to, priority, is_active
)
VALUES
  (
    '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
    'Urgent Cases - Sarah Chen',
    'priority',
    '{"priority": "urgent"}'::jsonb,
    'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
    100,
    true
  ),
  (
    '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
    'WCB Cases - David Thompson',
    'specialty',
    '{"insurance_type": "WCB"}'::jsonb,
    '28d35bde-fdeb-49a1-b13d-a67a0e049673'::uuid,
    80,
    true
  ),
  (
    '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
    'Round Robin - All Staff',
    'round_robin',
    '{}'::jsonb,
    NULL,
    50,
    true
  ),
  (
    'bf3a060f-a018-43da-b45a-e184a40ec94b'::uuid,
    'MVA Cases - Sarah Chen',
    'specialty',
    '{"insurance_type": "MVA"}'::jsonb,
    'be847cf7-c907-43e1-a073-fe3bff158d65'::uuid,
    90,
    true
  )
ON CONFLICT DO NOTHING;
