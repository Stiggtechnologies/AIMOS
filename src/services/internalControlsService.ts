import { supabase } from '../lib/supabase';

export interface SegregationOfDutiesRule {
  id: string;
  rule_number: string;
  rule_name: string;
  description: string;
  incompatible_role_a: string;
  incompatible_role_b: string;
  risk_category: string;
  severity: string;
  is_active: boolean;
  violation_action: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalThreshold {
  id: string;
  threshold_name: string;
  transaction_type: string;
  amount_min: number;
  amount_max?: number;
  required_approver_role: string;
  approver_count_required: number;
  escalation_role?: string;
  auto_approve_below: number;
  must_block_above?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DutyViolation {
  id: string;
  violation_number: string;
  rule_id?: string;
  user_id?: string;
  detected_at: string;
  violation_type: string;
  severity: string;
  description: string;
  risk_score: number;
  status: string;
  remediation_notes?: string;
  remediated_by_user_id?: string;
  remediated_at?: string;
  created_at: string;
}

export interface OverrideTracking {
  id: string;
  override_number: string;
  override_type: string;
  user_id?: string;
  approver_user_id?: string;
  transaction_type: string;
  transaction_id?: string;
  original_threshold?: number;
  actual_amount?: number;
  justification: string;
  override_reason?: string;
  risk_assessment: string;
  approval_timestamp: string;
  reviewed: boolean;
  review_notes?: string;
  flagged_for_audit: boolean;
  created_at: string;
}

export interface ManualAnomalyFlag {
  id: string;
  flag_number: string;
  flagged_by_user_id?: string;
  flagged_at: string;
  anomaly_category: string;
  severity: string;
  subject_user_id?: string;
  subject_clinic_id?: string;
  description: string;
  supporting_evidence?: string;
  estimated_impact?: number;
  status: string;
  assigned_to_user_id?: string;
  investigation_notes?: string;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AuditAlert {
  id: string;
  alert_number: string;
  alert_type: string;
  severity: string;
  triggered_at: string;
  source_system?: string;
  affected_entity_type?: string;
  affected_entity_id?: string;
  alert_message: string;
  alert_details?: any;
  risk_score: number;
  requires_immediate_action: boolean;
  status: string;
  acknowledged_by_user_id?: string;
  acknowledged_at?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ApprovalWorkflow {
  id: string;
  workflow_number: string;
  transaction_type: string;
  transaction_id?: string;
  transaction_amount?: number;
  requester_user_id?: string;
  requested_at: string;
  threshold_id?: string;
  required_approvals: number;
  current_approvals: number;
  status: string;
  approval_deadline?: string;
  final_approver_user_id?: string;
  completed_at?: string;
  created_at: string;
}

export async function getSODRules(): Promise<SegregationOfDutiesRule[]> {
  const { data, error } = await supabase
    .from('segregation_of_duties_rules')
    .select('*')
    .eq('is_active', true)
    .order('severity', { ascending: false })
    .order('rule_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getApprovalThresholds(): Promise<ApprovalThreshold[]> {
  const { data, error } = await supabase
    .from('approval_thresholds')
    .select('*')
    .eq('is_active', true)
    .order('transaction_type', { ascending: true })
    .order('amount_min', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getDutyViolations(): Promise<DutyViolation[]> {
  const { data, error } = await supabase
    .from('duty_violations')
    .select('*')
    .in('status', ['open', 'investigating'])
    .order('severity', { ascending: false })
    .order('detected_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getOverrideTracking(): Promise<OverrideTracking[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('override_tracking')
    .select('*')
    .gte('approval_timestamp', thirtyDaysAgo.toISOString())
    .order('approval_timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUnreviewedOverrides(): Promise<OverrideTracking[]> {
  const { data, error } = await supabase
    .from('override_tracking')
    .select('*')
    .eq('reviewed', false)
    .order('approval_timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getManualAnomalyFlags(): Promise<ManualAnomalyFlag[]> {
  const { data, error } = await supabase
    .from('manual_anomaly_flags')
    .select('*')
    .in('status', ['new', 'investigating', 'escalated'])
    .order('severity', { ascending: false })
    .order('flagged_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAuditAlerts(): Promise<AuditAlert[]> {
  const { data, error } = await supabase
    .from('audit_alerts')
    .select('*')
    .in('status', ['new', 'acknowledged', 'investigating'])
    .order('severity', { ascending: false })
    .order('triggered_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCriticalAuditAlerts(): Promise<AuditAlert[]> {
  const { data, error } = await supabase
    .from('audit_alerts')
    .select('*')
    .eq('requires_immediate_action', true)
    .in('status', ['new', 'acknowledged'])
    .order('triggered_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPendingApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function calculateControlMetrics() {
  const [
    sodRules,
    violations,
    overrides,
    unreviewedOverrides,
    anomalyFlags,
    auditAlerts,
    criticalAlerts,
    pendingWorkflows,
  ] = await Promise.all([
    getSODRules(),
    getDutyViolations(),
    getOverrideTracking(),
    getUnreviewedOverrides(),
    getManualAnomalyFlags(),
    getAuditAlerts(),
    getCriticalAuditAlerts(),
    getPendingApprovalWorkflows(),
  ]);

  const criticalViolations = violations.filter(v => v.severity === 'critical').length;
  const highRiskOverrides = overrides.filter(o => o.risk_assessment === 'critical' || o.risk_assessment === 'high').length;
  const flaggedForAudit = overrides.filter(o => o.flagged_for_audit).length;

  return {
    activeSODRules: sodRules.length,
    openViolations: violations.length,
    criticalViolations,
    totalOverrides: overrides.length,
    unreviewedOverrides: unreviewedOverrides.length,
    highRiskOverrides,
    flaggedForAudit,
    activeAnomalyFlags: anomalyFlags.length,
    totalAuditAlerts: auditAlerts.length,
    criticalAlerts: criticalAlerts.length,
    pendingApprovals: pendingWorkflows.length,
  };
}

export interface AnomalyDetection {
  id: string;
  detection_date: string;
  anomaly_type: string;
  severity: string;
  affected_user_id?: string;
  clinic_id?: string;
  description: string;
  risk_score: number;
  investigation_status: string;
  resolution?: string;
}

export interface AuditFlag {
  id: string;
  flag_date: string;
  flag_type: string;
  severity: string;
  area: string;
  clinic_id?: string;
  description: string;
  status: string;
  assigned_to_id?: string;
  due_date?: string;
}

export async function getAnomalyDetections(): Promise<AnomalyDetection[]> {
  const flags = await getManualAnomalyFlags();
  return flags.map(f => ({
    id: f.id,
    detection_date: f.flagged_at,
    anomaly_type: f.anomaly_category,
    severity: f.severity,
    affected_user_id: f.subject_user_id,
    clinic_id: f.subject_clinic_id,
    description: f.description,
    risk_score: f.estimated_impact || 0,
    investigation_status: f.status,
    resolution: f.resolution,
  }));
}

export async function getAuditFlags(): Promise<AuditFlag[]> {
  const alerts = await getAuditAlerts();
  return alerts.map(a => ({
    id: a.id,
    flag_date: a.triggered_at,
    flag_type: a.alert_type,
    severity: a.severity,
    area: a.source_system || 'system',
    clinic_id: a.affected_entity_type === 'clinic' ? a.affected_entity_id : undefined,
    description: a.alert_message,
    status: a.status,
    assigned_to_id: a.acknowledged_by_user_id,
    due_date: a.acknowledged_at,
  }));
}
