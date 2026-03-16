/*
  # Add Patient Self-Access RLS Policy
  
  1. Security Changes
    - Adds SELECT policy allowing patients to view their own record
    - Uses user_id column to match auth.uid()
    
  2. Purpose
    - Enables patient portal access to patient profile data
    - Patients can only see their own record, not other patients
*/

-- Allow patients to read their own patient record
CREATE POLICY "Patients can view own record"
  ON patients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow patients to update their own contact info
CREATE POLICY "Patients can update own contact info"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
