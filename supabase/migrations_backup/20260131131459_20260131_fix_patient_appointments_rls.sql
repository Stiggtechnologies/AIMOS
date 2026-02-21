/*
  # Fix patient_appointments RLS policies

  1. Changes
    - Update RLS policies to properly check revoked_at IS NULL for active assignments
    - Simplify and fix the clinician visibility policy

  2. Security
    - Only active patient assignments (revoked_at IS NULL) grant access
    - Clinicians see appointments for their assigned patients
    - Staff see appointments at their clinics
*/

DROP POLICY IF EXISTS "Clinicians can view assigned appointments" ON patient_appointments;
DROP POLICY IF EXISTS "Staff can manage appointments at their clinics" ON patient_appointments;
DROP POLICY IF EXISTS "Staff can view appointments at their clinics" ON patient_appointments;

CREATE POLICY "Clinicians can view assigned appointments"
  ON patient_appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_assignments
      WHERE patient_assignments.patient_id = patient_appointments.patient_id
      AND patient_assignments.clinician_id IN (
        SELECT id FROM staff_profiles WHERE user_id = auth.uid()
      )
      AND patient_assignments.revoked_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Staff can view appointments at their clinics"
  ON patient_appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_access
      WHERE clinic_access.user_id = auth.uid()
      AND clinic_access.clinic_id = patient_appointments.clinic_id
      AND clinic_access.revoked_at IS NULL
    )
  );

CREATE POLICY "Staff can manage appointments at their clinics"
  ON patient_appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_access
      WHERE clinic_access.user_id = auth.uid()
      AND clinic_access.clinic_id = patient_appointments.clinic_id
      AND clinic_access.can_manage = true
      AND clinic_access.revoked_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_access
      WHERE clinic_access.user_id = auth.uid()
      AND clinic_access.clinic_id = patient_appointments.clinic_id
      AND clinic_access.can_manage = true
      AND clinic_access.revoked_at IS NULL
    )
  );
