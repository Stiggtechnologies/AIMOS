/*
  # Optimize RLS Performance - Auth Function Calls (Fixed)
  
  1. Problem
    - 56 RLS policies re-evaluate auth.uid() for each row
    - Causes O(n) function calls instead of O(1)
    - Significant performance impact at scale
  
  2. Solution
    - Replace auth.uid() with (SELECT auth.uid())
    - Auth function evaluated once per query
    - No security logic changes
  
  3. Performance Impact
    - Reduces database CPU usage
    - Improves query response times
    - Better scalability for large datasets
*/

-- user_profiles
DROP POLICY IF EXISTS "Users can view profiles in shared clinics" ON user_profiles;
CREATE POLICY "Users can view profiles in shared clinics"
  ON user_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_access ca1
      WHERE ca1.user_id = (SELECT auth.uid())
      AND ca1.clinic_id IN (
        SELECT ca2.clinic_id FROM clinic_access ca2
        WHERE ca2.user_id = user_profiles.id
      )
    )
  );

-- clinic_access
DROP POLICY IF EXISTS "Users can view own clinic access" ON clinic_access;
CREATE POLICY "Users can view own clinic access"
  ON clinic_access FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- document_read_receipts
DROP POLICY IF EXISTS "Admins can view all read receipts" ON document_read_receipts;
DROP POLICY IF EXISTS "Users can create own read receipts" ON document_read_receipts;
DROP POLICY IF EXISTS "Users can view own read receipts" ON document_read_receipts;

CREATE POLICY "Admins can view all read receipts"
  ON document_read_receipts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Users can create own read receipts"
  ON document_read_receipts FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own read receipts"
  ON document_read_receipts FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- document_review_schedule
DROP POLICY IF EXISTS "Admins can manage review schedule" ON document_review_schedule;
DROP POLICY IF EXISTS "Reviewers can update assigned reviews" ON document_review_schedule;
DROP POLICY IF EXISTS "Reviewers can view assigned reviews" ON document_review_schedule;

CREATE POLICY "Admins can manage review schedule"
  ON document_review_schedule FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Reviewers can update assigned reviews"
  ON document_review_schedule FOR UPDATE TO authenticated
  USING (reviewer_id = (SELECT auth.uid()))
  WITH CHECK (reviewer_id = (SELECT auth.uid()));

CREATE POLICY "Reviewers can view assigned reviews"
  ON document_review_schedule FOR SELECT TO authenticated
  USING (reviewer_id = (SELECT auth.uid()));

-- workload_balance_summary
DROP POLICY IF EXISTS "Admins can manage workload summaries" ON workload_balance_summary;
DROP POLICY IF EXISTS "Managers can view clinic summaries" ON workload_balance_summary;

CREATE POLICY "Admins can manage workload summaries"
  ON workload_balance_summary FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Managers can view clinic summaries"
  ON workload_balance_summary FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_access
      WHERE user_id = (SELECT auth.uid())
      AND clinic_id = workload_balance_summary.clinic_id
    )
  );

-- burnout_risk_indicators
DROP POLICY IF EXISTS "Admins can manage indicators" ON burnout_risk_indicators;
CREATE POLICY "Admins can manage indicators"
  ON burnout_risk_indicators FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

-- workforce_health_trends
DROP POLICY IF EXISTS "Admins can manage health trends" ON workforce_health_trends;
DROP POLICY IF EXISTS "Managers can view health trends" ON workforce_health_trends;

CREATE POLICY "Admins can manage health trends"
  ON workforce_health_trends FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Managers can view health trends"
  ON workforce_health_trends FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_access
      WHERE user_id = (SELECT auth.uid())
      AND clinic_id = workforce_health_trends.clinic_id
    )
  );

-- inventory_transactions
DROP POLICY IF EXISTS "Staff can create inventory transactions at their clinics" ON inventory_transactions;
CREATE POLICY "Staff can create inventory transactions at their clinics"
  ON inventory_transactions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_access
      WHERE user_id = (SELECT auth.uid())
      AND clinic_id = inventory_transactions.clinic_id
    )
  );

-- custom_reports
DROP POLICY IF EXISTS "Users can manage their own reports" ON custom_reports;
DROP POLICY IF EXISTS "Users can view their own and shared reports" ON custom_reports;

CREATE POLICY "Users can manage their own reports"
  ON custom_reports FOR ALL TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can view their own and shared reports"
  ON custom_reports FOR SELECT TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR is_public = true
    OR (SELECT auth.uid()) = ANY(shared_with)
  );

-- report_schedules
DROP POLICY IF EXISTS "Users can manage schedules for their own reports" ON report_schedules;
DROP POLICY IF EXISTS "Users can view schedules for reports they can access" ON report_schedules;

CREATE POLICY "Users can manage schedules for their own reports"
  ON report_schedules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_reports
      WHERE id = report_schedules.report_id
      AND created_by = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view schedules for reports they can access"
  ON report_schedules FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_reports cr
      WHERE cr.id = report_schedules.report_id
      AND (
        cr.created_by = (SELECT auth.uid())
        OR cr.is_public = true
        OR (SELECT auth.uid()) = ANY(cr.shared_with)
      )
    )
  );

-- data_exports
DROP POLICY IF EXISTS "Users can request data exports" ON data_exports;
DROP POLICY IF EXISTS "Users can update their own data exports" ON data_exports;
DROP POLICY IF EXISTS "Users can view their own data exports" ON data_exports;

CREATE POLICY "Users can request data exports"
  ON data_exports FOR INSERT TO authenticated
  WITH CHECK (requested_by = (SELECT auth.uid()));

CREATE POLICY "Users can update their own data exports"
  ON data_exports FOR UPDATE TO authenticated
  USING (requested_by = (SELECT auth.uid()))
  WITH CHECK (requested_by = (SELECT auth.uid()));

CREATE POLICY "Users can view their own data exports"
  ON data_exports FOR SELECT TO authenticated
  USING (requested_by = (SELECT auth.uid()));

-- protocol_adherence
DROP POLICY IF EXISTS "Providers can update their own protocol adherence records" ON protocol_adherence;
DROP POLICY IF EXISTS "Staff can record protocol adherence at their clinics" ON protocol_adherence;

CREATE POLICY "Providers can update their own protocol adherence records"
  ON protocol_adherence FOR UPDATE TO authenticated
  USING (provider_id = (SELECT auth.uid()))
  WITH CHECK (provider_id = (SELECT auth.uid()));

CREATE POLICY "Staff can record protocol adherence at their clinics"
  ON protocol_adherence FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_access
      WHERE user_id = (SELECT auth.uid())
      AND clinic_id = protocol_adherence.clinic_id
    )
  );

-- integration_checklists
DROP POLICY IF EXISTS "Checklist owners can update" ON integration_checklists;
DROP POLICY IF EXISTS "Team members can view checklists" ON integration_checklists;

CREATE POLICY "Checklist owners can update"
  ON integration_checklists FOR UPDATE TO authenticated
  USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Team members can view checklists"
  ON integration_checklists FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integration_team_members itm
      WHERE itm.integration_id = integration_checklists.integration_id
      AND itm.user_id = (SELECT auth.uid())
    )
  );

-- integration_checklist_items
DROP POLICY IF EXISTS "Assigned users can update items" ON integration_checklist_items;
DROP POLICY IF EXISTS "Team members can view items" ON integration_checklist_items;

CREATE POLICY "Assigned users can update items"
  ON integration_checklist_items FOR UPDATE TO authenticated
  USING (assigned_to = (SELECT auth.uid()))
  WITH CHECK (assigned_to = (SELECT auth.uid()));

CREATE POLICY "Team members can view items"
  ON integration_checklist_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integration_checklists ic
      JOIN integration_team_members itm ON itm.integration_id = ic.integration_id
      WHERE ic.id = integration_checklist_items.checklist_id
      AND itm.user_id = (SELECT auth.uid())
    )
  );

-- performance_normalization_metrics
DROP POLICY IF EXISTS "Team members can view metrics" ON performance_normalization_metrics;
CREATE POLICY "Team members can view metrics"
  ON performance_normalization_metrics FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integration_team_members itm
      WHERE itm.integration_id = performance_normalization_metrics.integration_id
      AND itm.user_id = (SELECT auth.uid())
    )
  );

-- cultural_alignment_tasks
DROP POLICY IF EXISTS "Team members can view cultural tasks" ON cultural_alignment_tasks;
CREATE POLICY "Team members can view cultural tasks"
  ON cultural_alignment_tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integration_team_members itm
      WHERE itm.integration_id = cultural_alignment_tasks.integration_id
      AND itm.user_id = (SELECT auth.uid())
    )
  );

-- integration_team_members
DROP POLICY IF EXISTS "Authenticated can view team members" ON integration_team_members;
CREATE POLICY "Authenticated can view team members"
  ON integration_team_members FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

-- sensitive_data_access_log
DROP POLICY IF EXISTS "rbac_ins" ON sensitive_data_access_log;
CREATE POLICY "rbac_ins"
  ON sensitive_data_access_log FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- data_modification_audit
DROP POLICY IF EXISTS "rbac_ins" ON data_modification_audit;
CREATE POLICY "rbac_ins"
  ON data_modification_audit FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- patient_assignments
DROP POLICY IF EXISTS "rbac_sel" ON patient_assignments;
CREATE POLICY "rbac_sel"
  ON patient_assignments FOR SELECT TO authenticated
  USING (
    clinician_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM clinic_access
      WHERE user_id = (SELECT auth.uid())
      AND clinic_id = patient_assignments.clinic_id
    )
  );

-- incident_patterns
DROP POLICY IF EXISTS "Executives can manage patterns" ON incident_patterns;
DROP POLICY IF EXISTS "Executives can view patterns" ON incident_patterns;

CREATE POLICY "Executives can manage patterns"
  ON incident_patterns FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Executives can view patterns"
  ON incident_patterns FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

-- emergency_playbooks
DROP POLICY IF EXISTS "Admins can manage playbooks" ON emergency_playbooks;
CREATE POLICY "Admins can manage playbooks"
  ON emergency_playbooks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

-- emergency_playbook_steps
DROP POLICY IF EXISTS "Admins can manage playbook steps" ON emergency_playbook_steps;
CREATE POLICY "Admins can manage playbook steps"
  ON emergency_playbook_steps FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

-- emergency_tasks
DROP POLICY IF EXISTS "Admins can manage emergency tasks" ON emergency_tasks;
DROP POLICY IF EXISTS "Assigned users can update their tasks" ON emergency_tasks;
DROP POLICY IF EXISTS "Users can view tasks assigned to them or leadership can view al" ON emergency_tasks;

CREATE POLICY "Admins can manage emergency tasks"
  ON emergency_tasks FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Assigned users can update their tasks"
  ON emergency_tasks FOR UPDATE TO authenticated
  USING (assigned_to = (SELECT auth.uid()))
  WITH CHECK (assigned_to = (SELECT auth.uid()));

CREATE POLICY "Users can view tasks assigned to them or leadership can view all"
  ON emergency_tasks FOR SELECT TO authenticated
  USING (
    assigned_to = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive', 'clinic_manager')
    )
  );

-- emergency_event_logs
DROP POLICY IF EXISTS "Admins can manage event logs" ON emergency_event_logs;
DROP POLICY IF EXISTS "Users can view logs for active emergencies or leadership can vi" ON emergency_event_logs;

CREATE POLICY "Admins can manage event logs"
  ON emergency_event_logs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Users can view logs for active emergencies or leadership can view all"
  ON emergency_event_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emergency_events ee
      WHERE ee.id = emergency_event_logs.event_id AND ee.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive', 'clinic_manager')
    )
  );

-- broadcast_recipients
DROP POLICY IF EXISTS "System can manage broadcast recipients" ON broadcast_recipients;
DROP POLICY IF EXISTS "Users can update own broadcast receipts" ON broadcast_recipients;
DROP POLICY IF EXISTS "Users can view own broadcast receipts" ON broadcast_recipients;

CREATE POLICY "System can manage broadcast recipients"
  ON broadcast_recipients FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Users can update own broadcast receipts"
  ON broadcast_recipients FOR UPDATE TO authenticated
  USING (recipient_id = (SELECT auth.uid()))
  WITH CHECK (recipient_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own broadcast receipts"
  ON broadcast_recipients FOR SELECT TO authenticated
  USING (recipient_id = (SELECT auth.uid()));

-- emergency_mode_status
DROP POLICY IF EXISTS "Executives can manage emergency mode" ON emergency_mode_status;
CREATE POLICY "Executives can manage emergency mode"
  ON emergency_mode_status FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

-- task_acknowledgements
DROP POLICY IF EXISTS "Managers can view all task acknowledgements" ON task_acknowledgements;
DROP POLICY IF EXISTS "System can manage task acknowledgements" ON task_acknowledgements;
DROP POLICY IF EXISTS "Users can update own task acknowledgements" ON task_acknowledgements;
DROP POLICY IF EXISTS "Users can view own task acknowledgements" ON task_acknowledgements;

CREATE POLICY "Managers can view all task acknowledgements"
  ON task_acknowledgements FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "System can manage task acknowledgements"
  ON task_acknowledgements FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Users can update own task acknowledgements"
  ON task_acknowledgements FOR UPDATE TO authenticated
  USING (assigned_user_id = (SELECT auth.uid()))
  WITH CHECK (assigned_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view own task acknowledgements"
  ON task_acknowledgements FOR SELECT TO authenticated
  USING (assigned_user_id = (SELECT auth.uid()));

-- emergency_broadcasts
DROP POLICY IF EXISTS "Managers can create broadcasts" ON emergency_broadcasts;
DROP POLICY IF EXISTS "Managers can update broadcasts" ON emergency_broadcasts;

CREATE POLICY "Managers can create broadcasts"
  ON emergency_broadcasts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Managers can update broadcasts"
  ON emergency_broadcasts FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive', 'clinic_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive', 'clinic_manager')
    )
  );

-- ai_readiness_assessments
DROP POLICY IF EXISTS "Admins and executives can view assessments" ON ai_readiness_assessments;
DROP POLICY IF EXISTS "Admins can manage assessments" ON ai_readiness_assessments;

CREATE POLICY "Admins and executives can view assessments"
  ON ai_readiness_assessments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can manage assessments"
  ON ai_readiness_assessments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- data_ownership_registry
DROP POLICY IF EXISTS "Admins can manage ownership registry" ON data_ownership_registry;
CREATE POLICY "Admins can manage ownership registry"
  ON data_ownership_registry FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- compliance_audit_trail
DROP POLICY IF EXISTS "Admins and executives can view audits" ON compliance_audit_trail;
DROP POLICY IF EXISTS "Admins can manage audit trail" ON compliance_audit_trail;

CREATE POLICY "Admins and executives can view audits"
  ON compliance_audit_trail FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can manage audit trail"
  ON compliance_audit_trail FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- ai_policy_versions
DROP POLICY IF EXISTS "Admins can manage policy versions" ON ai_policy_versions;
CREATE POLICY "Admins can manage policy versions"
  ON ai_policy_versions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );
