/*
  # Fix Patients RLS for Scheduler Access

  1. Purpose
    - Allow clinicians to view all patients at their assigned clinics
    - Enables scheduler to display appointments with patient names
    - Currently clinicians can only see patients they're directly assigned to

  2. Changes
    - Update SELECT policy on patients table
    - Allow clinic-based access for clinicians with clinic_access

  3. Impact
    - Scheduler will now display patient names in appointments
    - Clinicians can see all patients at their clinics (read-only in scheduler context)
*/

-- Drop the restrictive rbac_sel policy
DROP POLICY IF EXISTS "rbac_sel" ON patients;

-- Create a new policy that allows clinic-based access
CREATE POLICY "Staff at clinic can view patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (
    -- Executives and admins see all
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
    OR
    -- Staff with clinic access can see patients at that clinic
    user_has_clinic_access(clinic_id)
    OR
    -- Clinicians can see patients they're assigned to
    (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'clinician'
      )
      AND EXISTS (
        SELECT 1 FROM patient_assignments pa
        JOIN staff_profiles sp ON pa.clinician_id = sp.id
        WHERE sp.user_id = auth.uid()
        AND pa.patient_id = patients.id
      )
    )
  );
