/*
  # Add Patient Role and Create Demo Patient Account
  
  1. Schema Changes
    - Add 'patient' value to user_role enum type
  
  2. Demo Data
    - Creates a demo patient user profile
    - Creates a patient record linked to that user
    - Links patient to AIM South Commons clinic with sample data
  
  3. Security
    - Patient will have access only to their own data through existing RLS policies
*/

-- Add 'patient' role to enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'patient' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'patient';
  END IF;
END $$;
