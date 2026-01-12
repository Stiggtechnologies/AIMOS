/*
  # Optimize Auth RLS Initialization - Growth OS Tables

  1. Performance Issue
    - Multiple RLS policies re-evaluate auth.uid() for each row
    - This produces suboptimal query performance at scale
    - Solution: Replace auth.uid() with (SELECT auth.uid()) to cache the result

  2. Tables Optimized
    - referral_metrics
    - marketing_channels
    - campaigns
    - leads
    - campaign_metrics
    - intake_pipeline
    - intake_actions
    - intake_outcomes
    - intake_assignments
    - referral_partners
    - referral_campaigns
    - referral_gaps
    - revops_metrics
    - capacity_analysis
    - bottleneck_detection
    - growth_playbooks
    - playbook_actions
    - playbook_metrics

  3. Changes
    - Drop existing policies with auth.uid()
    - Recreate with (SELECT auth.uid()) for performance
*/

-- referral_metrics
DROP POLICY IF EXISTS "Execs can view referral_metrics" ON referral_metrics;
CREATE POLICY "Execs can view referral_metrics"
  ON referral_metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- marketing_channels
DROP POLICY IF EXISTS "Execs can view marketing_channels" ON marketing_channels;
CREATE POLICY "Execs can view marketing_channels"
  ON marketing_channels FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- campaigns
DROP POLICY IF EXISTS "Execs can view campaigns" ON campaigns;
CREATE POLICY "Execs can view campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- leads
DROP POLICY IF EXISTS "Execs can view leads" ON leads;
CREATE POLICY "Execs can view leads"
  ON leads FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- campaign_metrics
DROP POLICY IF EXISTS "Execs can view campaign_metrics" ON campaign_metrics;
CREATE POLICY "Execs can view campaign_metrics"
  ON campaign_metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- intake_pipeline
DROP POLICY IF EXISTS "Execs can view intake_pipeline" ON intake_pipeline;
CREATE POLICY "Execs can view intake_pipeline"
  ON intake_pipeline FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- intake_actions
DROP POLICY IF EXISTS "Execs can view intake_actions" ON intake_actions;
CREATE POLICY "Execs can view intake_actions"
  ON intake_actions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- intake_outcomes
DROP POLICY IF EXISTS "Execs can view intake_outcomes" ON intake_outcomes;
CREATE POLICY "Execs can view intake_outcomes"
  ON intake_outcomes FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- intake_assignments
DROP POLICY IF EXISTS "Execs can view intake_assignments" ON intake_assignments;
CREATE POLICY "Execs can view intake_assignments"
  ON intake_assignments FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- referral_partners
DROP POLICY IF EXISTS "Execs can view referral_partners" ON referral_partners;
CREATE POLICY "Execs can view referral_partners"
  ON referral_partners FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- referral_campaigns
DROP POLICY IF EXISTS "Execs can view referral_campaigns" ON referral_campaigns;
CREATE POLICY "Execs can view referral_campaigns"
  ON referral_campaigns FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- referral_gaps
DROP POLICY IF EXISTS "Execs can view referral_gaps" ON referral_gaps;
CREATE POLICY "Execs can view referral_gaps"
  ON referral_gaps FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- revops_metrics
DROP POLICY IF EXISTS "Execs can view revops_metrics" ON revops_metrics;
CREATE POLICY "Execs can view revops_metrics"
  ON revops_metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- capacity_analysis
DROP POLICY IF EXISTS "Execs can view capacity_analysis" ON capacity_analysis;
CREATE POLICY "Execs can view capacity_analysis"
  ON capacity_analysis FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- bottleneck_detection
DROP POLICY IF EXISTS "Execs can view bottleneck_detection" ON bottleneck_detection;
CREATE POLICY "Execs can view bottleneck_detection"
  ON bottleneck_detection FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- growth_playbooks
DROP POLICY IF EXISTS "Execs can view growth_playbooks" ON growth_playbooks;
CREATE POLICY "Execs can view growth_playbooks"
  ON growth_playbooks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- playbook_actions
DROP POLICY IF EXISTS "Execs can view playbook_actions" ON playbook_actions;
CREATE POLICY "Execs can view playbook_actions"
  ON playbook_actions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- playbook_metrics
DROP POLICY IF EXISTS "Execs can view playbook_metrics" ON playbook_metrics;
CREATE POLICY "Execs can view playbook_metrics"
  ON playbook_metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));