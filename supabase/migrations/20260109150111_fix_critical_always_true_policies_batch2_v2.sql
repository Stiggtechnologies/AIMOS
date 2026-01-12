/*
  # Fix Critical "Always True" RLS Policies - Batch 2 V2

  ## Security Issue
  Continues fixing tables with "always true" RLS policies that bypass security.
  
  ## Changes
  
  ### Talent Acquisition Tables:
  - applications: Job applications
  - candidates: Candidate records
  - interviews: Interview records
  - offers: Job offers
  - jobs: Job postings (using correct enum value 'active')
  - reference_checks: Reference verification
  - sourcing_channels: Recruitment channels
  
  ### System Tables:
  - kpis: KPI tracking
  - forecasts: Forecast data
  
  ## Security Impact
  Restricts access to talent acquisition data based on user roles.
*/

-- ===================================================================
-- APPLICATIONS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can insert applications" ON applications;
DROP POLICY IF EXISTS "Authenticated users can update applications" ON applications;
DROP POLICY IF EXISTS "Authenticated users can view applications" ON applications;

CREATE POLICY "Recruiters manage applications"
ON applications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

CREATE POLICY "Recruiters view applications"
ON applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- CANDIDATES
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON candidates;
DROP POLICY IF EXISTS "Authenticated users can view candidates" ON candidates;

CREATE POLICY "Recruiters manage candidates"
ON candidates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

CREATE POLICY "Recruiters view candidates"
ON candidates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- INTERVIEWS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage interviews" ON interviews;
DROP POLICY IF EXISTS "Authenticated users can view interviews" ON interviews;

CREATE POLICY "Recruiters manage interviews"
ON interviews
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

CREATE POLICY "Recruiters view interviews"
ON interviews
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- OFFERS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage offers" ON offers;
DROP POLICY IF EXISTS "Authenticated users can view offers" ON offers;

CREATE POLICY "Recruiters manage offers"
ON offers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

CREATE POLICY "Recruiters view offers"
ON offers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- JOBS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can delete jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can update jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can view jobs" ON jobs;

CREATE POLICY "Recruiters manage jobs"
ON jobs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

CREATE POLICY "Users view active jobs"
ON jobs
FOR SELECT
TO authenticated
USING (status = 'active'::job_status);

-- ===================================================================
-- REFERENCE_CHECKS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage reference_checks" ON reference_checks;
DROP POLICY IF EXISTS "Authenticated users can view reference_checks" ON reference_checks;

CREATE POLICY "Recruiters manage reference checks"
ON reference_checks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

CREATE POLICY "Recruiters view reference checks"
ON reference_checks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- SOURCING_CHANNELS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can manage sourcing_channels" ON sourcing_channels;
DROP POLICY IF EXISTS "Authenticated users can view sourcing_channels" ON sourcing_channels;

CREATE POLICY "Admins manage sourcing channels"
ON sourcing_channels
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Users view sourcing channels"
ON sourcing_channels
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- KPIS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can insert kpis" ON kpis;
DROP POLICY IF EXISTS "Authenticated users can view kpis" ON kpis;

CREATE POLICY "System insert kpis"
ON kpis
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Users view kpis"
ON kpis
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);

-- ===================================================================
-- FORECASTS
-- ===================================================================

DROP POLICY IF EXISTS "Authenticated users can insert forecasts" ON forecasts;
DROP POLICY IF EXISTS "Authenticated users can view forecasts" ON forecasts;

CREATE POLICY "System insert forecasts"
ON forecasts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  )
);

CREATE POLICY "Users view forecasts"
ON forecasts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  )
);
