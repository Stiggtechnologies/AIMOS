/*
  # Optimize Auth RLS Initialization - RevOps and Referral Tables

  1. Performance Issue
    - Continuing optimization of RLS policies that re-evaluate auth functions

  2. Tables Optimized
    - referral_partner_scorecards (2 policies)
    - referral_reactivation_workflows (2 policies)
    - referral_outreach_activities (2 policies)
    - referral_partner_segments (2 policies)
    - referral_partner_segment_members (2 policies)
    - revops_pipeline_metrics (2 policies)
    - revops_capacity_metrics (2 policies)
    - revops_bottlenecks (2 policies)
    - revops_clinician_productivity (2 policies)
    - revops_growth_alerts (2 policies)
    - growth_playbook_templates (2 policies)
    - growth_campaign_templates (2 policies)
    - growth_outreach_scripts (2 policies)
    - growth_engagement_checklists (2 policies)
    - seasonal_demand_plans (2 policies)
    - playbook_executions (2 policies)
*/

-- referral_partner_scorecards
DROP POLICY IF EXISTS "Clinic managers and executives can manage partner scorecards" ON referral_partner_scorecards;
DROP POLICY IF EXISTS "Clinic managers and executives can view partner scorecards" ON referral_partner_scorecards;

CREATE POLICY "Clinic managers and executives can manage partner scorecards"
  ON referral_partner_scorecards FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view partner scorecards"
  ON referral_partner_scorecards FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- referral_reactivation_workflows
DROP POLICY IF EXISTS "Clinic managers and executives can manage reactivation workflow" ON referral_reactivation_workflows;
DROP POLICY IF EXISTS "Clinic managers and executives can view reactivation workflows" ON referral_reactivation_workflows;

CREATE POLICY "Clinic managers and executives can manage reactivation workflow"
  ON referral_reactivation_workflows FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view reactivation workflows"
  ON referral_reactivation_workflows FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- referral_outreach_activities
DROP POLICY IF EXISTS "Clinic managers and executives can manage outreach activities" ON referral_outreach_activities;
DROP POLICY IF EXISTS "Clinic managers and executives can view outreach activities" ON referral_outreach_activities;

CREATE POLICY "Clinic managers and executives can manage outreach activities"
  ON referral_outreach_activities FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view outreach activities"
  ON referral_outreach_activities FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- referral_partner_segments
DROP POLICY IF EXISTS "Clinic managers and executives can manage partner segments" ON referral_partner_segments;
DROP POLICY IF EXISTS "Clinic managers and executives can view partner segments" ON referral_partner_segments;

CREATE POLICY "Clinic managers and executives can manage partner segments"
  ON referral_partner_segments FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view partner segments"
  ON referral_partner_segments FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- referral_partner_segment_members
DROP POLICY IF EXISTS "Clinic managers and executives can manage segment members" ON referral_partner_segment_members;
DROP POLICY IF EXISTS "Clinic managers and executives can view segment members" ON referral_partner_segment_members;

CREATE POLICY "Clinic managers and executives can manage segment members"
  ON referral_partner_segment_members FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view segment members"
  ON referral_partner_segment_members FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- revops_pipeline_metrics
DROP POLICY IF EXISTS "Executives and clinic managers can manage pipeline metrics" ON revops_pipeline_metrics;
DROP POLICY IF EXISTS "Executives and clinic managers can view pipeline metrics" ON revops_pipeline_metrics;

CREATE POLICY "Executives and clinic managers can manage pipeline metrics"
  ON revops_pipeline_metrics FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view pipeline metrics"
  ON revops_pipeline_metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- revops_capacity_metrics
DROP POLICY IF EXISTS "Executives and clinic managers can manage capacity metrics" ON revops_capacity_metrics;
DROP POLICY IF EXISTS "Executives and clinic managers can view capacity metrics" ON revops_capacity_metrics;

CREATE POLICY "Executives and clinic managers can manage capacity metrics"
  ON revops_capacity_metrics FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view capacity metrics"
  ON revops_capacity_metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- revops_bottlenecks
DROP POLICY IF EXISTS "Executives and clinic managers can manage bottlenecks" ON revops_bottlenecks;
DROP POLICY IF EXISTS "Executives and clinic managers can view bottlenecks" ON revops_bottlenecks;

CREATE POLICY "Executives and clinic managers can manage bottlenecks"
  ON revops_bottlenecks FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view bottlenecks"
  ON revops_bottlenecks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- revops_clinician_productivity
DROP POLICY IF EXISTS "Executives and clinic managers can manage clinician productivit" ON revops_clinician_productivity;
DROP POLICY IF EXISTS "Executives and clinic managers can view clinician productivity" ON revops_clinician_productivity;

CREATE POLICY "Executives and clinic managers can manage clinician productivit"
  ON revops_clinician_productivity FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view clinician productivity"
  ON revops_clinician_productivity FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- revops_growth_alerts
DROP POLICY IF EXISTS "Executives and clinic managers can manage growth alerts" ON revops_growth_alerts;
DROP POLICY IF EXISTS "Executives and clinic managers can view growth alerts" ON revops_growth_alerts;

CREATE POLICY "Executives and clinic managers can manage growth alerts"
  ON revops_growth_alerts FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives and clinic managers can view growth alerts"
  ON revops_growth_alerts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- growth_playbook_templates
DROP POLICY IF EXISTS "Clinic managers and executives can manage playbook templates" ON growth_playbook_templates;
DROP POLICY IF EXISTS "Clinic managers and executives can view playbook templates" ON growth_playbook_templates;

CREATE POLICY "Clinic managers and executives can manage playbook templates"
  ON growth_playbook_templates FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view playbook templates"
  ON growth_playbook_templates FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- growth_campaign_templates
DROP POLICY IF EXISTS "Clinic managers and executives can manage campaign templates" ON growth_campaign_templates;
DROP POLICY IF EXISTS "Clinic managers and executives can view campaign templates" ON growth_campaign_templates;

CREATE POLICY "Clinic managers and executives can manage campaign templates"
  ON growth_campaign_templates FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view campaign templates"
  ON growth_campaign_templates FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- growth_outreach_scripts
DROP POLICY IF EXISTS "Clinic managers and executives can manage outreach scripts" ON growth_outreach_scripts;
DROP POLICY IF EXISTS "Clinic managers and executives can view outreach scripts" ON growth_outreach_scripts;

CREATE POLICY "Clinic managers and executives can manage outreach scripts"
  ON growth_outreach_scripts FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view outreach scripts"
  ON growth_outreach_scripts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- growth_engagement_checklists
DROP POLICY IF EXISTS "Clinic managers and executives can manage engagement checklists" ON growth_engagement_checklists;
DROP POLICY IF EXISTS "Clinic managers and executives can view engagement checklists" ON growth_engagement_checklists;

CREATE POLICY "Clinic managers and executives can manage engagement checklists"
  ON growth_engagement_checklists FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view engagement checklists"
  ON growth_engagement_checklists FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- seasonal_demand_plans
DROP POLICY IF EXISTS "Clinic managers and executives can manage seasonal plans" ON seasonal_demand_plans;
DROP POLICY IF EXISTS "Clinic managers and executives can view seasonal plans" ON seasonal_demand_plans;

CREATE POLICY "Clinic managers and executives can manage seasonal plans"
  ON seasonal_demand_plans FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view seasonal plans"
  ON seasonal_demand_plans FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- playbook_executions
DROP POLICY IF EXISTS "Clinic managers and executives can manage playbook executions" ON playbook_executions;
DROP POLICY IF EXISTS "Clinic managers and executives can view playbook executions" ON playbook_executions;

CREATE POLICY "Clinic managers and executives can manage playbook executions"
  ON playbook_executions FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Clinic managers and executives can view playbook executions"
  ON playbook_executions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));