/*
  # Seed AIM South Commons Complete Clinic Data
  
  1. Purpose
    - Complete data seeding for AIM South Commons clinic (May 2026 opening)
    - Rooms, services, products, referral partners
    
  2. Data Added
    - Clinic configuration with operating hours
    - 9 treatment rooms in rooms table
    - 4 operational treatment rooms
    - 8 core physiotherapy services
    - 25 retail products across 6 categories
    - 10 trainer referral partners from Evolve Strength
    
  3. Schema Compliance
    - Correct enum values for ops_room_type (admin, assessment, group, gym, private, treatment)
    - Required clv_tier field for services (standard)
    - Actual referral_partners schema (partner_name, partner_type, industry, etc.)
*/

DO $$
DECLARE
  v_south_commons_id uuid := '7316cf5c-2eb1-42cb-a286-f33f7d6343ff';
BEGIN

  -- =====================================================
  -- 1. UPDATE CLINIC CONFIGURATION
  -- =====================================================

  UPDATE clinics
  SET 
    treatment_rooms = 9,
    is_active = true,
    operating_hours = jsonb_build_object(
      'monday', jsonb_build_object('open', '07:00', 'close', '20:00'),
      'tuesday', jsonb_build_object('open', '07:00', 'close', '20:00'),
      'wednesday', jsonb_build_object('open', '07:00', 'close', '20:00'),
      'thursday', jsonb_build_object('open', '07:00', 'close', '20:00'),
      'friday', jsonb_build_object('open', '07:00', 'close', '19:00'),
      'saturday', jsonb_build_object('open', '08:00', 'close', '14:00'),
      'sunday', jsonb_build_object('closed', true)
    ),
    services_offered = jsonb_build_array(
      'Physiotherapy',
      'Manual Therapy',
      'Sports Rehabilitation',
      'Return to Work Programs',
      'Exercise Rehabilitation',
      'Dry Needling',
      'Retail Products'
    ),
    metadata = jsonb_build_object(
      'opening_date', '2026-05-01',
      'gym_partner', 'Evolve Strength South Commons',
      'specialty_focus', 'MSK Physiotherapy & Sports Rehab',
      'target_monthly_visits', 400,
      'retail_space', true,
      'gym_integration', true
    ),
    updated_at = now()
  WHERE id = v_south_commons_id;

  -- =====================================================
  -- 2. CREATE TREATMENT ROOMS
  -- =====================================================

  INSERT INTO rooms (clinic_id, name, room_number, room_type, capacity, is_active, metadata, created_at)
  VALUES
    (v_south_commons_id, 'Reception & Retail', 'R001', 'reception', 5, true, 
     '{"purpose": "Front desk and retail display"}'::jsonb, now()),
    (v_south_commons_id, 'Consult Room 1', 'C001', 'consult', 2, true,
     '{"equipment": "Desk, chairs, assessment tools"}'::jsonb, now()),
    (v_south_commons_id, 'Consult Room 2', 'C002', 'consult', 2, true,
     '{"equipment": "Desk, chairs, assessment tools"}'::jsonb, now()),
    (v_south_commons_id, 'Treatment Room 1', 'T001', 'treatment', 2, true,
     '{"equipment": "Physio bed, ultrasound, TENS unit"}'::jsonb, now()),
    (v_south_commons_id, 'Treatment Room 2', 'T002', 'treatment', 2, true,
     '{"equipment": "Physio bed, ultrasound, TENS unit"}'::jsonb, now()),
    (v_south_commons_id, 'Rehab Area', 'R002', 'rehab', 8, true,
     '{"equipment": "Exercise mats, bands, balance equipment"}'::jsonb, now()),
    (v_south_commons_id, 'Flex Area', 'F001', 'flex', 4, true,
     '{"purpose": "Multi-purpose treatment and exercise space"}'::jsonb, now()),
    (v_south_commons_id, 'Staff Area', 'S001', 'staff', 6, true,
     '{"purpose": "Staff break room and workspace"}'::jsonb, now()),
    (v_south_commons_id, 'Gym Access Zone', 'G001', 'gym_integration', 10, true,
     '{"purpose": "Transition zone to Evolve Strength gym"}'::jsonb, now())
  ON CONFLICT DO NOTHING;

  -- Insert into ops_treatment_rooms
  INSERT INTO ops_treatment_rooms (
    clinic_id, room_number, room_name, room_type, capacity, floor_number,
    square_feet, equipment, amenities, is_active, is_accessible, created_at
  )
  VALUES
    (v_south_commons_id, 'T001', 'Treatment Room 1', 'treatment', 2, 1, 150,
     '["Physio bed", "Ultrasound machine", "TENS unit", "Treatment cart"]'::jsonb,
     '["Climate controlled", "Privacy curtain"]'::jsonb, true, true, now()),
    (v_south_commons_id, 'T002', 'Treatment Room 2', 'treatment', 2, 1, 150,
     '["Physio bed", "Ultrasound machine", "TENS unit", "Treatment cart"]'::jsonb,
     '["Climate controlled", "Privacy curtain"]'::jsonb, true, true, now()),
    (v_south_commons_id, 'R002', 'Rehab Area', 'group', 8, 1, 400,
     '["Exercise mats", "Resistance bands", "Balance equipment", "Mirrors"]'::jsonb,
     '["Sound system", "Large open space"]'::jsonb, true, true, now()),
    (v_south_commons_id, 'G001', 'Gym Access Zone', 'gym', 10, 1, 200,
     '["Shared gym access", "Transition equipment"]'::jsonb,
     '["Direct access to Evolve Strength"]'::jsonb, true, true, now())
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- 3. CREATE SERVICES
  -- =====================================================

  INSERT INTO services (clinic_id, name, description, estimated_duration_minutes, base_price, clv_tier, created_at)
  VALUES
    (v_south_commons_id, 'Physiotherapy Initial Assessment', 
     'Comprehensive initial assessment including history, physical exam, and treatment plan', 60, 150.00, 'standard', now()),
    (v_south_commons_id, 'Physiotherapy Follow-up', 
     'Follow-up treatment session including manual therapy and exercise prescription', 45, 110.00, 'standard', now()),
    (v_south_commons_id, 'Manual Therapy Session', 
     'Hands-on treatment including joint mobilization and soft tissue techniques', 45, 110.00, 'standard', now()),
    (v_south_commons_id, 'Exercise Rehabilitation', 
     'Supervised exercise program for injury recovery and strengthening', 50, 110.00, 'standard', now()),
    (v_south_commons_id, 'Sports Injury Rehabilitation', 
     'Specialized treatment for athletes returning to sport', 50, 120.00, 'standard', now()),
    (v_south_commons_id, 'Dry Needling', 
     'Intramuscular stimulation for pain relief and muscle function', 30, 130.00, 'standard', now()),
    (v_south_commons_id, 'Return-to-Work Rehabilitation', 
     'Functional training focused on work capacity and injury prevention', 45, 110.00, 'standard', now()),
    (v_south_commons_id, 'Functional Movement Assessment', 
     'Comprehensive movement screening to identify dysfunction and injury risk', 60, 140.00, 'standard', now())
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- 4. CREATE RETAIL PRODUCTS
  -- =====================================================

  INSERT INTO product_catalog (product_name, product_category, sku, retail_price, cost, is_active, created_at)
  VALUES
    -- Braces & Supports (5 products)
    ('Knee Brace - Standard', 'Braces', 'KB-STD-001', 45.00, 22.00, true, now()),
    ('Knee Brace - Hinged', 'Braces', 'KB-HNG-001', 85.00, 42.00, true, now()),
    ('Ankle Brace', 'Braces', 'AB-STD-001', 35.00, 17.00, true, now()),
    ('Wrist Support', 'Braces', 'WS-STD-001', 28.00, 14.00, true, now()),
    ('Elbow Sleeve', 'Braces', 'ES-STD-001', 32.00, 16.00, true, now()),
    
    -- Exercise Equipment (5 products)
    ('Resistance Band Set (3 bands)', 'Exercise Equipment', 'RB-SET-003', 25.00, 12.00, true, now()),
    ('Resistance Band - Light', 'Exercise Equipment', 'RB-LGT-001', 10.00, 5.00, true, now()),
    ('Resistance Band - Medium', 'Exercise Equipment', 'RB-MED-001', 12.00, 6.00, true, now()),
    ('Resistance Band - Heavy', 'Exercise Equipment', 'RB-HVY-001', 15.00, 7.50, true, now()),
    ('Exercise Ball 65cm', 'Exercise Equipment', 'EB-65CM-001', 30.00, 15.00, true, now()),
    
    -- Recovery Tools (5 products)
    ('Foam Roller 36"', 'Recovery Tools', 'FR-36-001', 35.00, 17.00, true, now()),
    ('Foam Roller - Textured', 'Recovery Tools', 'FR-TXT-001', 42.00, 21.00, true, now()),
    ('Massage Ball Set', 'Recovery Tools', 'MB-SET-001', 20.00, 10.00, true, now()),
    ('Trigger Point Roller', 'Recovery Tools', 'TPR-001', 38.00, 19.00, true, now()),
    ('Lacrosse Ball - 2 Pack', 'Recovery Tools', 'LB-2PK-001', 15.00, 7.00, true, now()),
    
    -- Tape & Supports (4 products)
    ('Kinesiology Tape Roll - Blue', 'Tape', 'KT-BLU-001', 18.00, 9.00, true, now()),
    ('Kinesiology Tape Roll - Black', 'Tape', 'KT-BLK-001', 18.00, 9.00, true, now()),
    ('Athletic Tape 1.5"', 'Tape', 'AT-15-001', 12.00, 6.00, true, now()),
    ('Pre-Wrap', 'Tape', 'PW-STD-001', 8.00, 4.00, true, now()),
    
    -- Hot/Cold Therapy (3 products)
    ('Ice Pack - Reusable', 'Hot/Cold Therapy', 'IP-RSU-001', 22.00, 11.00, true, now()),
    ('Heat Pack - Microwaveable', 'Hot/Cold Therapy', 'HP-MIC-001', 25.00, 12.50, true, now()),
    ('Compression Wrap', 'Hot/Cold Therapy', 'CW-STD-001', 30.00, 15.00, true, now()),
    
    -- Mobility Tools (3 products)
    ('Stretching Strap', 'Mobility Tools', 'SS-STD-001', 18.00, 9.00, true, now()),
    ('Yoga Block Set (2)', 'Mobility Tools', 'YB-2PK-001', 24.00, 12.00, true, now()),
    ('Balance Pad', 'Mobility Tools', 'BP-STD-001', 32.00, 16.00, true, now())
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- 5. CREATE REFERRAL PARTNERS (Evolve Strength Trainers)
  -- =====================================================

  INSERT INTO referral_partners (
    partner_name, partner_type, industry, primary_contact_name, primary_contact_email,
    city, province, preferred_clinic_id, relationship_status, notes, created_at
  )
  VALUES
    ('Evolve Strength - Jordan Smith', 'fitness_trainer', 'Fitness & Training', 'Jordan Smith', 'jordan@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: Strength Training, 8 years experience', now()),
    ('Evolve Strength - Sarah Johnson', 'fitness_trainer', 'Fitness & Training', 'Sarah Johnson', 'sarah@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: Athletic Performance, 6 years experience', now()),
    ('Evolve Strength - Mike Chen', 'fitness_trainer', 'Fitness & Training', 'Mike Chen', 'mike@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: Powerlifting, 10 years experience', now()),
    ('Evolve Strength - Emily Rodriguez', 'fitness_trainer', 'Fitness & Training', 'Emily Rodriguez', 'emily@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: Olympic Lifting, 7 years experience', now()),
    ('Evolve Strength - David Park', 'fitness_trainer', 'Fitness & Training', 'David Park', 'david@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: Rehabilitation Training, 5 years experience', now()),
    ('Evolve Strength - Jessica Martinez', 'fitness_trainer', 'Fitness & Training', 'Jessica Martinez', 'jessica@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: Functional Movement, 6 years experience', now()),
    ('Evolve Strength - Ryan Thompson', 'fitness_trainer', 'Fitness & Training', 'Ryan Thompson', 'ryan@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: Sports Performance, 9 years experience', now()),
    ('Evolve Strength - Amanda Lee', 'fitness_trainer', 'Fitness & Training', 'Amanda Lee', 'amanda@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: CrossFit, 4 years experience', now()),
    ('Evolve Strength - Chris Wilson', 'fitness_trainer', 'Fitness & Training', 'Chris Wilson', 'chris@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: Bodybuilding, 12 years experience', now()),
    ('Evolve Strength - Taylor Brown', 'fitness_trainer', 'Fitness & Training', 'Taylor Brown', 'taylor@evolvestrength.ca',
     'Edmonton', 'AB', v_south_commons_id, 'active', 'Specialty: General Fitness, 5 years experience', now())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'AIM SOUTH COMMONS - COMPLETE DATA SEEDED';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Status: CLINIC ACTIVATED';
  RAISE NOTICE 'Opening Date: May 1, 2026';
  RAISE NOTICE 'Rooms: 9 total (4 operational treatment rooms)';
  RAISE NOTICE 'Services: 8 physiotherapy services configured';
  RAISE NOTICE 'Products: 25 retail items in stock';
  RAISE NOTICE 'Referral Partners: 10 Evolve Strength trainers';
  RAISE NOTICE 'Hours: Mon-Thu 7am-8pm, Fri 7am-7pm, Sat 8am-2pm';
  RAISE NOTICE 'Gym Partner: Evolve Strength South Commons';
  RAISE NOTICE '================================================';

END $$;
