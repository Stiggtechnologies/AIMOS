/*
  # Fix Launch Visibility for All Users
  
  1. Changes
    - Drop restrictive SELECT policy on clinic_launches
    - Add permissive policy that allows all authenticated users to view launches
    - This enables the Launch Module UI to show launches to all team members
  
  2. Rationale
    - Current RLS blocks launches unless user is owner, sponsor, or has specific role
    - For a team collaboration tool, all users should see launches
    - Write permissions remain restricted to owners and sponsors
*/

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Authorized users can view launches" ON clinic_launches;

-- Create a more permissive SELECT policy for all authenticated users
CREATE POLICY "All authenticated users can view launches"
  ON clinic_launches
  FOR SELECT
  TO authenticated
  USING (true);
