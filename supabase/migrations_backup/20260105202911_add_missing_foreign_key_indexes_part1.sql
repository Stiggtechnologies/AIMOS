/*
  # Add Missing Foreign Key Indexes - Part 1

  1. Performance Issue
    - Multiple tables have foreign keys without covering indexes
    - This leads to suboptimal query performance on joins and lookups
    - Adding indexes to improve query performance

  2. Tables Fixed (Part 1 of 3)
    - anomaly_detections (affected_user_id, assigned_to_id, clinic_id)
    - approval_workflows (threshold_id)
    - audit_flags (assigned_to_id, clinic_id)
    - audit_pack_documents (updated_by_id)
    - bottleneck_detection (assigned_to, clinic_id)
    - buyer_readiness_checklist (owner_id)
    - campaigns (channel_id, created_by)
    - capex_requests (clinic_id, requested_by_id)
    - capital_allocation_history (clinic_id)
    - capital_investments (request_id)
    - churn_risk_signals (assigned_to_id, clinic_id)
    - clinic_reinvestment_plans (approved_by_id, clinic_id)
    - complaint_themes (clinic_id, owner_id)
    - contract_renewal_alerts (assigned_to_id, clinic_id, contract_id)
    - cross_clinic_alignment (clinic_id, okr_id)
    - data_quality_alerts (assigned_to_id)
    - dependency_mapping (dependent_system_id, primary_system_id)
    - duty_violations (rule_id)
    - growth_engagement_checklists (created_by)
    - growth_outreach_scripts (created_by)
    - growth_playbook_templates (created_by)
    - growth_playbooks (created_by)
    - incomplete_workflows (assigned_to_id, clinic_id)
    - intake_actions (action_by, intake_id)
    - intake_assignments (assigned_to, clinic_id)
    - intake_outcomes (assigned_clinician, intake_id)
    - intake_pipeline (assigned_to, lead_id)
    - investment_approvals (approver_id, capex_request_id)
    - knowledge_gaps (identified_by_id, owner_id)
    - leads (campaign_id, channel_id)

  3. Index Naming Convention
    - idx_tablename_columnname for single column indexes
*/

-- anomaly_detections
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_affected_user_id ON anomaly_detections(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_assigned_to_id ON anomaly_detections(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_clinic_id ON anomaly_detections(clinic_id);

-- approval_workflows
CREATE INDEX IF NOT EXISTS idx_approval_workflows_threshold_id ON approval_workflows(threshold_id);

-- audit_flags
CREATE INDEX IF NOT EXISTS idx_audit_flags_assigned_to_id ON audit_flags(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_audit_flags_clinic_id ON audit_flags(clinic_id);

-- audit_pack_documents
CREATE INDEX IF NOT EXISTS idx_audit_pack_documents_updated_by_id ON audit_pack_documents(updated_by_id);

-- bottleneck_detection
CREATE INDEX IF NOT EXISTS idx_bottleneck_detection_assigned_to ON bottleneck_detection(assigned_to);
CREATE INDEX IF NOT EXISTS idx_bottleneck_detection_clinic_id ON bottleneck_detection(clinic_id);

-- buyer_readiness_checklist
CREATE INDEX IF NOT EXISTS idx_buyer_readiness_checklist_owner_id ON buyer_readiness_checklist(owner_id);

-- campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_channel_id ON campaigns(channel_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);

-- capex_requests
CREATE INDEX IF NOT EXISTS idx_capex_requests_clinic_id ON capex_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_capex_requests_requested_by_id ON capex_requests(requested_by_id);

-- capital_allocation_history
CREATE INDEX IF NOT EXISTS idx_capital_allocation_history_clinic_id ON capital_allocation_history(clinic_id);

-- capital_investments
CREATE INDEX IF NOT EXISTS idx_capital_investments_request_id ON capital_investments(request_id);

-- churn_risk_signals
CREATE INDEX IF NOT EXISTS idx_churn_risk_signals_assigned_to_id ON churn_risk_signals(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_churn_risk_signals_clinic_id ON churn_risk_signals(clinic_id);

-- clinic_reinvestment_plans
CREATE INDEX IF NOT EXISTS idx_clinic_reinvestment_plans_approved_by_id ON clinic_reinvestment_plans(approved_by_id);
CREATE INDEX IF NOT EXISTS idx_clinic_reinvestment_plans_clinic_id ON clinic_reinvestment_plans(clinic_id);

-- complaint_themes
CREATE INDEX IF NOT EXISTS idx_complaint_themes_clinic_id ON complaint_themes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_complaint_themes_owner_id ON complaint_themes(owner_id);

-- contract_renewal_alerts
CREATE INDEX IF NOT EXISTS idx_contract_renewal_alerts_assigned_to_id ON contract_renewal_alerts(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_contract_renewal_alerts_clinic_id ON contract_renewal_alerts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_contract_renewal_alerts_contract_id ON contract_renewal_alerts(contract_id);

-- cross_clinic_alignment
CREATE INDEX IF NOT EXISTS idx_cross_clinic_alignment_clinic_id ON cross_clinic_alignment(clinic_id);
CREATE INDEX IF NOT EXISTS idx_cross_clinic_alignment_okr_id ON cross_clinic_alignment(okr_id);

-- data_quality_alerts
CREATE INDEX IF NOT EXISTS idx_data_quality_alerts_assigned_to_id ON data_quality_alerts(assigned_to_id);

-- dependency_mapping
CREATE INDEX IF NOT EXISTS idx_dependency_mapping_dependent_system_id ON dependency_mapping(dependent_system_id);
CREATE INDEX IF NOT EXISTS idx_dependency_mapping_primary_system_id ON dependency_mapping(primary_system_id);

-- duty_violations
CREATE INDEX IF NOT EXISTS idx_duty_violations_rule_id ON duty_violations(rule_id);

-- growth_engagement_checklists
CREATE INDEX IF NOT EXISTS idx_growth_engagement_checklists_created_by ON growth_engagement_checklists(created_by);

-- growth_outreach_scripts
CREATE INDEX IF NOT EXISTS idx_growth_outreach_scripts_created_by ON growth_outreach_scripts(created_by);

-- growth_playbook_templates
CREATE INDEX IF NOT EXISTS idx_growth_playbook_templates_created_by ON growth_playbook_templates(created_by);

-- growth_playbooks
CREATE INDEX IF NOT EXISTS idx_growth_playbooks_created_by ON growth_playbooks(created_by);

-- incomplete_workflows
CREATE INDEX IF NOT EXISTS idx_incomplete_workflows_assigned_to_id ON incomplete_workflows(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_incomplete_workflows_clinic_id ON incomplete_workflows(clinic_id);

-- intake_actions
CREATE INDEX IF NOT EXISTS idx_intake_actions_action_by ON intake_actions(action_by);
CREATE INDEX IF NOT EXISTS idx_intake_actions_intake_id ON intake_actions(intake_id);

-- intake_assignments
CREATE INDEX IF NOT EXISTS idx_intake_assignments_assigned_to ON intake_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_intake_assignments_clinic_id ON intake_assignments(clinic_id);

-- intake_outcomes
CREATE INDEX IF NOT EXISTS idx_intake_outcomes_assigned_clinician ON intake_outcomes(assigned_clinician);
CREATE INDEX IF NOT EXISTS idx_intake_outcomes_intake_id ON intake_outcomes(intake_id);

-- intake_pipeline
CREATE INDEX IF NOT EXISTS idx_intake_pipeline_assigned_to ON intake_pipeline(assigned_to);
CREATE INDEX IF NOT EXISTS idx_intake_pipeline_lead_id ON intake_pipeline(lead_id);

-- investment_approvals
CREATE INDEX IF NOT EXISTS idx_investment_approvals_approver_id ON investment_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_investment_approvals_capex_request_id ON investment_approvals(capex_request_id);

-- knowledge_gaps
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_identified_by_id ON knowledge_gaps(identified_by_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_owner_id ON knowledge_gaps(owner_id);

-- leads
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_channel_id ON leads(channel_id);