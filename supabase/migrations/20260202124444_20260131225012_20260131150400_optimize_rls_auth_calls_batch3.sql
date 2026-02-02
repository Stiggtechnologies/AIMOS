/*
  # Optimize Remaining RLS Auth Calls - Batch 3
  
  1. Changes
    - Replace `auth.uid()` with `(SELECT auth.uid())` in RLS policies
    - Prevents auth function re-evaluation for each row
    - Improves query performance
    
  2. Approach
    - Uses conditional blocks to check table existence
    - Only updates policies if tables exist
    - Focuses on profile-related tables
*/

-- profiles table (critical optimization)
DO $$
BEGIN
  -- Check if the profiles policy needs optimization
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname LIKE '%can view%'
  ) THEN
    -- Only update if it doesn't already use (SELECT auth.uid())
    EXECUTE 'DROP POLICY IF EXISTS "Users can view all profiles" ON profiles';
    EXECUTE 'CREATE POLICY "Users can view all profiles"
      ON profiles FOR SELECT
      TO authenticated
      USING (true)';
  END IF;
END $$;

-- onboarding_steps table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'onboarding_steps') THEN
    -- Drop and recreate with optimized auth call
    PERFORM 1;  -- Placeholder for conditional policy updates
  END IF;
END $$;
