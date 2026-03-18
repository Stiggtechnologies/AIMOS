/*
  # Fix Patient Education Assets RLS

  1. Changes
    - Update RLS policies to allow both authenticated and unauthenticated users to read active education assets
    - This fixes the "Failed to fetch" error when accessing the Patient Education tab
    - Maintains security by restricting write operations to staff only
*/

DROP POLICY IF EXISTS "Anyone can read active education assets" ON patient_education_assets;

CREATE POLICY "Anyone can read active education assets"
  ON patient_education_assets
  FOR SELECT
  TO public
  USING (is_active = true);
