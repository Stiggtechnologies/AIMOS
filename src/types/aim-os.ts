export type OutcomeStatus = 'active' | 'completed' | 'discontinued';
export type PerformanceRating = 'red' | 'amber' | 'green';
export type ReferralSourceType = 'employer' | 'insurer' | 'physician' | 'self_referral' | 'other';
export type RelationshipTier = 'platinum' | 'gold' | 'silver' | 'standard';
export type ReferralStatus = 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type TrendType = 'growing' | 'stable' | 'declining' | 'improving';
export type AccountHealth = 'healthy' | 'at_risk' | 'critical';
export type SlotStatus = 'available' | 'booked' | 'blocked' | 'completed' | 'cancelled' | 'no_show';
export type AlertLevel = 'normal' | 'warning' | 'critical';
export type PlanStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type AttestationType = 'read_and_understood' | 'training_completed' | 'compliance_confirmed';
export type AccessType = 'view' | 'download' | 'print' | 'edit';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type WellbeingFlagType = 'high_workload' | 'consecutive_intensity' | 'low_satisfaction' | 'attendance_concern';
export type EventType = 'natural_disaster' | 'system_outage' | 'security_breach' | 'health_emergency' | 'facility_issue' | 'other';
export type EmergencyStatus = 'active' | 'monitoring' | 'resolved';
export type DataClassification = 'ai_safe' | 'ai_restricted' | 'ai_prohibited' | 'requires_consent';
export type ConsentType = 'ai_analytics' | 'research' | 'quality_improvement' | 'marketing';
export type AIActionType = 'data_accessed' | 'model_trained' | 'prediction_generated' | 'data_exported';
export type IntegrationType = 'acquisition' | 'merger' | 'new_clinic' | 'franchise';
export type IntegrationStatus = 'planning' | 'day_0' | 'day_30' | 'day_90' | 'completed' | 'on_hold';
export type TaskCategory = 'legal' | 'hr' | 'it_systems' | 'operations' | 'clinical' | 'cultural' | 'financial';
export type Milestone = 'day_0' | 'day_30' | 'day_90' | 'ongoing';

export interface OutcomeMetric {
  id: string;
  name: string;
  description?: string;
  metric_type: string;
  unit?: string;
  target_value?: number;
  created_at: string;
}

export interface ClinicalOutcome {
  id: string;
  clinic_id: string;
  clinician_id?: string;
  episode_reference: string;
  metric_id: string;
  baseline_value?: number;
  final_value?: number;
  improvement_percentage?: number;
  episode_start_date?: string;
  episode_end_date?: string;
  outcome_status: OutcomeStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicianPerformanceSnapshot {
  id: string;
  clinician_id: string;
  clinic_id: string;
  period_start: string;
  period_end: string;
  total_episodes: number;
  avg_improvement_percentage?: number;
  patient_satisfaction_avg?: number;
  benchmark_percentile?: number;
  performance_rating?: PerformanceRating;
  created_at: string;
}

export interface ReferralSource {
  id: string;
  source_type: ReferralSourceType;
  organization_name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  relationship_tier: RelationshipTier;
  sla_hours: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployerAccount {
  id: string;
  referral_source_id: string;
  industry?: string;
  employee_count?: number;
  contract_start_date?: string;
  contract_end_date?: string;
  volume_commitment?: number;
  special_terms?: string;
  account_health: AccountHealth;
  created_at: string;
}

export interface Referral {
  id: string;
  referral_source_id?: string;
  clinic_id?: string;
  patient_reference: string;
  referral_date: string;
  first_appointment_date?: string;
  referral_status: ReferralStatus;
  sla_met?: boolean;
  hours_to_first_appointment?: number;
  converted: boolean;
  created_at: string;
}

export interface ReferralMetrics {
  id: string;
  referral_source_id: string;
  period_start: string;
  period_end: string;
  total_referrals: number;
  conversion_rate?: number;
  avg_time_to_appointment?: number;
  sla_breach_count: number;
  trend?: TrendType;
  created_at: string;
}

export interface AppointmentSlot {
  id: string;
  clinic_id: string;
  clinician_id: string;
  slot_date: string;
  slot_start_time: string;
  slot_end_time: string;
  slot_status: SlotStatus;
  patient_reference?: string;
  service_type?: string;
  created_at: string;
}

export interface CancellationReason {
  id: string;
  name: string;
  category?: string;
  is_preventable: boolean;
  created_at: string;
}

export interface UtilizationLog {
  id: string;
  clinic_id: string;
  clinician_id: string;
  log_date: string;
  scheduled_hours: number;
  delivered_hours: number;
  utilization_percentage?: number;
  empty_slots: number;
  cancellations: number;
  no_shows: number;
  alert_level?: AlertLevel;
  created_at: string;
}

export interface FinancialSnapshot {
  id: string;
  clinic_id: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_visits: number;
  revenue_per_visit?: number;
  clinician_hours?: number;
  revenue_per_hour?: number;
  margin_percentage?: number;
  payer_mix?: any;
  variance_vs_prior?: number;
  trend?: TrendType;
  alert_flags?: string[];
  created_at: string;
}

export interface ClinicFinancialMetric {
  id: string;
  clinic_id: string;
  metric_date: string;
  metric_name: string;
  metric_value: number;
  target_value?: number;
  variance?: number;
  notes?: string;
  created_at: string;
}

export interface CorrectivePlan {
  id: string;
  incident_id: string;
  root_cause_analysis: string;
  plan_summary: string;
  owner_id?: string;
  due_date: string;
  plan_status: PlanStatus;
  completion_date?: string;
  effectiveness_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface IncidentAction {
  id: string;
  corrective_plan_id: string;
  action_description: string;
  assigned_to?: string;
  due_date: string;
  action_status: ActionStatus;
  completion_date?: string;
  verification_notes?: string;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  policy_id: string;
  version_number: string;
  is_official: boolean;
  published_date?: string;
  expiry_date?: string;
  review_due_date?: string;
  change_summary?: string;
  published_by?: string;
  requires_attestation: boolean;
  created_at: string;
}

export interface Attestation {
  id: string;
  document_version_id: string;
  user_id: string;
  attested_at: string;
  attestation_type: AttestationType;
  ip_address?: string;
}

export interface DocumentAccessLog {
  id: string;
  policy_id: string;
  user_id: string;
  access_type?: AccessType;
  accessed_at: string;
  ip_address?: string;
}

export interface WorkloadMetric {
  id: string;
  clinician_id: string;
  clinic_id: string;
  week_start_date: string;
  total_hours: number;
  patient_contact_hours?: number;
  consecutive_high_intensity_days: number;
  overtime_hours: number;
  workload_score?: number;
  risk_level?: RiskLevel;
  created_at: string;
}

export interface PulseSurvey {
  id: string;
  clinic_id: string;
  survey_date: string;
  anonymous_response_id: string;
  stress_level?: number;
  workload_satisfaction?: number;
  support_satisfaction?: number;
  would_recommend?: boolean;
  comments?: string;
  created_at: string;
}

export interface StaffWellbeingFlag {
  id: string;
  clinician_id: string;
  flag_type: WellbeingFlagType;
  flag_date: string;
  severity: string;
  action_taken?: string;
  resolved_at?: string;
  created_at: string;
}

export interface EmergencyEvent {
  id: string;
  event_type: EventType;
  title: string;
  description: string;
  severity: string;
  affected_clinics?: string[];
  event_status: EmergencyStatus;
  declared_by?: string;
  declared_at: string;
  resolved_at?: string;
  playbook_used?: string;
  impact_summary?: string;
}

export interface CrisisTask {
  id: string;
  emergency_event_id: string;
  task_title: string;
  task_description?: string;
  assigned_to?: string;
  priority: string;
  crisis_task_status: ActionStatus;
  due_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface DataClassificationEntry {
  id: string;
  table_name: string;
  column_name: string;
  classification: DataClassification;
  data_owner_role?: string;
  retention_period_days?: number;
  notes?: string;
  last_reviewed_at?: string;
  created_at: string;
}

export interface ConsentScope {
  id: string;
  patient_reference: string;
  consent_type: ConsentType;
  consent_granted: boolean;
  granted_at?: string;
  expires_at?: string;
  revoked_at?: string;
  created_at: string;
}

export interface AIGovernanceLog {
  id: string;
  action_type: AIActionType;
  table_name?: string;
  record_count?: number;
  ai_system_name?: string;
  purpose: string;
  performed_by?: string;
  consent_verified: boolean;
  performed_at: string;
}

export interface ClinicIntegration {
  id: string;
  clinic_id: string;
  integration_type: IntegrationType;
  start_date: string;
  target_completion_date?: string;
  integration_status: IntegrationStatus;
  integration_lead_id?: string;
  day_0_completion_percentage: number;
  day_30_completion_percentage: number;
  day_90_completion_percentage: number;
  cultural_alignment_score?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationTask {
  id: string;
  integration_id: string;
  task_category: TaskCategory;
  task_title: string;
  task_description?: string;
  milestone: Milestone;
  assigned_to?: string;
  priority: string;
  integration_task_status: ActionStatus;
  due_date?: string;
  completed_date?: string;
  verification_notes?: string;
  created_at: string;
}

export interface MarketingChannel {
  id: string;
  channel_name: string;
  channel_type: string;
  platform?: string;
  description?: string;
  is_active: boolean;
  monthly_budget?: number;
  clinic_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  campaign_name: string;
  channel_id?: string;
  clinic_id?: string;
  campaign_type: string;
  start_date: string;
  end_date?: string;
  total_budget?: number;
  spent_to_date: number;
  target_cpl?: number;
  target_cpa?: number;
  status: string;
  geo_targets?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  campaign_id?: string;
  channel_id?: string;
  clinic_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  source_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  lead_score: number;
  injury_type?: string;
  preferred_contact?: string;
  notes?: string;
  status: string;
  converted_to_intake_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignMetric {
  id: string;
  campaign_id: string;
  metric_date: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  conversions: number;
  cpl?: number;
  cpa?: number;
  ctr?: number;
  conversion_rate?: number;
  roas?: number;
  created_at: string;
}

export interface IntakePipeline {
  id: string;
  lead_id?: string;
  clinic_id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email?: string;
  patient_phone: string;
  injury_type?: string;
  injury_date?: string;
  referral_source?: string;
  insurance_type?: string;
  stage: string;
  priority: string;
  assigned_to?: string;
  first_contact_at?: string;
  assessed_at?: string;
  booked_at?: string;
  first_visit_at?: string;
  drop_reason?: string;
  estimated_value?: number;
  actual_value?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IntakeAction {
  id: string;
  intake_id: string;
  action_type: string;
  action_by?: string;
  action_date: string;
  outcome?: string;
  next_action_due?: string;
  notes?: string;
  created_at: string;
}

export interface IntakeOutcome {
  id: string;
  intake_id: string;
  outcome_type: string;
  outcome_date: string;
  outcome_reason?: string;
  revenue_generated?: number;
  days_in_pipeline?: number;
  touches_to_conversion?: number;
  assigned_clinician?: string;
  notes?: string;
  created_at: string;
}

export interface IntakeAssignment {
  id: string;
  clinic_id: string;
  rule_name: string;
  rule_type: string;
  conditions?: Record<string, unknown>;
  assigned_to?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralPartner {
  id: string;
  partner_name: string;
  partner_type: string;
  industry?: string;
  company_size?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  address?: string;
  city?: string;
  province?: string;
  preferred_clinic_id?: string;
  relationship_status: string;
  relationship_health_score: number;
  total_referrals: number;
  ytd_referrals: number;
  avg_case_value?: number;
  lifetime_value?: number;
  last_referral_date?: string;
  last_contact_date?: string;
  next_contact_due?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  target_partner_type?: string;
  clinic_id?: string;
  start_date: string;
  end_date?: string;
  goal?: string;
  target_partners?: number;
  contacted: number;
  responded: number;
  converted: number;
  status: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralMetric {
  id: string;
  partner_id: string;
  metric_month: string;
  referrals_sent: number;
  referrals_converted: number;
  revenue_generated: number;
  avg_time_to_referral?: number;
  no_show_rate?: number;
  satisfaction_score?: number;
  touches: number;
  created_at: string;
}

export interface ReferralGap {
  id: string;
  partner_id: string;
  gap_type: string;
  gap_description: string;
  expected_volume?: number;
  actual_volume?: number;
  opportunity_value?: number;
  priority: string;
  action_required?: string;
  assigned_to?: string;
  status: string;
  detected_at: string;
  resolved_at?: string;
  created_at: string;
}

export interface RevOpsMetric {
  id: string;
  clinic_id?: string;
  metric_date: string;
  marketing_spend: number;
  leads_generated: number;
  cost_per_lead?: number;
  leads_contacted: number;
  leads_qualified: number;
  appointments_booked: number;
  appointments_attended: number;
  speed_to_contact_avg?: number;
  available_capacity_hours?: number;
  utilized_capacity_hours?: number;
  utilization_rate?: number;
  revenue_generated: number;
  revenue_per_lead?: number;
  revenue_per_booking?: number;
  revenue_per_clinician_hour?: number;
  lead_to_booking_rate?: number;
  booking_to_attendance_rate?: number;
  overall_conversion_rate?: number;
  primary_bottleneck?: string;
  created_at: string;
}

export interface CapacityAnalysis {
  id: string;
  clinic_id: string;
  analysis_date: string;
  inbound_leads: number;
  booking_requests: number;
  waitlist_count: number;
  demand_score: number;
  total_clinicians: number;
  available_hours?: number;
  booked_hours?: number;
  utilization_rate?: number;
  capacity_score: number;
  demand_supply_gap?: number;
  recommended_action?: string;
  urgency: string;
  created_at: string;
}

export interface BottleneckDetection {
  id: string;
  clinic_id?: string;
  detection_date: string;
  bottleneck_type: string;
  bottleneck_description: string;
  impact_level: string;
  estimated_revenue_loss?: number;
  recommended_action?: string;
  assigned_to?: string;
  status: string;
  resolved_at?: string;
  created_at: string;
}

export interface GrowthPlaybook {
  id: string;
  playbook_name: string;
  playbook_type: string;
  clinic_id?: string;
  description?: string;
  goal?: string;
  target_metric?: string;
  target_value?: number;
  duration_weeks?: number;
  estimated_cost?: number;
  expected_roi?: number;
  status: string;
  start_date?: string;
  end_date?: string;
  template?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaybookAction {
  id: string;
  playbook_id: string;
  action_name: string;
  action_type: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  status: string;
  completion_date?: string;
  outcome?: string;
  cost?: number;
  created_at: string;
  updated_at: string;
}

export interface PlaybookMetric {
  id: string;
  playbook_id: string;
  metric_date: string;
  metric_name: string;
  metric_value: number;
  target_value?: number;
  notes?: string;
  created_at: string;
}
