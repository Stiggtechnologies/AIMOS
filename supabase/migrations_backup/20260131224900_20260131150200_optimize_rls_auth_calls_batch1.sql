/*
  # Optimize RLS Auth Function Calls - Batch 1

  ## Summary
  Optimizes RLS policies to prevent re-evaluation of auth functions for each row.
  Changes direct auth.uid() calls to (SELECT auth.uid()) pattern for better performance.

  ## Tables Updated
  - analytics_report_executions
  - approval_workflow_steps
  - approval_workflows
  - audit_events
  - authority_delegations
  - cadence_executions
  - cash_flow_forecasts
  - clinic_launches
  - evidence_authorities
  - evidence_syntheses
  - excellence_baselines
  - feature_access_log
  - feature_flags
  - financial_alerts
  - financial_budgets

  ## Performance Impact
  - Auth functions evaluated once per query instead of once per row
  - Significant improvement for queries returning many rows
  - Reduces database CPU usage

  ## Notes
  - Policies are dropped and recreated with optimized auth patterns
  - Logic remains identical, only auth.uid() → (SELECT auth.uid())
*/

-- analytics_report_executions
DROP POLICY IF EXISTS "Authenticated users can insert executions" ON public.analytics_report_executions;
CREATE POLICY "Authenticated users can insert executions"
  ON public.analytics_report_executions
  FOR INSERT
  TO authenticated
  WITH CHECK ((executed_by IS NULL) OR (executed_by = (SELECT auth.uid())));

-- approval_workflow_steps
DROP POLICY IF EXISTS "Executives can manage approval workflow steps" ON public.approval_workflow_steps;
CREATE POLICY "Executives can manage approval workflow steps"
  ON public.approval_workflow_steps
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = 'executive'::user_role
  ));

DROP POLICY IF EXISTS "Executives can view approval workflow steps" ON public.approval_workflow_steps;
CREATE POLICY "Executives can view approval workflow steps"
  ON public.approval_workflow_steps
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = 'executive'::user_role
  ));

-- approval_workflows
DROP POLICY IF EXISTS "Executives can view approval workflows" ON public.approval_workflows;
CREATE POLICY "Executives can view approval workflows"
  ON public.approval_workflows
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = 'executive'::user_role
  ));

-- audit_events
DROP POLICY IF EXISTS "Admins and executives can view all audit events" ON public.audit_events;
CREATE POLICY "Admins and executives can view all audit events"
  ON public.audit_events
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['admin'::user_role, 'executive'::user_role])
  ));

-- authority_delegations
DROP POLICY IF EXISTS "Users can view their delegations" ON public.authority_delegations;
CREATE POLICY "Users can view their delegations"
  ON public.authority_delegations
  FOR SELECT
  TO authenticated
  USING (
    (from_user_id = (SELECT auth.uid()))
    OR (to_user_id = (SELECT auth.uid()))
    OR ((auth.jwt() ->> 'role'::text) = 'admin'::text)
  );

-- cadence_executions
DROP POLICY IF EXISTS "Managers can insert own executions" ON public.cadence_executions;
CREATE POLICY "Managers can insert own executions"
  ON public.cadence_executions
  FOR INSERT
  TO authenticated
  WITH CHECK (manager_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Managers can update own executions" ON public.cadence_executions;
CREATE POLICY "Managers can update own executions"
  ON public.cadence_executions
  FOR UPDATE
  TO authenticated
  USING (manager_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Managers can view own executions" ON public.cadence_executions;
CREATE POLICY "Managers can view own executions"
  ON public.cadence_executions
  FOR SELECT
  TO authenticated
  USING (
    (manager_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role = 'admin'::user_role
    )
  );

-- cash_flow_forecasts
DROP POLICY IF EXISTS "Users can view cash forecasts for their clinics" ON public.cash_flow_forecasts;
CREATE POLICY "Users can view cash forecasts for their clinics"
  ON public.cash_flow_forecasts
  FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT clinic_access.clinic_id
    FROM clinic_access
    WHERE clinic_access.user_id = (SELECT auth.uid())
  ));

-- clinic_launches
DROP POLICY IF EXISTS "Admins can create launches" ON public.clinic_launches;
CREATE POLICY "Admins can create launches"
  ON public.clinic_launches
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = ANY (ARRAY['executive'::user_role, 'admin'::user_role])
  ));

-- evidence_authorities
DROP POLICY IF EXISTS "Admins can delete evidence authorities" ON public.evidence_authorities;
CREATE POLICY "Admins can delete evidence authorities"
  ON public.evidence_authorities
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = 'admin'::user_role
  ));

DROP POLICY IF EXISTS "Admins can insert evidence authorities" ON public.evidence_authorities;
CREATE POLICY "Admins can insert evidence authorities"
  ON public.evidence_authorities
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = 'admin'::user_role
  ));

DROP POLICY IF EXISTS "Admins can manage all authorities" ON public.evidence_authorities;
CREATE POLICY "Admins can manage all authorities"
  ON public.evidence_authorities
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = 'admin'::user_role
  ));

DROP POLICY IF EXISTS "Admins can update evidence authorities" ON public.evidence_authorities;
CREATE POLICY "Admins can update evidence authorities"
  ON public.evidence_authorities
  FOR UPDATE
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

-- evidence_syntheses
DROP POLICY IF EXISTS "Authenticated users can view published syntheses" ON public.evidence_syntheses;
CREATE POLICY "Authenticated users can view published syntheses"
  ON public.evidence_syntheses
  FOR SELECT
  TO authenticated
  USING (
    (status = 'published'::text)
    OR (query_by = (SELECT auth.uid()))
  );

-- excellence_baselines
DROP POLICY IF EXISTS "Admin can manage baselines" ON public.excellence_baselines;
CREATE POLICY "Admin can manage baselines"
  ON public.excellence_baselines
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = (SELECT auth.uid())
    AND user_profiles.role = 'admin'::user_role
  ));

-- feature_access_log
DROP POLICY IF EXISTS "Authenticated users can insert feature access logs" ON public.feature_access_log;
CREATE POLICY "Authenticated users can insert feature access logs"
  ON public.feature_access_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- feature_flags
DROP POLICY IF EXISTS "Only admins can manage feature flags" ON public.feature_flags;
CREATE POLICY "Only admins can manage feature flags"
  ON public.feature_flags
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

-- financial_alerts
DROP POLICY IF EXISTS "Users can view financial alerts for their clinics" ON public.financial_alerts;
CREATE POLICY "Users can view financial alerts for their clinics"
  ON public.financial_alerts
  FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT clinic_access.clinic_id
    FROM clinic_access
    WHERE clinic_access.user_id = (SELECT auth.uid())
  ));

-- financial_budgets
DROP POLICY IF EXISTS "Users can view budgets for their clinics" ON public.financial_budgets;
CREATE POLICY "Users can view budgets for their clinics"
  ON public.financial_budgets
  FOR SELECT
  TO authenticated
  USING (clinic_id IN (
    SELECT clinic_access.clinic_id
    FROM clinic_access
    WHERE clinic_access.user_id = (SELECT auth.uid())
  ));
