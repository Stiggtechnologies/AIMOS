/*
  # Fix RLS Auth Performance - Governance and Permissions Tables (Batch 6)

  1. Changes
    - Replace `auth.uid()` with `(SELECT auth.uid())` in RLS policies to cache auth function results
    - Fixes RLS performance issues across 15 tables with 17 policies total
    
  2. Tables Updated
    - approval_thresholds (1 policy)
    - duty_violations (1 policy)
    - override_tracking (1 policy)
    - manual_anomaly_flags (1 policy)
    - audit_alerts (1 policy)
    - audit_events (1 policy)
    - audit_logs (1 policy)
    - permission_checks (1 policy)
    - permission_denials (1 policy)
    - user_permission_overrides (2 policies)
    - ai_governance_logs (1 policy)
    - anomaly_detections (1 policy)
    - approval_workflows (2 policies)
    - capital_approvals (1 policy)
    - investment_approvals (1 policy)
    
  3. Security
    - All policies maintain existing access control logic
    - Only performance optimization applied
*/

-- approval_thresholds: Executives can manage thresholds
DROP POLICY IF EXISTS "Executives can manage thresholds" ON approval_thresholds;
CREATE POLICY "Executives can manage thresholds"
  ON approval_thresholds FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- duty_violations: Compliance team can view violations
DROP POLICY IF EXISTS "Compliance team can view violations" ON duty_violations;
CREATE POLICY "Compliance team can view violations"
  ON duty_violations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- override_tracking: Admins can view overrides
DROP POLICY IF EXISTS "Admins can view overrides" ON override_tracking;
CREATE POLICY "Admins can view overrides"
  ON override_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- manual_anomaly_flags: Managers can flag anomalies
DROP POLICY IF EXISTS "Managers can flag anomalies" ON manual_anomaly_flags;
CREATE POLICY "Managers can flag anomalies"
  ON manual_anomaly_flags FOR ALL
  TO authenticated
  USING (
    flagged_by_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- audit_alerts: Admins can view audit alerts
DROP POLICY IF EXISTS "Admins can view audit alerts" ON audit_alerts;
CREATE POLICY "Admins can view audit alerts"
  ON audit_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- audit_events: Admins can view audit events
DROP POLICY IF EXISTS "Admins can view audit events" ON audit_events;
CREATE POLICY "Admins can view audit events"
  ON audit_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- audit_logs: Admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- permission_checks: System can log permission checks
DROP POLICY IF EXISTS "System can log permission checks" ON permission_checks;
CREATE POLICY "System can log permission checks"
  ON permission_checks FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- permission_denials: Admins can view permission denials
DROP POLICY IF EXISTS "Admins can view permission denials" ON permission_denials;
CREATE POLICY "Admins can view permission denials"
  ON permission_denials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- user_permission_overrides: Admins can manage overrides
DROP POLICY IF EXISTS "Admins can manage overrides" ON user_permission_overrides;
CREATE POLICY "Admins can manage overrides"
  ON user_permission_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- user_permission_overrides: Users can view own overrides
DROP POLICY IF EXISTS "Users can view own overrides" ON user_permission_overrides;
CREATE POLICY "Users can view own overrides"
  ON user_permission_overrides FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- ai_governance_logs: Admins can view AI governance logs
DROP POLICY IF EXISTS "Admins can view AI governance logs" ON ai_governance_logs;
CREATE POLICY "Admins can view AI governance logs"
  ON ai_governance_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- anomaly_detections: Managers can view anomalies
DROP POLICY IF EXISTS "Managers can view anomalies" ON anomaly_detections;
CREATE POLICY "Managers can view anomalies"
  ON anomaly_detections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- approval_workflows: Admins can manage workflows
DROP POLICY IF EXISTS "Admins can manage workflows" ON approval_workflows;
CREATE POLICY "Admins can manage workflows"
  ON approval_workflows FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- approval_workflows: Managers can view workflows
DROP POLICY IF EXISTS "Managers can view workflows" ON approval_workflows;
CREATE POLICY "Managers can view workflows"
  ON approval_workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- capital_approvals: Executives can manage capital approvals
DROP POLICY IF EXISTS "Executives can manage capital approvals" ON capital_approvals;
CREATE POLICY "Executives can manage capital approvals"
  ON capital_approvals FOR ALL
  TO authenticated
  USING (
    approver_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- investment_approvals: Executives can manage investment approvals
DROP POLICY IF EXISTS "Executives can manage investment approvals" ON investment_approvals;
CREATE POLICY "Executives can manage investment approvals"
  ON investment_approvals FOR ALL
  TO authenticated
  USING (
    approver_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );
