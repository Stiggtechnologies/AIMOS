-- AIM Retail System Integration - Product & Orders Schema
-- Added: 2026-03-28
-- Purpose: Track products, orders, and link to patient outcomes in AIMOS

-- Products table (synced from Shopify)
CREATE TABLE IF NOT EXISTS retail_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopify_product_id BIGINT,
    shopify_variant_id BIGINT,
    sku TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    product_type TEXT,
    condition_tag TEXT[], -- Array: 'back pain', 'knee pain', 'neck pain', 'sports injury'
    vendor TEXT,
    cost_price DECIMAL(10,2),
    retail_price DECIMAL(10,2) NOT NULL,
    margin_percentage DECIMAL(5,2),
    category TEXT,
    subcategory TEXT,
    image_url TEXT,
    is_bundle BOOLEAN DEFAULT FALSE,
    bundle_contents JSONB, -- Array of product IDs for bundles
    is_active BOOLEAN DEFAULT TRUE,
    min_stock INTEGER DEFAULT 10,
    reorder_point INTEGER DEFAULT 5,
    clinic_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS retail_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE,
    shopify_order_id BIGINT,
    patient_id UUID REFERENCES patients(id),
    clinician_id UUID REFERENCES users(id),
    clinic_id UUID REFERENCES organizations(id),
    order_source TEXT, -- 'in-clinic', 'online', 'recommendation'
    subtotal DECIMAL(10,2),
    tax_total DECIMAL(10,2),
    total DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2),
    total_margin DECIMAL(10,2),
    status TEXT DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled
    payment_method TEXT,
    shipping_address JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS retail_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES retail_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES retail_products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    line_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product recommendations (AI-driven)
CREATE TABLE IF NOT EXISTS product_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    clinician_id UUID REFERENCES users(id),
    diagnosis_id UUID,
    product_id UUID REFERENCES retail_products(id),
    recommendation_reason TEXT,
    recommendation_type TEXT, -- 'auto' (AI), 'manual' (clinician)
    accepted BOOLEAN DEFAULT NULL, -- NULL = not yet responded, true/false
    accepted_at TIMESTAMPTZ,
    converted_to_order BOOLEAN DEFAULT FALSE,
    order_id UUID REFERENCES retail_orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product-outcome tracking (the magic sauce)
CREATE TABLE IF NOT EXISTS product_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    product_id UUID REFERENCES retail_products(id),
    order_id UUID REFERENCES retail_orders(id),
    diagnosis TEXT,
    treatment_plan_id UUID,
    pain_score_before INTEGER,
    pain_score_after INTEGER,
    recovery_days INTEGER,
    visits_required INTEGER,
    outcome_notes TEXT,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_retail_products_sku ON retail_products(sku);
CREATE INDEX IF NOT EXISTS idx_retail_products_type ON retail_products(product_type);
CREATE INDEX IF NOT EXISTS idx_retail_products_condition ON retail_products USING GIN(condition_tag);
CREATE INDEX IF NOT EXISTS idx_retail_orders_patient ON retail_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_retail_orders_clinic ON retail_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_retail_order_items_order ON retail_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendations_patient ON product_recommendations(patient_id);
CREATE INDEX IF NOT EXISTS idx_product_outcomes_patient ON product_outcomes(patient_id);

-- RLS (Row Level Security)
ALTER TABLE retail_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE retail_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_outcomes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read products" ON retail_products FOR SELECT USING (true);
CREATE POLICY "Clinicians can manage products" ON retail_products FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'clinician')
);

-- Function to calculate margin
CREATE OR REPLACE FUNCTION calculate_margin(retail_price DECIMAL, cost_price DECIMAL)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF cost_price IS NULL OR cost_price = 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND(((retail_price - cost_price) / retail_price) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to sync product from Shopify (for webhooks)
CREATE OR REPLACE FUNCTION sync_shopify_product(
    p_shopify_id BIGINT,
    p_title TEXT,
    p_description TEXT,
    p_price DECIMAL,
    p_type TEXT,
    p_sku TEXT
)
RETURNS UUID AS $$
DECLARE
    v_product_id UUID;
BEGIN
    INSERT INTO retail_products (shopify_product_id, title, description, retail_price, product_type, sku)
    VALUES (p_shopify_id, p_title, p_description, p_price, p_type, p_sku)
    ON CONFLICT (sku) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        retail_price = EXCLUDED.retail_price,
        product_type = EXCLUDED.product_type,
        updated_at = NOW()
    RETURNING id INTO v_product_id;
    RETURN v_product_id;
END;
$$ LANGUAGE plpgsql;

-- Seed sample products for testing
INSERT INTO retail_products (sku, title, description, product_type, condition_tag, cost_price, retail_price, category)
VALUES 
    ('BUNDLE-BACK-KIT', 'AIM Back Recovery Kit', 'Complete back pain recovery system. Includes foam roller, massage ball, resistance band, and hot/cold pack.', 'Bundles', ARRAY['back pain'], 40.00, 149.00, 'Recovery Kits'),
    ('BUNDLE-KNEE-KIT', 'AIM Knee Rehab Kit', 'Everything needed for knee rehabilitation.', 'Bundles', ARRAY['knee pain'], 35.00, 119.00, 'Recovery Kits'),
    ('BUNDLE-DESK-KIT', 'AIM Desk Worker Recovery Kit', 'Combat desk-related pain.', 'Bundles', ARRAY['back pain', 'neck pain'], 60.00, 179.00, 'Recovery Kits'),
    ('BUNDLE-ATHLETE-KIT', 'AIM Athlete Performance Kit', 'Professional recovery system.', 'Bundles', ARRAY['sports injury'], 120.00, 299.00, 'Recovery Kits')
ON CONFLICT (sku) DO NOTHING;

COMMENT ON TABLE retail_products IS 'Products inventory synced from Shopify with condition tags for AI recommendations';
COMMENT ON TABLE retail_orders IS 'Orders from in-clinic sales, online store, and clinician recommendations';
COMMENT ON TABLE product_outcomes IS 'Track which products actually improve patient outcomes - the data moat';
COMMENT ON TABLE product_recommendations IS 'AI and clinician product recommendations tied to diagnoses';