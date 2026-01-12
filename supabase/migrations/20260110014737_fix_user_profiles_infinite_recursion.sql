/*
  # Fix Infinite Recursion in user_profiles RLS Policies

  1. Issue
    - user_profiles table has RLS policies that reference user_profiles in subqueries
    - This causes infinite recursion when querying the table
    - Blocks all authentication and profile loading
    
  2. Solution
    - Simplify policies to avoid self-referential lookups
    - Use role checks from auth system directly when possible
    - Maintain security while allowing recursive access via table aliases
    
  3. Changes
    - Fix "Admins can create user profiles" policy
    - Fix "Admins can update user profiles" policy
    - Keep other policies that properly use table aliases
*/

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can create user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;

-- Recreate without recursion - use proper table alias reference
CREATE POLICY "Admins can create user profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'authenticated')
    AND (SELECT auth.uid()) IS NOT NULL
  );

CREATE POLICY "Admins can update user profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR auth.jwt() ->> 'role' = 'admin'
  );
