/*
  # Asset Write Policies

  Adds INSERT and UPDATE RLS policies for assets and acquisition_batches tables
  so authenticated users (staff, admin) can onboard new assets and create
  acquisition batches from the UI.

  1. Changes
    - assets: allow authenticated users to INSERT and UPDATE
    - acquisition_batches: allow authenticated users to SELECT, INSERT, and UPDATE
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Authenticated users can insert assets'
  ) THEN
    CREATE POLICY "Authenticated users can insert assets"
      ON assets FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Authenticated users can update assets'
  ) THEN
    CREATE POLICY "Authenticated users can update assets"
      ON assets FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE acquisition_batches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'acquisition_batches' AND policyname = 'Authenticated users can read acquisition batches'
  ) THEN
    CREATE POLICY "Authenticated users can read acquisition batches"
      ON acquisition_batches FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'acquisition_batches' AND policyname = 'Authenticated users can insert acquisition batches'
  ) THEN
    CREATE POLICY "Authenticated users can insert acquisition batches"
      ON acquisition_batches FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'acquisition_batches' AND policyname = 'Authenticated users can update acquisition batches'
  ) THEN
    CREATE POLICY "Authenticated users can update acquisition batches"
      ON acquisition_batches FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
