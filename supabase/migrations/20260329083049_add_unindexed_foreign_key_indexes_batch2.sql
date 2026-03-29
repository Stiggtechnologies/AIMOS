/*
  # Add Indexes for Unindexed Foreign Keys - Batch 2
  
  Second batch covering employee, employer, equipment, evidence, exercise,
  expansion, expenses, fhir, financial, goal, gym, invoice, job, kpi,
  meeting, metric, okr, patient, practice, product, purchase, rehab,
  rtw, scope, scorecard, and soap tables.
*/

-- emergency_mode_status
CREATE INDEX IF NOT EXISTS idx_emergency_mode_status_activated_by ON emergency_mode_status(activated_by);

-- employee_assignments
CREATE INDEX IF NOT EXISTS idx_employee_assignments_department_id ON employee_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_assignments_reporting_to ON employee_assignments(reporting_to);

-- employer_programs
CREATE INDEX IF NOT EXISTS idx_employer_programs_account_owner_id ON employer_programs(account_owner_id);

-- equipment tables
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment_item_id ON equipment_maintenance(equipment_item_id);
CREATE INDEX IF NOT EXISTS idx_equipment_schedules_equipment_id ON equipment_schedules(equipment_id);

-- evidence tables
CREATE INDEX IF NOT EXISTS idx_evidence_contradiction_log_detected_by ON evidence_contradiction_log(detected_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_evidence_contradiction_log_resolved_by ON evidence_contradiction_log(resolved_by);
CREATE INDEX IF NOT EXISTS idx_evidence_contradiction_log_reviewed_by ON evidence_contradiction_log(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_evidence_synthesis_versions_changed_by ON evidence_synthesis_versions(changed_by);

-- exercise tables
CREATE INDEX IF NOT EXISTS idx_exercise_adherence_log_patient_id ON exercise_adherence_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_exercise_adherence_log_prescription_id ON exercise_adherence_log(prescription_id);
CREATE INDEX IF NOT EXISTS idx_exercise_prescriptions_prescribed_by ON exercise_prescriptions(prescribed_by_user_id);

-- expansion_pipeline
CREATE INDEX IF NOT EXISTS idx_expansion_pipeline_lead_owner_id ON expansion_pipeline(lead_owner_id);

-- expenses
CREATE INDEX IF NOT EXISTS idx_expenses_approved_by ON expenses(approved_by);
CREATE INDEX IF NOT EXISTS idx_expenses_purchase_request_id ON expenses(purchase_request_id);
CREATE INDEX IF NOT EXISTS idx_expenses_rejected_by ON expenses(rejected_by);

-- fhir tables
CREATE INDEX IF NOT EXISTS idx_fhir_event_log_organization_id ON fhir_event_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_fhir_event_log_subscription_id ON fhir_event_log(subscription_id);
CREATE INDEX IF NOT EXISTS idx_fhir_event_subscriptions_created_by ON fhir_event_subscriptions(created_by);
CREATE INDEX IF NOT EXISTS idx_fhir_event_subscriptions_organization_id ON fhir_event_subscriptions(organization_id);

-- financial_forecasts
CREATE INDEX IF NOT EXISTS idx_financial_forecasts_created_by ON financial_forecasts(created_by);

-- goal_nodes
CREATE INDEX IF NOT EXISTS idx_goal_nodes_clinic_id ON goal_nodes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_goal_nodes_owner_user_id ON goal_nodes(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_goal_nodes_parent_id ON goal_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_goal_nodes_region_id ON goal_nodes(region_id);

-- goal_progress_snapshots
CREATE INDEX IF NOT EXISTS idx_goal_progress_snapshots_captured_by ON goal_progress_snapshots(captured_by);

-- gym_access_sessions
CREATE INDEX IF NOT EXISTS idx_gym_access_sessions_supervising_clinician ON gym_access_sessions(supervising_clinician_id);

-- invoice tables
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_service_id ON invoice_line_items(service_id);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment_id ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_voided_by ON invoices(voided_by);

-- job_requisitions
CREATE INDEX IF NOT EXISTS idx_job_requisitions_created_by ON job_requisitions(created_by);

-- kpi tables
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_approved_by ON kpi_definitions(approved_by);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_set_by ON kpi_targets(set_by);
CREATE INDEX IF NOT EXISTS idx_kpi_values_clinic_id ON kpi_values(clinic_id);
CREATE INDEX IF NOT EXISTS idx_kpi_values_organization_id ON kpi_values(organization_id);
CREATE INDEX IF NOT EXISTS idx_kpi_values_provider_user_id ON kpi_values(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_kpi_values_region_id ON kpi_values(region_id);

-- meeting tables
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_linked_goal_id ON meeting_action_items(linked_goal_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_linked_scorecard_metric ON meeting_action_items(linked_scorecard_metric_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_owner_user_id ON meeting_action_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_action_items_session_id ON meeting_action_items(session_id);
CREATE INDEX IF NOT EXISTS idx_meeting_agenda_items_presenter_user_id ON meeting_agenda_items(presenter_user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_agenda_items_session_id ON meeting_agenda_items(session_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_clinic_id ON meeting_sessions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_facilitator_user_id ON meeting_sessions(facilitator_user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_organization_id ON meeting_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_region_id ON meeting_sessions(region_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_scorecard_ref_id ON meeting_sessions(scorecard_ref_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_template_id ON meeting_sessions(template_id);
CREATE INDEX IF NOT EXISTS idx_meeting_templates_organization_id ON meeting_templates(organization_id);

-- metric tables
CREATE INDEX IF NOT EXISTS idx_metric_targets_approved_by ON metric_targets(approved_by);
CREATE INDEX IF NOT EXISTS idx_metric_targets_clinic_id ON metric_targets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_metric_targets_region_id ON metric_targets(region_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_department_id ON metric_values(department_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_provider_id ON metric_values(provider_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_region_id ON metric_values(region_id);

-- okr tables
CREATE INDEX IF NOT EXISTS idx_okr_key_results_owner_id ON okr_key_results(owner_id);
CREATE INDEX IF NOT EXISTS idx_okr_objectives_parent_objective_id ON okr_objectives(parent_objective_id);

-- patient tables
CREATE INDEX IF NOT EXISTS idx_patient_billing_summaries_clinic_id ON patient_billing_summaries(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_exercises_clinician_id ON patient_exercises(clinician_id);
CREATE INDEX IF NOT EXISTS idx_patient_exercises_exercise_id ON patient_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_patient_secure_messages_sender_id ON patient_secure_messages(sender_id);

-- practice_translation_versions
CREATE INDEX IF NOT EXISTS idx_practice_translation_versions_changed_by ON practice_translation_versions(changed_by);

-- product_sales
CREATE INDEX IF NOT EXISTS idx_product_sales_patient_id ON product_sales(patient_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_product_id ON product_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_sold_by_user_id ON product_sales(sold_by_user_id);

-- purchase_requests
CREATE INDEX IF NOT EXISTS idx_purchase_requests_approved_by ON purchase_requests(approved_by);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_rejected_by ON purchase_requests(rejected_by);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_vendor_id ON purchase_requests(vendor_id);

-- rehab_progression_tracking
CREATE INDEX IF NOT EXISTS idx_rehab_progression_tracking_clinic_id ON rehab_progression_tracking(clinic_id);
CREATE INDEX IF NOT EXISTS idx_rehab_progression_tracking_clinician_id ON rehab_progression_tracking(clinician_id);

-- rtw_rts_cases
CREATE INDEX IF NOT EXISTS idx_rtw_rts_cases_assigned_clinician_id ON rtw_rts_cases(assigned_clinician_id);

-- scope_access_policies
CREATE INDEX IF NOT EXISTS idx_scope_access_policies_granted_by ON scope_access_policies(granted_by);

-- scorecard tables
CREATE INDEX IF NOT EXISTS idx_scorecard_metrics_owner_user_id ON scorecard_metrics(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_organization_id ON scorecards(organization_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_owner_user_id ON scorecards(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_region_id ON scorecards(region_id);

-- soap_notes
CREATE INDEX IF NOT EXISTS idx_soap_notes_amended_by ON soap_notes(amended_by);
