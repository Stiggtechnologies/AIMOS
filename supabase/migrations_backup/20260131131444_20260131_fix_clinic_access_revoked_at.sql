/*
  # Fix clinic_access table - Add revoked_at column

  1. Changes
    - Add `revoked_at` column to clinic_access table for tracking when access was revoked
    - This column was referenced in user_has_clinic_access function but didn't exist

  2. Security
    - Existing access records will have NULL revoked_at (active)
    - When access is revoked, revoked_at will be set to current timestamp
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinic_access' AND column_name = 'revoked_at'
  ) THEN
    ALTER TABLE clinic_access ADD COLUMN revoked_at timestamptz;
  END IF;
END $$;
