/*
  # Fix Unindexed Foreign Keys - Batch 2

  ## Summary
  Adds missing indexes for foreign key columns to improve query performance (continuation).

  ## Tables Updated
  - crm_case_visits (booking_id, clinician_id)
  - crm_cases (clv_tier_id, payor_type_id, service_line_id)
  - crm_cash_lag_tracking (case_id)
  - crm_leads (clv_tier_id, contacted_by, keyword_id, lead_source_id, payor_type_id)
  - crm_revenue_tracking (case_id, payor_type_id, service_line_id)
  - crm_upsells (offered_by, visit_id)
  - delegation_audit_log (performed_by)
  - evidence_flags (digest_id)
  - excellence_baselines (created_by)
  - onboarding_steps (assigned_to)
  - performance_deviations (acknowledged_by, baseline_id)
  - rollout_decisions (attribution_id, decided_by)
  - root_cause_analyses (deviation_id)
  - scheduler_approvals (clinic_id)
  - scheduler_audit_log (actor_id, approval_id)

  ## Performance Impact
  - Improves JOIN performance on foreign key columns
  - Speeds up CASCADE operations
  - Reduces full table scans

  ## Notes
  - Uses IF NOT EXISTS to safely add indexes
  - Naming convention: idx_<table>_<column>_fkey
*/

-- crm_case_visits
CREATE INDEX IF NOT EXISTS idx_crm_case_visits_booking_id_fkey
  ON public.crm_case_visits(booking_id);

CREATE INDEX IF NOT EXISTS idx_crm_case_visits_clinician_id_fkey
  ON public.crm_case_visits(clinician_id);

-- crm_cases
CREATE INDEX IF NOT EXISTS idx_crm_cases_clv_tier_id_fkey
  ON public.crm_cases(clv_tier_id);

CREATE INDEX IF NOT EXISTS idx_crm_cases_payor_type_id_fkey
  ON public.crm_cases(payor_type_id);

CREATE INDEX IF NOT EXISTS idx_crm_cases_service_line_id_fkey
  ON public.crm_cases(service_line_id);

-- crm_cash_lag_tracking
CREATE INDEX IF NOT EXISTS idx_crm_cash_lag_tracking_case_id_fkey
  ON public.crm_cash_lag_tracking(case_id);

-- crm_leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_clv_tier_id_fkey
  ON public.crm_leads(clv_tier_id);

CREATE INDEX IF NOT EXISTS idx_crm_leads_contacted_by_fkey
  ON public.crm_leads(contacted_by);

CREATE INDEX IF NOT EXISTS idx_crm_leads_keyword_id_fkey
  ON public.crm_leads(keyword_id);

CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_source_id_fkey
  ON public.crm_leads(lead_source_id);

CREATE INDEX IF NOT EXISTS idx_crm_leads_payor_type_id_fkey
  ON public.crm_leads(payor_type_id);

-- crm_revenue_tracking
CREATE INDEX IF NOT EXISTS idx_crm_revenue_tracking_case_id_fkey
  ON public.crm_revenue_tracking(case_id);

CREATE INDEX IF NOT EXISTS idx_crm_revenue_tracking_payor_type_id_fkey
  ON public.crm_revenue_tracking(payor_type_id);

CREATE INDEX IF NOT EXISTS idx_crm_revenue_tracking_service_line_id_fkey
  ON public.crm_revenue_tracking(service_line_id);

-- crm_upsells
CREATE INDEX IF NOT EXISTS idx_crm_upsells_offered_by_fkey
  ON public.crm_upsells(offered_by);

CREATE INDEX IF NOT EXISTS idx_crm_upsells_visit_id_fkey
  ON public.crm_upsells(visit_id);

-- delegation_audit_log
CREATE INDEX IF NOT EXISTS idx_delegation_audit_log_performed_by_fkey
  ON public.delegation_audit_log(performed_by);

-- evidence_flags
CREATE INDEX IF NOT EXISTS idx_evidence_flags_digest_id_fkey
  ON public.evidence_flags(digest_id);

-- excellence_baselines
CREATE INDEX IF NOT EXISTS idx_excellence_baselines_created_by_fkey
  ON public.excellence_baselines(created_by);

-- onboarding_steps
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_assigned_to_fkey
  ON public.onboarding_steps(assigned_to);

-- performance_deviations
CREATE INDEX IF NOT EXISTS idx_performance_deviations_acknowledged_by_fkey
  ON public.performance_deviations(acknowledged_by);

CREATE INDEX IF NOT EXISTS idx_performance_deviations_baseline_id_fkey
  ON public.performance_deviations(baseline_id);

-- rollout_decisions
CREATE INDEX IF NOT EXISTS idx_rollout_decisions_attribution_id_fkey
  ON public.rollout_decisions(attribution_id);

CREATE INDEX IF NOT EXISTS idx_rollout_decisions_decided_by_fkey
  ON public.rollout_decisions(decided_by);

-- root_cause_analyses
CREATE INDEX IF NOT EXISTS idx_root_cause_analyses_deviation_id_fkey
  ON public.root_cause_analyses(deviation_id);

-- scheduler_approvals
CREATE INDEX IF NOT EXISTS idx_scheduler_approvals_clinic_id_fkey
  ON public.scheduler_approvals(clinic_id);

-- scheduler_audit_log
CREATE INDEX IF NOT EXISTS idx_scheduler_audit_log_actor_id_fkey
  ON public.scheduler_audit_log(actor_id);

CREATE INDEX IF NOT EXISTS idx_scheduler_audit_log_approval_id_fkey
  ON public.scheduler_audit_log(approval_id);
