-- Create test user profile for AIMOS
-- Run this in Supabase SQL Editor after creating auth user

-- First, you need to create the auth user in Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add User"
-- 3. Email: orville@aimrehab.ca
-- 4. Password: (your choice)
-- 5. Check "Auto Confirm User"
-- 6. Copy the UUID that gets created

-- Then run this SQL (replace YOUR_AUTH_USER_ID with the UUID from above):

DO $$
DECLARE
  user_id UUID := 'YOUR_AUTH_USER_ID'; -- REPLACE THIS
  calgary_north_id UUID;
BEGIN
  -- Get a clinic ID
  SELECT id INTO calgary_north_id FROM clinics WHERE code = 'YYC-N' LIMIT 1;

  -- Create user profile
  INSERT INTO user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    primary_clinic_id,
    phone,
    is_active
  ) VALUES (
    user_id,
    'orville@aimrehab.ca',
    'Orville',
    'Davis',
    'executive',
    calgary_north_id,
    '780-215-2887',
    true
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

  RAISE NOTICE 'User profile created for: %', user_id;
END $$;
