/*
  # Optimize RLS Auth Calls - Batch 4: Remaining Tables

  This migration optimizes RLS policies to evaluate auth.uid() once per query instead of per row.
  
  ## Changes
  
  ### Analytics Tables
  - analytics_report_definitions: Wrap auth.uid() in SELECT for INSERT policy
  - analytics_scheduled_reports: Wrap auth.uid() in SELECT for INSERT policy
  
  ### Audit Tables
  - audit_log_immutable: Wrap auth.uid() in SELECT for user check
  
  ### Launch Tables  
  - clinic_launches: Wrap auth.uid() in SELECT for owner/sponsor checks
  
  ### Form Tables
  - form_submissions: Wrap auth.uid() in SELECT for all user policies
  
  ### Operations Tables
  - ops_credential_verifications: Wrap auth.uid() in SELECT for verified_by check
  
  ### Feature Tables
  - feature_access_log: Wrap auth.uid() in SELECT for user check
  
  ## Performance Impact
  These optimizations prevent auth.uid() from being re-evaluated for each row.
*/

-- ===================================================================
-- ANALYTICS_REPORT_DEFINITIONS
-- ===================================================================

DROP POLICY IF EXISTS "Users can create reports" ON analytics_report_definitions;
CREATE POLICY "Users can create reports"
ON analytics_report_definitions
FOR INSERT
TO authenticated
WITH CHECK (created_by = (SELECT auth.uid()));

-- ===================================================================
-- ANALYTICS_SCHEDULED_REPORTS
-- ===================================================================

DROP POLICY IF EXISTS "Users can create scheduled reports" ON analytics_scheduled_reports;
CREATE POLICY "Users can create scheduled reports"
ON analytics_scheduled_reports
FOR INSERT
TO authenticated
WITH CHECK (created_by = (SELECT auth.uid()));

-- ===================================================================
-- AUDIT_LOG_IMMUTABLE
-- ===================================================================

DROP POLICY IF EXISTS "Users read own audit logs" ON audit_log_immutable;
CREATE POLICY "Users read own audit logs"
ON audit_log_immutable
FOR SELECT
TO authenticated
USING (
  (user_id = (SELECT auth.uid())) OR 
  (EXISTS ( 
    SELECT 1
    FROM user_profiles
    WHERE (
      (user_profiles.id = (SELECT auth.uid())) AND 
      (user_profiles.role = ANY (ARRAY['admin'::user_role, 'executive'::user_role]))
    )
  ))
);

-- ===================================================================
-- CLINIC_LAUNCHES
-- ===================================================================

DROP POLICY IF EXISTS "Launch owners can update launches" ON clinic_launches;
CREATE POLICY "Launch owners can update launches"
ON clinic_launches
FOR UPDATE
TO authenticated
USING ((launch_owner_id = (SELECT auth.uid())) OR (executive_sponsor_id = (SELECT auth.uid())))
WITH CHECK ((launch_owner_id = (SELECT auth.uid())) OR (executive_sponsor_id = (SELECT auth.uid())));

-- ===================================================================
-- FORM_SUBMISSIONS
-- ===================================================================

DROP POLICY IF EXISTS "Users can create submissions" ON form_submissions;
CREATE POLICY "Users can create submissions"
ON form_submissions
FOR INSERT
TO authenticated
WITH CHECK (submitted_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own draft submissions" ON form_submissions;
CREATE POLICY "Users can update own draft submissions"
ON form_submissions
FOR UPDATE
TO authenticated
USING ((submitted_by = (SELECT auth.uid())) AND (status = 'draft'::submission_status))
WITH CHECK (submitted_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own submissions" ON form_submissions;
CREATE POLICY "Users can view own submissions"
ON form_submissions
FOR SELECT
TO authenticated
USING (submitted_by = (SELECT auth.uid()));

-- ===================================================================
-- OPS_CREDENTIAL_VERIFICATIONS
-- ===================================================================

DROP POLICY IF EXISTS "Managers can create credential verifications" ON ops_credential_verifications;
CREATE POLICY "Managers can create credential verifications"
ON ops_credential_verifications
FOR INSERT
TO public
WITH CHECK (
  (verified_by = (SELECT auth.uid())) AND 
  (EXISTS ( 
    SELECT 1
    FROM user_profiles
    WHERE (
      (user_profiles.id = (SELECT auth.uid())) AND 
      (user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role]))
    )
  ))
);

-- ===================================================================
-- FEATURE_ACCESS_LOG
-- ===================================================================

DROP POLICY IF EXISTS "Users can view own feature access" ON feature_access_log;
CREATE POLICY "Users can view own feature access"
ON feature_access_log
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));
