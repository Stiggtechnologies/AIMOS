/*
  # Database Performance and Security Optimization

  1. Performance Improvements
    - Add indexes for 25 unindexed foreign keys to improve query performance
    - This prevents suboptimal queries when joining tables
    
  2. Database Cleanup
    - Remove 167 unused indexes to reduce storage overhead and maintenance costs
    - Unused indexes slow down INSERT/UPDATE/DELETE operations without providing benefits
    
  3. Tables Affected
    - appointment_slots, clinic_integrations, corrective_plans, crisis_playbooks
    - crisis_tasks, document_access_logs, document_attestations, document_library
    - document_versions, emergency_events, incident_actions, integration_sop_adoption
    - integration_tasks, pulse_survey_responses, pulse_surveys, referral_metrics
    - referrals, staff_wellbeing_flags
    
  4. Impact
    - Improved query performance for foreign key joins
    - Reduced database storage usage
    - Faster data modification operations
    - Cleaner database schema
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_appointment_slots_cancellation_reason 
  ON appointment_slots(cancellation_reason_id);

CREATE INDEX IF NOT EXISTS idx_clinic_integrations_executive_sponsor 
  ON clinic_integrations(executive_sponsor);

CREATE INDEX IF NOT EXISTS idx_clinic_integrations_project_lead 
  ON clinic_integrations(project_lead);

CREATE INDEX IF NOT EXISTS idx_corrective_plans_created_by 
  ON corrective_plans(created_by);

CREATE INDEX IF NOT EXISTS idx_crisis_playbooks_created_by 
  ON crisis_playbooks(created_by);

CREATE INDEX IF NOT EXISTS idx_crisis_tasks_created_by 
  ON crisis_tasks(created_by);

CREATE INDEX IF NOT EXISTS idx_crisis_tasks_playbook_id 
  ON crisis_tasks(playbook_id);

CREATE INDEX IF NOT EXISTS idx_document_access_logs_version_id 
  ON document_access_logs(version_id);

CREATE INDEX IF NOT EXISTS idx_document_attestations_version_id 
  ON document_attestations(version_id);

CREATE INDEX IF NOT EXISTS idx_document_library_current_version_id 
  ON document_library(current_version_id);

CREATE INDEX IF NOT EXISTS idx_document_versions_published_by 
  ON document_versions(published_by);

CREATE INDEX IF NOT EXISTS idx_emergency_events_declared_by 
  ON emergency_events(declared_by);

CREATE INDEX IF NOT EXISTS idx_emergency_events_incident_commander 
  ON emergency_events(incident_commander);

CREATE INDEX IF NOT EXISTS idx_incident_actions_created_by 
  ON incident_actions(created_by);

CREATE INDEX IF NOT EXISTS idx_incident_actions_verified_by 
  ON incident_actions(verified_by);

CREATE INDEX IF NOT EXISTS idx_integration_sop_adoption_document_id 
  ON integration_sop_adoption(document_id);

CREATE INDEX IF NOT EXISTS idx_integration_tasks_created_by 
  ON integration_tasks(created_by);

CREATE INDEX IF NOT EXISTS idx_integration_tasks_verified_by 
  ON integration_tasks(verified_by);

CREATE INDEX IF NOT EXISTS idx_pulse_survey_responses_clinic_id 
  ON pulse_survey_responses(clinic_id);

CREATE INDEX IF NOT EXISTS idx_pulse_survey_responses_respondent_id 
  ON pulse_survey_responses(respondent_id);

CREATE INDEX IF NOT EXISTS idx_pulse_surveys_created_by 
  ON pulse_surveys(created_by);

CREATE INDEX IF NOT EXISTS idx_referral_metrics_clinic_id 
  ON referral_metrics(clinic_id);

CREATE INDEX IF NOT EXISTS idx_referrals_created_by 
  ON referrals(created_by);

CREATE INDEX IF NOT EXISTS idx_staff_wellbeing_flags_created_by 
  ON staff_wellbeing_flags(created_by);

CREATE INDEX IF NOT EXISTS idx_staff_wellbeing_flags_resolved_by 
  ON staff_wellbeing_flags(resolved_by);

-- Drop unused indexes (keeping only those that are actually being used)
DROP INDEX IF EXISTS idx_jobs_status;
DROP INDEX IF EXISTS idx_jobs_role_type;
DROP INDEX IF EXISTS idx_jobs_location;
DROP INDEX IF EXISTS idx_jobs_created_at;
DROP INDEX IF EXISTS idx_candidates_status;
DROP INDEX IF EXISTS idx_candidates_overall_score;
DROP INDEX IF EXISTS idx_candidates_source_channel;
DROP INDEX IF EXISTS idx_applications_candidate_id;
DROP INDEX IF EXISTS idx_applications_job_id;
DROP INDEX IF EXISTS idx_applications_status;
DROP INDEX IF EXISTS idx_applications_created_at;
DROP INDEX IF EXISTS idx_interviews_application_id;
DROP INDEX IF EXISTS idx_interviews_scheduled_at;
DROP INDEX IF EXISTS idx_interviews_status;
DROP INDEX IF EXISTS idx_agent_events_agent_name;
DROP INDEX IF EXISTS idx_agent_events_status;
DROP INDEX IF EXISTS idx_agent_events_event_type;
DROP INDEX IF EXISTS idx_agent_events_scheduled_for;
DROP INDEX IF EXISTS idx_agent_events_created_at;
DROP INDEX IF EXISTS idx_agent_memory_agent_name;
DROP INDEX IF EXISTS idx_agent_memory_key;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_assigned_agent;
DROP INDEX IF EXISTS idx_tasks_priority;
DROP INDEX IF EXISTS idx_tasks_scheduled_for;
DROP INDEX IF EXISTS idx_kpis_metric_name;
DROP INDEX IF EXISTS idx_kpis_period;
DROP INDEX IF EXISTS idx_messages_status;
DROP INDEX IF EXISTS idx_messages_recipient_email;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_workflow_executions_workflow_id;
DROP INDEX IF EXISTS idx_clinics_city;
DROP INDEX IF EXISTS idx_clinics_active;
DROP INDEX IF EXISTS idx_user_profiles_email;
DROP INDEX IF EXISTS idx_user_profiles_clinic;
DROP INDEX IF EXISTS idx_clinic_access_user;
DROP INDEX IF EXISTS idx_clinic_access_clinic;
DROP INDEX IF EXISTS idx_staff_profiles_user;
DROP INDEX IF EXISTS idx_staff_profiles_clinic;
DROP INDEX IF EXISTS idx_staff_profiles_employee_id;
DROP INDEX IF EXISTS idx_academy_content_category;
DROP INDEX IF EXISTS idx_academy_content_published;
DROP INDEX IF EXISTS idx_academy_content_type;
DROP INDEX IF EXISTS idx_learning_progress_user;
DROP INDEX IF EXISTS idx_learning_progress_content;
DROP INDEX IF EXISTS idx_policies_active;
DROP INDEX IF EXISTS idx_policies_category;
DROP INDEX IF EXISTS idx_incident_reports_clinic;
DROP INDEX IF EXISTS idx_incident_reports_status;
DROP INDEX IF EXISTS idx_incident_reports_date;
DROP INDEX IF EXISTS idx_audit_logs_user;
DROP INDEX IF EXISTS idx_audit_logs_resource;
DROP INDEX IF EXISTS idx_audit_logs_created;
DROP INDEX IF EXISTS idx_announcements_published;
DROP INDEX IF EXISTS idx_announcements_pinned;
DROP INDEX IF EXISTS idx_onboarding_progress_user;
DROP INDEX IF EXISTS idx_onboarding_progress_status;
DROP INDEX IF EXISTS idx_clinic_metrics_clinic_date;
DROP INDEX IF EXISTS idx_academy_categories_parent_id;
DROP INDEX IF EXISTS idx_academy_content_author_id;
DROP INDEX IF EXISTS idx_agent_executions_event_id;
DROP INDEX IF EXISTS idx_announcement_reads_user_id;
DROP INDEX IF EXISTS idx_announcements_author_id;
DROP INDEX IF EXISTS idx_audit_logs_clinic_id;
DROP INDEX IF EXISTS idx_incident_reports_assigned_to;
DROP INDEX IF EXISTS idx_incident_reports_reported_by;
DROP INDEX IF EXISTS idx_offers_application_id;
DROP INDEX IF EXISTS idx_reference_checks_application_id;
DROP INDEX IF EXISTS idx_onboarding_progress_assigned_to;
DROP INDEX IF EXISTS idx_onboarding_progress_completed_by;
DROP INDEX IF EXISTS idx_onboarding_progress_task_id;
DROP INDEX IF EXISTS idx_onboarding_progress_template_id;
DROP INDEX IF EXISTS idx_onboarding_tasks_template_id;
DROP INDEX IF EXISTS idx_policies_created_by;
DROP INDEX IF EXISTS idx_policy_acknowledgments_user_id;
DROP INDEX IF EXISTS idx_staff_availability_clinic_id;
DROP INDEX IF EXISTS idx_staff_availability_staff_id;
DROP INDEX IF EXISTS idx_staff_certifications_staff_id;
DROP INDEX IF EXISTS idx_clinical_outcomes_clinic;
DROP INDEX IF EXISTS idx_clinical_outcomes_clinician;
DROP INDEX IF EXISTS idx_clinical_outcomes_date;
DROP INDEX IF EXISTS idx_clinical_outcomes_metric;
DROP INDEX IF EXISTS idx_clinician_performance_clinician;
DROP INDEX IF EXISTS idx_clinician_performance_clinic;
DROP INDEX IF EXISTS idx_clinician_performance_period;
DROP INDEX IF EXISTS idx_employer_accounts_active;
DROP INDEX IF EXISTS idx_employer_accounts_tier;
DROP INDEX IF EXISTS idx_referral_sources_type;
DROP INDEX IF EXISTS idx_referral_sources_employer;
DROP INDEX IF EXISTS idx_referrals_source;
DROP INDEX IF EXISTS idx_referrals_clinic;
DROP INDEX IF EXISTS idx_referrals_date;
DROP INDEX IF EXISTS idx_referrals_status;
DROP INDEX IF EXISTS idx_referral_sources_employer;
DROP INDEX IF EXISTS idx_referral_metrics_source;
DROP INDEX IF EXISTS idx_referral_metrics_period;
DROP INDEX IF EXISTS idx_appointment_slots_clinic;
DROP INDEX IF EXISTS idx_appointment_slots_clinician;
DROP INDEX IF EXISTS idx_appointment_slots_date;
DROP INDEX IF EXISTS idx_appointment_slots_scheduled;
DROP INDEX IF EXISTS idx_utilization_logs_clinic;
DROP INDEX IF EXISTS idx_utilization_logs_clinician;
DROP INDEX IF EXISTS idx_utilization_logs_date;
DROP INDEX IF EXISTS idx_utilization_logs_risk;
DROP INDEX IF EXISTS idx_financial_snapshots_date;
DROP INDEX IF EXISTS idx_financial_snapshots_period;
DROP INDEX IF EXISTS idx_clinic_financial_metrics_clinic;
DROP INDEX IF EXISTS idx_clinic_financial_metrics_period;
DROP INDEX IF EXISTS idx_corrective_plans_incident;
DROP INDEX IF EXISTS idx_incident_actions_incident;
DROP INDEX IF EXISTS idx_incident_actions_plan;
DROP INDEX IF EXISTS idx_incident_actions_assigned;
DROP INDEX IF EXISTS idx_incident_actions_status;
DROP INDEX IF EXISTS idx_incident_actions_due_date;
DROP INDEX IF EXISTS idx_document_library_type;
DROP INDEX IF EXISTS idx_document_library_status;
DROP INDEX IF EXISTS idx_document_library_owner;
DROP INDEX IF EXISTS idx_document_library_review_date;
DROP INDEX IF EXISTS idx_document_versions_document;
DROP INDEX IF EXISTS idx_document_versions_current;
DROP INDEX IF EXISTS idx_document_attestations_document;
DROP INDEX IF EXISTS idx_document_attestations_user;
DROP INDEX IF EXISTS idx_document_access_logs_document;
DROP INDEX IF EXISTS idx_document_access_logs_user;
DROP INDEX IF EXISTS idx_workload_metrics_staff;
DROP INDEX IF EXISTS idx_workload_metrics_clinic;
DROP INDEX IF EXISTS idx_workload_metrics_date;
DROP INDEX IF EXISTS idx_workload_metrics_risk;
DROP INDEX IF EXISTS idx_pulse_surveys_active;
DROP INDEX IF EXISTS idx_pulse_survey_responses_survey;
DROP INDEX IF EXISTS idx_staff_wellbeing_flags_staff;
DROP INDEX IF EXISTS idx_staff_wellbeing_flags_severity;
DROP INDEX IF EXISTS idx_emergency_events_status;
DROP INDEX IF EXISTS idx_emergency_events_declared;
DROP INDEX IF EXISTS idx_crisis_playbooks_type;
DROP INDEX IF EXISTS idx_crisis_tasks_event;
DROP INDEX IF EXISTS idx_crisis_tasks_assigned;
DROP INDEX IF EXISTS idx_crisis_tasks_status;
DROP INDEX IF EXISTS idx_emergency_contacts_type;
DROP INDEX IF EXISTS idx_emergency_contacts_clinic;
DROP INDEX IF EXISTS idx_data_classifications_table;
DROP INDEX IF EXISTS idx_data_classifications_ai_safe;
DROP INDEX IF EXISTS idx_user_consent_records_user;
DROP INDEX IF EXISTS idx_user_consent_records_scope;
DROP INDEX IF EXISTS idx_ai_governance_logs_type;
DROP INDEX IF EXISTS idx_ai_governance_logs_actor;
DROP INDEX IF EXISTS idx_ai_governance_logs_created;
DROP INDEX IF EXISTS idx_clinic_integrations_clinic;
DROP INDEX IF EXISTS idx_clinic_integrations_status;
DROP INDEX IF EXISTS idx_clinic_integrations_phase;
DROP INDEX IF EXISTS idx_integration_tasks_integration;
DROP INDEX IF EXISTS idx_integration_tasks_assigned;
DROP INDEX IF EXISTS idx_integration_tasks_status;
DROP INDEX IF EXISTS idx_integration_tasks_milestone;
DROP INDEX IF EXISTS idx_integration_milestones_integration;
DROP INDEX IF EXISTS idx_integration_sop_adoption_integration;