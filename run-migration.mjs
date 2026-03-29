import pg from 'pg';
const { Client } = pg;

// Connection via Supabase direct connection
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.optlghedswctsklcxlkn@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Check existing tables
    const check = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'retail_%'
    `);
    console.log('📋 Existing tables:', check.rows.map(r => r.table_name).join(', ') || 'none');
    
    if (check.rows.length > 0) {
      console.log('\n✅ Tables already exist!');
      await client.end();
      return;
    }
    
    // Create tables
    console.log('\n📦 Creating retail tables...\n');
    
    await client.query(`
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
      )
    `);
    console.log('  ✓ retail_products');
    
    await client.query(`
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
      )
    `);
    console.log('  ✓ retail_orders');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS retail_order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES retail_orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES retail_products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        unit_cost DECIMAL(10,2),
        line_total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ retail_order_items');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID,
        clinician_id UUID,
        diagnosis_id UUID,
        product_id UUID REFERENCES retail_products(id),
        recommendation_reason TEXT,
        recommendation_type TEXT,
        accepted BOOLEAN DEFAULT NULL,
        accepted_at TIMESTAMPTZ,
        converted_to_order BOOLEAN DEFAULT FALSE,
        order_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✓ product_recommendations');
    
    await client.query(`
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
      )
    `);
    console.log('  ✓ product_outcomes');
    
    // Create indexes
    console.log('\n📊 Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_retail_products_sku ON retail_products(sku)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_retail_products_type ON retail_products(product_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_retail_orders_patient ON retail_orders(patient_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_retail_order_items_order ON retail_order_items(order_id)`);
    console.log('  ✓ Indexes created');
    
    console.log('\n✅ Migration complete!');
    console.log('   Tables created: retail_products, retail_orders, retail_order_items, product_recommendations, product_outcomes');
    
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
  }
}

run();
