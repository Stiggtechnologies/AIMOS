/*
  # Fix RLS Auth Performance - SOP and Forms Tables (Batch 3)

  1. Changes
    - Replace `auth.uid()` with `(SELECT auth.uid())` in RLS policies to cache auth function results
    - Fixes RLS performance issues across 7 tables with 10 policies total
    
  2. Tables Updated
    - sop_categories (1 policy)
    - sops (2 policies)
    - sop_versions (1 policy)
    - sop_reviews (1 policy)
    - form_fields (1 policy)
    - form_submissions (2 policies)
    - form_field_responses (2 policies)
    
  3. Security
    - All policies maintain existing access control logic
    - Only performance optimization applied
*/

-- sop_categories: Managers can manage categories
DROP POLICY IF EXISTS "Managers can manage categories" ON sop_categories;
CREATE POLICY "Managers can manage categories"
  ON sop_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- sops: Managers can manage SOPs
DROP POLICY IF EXISTS "Managers can manage SOPs" ON sops;
CREATE POLICY "Managers can manage SOPs"
  ON sops FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- sops: Users can view approved SOPs
DROP POLICY IF EXISTS "Users can view published SOPs" ON sops;
CREATE POLICY "Users can view published SOPs"
  ON sops FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- sop_versions: Managers can manage versions
DROP POLICY IF EXISTS "Managers can manage versions" ON sop_versions;
CREATE POLICY "Managers can manage versions"
  ON sop_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- sop_reviews: Users can create reviews
DROP POLICY IF EXISTS "Users can create reviews" ON sop_reviews;
CREATE POLICY "Users can create reviews"
  ON sop_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
  );

-- form_fields: Managers can manage form fields
DROP POLICY IF EXISTS "Managers can manage form fields" ON form_fields;
CREATE POLICY "Managers can manage form fields"
  ON form_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- form_submissions: Users can create submissions
DROP POLICY IF EXISTS "Users can create submissions" ON form_submissions;
CREATE POLICY "Users can create submissions"
  ON form_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = (SELECT auth.uid())
  );

-- form_submissions: Users can view own submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON form_submissions;
CREATE POLICY "Users can view own submissions"
  ON form_submissions FOR SELECT
  TO authenticated
  USING (
    submitted_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- form_field_responses: Users can create responses
DROP POLICY IF EXISTS "Users can create responses" ON form_field_responses;
CREATE POLICY "Users can create responses"
  ON form_field_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    submission_id IN (
      SELECT form_submissions.id
      FROM form_submissions
      WHERE form_submissions.submitted_by = (SELECT auth.uid())
    )
  );

-- form_field_responses: Users can view own responses
DROP POLICY IF EXISTS "Users can view own responses" ON form_field_responses;
CREATE POLICY "Users can view own responses"
  ON form_field_responses FOR SELECT
  TO authenticated
  USING (
    submission_id IN (
      SELECT form_submissions.id
      FROM form_submissions
      WHERE form_submissions.submitted_by = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );
