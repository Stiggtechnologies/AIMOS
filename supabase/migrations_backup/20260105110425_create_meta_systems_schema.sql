/*
  # AIM OS Meta-Systems Schema - Complete Strategic Management Layer
  
  ## 1. Pricing & Payer Intelligence
  Tables:
    - `service_pricing_matrix` - Service pricing by location/payer
    - `payer_contracts` - Payer agreements and terms
    - `payer_rate_comparisons` - Market rate benchmarking
    - `contract_renewal_alerts` - Upcoming renewals and risks
    - `margin_by_service_line` - Profitability tracking
  
  ## 2. Service Portfolio Management
  Tables:
    - `service_lines` - Service offerings catalog
    - `service_demand_metrics` - Demand tracking by service
    - `service_capacity_allocation` - Capacity by service type
    - `service_margin_analysis` - Profitability by service
    - `service_lifecycle_events` - Launch/retire tracking
  
  ## 3. Experience & Reputation Intelligence
  Tables:
    - `patient_satisfaction_signals` - Non-PHI satisfaction data
    - `complaint_themes` - Categorized complaints
    - `public_review_monitoring` - Review tracking
    - `referral_partner_satisfaction` - Partner feedback
    - `churn_risk_signals` - Early warning indicators
  
  ## 4. Technology & Vendor Risk Management
  Tables:
    - `vendor_registry` - All vendors and systems
    - `vendor_contracts` - Terms and agreements
    - `system_criticality_scores` - Risk assessment
    - `vendor_incidents` - Outage and issue tracking
    - `dependency_mapping` - System interdependencies
  
  ## 5. Capital Allocation & Investment Governance
  Tables:
    - `capex_requests` - Capital expenditure requests
    - `investment_approvals` - Approval workflow
    - `roi_tracking` - Post-investment returns
    - `clinic_reinvestment_plans` - Per-clinic capital plans
    - `capital_allocation_history` - Investment decisions
  
  ## 6. Strategy & OKR System
  Tables:
    - `strategic_priorities` - Annual/quarterly priorities
    - `okrs` - Objectives and Key Results
    - `initiatives` - Strategic initiatives
    - `okr_progress_updates` - Progress tracking
    - `cross_clinic_alignment` - Alignment tracking
  
  ## 7. Internal Controls & Fraud Prevention
  Tables:
    - `segregation_of_duties` - Role separation rules
    - `approval_thresholds` - Approval requirements
    - `override_tracking` - Policy override log
    - `anomaly_detections` - Unusual activity flags
    - `audit_flags` - Compliance issues
  
  ## 8. Data Quality & System Health
  Tables:
    - `data_quality_alerts` - Missing/stale data
    - `module_adoption_metrics` - Usage tracking
    - `incomplete_workflows` - Workflow gaps
    - `system_health_scores` - Overall health metrics
    - `shadow_process_flags` - Workaround detection
  
  ## 9. Knowledge → Execution Translation
  Tables:
    - `sop_effectiveness_tracking` - SOP usage vs outcomes
    - `training_impact_analysis` - Training ROI
    - `sop_compliance_indicators` - Adherence metrics
    - `knowledge_gaps` - Identified gaps
  
  ## 10. Exit & Valuation Readiness
  Tables:
    - `valuation_kpis` - Key valuation metrics
    - `audit_pack_documents` - Diligence materials
    - `operational_maturity_scores` - Readiness assessment
    - `buyer_readiness_checklist` - DD preparation
    - `valuation_adjustments` - Normalization tracking
  
  ## Security
  - RLS enabled on all tables
  - Executives and appropriate roles have access
  - Audit trails on all critical operations
*/

-- ============================================================================
-- 1. PRICING & PAYER INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_pricing_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  service_line_id uuid,
  service_name text NOT NULL,
  service_code text,
  standard_price decimal(10,2) NOT NULL,
  payer_name text,
  payer_rate decimal(10,2),
  payer_rate_percentage decimal(5,2),
  effective_date date NOT NULL,
  expiry_date date,
  is_active boolean DEFAULT true,
  price_tier text,
  volume_discounts jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payer_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  payer_name text NOT NULL,
  contract_type text NOT NULL,
  contract_number text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  auto_renewal boolean DEFAULT false,
  notice_period_days integer DEFAULT 90,
  payment_terms text,
  rate_structure jsonb,
  volume_requirements jsonb,
  performance_guarantees jsonb,
  termination_clauses text,
  revenue_last_12_months decimal(12,2),
  revenue_percentage decimal(5,2),
  status text DEFAULT 'active',
  risk_level text,
  renewal_status text,
  contract_owner_id uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payer_rate_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  our_rate decimal(10,2) NOT NULL,
  market_average_rate decimal(10,2),
  market_high_rate decimal(10,2),
  market_low_rate decimal(10,2),
  variance_from_market decimal(10,2),
  variance_percentage decimal(5,2),
  data_source text,
  comparison_date date DEFAULT CURRENT_DATE,
  recommendation text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contract_renewal_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES payer_contracts(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL,
  days_until_renewal integer,
  action_required text NOT NULL,
  action_by_date date,
  assigned_to_id uuid REFERENCES user_profiles(id),
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS margin_by_service_line (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  service_line_name text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_revenue decimal(12,2) NOT NULL,
  direct_costs decimal(12,2) NOT NULL,
  allocated_overhead decimal(12,2),
  gross_margin decimal(12,2),
  gross_margin_percentage decimal(5,2),
  contribution_margin decimal(12,2),
  contribution_margin_percentage decimal(5,2),
  volume_units integer,
  revenue_per_unit decimal(10,2),
  cost_per_unit decimal(10,2),
  margin_trend text,
  benchmark_comparison decimal(5,2),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. SERVICE PORTFOLIO MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  target_market text,
  status text DEFAULT 'active',
  launch_date date,
  sunset_date date,
  strategic_priority text,
  requires_special_credentials boolean DEFAULT false,
  average_session_duration_minutes integer,
  typical_treatment_plan_sessions integer,
  estimated_lifetime_value decimal(10,2),
  competitive_positioning text,
  growth_potential text,
  resource_intensity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_demand_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  inquiries_received integer DEFAULT 0,
  appointments_booked integer DEFAULT 0,
  appointments_completed integer DEFAULT 0,
  conversion_rate decimal(5,2),
  average_wait_time_days decimal(5,2),
  demand_score decimal(5,2),
  demand_trend text,
  seasonal_factor decimal(5,2),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_capacity_allocation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  allocated_hours decimal(8,2) NOT NULL,
  utilized_hours decimal(8,2) DEFAULT 0,
  utilization_rate decimal(5,2),
  qualified_staff_count integer,
  capacity_constraint_type text,
  expansion_potential text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_margin_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  revenue decimal(12,2) NOT NULL,
  direct_cost decimal(12,2) NOT NULL,
  gross_margin decimal(12,2),
  gross_margin_percentage decimal(5,2),
  customer_acquisition_cost decimal(10,2),
  lifetime_value decimal(10,2),
  ltv_cac_ratio decimal(5,2),
  profitability_tier text,
  strategic_value text,
  recommendation text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_line_id uuid REFERENCES service_lines(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id),
  event_type text NOT NULL,
  event_date date NOT NULL,
  decision_rationale text,
  investment_required decimal(12,2),
  expected_roi decimal(5,2),
  risk_assessment text,
  approved_by_id uuid REFERENCES user_profiles(id),
  status text DEFAULT 'proposed',
  outcome_notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. EXPERIENCE & REPUTATION INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_satisfaction_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  signal_date date DEFAULT CURRENT_DATE,
  signal_type text NOT NULL,
  category text,
  sentiment_score decimal(3,2),
  touchpoint text,
  service_line text,
  clinician_id uuid REFERENCES user_profiles(id),
  response_time_hours decimal(8,2),
  resolution_status text,
  themes text[],
  actionable_insight text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaint_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  theme_name text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL,
  occurrence_count integer DEFAULT 1,
  first_reported date NOT NULL,
  last_reported date NOT NULL,
  affected_service_lines text[],
  root_cause text,
  corrective_actions text[],
  status text DEFAULT 'active',
  owner_id uuid REFERENCES user_profiles(id),
  trend text,
  impact_assessment text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public_review_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  platform text NOT NULL,
  review_date date NOT NULL,
  rating decimal(2,1),
  review_summary text,
  sentiment text,
  themes text[],
  response_required boolean DEFAULT false,
  responded_at timestamptz,
  response_quality text,
  flagged_for_action boolean DEFAULT false,
  action_taken text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral_partner_satisfaction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  partner_type text NOT NULL,
  partner_name text NOT NULL,
  survey_date date DEFAULT CURRENT_DATE,
  overall_satisfaction_score decimal(3,2),
  communication_score decimal(3,2),
  responsiveness_score decimal(3,2),
  quality_of_care_score decimal(3,2),
  likelihood_to_refer_score decimal(3,2),
  feedback_themes text[],
  improvement_areas text[],
  relationship_status text DEFAULT 'active',
  follow_up_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS churn_risk_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  risk_level text NOT NULL,
  detected_date date DEFAULT CURRENT_DATE,
  patient_segment text,
  contributing_factors text[],
  predicted_churn_probability decimal(3,2),
  intervention_recommended text,
  intervention_taken text,
  outcome text,
  status text DEFAULT 'active',
  assigned_to_id uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. TECHNOLOGY & VENDOR RISK MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  vendor_type text NOT NULL,
  service_provided text NOT NULL,
  criticality_level text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  service_start_date date,
  clinics_using uuid[],
  is_single_point_of_failure boolean DEFAULT false,
  backup_vendor_available boolean DEFAULT false,
  data_access_level text,
  compliance_requirements text[],
  last_audit_date date,
  next_audit_date date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_registry(id) ON DELETE CASCADE,
  contract_number text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  auto_renewal boolean DEFAULT false,
  notice_period_days integer DEFAULT 60,
  annual_cost decimal(12,2),
  payment_terms text,
  sla_terms jsonb,
  termination_clauses text,
  renewal_status text,
  contract_owner_id uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_criticality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_registry(id) ON DELETE CASCADE,
  assessment_date date DEFAULT CURRENT_DATE,
  operational_impact_score integer CHECK (operational_impact_score BETWEEN 1 AND 10),
  data_sensitivity_score integer CHECK (data_sensitivity_score BETWEEN 1 AND 10),
  recovery_time_objective_hours decimal(8,2),
  recovery_point_objective_hours decimal(8,2),
  disaster_recovery_plan_exists boolean DEFAULT false,
  last_tested_date date,
  test_result text,
  overall_risk_score decimal(3,1),
  mitigation_plan text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_registry(id) ON DELETE CASCADE,
  incident_date timestamptz NOT NULL,
  incident_type text NOT NULL,
  severity text NOT NULL,
  affected_clinics uuid[],
  downtime_hours decimal(8,2),
  impact_description text,
  root_cause text,
  resolution_time_hours decimal(8,2),
  vendor_response_quality text,
  financial_impact decimal(12,2),
  lessons_learned text,
  preventive_actions text[],
  status text DEFAULT 'resolved',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dependency_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_system_id uuid REFERENCES vendor_registry(id) ON DELETE CASCADE,
  dependent_system_id uuid REFERENCES vendor_registry(id) ON DELETE CASCADE,
  dependency_type text NOT NULL,
  criticality text NOT NULL,
  failure_impact text,
  alternative_available boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 5. CAPITAL ALLOCATION & INVESTMENT GOVERNANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS capex_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  request_title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  requested_amount decimal(12,2) NOT NULL,
  strategic_alignment text NOT NULL,
  expected_benefits text NOT NULL,
  roi_projection decimal(5,2),
  payback_period_months integer,
  risk_assessment text,
  alternatives_considered text,
  urgency text NOT NULL,
  requested_by_id uuid REFERENCES user_profiles(id),
  request_date date DEFAULT CURRENT_DATE,
  required_by_date date,
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investment_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capex_request_id uuid REFERENCES capex_requests(id) ON DELETE CASCADE,
  approver_id uuid REFERENCES user_profiles(id),
  approval_level text NOT NULL,
  decision text NOT NULL,
  approved_amount decimal(12,2),
  conditions text,
  decision_date timestamptz DEFAULT now(),
  decision_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roi_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capex_request_id uuid REFERENCES capex_requests(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  measurement_date date NOT NULL,
  actual_cost decimal(12,2),
  revenue_generated decimal(12,2) DEFAULT 0,
  cost_savings decimal(12,2) DEFAULT 0,
  productivity_gain_percentage decimal(5,2),
  other_benefits text,
  actual_roi decimal(5,2),
  projected_roi decimal(5,2),
  variance decimal(5,2),
  performance_status text,
  lessons_learned text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinic_reinvestment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  fiscal_year integer NOT NULL,
  quarter text,
  total_budget decimal(12,2) NOT NULL,
  allocated_budget decimal(12,2) DEFAULT 0,
  spent_budget decimal(12,2) DEFAULT 0,
  priority_areas jsonb,
  strategic_goals text[],
  approval_status text DEFAULT 'draft',
  approved_by_id uuid REFERENCES user_profiles(id),
  approved_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capital_allocation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_date date NOT NULL,
  decision_type text NOT NULL,
  amount_allocated decimal(12,2) NOT NULL,
  allocation_target text NOT NULL,
  clinic_id uuid REFERENCES clinics(id),
  strategic_rationale text,
  expected_impact text,
  decision_makers text[],
  actual_outcome text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 6. STRATEGY & OKR SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS strategic_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  time_horizon text NOT NULL,
  fiscal_year integer,
  quarter text,
  priority_level integer CHECK (priority_level BETWEEN 1 AND 5),
  strategic_pillar text,
  owner_id uuid REFERENCES user_profiles(id),
  stakeholders uuid[],
  success_criteria text[],
  dependencies text[],
  risks text[],
  status text DEFAULT 'active',
  progress_percentage integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS okrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategic_priority_id uuid REFERENCES strategic_priorities(id) ON DELETE CASCADE,
  objective text NOT NULL,
  time_period text NOT NULL,
  owner_id uuid REFERENCES user_profiles(id),
  status text DEFAULT 'active',
  confidence_level text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid REFERENCES okrs(id) ON DELETE CASCADE,
  key_result_text text NOT NULL,
  metric_type text NOT NULL,
  baseline_value decimal(12,2),
  target_value decimal(12,2) NOT NULL,
  current_value decimal(12,2) DEFAULT 0,
  unit text,
  progress_percentage decimal(5,2) DEFAULT 0,
  status text DEFAULT 'on_track',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid REFERENCES okrs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  owner_id uuid REFERENCES user_profiles(id),
  team_members uuid[],
  start_date date,
  target_completion_date date,
  actual_completion_date date,
  status text DEFAULT 'planning',
  budget decimal(12,2),
  spent decimal(12,2) DEFAULT 0,
  health_status text DEFAULT 'green',
  blockers text[],
  next_milestones text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS okr_progress_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid REFERENCES okrs(id) ON DELETE CASCADE,
  update_date date DEFAULT CURRENT_DATE,
  progress_percentage decimal(5,2),
  status text,
  accomplishments text[],
  challenges text[],
  next_steps text[],
  confidence_level text,
  updated_by_id uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cross_clinic_alignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id uuid REFERENCES okrs(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  alignment_level text NOT NULL,
  contribution_type text,
  local_target decimal(12,2),
  local_progress decimal(12,2) DEFAULT 0,
  barriers text[],
  support_needed text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 7. INTERNAL CONTROLS & FRAUD PREVENTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS segregation_of_duties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_name text NOT NULL,
  process_area text NOT NULL,
  role_a text NOT NULL,
  role_b text NOT NULL,
  separation_rule text NOT NULL,
  risk_if_violated text,
  monitoring_method text,
  last_reviewed_date date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL,
  threshold_amount decimal(12,2) NOT NULL,
  approval_level text NOT NULL,
  required_approver_role text NOT NULL,
  sequential_approval boolean DEFAULT false,
  approval_sequence jsonb,
  exceptions_allowed boolean DEFAULT false,
  exception_approval_required text,
  effective_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS override_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  override_date timestamptz DEFAULT now(),
  user_id uuid REFERENCES user_profiles(id),
  policy_overridden text NOT NULL,
  override_reason text NOT NULL,
  approval_obtained boolean DEFAULT false,
  approver_id uuid REFERENCES user_profiles(id),
  transaction_type text,
  transaction_amount decimal(12,2),
  risk_assessment text,
  review_status text DEFAULT 'pending_review',
  reviewed_by_id uuid REFERENCES user_profiles(id),
  reviewed_at timestamptz,
  outcome text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anomaly_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_date timestamptz DEFAULT now(),
  anomaly_type text NOT NULL,
  severity text NOT NULL,
  affected_user_id uuid REFERENCES user_profiles(id),
  clinic_id uuid REFERENCES clinics(id),
  description text NOT NULL,
  indicators jsonb,
  risk_score decimal(5,2),
  automated_detection boolean DEFAULT true,
  investigation_status text DEFAULT 'new',
  assigned_to_id uuid REFERENCES user_profiles(id),
  investigation_notes text,
  resolution text,
  false_positive boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_date date DEFAULT CURRENT_DATE,
  flag_type text NOT NULL,
  severity text NOT NULL,
  area text NOT NULL,
  clinic_id uuid REFERENCES clinics(id),
  description text NOT NULL,
  compliance_standard text,
  corrective_action_required text,
  assigned_to_id uuid REFERENCES user_profiles(id),
  due_date date,
  status text DEFAULT 'open',
  resolution_notes text,
  resolved_date date,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 8. DATA QUALITY & SYSTEM HEALTH
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_quality_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_date timestamptz DEFAULT now(),
  alert_type text NOT NULL,
  severity text NOT NULL,
  affected_table text NOT NULL,
  affected_module text,
  issue_description text NOT NULL,
  records_affected integer,
  data_completeness_percentage decimal(5,2),
  data_staleness_days integer,
  impact_assessment text,
  remediation_action text,
  assigned_to_id uuid REFERENCES user_profiles(id),
  status text DEFAULT 'active',
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS module_adoption_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  measurement_date date DEFAULT CURRENT_DATE,
  total_potential_users integer,
  active_users integer,
  adoption_rate decimal(5,2),
  average_usage_frequency text,
  feature_utilization_percentage decimal(5,2),
  training_completion_rate decimal(5,2),
  user_satisfaction_score decimal(3,2),
  support_tickets_count integer DEFAULT 0,
  adoption_trend text,
  barriers_to_adoption text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incomplete_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name text NOT NULL,
  workflow_type text NOT NULL,
  clinic_id uuid REFERENCES clinics(id),
  initiated_date timestamptz NOT NULL,
  current_step text,
  expected_completion_date date,
  days_stalled integer,
  blocker_type text,
  blocker_description text,
  assigned_to_id uuid REFERENCES user_profiles(id),
  escalation_level text DEFAULT 'normal',
  business_impact text,
  status text DEFAULT 'stalled',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_date date DEFAULT CURRENT_DATE,
  clinic_id uuid REFERENCES clinics(id),
  module_name text,
  data_quality_score decimal(3,2) CHECK (data_quality_score BETWEEN 0 AND 1),
  adoption_score decimal(3,2) CHECK (adoption_score BETWEEN 0 AND 1),
  completion_rate_score decimal(3,2) CHECK (completion_rate_score BETWEEN 0 AND 1),
  user_satisfaction_score decimal(3,2) CHECK (user_satisfaction_score BETWEEN 0 AND 1),
  overall_health_score decimal(3,2) CHECK (overall_health_score BETWEEN 0 AND 1),
  health_grade text,
  critical_issues integer DEFAULT 0,
  warnings integer DEFAULT 0,
  recommendations text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shadow_process_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_date date DEFAULT CURRENT_DATE,
  clinic_id uuid REFERENCES clinics(id),
  process_area text NOT NULL,
  official_process text,
  shadow_process_description text NOT NULL,
  reason_for_workaround text,
  users_involved uuid[],
  risk_assessment text,
  data_integrity_risk boolean DEFAULT false,
  compliance_risk boolean DEFAULT false,
  recommended_action text,
  status text DEFAULT 'identified',
  resolution_plan text,
  resolved_date date,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 9. KNOWLEDGE → EXECUTION TRANSLATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS sop_effectiveness_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id uuid,
  sop_title text NOT NULL,
  category text,
  measurement_period_start date NOT NULL,
  measurement_period_end date NOT NULL,
  views_count integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  completion_rate decimal(5,2),
  incidents_before_sop integer DEFAULT 0,
  incidents_after_sop integer DEFAULT 0,
  incident_reduction_percentage decimal(5,2),
  compliance_score decimal(5,2),
  user_feedback_score decimal(3,2),
  effectiveness_rating text,
  improvement_opportunities text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_impact_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_program text NOT NULL,
  training_date date NOT NULL,
  participants uuid[],
  completion_rate decimal(5,2),
  average_assessment_score decimal(5,2),
  pre_training_performance_metric decimal(10,2),
  post_training_performance_metric decimal(10,2),
  improvement_percentage decimal(5,2),
  time_to_proficiency_days integer,
  retention_rate_30_days decimal(5,2),
  retention_rate_90_days decimal(5,2),
  roi_calculation decimal(12,2),
  qualitative_feedback text,
  recommended_follow_up text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sop_compliance_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id uuid,
  sop_title text NOT NULL,
  clinic_id uuid REFERENCES clinics(id),
  measurement_date date DEFAULT CURRENT_DATE,
  total_applicable_instances integer,
  compliant_instances integer,
  compliance_rate decimal(5,2),
  deviation_types text[],
  deviation_frequency integer DEFAULT 0,
  high_risk_deviations integer DEFAULT 0,
  corrective_actions_taken text[],
  trend text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_gaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identified_date date DEFAULT CURRENT_DATE,
  gap_type text NOT NULL,
  area text NOT NULL,
  description text NOT NULL,
  identified_by_id uuid REFERENCES user_profiles(id),
  affected_roles text[],
  affected_clinics uuid[],
  business_impact text,
  priority text NOT NULL,
  proposed_solution text,
  resource_required text,
  owner_id uuid REFERENCES user_profiles(id),
  target_close_date date,
  status text DEFAULT 'identified',
  resolution_notes text,
  resolved_date date,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 10. EXIT & VALUATION READINESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS valuation_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_date date DEFAULT CURRENT_DATE,
  fiscal_period text NOT NULL,
  revenue decimal(15,2) NOT NULL,
  adjusted_ebitda decimal(15,2) NOT NULL,
  ebitda_margin decimal(5,2),
  revenue_growth_rate decimal(5,2),
  same_clinic_growth decimal(5,2),
  customer_retention_rate decimal(5,2),
  customer_lifetime_value decimal(10,2),
  customer_acquisition_cost decimal(10,2),
  ltv_cac_ratio decimal(5,2),
  rule_of_40_score decimal(5,2),
  net_revenue_retention decimal(5,2),
  gross_margin decimal(5,2),
  operating_margin decimal(5,2),
  free_cash_flow decimal(15,2),
  working_capital_ratio decimal(5,2),
  debt_to_ebitda_ratio decimal(5,2),
  quality_of_earnings_score decimal(3,2),
  adjustments_summary jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_pack_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  document_name text NOT NULL,
  description text,
  required_for_dd boolean DEFAULT true,
  document_status text DEFAULT 'pending',
  last_updated_date date,
  updated_by_id uuid REFERENCES user_profiles(id),
  version text,
  location_url text,
  completeness_percentage integer DEFAULT 0,
  review_status text,
  reviewer_notes text,
  due_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operational_maturity_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_date date DEFAULT CURRENT_DATE,
  dimension text NOT NULL,
  score integer CHECK (score BETWEEN 1 AND 5),
  maturity_level text,
  description text,
  strengths text[],
  gaps text[],
  improvement_roadmap text,
  assessed_by_id uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buyer_readiness_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  item_name text NOT NULL,
  description text,
  priority text NOT NULL,
  status text DEFAULT 'not_started',
  completion_percentage integer DEFAULT 0,
  owner_id uuid REFERENCES user_profiles(id),
  due_date date,
  dependencies text[],
  risks text[],
  notes text,
  completed_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS valuation_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_period text NOT NULL,
  adjustment_type text NOT NULL,
  adjustment_category text,
  description text NOT NULL,
  amount decimal(15,2) NOT NULL,
  is_addback boolean DEFAULT true,
  recurring boolean DEFAULT false,
  justification text NOT NULL,
  supporting_documentation text,
  auditor_accepted boolean,
  buyer_accepted boolean,
  created_by_id uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pricing_clinic_service ON service_pricing_matrix(clinic_id, service_name);
CREATE INDEX IF NOT EXISTS idx_payer_contracts_clinic ON payer_contracts(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_renewals_date ON contract_renewal_alerts(action_by_date, status);
CREATE INDEX IF NOT EXISTS idx_service_demand_clinic_period ON service_demand_metrics(clinic_id, period_start);
CREATE INDEX IF NOT EXISTS idx_satisfaction_signals_clinic ON patient_satisfaction_signals(clinic_id, signal_date);
CREATE INDEX IF NOT EXISTS idx_vendor_criticality ON vendor_registry(criticality_level, status);
CREATE INDEX IF NOT EXISTS idx_capex_status ON capex_requests(status, request_date);
CREATE INDEX IF NOT EXISTS idx_okrs_owner ON okrs(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON anomaly_detections(severity, investigation_status);
CREATE INDEX IF NOT EXISTS idx_data_quality_alerts ON data_quality_alerts(alert_date, severity, status);
CREATE INDEX IF NOT EXISTS idx_valuation_kpis_period ON valuation_kpis(fiscal_period);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE service_pricing_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE payer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payer_rate_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_renewal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE margin_by_service_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_demand_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_capacity_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_margin_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_satisfaction_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_review_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_partner_satisfaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_criticality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE capex_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_reinvestment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_allocation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_clinic_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE segregation_of_duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_adoption_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomplete_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_process_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_effectiveness_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_impact_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_compliance_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuation_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_pack_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_maturity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_readiness_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuation_adjustments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - EXECUTIVE ACCESS
-- ============================================================================

-- Executives can view all meta-systems data
CREATE POLICY "Executives can view pricing data" ON service_pricing_matrix FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

CREATE POLICY "Executives can view payer contracts" ON payer_contracts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

CREATE POLICY "Executives can view service lines" ON service_lines FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager'))
);

CREATE POLICY "Executives can view satisfaction signals" ON patient_satisfaction_signals FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager'))
);

CREATE POLICY "Executives can view vendor registry" ON vendor_registry FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

CREATE POLICY "Executives can view capex requests" ON capex_requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager'))
);

CREATE POLICY "Executives can view strategic priorities" ON strategic_priorities FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

CREATE POLICY "Executives can view OKRs" ON okrs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager'))
);

CREATE POLICY "Executives can view internal controls" ON segregation_of_duties FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

CREATE POLICY "Executives can view anomaly detections" ON anomaly_detections FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

CREATE POLICY "Executives can view data quality" ON data_quality_alerts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

CREATE POLICY "Executives can view knowledge gaps" ON knowledge_gaps FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin', 'clinic_manager'))
);

CREATE POLICY "Executives can view valuation KPIs" ON valuation_kpis FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

-- Management policies for executives
CREATE POLICY "Executives can manage pricing" ON service_pricing_matrix FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

CREATE POLICY "Executives can manage capex" ON capex_requests FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);

CREATE POLICY "Executives can manage OKRs" ON okrs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('executive', 'admin'))
);
