/*
  # Fix Demo Users Clinic Access

  1. Purpose
    - Add clinic_access entries for all demo users
    - Ensures RLS policies work correctly with user_has_clinic_access function
    - Links users to their primary clinics so they can view data

  2. Changes
    - Add clinic_access for Jennifer (clinician) -> Edmonton Central
    - Add clinic_access for all other demo users to their respective clinics
    
  3. Impact
    - Users will now be able to see appointments and other clinic-specific data
    - RLS policies will correctly grant access based on clinic_access table
*/

-- Add clinic access for demo users
INSERT INTO clinic_access (id, user_id, clinic_id, can_manage, created_at)
SELECT 
  gen_random_uuid(),
  up.id,
  up.primary_clinic_id,
  CASE 
    WHEN up.role IN ('clinic_manager', 'admin', 'executive') THEN true
    ELSE false
  END as can_manage,
  NOW()
FROM user_profiles up
WHERE up.primary_clinic_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM clinic_access ca 
    WHERE ca.user_id = up.id 
    AND ca.clinic_id = up.primary_clinic_id
  )
ON CONFLICT DO NOTHING;

-- Also grant executives and admins access to all clinics
INSERT INTO clinic_access (id, user_id, clinic_id, can_manage, created_at)
SELECT 
  gen_random_uuid(),
  up.id,
  c.id,
  true,
  NOW()
FROM user_profiles up
CROSS JOIN clinics c
WHERE up.role IN ('executive', 'admin')
  AND NOT EXISTS (
    SELECT 1 FROM clinic_access ca 
    WHERE ca.user_id = up.id 
    AND ca.clinic_id = c.id
  )
ON CONFLICT DO NOTHING;
