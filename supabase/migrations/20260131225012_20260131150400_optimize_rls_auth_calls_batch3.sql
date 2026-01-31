/*
  # Optimize RLS Auth Function Calls - Batch 3

  ## Summary
  Optimizes additional RLS policies for frequently accessed tables.

  ## Tables Updated
  - sop_categories
  - sop_reviews
  - sop_versions
  - sops
  - staff_onboarding
  - step_prerequisites
  - user_dashboard_layouts
  - user_permission_overrides
  - user_profiles
  - write_back_permissions

  ## Performance Impact
  - Critical optimization for user_profiles table (heavily accessed)
  - Improves scheduler and SOP performance
  - Reduces database CPU usage significantly

  ## Notes
  - Policies dropped and recreated with (SELECT auth.uid()) pattern
*/

-- sop_categories
DROP POLICY IF EXISTS "Admins can manage SOP categories" ON public.sop_categories;
CREATE POLICY "Admins can manage SOP categories"
  ON public.sop_categories
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  ));

-- sop_reviews
DROP POLICY IF EXISTS "Managers can view all SOP reviews" ON public.sop_reviews;
CREATE POLICY "Managers can view all SOP reviews"
  ON public.sop_reviews
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
  ));

DROP POLICY IF EXISTS "Users can create SOP reviews" ON public.sop_reviews;
CREATE POLICY "Users can create SOP reviews"
  ON public.sop_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own SOP reviews" ON public.sop_reviews;
CREATE POLICY "Users can view own SOP reviews"
  ON public.sop_reviews
  FOR SELECT
  TO authenticated
  USING (reviewer_id = (SELECT auth.uid()));

-- sop_versions
DROP POLICY IF EXISTS "Owners and managers can create SOP versions" ON public.sop_versions;
CREATE POLICY "Owners and managers can create SOP versions"
  ON public.sop_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sops
    WHERE sops.id = sop_versions.sop_id
    AND (
      sops.owner_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = (SELECT auth.uid())
        AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
      )
    )
  ));

DROP POLICY IF EXISTS "Users can view SOP versions" ON public.sop_versions;
CREATE POLICY "Users can view SOP versions"
  ON public.sop_versions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sops
    WHERE sops.id = sop_versions.sop_id
    AND (
      sops.status = 'approved'::sop_status
      OR sops.owner_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = (SELECT auth.uid())
        AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role, 'clinic_manager'::user_role])
      )
    )
  ));

-- sops
DROP POLICY IF EXISTS "Users can view approved SOPs" ON public.sops;
CREATE POLICY "Users can view approved SOPs"
  ON public.sops
  FOR SELECT
  TO authenticated
  USING (
    (status = 'approved'::sop_status)
    AND (
      (applicable_roles = '[]'::jsonb)
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = (SELECT auth.uid())
        AND (user_profiles.role)::text IN (
          SELECT jsonb_array_elements_text(sops.applicable_roles)
        )
      )
    )
  );

-- staff_onboarding
DROP POLICY IF EXISTS "Staff can view own onboarding" ON public.staff_onboarding;
CREATE POLICY "Staff can view own onboarding"
  ON public.staff_onboarding
  FOR SELECT
  TO authenticated
  USING (
    (staff_id = (SELECT auth.uid()))
    OR ((auth.jwt() ->> 'role'::text) = 'admin'::text)
    OR ((auth.jwt() ->> 'role'::text) = 'manager'::text)
  );

-- step_prerequisites
DROP POLICY IF EXISTS "Staff and managers can view" ON public.step_prerequisites;
CREATE POLICY "Staff and managers can view"
  ON public.step_prerequisites
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM onboarding_steps os
    JOIN staff_onboarding so ON os.workflow_id = so.id
    WHERE os.id = step_prerequisites.step_id
    AND (
      so.staff_id = (SELECT auth.uid())
      OR ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'manager'::text]))
    )
  ));

-- user_dashboard_layouts
DROP POLICY IF EXISTS "Users can manage own dashboard layouts" ON public.user_dashboard_layouts;
CREATE POLICY "Users can manage own dashboard layouts"
  ON public.user_dashboard_layouts
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own dashboard layouts" ON public.user_dashboard_layouts;
CREATE POLICY "Users can view own dashboard layouts"
  ON public.user_dashboard_layouts
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- user_permission_overrides
DROP POLICY IF EXISTS "Users can view own permission overrides" ON public.user_permission_overrides;
CREATE POLICY "Users can view own permission overrides"
  ON public.user_permission_overrides
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- user_profiles (CRITICAL - heavily accessed table)
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.user_profiles;
CREATE POLICY "users_insert_own_profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
CREATE POLICY "users_update_own_profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "users_view_own_profile" ON public.user_profiles;
CREATE POLICY "users_view_own_profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- write_back_permissions
DROP POLICY IF EXISTS "Clinic managers can view permissions" ON public.write_back_permissions;
CREATE POLICY "Clinic managers can view permissions"
  ON public.write_back_permissions
  FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT write_back_permissions.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ));
