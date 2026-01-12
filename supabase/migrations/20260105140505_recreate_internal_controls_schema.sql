/*
  # Internal Controls & Fraud Prevention Schema

  ## Purpose
  Manages internal risk as headcount grows through systematic controls and monitoring.
  
  ## Changes
  - Drop existing approval_thresholds and override_tracking tables
  - Create comprehensive internal controls schema
  - Add segregation of duties, violations, anomaly flags, audit alerts, and approval workflows
  
  ## Security
  - RLS enabled on all tables
  - Executives only access
*/

-- Drop existing tables
DROP TABLE IF EXISTS override_tracking CASCADE;
DROP TABLE IF EXISTS approval_thresholds CASCADE;

-- Segregation of Duties Rules Table
CREATE TABLE segregation_of_duties_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_number text UNIQUE NOT NULL,
  rule_name text NOT NULL,
  description text NOT NULL,
  incompatible_role_a text NOT NULL,
  incompatible_role_b text NOT NULL,
  risk_category text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  is_active boolean DEFAULT true,
  violation_action text NOT NULL DEFAULT 'alert',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sod_rules_active ON segregation_of_duties_rules(is_active);
CREATE INDEX idx_sod_rules_severity ON segregation_of_duties_rules(severity);
CREATE INDEX idx_sod_rules_category ON segregation_of_duties_rules(risk_category);

-- Approval Thresholds Table
CREATE TABLE approval_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_name text NOT NULL,
  transaction_type text NOT NULL,
  amount_min numeric DEFAULT 0,
  amount_max numeric,
  required_approver_role text NOT NULL,
  approver_count_required integer DEFAULT 1,
  escalation_role text,
  auto_approve_below numeric DEFAULT 0,
  must_block_above numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_approval_thresholds_type ON approval_thresholds(transaction_type);
CREATE INDEX idx_approval_thresholds_active ON approval_thresholds(is_active);

-- Duty Violations Table
CREATE TABLE duty_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_number text UNIQUE NOT NULL,
  rule_id uuid REFERENCES segregation_of_duties_rules(id) ON DELETE SET NULL,
  user_id uuid,
  detected_at timestamptz DEFAULT now(),
  violation_type text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  risk_score integer DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  remediation_notes text,
  remediated_by_user_id uuid,
  remediated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_duty_violations_user ON duty_violations(user_id);
CREATE INDEX idx_duty_violations_status ON duty_violations(status);
CREATE INDEX idx_duty_violations_severity ON duty_violations(severity);
CREATE INDEX idx_duty_violations_detected ON duty_violations(detected_at);

-- Override Tracking Table
CREATE TABLE override_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  override_number text UNIQUE NOT NULL,
  override_type text NOT NULL,
  user_id uuid,
  approver_user_id uuid,
  transaction_type text NOT NULL,
  transaction_id text,
  original_threshold numeric,
  actual_amount numeric,
  justification text NOT NULL,
  override_reason text,
  risk_assessment text NOT NULL DEFAULT 'medium',
  approval_timestamp timestamptz DEFAULT now(),
  reviewed boolean DEFAULT false,
  review_notes text,
  flagged_for_audit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_override_tracking_user ON override_tracking(user_id);
CREATE INDEX idx_override_tracking_approver ON override_tracking(approver_user_id);
CREATE INDEX idx_override_tracking_reviewed ON override_tracking(reviewed);
CREATE INDEX idx_override_tracking_flagged ON override_tracking(flagged_for_audit);
CREATE INDEX idx_override_tracking_timestamp ON override_tracking(approval_timestamp);

-- Manual Anomaly Flags Table
CREATE TABLE manual_anomaly_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_number text UNIQUE NOT NULL,
  flagged_by_user_id uuid,
  flagged_at timestamptz DEFAULT now(),
  anomaly_category text NOT NULL,
  severity text NOT NULL,
  subject_user_id uuid,
  subject_clinic_id uuid,
  description text NOT NULL,
  supporting_evidence text,
  estimated_impact numeric,
  status text NOT NULL DEFAULT 'new',
  assigned_to_user_id uuid,
  investigation_notes text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_manual_anomaly_flags_flagged_by ON manual_anomaly_flags(flagged_by_user_id);
CREATE INDEX idx_manual_anomaly_flags_subject_user ON manual_anomaly_flags(subject_user_id);
CREATE INDEX idx_manual_anomaly_flags_status ON manual_anomaly_flags(status);
CREATE INDEX idx_manual_anomaly_flags_severity ON manual_anomaly_flags(severity);
CREATE INDEX idx_manual_anomaly_flags_category ON manual_anomaly_flags(anomaly_category);

-- Audit Alerts Table
CREATE TABLE audit_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_number text UNIQUE NOT NULL,
  alert_type text NOT NULL,
  severity text NOT NULL,
  triggered_at timestamptz DEFAULT now(),
  source_system text,
  affected_entity_type text,
  affected_entity_id text,
  alert_message text NOT NULL,
  alert_details jsonb,
  risk_score integer DEFAULT 0,
  requires_immediate_action boolean DEFAULT false,
  status text NOT NULL DEFAULT 'new',
  acknowledged_by_user_id uuid,
  acknowledged_at timestamptz,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_alerts_status ON audit_alerts(status);
CREATE INDEX idx_audit_alerts_severity ON audit_alerts(severity);
CREATE INDEX idx_audit_alerts_triggered ON audit_alerts(triggered_at);
CREATE INDEX idx_audit_alerts_immediate ON audit_alerts(requires_immediate_action);
CREATE INDEX idx_audit_alerts_type ON audit_alerts(alert_type);

-- Approval Workflows Table
CREATE TABLE approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_number text UNIQUE NOT NULL,
  transaction_type text NOT NULL,
  transaction_id text,
  transaction_amount numeric,
  requester_user_id uuid,
  requested_at timestamptz DEFAULT now(),
  threshold_id uuid REFERENCES approval_thresholds(id) ON DELETE SET NULL,
  required_approvals integer DEFAULT 1,
  current_approvals integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  approval_deadline timestamptz,
  final_approver_user_id uuid,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_approval_workflows_status ON approval_workflows(status);
CREATE INDEX idx_approval_workflows_requester ON approval_workflows(requester_user_id);
CREATE INDEX idx_approval_workflows_deadline ON approval_workflows(approval_deadline);

-- Approval Workflow Steps Table
CREATE TABLE approval_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  approver_user_id uuid,
  required_role text,
  status text NOT NULL DEFAULT 'pending',
  decision_at timestamptz,
  decision_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_approval_workflow_steps_workflow ON approval_workflow_steps(workflow_id);
CREATE INDEX idx_approval_workflow_steps_approver ON approval_workflow_steps(approver_user_id);
CREATE INDEX idx_approval_workflow_steps_status ON approval_workflow_steps(status);

-- Enable RLS
ALTER TABLE segregation_of_duties_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE override_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_anomaly_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for segregation_of_duties_rules
CREATE POLICY "Executives can view SOD rules"
  ON segregation_of_duties_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage SOD rules"
  ON segregation_of_duties_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for approval_thresholds
CREATE POLICY "Executives can view approval thresholds"
  ON approval_thresholds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage approval thresholds"
  ON approval_thresholds FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for duty_violations
CREATE POLICY "Executives can view duty violations"
  ON duty_violations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage duty violations"
  ON duty_violations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for override_tracking
CREATE POLICY "Executives can view override tracking"
  ON override_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage override tracking"
  ON override_tracking FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for manual_anomaly_flags
CREATE POLICY "Executives can view manual anomaly flags"
  ON manual_anomaly_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage manual anomaly flags"
  ON manual_anomaly_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for audit_alerts
CREATE POLICY "Executives can view audit alerts"
  ON audit_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage audit alerts"
  ON audit_alerts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for approval_workflows
CREATE POLICY "Executives can view approval workflows"
  ON approval_workflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage approval workflows"
  ON approval_workflows FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

-- RLS Policies for approval_workflow_steps
CREATE POLICY "Executives can view approval workflow steps"
  ON approval_workflow_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );

CREATE POLICY "Executives can manage approval workflow steps"
  ON approval_workflow_steps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'executive'
    )
  );
