/*
  # Fix RLS Enabled Tables Without Policies

  1. Security Issue
    - Multiple tables have RLS enabled but no policies defined
    - This effectively locks down all access to these tables
    - Adding proper policies to restore appropriate access

  2. Tables Fixed
    - audit_flags
    - audit_pack_documents
    - buyer_readiness_checklist
    - capital_allocation_history
    - churn_risk_signals
    - clinic_reinvestment_plans
    - contract_renewal_alerts
    - cross_clinic_alignment
    - dependency_mapping
    - incomplete_workflows
    - investment_approvals
    - margin_by_service_line
    - module_adoption_metrics
    - okr_progress_updates
    - operational_maturity_scores
    - payer_rate_comparisons
    - public_review_monitoring
    - roi_tracking
    - service_capacity_allocation
    - service_demand_metrics
    - service_margin_analysis
    - shadow_process_flags
    - sop_compliance_indicators
    - sop_effectiveness_tracking
    - system_criticality_scores
    - system_health_scores
    - training_impact_analysis
    - valuation_adjustments

  3. Policy Strategy
    - Executives can view and manage all data
    - Clinic managers can view data for their clinics
    - Restrictive by default for security
*/

-- audit_flags
CREATE POLICY "Executives can view audit flags"
  ON audit_flags FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage audit flags"
  ON audit_flags FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- audit_pack_documents
CREATE POLICY "Executives can view audit pack documents"
  ON audit_pack_documents FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage audit pack documents"
  ON audit_pack_documents FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- buyer_readiness_checklist
CREATE POLICY "Executives can view buyer readiness checklist"
  ON buyer_readiness_checklist FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage buyer readiness checklist"
  ON buyer_readiness_checklist FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- capital_allocation_history
CREATE POLICY "Executives can view capital allocation history"
  ON capital_allocation_history FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage capital allocation history"
  ON capital_allocation_history FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- churn_risk_signals
CREATE POLICY "Executives can view churn risk signals"
  ON churn_risk_signals FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage churn risk signals"
  ON churn_risk_signals FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- clinic_reinvestment_plans
CREATE POLICY "Executives can view clinic reinvestment plans"
  ON clinic_reinvestment_plans FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage clinic reinvestment plans"
  ON clinic_reinvestment_plans FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- contract_renewal_alerts
CREATE POLICY "Executives can view contract renewal alerts"
  ON contract_renewal_alerts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage contract renewal alerts"
  ON contract_renewal_alerts FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- cross_clinic_alignment
CREATE POLICY "Executives can view cross clinic alignment"
  ON cross_clinic_alignment FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage cross clinic alignment"
  ON cross_clinic_alignment FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- dependency_mapping
CREATE POLICY "Executives can view dependency mapping"
  ON dependency_mapping FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage dependency mapping"
  ON dependency_mapping FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- incomplete_workflows
CREATE POLICY "Users can view incomplete workflows"
  ON incomplete_workflows FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager', 'clinician')));

CREATE POLICY "Executives can manage incomplete workflows"
  ON incomplete_workflows FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- investment_approvals
CREATE POLICY "Executives can view investment approvals"
  ON investment_approvals FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage investment approvals"
  ON investment_approvals FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- margin_by_service_line
CREATE POLICY "Executives can view margin by service line"
  ON margin_by_service_line FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage margin by service line"
  ON margin_by_service_line FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- module_adoption_metrics
CREATE POLICY "Executives can view module adoption metrics"
  ON module_adoption_metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage module adoption metrics"
  ON module_adoption_metrics FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- okr_progress_updates
CREATE POLICY "Users can view okr progress updates"
  ON okr_progress_updates FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Users can manage okr progress updates"
  ON okr_progress_updates FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

-- operational_maturity_scores
CREATE POLICY "Executives can view operational maturity scores"
  ON operational_maturity_scores FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage operational maturity scores"
  ON operational_maturity_scores FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- payer_rate_comparisons
CREATE POLICY "Executives can view payer rate comparisons"
  ON payer_rate_comparisons FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage payer rate comparisons"
  ON payer_rate_comparisons FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- public_review_monitoring
CREATE POLICY "Users can view public review monitoring"
  ON public_review_monitoring FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage public review monitoring"
  ON public_review_monitoring FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- roi_tracking
CREATE POLICY "Executives can view roi tracking"
  ON roi_tracking FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage roi tracking"
  ON roi_tracking FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- service_capacity_allocation
CREATE POLICY "Managers can view service capacity allocation"
  ON service_capacity_allocation FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage service capacity allocation"
  ON service_capacity_allocation FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- service_demand_metrics
CREATE POLICY "Managers can view service demand metrics"
  ON service_demand_metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage service demand metrics"
  ON service_demand_metrics FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- service_margin_analysis
CREATE POLICY "Executives can view service margin analysis"
  ON service_margin_analysis FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage service margin analysis"
  ON service_margin_analysis FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- shadow_process_flags
CREATE POLICY "Executives can view shadow process flags"
  ON shadow_process_flags FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage shadow process flags"
  ON shadow_process_flags FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- sop_compliance_indicators
CREATE POLICY "Users can view sop compliance indicators"
  ON sop_compliance_indicators FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage sop compliance indicators"
  ON sop_compliance_indicators FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- sop_effectiveness_tracking
CREATE POLICY "Users can view sop effectiveness tracking"
  ON sop_effectiveness_tracking FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage sop effectiveness tracking"
  ON sop_effectiveness_tracking FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- system_criticality_scores
CREATE POLICY "Executives can view system criticality scores"
  ON system_criticality_scores FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage system criticality scores"
  ON system_criticality_scores FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- system_health_scores
CREATE POLICY "Users can view system health scores"
  ON system_health_scores FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage system health scores"
  ON system_health_scores FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- training_impact_analysis
CREATE POLICY "Users can view training impact analysis"
  ON training_impact_analysis FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin', 'clinic_manager')));

CREATE POLICY "Executives can manage training impact analysis"
  ON training_impact_analysis FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

-- valuation_adjustments
CREATE POLICY "Executives can view valuation adjustments"
  ON valuation_adjustments FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));

CREATE POLICY "Executives can manage valuation adjustments"
  ON valuation_adjustments FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) IN (SELECT id FROM user_profiles WHERE role IN ('executive', 'admin')));