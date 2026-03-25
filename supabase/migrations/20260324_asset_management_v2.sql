-- AIMOS Asset Intelligence Module - Extended Schema
-- Phase 2: Access Control, Alerts, Standardization

-- User Clinic Access (multi-clinic permission model)
CREATE TABLE IF NOT EXISTS user_clinic_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'executive_admin', 'finance', 'ops_manager', 'clinic_manager', 'acquisition_team', 'technician'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Alerts (system-generated alerts)
CREATE TABLE IF NOT EXISTS asset_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'warranty_expiring', 'pm_overdue', 'condition_low', 'replace_now', 'inspection_due'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
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

-- Asset Audit Log (for tracking all changes)
CREATE TABLE IF NOT EXISTS asset_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'created', 'updated', 'condition_changed', 'maintenance_performed', 'document_added'
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE user_clinic_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE standardization_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE standardization_group_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_clinic_access
CREATE POLICY "Users can view their clinic access" ON user_clinic_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all access" ON user_clinic_access FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for asset_alerts
CREATE POLICY "Public alerts" ON asset_alerts FOR SELECT USING (true);
CREATE POLICY "Manage alerts" ON asset_alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'executive', 'ops_manager'))
);

-- RLS Policies for standardization
CREATE POLICY "Public standardization" ON standardization_groups FOR SELECT USING (true);
CREATE POLICY "Public standardization assets" ON standardization_group_assets FOR SELECT USING (true);
CREATE POLICY "Manage standardization" ON standardization_groups FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'executive'))
);

-- RLS Policies for audit log
CREATE POLICY "View audit log" ON asset_audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'executive'))
);
CREATE POLICY "Insert audit log" ON asset_audit_log FOR INSERT WITH CHECK (true);

-- Seed user clinic access for demo users
INSERT INTO user_clinic_access (user_id, clinic_id, role) VALUES
((SELECT id FROM auth.users WHERE email = 'sarah.executive@aimrehab.ca'), (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'), 'executive_admin'),
((SELECT id FROM auth.users WHERE email = 'sarah.executive@aimrehab.ca'), (SELECT id FROM clinics WHERE code = 'YYC-S'), 'executive_admin'),
((SELECT id FROM auth.users WHERE email = 'sarah.executive@aimrehab.ca'), (SELECT id FROM clinics WHERE code = 'RD-001'), 'executive_admin'),
((SELECT id FROM auth.users WHERE email = 'michael.manager@aimrehab.ca'), (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'), 'clinic_manager'),
((SELECT id FROM auth.users WHERE email = 'jennifer.clinician@aimrehab.ca'), (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'), 'technician');

-- Seed some alerts for demo
INSERT INTO asset_alerts (asset_id, clinic_id, alert_type, severity, title, description, due_date) VALUES
((SELECT id FROM assets WHERE asset_tag = 'AIM-RD-001-T001'), (SELECT id FROM clinics WHERE code = 'RD-001'), 'condition_low', 'high', 'Treatment Table Condition Critical', 'Asset condition score is 6.0 - needs inspection', '2026-04-01'),
((SELECT id FROM assets WHERE asset_tag = 'AIM-EDM-001-T001'), (SELECT id FROM clinics WHERE code = 'AIM-EDM-001'), 'pm_overdue', 'medium', 'Annual Service Due', 'Preventive maintenance overdue by 14 days', '2026-03-20'),
((SELECT id FROM assets WHERE asset_tag = 'AIM-RD-001-T001'), (SELECT id FROM clinics WHERE code = 'RD-001'), 'replace_now', 'high', 'Replacement Recommended', 'Asset approaching end of useful life with high criticality', '2026-06-01');

-- Seed standardization groups
INSERT INTO standardization_groups (group_name, category_id, standard_target_model, standard_target_vendor, notes) VALUES
('Standard Laptop Fleet', (SELECT id FROM asset_categories WHERE name = 'IT & Digital'), 'Latitude 5540', 'Dell', 'Standard laptop for all front desk and admin roles'),
('Standard Treatment Table', (SELECT id FROM asset_categories WHERE name = 'Clinical Equipment'), 'ProTable 3000', 'Physiomed', 'Preferred electric treatment table for new clinics');

-- Add asset_health_score function
CREATE OR REPLACE FUNCTION calculate_asset_health_score(asset_uuid UUID)
RETURNS NUMERIC(4,1) AS $$
DECLARE
  condition_weight NUMERIC(4,2) := 0.35;
  age_weight NUMERIC(4,2) := 0.20;
  maintenance_weight NUMERIC(4,2) := 0.20;
  criticality_weight NUMERIC(4,2) := 0.15;
  doc_weight NUMERIC(4,2) := 0.10;
  
  v_condition NUMERIC(4,1);
  v_age_percent NUMERIC(5,2);
  v_maintenance_ratio NUMERIC(5,2);
  v_criticality_score NUMERIC(4,1);
  v_doc_score NUMERIC(4,1);
  v_health_score NUMERIC(4,1);
  
  v_purchase_date DATE;
  v_useful_life_months INTEGER;
  v_age_months INTEGER;
  v_total_maintenance_cost NUMERIC(12,2);
  v_replacement_cost NUMERIC(12,2);
BEGIN
  -- Get asset data
  SELECT a.condition_score, a.purchase_date, a.useful_life_months, a.criticality, a.replacement_cost
  INTO v_condition, v_purchase_date, v_useful_life_months, v_criticality_score, v_replacement_cost
  FROM assets a WHERE a.id = asset_uuid;
  
  IF v_condition IS NULL THEN
    RETURN 5.0;
  END IF;
  
  -- Calculate age percent
  IF v_purchase_date IS NOT NULL AND v_useful_life_months IS NOT NULL AND v_useful_life_months > 0 THEN
    v_age_months := EXTRACT(MONTH FROM AGE(NOW(), v_purchase_date));
    v_age_percent := (v_age_months::NUMERIC / v_useful_life_months::NUMERIC) * 100;
  ELSE
    v_age_percent := 50;
  END IF;
  
  -- Get maintenance cost ratio
  SELECT COALESCE(SUM(total_cost), 0) INTO v_total_maintenance_cost
  FROM work_orders wo 
  WHERE wo.asset_id = asset_uuid 
  AND wo.completed_date >= NOW() - INTERVAL '12 months';
  
  IF v_replacement_cost IS NOT NULL AND v_replacement_cost > 0 THEN
    v_maintenance_ratio := (v_total_maintenance_cost / v_replacement_cost) * 100;
  ELSE
    v_maintenance_ratio := 0;
  END IF;
  
  -- Calculate criticality score (inverse - high criticality = higher health requirement)
  v_criticality_score := CASE 
    WHEN v_criticality_score = 'mission critical' THEN 3.0
    WHEN v_criticality_score = 'high' THEN 2.0
    WHEN v_criticality_score = 'medium' THEN 1.0
    ELSE 0.0
  END;
  
  -- Calculate doc completeness
  SELECT COUNT(*) INTO v_doc_score FROM asset_documents WHERE asset_id = asset_uuid;
  v_doc_score := LEAST(v_doc_score::NUMERIC / 5.0, 1.0) * 10.0;
  
  -- Calculate health score
  v_health_score := 
    (v_condition * condition_weight) +
    ((100 - v_age_percent) * age_weight / 100 * 10) +
    (CASE WHEN v_maintenance_ratio < 10 THEN 10 ELSE 10 - (v_maintenance_ratio / 20) END * maintenance_weight / 10 * 10) +
    ((10 - v_criticality_score) * criticality_weight / 3 * 10) +
    (v_doc_score * doc_weight / 10 * 10);
  
  RETURN ROUND(GREATEST(LEAST(v_health_score, 10.0), 0.0), 1);
END;
$$ LANGUAGE plpgsql;

-- Function to check replace-now triggers
CREATE OR REPLACE FUNCTION check_replace_now_trigger(asset_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_condition NUMERIC(4,1);
  v_age_percent NUMERIC(5,2);
  v_maintenance_ratio NUMERIC(5,2);
  v_useful_life_months INTEGER;
  v_purchase_date DATE;
  v_criticality TEXT;
  v_failure_count INTEGER;
  v_replacement_cost NUMERIC(12,2);
  v_maintenance_cost NUMERIC(12,2);
BEGIN
  SELECT a.condition_score, a.purchase_date, a.useful_life_months, a.criticality, a.replacement_cost
  INTO v_condition, v_purchase_date, v_useful_life_months, v_criticality, v_replacement_cost
  FROM assets a WHERE a.id = asset_uuid;
  
  -- Calculate age percent
  IF v_purchase_date IS NOT NULL AND v_useful_life_months IS NOT NULL AND v_useful_life_months > 0 THEN
    v_age_percent := (EXTRACT(MONTH FROM AGE(NOW(), v_purchase_date))::NUMERIC / v_useful_life_months::NUMERIC) * 100;
  ELSE
    v_age_percent := 0;
  END IF;
  
  -- Get maintenance cost ratio
  SELECT COALESCE(SUM(total_cost), 0) INTO v_maintenance_cost
  FROM work_orders WHERE asset_id = asset_uuid AND completed_date >= NOW() - INTERVAL '12 months';
  
  IF v_replacement_cost IS NOT NULL AND v_replacement_cost > 0 THEN
    v_maintenance_ratio := (v_maintenance_cost / v_replacement_cost) * 100;
  ELSE
    v_maintenance_ratio := 0;
  END IF;
  
  -- Count repeated failures
  SELECT COUNT(*) INTO v_failure_count
  FROM work_orders 
  WHERE asset_id = asset_uuid 
  AND type IN ('corrective', 'emergency')
  AND completed_date >= NOW() - INTERVAL '90 days';
  
  -- Check triggers
  IF v_condition <= 3.5 THEN RETURN TRUE; END IF;
  IF v_age_percent >= 90 AND v_criticality IN ('high', 'mission critical') THEN RETURN TRUE; END IF;
  IF v_maintenance_ratio > 25 THEN RETURN TRUE; END IF;
  IF v_failure_count >= 2 THEN RETURN TRUE; END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_user_clinic_user ON user_clinic_access(user_id);
CREATE INDEX idx_user_clinic_clinic ON user_clinic_access(clinic_id);
CREATE INDEX idx_asset_alerts_asset ON asset_alerts(asset_id);
CREATE INDEX idx_asset_alerts_status ON asset_alerts(status);
CREATE INDEX idx_asset_alerts_due ON asset_alerts(due_date);
CREATE INDEX idx_audit_log_asset ON asset_audit_log(asset_id);
CREATE INDEX idx_audit_log_user ON asset_audit_log(user_id);
CREATE INDEX idx_std_group_assets_group ON standardization_group_assets(standardization_group_id);
CREATE INDEX idx_std_group_assets_asset ON standardization_group_assets(asset_id);
