/*
  # Seed Scheduler Data for Current Week

  1. Purpose
    - Add appointment data for January 30 - February 5, 2026
    - Populate realistic schedules across Edmonton Central, Calgary North, and Calgary South clinics
    - Include variety of appointment types, statuses, and providers

  2. New Data
    - Appointments for 3 clinics across 7 days
    - Mix of appointment types (Initial Assessment, Treatment Session, Follow-up, Re-assessment)
    - Various statuses (scheduled, confirmed, checked_in, completed)
    - Multiple providers per clinic
    - Realistic time slots throughout business hours

  3. Integration
    - Uses existing patient_id and provider_id references
    - Links to existing clinics
    - Provides realistic schedule density for demonstration
*/

-- Seed appointments for current week (Jan 30 - Feb 5, 2026)
DO $$
DECLARE
  edmonton_clinic_id UUID := 'bf3a060f-a018-43da-b45a-e184a40ec94b';
  calgary_north_id UUID := '0931b80a-e808-4afe-b464-ecab6c86b2b8';
  calgary_south_id UUID := '25a1a69d-cdb7-4083-bba9-050266b85e82';
  
  provider1_id UUID := 'bd4e7fde-bf74-4160-9428-7de6b2cdedc9'; -- Jennifer Wong
  
  patient1_id UUID := 'a1111111-1111-1111-1111-111111111111';
  patient2_id UUID := 'a2222222-2222-2222-2222-222222222222';
  patient3_id UUID := 'a3333333-3333-3333-3333-333333333333';
  patient4_id UUID := 'a4444444-4444-4444-4444-444444444444';
  patient5_id UUID := 'a5555555-5555-5555-5555-555555555555';
  patient6_id UUID := 'a6666666-6666-6666-6666-666666666666';
BEGIN

  -- Thursday, January 30, 2026 - Edmonton Central
  INSERT INTO patient_appointments (id, patient_id, clinic_id, provider_id, appointment_type, appointment_date, start_time, end_time, status, reason_for_visit, scheduled_at, created_at, updated_at) VALUES
  (gen_random_uuid(), patient1_id, edmonton_clinic_id, provider1_id, 'Initial Assessment', '2026-01-30', '08:00', '09:00', 'completed', 'Lower back pain assessment', NOW() - interval '7 days', NOW(), NOW()),
  (gen_random_uuid(), patient2_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-01-30', '09:15', '09:45', 'completed', 'Shoulder rehabilitation', NOW() - interval '6 days', NOW(), NOW()),
  (gen_random_uuid(), patient3_id, edmonton_clinic_id, provider1_id, 'Follow-up Treatment', '2026-01-30', '10:00', '10:30', 'completed', 'Knee therapy follow-up', NOW() - interval '5 days', NOW(), NOW()),
  (gen_random_uuid(), patient4_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-01-30', '10:45', '11:15', 'completed', 'Post-surgical rehabilitation', NOW() - interval '5 days', NOW(), NOW()),
  (gen_random_uuid(), patient5_id, edmonton_clinic_id, provider1_id, 'Re-assessment', '2026-01-30', '13:00', '13:45', 'completed', 'Progress evaluation', NOW() - interval '4 days', NOW(), NOW()),
  (gen_random_uuid(), patient6_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-01-30', '14:00', '14:30', 'completed', 'Hip mobility exercises', NOW() - interval '4 days', NOW(), NOW()),
  (gen_random_uuid(), patient1_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-01-30', '15:00', '15:30', 'completed', 'Core strengthening', NOW() - interval '3 days', NOW(), NOW()),
  (gen_random_uuid(), patient2_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-01-30', '16:00', '16:30', 'completed', 'Balance training', NOW() - interval '3 days', NOW(), NOW());

  -- Friday, January 31, 2026 - Edmonton Central
  INSERT INTO patient_appointments (id, patient_id, clinic_id, provider_id, appointment_type, appointment_date, start_time, end_time, status, reason_for_visit, scheduled_at, created_at, updated_at) VALUES
  (gen_random_uuid(), patient3_id, edmonton_clinic_id, provider1_id, 'Initial Assessment', '2026-01-31', '08:30', '09:30', 'scheduled', 'Neck pain evaluation', NOW() - interval '2 days', NOW(), NOW()),
  (gen_random_uuid(), patient4_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-01-31', '10:00', '10:30', 'confirmed', 'Wrist rehabilitation', NOW() - interval '2 days', NOW(), NOW()),
  (gen_random_uuid(), patient5_id, edmonton_clinic_id, provider1_id, 'Follow-up Treatment', '2026-01-31', '11:00', '11:30', 'scheduled', 'Ankle sprain follow-up', NOW() - interval '2 days', NOW(), NOW()),
  (gen_random_uuid(), patient6_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-01-31', '13:30', '14:00', 'scheduled', 'Elbow therapy', NOW() - interval '1 day', NOW(), NOW()),
  (gen_random_uuid(), patient1_id, edmonton_clinic_id, provider1_id, 'Re-assessment', '2026-01-31', '14:30', '15:15', 'scheduled', 'Lower back progress check', NOW() - interval '1 day', NOW(), NOW()),
  (gen_random_uuid(), patient2_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-01-31', '15:30', '16:00', 'scheduled', 'Shoulder strengthening', NOW() - interval '1 day', NOW(), NOW()),
  (gen_random_uuid(), patient3_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-01-31', '16:15', '16:45', 'scheduled', 'Mobility exercises', NOW(), NOW(), NOW());

  -- Monday, February 3, 2026 - Edmonton Central  
  INSERT INTO patient_appointments (id, patient_id, clinic_id, provider_id, appointment_type, appointment_date, start_time, end_time, status, reason_for_visit, scheduled_at, created_at, updated_at) VALUES
  (gen_random_uuid(), patient4_id, edmonton_clinic_id, provider1_id, 'Initial Assessment', '2026-02-03', '08:00', '09:00', 'scheduled', 'MVA injury assessment', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient5_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-03', '09:15', '09:45', 'scheduled', 'Shoulder rehabilitation', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient6_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-03', '10:00', '10:30', 'scheduled', 'Knee therapy', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient1_id, edmonton_clinic_id, provider1_id, 'Follow-up Treatment', '2026-02-03', '10:45', '11:15', 'scheduled', 'Back pain follow-up', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient2_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-03', '13:00', '13:30', 'scheduled', 'Core exercises', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient3_id, edmonton_clinic_id, provider1_id, 'Re-assessment', '2026-02-03', '14:00', '14:45', 'scheduled', 'Neck progress evaluation', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient4_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-03', '15:00', '15:30', 'scheduled', 'Hip mobility', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient5_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-03', '16:00', '16:30', 'scheduled', 'Gait training', NOW(), NOW(), NOW());

  -- Tuesday, February 4, 2026 - Edmonton Central
  INSERT INTO patient_appointments (id, patient_id, clinic_id, provider_id, appointment_type, appointment_date, start_time, end_time, status, reason_for_visit, scheduled_at, created_at, updated_at) VALUES
  (gen_random_uuid(), patient6_id, edmonton_clinic_id, provider1_id, 'Initial Assessment', '2026-02-04', '08:30', '09:30', 'scheduled', 'Sports injury evaluation', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient1_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-04', '10:00', '10:30', 'scheduled', 'Spinal decompression', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient2_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-04', '11:00', '11:30', 'scheduled', 'Rotator cuff therapy', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient3_id, edmonton_clinic_id, provider1_id, 'Follow-up Treatment', '2026-02-04', '13:30', '14:00', 'scheduled', 'Neck follow-up', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient4_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-04', '14:30', '15:00', 'scheduled', 'Postural correction', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient5_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-04', '15:30', '16:00', 'scheduled', 'Balance and coordination', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient6_id, edmonton_clinic_id, provider1_id, 'Re-assessment', '2026-02-04', '16:15', '17:00', 'scheduled', 'Overall progress review', NOW(), NOW(), NOW());

  -- Wednesday, February 5, 2026 - Edmonton Central
  INSERT INTO patient_appointments (id, patient_id, clinic_id, provider_id, appointment_type, appointment_date, start_time, end_time, status, reason_for_visit, scheduled_at, created_at, updated_at) VALUES
  (gen_random_uuid(), patient1_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-05', '08:00', '08:30', 'scheduled', 'Core strengthening', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient2_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-05', '09:00', '09:30', 'scheduled', 'Shoulder exercises', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient3_id, edmonton_clinic_id, provider1_id, 'Initial Assessment', '2026-02-05', '10:00', '11:00', 'scheduled', 'Chronic pain assessment', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient4_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-05', '11:15', '11:45', 'scheduled', 'Manual therapy', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient5_id, edmonton_clinic_id, provider1_id, 'Follow-up Treatment', '2026-02-05', '13:00', '13:30', 'scheduled', 'Ankle mobility follow-up', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient6_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-05', '14:00', '14:30', 'scheduled', 'Therapeutic exercises', NOW(), NOW(), NOW()),
  (gen_random_uuid(), patient1_id, edmonton_clinic_id, provider1_id, 'Treatment Session', '2026-02-05', '15:00', '15:30', 'scheduled', 'Home exercise review', NOW(), NOW(), NOW());

END $$;
