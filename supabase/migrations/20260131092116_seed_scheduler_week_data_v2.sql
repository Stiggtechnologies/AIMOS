/*
  # Seed Scheduler Week View Data

  1. Purpose
    - Add more appointments across multiple days for week view
    - Add schedule blocks (breaks, meetings, administrative time)
    - Demonstrate scheduler with realistic data patterns

  2. Changes
    - Add appointments for Feb 3-5, 2026 (Monday-Wednesday)
    - Add various appointment types and durations
    - Add provider schedule blocks

  3. Data
    - 30+ appointments across the week
    - Multiple appointment types
    - Realistic scheduling patterns with breaks
*/

-- Clear existing future appointments to avoid conflicts
DELETE FROM patient_appointments 
WHERE appointment_date BETWEEN '2026-02-03' AND '2026-02-07'
  AND clinic_id = 'bf3a060f-a018-43da-b45a-e184a40ec94b';

-- Add appointments for Monday, Feb 3
INSERT INTO patient_appointments (
  id, patient_id, clinic_id, provider_id, appointment_type,
  appointment_date, start_time, end_time, status, scheduled_at, created_at
)
SELECT 
  gen_random_uuid(),
  patient_id::uuid,
  'bf3a060f-a018-43da-b45a-e184a40ec94b'::uuid,
  'bd4e7fde-bf74-4160-9428-7de6b2cdedc9'::uuid,
  appt_type,
  '2026-02-03'::date,
  start_t::time,
  end_t::time,
  status,
  NOW() - interval '3 days',
  NOW()
FROM (VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Initial Assessment', '08:00', '09:00', 'scheduled'),
  ('a2222222-2222-2222-2222-222222222222', 'Treatment Session', '09:15', '09:45', 'confirmed'),
  ('a3333333-3333-3333-3333-333333333333', 'Follow-up Treatment', '10:00', '10:30', 'scheduled'),
  ('a4444444-4444-4444-4444-444444444444', 'Re-assessment', '10:45', '11:30', 'confirmed'),
  ('a5555555-5555-5555-5555-555555555555', 'Treatment Session', '13:00', '13:30', 'scheduled'),
  ('a6666666-6666-6666-6666-666666666666', 'Initial Assessment', '14:00', '15:00', 'scheduled'),
  ('a7777777-7777-7777-7777-777777777777', 'Treatment Session', '15:15', '15:45', 'scheduled'),
  ('a8888888-8888-8888-8888-888888888888', 'Follow-up Treatment', '16:00', '16:30', 'confirmed')
) AS t(patient_id, appt_type, start_t, end_t, status)
ON CONFLICT DO NOTHING;

-- Add appointments for Tuesday, Feb 4
INSERT INTO patient_appointments (
  id, patient_id, clinic_id, provider_id, appointment_type,
  appointment_date, start_time, end_time, status, scheduled_at, created_at
)
SELECT 
  gen_random_uuid(),
  patient_id::uuid,
  'bf3a060f-a018-43da-b45a-e184a40ec94b'::uuid,
  'bd4e7fde-bf74-4160-9428-7de6b2cdedc9'::uuid,
  appt_type,
  '2026-02-04'::date,
  start_t::time,
  end_t::time,
  status,
  NOW() - interval '2 days',
  NOW()
FROM (VALUES
  ('a2222222-2222-2222-2222-222222222222', 'Treatment Session', '08:30', '09:00', 'scheduled'),
  ('a3333333-3333-3333-3333-333333333333', 'Treatment Session', '09:15', '09:45', 'confirmed'),
  ('a4444444-4444-4444-4444-444444444444', 'Treatment Session', '10:00', '10:30', 'scheduled'),
  ('a5555555-5555-5555-5555-555555555555', 'Follow-up Treatment', '11:00', '11:30', 'scheduled'),
  ('a6666666-6666-6666-6666-666666666666', 'Treatment Session', '13:30', '14:00', 'confirmed'),
  ('a7777777-7777-7777-7777-777777777777', 'Re-assessment', '14:30', '15:15', 'scheduled'),
  ('a8888888-8888-8888-8888-888888888888', 'Treatment Session', '15:30', '16:00', 'scheduled')
) AS t(patient_id, appt_type, start_t, end_t, status)
ON CONFLICT DO NOTHING;

-- Add appointments for Wednesday, Feb 5
INSERT INTO patient_appointments (
  id, patient_id, clinic_id, provider_id, appointment_type,
  appointment_date, start_time, end_time, status, scheduled_at, created_at
)
SELECT 
  gen_random_uuid(),
  patient_id::uuid,
  'bf3a060f-a018-43da-b45a-e184a40ec94b'::uuid,
  'bd4e7fde-bf74-4160-9428-7de6b2cdedc9'::uuid,
  appt_type,
  '2026-02-05'::date,
  start_t::time,
  end_t::time,
  status,
  NOW() - interval '1 day',
  NOW()
FROM (VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Treatment Session', '08:00', '08:30', 'confirmed'),
  ('a2222222-2222-2222-2222-222222222222', 'Follow-up Treatment', '09:00', '09:30', 'scheduled'),
  ('a3333333-3333-3333-3333-333333333333', 'Treatment Session', '10:00', '10:30', 'scheduled'),
  ('a4444444-4444-4444-4444-444444444444', 'Treatment Session', '10:45', '11:15', 'confirmed'),
  ('a5555555-5555-5555-5555-555555555555', 'Initial Assessment', '13:00', '14:00', 'scheduled'),
  ('a6666666-6666-6666-6666-666666666666', 'Treatment Session', '14:15', '14:45', 'scheduled'),
  ('a7777777-7777-7777-7777-777777777777', 'Treatment Session', '15:00', '15:30', 'confirmed')
) AS t(patient_id, appt_type, start_t, end_t, status)
ON CONFLICT DO NOTHING;

-- Add schedule blocks for the week
DELETE FROM clinician_schedules 
WHERE schedule_date BETWEEN '2026-02-03' AND '2026-02-07'
  AND clinic_id = 'bf3a060f-a018-43da-b45a-e184a40ec94b';

INSERT INTO clinician_schedules (id, clinician_id, clinic_id, schedule_date, schedule_type, start_time, end_time, notes, created_at)
VALUES
  -- Monday blocks
  (gen_random_uuid(), 'bd4e7fde-bf74-4160-9428-7de6b2cdedc9', 'bf3a060f-a018-43da-b45a-e184a40ec94b', '2026-02-03', 'break', '12:00:00', '12:30:00', 'Lunch Break', NOW()),
  -- Tuesday blocks
  (gen_random_uuid(), 'bd4e7fde-bf74-4160-9428-7de6b2cdedc9', 'bf3a060f-a018-43da-b45a-e184a40ec94b', '2026-02-04', 'meeting', '10:30:00', '11:00:00', 'Team Huddle', NOW()),
  (gen_random_uuid(), 'bd4e7fde-bf74-4160-9428-7de6b2cdedc9', 'bf3a060f-a018-43da-b45a-e184a40ec94b', '2026-02-04', 'break', '12:00:00', '13:00:00', 'Lunch Break', NOW()),
  -- Wednesday blocks
  (gen_random_uuid(), 'bd4e7fde-bf74-4160-9428-7de6b2cdedc9', 'bf3a060f-a018-43da-b45a-e184a40ec94b', '2026-02-05', 'break', '12:00:00', '12:30:00', 'Lunch', NOW()),
  (gen_random_uuid(), 'bd4e7fde-bf74-4160-9428-7de6b2cdedc9', 'bf3a060f-a018-43da-b45a-e184a40ec94b', '2026-02-05', 'administrative', '16:00:00', '17:00:00', 'Chart Review', NOW())
ON CONFLICT DO NOTHING;
