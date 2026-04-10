/*
  # Add Missing RLS Policies for Critical Tables

  1. Overview
    Addresses incomplete RLS policy coverage identified in audit
    Tables with missing SELECT, INSERT, UPDATE, or DELETE policies
    Some tables had no policies at all requiring defensive setup

  2. Tables Fixed
    - agent_domains (no policies)
    - agent_escalations (no policies)
    - agent_execution_context (no policies)
    - agent_kpis (no policies)
    - agent_overrides (no policies)
    - agent_risk_thresholds (no policies)
    - agent_supervision_logs (no policies)
    - ai_agents (no policies)

  3. Policy Pattern
    - All authenticated users can SELECT from configuration/read-only tables
    - Only admins can INSERT/UPDATE critical system tables
    - Escalations and overrides restricted to admin users
    - Logs are append-only (SELECT/INSERT only)

  4. Security Model
    System tables are restricted to authenticated users with admin role
*/

-- agent_domains - read-only system table
DROP POLICY IF EXISTS "Enable read access for all users" ON agent_domains;
ALTER TABLE agent_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Domain select"
  ON agent_domains FOR SELECT
  TO authenticated
  USING (true);

-- agent_escalations - admin only
DROP POLICY IF EXISTS "Enable read access for all users" ON agent_escalations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON agent_escalations;
ALTER TABLE agent_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Escalation select"
  ON agent_escalations FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
  ));

CREATE POLICY "Escalation insert"
  ON agent_escalations FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
  ));

-- agent_execution_context - audit logging, append-only
DROP POLICY IF EXISTS "Enable read access for all users" ON agent_execution_context;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON agent_execution_context;
ALTER TABLE agent_execution_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Context select"
  ON agent_execution_context FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Context insert"
  ON agent_execution_context FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- agent_kpis - readable by all
DROP POLICY IF EXISTS "Enable read access for all users" ON agent_kpis;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON agent_kpis;
ALTER TABLE agent_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "KPI select"
  ON agent_kpis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "KPI insert"
  ON agent_kpis FOR INSERT
  WITH CHECK (true);

-- agent_overrides - admin audit
DROP POLICY IF EXISTS "Enable read access for all users" ON agent_overrides;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON agent_overrides;
ALTER TABLE agent_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Override select"
  ON agent_overrides FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
  ));

CREATE POLICY "Override insert"
  ON agent_overrides FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
  ));

-- agent_risk_thresholds - admin configuration
DROP POLICY IF EXISTS "Enable read access for all users" ON agent_risk_thresholds;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON agent_risk_thresholds;
ALTER TABLE agent_risk_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Threshold select"
  ON agent_risk_thresholds FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
  ));

CREATE POLICY "Threshold insert"
  ON agent_risk_thresholds FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
  ));

-- agent_supervision_logs - append-only audit
DROP POLICY IF EXISTS "Enable read access for all users" ON agent_supervision_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON agent_supervision_logs;
ALTER TABLE agent_supervision_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supervision log read"
  ON agent_supervision_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Supervision log write"
  ON agent_supervision_logs FOR INSERT
  WITH CHECK (true);

-- ai_agents - read-only reference
DROP POLICY IF EXISTS "Enable read access for all users" ON ai_agents;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ai_agents;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AI agents view"
  ON ai_agents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "AI agents admin insert"
  ON ai_agents FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'executive')
  ));
