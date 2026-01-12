/*
  # Fix Infinite Recursion - Complete Rebuild

  1. Problem
    - The is_executive_or_admin() function queries user_profiles
    - This creates infinite recursion when RLS policies call the function
    
  2. Solution
    - Drop the problematic policy and function
    - Store role in a way that doesn't cause recursion
    - Use a simpler approach: only check own profile and shared clinic profiles
    - Remove the executive/admin universal access for now to break recursion
    
  3. Alternative Approach
    - Keep only two policies: own profile and shared clinics
    - Executives/admins will need to have clinic_access records to see profiles
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Executives and admins can view all profiles" ON user_profiles;

-- Drop the function
DROP FUNCTION IF EXISTS public.is_executive_or_admin();

-- The remaining policies are safe:
-- 1. "Users can view own profile" - no recursion
-- 2. "Users can view profiles in shared clinics" - only queries clinic_access, not user_profiles