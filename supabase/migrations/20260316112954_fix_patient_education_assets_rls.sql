/*
  # Fix Patient Education Assets RLS Policy
  
  1. Security Changes
    - Drops broken policy using current_role()
    - Creates new policy allowing all authenticated users to read active assets
    - Creates admin policy for staff to manage assets
    
  2. Purpose
    - Patient education materials should be readable by all authenticated users
    - Only staff can create/update/delete assets
*/

-- Drop existing broken policies
DROP POLICY IF EXISTS "assets_select" ON patient_education_assets;
DROP POLICY IF EXISTS "assets_write" ON patient_education_assets;

-- Allow all authenticated users to read active education assets
CREATE POLICY "Anyone can read active education assets"
  ON patient_education_assets
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow staff to manage education assets
CREATE POLICY "Staff can manage education assets"
  ON patient_education_assets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  );
