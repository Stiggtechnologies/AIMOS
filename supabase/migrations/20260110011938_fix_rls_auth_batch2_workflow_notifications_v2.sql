/*
  # Fix RLS Auth Performance - Workflow, Notification, and Dashboard Tables (Batch 2)

  1. Changes
    - Replace `auth.uid()` with `(SELECT auth.uid())` in RLS policies to cache auth function results
    - Fixes RLS performance issues across 11 tables with 17 policies total
    
  2. Tables Updated
    - workflow_definitions (3 policies)
    - workflow_actions (2 policies)
    - notification_templates (1 policy)
    - notification_history (1 policy)
    - scheduled_tasks (2 policies)
    - task_execution_log (1 policy)
    - dashboard_widgets (2 policies)
    - user_dashboard_layouts (2 policies)
    - ops_case_aging_rules (1 policy)
    - ops_case_escalations (1 policy)
    - ops_cases (1 policy)
    
  3. Security
    - All policies maintain existing access control logic
    - Only performance optimization applied
*/

-- workflow_definitions: Managers can create clinic workflows
DROP POLICY IF EXISTS "Managers can create clinic workflows" ON workflow_definitions;
CREATE POLICY "Managers can create clinic workflows"
  ON workflow_definitions FOR INSERT
  TO authenticated
  WITH CHECK (
    (clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
      AND clinic_access.can_manage = true
    ))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- workflow_definitions: Managers can update workflows
DROP POLICY IF EXISTS "Managers can update workflows" ON workflow_definitions;
CREATE POLICY "Managers can update workflows"
  ON workflow_definitions FOR UPDATE
  TO authenticated
  USING (
    (clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
      AND clinic_access.can_manage = true
    ))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    (clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
      AND clinic_access.can_manage = true
    ))
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- workflow_definitions: Users can view clinic workflows
DROP POLICY IF EXISTS "Users can view clinic workflows" ON workflow_definitions;
CREATE POLICY "Users can view clinic workflows"
  ON workflow_definitions FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
    )
  );

-- workflow_actions: Users can view workflow actions
DROP POLICY IF EXISTS "Users can view workflow actions" ON workflow_actions;
CREATE POLICY "Users can view workflow actions"
  ON workflow_actions FOR SELECT
  TO authenticated
  USING (
    workflow_id IN (
      SELECT workflow_definitions.id
      FROM workflow_definitions
      WHERE workflow_definitions.clinic_id IN (
        SELECT clinic_access.clinic_id
        FROM clinic_access
        WHERE clinic_access.user_id = (SELECT auth.uid())
      )
    )
  );

-- workflow_actions: Managers can manage workflow actions
DROP POLICY IF EXISTS "Managers can manage workflow actions" ON workflow_actions;
CREATE POLICY "Managers can manage workflow actions"
  ON workflow_actions FOR ALL
  TO authenticated
  USING (
    workflow_id IN (
      SELECT workflow_definitions.id
      FROM workflow_definitions
      WHERE (workflow_definitions.clinic_id IN (
        SELECT clinic_access.clinic_id
        FROM clinic_access
        WHERE clinic_access.user_id = (SELECT auth.uid())
        AND clinic_access.can_manage = true
      ))
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = (SELECT auth.uid())
        AND user_profiles.role IN ('executive', 'admin')
      )
    )
  )
  WITH CHECK (
    workflow_id IN (
      SELECT workflow_definitions.id
      FROM workflow_definitions
      WHERE (workflow_definitions.clinic_id IN (
        SELECT clinic_access.clinic_id
        FROM clinic_access
        WHERE clinic_access.user_id = (SELECT auth.uid())
        AND clinic_access.can_manage = true
      ))
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = (SELECT auth.uid())
        AND user_profiles.role IN ('executive', 'admin')
      )
    )
  );

-- notification_templates: Managers can manage templates
DROP POLICY IF EXISTS "Managers can manage templates" ON notification_templates;
CREATE POLICY "Managers can manage templates"
  ON notification_templates FOR ALL
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

-- notification_history: Users can view own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notification_history;
CREATE POLICY "Users can view own notifications"
  ON notification_history FOR SELECT
  TO authenticated
  USING (recipient_id = (SELECT auth.uid()));

-- scheduled_tasks: Managers can manage tasks
DROP POLICY IF EXISTS "Managers can manage tasks" ON scheduled_tasks;
CREATE POLICY "Managers can manage tasks"
  ON scheduled_tasks FOR ALL
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

-- scheduled_tasks: Users can view tasks
DROP POLICY IF EXISTS "Users can view tasks" ON scheduled_tasks;
CREATE POLICY "Users can view tasks"
  ON scheduled_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
    )
  );

-- task_execution_log: Admins can view execution logs
DROP POLICY IF EXISTS "Admins can view execution logs" ON task_execution_log;
CREATE POLICY "Admins can view execution logs"
  ON task_execution_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- dashboard_widgets: Users can view available widgets
DROP POLICY IF EXISTS "Users can view available widgets" ON dashboard_widgets;
CREATE POLICY "Users can view available widgets"
  ON dashboard_widgets FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- dashboard_widgets: Admins can manage widgets
DROP POLICY IF EXISTS "Admins can manage widgets" ON dashboard_widgets;
CREATE POLICY "Admins can manage widgets"
  ON dashboard_widgets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- user_dashboard_layouts: Users can manage own layouts
DROP POLICY IF EXISTS "Users can manage own layouts" ON user_dashboard_layouts;
CREATE POLICY "Users can manage own layouts"
  ON user_dashboard_layouts FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- user_dashboard_layouts: Users can view own layouts
DROP POLICY IF EXISTS "Users can view own layouts" ON user_dashboard_layouts;
CREATE POLICY "Users can view own layouts"
  ON user_dashboard_layouts FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ops_case_aging_rules: Managers can manage aging rules
DROP POLICY IF EXISTS "Managers can manage aging rules" ON ops_case_aging_rules;
CREATE POLICY "Managers can manage aging rules"
  ON ops_case_aging_rules FOR ALL
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

-- ops_case_escalations: Users can view escalations
DROP POLICY IF EXISTS "Users can view escalations" ON ops_case_escalations;
CREATE POLICY "Users can view escalations"
  ON ops_case_escalations FOR SELECT
  TO authenticated
  USING (
    case_id IN (
      SELECT ops_cases.id
      FROM ops_cases
      WHERE ops_cases.clinic_id IN (
        SELECT clinic_access.clinic_id
        FROM clinic_access
        WHERE clinic_access.user_id = (SELECT auth.uid())
      )
    )
  );

-- ops_cases: Users can view clinic cases
DROP POLICY IF EXISTS "Users can view clinic cases" ON ops_cases;
CREATE POLICY "Users can view clinic cases"
  ON ops_cases FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
    )
  );
