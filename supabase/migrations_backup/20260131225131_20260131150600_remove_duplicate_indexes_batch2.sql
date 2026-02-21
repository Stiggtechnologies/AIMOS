/*
  # Remove Duplicate Indexes - Batch 2

  ## Summary
  Continues removing duplicate indexes from clinic, care, and CRM tables.

  ## Indexes Removed

  ### Capital and Care Tables
  - capital_investments: Removing idx_capital_investments_clinic (keeping idx_capital_investments_clinic_id)
  - capital_requests: Removing idx_capital_requests_clinic (keeping idx_capital_requests_clinic_id)
  - care_pathway_templates: Removing idx_care_pathways_domain (keeping idx_care_pathway_templates_domain)
  - care_plans: Removing idx_care_plans_clinic (keeping idx_care_plans_clinic_id)

  ### Churn and Claims Tables
  - churn_risk_indicators: Removing idx_churn_risk_indicators_clinic (keeping idx_churn_risk_indicators_clinic_id)
  - claims: Removing idx_claims_clinic (keeping idx_claims_clinic_id)

  ### Clinic Tables
  - clinic_launches: Removing idx_clinic_launches_clinic (keeping idx_clinic_launches_clinic_id)
  - clinic_performance_snapshots: Removing idx_snapshots_clinic (keeping idx_clinic_performance_snapshots_clinic_id)
  - clinic_rankings: Removing idx_rankings_clinic (keeping idx_clinic_rankings_clinic_id)

  ### Clinician Tables
  - clinician_availability: Removing idx_clinician_availability_clinic (keeping idx_clinician_availability_clinic_id)
  - clinician_schedules: Removing idx_clinician_schedules_clinic (keeping idx_clinician_schedules_clinic_id)

  ### Compliance Tables
  - compliance_assessments: Removing idx_compliance_assessments_clinic (keeping idx_compliance_assessments_clinic_id)
  - corrective_action_responses: Removing idx_corrective_action_responses_clinic (keeping idx_corrective_action_responses_clinic_id)

  ### CRM Tables
  - crm_bookings: Removing idx_crm_bookings_clinic (keeping idx_crm_bookings_clinic_id)
  - crm_bookings: Removing idx_crm_bookings_lead (keeping idx_crm_bookings_lead_id)

  ## Performance Impact
  - Reduces index maintenance overhead
  - Frees up disk space
  - No impact on query performance

  ## Notes
  - Kept indexes with full descriptive names including table name
  - Safe to apply in production
*/

-- Capital and Care Tables
DROP INDEX IF EXISTS public.idx_capital_investments_clinic;
DROP INDEX IF EXISTS public.idx_capital_requests_clinic;
DROP INDEX IF EXISTS public.idx_care_pathways_domain;
DROP INDEX IF EXISTS public.idx_care_plans_clinic;

-- Churn and Claims Tables
DROP INDEX IF EXISTS public.idx_churn_risk_indicators_clinic;
DROP INDEX IF EXISTS public.idx_claims_clinic;

-- Clinic Tables
DROP INDEX IF EXISTS public.idx_clinic_launches_clinic;
DROP INDEX IF EXISTS public.idx_snapshots_clinic;
DROP INDEX IF EXISTS public.idx_rankings_clinic;

-- Clinician Tables
DROP INDEX IF EXISTS public.idx_clinician_availability_clinic;
DROP INDEX IF EXISTS public.idx_clinician_schedules_clinic;

-- Compliance Tables
DROP INDEX IF EXISTS public.idx_compliance_assessments_clinic;
DROP INDEX IF EXISTS public.idx_corrective_action_responses_clinic;

-- CRM Tables
DROP INDEX IF EXISTS public.idx_crm_bookings_clinic;
DROP INDEX IF EXISTS public.idx_crm_bookings_lead;
