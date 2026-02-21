/*
  # Seed Scheduler Demo Appointments
  
  Creates realistic appointment data for the AIM OS Scheduler demonstration.
  - Uses existing clinician (Jennifer Wong) from Edmonton Central
  - Creates 12 demo patients
  - Seeds appointments for today across different time slots
  - Includes various statuses and some high-risk no-show cases
*/

DO $$
DECLARE
  v_edmonton_clinic_id uuid := 'bf3a060f-a018-43da-b45a-e184a40ec94b'::uuid;
  v_jennifer_id uuid;
  v_today date := CURRENT_DATE;
  v_patient1_id uuid := 'a1111111-1111-1111-1111-111111111111'::uuid;
  v_patient2_id uuid := 'a2222222-2222-2222-2222-222222222222'::uuid;
  v_patient3_id uuid := 'a3333333-3333-3333-3333-333333333333'::uuid;
  v_patient4_id uuid := 'a4444444-4444-4444-4444-444444444444'::uuid;
  v_patient5_id uuid := 'a5555555-5555-5555-5555-555555555555'::uuid;
  v_patient6_id uuid := 'a6666666-6666-6666-6666-666666666666'::uuid;
  v_patient7_id uuid := 'a7777777-7777-7777-7777-777777777777'::uuid;
  v_patient8_id uuid := 'a8888888-8888-8888-8888-888888888888'::uuid;
  v_patient9_id uuid := 'a9999999-9999-9999-9999-999999999999'::uuid;
  v_patient10_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
  v_patient11_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;
  v_patient12_id uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid;
BEGIN
  -- Get Jennifer Wong's user ID
  SELECT id INTO v_jennifer_id 
  FROM user_profiles 
  WHERE email = 'jennifer.clinician@aimrehab.ca';

  IF v_jennifer_id IS NULL THEN
    RAISE EXCEPTION 'Jennifer Wong clinician not found. Run setup-demo-users edge function first.';
  END IF;

  -- Insert or update demo patients
  INSERT INTO patients (id, clinic_id, medical_record_number, first_name, last_name, date_of_birth, gender, phone, status)
  VALUES 
    (v_patient1_id, v_edmonton_clinic_id, 'SCHED-001', 'George', 'Whitley', '1985-03-15', 'Male', '780-555-0101', 'active'),
    (v_patient2_id, v_edmonton_clinic_id, 'SCHED-002', 'Sarah', 'Johnson', '1992-07-22', 'Female', '780-555-0102', 'active'),
    (v_patient3_id, v_edmonton_clinic_id, 'SCHED-003', 'Michael', 'Chen', '1978-11-08', 'Male', '780-555-0103', 'active'),
    (v_patient4_id, v_edmonton_clinic_id, 'SCHED-004', 'Emily', 'Rodriguez', '1988-05-30', 'Female', '780-555-0104', 'active'),
    (v_patient5_id, v_edmonton_clinic_id, 'SCHED-005', 'Jahan', 'Amiri', '1995-09-12', 'Male', '780-555-0105', 'active'),
    (v_patient6_id, v_edmonton_clinic_id, 'SCHED-006', 'Lisa', 'Thompson', '1982-02-18', 'Female', '780-555-0106', 'active'),
    (v_patient7_id, v_edmonton_clinic_id, 'SCHED-007', 'David', 'Park', '1990-06-25', 'Male', '780-555-0107', 'active'),
    (v_patient8_id, v_edmonton_clinic_id, 'SCHED-008', 'Jennifer', 'Brown', '1987-12-03', 'Female', '780-555-0108', 'active'),
    (v_patient9_id, v_edmonton_clinic_id, 'SCHED-009', 'Robert', 'Wilson', '1975-04-20', 'Male', '780-555-0109', 'active'),
    (v_patient10_id, v_edmonton_clinic_id, 'SCHED-010', 'Amanda', 'Martinez', '1993-08-14', 'Female', '780-555-0110', 'active'),
    (v_patient11_id, v_edmonton_clinic_id, 'SCHED-011', 'Kevin', 'Lee', '1984-10-07', 'Male', '780-555-0111', 'active'),
    (v_patient12_id, v_edmonton_clinic_id, 'SCHED-012', 'Rachel', 'Davis', '1991-01-28', 'Female', '780-555-0112', 'active')
  ON CONFLICT (id) DO UPDATE 
  SET status = 'active', updated_at = NOW();

  -- Delete old demo appointments for today
  DELETE FROM patient_appointments 
  WHERE appointment_date = v_today 
    AND clinic_id = v_edmonton_clinic_id
    AND provider_id = v_jennifer_id;

  -- Create appointments across the day
  INSERT INTO patient_appointments (
    patient_id, clinic_id, provider_id, appointment_type, appointment_date, 
    start_time, end_time, status, reason_for_visit, no_show, 
    checked_in_at, checked_out_at, scheduled_at
  )
  VALUES
    -- Morning appointments (8am-12pm) - mix of statuses
    (v_patient1_id, v_edmonton_clinic_id, v_jennifer_id, 'Initial Assessment', v_today, '08:00'::time, '09:00'::time, 'completed', 'Lower back pain', false, NOW() - interval '3 hours', NOW() - interval '2 hours', NOW() - interval '7 days'),
    (v_patient2_id, v_edmonton_clinic_id, v_jennifer_id, 'Follow-up Treatment', v_today, '09:15'::time, '09:45'::time, 'completed', 'Knee rehabilitation', false, NOW() - interval '2 hours', NOW() - interval '90 minutes', NOW() - interval '5 days'),
    (v_patient3_id, v_edmonton_clinic_id, v_jennifer_id, 'Treatment Session', v_today, '10:00'::time, '10:30'::time, 'checked_in', 'Shoulder injury', false, NOW() - interval '30 minutes', NULL, NOW() - interval '4 days'),
    (v_patient4_id, v_edmonton_clinic_id, v_jennifer_id, 'Re-assessment', v_today, '10:45'::time, '11:30'::time, 'scheduled', 'Post-surgery rehab', false, NULL, NULL, NOW() - interval '3 days'),
    (v_patient5_id, v_edmonton_clinic_id, v_jennifer_id, 'Treatment Session', v_today, '11:45'::time, '12:15'::time, 'scheduled', 'Sports injury', true, NULL, NULL, NOW() - interval '2 days'),
    
    -- Afternoon appointments (1pm-4pm)
    (v_patient6_id, v_edmonton_clinic_id, v_jennifer_id, 'Treatment Session', v_today, '13:00'::time, '13:30'::time, 'scheduled', 'Chronic pain management', false, NULL, NULL, NOW() - interval '6 days'),
    (v_patient7_id, v_edmonton_clinic_id, v_jennifer_id, 'Initial Assessment', v_today, '13:45'::time, '14:45'::time, 'scheduled', 'Work injury assessment', false, NULL, NULL, NOW() - interval '3 days'),
    (v_patient8_id, v_edmonton_clinic_id, v_jennifer_id, 'Follow-up Treatment', v_today, '15:00'::time, '15:30'::time, 'scheduled', 'Balance training', true, NULL, NULL, NOW() - interval '1 day'),
    (v_patient9_id, v_edmonton_clinic_id, v_jennifer_id, 'Treatment Session', v_today, '15:45'::time, '16:15'::time, 'scheduled', 'Strength building', false, NULL, NULL, NOW() - interval '4 days'),
    
    -- Evening appointments (4pm-7pm)
    (v_patient10_id, v_edmonton_clinic_id, v_jennifer_id, 'Re-assessment', v_today, '16:30'::time, '17:15'::time, 'scheduled', 'Progress evaluation', false, NULL, NULL, NOW() - interval '5 days'),
    (v_patient11_id, v_edmonton_clinic_id, v_jennifer_id, 'Treatment Session', v_today, '17:30'::time, '18:00'::time, 'scheduled', 'Post-concussion therapy', false, NULL, NULL, NOW() - interval '2 days'),
    (v_patient12_id, v_edmonton_clinic_id, v_jennifer_id, 'Discharge Assessment', v_today, '18:15'::time, '19:00'::time, 'scheduled', 'Final evaluation', false, NULL, NULL, NOW() - interval '1 day');

  -- Create schedule blocks (breaks and admin time)
  DELETE FROM clinician_schedules 
  WHERE schedule_date = v_today 
    AND clinician_id = v_jennifer_id
    AND clinic_id = v_edmonton_clinic_id;
  
  INSERT INTO clinician_schedules (clinician_id, clinic_id, schedule_date, start_time, end_time, schedule_type, notes)
  VALUES
    (v_jennifer_id, v_edmonton_clinic_id, v_today, '12:15'::time, '13:00'::time, 'break', 'Lunch Break'),
    (v_jennifer_id, v_edmonton_clinic_id, v_today, '14:45'::time, '15:00'::time, 'administrative', 'Chart Review');

  RAISE NOTICE 'Successfully seeded 12 scheduler appointments for % with Jennifer Wong', v_today;
END $$;
