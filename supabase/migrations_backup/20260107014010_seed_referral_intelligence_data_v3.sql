/*
  # Seed Referral Intelligence Module Data
  
  ## Overview
  This migration seeds realistic data for the Referral & Employer Intelligence module with:
  - Referral sources (physicians, hospitals, employers)
  - Employer accounts with contract details
  - Referrals spanning the last 90 days with varying conversion rates and SLA performance
  
  ## Data Included
  
  ### Referral Sources (8 sources)
  - 3 Physician practices (orthopedics, sports medicine, family practice)
  - 2 Hospitals (mapped as 'other' type with hospital in organization)
  - 3 Corporate employers (TechCorp, Healthcare Partners, Manufacturing Solutions)
  
  ### Employer Accounts (4 accounts)
  - Major employers with employee counts, contract values, and relationship tiers
  
  ### Referrals (350+ referrals)
  - Last 90 days of referral activity
  - Mix of converted, pending, and lost referrals
  - Varying SLA compliance rates
  - Realistic time-to-appointment patterns
  
  ## Notes
  - All referrals are tied to the first clinic in the system
  - Dates are dynamically calculated to ensure fresh data
  - Conversion rates and trends vary by source to create interesting alerts
  - Relationship strength: strong, moderate, weak, new
  - Source types: employer, insurer, physician, self, other
*/

-- Get the first clinic ID for foreign key references
DO $$
DECLARE
  v_clinic_id uuid;
BEGIN
  SELECT id INTO v_clinic_id FROM clinics LIMIT 1;
  
  -- If no clinic exists, skip seeding
  IF v_clinic_id IS NULL THEN
    RAISE NOTICE 'No clinics found. Skipping referral intelligence data seeding.';
    RETURN;
  END IF;

  -- =====================================================
  -- 1. REFERRAL SOURCES
  -- =====================================================
  
  -- Physician - Premier Orthopedics (High performer - Strong relationship)
  INSERT INTO referral_sources (id, source_type, source_name, contact_name, contact_email, contact_phone, 
    specialty, organization, relationship_strength, sla_hours, is_active, created_at)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 'physician', 'Premier Orthopedics', 'Dr. Sarah Johnson', 
     'sjohnson@premierortho.com', '555-0101', 'Orthopedic Surgery', 'Premier Orthopedics Group', 
     'strong', 24, true, now() - interval '2 years')
  ON CONFLICT (id) DO NOTHING;
  
  -- Hospital - Community Health Network (Solid performer - Strong relationship)
  INSERT INTO referral_sources (id, source_type, source_name, contact_name, contact_email, contact_phone, 
    specialty, organization, relationship_strength, sla_hours, is_active, created_at)
  VALUES 
    ('22222222-2222-2222-2222-222222222222', 'other', 'Community Health Network', 'Maria Rodriguez', 
     'mrodriguez@chn.org', '555-0102', 'Emergency Medicine', 'Community Health System - Hospital Network', 
     'strong', 48, true, now() - interval '18 months')
  ON CONFLICT (id) DO NOTHING;
  
  -- Employer - WorkWell Corporate Health (Large volume - Strong relationship)
  INSERT INTO referral_sources (id, source_type, source_name, contact_name, contact_email, contact_phone, 
    organization, relationship_strength, sla_hours, is_active, created_at)
  VALUES 
    ('33333333-3333-3333-3333-333333333333', 'employer', 'WorkWell Corporate Health', 'James Chen', 
     'jchen@workwell.com', '555-0103', 'WorkWell Employee Health Services', 
     'strong', 24, true, now() - interval '3 years')
  ON CONFLICT (id) DO NOTHING;
  
  -- Physician - Metro Sports Medicine (Declining - Moderate relationship)
  INSERT INTO referral_sources (id, source_type, source_name, contact_name, contact_email, contact_phone, 
    specialty, organization, relationship_strength, sla_hours, is_active, created_at)
  VALUES 
    ('44444444-4444-4444-4444-444444444444', 'physician', 'Metro Sports Medicine', 'Dr. Michael Thompson', 
     'mthompson@metrosports.com', '555-0104', 'Sports Medicine', 'Metro Medical Partners', 
     'moderate', 48, true, now() - interval '1 year')
  ON CONFLICT (id) DO NOTHING;
  
  -- Hospital - Metro Medical Center
  INSERT INTO referral_sources (id, source_type, source_name, contact_name, contact_email, contact_phone, 
    specialty, organization, relationship_strength, sla_hours, is_active, created_at)
  VALUES 
    ('55555555-5555-5555-5555-555555555555', 'other', 'Metro Medical Center', 'Dr. Lisa Patel', 
     'lpatel@metromed.org', '555-0105', 'Internal Medicine', 'Metro Healthcare System - Hospital', 
     'moderate', 72, true, now() - interval '6 months')
  ON CONFLICT (id) DO NOTHING;
  
  -- Physician - Family Practice Associates
  INSERT INTO referral_sources (id, source_type, source_name, contact_name, contact_email, contact_phone, 
    specialty, organization, relationship_strength, sla_hours, is_active, created_at)
  VALUES 
    ('66666666-6666-6666-6666-666666666666', 'physician', 'Family Practice Associates', 'Dr. Robert Kim', 
     'rkim@familypractice.com', '555-0106', 'Family Medicine', 'Independent Practice', 
     'moderate', 48, true, now() - interval '8 months')
  ON CONFLICT (id) DO NOTHING;
  
  -- Employer - TechCorp Industries (Strong relationship)
  INSERT INTO referral_sources (id, source_type, source_name, contact_name, contact_email, contact_phone, 
    organization, relationship_strength, sla_hours, is_active, created_at)
  VALUES 
    ('77777777-7777-7777-7777-777777777777', 'employer', 'TechCorp Industries', 'Amanda Foster', 
     'afoster@techcorp.com', '555-0107', 'TechCorp HR Department', 
     'strong', 24, true, now() - interval '2 years')
  ON CONFLICT (id) DO NOTHING;
  
  -- Employer - Healthcare Partners LLC (Moderate relationship)
  INSERT INTO referral_sources (id, source_type, source_name, contact_name, contact_email, contact_phone, 
    organization, relationship_strength, sla_hours, is_active, created_at)
  VALUES 
    ('88888888-8888-8888-8888-888888888888', 'employer', 'Healthcare Partners LLC', 'David Martinez', 
     'dmartinez@healthpartners.com', '555-0108', 'Healthcare Partners Benefits Team', 
     'moderate', 48, true, now() - interval '1 year')
  ON CONFLICT (id) DO NOTHING;

  -- =====================================================
  -- 2. EMPLOYER ACCOUNTS
  -- =====================================================
  
  INSERT INTO employer_accounts (id, employer_name, industry, employee_count, primary_contact_name, 
    primary_contact_email, primary_contact_phone, relationship_tier, contract_start_date, 
    contract_end_date, annual_value, is_active, created_at)
  VALUES 
    ('e1111111-1111-1111-1111-111111111111', 'TechCorp Industries', 'Technology', 1250, 'Amanda Foster',
     'afoster@techcorp.com', '555-0107', 'platinum', '2023-01-01', '2025-12-31', 1200000, true, now() - interval '2 years'),
    ('e2222222-2222-2222-2222-222222222222', 'Healthcare Partners LLC', 'Healthcare', 850, 'David Martinez',
     'dmartinez@healthpartners.com', '555-0108', 'gold', '2023-06-01', '2025-05-31', 850000, true, now() - interval '1 year'),
    ('e3333333-3333-3333-3333-333333333333', 'Manufacturing Solutions Inc', 'Manufacturing', 620, 'Karen Wilson',
     'kwilson@mfgsolutions.com', '555-0109', 'silver', '2024-01-01', '2025-12-31', 480000, true, now() - interval '1 year'),
    ('e4444444-4444-4444-4444-444444444444', 'City School District', 'Education', 2100, 'Thomas Lee',
     'tlee@cityschools.edu', '555-0110', 'gold', '2023-09-01', '2025-08-31', 720000, true, now() - interval '18 months')
  ON CONFLICT (id) DO NOTHING;

  -- =====================================================
  -- 3. REFERRALS - Last 90 Days
  -- =====================================================
  
  -- Premier Orthopedics - High volume, excellent conversion (67 referrals last 30d)
  -- Last 30 days: 67 referrals, 82% conversion, 94% SLA
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '11111111-1111-1111-1111-111111111111',
    v_clinic_id,
    (now() - interval '1 day' * (random() * 30)::int)::date,
    (now() - interval '1 day' * (random() * 28)::int)::date,
    CASE 
      WHEN random() < 0.82 THEN 'completed'
      WHEN random() < 0.90 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.82,
    (12 + random() * 60)::int,
    random() > 0.94,
    CASE WHEN random() < 0.82 THEN 1500 + (random() * 1000)::numeric ELSE 0 END
  FROM generate_series(1, 67);
  
  -- Last 60 days (previous 30): 58 referrals for trending up
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '11111111-1111-1111-1111-111111111111',
    v_clinic_id,
    (now() - interval '31 days' - interval '1 day' * (random() * 30)::int)::date,
    (now() - interval '31 days' - interval '1 day' * (random() * 28)::int)::date,
    CASE 
      WHEN random() < 0.80 THEN 'completed'
      WHEN random() < 0.88 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.80,
    (15 + random() * 55)::int,
    random() > 0.92,
    CASE WHEN random() < 0.80 THEN 1500 + (random() * 1000)::numeric ELSE 0 END
  FROM generate_series(1, 58);
  
  -- Community Health Network - Declining volume (45 last 30d vs 52 prior)
  -- Last 30 days: 45 referrals, 69% conversion, 87% SLA
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '22222222-2222-2222-2222-222222222222',
    v_clinic_id,
    (now() - interval '1 day' * (random() * 30)::int)::date,
    (now() - interval '1 day' * (random() * 29)::int)::date,
    CASE 
      WHEN random() < 0.69 THEN 'completed'
      WHEN random() < 0.85 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.69,
    (24 + random() * 72)::int,
    random() > 0.87,
    CASE WHEN random() < 0.69 THEN 1300 + (random() * 1200)::numeric ELSE 0 END
  FROM generate_series(1, 45);
  
  -- Previous 30 days: 52 referrals
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '22222222-2222-2222-2222-222222222222',
    v_clinic_id,
    (now() - interval '31 days' - interval '1 day' * (random() * 30)::int)::date,
    (now() - interval '31 days' - interval '1 day' * (random() * 29)::int)::date,
    CASE 
      WHEN random() < 0.75 THEN 'completed'
      WHEN random() < 0.88 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.75,
    (20 + random() * 68)::int,
    random() > 0.90,
    CASE WHEN random() < 0.75 THEN 1300 + (random() * 1200)::numeric ELSE 0 END
  FROM generate_series(1, 52);
  
  -- WorkWell Corporate Health - Stable high volume (89 referrals)
  -- Last 30 days: 89 referrals, 76% conversion, 91% SLA
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '33333333-3333-3333-3333-333333333333',
    v_clinic_id,
    (now() - interval '1 day' * (random() * 30)::int)::date,
    (now() - interval '1 day' * (random() * 28)::int)::date,
    CASE 
      WHEN random() < 0.76 THEN 'completed'
      WHEN random() < 0.88 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.76,
    (18 + random() * 54)::int,
    random() > 0.91,
    CASE WHEN random() < 0.76 THEN 1400 + (random() * 1000)::numeric ELSE 0 END
  FROM generate_series(1, 89);
  
  -- Previous 30 days: 87 referrals
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '33333333-3333-3333-3333-333333333333',
    v_clinic_id,
    (now() - interval '31 days' - interval '1 day' * (random() * 30)::int)::date,
    (now() - interval '31 days' - interval '1 day' * (random() * 28)::int)::date,
    CASE 
      WHEN random() < 0.74 THEN 'completed'
      WHEN random() < 0.87 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.74,
    (20 + random() * 56)::int,
    random() > 0.89,
    CASE WHEN random() < 0.74 THEN 1400 + (random() * 1000)::numeric ELSE 0 END
  FROM generate_series(1, 87);
  
  -- Metro Sports Medicine - CRITICAL DECLINE (23 down from 48)
  -- Last 30 days: 23 referrals, 35% conversion, 52% SLA
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '44444444-4444-4444-4444-444444444444',
    v_clinic_id,
    (now() - interval '1 day' * (random() * 30)::int)::date,
    CASE WHEN random() < 0.35 THEN (now() - interval '1 day' * (random() * 29)::int)::date ELSE NULL END,
    CASE 
      WHEN random() < 0.35 THEN 'completed'
      WHEN random() < 0.55 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.35,
    (48 + random() * 144)::int,
    random() > 0.52,
    CASE WHEN random() < 0.35 THEN 800 + (random() * 1200)::numeric ELSE 0 END
  FROM generate_series(1, 23);
  
  -- Previous 30 days: 48 referrals
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '44444444-4444-4444-4444-444444444444',
    v_clinic_id,
    (now() - interval '31 days' - interval '1 day' * (random() * 30)::int)::date,
    CASE WHEN random() < 0.60 THEN (now() - interval '31 days' - interval '1 day' * (random() * 29)::int)::date ELSE NULL END,
    CASE 
      WHEN random() < 0.60 THEN 'completed'
      WHEN random() < 0.78 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.60,
    (36 + random() * 96)::int,
    random() > 0.72,
    CASE WHEN random() < 0.60 THEN 900 + (random() * 1100)::numeric ELSE 0 END
  FROM generate_series(1, 48);
  
  -- TechCorp Industries (via source) - Strong employer relationship
  -- Last 30 days: 47 referrals, 78% conversion
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '77777777-7777-7777-7777-777777777777',
    v_clinic_id,
    (now() - interval '1 day' * (random() * 30)::int)::date,
    (now() - interval '1 day' * (random() * 28)::int)::date,
    CASE 
      WHEN random() < 0.78 THEN 'completed'
      WHEN random() < 0.90 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.78,
    (16 + random() * 48)::int,
    random() > 0.92,
    CASE WHEN random() < 0.78 THEN 1600 + (random() * 1200)::numeric ELSE 0 END
  FROM generate_series(1, 47);
  
  -- Healthcare Partners LLC - Moderate employer
  -- Last 30 days: 32 referrals, 72% conversion
  INSERT INTO referrals (source_id, clinic_id, referral_date, first_appointment_date, referral_status, 
    conversion_flag, time_to_first_appointment_hours, sla_breach_flag, revenue_generated)
  SELECT 
    '88888888-8888-8888-8888-888888888888',
    v_clinic_id,
    (now() - interval '1 day' * (random() * 30)::int)::date,
    (now() - interval '1 day' * (random() * 28)::int)::date,
    CASE 
      WHEN random() < 0.72 THEN 'completed'
      WHEN random() < 0.86 THEN 'scheduled'
      ELSE 'cancelled'
    END,
    random() < 0.72,
    (22 + random() * 62)::int,
    random() > 0.88,
    CASE WHEN random() < 0.72 THEN 1450 + (random() * 1100)::numeric ELSE 0 END
  FROM generate_series(1, 32);

  RAISE NOTICE 'Successfully seeded referral intelligence data: 8 sources, 4 employers, 360+ referrals';
END $$;