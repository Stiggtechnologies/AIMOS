/*
  # Fix RLS Auth Performance Issues - Comprehensive Fix
  
  1. Performance Optimization
    - Replace bare `auth.uid()` with `(select auth.uid())` in RLS policies
    - This caches the auth function result instead of re-evaluating per row
    - Significantly improves query performance at scale
    
  2. Strategy
    - Only update policies that have bare auth.uid() calls
    - Preserve policies that already use (select auth.uid())
    - Focus on the most performance-critical tables first
*/

-- workflow_executions: Remove duplicate policy
DROP POLICY IF EXISTS "Users can view workflow executions" ON workflow_executions;

-- ops_adverse_actions
DROP POLICY IF EXISTS "Managers can manage adverse actions" ON ops_adverse_actions;
CREATE POLICY "Managers can manage adverse actions"
  ON ops_adverse_actions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Managers can view all adverse actions" ON ops_adverse_actions;
CREATE POLICY "Managers can view all adverse actions"
  ON ops_adverse_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Staff can view own adverse actions" ON ops_adverse_actions;
CREATE POLICY "Staff can view own adverse actions"
  ON ops_adverse_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_adverse_actions.staff_id
      AND staff_profiles.user_id = (SELECT auth.uid())
    )
  );

-- ops_credential_alerts
DROP POLICY IF EXISTS "Managers can manage credential alerts" ON ops_credential_alerts;
CREATE POLICY "Managers can manage credential alerts"
  ON ops_credential_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Managers can view all credential alerts" ON ops_credential_alerts;
CREATE POLICY "Managers can view all credential alerts"
  ON ops_credential_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Staff can acknowledge own alerts" ON ops_credential_alerts;
CREATE POLICY "Staff can acknowledge own alerts"
  ON ops_credential_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_credential_alerts.staff_id
      AND staff_profiles.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_credential_alerts.staff_id
      AND staff_profiles.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Staff can view own credential alerts" ON ops_credential_alerts;
CREATE POLICY "Staff can view own credential alerts"
  ON ops_credential_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_credential_alerts.staff_id
      AND staff_profiles.user_id = (SELECT auth.uid())
    )
  );

-- ops_credential_types
DROP POLICY IF EXISTS "Admins can manage credential types" ON ops_credential_types;
CREATE POLICY "Admins can manage credential types"
  ON ops_credential_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- ops_credential_verifications
DROP POLICY IF EXISTS "Managers can view credential verifications" ON ops_credential_verifications;
CREATE POLICY "Managers can view credential verifications"
  ON ops_credential_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- ops_credentials
DROP POLICY IF EXISTS "Managers can manage credentials" ON ops_credentials;
CREATE POLICY "Managers can manage credentials"
  ON ops_credentials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Managers can view all credentials" ON ops_credentials;
CREATE POLICY "Managers can view all credentials"
  ON ops_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Staff can view own credentials" ON ops_credentials;
CREATE POLICY "Staff can view own credentials"
  ON ops_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_credentials.staff_id
      AND staff_profiles.user_id = (SELECT auth.uid())
    )
  );

-- ops_shift_swaps
DROP POLICY IF EXISTS "Managers can approve swap requests" ON ops_shift_swaps;
CREATE POLICY "Managers can approve swap requests"
  ON ops_shift_swaps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Staff can view own swap requests" ON ops_shift_swaps;
CREATE POLICY "Staff can view own swap requests"
  ON ops_shift_swaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE (staff_profiles.id = ops_shift_swaps.from_staff_id OR staff_profiles.id = ops_shift_swaps.to_staff_id)
      AND staff_profiles.user_id = (SELECT auth.uid())
    )
  );

-- ops_shifts
DROP POLICY IF EXISTS "Managers can manage shifts" ON ops_shifts;
CREATE POLICY "Managers can manage shifts"
  ON ops_shifts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- ops_staff_schedules
DROP POLICY IF EXISTS "Managers can manage clinic schedules" ON ops_staff_schedules;
CREATE POLICY "Managers can manage clinic schedules"
  ON ops_staff_schedules FOR ALL
  TO authenticated
  USING (
    (clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
      AND clinic_access.can_manage = true
    ))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

DROP POLICY IF EXISTS "Managers can view clinic schedules" ON ops_staff_schedules;
CREATE POLICY "Managers can view clinic schedules"
  ON ops_staff_schedules FOR SELECT
  TO authenticated
  USING (
    (clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
    ))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

DROP POLICY IF EXISTS "Staff can view own schedules" ON ops_staff_schedules;
CREATE POLICY "Staff can view own schedules"
  ON ops_staff_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_staff_schedules.staff_id
      AND staff_profiles.user_id = (SELECT auth.uid())
    )
  );

-- ops_time_off_requests
DROP POLICY IF EXISTS "Managers can view/approve time off requests" ON ops_time_off_requests;
CREATE POLICY "Managers can view/approve time off requests"
  ON ops_time_off_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Staff can view own time off requests" ON ops_time_off_requests;
CREATE POLICY "Staff can view own time off requests"
  ON ops_time_off_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = ops_time_off_requests.staff_id
      AND staff_profiles.user_id = (SELECT auth.uid())
    )
  );

-- ops_treatment_rooms
DROP POLICY IF EXISTS "Managers can manage treatment rooms" ON ops_treatment_rooms;
CREATE POLICY "Managers can manage treatment rooms"
  ON ops_treatment_rooms FOR ALL
  TO authenticated
  USING (
    (clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
      AND clinic_access.can_manage = true
    ))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can view treatment rooms" ON ops_treatment_rooms;
CREATE POLICY "Users can view treatment rooms"
  ON ops_treatment_rooms FOR SELECT
  TO authenticated
  USING (
    (clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
    ))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );
