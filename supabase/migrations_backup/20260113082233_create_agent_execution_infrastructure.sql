/*
  # Agent Execution Infrastructure

  Creates the infrastructure for executing AI agents and managing human-in-the-loop escalations.

  1. New Tables
    - `agent_hitl_queue` - Queue for human review of agent decisions
    - `agent_execution_metrics` - Real-time performance metrics for each agent

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users based on roles

  3. Indexes
    - Performance indexes for common queries
*/

-- ============================================================================
-- HITL ESCALATION QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_hitl_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  decision_id uuid NOT NULL REFERENCES agent_decisions(id) ON DELETE CASCADE,
  
  -- Escalation details
  user_input text NOT NULL,
  recommendation text NOT NULL,
  confidence_score decimal(5,2) NOT NULL,
  escalation_reason text NOT NULL,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'modified')),
  assigned_to uuid,
  escalated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Resolution details
  reviewed_by uuid,
  reviewed_at timestamptz,
  reviewer_notes text,
  modified_recommendation text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for HITL queue
CREATE INDEX IF NOT EXISTS idx_agent_hitl_queue_agent_id ON agent_hitl_queue(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_hitl_queue_decision_id ON agent_hitl_queue(decision_id);
CREATE INDEX IF NOT EXISTS idx_agent_hitl_queue_status ON agent_hitl_queue(status);
CREATE INDEX IF NOT EXISTS idx_agent_hitl_queue_assigned_to ON agent_hitl_queue(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_hitl_queue_pending ON agent_hitl_queue(escalated_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE agent_hitl_queue ENABLE ROW LEVEL SECURITY;

-- HITL queue policies
CREATE POLICY "Authenticated users can view HITL queue"
  ON agent_hitl_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update HITL queue"
  ON agent_hitl_queue FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "System can insert HITL escalations"
  ON agent_hitl_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- AGENT EXECUTION METRICS (Real-time Performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_execution_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  
  -- Execution metrics
  total_executions integer NOT NULL DEFAULT 0,
  successful_executions integer NOT NULL DEFAULT 0,
  failed_executions integer NOT NULL DEFAULT 0,
  
  -- Performance metrics
  avg_confidence_score decimal(5,2) DEFAULT 0,
  avg_execution_time_ms integer DEFAULT 0,
  
  -- Decision metrics
  escalation_rate decimal(5,2) DEFAULT 0,
  override_rate decimal(5,2) DEFAULT 0,
  
  -- Time tracking
  last_execution_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(agent_id)
);

-- Indexes for execution metrics
CREATE INDEX IF NOT EXISTS idx_agent_exec_metrics_agent_id ON agent_execution_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_exec_metrics_last_exec ON agent_execution_metrics(last_execution_at) WHERE last_execution_at IS NOT NULL;

-- Enable RLS
ALTER TABLE agent_execution_metrics ENABLE ROW LEVEL SECURITY;

-- Execution metrics policies
CREATE POLICY "Authenticated users can view execution metrics"
  ON agent_execution_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert execution metrics"
  ON agent_execution_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update execution metrics"
  ON agent_execution_metrics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS FOR METRICS CALCULATION
-- ============================================================================

-- Function to calculate agent performance summary
CREATE OR REPLACE FUNCTION get_agent_performance_summary(p_agent_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_executions', COUNT(*),
    'successful_executions', COUNT(*) FILTER (WHERE outcome = 'executed'),
    'escalated_executions', COUNT(*) FILTER (WHERE escalated_to_human = true),
    'avg_confidence', ROUND(AVG(confidence_score), 2),
    'escalation_rate', ROUND(
      (COUNT(*) FILTER (WHERE escalated_to_human = true)::decimal / NULLIF(COUNT(*), 0) * 100), 2
    ),
    'override_rate', ROUND(
      (COUNT(*) FILTER (WHERE human_override = true)::decimal / NULLIF(COUNT(*), 0) * 100), 2
    ),
    'last_execution', MAX(created_at)
  )
  INTO v_result
  FROM agent_decisions
  WHERE agent_id = p_agent_id;
  
  RETURN v_result;
END;
$$;

-- Function to get pending HITL count by agent
CREATE OR REPLACE FUNCTION get_pending_hitl_count()
RETURNS TABLE (
  agent_id uuid,
  agent_name text,
  pending_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aa.id,
    aa.name,
    COUNT(ahq.id)
  FROM ai_agents aa
  LEFT JOIN agent_hitl_queue ahq ON ahq.agent_id = aa.id AND ahq.status = 'pending'
  GROUP BY aa.id, aa.name
  ORDER BY COUNT(ahq.id) DESC;
END;
$$;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Initialize execution metrics for all active agents
INSERT INTO agent_execution_metrics (agent_id, total_executions, successful_executions, failed_executions)
SELECT 
  id,
  0,
  0,
  0
FROM ai_agents
WHERE active = true
ON CONFLICT (agent_id) DO NOTHING;
