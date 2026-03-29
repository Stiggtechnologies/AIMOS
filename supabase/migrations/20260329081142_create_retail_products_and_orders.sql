
/*
  # Create Retail Products and Orders Schema

  ## New Tables
  - `retail_products` - Product catalog with Shopify integration, pricing, bundling, and clinic assignment
  - `retail_orders` - Orders linked to patients, clinicians, and clinics with full financial tracking
  - `retail_order_items` - Line items for each order
  - `product_recommendations` - Clinician-to-patient product recommendations with conversion tracking
  - `product_outcomes` - Clinical outcome data tied to product use

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read and manage records scoped to their access

  ## Indexes
  - SKU and product type on retail_products
  - Patient ID on retail_orders
  - Order ID on retail_order_items
*/

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

ALTER TABLE retail_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view retail products"
  ON retail_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert retail products"
  ON retail_products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update retail products"
  ON retail_products FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete retail products"
  ON retail_products FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

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
  total_cost DECIMAL(10,2),
  total_margin DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE retail_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view retail orders"
  ON retail_orders FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert retail orders"
  ON retail_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update retail orders"
  ON retail_orders FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete retail orders"
  ON retail_orders FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

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

ALTER TABLE retail_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view retail order items"
  ON retail_order_items FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert retail order items"
  ON retail_order_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update retail order items"
  ON retail_order_items FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete retail order items"
  ON retail_order_items FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

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

ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view product recommendations"
  ON product_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert product recommendations"
  ON product_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product recommendations"
  ON product_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product recommendations"
  ON product_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

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

ALTER TABLE product_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view product outcomes"
  ON product_outcomes FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert product outcomes"
  ON product_outcomes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update product outcomes"
  ON product_outcomes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete product outcomes"
  ON product_outcomes FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_retail_products_sku ON retail_products(sku);
CREATE INDEX IF NOT EXISTS idx_retail_products_type ON retail_products(product_type);
CREATE INDEX IF NOT EXISTS idx_retail_orders_patient ON retail_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_retail_order_items_order ON retail_order_items(order_id);
