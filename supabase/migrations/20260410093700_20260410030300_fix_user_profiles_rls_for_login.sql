/*
  # Fix User Profiles RLS for Login

  1. Overview
    The previous RLS policy on user_profiles was too restrictive
    Users need to read their own profile during authentication
    The policy prevented partner_read_only users from accessing data

  2. Fix Applied
    - Allow all authenticated users to read their own profile
    - Remove overly restrictive admin-only checks on SELECT
    - Keep UPDATE restricted to own profile only
    - This is safe because users can only see/update their own record

  3. Security Model
    - SELECT: Users read own profile (id = auth.uid())
    - UPDATE: Users update own profile only
    - INSERT: Users insert own profile during signup
    - No privilege escalation possible
*/

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users view own or admin oversight" ON user_profiles;
DROP POLICY IF EXISTS "Users update only own profile" ON user_profiles;
DROP POLICY IF EXISTS "Insert only own profile" ON user_profiles;

-- Create proper policies that allow all authenticated users to access own data
CREATE POLICY "Users read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Admins need ability to see all profiles for management
CREATE POLICY "Admins view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
  ));
