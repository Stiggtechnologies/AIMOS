/*
  # Fix Infinite Recursion in user_profiles RLS Policy

  1. Problem
    - The policy "Users can view profiles in their clinics" causes infinite recursion
    - It queries user_profiles table within a user_profiles policy check
    - This creates a circular dependency that crashes queries

  2. Solution
    - Drop the problematic policy
    - Create a new simplified policy that avoids self-referencing
    - Split into two separate policies for clarity:
      - Users can view profiles in shared clinics (via clinic_access)
      - Executives/admins can view all profiles (using a function to break recursion)

  3. Security
    - Users can still view their own profile
    - Users can view profiles of people in their clinics
    - Executives and admins maintain broad access
    - No recursion issues
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in their clinics" ON user_profiles;

-- Create a helper function to check if user is executive/admin
-- This breaks the recursion by using a direct query with security definer
CREATE OR REPLACE FUNCTION public.is_executive_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('executive', 'admin')
  );
$$;

-- Policy 1: Users can view profiles in clinics they share
CREATE POLICY "Users can view profiles in shared clinics"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clinic_access ca1
      WHERE ca1.user_id = auth.uid()
      AND ca1.clinic_id IN (
        SELECT ca2.clinic_id
        FROM clinic_access ca2
        WHERE ca2.user_id = user_profiles.id
      )
    )
  );

-- Policy 2: Executives and admins can view all profiles
CREATE POLICY "Executives and admins can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_executive_or_admin());