/*
  # Fix RLS Auth Performance - Partner and Patient Tables (Batch 5)

  1. Changes
    - Replace `auth.uid()` with `(SELECT auth.uid())` in RLS policies to cache auth function results
    - Fixes RLS performance issues across 13 tables with 17 policies total
    
  2. Tables Updated
    - partner_revenue_share (1 policy)
    - partner_conversions (1 policy)
    - partner_dashboard_metrics (1 policy)
    - partner_clinics (2 policies)
    - partner_facility_access_log (1 policy)
    - patient_documents (2 policies)
    - patient_access_logs (1 policy)
    - patient_appointments (1 policy)
    - patient_communications (1 policy)
    - patient_messages (2 policies)
    - patient_medical_history (1 policy)
    - patient_treatment_plans (1 policy)
    - patient_goals (2 policies)
    
  3. Security
    - All policies maintain existing access control logic
    - Only performance optimization applied
*/

-- partner_revenue_share: Managers can view revenue share
DROP POLICY IF EXISTS "Partners can view own revenue" ON partner_revenue_share;
CREATE POLICY "Partners can view own revenue"
  ON partner_revenue_share FOR SELECT
  TO authenticated
  USING (
    partner_clinic_id IN (
      SELECT partner_clinics.id
      FROM partner_clinics
      WHERE partner_clinics.clinic_id IN (
        SELECT clinic_access.clinic_id
        FROM clinic_access
        WHERE clinic_access.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- partner_conversions: Managers can view conversions
DROP POLICY IF EXISTS "Partners can view own conversions" ON partner_conversions;
CREATE POLICY "Partners can view own conversions"
  ON partner_conversions FOR SELECT
  TO authenticated
  USING (
    partner_clinic_id IN (
      SELECT partner_clinics.id
      FROM partner_clinics
      WHERE partner_clinics.clinic_id IN (
        SELECT clinic_access.clinic_id
        FROM clinic_access
        WHERE clinic_access.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- partner_dashboard_metrics: Managers can view metrics
DROP POLICY IF EXISTS "Partners can view own metrics" ON partner_dashboard_metrics;
CREATE POLICY "Partners can view own metrics"
  ON partner_dashboard_metrics FOR SELECT
  TO authenticated
  USING (
    partner_clinic_id IN (
      SELECT partner_clinics.id
      FROM partner_clinics
      WHERE partner_clinics.clinic_id IN (
        SELECT clinic_access.clinic_id
        FROM clinic_access
        WHERE clinic_access.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- partner_clinics: Managers can view partner clinics
DROP POLICY IF EXISTS "Partners can view own clinics" ON partner_clinics;
CREATE POLICY "Partners can view own clinics"
  ON partner_clinics FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- partner_clinics: Admins can manage partner clinics
DROP POLICY IF EXISTS "Admins can manage partner clinics" ON partner_clinics;
CREATE POLICY "Admins can manage partner clinics"
  ON partner_clinics FOR ALL
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

-- partner_facility_access_log: Managers can view facility access logs
DROP POLICY IF EXISTS "Partners can view own access logs" ON partner_facility_access_log;
CREATE POLICY "Partners can view own access logs"
  ON partner_facility_access_log FOR SELECT
  TO authenticated
  USING (
    partner_clinic_id IN (
      SELECT partner_clinics.id
      FROM partner_clinics
      WHERE partner_clinics.clinic_id IN (
        SELECT clinic_access.clinic_id
        FROM clinic_access
        WHERE clinic_access.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- patient_documents: Clinicians can view patient documents
DROP POLICY IF EXISTS "Clinicians can view patient documents" ON patient_documents;
CREATE POLICY "Clinicians can view patient documents"
  ON patient_documents FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- patient_documents: Clinicians can upload documents
DROP POLICY IF EXISTS "Clinicians can upload documents" ON patient_documents;
CREATE POLICY "Clinicians can upload documents"
  ON patient_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = (SELECT auth.uid())
    AND patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
  );

-- patient_access_logs: Admins can view access logs
DROP POLICY IF EXISTS "Admins can view access logs" ON patient_access_logs;
CREATE POLICY "Admins can view access logs"
  ON patient_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- patient_appointments: Clinicians can view assigned appointments
DROP POLICY IF EXISTS "Clinicians can view assigned appointments" ON patient_appointments;
CREATE POLICY "Clinicians can view assigned appointments"
  ON patient_appointments FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- patient_communications: Clinicians can view patient communications
DROP POLICY IF EXISTS "Clinicians can view patient communications" ON patient_communications;
CREATE POLICY "Clinicians can view patient communications"
  ON patient_communications FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- patient_messages: Clinicians can view patient messages
DROP POLICY IF EXISTS "Clinicians can view patient messages" ON patient_messages;
CREATE POLICY "Clinicians can view patient messages"
  ON patient_messages FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- patient_messages: Clinicians can send messages
DROP POLICY IF EXISTS "Clinicians can send messages" ON patient_messages;
CREATE POLICY "Clinicians can send messages"
  ON patient_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
  );

-- patient_medical_history: Clinicians can view medical history
DROP POLICY IF EXISTS "Clinicians can view medical history" ON patient_medical_history;
CREATE POLICY "Clinicians can view medical history"
  ON patient_medical_history FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- patient_treatment_plans: Clinicians can view treatment plans
DROP POLICY IF EXISTS "Clinicians can view treatment plans" ON patient_treatment_plans;
CREATE POLICY "Clinicians can view treatment plans"
  ON patient_treatment_plans FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- patient_goals: Clinicians can view patient goals
DROP POLICY IF EXISTS "Clinicians can view patient goals" ON patient_goals;
CREATE POLICY "Clinicians can view patient goals"
  ON patient_goals FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- patient_goals: Clinicians can create goals
DROP POLICY IF EXISTS "Clinicians can create goals" ON patient_goals;
CREATE POLICY "Clinicians can create goals"
  ON patient_goals FOR INSERT
  TO authenticated
  WITH CHECK (
    set_by = (SELECT auth.uid())
    AND patient_id IN (
      SELECT patient_assignments.patient_id
      FROM patient_assignments
      WHERE patient_assignments.clinician_id IN (
        SELECT staff_profiles.id
        FROM staff_profiles
        WHERE staff_profiles.user_id = (SELECT auth.uid())
      )
    )
  );
