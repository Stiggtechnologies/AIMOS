/*
  # Fix RLS Auth Performance - Financial and Launch Tables (Batch 4)

  1. Changes
    - Replace `auth.uid()` with `(SELECT auth.uid())` in RLS policies to cache auth function results
    - Fixes RLS performance issues across 12 tables with 14 policies total
    
  2. Tables Updated
    - cash_flow_forecasts (1 policy)
    - financial_budgets (1 policy)
    - financial_alerts (1 policy)
    - service_line_performance (1 policy)
    - launch_phases (1 policy)
    - launch_risks (1 policy)
    - launch_documents (2 policies)
    - launch_milestones (2 policies)
    - launch_tasks (2 policies)
    - launch_deliverables (1 policy)
    - launch_kpis (1 policy)
    
  3. Security
    - All policies maintain existing access control logic
    - Only performance optimization applied
*/

-- cash_flow_forecasts: Executives can manage forecasts
DROP POLICY IF EXISTS "Executives can manage forecasts" ON cash_flow_forecasts;
CREATE POLICY "Executives can manage forecasts"
  ON cash_flow_forecasts FOR ALL
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

-- financial_budgets: Executives can manage budgets
DROP POLICY IF EXISTS "Executives can manage budgets" ON financial_budgets;
CREATE POLICY "Executives can manage budgets"
  ON financial_budgets FOR ALL
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

-- financial_alerts: Executives can view alerts
DROP POLICY IF EXISTS "Executives can view alerts" ON financial_alerts;
CREATE POLICY "Executives can view alerts"
  ON financial_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- service_line_performance: Managers can view performance
DROP POLICY IF EXISTS "Managers can view performance" ON service_line_performance;
CREATE POLICY "Managers can view performance"
  ON service_line_performance FOR SELECT
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_access.clinic_id
      FROM clinic_access
      WHERE clinic_access.user_id = (SELECT auth.uid())
    )
  );

-- launch_phases: Project managers can manage phases
DROP POLICY IF EXISTS "Project managers can manage phases" ON launch_phases;
CREATE POLICY "Project managers can manage phases"
  ON launch_phases FOR ALL
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

-- launch_risks: Project team can manage risks
DROP POLICY IF EXISTS "Project team can manage risks" ON launch_risks;
CREATE POLICY "Project team can manage risks"
  ON launch_risks FOR ALL
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

-- launch_documents: Project team can view documents
DROP POLICY IF EXISTS "Project team can view documents" ON launch_documents;
CREATE POLICY "Project team can view documents"
  ON launch_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- launch_documents: Project managers can manage documents
DROP POLICY IF EXISTS "Project managers can manage documents" ON launch_documents;
CREATE POLICY "Project managers can manage documents"
  ON launch_documents FOR ALL
  TO authenticated
  USING (
    uploaded_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- launch_milestones: Project team can view milestones
DROP POLICY IF EXISTS "Project team can view milestones" ON launch_milestones;
CREATE POLICY "Project team can view milestones"
  ON launch_milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- launch_milestones: Project managers can manage milestones
DROP POLICY IF EXISTS "Project managers can manage milestones" ON launch_milestones;
CREATE POLICY "Project managers can manage milestones"
  ON launch_milestones FOR ALL
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

-- launch_tasks: Assigned users can view tasks
DROP POLICY IF EXISTS "Assigned users can view tasks" ON launch_tasks;
CREATE POLICY "Assigned users can view tasks"
  ON launch_tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- launch_tasks: Project managers can manage tasks
DROP POLICY IF EXISTS "Project managers can manage tasks" ON launch_tasks;
CREATE POLICY "Project managers can manage tasks"
  ON launch_tasks FOR ALL
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

-- launch_deliverables: Project team can manage deliverables
DROP POLICY IF EXISTS "Project team can manage deliverables" ON launch_deliverables;
CREATE POLICY "Project team can manage deliverables"
  ON launch_deliverables FOR ALL
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

-- launch_kpis: Project team can view KPIs
DROP POLICY IF EXISTS "Project team can view KPIs" ON launch_kpis;
CREATE POLICY "Project team can view KPIs"
  ON launch_kpis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (SELECT auth.uid())
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );
