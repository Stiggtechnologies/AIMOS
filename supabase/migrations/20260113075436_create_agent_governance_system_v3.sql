/*
  # AI Agent Governance System - Enterprise Grade

  Complete agent governance system with domains, agents, decisions, actions,
  escalations, supervision, overrides, KPIs, and audit trail.
*/

-- Agent Domains
CREATE TABLE IF NOT EXISTS agent_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  executive_owner text,
  risk_category text CHECK (risk_category IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access domains" ON agent_domains FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AI Agents Registry
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid REFERENCES agent_domains(id),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  mission_statement text,
  system_prompt text NOT NULL,
  capabilities jsonb DEFAULT '[]'::jsonb,
  constraints jsonb DEFAULT '[]'::jsonb,
  autonomous_authority jsonb DEFAULT '{}'::jsonb,
  risk_level text CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  requires_hitl boolean DEFAULT true,
  hitl_confidence_threshold numeric(5,2) DEFAULT 80.00,
  max_financial_impact numeric(10,2) DEFAULT 0,
  active boolean DEFAULT true,
  version text DEFAULT '1.0',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access agents" ON ai_agents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_ai_agents_domain ON ai_agents(domain_id);
CREATE INDEX idx_ai_agents_active ON ai_agents(active);
CREATE INDEX idx_ai_agents_slug ON ai_agents(slug);

-- Agent Risk Thresholds
CREATE TABLE IF NOT EXISTS agent_risk_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  threshold_type text NOT NULL,
  threshold_name text NOT NULL,
  threshold_value numeric,
  threshold_unit text,
  action_on_breach text CHECK (action_on_breach IN ('escalate', 'block', 'warn', 'log')) DEFAULT 'escalate',
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_risk_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access thresholds" ON agent_risk_thresholds FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_agent_risk_thresholds_agent ON agent_risk_thresholds(agent_id);

-- Agent Execution Context
CREATE TABLE IF NOT EXISTS agent_execution_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id),
  execution_id text UNIQUE NOT NULL,
  trigger_type text CHECK (trigger_type IN ('scheduled', 'event', 'manual', 'api')) NOT NULL,
  trigger_source text,
  input_data jsonb,
  context_data jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text CHECK (status IN ('running', 'completed', 'failed', 'escalated', 'blocked')) DEFAULT 'running',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_execution_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access execution context" ON agent_execution_context FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_agent_execution_agent ON agent_execution_context(agent_id);
CREATE INDEX idx_agent_execution_status ON agent_execution_context(status);
CREATE INDEX idx_agent_execution_started ON agent_execution_context(started_at DESC);

-- Agent Decisions
CREATE TABLE IF NOT EXISTS agent_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_context_id uuid REFERENCES agent_execution_context(id),
  agent_id uuid REFERENCES ai_agents(id),
  decision_type text NOT NULL,
  decision_summary text NOT NULL,
  recommendation text,
  confidence_score numeric(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  rationale text,
  identified_risks jsonb DEFAULT '[]'::jsonb,
  alternative_options jsonb DEFAULT '[]'::jsonb,
  data_sources jsonb DEFAULT '[]'::jsonb,
  requires_approval boolean DEFAULT false,
  approved boolean,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access decisions" ON agent_decisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_agent_decisions_agent ON agent_decisions(agent_id);
CREATE INDEX idx_agent_decisions_context ON agent_decisions(execution_context_id);
CREATE INDEX idx_agent_decisions_approval ON agent_decisions(requires_approval, approved);
CREATE INDEX idx_agent_decisions_created ON agent_decisions(created_at DESC);

-- Agent Actions
CREATE TABLE IF NOT EXISTS agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid REFERENCES agent_decisions(id),
  agent_id uuid REFERENCES ai_agents(id),
  action_type text NOT NULL,
  action_description text NOT NULL,
  action_data jsonb,
  target_entity_type text,
  target_entity_id uuid,
  status text CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'blocked', 'reverted')) DEFAULT 'pending',
  executed_at timestamptz,
  completed_at timestamptz,
  result jsonb,
  error_message text,
  financial_impact numeric(10,2),
  reversible boolean DEFAULT true,
  reverted_at timestamptz,
  reverted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access actions" ON agent_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_agent_actions_decision ON agent_actions(decision_id);
CREATE INDEX idx_agent_actions_agent ON agent_actions(agent_id);
CREATE INDEX idx_agent_actions_status ON agent_actions(status);
CREATE INDEX idx_agent_actions_created ON agent_actions(created_at DESC);

-- Agent Escalations (HITL)
CREATE TABLE IF NOT EXISTS agent_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid REFERENCES agent_decisions(id),
  agent_id uuid REFERENCES ai_agents(id),
  escalation_type text CHECK (escalation_type IN ('confidence', 'risk', 'threshold', 'conflict', 'anomaly', 'safety')) NOT NULL,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  title text NOT NULL,
  description text NOT NULL,
  reason text NOT NULL,
  escalated_to_role text,
  escalated_to_user uuid REFERENCES auth.users(id),
  context_data jsonb,
  requires_decision boolean DEFAULT true,
  decision_deadline timestamptz,
  status text CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'escalated_further')) DEFAULT 'pending',
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access escalations" ON agent_escalations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_agent_escalations_agent ON agent_escalations(agent_id);
CREATE INDEX idx_agent_escalations_status ON agent_escalations(status);
CREATE INDEX idx_agent_escalations_severity ON agent_escalations(severity);
CREATE INDEX idx_agent_escalations_user ON agent_escalations(escalated_to_user);
CREATE INDEX idx_agent_escalations_created ON agent_escalations(created_at DESC);

-- Agent Supervision Logs (Meta-Agent)
CREATE TABLE IF NOT EXISTS agent_supervision_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supervised_agent_id uuid REFERENCES ai_agents(id),
  decision_id uuid REFERENCES agent_decisions(id),
  supervision_type text CHECK (supervision_type IN ('monitor', 'conflict_detection', 'safety_check', 'arbitration', 'block')) NOT NULL,
  finding text NOT NULL,
  risk_detected boolean DEFAULT false,
  conflict_detected boolean DEFAULT false,
  action_taken text CHECK (action_taken IN ('approved', 'blocked', 'escalated', 'flagged', 'none')) DEFAULT 'none',
  rationale text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_supervision_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access supervision logs" ON agent_supervision_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_supervision_logs_agent ON agent_supervision_logs(supervised_agent_id);
CREATE INDEX idx_supervision_logs_decision ON agent_supervision_logs(decision_id);
CREATE INDEX idx_supervision_logs_type ON agent_supervision_logs(supervision_type);
CREATE INDEX idx_supervision_logs_created ON agent_supervision_logs(created_at DESC);

-- Agent Overrides
CREATE TABLE IF NOT EXISTS agent_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid REFERENCES agent_decisions(id),
  agent_id uuid REFERENCES ai_agents(id),
  overridden_by uuid REFERENCES auth.users(id) NOT NULL,
  override_reason text NOT NULL,
  original_recommendation text,
  human_decision text NOT NULL,
  impact_assessment text,
  learning_feedback jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access overrides" ON agent_overrides FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_agent_overrides_agent ON agent_overrides(agent_id);
CREATE INDEX idx_agent_overrides_user ON agent_overrides(overridden_by);
CREATE INDEX idx_agent_overrides_created ON agent_overrides(created_at DESC);

-- Agent KPIs
CREATE TABLE IF NOT EXISTS agent_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id),
  metric_date date NOT NULL,
  kpi_type text NOT NULL,
  kpi_name text NOT NULL,
  kpi_value numeric,
  target_value numeric,
  unit text,
  trend text CHECK (trend IN ('up', 'down', 'stable')),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, metric_date, kpi_type, kpi_name)
);

ALTER TABLE agent_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users access KPIs" ON agent_kpis FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_agent_kpis_agent_date ON agent_kpis(agent_id, metric_date DESC);
CREATE INDEX idx_agent_kpis_type ON agent_kpis(kpi_type);

-- Agent Audit Trail (Immutable)
CREATE TABLE IF NOT EXISTS agent_audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id),
  event_type text NOT NULL,
  event_data jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_audit_trail ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view audit trail" ON agent_audit_trail FOR SELECT TO authenticated USING (true);
CREATE POLICY "System appends audit trail" ON agent_audit_trail FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_agent_audit_agent ON agent_audit_trail(agent_id);
CREATE INDEX idx_agent_audit_created ON agent_audit_trail(created_at DESC);

-- Function: Calculate agent performance score
CREATE OR REPLACE FUNCTION calculate_agent_performance_score(p_agent_id uuid, p_period_days integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_total_decisions integer;
  v_approved_decisions integer;
  v_overrides integer;
  v_escalations integer;
  v_avg_confidence numeric;
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE approved = true) as approved,
    AVG(confidence_score) as avg_conf
  INTO v_total_decisions, v_approved_decisions, v_avg_confidence
  FROM agent_decisions
  WHERE agent_id = p_agent_id
  AND created_at > now() - (p_period_days || ' days')::interval;
  
  SELECT COUNT(*) INTO v_overrides
  FROM agent_overrides
  WHERE agent_id = p_agent_id
  AND created_at > now() - (p_period_days || ' days')::interval;
  
  SELECT COUNT(*) INTO v_escalations
  FROM agent_escalations
  WHERE agent_id = p_agent_id
  AND created_at > now() - (p_period_days || ' days')::interval;
  
  v_result := jsonb_build_object(
    'total_decisions', COALESCE(v_total_decisions, 0),
    'approved_decisions', COALESCE(v_approved_decisions, 0),
    'approval_rate', CASE WHEN v_total_decisions > 0 THEN ROUND((v_approved_decisions::numeric / v_total_decisions) * 100, 2) ELSE 0 END,
    'overrides', COALESCE(v_overrides, 0),
    'override_rate', CASE WHEN v_total_decisions > 0 THEN ROUND((v_overrides::numeric / v_total_decisions) * 100, 2) ELSE 0 END,
    'escalations', COALESCE(v_escalations, 0),
    'escalation_rate', CASE WHEN v_total_decisions > 0 THEN ROUND((v_escalations::numeric / v_total_decisions) * 100, 2) ELSE 0 END,
    'avg_confidence', ROUND(COALESCE(v_avg_confidence, 0), 2)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if escalation required
CREATE OR REPLACE FUNCTION check_escalation_required(
  p_agent_id uuid,
  p_confidence_score numeric,
  p_financial_impact numeric DEFAULT 0
)
RETURNS jsonb AS $$
DECLARE
  v_agent ai_agents;
  v_threshold agent_risk_thresholds;
  v_escalate boolean := false;
  v_reasons text[] := ARRAY[]::text[];
BEGIN
  SELECT * INTO v_agent FROM ai_agents WHERE id = p_agent_id;
  
  IF v_agent.requires_hitl THEN
    v_escalate := true;
    v_reasons := array_append(v_reasons, 'Agent requires HITL by default');
  END IF;
  
  IF p_confidence_score < v_agent.hitl_confidence_threshold THEN
    v_escalate := true;
    v_reasons := array_append(v_reasons, 'Confidence below threshold: ' || p_confidence_score || ' < ' || v_agent.hitl_confidence_threshold);
  END IF;
  
  IF p_financial_impact > v_agent.max_financial_impact THEN
    v_escalate := true;
    v_reasons := array_append(v_reasons, 'Financial impact exceeds limit: ' || p_financial_impact || ' > ' || v_agent.max_financial_impact);
  END IF;
  
  FOR v_threshold IN 
    SELECT * FROM agent_risk_thresholds 
    WHERE agent_id = p_agent_id AND active = true
  LOOP
    IF v_threshold.action_on_breach IN ('escalate', 'block') THEN
      v_escalate := true;
      v_reasons := array_append(v_reasons, 'Threshold breach: ' || v_threshold.threshold_name);
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'escalate', v_escalate,
    'reasons', v_reasons
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;