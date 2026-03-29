/*
  # Add Indexes for Unindexed Foreign Keys - Batch 1
  
  Foreign key columns without indexes cause full table scans on JOIN operations
  and CASCADE operations. This migration adds covering indexes for the first
  batch of ~80 unindexed foreign key columns.
  
  Tables covered:
  - ai_appointments, aim_* tables
  - booking_* tables  
  - budget, call_*, card, clinic_*, clinical_*, crm_*, cre_* tables
*/

-- ai_appointments
CREATE INDEX IF NOT EXISTS idx_ai_appointments_created_by ON ai_appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_appointments_practitioner_id ON ai_appointments(practitioner_id);

-- aim_approval_workflows
CREATE INDEX IF NOT EXISTS idx_aim_approval_workflows_location_id ON aim_approval_workflows(location_id);

-- aim_audit_log
CREATE INDEX IF NOT EXISTS idx_aim_audit_log_location_id ON aim_audit_log(location_id);

-- aim_campaign_alerts
CREATE INDEX IF NOT EXISTS idx_aim_campaign_alerts_campaign_health_id ON aim_campaign_alerts(campaign_health_id);
CREATE INDEX IF NOT EXISTS idx_aim_campaign_alerts_location_id ON aim_campaign_alerts(location_id);
CREATE INDEX IF NOT EXISTS idx_aim_campaign_alerts_resolved_by ON aim_campaign_alerts(resolved_by);

-- aim_claims_metrics
CREATE INDEX IF NOT EXISTS idx_aim_claims_metrics_employer_id ON aim_claims_metrics(employer_id);

-- aim_clinical_assessments
CREATE INDEX IF NOT EXISTS idx_aim_clinical_assessments_clinician_id ON aim_clinical_assessments(clinician_id);

-- aim_content_approval_requests
CREATE INDEX IF NOT EXISTS idx_aim_content_approval_requests_content_item_id ON aim_content_approval_requests(content_item_id);
CREATE INDEX IF NOT EXISTS idx_aim_content_approval_requests_requested_by ON aim_content_approval_requests(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_aim_content_approval_requests_requested_from ON aim_content_approval_requests(requested_from_user_id);

-- aim_content_approvals
CREATE INDEX IF NOT EXISTS idx_aim_content_approvals_approver_id ON aim_content_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_aim_content_approvals_requester_id ON aim_content_approvals(requester_id);
CREATE INDEX IF NOT EXISTS idx_aim_content_approvals_workflow_id ON aim_content_approvals(workflow_id);

-- aim_content_assets
CREATE INDEX IF NOT EXISTS idx_aim_content_assets_content_item_id ON aim_content_assets(content_item_id);

-- aim_content_items
CREATE INDEX IF NOT EXISTS idx_aim_content_items_created_by ON aim_content_items(created_by);
CREATE INDEX IF NOT EXISTS idx_aim_content_items_owner_user_id ON aim_content_items(owner_user_id);

-- aim_content_posts
CREATE INDEX IF NOT EXISTS idx_aim_content_posts_created_by ON aim_content_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_aim_content_posts_last_modified_by ON aim_content_posts(last_modified_by);
CREATE INDEX IF NOT EXISTS idx_aim_content_posts_social_account_id ON aim_content_posts(social_account_id);

-- aim_content_variants
CREATE INDEX IF NOT EXISTS idx_aim_content_variants_content_item_id ON aim_content_variants(content_item_id);

-- aim_early_intervention
CREATE INDEX IF NOT EXISTS idx_aim_early_intervention_employer_id ON aim_early_intervention(employer_id);
CREATE INDEX IF NOT EXISTS idx_aim_early_intervention_patient_id ON aim_early_intervention(patient_id);

-- aim_employers
CREATE INDEX IF NOT EXISTS idx_aim_employers_primary_clinic_id ON aim_employers(primary_clinic_id);

-- aim_performance_analytics
CREATE INDEX IF NOT EXISTS idx_aim_performance_analytics_patient_id ON aim_performance_analytics(patient_id);

-- aim_performance_programs
CREATE INDEX IF NOT EXISTS idx_aim_performance_programs_clinic_id ON aim_performance_programs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_aim_performance_programs_prescribed_by ON aim_performance_programs(prescribed_by);

-- aim_performance_scores
CREATE INDEX IF NOT EXISTS idx_aim_performance_scores_patient_id ON aim_performance_scores(patient_id);

-- aim_policy_rules
CREATE INDEX IF NOT EXISTS idx_aim_policy_rules_created_by ON aim_policy_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_aim_policy_rules_location_id ON aim_policy_rules(location_id);

-- aim_post_media
CREATE INDEX IF NOT EXISTS idx_aim_post_media_post_id ON aim_post_media(post_id);

-- aim_publish_jobs
CREATE INDEX IF NOT EXISTS idx_aim_publish_jobs_content_item_id ON aim_publish_jobs(content_item_id);
CREATE INDEX IF NOT EXISTS idx_aim_publish_jobs_content_variant_id ON aim_publish_jobs(content_variant_id);
CREATE INDEX IF NOT EXISTS idx_aim_publish_jobs_idempotency_key_id ON aim_publish_jobs(idempotency_key_id);

-- aim_publish_results
CREATE INDEX IF NOT EXISTS idx_aim_publish_results_publish_job_id ON aim_publish_results(publish_job_id);

-- aim_response_templates
CREATE INDEX IF NOT EXISTS idx_aim_response_templates_created_by ON aim_response_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_aim_response_templates_location_id ON aim_response_templates(location_id);

-- aim_review_approval_requests
CREATE INDEX IF NOT EXISTS idx_aim_review_approval_requests_draft_id ON aim_review_approval_requests(draft_id);
CREATE INDEX IF NOT EXISTS idx_aim_review_approval_requests_requested_from ON aim_review_approval_requests(requested_from_user_id);
CREATE INDEX IF NOT EXISTS idx_aim_review_approval_requests_review_id ON aim_review_approval_requests(review_id);

-- aim_review_drafts
CREATE INDEX IF NOT EXISTS idx_aim_review_drafts_drafted_by ON aim_review_drafts(drafted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_aim_review_drafts_review_id ON aim_review_drafts(review_id);

-- aim_review_flags
CREATE INDEX IF NOT EXISTS idx_aim_review_flags_review_id ON aim_review_flags(review_id);

-- aim_review_triage
CREATE INDEX IF NOT EXISTS idx_aim_review_triage_assigned_to ON aim_review_triage(assigned_to);

-- aim_workflow_exceptions
CREATE INDEX IF NOT EXISTS idx_aim_workflow_exceptions_owner_user_id ON aim_workflow_exceptions(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_aim_workflow_exceptions_workflow_run_id ON aim_workflow_exceptions(workflow_run_id);

-- aim_workforce_risks
CREATE INDEX IF NOT EXISTS idx_aim_workforce_risks_worker_patient_id ON aim_workforce_risks(worker_patient_id);

-- booking_audit_events
CREATE INDEX IF NOT EXISTS idx_booking_audit_events_booking_service_id ON booking_audit_events(booking_service_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_events_clinic_id ON booking_audit_events(clinic_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_events_hold_id ON booking_audit_events(hold_id);

-- booking_intake_submissions
CREATE INDEX IF NOT EXISTS idx_booking_intake_submissions_booking_service_id ON booking_intake_submissions(booking_service_id);
CREATE INDEX IF NOT EXISTS idx_booking_intake_submissions_clinic_id ON booking_intake_submissions(clinic_id);

-- booking_services
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON booking_services(service_id);

-- booking_slot_holds
CREATE INDEX IF NOT EXISTS idx_booking_slot_holds_booking_service_id ON booking_slot_holds(booking_service_id);
CREATE INDEX IF NOT EXISTS idx_booking_slot_holds_provider_id ON booking_slot_holds(provider_id);

-- budget_line_items
CREATE INDEX IF NOT EXISTS idx_budget_line_items_clinic_id ON budget_line_items(clinic_id);

-- call_agent_config
CREATE INDEX IF NOT EXISTS idx_call_agent_config_clinic_location_id ON call_agent_config(clinic_location_id);

-- call_agent_events
CREATE INDEX IF NOT EXISTS idx_call_agent_events_appointment_id ON call_agent_events(appointment_id);
CREATE INDEX IF NOT EXISTS idx_call_agent_events_lead_id ON call_agent_events(lead_id);

-- call_sessions
CREATE INDEX IF NOT EXISTS idx_call_sessions_assigned_location_id ON call_sessions(assigned_location_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_assigned_staff_id ON call_sessions(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_reviewed_by ON call_sessions(reviewed_by);

-- card_transactions
CREATE INDEX IF NOT EXISTS idx_card_transactions_category_id ON card_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_card_transactions_reconciled_by ON card_transactions(reconciled_by);

-- clinic_budget_allocations
CREATE INDEX IF NOT EXISTS idx_clinic_budget_allocations_created_by ON clinic_budget_allocations(created_by);

-- clinic_expansion_pipeline
CREATE INDEX IF NOT EXISTS idx_clinic_expansion_pipeline_owner_user_id ON clinic_expansion_pipeline(owner_user_id);

-- clinical_assessments
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_appointment_id ON clinical_assessments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_clinician_id ON clinical_assessments(clinician_id);
CREATE INDEX IF NOT EXISTS idx_clinical_assessments_reviewed_by ON clinical_assessments(reviewed_by);

-- cre tables
CREATE INDEX IF NOT EXISTS idx_cre_integration_tasks_assigned_to ON cre_integration_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cre_launch_projects_project_manager_id ON cre_launch_projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_cre_launch_projects_template_id ON cre_launch_projects(template_id);
CREATE INDEX IF NOT EXISTS idx_cre_launch_tasks_assigned_to ON cre_launch_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cre_launch_tasks_template_id ON cre_launch_tasks(template_id);

-- crm tables
CREATE INDEX IF NOT EXISTS idx_crm_channel_budgets_clinic_id ON crm_channel_budgets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_activities_performed_by ON crm_lead_activities(performed_by);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_preferred_location_id ON crm_leads(preferred_location_id);

-- document_read_receipts
CREATE INDEX IF NOT EXISTS idx_document_read_receipts_document_id ON document_read_receipts(document_id);
