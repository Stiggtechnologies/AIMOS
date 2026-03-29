/*
  # Asset Management Migration 2 - Simplified Schema

  Ensures core asset management tables exist with simplified structure
  (no foreign key constraints that could conflict with existing schema).

  1. Tables (IF NOT EXISTS)
    - `asset_categories` - Equipment categories with depreciation defaults
    - `assets` - Main asset registry

  2. Security
    - RLS enabled on assets and asset_categories
    - Public SELECT policies for read access

  Note: clinics table already exists - skipped to avoid conflicts.
  asset_categories and assets tables already created in Migration 1 - policies recreated safely.
*/

-- asset_categories already exists from migration 1, ensure policies exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_categories' AND policyname = 'Public categories') THEN
    CREATE POLICY "Public categories" ON asset_categories FOR SELECT USING (true);
  END IF;
END $$;

-- assets already exists from migration 1, ensure policies exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Public assets') THEN
    CREATE POLICY "Public assets" ON assets FOR SELECT USING (true);
  END IF;
END $$;
