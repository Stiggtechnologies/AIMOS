/*
  # Remove Duplicate Indexes - Batch 1

  ## Summary
  Removes duplicate indexes that provide identical functionality to reduce storage and maintenance overhead.

  ## Indexes Removed
  This migration removes one index from each duplicate pair, keeping the one with the better naming convention.

  ### Agent Tables
  - agent_actions: Removing idx_agent_actions_agent (keeping idx_agent_actions_agent_id)
  - agent_audit_trail: Removing idx_agent_audit_agent (keeping idx_agent_audit_trail_agent_id)
  - agent_decisions: Removing idx_agent_decisions_agent (keeping idx_agent_decisions_agent_id)
  - agent_escalations: Removing idx_agent_escalations_agent (keeping idx_agent_escalations_agent_id)
  - agent_execution_context: Removing idx_agent_execution_agent (keeping idx_agent_execution_context_agent_id)
  - agent_execution_metrics: Removing idx_agent_exec_metrics_agent_id (keeping idx_agent_execution_metrics_agent_id)
  - agent_orchestration_log: Removing idx_agent_orchestration_workflow (keeping idx_agent_orchestration_log_workflow_id)
  - agent_overrides: Removing idx_agent_overrides_agent (keeping idx_agent_overrides_agent_id)
  - agent_risk_thresholds: Removing idx_agent_risk_thresholds_agent (keeping idx_agent_risk_thresholds_agent_id)

  ### Analytics Tables
  - analytics_report_definitions: Removing idx_report_definitions_clinic (keeping idx_analytics_report_definitions_clinic_id)

  ### Approval Tables
  - approval_workflow_steps: Removing idx_approval_workflow_steps_workflow (keeping idx_approval_workflow_steps_workflow_id)

  ### Audit Tables
  - audit_events: Removing idx_audit_events_user (keeping idx_audit_events_user_id)
  - audit_log_immutable: Removing idx_audit_immutable_user (keeping idx_audit_log_immutable_user_id)

  ### Campaign and Capacity Tables
  - campaigns: Removing idx_campaigns_clinic (keeping idx_campaigns_clinic_id)
  - capacity_analysis: Removing idx_capacity_analysis_clinic (keeping idx_capacity_analysis_clinic_id)

  ## Performance Impact
  - Reduces index maintenance overhead during writes
  - Frees up disk space
  - Simplifies query optimizer decisions
  - No negative impact on query performance (duplicate functionality)

  ## Notes
  - Only removes exact duplicates (same table, columns, and uniqueness)
  - Kept indexes with more descriptive names
  - Safe to apply in production
*/

-- Agent Tables
DROP INDEX IF EXISTS public.idx_agent_actions_agent;
DROP INDEX IF EXISTS public.idx_agent_audit_agent;
DROP INDEX IF EXISTS public.idx_agent_decisions_agent;
DROP INDEX IF EXISTS public.idx_agent_escalations_agent;
DROP INDEX IF EXISTS public.idx_agent_execution_agent;
DROP INDEX IF EXISTS public.idx_agent_exec_metrics_agent_id;
DROP INDEX IF EXISTS public.idx_agent_orchestration_workflow;
DROP INDEX IF EXISTS public.idx_agent_overrides_agent;
DROP INDEX IF EXISTS public.idx_agent_risk_thresholds_agent;

-- Analytics Tables
DROP INDEX IF EXISTS public.idx_report_definitions_clinic;

-- Approval Tables
DROP INDEX IF EXISTS public.idx_approval_workflow_steps_workflow;

-- Audit Tables
DROP INDEX IF EXISTS public.idx_audit_events_user;
DROP INDEX IF EXISTS public.idx_audit_immutable_user;

-- Campaign and Capacity Tables
DROP INDEX IF EXISTS public.idx_campaigns_clinic;
DROP INDEX IF EXISTS public.idx_capacity_analysis_clinic;
