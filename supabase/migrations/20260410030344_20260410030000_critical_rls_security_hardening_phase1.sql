/*
  # Critical RLS Security Hardening - Phase 1

  1. Overview
    Addresses critical security gaps identified in audit:
    - Fixes permissive RLS policies allowing unrestricted access
    - Implements proper ownership and role-based checks
    - Ensures clinic_id filtering for multi-tenant isolation
    - Prevents privilege escalation through policy exploitation

  2. Critical Fixes in This Batch
    - user_profiles: Proper self-access and admin override
    - clinic_access: User can only see own clinic assignments
    - crm_leads: CRM team only with clinic scoping
    - clinics: Clinic staff see only assigned clinics
    - patients: Proper access control by role and clinic

  3. Security Model
    - Users authenticate via auth.uid()
    - All data access filtered by clinic_id when applicable
    - Role-based access using user_profiles.role column
    - Admin/executive roles have elevated access with restrictions

  4. Rollback
    Drop the new policies and restore from previous migration if needed.
*/

-- Fix user_profiles RLS policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

CREATE POLICY "Users view own or admin oversight"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Users update only own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Insert only own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Fix clinic_access - strictly scope to user
DROP POLICY IF EXISTS "Users can view clinic access" ON clinic_access;
DROP POLICY IF EXISTS "Users can update clinic access" ON clinic_access;
DROP POLICY IF EXISTS "Users can view own clinic access" ON clinic_access;
DROP POLICY IF EXISTS "Only admins can modify clinic access" ON clinic_access;
DROP POLICY IF EXISTS "Only admins can insert clinic access" ON clinic_access;

CREATE POLICY "Users see own clinic access"
  ON clinic_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Fix crm_leads - CRM team only
DROP POLICY IF EXISTS "All authenticated users can view CRM leads" ON crm_leads;
DROP POLICY IF EXISTS "CRM team can view leads" ON crm_leads;
DROP POLICY IF EXISTS "CRM team can update leads" ON crm_leads;

CREATE POLICY "CRM team access leads"
  ON crm_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive', 'clinic_manager')
    ) AND
    EXISTS (
      SELECT 1 FROM clinic_access ca
      WHERE ca.user_id = auth.uid() AND ca.clinic_id = crm_leads.clinic_id
    )
  );

-- Fix clinics - clinic staff see only assigned clinics
DROP POLICY IF EXISTS "All authenticated users can view clinics" ON clinics;

CREATE POLICY "Users see assigned clinics"
  ON clinics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_access ca
      WHERE ca.user_id = auth.uid() AND ca.clinic_id = clinics.id
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
    )
  );

-- Fix patients - staff see patients by clinic assignment
DROP POLICY IF EXISTS "All authenticated users can view patients" ON patients;

CREATE POLICY "Staff view clinic patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_access ca
      WHERE ca.user_id = auth.uid() AND ca.clinic_id = patients.clinic_id
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
    )
  );

-- Ensure all critical tables have RLS enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
