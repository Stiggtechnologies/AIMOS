/*
  # Fix Unindexed Foreign Keys - Batch 1

  ## Summary
  Adds missing indexes for foreign key columns to improve query performance and join operations.

  ## Tables Updated
  - agent_actions (reverted_by)
  - agent_decisions (approved_by)
  - agent_escalations (decision_id, resolved_by)
  - agent_orchestration_log (created_by)
  - agent_overrides (decision_id)
  - ai_agents (created_by)
  - authority_delegations (approved_by, authority_id, clinic_scope, revoked_by, sod_reviewed_by)
  - baseline_versions (baseline_id, changed_by)
  - causal_hypotheses (validated_by)
  - cii_learning_repository (decision_id, pilot_id)
  - comparative_insights (acknowledged_by)
  - crm_alerts (acknowledged_by)
  - crm_bookings (booked_by, clinician_id, service_line_id)

  ## Performance Impact
  - Improves JOIN performance on foreign key columns
  - Speeds up CASCADE operations
  - Enhances referential integrity checks
  - Reduces full table scans on related queries

  ## Notes
  - Uses IF NOT EXISTS to safely add indexes
  - Naming convention: idx_<table>_<column>_fkey
*/

-- agent_actions
CREATE INDEX IF NOT EXISTS idx_agent_actions_reverted_by_fkey
  ON public.agent_actions(reverted_by);

-- agent_decisions
CREATE INDEX IF NOT EXISTS idx_agent_decisions_approved_by_fkey
  ON public.agent_decisions(approved_by);

-- agent_escalations
CREATE INDEX IF NOT EXISTS idx_agent_escalations_decision_id_fkey
  ON public.agent_escalations(decision_id);

CREATE INDEX IF NOT EXISTS idx_agent_escalations_resolved_by_fkey
  ON public.agent_escalations(resolved_by);

-- agent_orchestration_log
CREATE INDEX IF NOT EXISTS idx_agent_orchestration_log_created_by_fkey
  ON public.agent_orchestration_log(created_by);

-- agent_overrides
CREATE INDEX IF NOT EXISTS idx_agent_overrides_decision_id_fkey
  ON public.agent_overrides(decision_id);

-- ai_agents
CREATE INDEX IF NOT EXISTS idx_ai_agents_created_by_fkey
  ON public.ai_agents(created_by);

-- authority_delegations
CREATE INDEX IF NOT EXISTS idx_authority_delegations_approved_by_fkey
  ON public.authority_delegations(approved_by);

CREATE INDEX IF NOT EXISTS idx_authority_delegations_authority_id_fkey
  ON public.authority_delegations(authority_id);

CREATE INDEX IF NOT EXISTS idx_authority_delegations_clinic_scope_fkey
  ON public.authority_delegations(clinic_scope);

CREATE INDEX IF NOT EXISTS idx_authority_delegations_revoked_by_fkey
  ON public.authority_delegations(revoked_by);

CREATE INDEX IF NOT EXISTS idx_authority_delegations_sod_reviewed_by_fkey
  ON public.authority_delegations(sod_reviewed_by);

-- baseline_versions
CREATE INDEX IF NOT EXISTS idx_baseline_versions_baseline_id_fkey
  ON public.baseline_versions(baseline_id);

CREATE INDEX IF NOT EXISTS idx_baseline_versions_changed_by_fkey
  ON public.baseline_versions(changed_by);

-- causal_hypotheses
CREATE INDEX IF NOT EXISTS idx_causal_hypotheses_validated_by_fkey
  ON public.causal_hypotheses(validated_by);

-- cii_learning_repository
CREATE INDEX IF NOT EXISTS idx_cii_learning_repository_decision_id_fkey
  ON public.cii_learning_repository(decision_id);

CREATE INDEX IF NOT EXISTS idx_cii_learning_repository_pilot_id_fkey
  ON public.cii_learning_repository(pilot_id);

-- comparative_insights
CREATE INDEX IF NOT EXISTS idx_comparative_insights_acknowledged_by_fkey
  ON public.comparative_insights(acknowledged_by);

-- crm_alerts
CREATE INDEX IF NOT EXISTS idx_crm_alerts_acknowledged_by_fkey
  ON public.crm_alerts(acknowledged_by);

-- crm_bookings
CREATE INDEX IF NOT EXISTS idx_crm_bookings_booked_by_fkey
  ON public.crm_bookings(booked_by);

CREATE INDEX IF NOT EXISTS idx_crm_bookings_clinician_id_fkey
  ON public.crm_bookings(clinician_id);

CREATE INDEX IF NOT EXISTS idx_crm_bookings_service_line_id_fkey
  ON public.crm_bookings(service_line_id);
