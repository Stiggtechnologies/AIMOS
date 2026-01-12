/*
  # Add Missing Foreign Key Indexes - Part 2

  1. Performance Issue
    - Adding remaining foreign key indexes to improve query performance

  2. Tables Fixed (Part 2 of 3)
    - margin_by_service_line (clinic_id)
    - module_adoption_metrics (clinic_id)
    - okr_progress_updates (okr_id, updated_by_id)
    - operational_maturity_scores (assessed_by_id)
    - patient_satisfaction_signals (clinician_id)
    - payer_contracts (contract_owner_id)
    - payer_rate_comparisons (clinic_id)
    - playbook_actions (assigned_to, playbook_id)
    - playbook_executions (playbook_template_id)
    - public_review_monitoring (clinic_id)
    - referral_campaigns (assigned_to, clinic_id)
    - referral_gaps (assigned_to, partner_id)
    - referral_partner_satisfaction (clinic_id)
    - referral_partner_scorecards (generated_by)
    - referral_partner_segments (created_by)
    - revops_growth_alerts (acknowledged_by)
    - roi_tracking (capex_request_id, clinic_id)
    - seasonal_demand_plans (created_by)
    - service_capacity_allocation (clinic_id, service_line_id)
    - service_demand_metrics (service_line_id)
    - service_lifecycle_events (approved_by_id, service_line_id)
    - service_margin_analysis (clinic_id, service_line_id)
    - shadow_process_flags (clinic_id)
    - sop_compliance_indicators (clinic_id)
    - system_criticality_scores (vendor_id)
    - system_health_scores (clinic_id)
    - valuation_adjustments (created_by_id)
    - vendor_contracts (contract_owner_id, vendor_id)
    - vendor_criticality (backup_vendor_id)
    - vendor_incidents (vendor_id)
*/

-- margin_by_service_line
CREATE INDEX IF NOT EXISTS idx_margin_by_service_line_clinic_id ON margin_by_service_line(clinic_id);

-- module_adoption_metrics
CREATE INDEX IF NOT EXISTS idx_module_adoption_metrics_clinic_id ON module_adoption_metrics(clinic_id);

-- okr_progress_updates
CREATE INDEX IF NOT EXISTS idx_okr_progress_updates_okr_id ON okr_progress_updates(okr_id);
CREATE INDEX IF NOT EXISTS idx_okr_progress_updates_updated_by_id ON okr_progress_updates(updated_by_id);

-- operational_maturity_scores
CREATE INDEX IF NOT EXISTS idx_operational_maturity_scores_assessed_by_id ON operational_maturity_scores(assessed_by_id);

-- patient_satisfaction_signals
CREATE INDEX IF NOT EXISTS idx_patient_satisfaction_signals_clinician_id ON patient_satisfaction_signals(clinician_id);

-- payer_contracts
CREATE INDEX IF NOT EXISTS idx_payer_contracts_contract_owner_id ON payer_contracts(contract_owner_id);

-- payer_rate_comparisons
CREATE INDEX IF NOT EXISTS idx_payer_rate_comparisons_clinic_id ON payer_rate_comparisons(clinic_id);

-- playbook_actions
CREATE INDEX IF NOT EXISTS idx_playbook_actions_assigned_to ON playbook_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_playbook_actions_playbook_id ON playbook_actions(playbook_id);

-- playbook_executions
CREATE INDEX IF NOT EXISTS idx_playbook_executions_playbook_template_id ON playbook_executions(playbook_template_id);

-- public_review_monitoring
CREATE INDEX IF NOT EXISTS idx_public_review_monitoring_clinic_id ON public_review_monitoring(clinic_id);

-- referral_campaigns
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_assigned_to ON referral_campaigns(assigned_to);
CREATE INDEX IF NOT EXISTS idx_referral_campaigns_clinic_id ON referral_campaigns(clinic_id);

-- referral_gaps
CREATE INDEX IF NOT EXISTS idx_referral_gaps_assigned_to ON referral_gaps(assigned_to);
CREATE INDEX IF NOT EXISTS idx_referral_gaps_partner_id ON referral_gaps(partner_id);

-- referral_partner_satisfaction
CREATE INDEX IF NOT EXISTS idx_referral_partner_satisfaction_clinic_id ON referral_partner_satisfaction(clinic_id);

-- referral_partner_scorecards
CREATE INDEX IF NOT EXISTS idx_referral_partner_scorecards_generated_by ON referral_partner_scorecards(generated_by);

-- referral_partner_segments
CREATE INDEX IF NOT EXISTS idx_referral_partner_segments_created_by ON referral_partner_segments(created_by);

-- revops_growth_alerts
CREATE INDEX IF NOT EXISTS idx_revops_growth_alerts_acknowledged_by ON revops_growth_alerts(acknowledged_by);

-- roi_tracking
CREATE INDEX IF NOT EXISTS idx_roi_tracking_capex_request_id ON roi_tracking(capex_request_id);
CREATE INDEX IF NOT EXISTS idx_roi_tracking_clinic_id ON roi_tracking(clinic_id);

-- seasonal_demand_plans
CREATE INDEX IF NOT EXISTS idx_seasonal_demand_plans_created_by ON seasonal_demand_plans(created_by);

-- service_capacity_allocation
CREATE INDEX IF NOT EXISTS idx_service_capacity_allocation_clinic_id ON service_capacity_allocation(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_capacity_allocation_service_line_id ON service_capacity_allocation(service_line_id);

-- service_demand_metrics
CREATE INDEX IF NOT EXISTS idx_service_demand_metrics_service_line_id ON service_demand_metrics(service_line_id);

-- service_lifecycle_events
CREATE INDEX IF NOT EXISTS idx_service_lifecycle_events_approved_by_id ON service_lifecycle_events(approved_by_id);
CREATE INDEX IF NOT EXISTS idx_service_lifecycle_events_service_line_id ON service_lifecycle_events(service_line_id);

-- service_margin_analysis
CREATE INDEX IF NOT EXISTS idx_service_margin_analysis_clinic_id ON service_margin_analysis(clinic_id);
CREATE INDEX IF NOT EXISTS idx_service_margin_analysis_service_line_id ON service_margin_analysis(service_line_id);

-- shadow_process_flags
CREATE INDEX IF NOT EXISTS idx_shadow_process_flags_clinic_id ON shadow_process_flags(clinic_id);

-- sop_compliance_indicators
CREATE INDEX IF NOT EXISTS idx_sop_compliance_indicators_clinic_id ON sop_compliance_indicators(clinic_id);

-- system_criticality_scores
CREATE INDEX IF NOT EXISTS idx_system_criticality_scores_vendor_id ON system_criticality_scores(vendor_id);

-- system_health_scores
CREATE INDEX IF NOT EXISTS idx_system_health_scores_clinic_id ON system_health_scores(clinic_id);

-- valuation_adjustments
CREATE INDEX IF NOT EXISTS idx_valuation_adjustments_created_by_id ON valuation_adjustments(created_by_id);

-- vendor_contracts
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_contract_owner_id ON vendor_contracts(contract_owner_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_vendor_id ON vendor_contracts(vendor_id);

-- vendor_criticality
CREATE INDEX IF NOT EXISTS idx_vendor_criticality_backup_vendor_id ON vendor_criticality(backup_vendor_id);

-- vendor_incidents
CREATE INDEX IF NOT EXISTS idx_vendor_incidents_vendor_id ON vendor_incidents(vendor_id);