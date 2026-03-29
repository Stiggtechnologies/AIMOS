-- AIMOS Complete Migration - Run in Supabase SQL Editor
-- https://tfnoogotbyshsznpjspk.supabase.co/project/-/sql

-- =====================================================
-- ASSET MANAGEMENT MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_clinic_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asset_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID,
  clinic_id UUID,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS standardization_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  category_id UUID,
  standard_target_model TEXT,
  standard_target_vendor TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS standardization_group_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standardization_group_id UUID,
  asset_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(standardization_group_id, asset_id)
);

CREATE TABLE IF NOT EXISTS asset_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID,
  user_id UUID,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset indexes
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_user ON user_clinic_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_clinic ON user_clinic_access(clinic_id);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_asset ON asset_alerts(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_clinic ON asset_alerts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_asset_audit_log_asset ON asset_audit_log(asset_id);

-- =====================================================
-- RETAIL MODULE
-- =====================================================

CREATE TABLE IF NOT EXISTS retail_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_product_id BIGINT,
  shopify_variant_id BIGINT,
  sku TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  product_type TEXT,
  condition_tag TEXT[],
  vendor TEXT,
  cost_price DECIMAL(10,2),
  retail_price DECIMAL(10,2) NOT NULL,
  margin_percentage DECIMAL(5,2),
  category TEXT,
  subcategory TEXT,
  image_url TEXT,
  is_bundle BOOLEAN DEFAULT FALSE,
  bundle_contents JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  min_stock INTEGER DEFAULT 10,
  reorder_point INTEGER DEFAULT 5,
  clinic_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retail_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  shopify_order_id BIGINT,
  patient_id UUID,
  clinician_id UUID,
  clinic_id UUID,
  order_source TEXT,
  subtotal DECIMAL(10,2),
  tax_total DECIMAL(10,2),
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retail_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES retail_orders(id) ON DELETE CASCADE,
  product_id UUID,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID,
  clinician_id UUID,
  diagnosis_id UUID,
  product_id UUID,
  recommendation_reason TEXT,
  recommendation_type TEXT,
  accepted BOOLEAN,
  accepted_at TIMESTAMPTZ,
  converted_to_order BOOLEAN DEFAULT FALSE,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID,
  product_id UUID,
  order_id UUID,
  diagnosis TEXT,
  treatment_plan_id UUID,
  pain_score_before INTEGER,
  pain_score_after INTEGER,
  recovery_days INTEGER,
  visits_required INTEGER,
  outcome_notes TEXT,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retail indexes
CREATE INDEX IF NOT EXISTS idx_retail_products_sku ON retail_products(sku);
CREATE INDEX IF NOT EXISTS idx_retail_products_type ON retail_products(product_type);
CREATE INDEX IF NOT EXISTS idx_retail_orders_patient ON retail_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_retail_order_items_order ON retail_order_items(order_id);

-- =====================================================
-- VERIFY
-- =====================================================
SELECT 'Asset tables:' as status;
SELECT count(*) as tables FROM information_schema.tables WHERE table_name LIKE 'asset%' OR table_name LIKE 'user_clinic%';
SELECT 'Retail tables:' as status;
SELECT count(*) as tables FROM information_schema.tables WHERE table_name LIKE 'retail%';

-- Seed sample products
INSERT INTO retail_products (sku, title, description, product_type, condition_tag, cost_price, retail_price, category)
VALUES 
  ('BUNDLE-BACK-KIT', 'AIM Back Recovery Kit', 'Complete back pain recovery system. Includes foam roller, massage ball, resistance band, and hot/cold pack.', 'Bundles', ARRAY['back pain'], 40.00, 149.00, 'Recovery Kits'),
  ('BUNDLE-KNEE-KIT', 'AIM Knee Rehab Kit', 'Everything needed for knee rehabilitation.', 'Bundles', ARRAY['knee pain'], 35.00, 119.00, 'Recovery Kits'),
  ('BUNDLE-DESK-KIT', 'AIM Desk Worker Recovery Kit', 'Combat desk-related pain.', 'Bundles', ARRAY['back pain', 'neck pain'], 60.00, 179.00, 'Recovery Kits'),
  ('BUNDLE-ATHLETE-KIT', 'AIM Athlete Performance Kit', 'Professional recovery system.', 'Bundles', ARRAY['sports injury'], 120.00, 299.00, 'Recovery Kits')
ON CONFLICT (sku) DO NOTHING;
