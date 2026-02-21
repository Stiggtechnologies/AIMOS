-- Create Faith Grant (CMO) and Orville Davis (CEO) as Executive users
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/optlghedswctsklcxlkn/sql

-- IMPORTANT: First create auth users through the dashboard, then run this SQL
-- OR use the extension approach below

-- ============================================================================
-- OPTION 1: If you've already created auth users through the dashboard
-- ============================================================================
-- Get the user IDs and paste them below:
-- Faith Grant user ID: [PASTE HERE]
-- Orville Davis user ID: [PASTE HERE]

-- Then uncomment and run:
/*
-- Faith Grant Profile
INSERT INTO user_profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  phone,
  is_active,
  created_at,
  updated_at
) VALUES (
  '[PASTE FAITH USER ID HERE]'::uuid,
  'faith.grant@albertainjurymanagement.ca',
  'Faith',
  'Grant',
  'executive',
  '+17802508188',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Orville Davis Profile  
INSERT INTO user_profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  phone,
  is_active,
  created_at,
  updated_at
) VALUES (
  '[PASTE ORVILLE USER ID HERE]'::uuid,
  'orville.davis@albertainjurymanagement.ca',
  'Orville',
  'Davis',
  'executive',
  '+17802152887',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Grant access to all active clinics
INSERT INTO clinic_access (user_id, clinic_id, role, granted_at)
SELECT 
  up.id,
  c.id,
  'executive',
  NOW()
FROM user_profiles up
CROSS JOIN clinics c
WHERE up.email IN ('faith.grant@albertainjurymanagement.ca', 'orville.davis@albertainjurymanagement.ca')
  AND c.active = true
ON CONFLICT (user_id, clinic_id) DO NOTHING;
*/

-- ============================================================================
-- OPTION 2: Create auth users + profiles in one go (Requires admin API extension)
-- ============================================================================

-- Create a temporary function to create users with the admin API
CREATE OR REPLACE FUNCTION create_executive_users()
RETURNS TABLE(email TEXT, user_id UUID, profile_created BOOLEAN, message TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  faith_id UUID;
  orville_id UUID;
BEGIN
  -- Check if users already exist
  SELECT id INTO faith_id FROM auth.users WHERE email = 'faith.grant@albertainjurymanagement.ca';
  SELECT id INTO orville_id FROM auth.users WHERE email = 'orville.davis@albertainjurymanagement.ca';
  
  -- Return info about Faith
  IF faith_id IS NULL THEN
    RETURN QUERY SELECT 
      'faith.grant@albertainjurymanagement.ca'::TEXT,
      NULL::UUID,
      false,
      'Please create auth user through dashboard first'::TEXT;
  ELSE
    -- Create Faith's profile
    INSERT INTO user_profiles (id, email, first_name, last_name, role, phone, is_active)
    VALUES (faith_id, 'faith.grant@albertainjurymanagement.ca', 'Faith', 'Grant', 'executive', '+17802508188', true)
    ON CONFLICT (id) DO UPDATE SET
      first_name = 'Faith',
      last_name = 'Grant',
      role = 'executive',
      is_active = true,
      updated_at = NOW();
    
    -- Grant clinic access
    INSERT INTO clinic_access (user_id, clinic_id, role, granted_at)
    SELECT faith_id, c.id, 'executive', NOW()
    FROM clinics c WHERE c.active = true
    ON CONFLICT (user_id, clinic_id) DO NOTHING;
    
    RETURN QUERY SELECT 
      'faith.grant@albertainjurymanagement.ca'::TEXT,
      faith_id,
      true,
      'Profile created successfully'::TEXT;
  END IF;
  
  -- Return info about Orville
  IF orville_id IS NULL THEN
    RETURN QUERY SELECT 
      'orville.davis@albertainjurymanagement.ca'::TEXT,
      NULL::UUID,
      false,
      'Please create auth user through dashboard first'::TEXT;
  ELSE
    -- Create Orville's profile
    INSERT INTO user_profiles (id, email, first_name, last_name, role, phone, is_active)
    VALUES (orville_id, 'orville.davis@albertainjurymanagement.ca', 'Orville', 'Davis', 'executive', '+17802152887', true)
    ON CONFLICT (id) DO UPDATE SET
      first_name = 'Orville',
      last_name = 'Davis',
      role = 'executive',
      is_active = true,
      updated_at = NOW();
    
    -- Grant clinic access
    INSERT INTO clinic_access (user_id, clinic_id, role, granted_at)
    SELECT orville_id, c.id, 'executive', NOW()
    FROM clinics c WHERE c.active = true
    ON CONFLICT (user_id, clinic_id) DO NOTHING;
    
    RETURN QUERY SELECT 
      'orville.davis@albertainjurymanagement.ca'::TEXT,
      orville_id,
      true,
      'Profile created successfully'::TEXT;
  END IF;
END;
$$;

-- Run the function
SELECT * FROM create_executive_users();

-- Clean up
DROP FUNCTION create_executive_users();

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Check the created users
SELECT 
  up.email,
  up.first_name,
  up.last_name,
  up.role,
  up.phone,
  up.is_active,
  COUNT(DISTINCT ca.clinic_id) as clinic_access_count
FROM user_profiles up
LEFT JOIN clinic_access ca ON ca.user_id = up.id
WHERE up.email IN ('faith.grant@albertainjurymanagement.ca', 'orville.davis@albertainjurymanagement.ca')
GROUP BY up.id, up.email, up.first_name, up.last_name, up.role, up.phone, up.is_active;
