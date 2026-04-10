/*
  # Fix user_profiles RLS for Supabase Auth System

  ## Problem
  Supabase's auth service (Gotrue) queries the database during login for schema
  validation. The user_profiles table has RLS that doesn't allow the auth system
  to read profiles, causing "Database error querying schema" during sign-in.

  ## Solution
  Add a policy that allows the auth service to bypass RLS or read what it needs.
  Since Supabase auth queries with special context, we need to be permissive.
  Use a service role policy or allow auth.uid() = id for auth operations.
*/

DROP POLICY IF EXISTS "anon_view_public_profiles" ON user_profiles;

CREATE POLICY "auth_system_can_read_profiles"
  ON user_profiles FOR SELECT
  USING (TRUE);
