/*
  # Asset Management - Core Tables (Chunk 1)

  1. New Tables
    - `clinics` - Clinic locations with region, status, and manager reference
    - `asset_categories` - Equipment categories with depreciation defaults
    - `acquisition_batches` - Tracks M&A or bulk asset intake events
    - `assets` - Main asset registry with full lifecycle fields

  2. Security
    - RLS enabled on `assets`
    - Public SELECT policy on `assets` and `asset_categories`
*/

CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  address TEXT,
  region TEXT,
  opening_date DATE,
  acquisition_date DATE,
  manager_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_category_id UUID,
  description TEXT,
  depreciation_method_default TEXT DEFAULT 'CCA',
  useful_life_months_default INTEGER DEFAULT 60,
  is_maintenance_trackable BOOLEAN DEFAULT TRUE,
  is_depreciable BOOLEAN DEFAULT TRUE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS acquisition_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  seller_name TEXT,
  deal_name TEXT,
  closing_date DATE,
  intake_start_date DATE,
  intake_completed_date DATE,
  total_assets_imported INTEGER DEFAULT 0,
  estimated_total_purchase_allocated_value NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag TEXT NOT NULL UNIQUE,
  qr_code_value TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  clinic_id UUID NOT NULL,
  category_id UUID,
  sub_category TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  supplier TEXT,
  purchase_date DATE,
  in_service_date DATE,
  purchase_cost NUMERIC(12,2),
  installation_cost NUMERIC(12,2),
  book_value NUMERIC(12,2),
  replacement_cost NUMERIC(12,2),
  estimated_market_value NUMERIC(12,2),
  useful_life_months INTEGER DEFAULT 60,
  expected_replacement_date DATE,
  warranty_expiry_date DATE,
  condition_score NUMERIC(4,1) DEFAULT 7.0,
  condition_notes TEXT,
  criticality TEXT DEFAULT 'medium',
  risk_rating TEXT DEFAULT 'low',
  status TEXT DEFAULT 'active',
  room_location TEXT,
  assigned_to_user_id UUID,
  ownership_type TEXT DEFAULT 'owned',
  acquisition_batch_id UUID,
  photo_url TEXT,
  manual_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Public assets') THEN
    CREATE POLICY "Public assets" ON assets FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'asset_categories' AND policyname = 'Public categories') THEN
    CREATE POLICY "Public categories" ON asset_categories FOR SELECT USING (true);
  END IF;
END $$;
