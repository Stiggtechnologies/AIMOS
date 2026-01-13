/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes to foreign key columns used in joins
    - Add indexes to columns used in RLS policies
    - Focus on high-traffic tables and frequently joined columns

  2. Critical Indexes
    - User and clinic relationship columns
    - Agent and workflow relationship columns
    - CRM and growth tables
    - Research and clinical intelligence tables
*/

-- Agent tables foreign key indexes
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_id ON agent_actions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_audit_trail_agent_id ON agent_audit_trail(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_audit_trail_user_id ON agent_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent_id ON agent_decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_escalations_agent_id ON agent_escalations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_context_agent_id ON agent_execution_context(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_agent_id ON agent_execution_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_hitl_queue_agent_id ON agent_hitl_queue(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_kpis_agent_id ON agent_kpis(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_orchestration_log_workflow_id ON agent_orchestration_log(workflow_id);
CREATE INDEX IF NOT EXISTS idx_agent_overrides_agent_id ON agent_overrides(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_risk_thresholds_agent_id ON agent_risk_thresholds(agent_id);

-- Workflow and approval tables
CREATE INDEX IF NOT EXISTS idx_approval_workflow_steps_workflow_id ON approval_workflow_steps(workflow_id);

-- Audit and governance indexes
CREATE INDEX IF NOT EXISTS idx_ai_governance_logs_user_id ON ai_governance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_immutable_user_id ON audit_log_immutable(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_id ON audit_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_data_modification_audit_user_id ON data_modification_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_data_modification_audit_clinic_id ON data_modification_audit(clinic_id);

-- Clinic access and user permissions
CREATE INDEX IF NOT EXISTS idx_clinic_access_user_id ON clinic_access(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_access_clinic_id ON clinic_access(clinic_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_attestations_user_id ON document_attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_document_read_receipts_user_id ON document_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_access_log_user_id ON feature_access_log(user_id);

-- CRM tables foreign key indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_clinic_id ON crm_leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_campaign_id ON crm_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_clinic_id ON crm_campaigns(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_alerts_clinic_id ON crm_alerts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_alerts_lead_id ON crm_alerts(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_alerts_campaign_id ON crm_alerts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_bookings_clinic_id ON crm_bookings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_bookings_lead_id ON crm_bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_capacity_rules_clinic_id ON crm_capacity_rules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_capacity_snapshots_clinic_id ON crm_capacity_snapshots(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_cases_clinic_id ON crm_cases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_cases_lead_id ON crm_cases(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_lead_id ON crm_follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_keywords_campaign_id ON crm_keywords(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_tags_lead_id ON crm_lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_tracking_clinic_id ON crm_revenue_tracking(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_staff_performance_clinic_id ON crm_staff_performance(clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_staff_performance_user_id ON crm_staff_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);

-- Clinic operations indexes
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_aging_clinic_id ON accounts_receivable_aging(clinic_id);
CREATE INDEX IF NOT EXISTS idx_analytics_report_definitions_clinic_id ON analytics_report_definitions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_clinic_id ON anomaly_detections(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_clinic_id ON appointment_slots(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_flags_clinic_id ON audit_flags(clinic_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_clinic_id ON billing_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_lead_id ON billing_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_clinic_id ON bookings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bottleneck_detection_clinic_id ON bottleneck_detection(clinic_id);
CREATE INDEX IF NOT EXISTS idx_cadence_executions_clinic_id ON cadence_executions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_clinic_id ON campaigns(clinic_id);
CREATE INDEX IF NOT EXISTS idx_capacity_analysis_clinic_id ON capacity_analysis(clinic_id);
CREATE INDEX IF NOT EXISTS idx_capacity_rules_clinic_id ON capacity_rules(clinic_id);

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_capex_requests_clinic_id ON capex_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_capital_allocation_history_clinic_id ON capital_allocation_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_capital_investments_clinic_id ON capital_investments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_capital_requests_clinic_id ON capital_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_forecasts_clinic_id ON cash_flow_forecasts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_financial_metrics_clinic_id ON clinic_financial_metrics(clinic_id);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_clinic_id ON financial_alerts(clinic_id);

-- Clinical operations indexes
CREATE INDEX IF NOT EXISTS idx_care_plans_clinic_id ON care_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_claims_clinic_id ON claims(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_integrations_clinic_id ON clinic_integrations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_launches_clinic_id ON clinic_launches(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_metrics_clinic_id ON clinic_metrics(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_performance_snapshots_clinic_id ON clinic_performance_snapshots(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_rankings_clinic_id ON clinic_rankings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinical_outcomes_clinic_id ON clinical_outcomes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinician_availability_clinic_id ON clinician_availability(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinician_performance_snapshots_clinic_id ON clinician_performance_snapshots(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinician_schedules_clinic_id ON clinician_schedules(clinic_id);

-- Quality and compliance indexes
CREATE INDEX IF NOT EXISTS idx_churn_risk_indicators_clinic_id ON churn_risk_indicators(clinic_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_signals_clinic_id ON churn_risk_signals(clinic_id);
CREATE INDEX IF NOT EXISTS idx_complaint_themes_clinic_id ON complaint_themes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_clinic_id ON compliance_assessments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_contract_renewal_alerts_clinic_id ON contract_renewal_alerts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_corrective_action_responses_clinic_id ON corrective_action_responses(clinic_id);

-- Operations and facilities indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_clinic_id ON emergency_contacts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_emergency_mode_status_clinic_id ON emergency_mode_status(clinic_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_clinic_id ON equipment_maintenance(clinic_id);
CREATE INDEX IF NOT EXISTS idx_equipment_schedules_clinic_id ON equipment_schedules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_experience_improvement_actions_clinic_id ON experience_improvement_actions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_facility_rooms_clinic_id ON facility_rooms(clinic_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_clinic_access_user_clinic ON clinic_access(user_id, clinic_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status_created ON crm_leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_clinic_status ON crm_leads(clinic_id, status);