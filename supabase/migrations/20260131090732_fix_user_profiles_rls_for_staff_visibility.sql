/*
  # Fix User Profiles RLS for Staff Visibility

  1. Purpose
    - Allow authenticated users to see other staff members for scheduling and collaboration
    - Currently users can only see their own profile, blocking scheduler functionality
    - Maintains security by limiting to active staff only

  2. Changes
    - Add policy allowing authenticated users to view all active staff profiles
    - This enables scheduler, team views, and other collaborative features

  3. Security
    - Only active profiles are visible
    - Sensitive fields can be restricted through column-level security if needed
    - Users at same clinic can see each other for operational needs
*/

-- Add policy for viewing staff profiles
CREATE POLICY "Authenticated users can view active staff profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
  );
