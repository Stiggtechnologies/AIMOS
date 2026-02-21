-- Check what exists and fix the user
-- Run this in SQL Editor: https://supabase.com/dashboard/project/optlghedswctsklcxlkn/sql/new

-- First, let's see what we have
SELECT 
  email,
  id,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'orville@aimrehab.ca';

-- Check if user_profiles table exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    RAISE NOTICE 'user_profiles table exists';
  ELSE
    RAISE NOTICE 'user_profiles table DOES NOT EXIST';
  END IF;
END $$;
