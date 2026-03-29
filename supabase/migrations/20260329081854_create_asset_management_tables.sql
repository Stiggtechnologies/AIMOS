
/*
  # Create Asset Management Tables

  ## New Tables
  - `user_clinic_access` - Maps users to clinics with roles; references auth.users and clinics
  - `asset_alerts` - Alerts for assets with severity, status, and lifecycle timestamps
  - `standardization_groups` - Groups of assets targeted for standardization
  - `standardization_group_assets` - Join table linking assets to standardization groups
  - `asset_audit_log` - Full audit trail for asset changes (field-level change tracking)

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read and manage records

  ## Indexes
  - user_id and clinic_id on user_clinic_access
  - asset_id and clinic_id on asset_alerts
  - asset_id on asset_audit_log
*/

CREATE TABLE IF NOT EXISTS user_clinic_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_clinic_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clinic access"
  ON user_clinic_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert clinic access"
  ON user_clinic_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clinic access"
  ON user_clinic_access FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete clinic access"
  ON user_clinic_access FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

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

ALTER TABLE asset_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view asset alerts"
  ON asset_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert asset alerts"
  ON asset_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update asset alerts"
  ON asset_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete asset alerts"
  ON asset_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS standardization_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  category_id UUID,
  standard_target_model TEXT,
  standard_target_vendor TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE standardization_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view standardization groups"
  ON standardization_groups FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert standardization groups"
  ON standardization_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update standardization groups"
  ON standardization_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete standardization groups"
  ON standardization_groups FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS standardization_group_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standardization_group_id UUID,
  asset_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(standardization_group_id, asset_id)
);

ALTER TABLE standardization_group_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view standardization group assets"
  ON standardization_group_assets FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert standardization group assets"
  ON standardization_group_assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update standardization group assets"
  ON standardization_group_assets FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete standardization group assets"
  ON standardization_group_assets FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

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

ALTER TABLE asset_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view asset audit log"
  ON asset_audit_log FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert asset audit log"
  ON asset_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_user_clinic_access_user ON user_clinic_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_clinic ON user_clinic_access(clinic_id);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_asset ON asset_alerts(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_clinic ON asset_alerts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_asset_audit_log_asset ON asset_audit_log(asset_id);
