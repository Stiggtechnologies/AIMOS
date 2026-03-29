-- AIMOS Asset Intelligence Module - Extended Schema
-- Phase 2: Access Control, Alerts, Standardization
-- IMPORTANT: Run this AFTER Migration 1 (20260324_asset_management_CLEAN.sql)

-- User Clinic Access (multi-clinic permission model)
CREATE TABLE IF NOT EXISTS user_clinic_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('executive_admin', 'finance', 'ops_manager', 'clinic_manager', 'acquisition_team', 'technician')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, clinic_id)
);

-- Asset Alerts
CREATE TABLE IF NOT EXISTS asset_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warranty_expiring', 'pm_overdue', 'condition_low', 'replace_now', 'inspection_due')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Standardization Groups
CREATE TABLE IF NOT EXISTS standardization_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  category_id UUID REFERENCES asset_categories(id),
  standard_target_model TEXT,
  standard_target_vendor TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standardization Group Assets
CREATE TABLE IF NOT EXISTS standardization_group_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standardization_group_id UUID REFERENCES standardization_groups(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(standardization_group_id, asset_id)
);

-- Asset Audit Log
CREATE TABLE IF NOT EXISTS asset_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'condition_changed', 'maintenance_performed', 'document_added')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_clinic_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE standardization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE standardization_group_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (fixed - using user_clinic_access instead of user_profiles)
CREATE POLICY "Users can view their clinic access" ON user_clinic_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public alerts" ON asset_alerts FOR SELECT USING (true);
CREATE POLICY "Public standardization" ON standardization_groups FOR SELECT USING (true);
CREATE POLICY "Public standardization assets" ON standardization_group_assets FOR SELECT USING (true);
CREATE POLICY "View audit log" ON asset_audit_log FOR SELECT USING (true);
CREATE POLICY "Insert audit log" ON asset_audit_log FOR INSERT WITH CHECK (true);

-- Seed alerts
INSERT INTO asset_alerts (asset_id, clinic_id, alert_type, severity, title, description, due_date) VALUES
((SELECT id FROM assets WHERE asset_tag = 'AIM-RD-001-T001'), (SELECT id FROM clinics WHERE code = 'RD-001'), 'condition_low', 'high', 'Treatment Table Condition Critical', 'Asset condition score is 6.0 - needs inspection', '2026-04-01'),
((SELECT id FROM assets WHERE asset_tag = 'AIM-EDM-001-T001'), (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'), 'pm_overdue', 'medium', 'Annual Service Due', 'Preventive maintenance overdue by 14 days', '2026-03-20'),
((SELECT id FROM assets WHERE asset_tag = 'AIM-RD-001-T001'), (SELECT id FROM clinics WHERE code = 'RD-001'), 'replace_now', 'high', 'Replacement Recommended', 'Asset approaching end of useful life with high criticality', '2026-06-01');

-- Seed standardization groups
INSERT INTO standardization_groups (group_name, category_id, standard_target_model, standard_target_vendor, notes) VALUES
('Standard Laptop Fleet', (SELECT id FROM asset_categories WHERE name = 'IT & Digital'), 'Latitude 5540', 'Dell', 'Standard laptop for all front desk and admin roles'),
('Standard Treatment Table', (SELECT id FROM asset_categories WHERE name = 'Clinical Equipment'), 'ProTable 3000', 'Physiomed', 'Preferred electric treatment table for new clinics');

-- Indexes
CREATE INDEX idx_user_clinic_user ON user_clinic_access(user_id);
CREATE INDEX idx_user_clinic_clinic ON user_clinic_access(clinic_id);
CREATE INDEX idx_asset_alerts_asset ON asset_alerts(asset_id);
CREATE INDEX idx_asset_alerts_status ON asset_alerts(status);
CREATE INDEX idx_asset_alerts_due ON asset_alerts(due_date);
CREATE INDEX idx_audit_log_asset ON asset_audit_log(asset_id);
CREATE INDEX idx_audit_log_user ON asset_audit_log(user_id);
CREATE INDEX idx_std_group_assets_group ON standardization_group_assets(standardization_group_id);
CREATE INDEX idx_std_group_assets_asset ON standardization_group_assets(asset_id);

-- Asset health score function (simplified, no user_profiles dependency)
CREATE OR REPLACE FUNCTION calculate_asset_health_score(asset_uuid UUID)
RETURNS NUMERIC(4,1) AS $$
DECLARE
  v_condition NUMERIC(4,1);
  v_age_percent NUMERIC(5,2);
  v_purchase_date DATE;
  v_useful_life_months INTEGER;
  v_age_months INTEGER;
  v_replacement_cost NUMERIC(12,2);
  v_total_maint NUMERIC(12,2) := 0;
  v_maint_ratio NUMERIC(5,2) := 0;
BEGIN
  SELECT a.condition_score, a.purchase_date, a.useful_life_months, a.replacement_cost
  INTO v_condition, v_purchase_date, v_useful_life_months, v_replacement_cost
  FROM assets a WHERE a.id = asset_uuid;
  
  IF v_condition IS NULL THEN RETURN 5.0; END IF;
  
  IF v_purchase_date IS NOT NULL AND v_useful_life_months IS NOT NULL AND v_useful_life_months > 0 THEN
    v_age_months := EXTRACT(MONTH FROM AGE(NOW(), v_purchase_date));
    v_age_percent := (v_age_months::NUMERIC / v_useful_life_months::NUMERIC) * 100;
  ELSE
    v_age_percent := 50;
  END IF;
  
  RETURN ROUND(
    (v_condition * 0.4) + 
    ((100 - v_age_percent) * 0.4) + 
    (LEAST(10, v_condition * 0.2)),
  1);
END;
$$ LANGUAGE plpgsql;

SELECT 'Migration 2 complete: access control, alerts, standardization' as status;
