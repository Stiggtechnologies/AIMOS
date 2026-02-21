/*
  # Seed Treatment Rooms and Bookings Data

  1. Demo Data
    - Treatment rooms for each clinic
    - Sample room bookings for utilization tracking

  2. Data Coverage
    - 3-5 treatment rooms per clinic
    - Various room types (treatment, assessment, gym)
    - Sample bookings for the past 7 days
    - Equipment lists for rooms
*/

-- Insert treatment rooms for Calgary North Clinic
INSERT INTO ops_treatment_rooms (clinic_id, room_name, room_number, room_type, capacity, floor_number, is_accessible, equipment, is_active)
SELECT 
  '0931b80a-e808-4afe-b464-ecab6c86b2b8'::uuid,
  room_name,
  room_number,
  room_type::ops_room_type,
  capacity,
  floor_number,
  is_accessible,
  to_jsonb(equipment),
  true
FROM (VALUES
  ('Treatment Room A', 'TR-101', 'treatment', 2, 1, true, ARRAY['Treatment table', 'Ultrasound', 'TENS unit', 'Hot/Cold packs']),
  ('Treatment Room B', 'TR-102', 'treatment', 2, 1, true, ARRAY['Treatment table', 'Laser therapy', 'Exercise bands']),
  ('Assessment Room', 'AR-103', 'assessment', 1, 1, false, ARRAY['Examination table', 'Goniometer', 'Measuring tape']),
  ('Gym Area', 'GYM-104', 'gym', 8, 1, true, ARRAY['Exercise equipment', 'Resistance bands', 'Weights', 'Balance boards']),
  ('Private Treatment', 'TR-105', 'treatment', 1, 1, false, ARRAY['Treatment table', 'IFC machine', 'Traction unit'])
) AS t(room_name, room_number, room_type, capacity, floor_number, is_accessible, equipment);

-- Insert treatment rooms for Calgary South Clinic
INSERT INTO ops_treatment_rooms (clinic_id, room_name, room_number, room_type, capacity, floor_number, is_accessible, equipment, is_active)
SELECT 
  '25a1a69d-cdb7-4083-bba9-050266b85e82'::uuid,
  room_name,
  room_number,
  room_type::ops_room_type,
  capacity,
  floor_number,
  is_accessible,
  to_jsonb(equipment),
  true
FROM (VALUES
  ('Main Treatment 1', 'MT-201', 'treatment', 2, 2, true, ARRAY['Treatment table', 'Ultrasound', 'Electrical stimulation']),
  ('Main Treatment 2', 'MT-202', 'treatment', 2, 2, true, ARRAY['Treatment table', 'Cold laser', 'Manual therapy tools']),
  ('Assessment Suite', 'AS-203', 'assessment', 1, 2, true, ARRAY['Examination table', 'Assessment tools', 'Computer workstation']),
  ('Exercise Room', 'EX-204', 'gym', 6, 2, true, ARRAY['Cable machines', 'Free weights', 'Cardio equipment'])
) AS t(room_name, room_number, room_type, capacity, floor_number, is_accessible, equipment);

-- Insert treatment rooms for Edmonton Central Clinic
INSERT INTO ops_treatment_rooms (clinic_id, room_name, room_number, room_type, capacity, floor_number, is_accessible, equipment, is_active)
SELECT 
  'bf3a060f-a018-43da-b45a-e184a40ec94b'::uuid,
  room_name,
  room_number,
  room_type::ops_room_type,
  capacity,
  floor_number,
  is_accessible,
  to_jsonb(equipment),
  true
FROM (VALUES
  ('Treatment Pod A', 'TP-301', 'treatment', 1, 3, true, ARRAY['Treatment table', 'Ultrasound', 'Shockwave therapy']),
  ('Treatment Pod B', 'TP-302', 'treatment', 1, 3, true, ARRAY['Treatment table', 'IFC', 'Manual therapy tools']),
  ('Treatment Pod C', 'TP-303', 'treatment', 1, 3, false, ARRAY['Treatment table', 'Laser', 'Exercise bands']),
  ('Group Exercise', 'GE-304', 'gym', 10, 3, true, ARRAY['Exercise mats', 'Resistance equipment', 'Balance tools']),
  ('Assessment Center', 'AC-305', 'assessment', 1, 3, true, ARRAY['Examination table', 'Movement analysis tools', 'Measurement devices'])
) AS t(room_name, room_number, room_type, capacity, floor_number, is_accessible, equipment);

-- Insert treatment rooms for Red Deer Clinic
INSERT INTO ops_treatment_rooms (clinic_id, room_name, room_number, room_type, capacity, floor_number, is_accessible, equipment, is_active)
SELECT 
  '6dee5f83-99db-4db6-ab05-8262cc522f14'::uuid,
  room_name,
  room_number,
  room_type::ops_room_type,
  capacity,
  floor_number,
  is_accessible,
  to_jsonb(equipment),
  true
FROM (VALUES
  ('Treatment 1', 'T1-401', 'treatment', 2, 1, true, ARRAY['Treatment table', 'Ultrasound', 'Hot/cold therapy']),
  ('Treatment 2', 'T2-402', 'treatment', 2, 1, true, ARRAY['Treatment table', 'TENS', 'Exercise equipment']),
  ('Gym Space', 'G-403', 'gym', 6, 1, true, ARRAY['Exercise equipment', 'Weights', 'Cardio machines'])
) AS t(room_name, room_number, room_type, capacity, floor_number, is_accessible, equipment);

-- Create sample bookings for the past 7 days
DO $$
DECLARE
  room_record RECORD;
  booking_date DATE;
  booking_count INT;
  start_hour INT;
  i INT;
  j INT;
BEGIN
  FOR room_record IN 
    SELECT id FROM ops_treatment_rooms WHERE room_type = 'treatment'
  LOOP
    FOR i IN 0..6 LOOP
      booking_date := CURRENT_DATE - i;
      booking_count := 3 + floor(random() * 4)::int;
      
      FOR j IN 1..booking_count LOOP
        start_hour := 8 + (j - 1) * 2 + floor(random() * 2)::int;
        
        INSERT INTO ops_room_bookings (
          room_id,
          booking_date,
          start_time,
          end_time,
          patient_name,
          treatment_type,
          staff_assigned,
          status
        ) VALUES (
          room_record.id,
          booking_date,
          (start_hour || ':00:00')::time,
          ((start_hour + 1) || ':00:00')::time,
          CASE (random() * 5)::int
            WHEN 0 THEN 'John Smith'
            WHEN 1 THEN 'Sarah Johnson'
            WHEN 2 THEN 'Michael Brown'
            WHEN 3 THEN 'Jennifer Davis'
            WHEN 4 THEN 'Robert Wilson'
            ELSE 'Patricia Martinez'
          END,
          CASE (random() * 4)::int
            WHEN 0 THEN 'Initial Assessment'
            WHEN 1 THEN 'Follow-up Treatment'
            WHEN 2 THEN 'Manual Therapy'
            WHEN 3 THEN 'Exercise Therapy'
            ELSE 'Discharge Assessment'
          END,
          jsonb_build_object(
            'clinician',
            CASE (random() * 3)::int
              WHEN 0 THEN 'Dr. Emily Chen'
              WHEN 1 THEN 'Dr. James Thompson'
              WHEN 2 THEN 'Dr. Maria Rodriguez'
              ELSE 'Dr. David Kim'
            END
          ),
          'booked'::ops_booking_status
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;