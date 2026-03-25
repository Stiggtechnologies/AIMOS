-- AIMOS Asset Management System - Database Schema
-- Phase 1: Core Asset Tables

-- Clinics table (already exists, adding asset-related fields if needed)
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  address TEXT,
  region TEXT,
  opening_date DATE,
  acquisition_date DATE,
  manager_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Categories
CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_category_id UUID REFERENCES asset_categories(id),
  description TEXT,
  depreciation_method_default TEXT DEFAULT 'CCA',
  useful_life_months_default INTEGER DEFAULT 60,
  is_maintenance_trackable BOOLEAN DEFAULT TRUE,
  is_depreciable BOOLEAN DEFAULT TRUE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Acquisition Batches (tracks assets from clinic acquisitions)
CREATE TABLE IF NOT EXISTS acquisition_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
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

-- Master Asset Register
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag TEXT NOT NULL UNIQUE,
  qr_code_value TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  category_id UUID REFERENCES asset_categories(id),
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
  assigned_to_user_id UUID REFERENCES auth.users(id),
  ownership_type TEXT DEFAULT 'owned',
  acquisition_batch_id UUID REFERENCES acquisition_batches(id),
  photo_url TEXT,
  manual_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Valuations History
CREATE TABLE IF NOT EXISTS asset_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  purchase_cost NUMERIC(12,2),
  book_value NUMERIC(12,2),
  replacement_cost NUMERIC(12,2),
  market_value NUMERIC(12,2),
  valuation_method TEXT,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Condition Assessments
CREATE TABLE IF NOT EXISTS asset_condition_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  condition_score NUMERIC(4,1),
  operability_status TEXT,
  observed_defects TEXT,
  recommended_action TEXT,
  assessed_by UUID REFERENCES auth.users(id),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Plans
CREATE TABLE IF NOT EXISTS maintenance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  maintenance_type TEXT NOT NULL,
  frequency_type TEXT NOT NULL,
  frequency_value INTEGER,
  next_due_date DATE,
  estimated_hours NUMERIC(8,2),
  estimated_cost NUMERIC(12,2),
  procedure TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work Orders
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  maintenance_plan_id UUID REFERENCES maintenance_plans(id) ON DELETE SET NULL,
  work_order_number TEXT UNIQUE,
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  issue_description TEXT,
  requested_date DATE,
  scheduled_date DATE,
  completed_date DATE,
  assigned_to UUID,
  vendor_name TEXT,
  labor_cost NUMERIC(12,2) DEFAULT 0,
  parts_cost NUMERIC(12,2) DEFAULT 0,
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(labor_cost,0) + COALESCE(parts_cost,0)) STORED,
  downtime_hours NUMERIC(8,2),
  root_cause TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Documents
CREATE TABLE IF NOT EXISTS asset_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  document_type TEXT,
  file_url TEXT NOT NULL,
  title TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Disposals
CREATE TABLE IF NOT EXISTS asset_disposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  disposal_date DATE NOT NULL,
  disposal_method TEXT,
  sale_value NUMERIC(12,2),
  write_off_value NUMERIC(12,2),
  reason TEXT,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capital Projects
CREATE TABLE IF NOT EXISTS capital_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  project_type TEXT,
  budget NUMERIC(12,2),
  forecast_cost NUMERIC(12,2),
  approved_date DATE,
  start_date DATE,
  target_completion_date DATE,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset AI Insights (for AI recommendations)
CREATE TABLE IF NOT EXISTS asset_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  reasoning TEXT,
  urgency TEXT DEFAULT 'low',
  financial_impact NUMERIC(12,2),
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);

-- RLS Policies
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisition_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_condition_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_insights ENABLE ROW LEVEL SECURITY;

-- Public read for asset data
CREATE POLICY "Public assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Public categories" ON asset_categories FOR SELECT USING (true);
CREATE POLICY "Public batches" ON acquisition_batches FOR SELECT USING (true);
CREATE POLICY "Public work orders" ON work_orders FOR SELECT USING (true);

-- Users can see their clinic's assets
CREATE POLICY "Clinic assets view" ON assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (role = 'executive' OR role = 'admin' OR primary_clinic_id = clinic_id))
);

-- Managers/admins can modify
CREATE POLICY "Manage assets" ON assets FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'executive', 'clinic_manager'))
);

-- Insert default asset categories
INSERT INTO asset_categories (name, description, icon, color, useful_life_months_default) VALUES
('Clinical Equipment', 'Treatment tables, therapy devices, rehab equipment', 'Stethoscope', '#3B82F6', 84),
('IT & Digital', 'Computers, tablets, networking, phones', 'Laptop', '#10B981', 48),
('Furniture & Fixtures', 'Chairs, desks, reception furniture', 'Armchair', '#F59E0B', 120),
('Leasehold Improvements', 'Flooring, walls, lighting, cabinetry', 'Building', '#8B5CF6', 180),
('Facility Systems', 'HVAC, security, access control', 'Shield', '#EF4444', 120),
('Vehicles', 'Company vehicles, mobile units', 'Car', '#6366F1', 60);

-- Insert sample clinics
INSERT INTO clinics (name, code, status, address, region, acquisition_date) VALUES
('AIM Physiotherapy - Edmonton', 'AIM-EDM-001', 'active', 'Edmonton, AB', 'Edmonton', '2024-01-15'),
('AIM Physiotherapy - Calgary South', 'YYC-S', 'active', 'Calgary, AB', 'Calgary', '2025-06-01'),
('AIM Physiotherapy - Red Deer', 'RD-001', 'active', 'Red Deer, AB', 'Central', '2025-09-15');

-- Insert sample assets for demo
INSERT INTO assets (asset_tag, name, description, clinic_id, category_id, manufacturer, model, purchase_cost, replacement_cost, condition_score, criticality, status, room_location, in_service_date) VALUES
('AIM-EDM-001-T001', 'Treatment Table', 'Electric height-adjustable treatment table', 
 (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'),
 (SELECT id FROM asset_categories WHERE name = 'Clinical Equipment'),
 'Physiomed', 'ProTable 3000', 8500, 12000, 8.5, 'high', 'active', 'Treatment Room 1', '2024-02-01'),
('AIM-EDM-001-T002', 'Treatment Table', 'Standard treatment table',
 (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'),
 (SELECT id FROM asset_categories WHERE name = 'Clinical Equipment'),
 'Physiomed', 'ProTable 2000', 4500, 6000, 7.0, 'high', 'active', 'Treatment Room 2', '2024-02-01'),
('AIM-EDM-001-S001', 'Shockwave Therapy', 'Radial shockwave device',
 (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'),
 (SELECT id FROM asset_categories WHERE name = 'Clinical Equipment'),
 'Storz', 'D-Actor 200', 15000, 22000, 9.0, 'medium', 'active', 'Treatment Room 3', '2024-03-15'),
('AIM-EDM-001-L001', 'Laptop', 'Dell Latitude for front desk',
 (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'),
 (SELECT id FROM asset_categories WHERE name = 'IT & Digital'),
 'Dell', 'Latitude 5540', 1200, 1500, 7.5, 'medium', 'active', 'Reception', '2024-01-20'),
('AIM-EDM-001-C001', 'Reception Chair', 'Waiting room seating',
 (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'),
 (SELECT id FROM asset_categories WHERE name = 'Furniture & Fixtures'),
 'Global', 'Jazz Waiting Chair', 450, 600, 8.0, 'low', 'active', 'Waiting Room', '2024-02-01'),
('AIM-YYC-001-T001', 'Treatment Table', 'Electric treatment table',
 (SELECT id FROM clinics WHERE code = 'YYC-S'),
 (SELECT id FROM asset_categories WHERE name = 'Clinical Equipment'),
 'Physiomed', 'ProTable 3000', 8500, 12000, 9.0, 'high', 'active', 'Treatment Room 1', '2025-06-15'),
('AIM-YYC-001-L001', 'Desktop Computer', 'Reception workstation',
 (SELECT id FROM clinics WHERE code = 'YYC-S'),
 (SELECT id FROM asset_categories WHERE name = 'IT & Digital'),
 'HP', 'ProDesk 400', 800, 1000, 8.5, 'medium', 'active', 'Reception', '2025-06-15'),
('AIM-RD-001-T001', 'Treatment Table', 'Manual treatment table',
 (SELECT id FROM clinics WHERE code = 'RD-001'),
 (SELECT id FROM asset_categories WHERE name = 'Clinical Equipment'),
 'Physiomed', 'BasicTable', 2500, 3500, 6.0, 'high', 'active', 'Treatment Room 1', '2025-10-01'),
('AIM-RD-001-F001', 'Reception Desk', 'Reception counter installation',
 (SELECT id FROM clinics WHERE code = 'RD-001'),
 (SELECT id FROM asset_categories WHERE name = 'Leasehold Improvements'),
 'Custom', 'Reception Buildout', 8000, 10000, 7.0, 'medium', 'active', 'Reception', '2025-10-01');

-- Create indexes
CREATE INDEX idx_assets_clinic ON assets(clinic_id);
CREATE INDEX idx_assets_category ON assets(category_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_criticality ON assets(criticality);
CREATE INDEX idx_work_orders_asset ON work_orders(asset_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_maintenance_plans_asset ON maintenance_plans(asset_id);
CREATE INDEX idx_maintenance_plans_due ON maintenance_plans(next_due_date);

-- Function to generate asset tag
CREATE OR REPLACE FUNCTION generate_asset_tag(clinic_code TEXT, category_initial TEXT, sequence_num INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(clinic_code) || '-' || category_initial || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update asset condition automatically
CREATE OR REPLACE FUNCTION update_asset_condition(asset_uuid UUID, new_condition_score NUMERIC(4,1))
RETURNS VOID AS $$
BEGIN
  UPDATE assets 
  SET condition_score = new_condition_score,
      risk_rating = CASE 
        WHEN new_condition_score >= 7 THEN 'low'
        WHEN new_condition_score >= 5 THEN 'medium'
        ELSE 'high'
      END,
      updated_at = NOW()
  WHERE id = asset_uuid;
  
  -- Insert assessment record
  INSERT INTO asset_condition_assessments (asset_id, assessment_date, condition_score, assessed_by)
  VALUES (asset_uuid, NOW(), new_condition_score, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE assets IS 'Master asset register for AIMOS - tracks all clinic assets';
COMMENT ON TABLE asset_categories IS 'Standard taxonomy for asset classification';
COMMENT ON TABLE acquisition_batches IS 'Tracks assets acquired with each clinic purchase';
COMMENT ON TABLE work_orders IS 'Maintenance work orders for assets';
COMMENT ON TABLE asset_insights AI recommendations for asset lifecycle management';
