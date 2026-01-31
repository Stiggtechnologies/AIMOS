/*
  # Optimize RLS Auth Function Calls - Batch 2

  ## Summary
  Optimizes additional RLS policies to prevent re-evaluation of auth functions for each row.

  ## Tables Updated
  - research_queries
  - research_sources
  - resolution_tracking
  - role_permissions
  - root_cause_analyses
  - saved_filters
  - scheduler_approvals
  - scheduler_audit_log
  - scheduler_execution_log
  - scheduler_insight_dismissals
  - scheduler_insight_preferences
  - scheduler_insight_snooze
  - scheduler_recommendations
  - search_history
  - service_line_performance

  ## Performance Impact
  - Auth functions evaluated once per query instead of once per row
  - Critical for frequently accessed tables like user_profiles and scheduler tables

  ## Notes
  - Policies dropped and recreated with (SELECT auth.uid()) pattern
  - Logic remains identical
*/

-- research_queries
DROP POLICY IF EXISTS "Users can update own queries" ON public.research_queries;
CREATE POLICY "Users can update own queries"
  ON public.research_queries
  FOR UPDATE
  TO authenticated
  USING (requested_by = (SELECT auth.uid()))
  WITH CHECK (requested_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own queries" ON public.research_queries;
CREATE POLICY "Users can view own queries"
  ON public.research_queries
  FOR SELECT
  TO authenticated
  USING ((requested_by = (SELECT auth.uid())) OR true);

-- research_sources
DROP POLICY IF EXISTS "Authenticated users can view approved sources" ON public.research_sources;
CREATE POLICY "Authenticated users can view approved sources"
  ON public.research_sources
  FOR SELECT
  TO authenticated
  USING (
    (approved = true)
    OR ((SELECT auth.uid()) IN (SELECT users.id FROM auth.users))
  );

-- resolution_tracking
DROP POLICY IF EXISTS "Assigned users can view resolutions" ON public.resolution_tracking;
CREATE POLICY "Assigned users can view resolutions"
  ON public.resolution_tracking
  FOR SELECT
  TO authenticated
  USING (
    (assigned_to = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM root_cause_analyses rca
      WHERE rca.id = resolution_tracking.analysis_id
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = (SELECT auth.uid())
        AND user_profiles.role = 'admin'::user_role
      )
    )
  );

-- role_permissions
DROP POLICY IF EXISTS "Only admins can manage permissions" ON public.role_permissions;
CREATE POLICY "Only admins can manage permissions"
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = 'admin'::user_role
  ));

-- root_cause_analyses
DROP POLICY IF EXISTS "Clinic staff can view own analyses" ON public.root_cause_analyses;
CREATE POLICY "Clinic staff can view own analyses"
  ON public.root_cause_analyses
  FOR SELECT
  TO authenticated
  USING (
    (clinic_id IN (
      SELECT root_cause_analyses.clinic_id
      FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
    ))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role = 'admin'::user_role
    )
  );

-- saved_filters
DROP POLICY IF EXISTS "Users can create own filters" ON public.saved_filters;
CREATE POLICY "Users can create own filters"
  ON public.saved_filters
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- scheduler_approvals
DROP POLICY IF EXISTS "Authorized staff can approve" ON public.scheduler_approvals;
CREATE POLICY "Authorized staff can approve"
  ON public.scheduler_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (clinic_id IN (
      SELECT scheduler_approvals.clinic_id
      FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
    ))
    AND (approver_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Staff can view approvals for their clinic" ON public.scheduler_approvals;
CREATE POLICY "Staff can view approvals for their clinic"
  ON public.scheduler_approvals
  FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT scheduler_approvals.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ));

-- scheduler_audit_log
DROP POLICY IF EXISTS "Staff can view audit logs for their clinic" ON public.scheduler_audit_log;
CREATE POLICY "Staff can view audit logs for their clinic"
  ON public.scheduler_audit_log
  FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT scheduler_audit_log.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "System can append to audit log" ON public.scheduler_audit_log;
CREATE POLICY "System can append to audit log"
  ON public.scheduler_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (
    SELECT scheduler_audit_log.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ));

-- scheduler_execution_log
DROP POLICY IF EXISTS "Staff can view execution logs for their clinic" ON public.scheduler_execution_log;
CREATE POLICY "Staff can view execution logs for their clinic"
  ON public.scheduler_execution_log
  FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT scheduler_execution_log.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "System can log executions" ON public.scheduler_execution_log;
CREATE POLICY "System can log executions"
  ON public.scheduler_execution_log
  FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (
    SELECT scheduler_execution_log.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ));

-- scheduler_insight_dismissals
DROP POLICY IF EXISTS "Users can dismiss insights" ON public.scheduler_insight_dismissals;
CREATE POLICY "Users can dismiss insights"
  ON public.scheduler_insight_dismissals
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can undismiss insights" ON public.scheduler_insight_dismissals;
CREATE POLICY "Users can undismiss insights"
  ON public.scheduler_insight_dismissals
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own dismissed insights" ON public.scheduler_insight_dismissals;
CREATE POLICY "Users can view own dismissed insights"
  ON public.scheduler_insight_dismissals
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- scheduler_insight_preferences
DROP POLICY IF EXISTS "Users can create own preferences" ON public.scheduler_insight_preferences;
CREATE POLICY "Users can create own preferences"
  ON public.scheduler_insight_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.scheduler_insight_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.scheduler_insight_preferences
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own preferences" ON public.scheduler_insight_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.scheduler_insight_preferences
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- scheduler_insight_snooze
DROP POLICY IF EXISTS "Users can snooze insights" ON public.scheduler_insight_snooze;
CREATE POLICY "Users can snooze insights"
  ON public.scheduler_insight_snooze
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unsnooze insights" ON public.scheduler_insight_snooze;
CREATE POLICY "Users can unsnooze insights"
  ON public.scheduler_insight_snooze
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own snoozed insights" ON public.scheduler_insight_snooze;
CREATE POLICY "Users can view own snoozed insights"
  ON public.scheduler_insight_snooze
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- scheduler_recommendations
DROP POLICY IF EXISTS "Approvers can update recommendations" ON public.scheduler_recommendations;
CREATE POLICY "Approvers can update recommendations"
  ON public.scheduler_recommendations
  FOR UPDATE
  TO authenticated
  USING (clinic_id IN (
    SELECT scheduler_recommendations.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ))
  WITH CHECK (clinic_id IN (
    SELECT scheduler_recommendations.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Staff can view recommendations for their clinic" ON public.scheduler_recommendations;
CREATE POLICY "Staff can view recommendations for their clinic"
  ON public.scheduler_recommendations
  FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT scheduler_recommendations.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "System can create recommendations" ON public.scheduler_recommendations;
CREATE POLICY "System can create recommendations"
  ON public.scheduler_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (clinic_id IN (
    SELECT scheduler_recommendations.clinic_id
    FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
  ));

-- search_history
DROP POLICY IF EXISTS "Users can create own search history" ON public.search_history;
CREATE POLICY "Users can create own search history"
  ON public.search_history
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own search history" ON public.search_history;
CREATE POLICY "Users can delete own search history"
  ON public.search_history
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
CREATE POLICY "Users can view own search history"
  ON public.search_history
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- service_line_performance
DROP POLICY IF EXISTS "Users can view service performance for their clinics" ON public.service_line_performance;
CREATE POLICY "Users can view service performance for their clinics"
  ON public.service_line_performance
  FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT clinic_access.clinic_id
    FROM clinic_access
    WHERE clinic_access.user_id = (SELECT auth.uid())
  ));
