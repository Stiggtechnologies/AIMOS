import { supabase } from '../lib/supabase';

export interface DataClassification {
  id: string;
  table_name: string;
  column_name?: string;
  classification_level?: 'public' | 'internal' | 'confidential' | 'restricted';
  ai_safe?: boolean;
  ai_restricted?: boolean;
  pii_flag?: boolean;
  phi_flag?: boolean;
  retention_years?: number;
  deletion_eligible?: boolean;
  owner_role?: string;
  consent_required?: boolean;
  data_sensitivity_level?: number;
  ai_readiness_score?: number;
  business_owner?: string;
  technical_owner?: string;
  last_audit_date?: string;
  next_audit_date?: string;
  compliance_frameworks?: string[];
  data_lineage?: any;
  version?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsentScope {
  id: string;
  scope_code: string;
  scope_name: string;
  description?: string;
  data_types_covered?: string[];
  ai_usage_allowed?: boolean;
  analytics_allowed?: boolean;
  third_party_sharing_allowed?: boolean;
  ai_model_types_allowed?: string[];
  data_retention_days?: number;
  anonymization_required?: boolean;
  human_review_required?: boolean;
  opt_out_allowed?: boolean;
  geographic_restrictions?: any;
  version?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserConsentRecord {
  id: string;
  user_id?: string;
  scope_id?: string;
  consent_given: boolean;
  consent_date?: string;
  expiry_date?: string;
  revoked_at?: string;
  consent_method?: string;
  ip_address?: string;
  user_agent?: string;
  version?: number;
  consent_text_hash?: string;
  witness_id?: string;
  parent_guardian_consent?: boolean;
  language_code?: string;
  created_at: string;
}

export interface AIGovernanceLog {
  id: string;
  log_type?: string;
  actor?: string;
  action: string;
  table_accessed?: string;
  records_affected?: number;
  consent_verified?: boolean;
  classification_verified?: boolean;
  purpose?: string;
  result?: string;
  denial_reason?: string;
  user_id?: string;
  session_id?: string;
  request_id?: string;
  data_classification_level?: string;
  consent_scope_verified?: string;
  anonymization_applied?: boolean;
  risk_score?: number;
  approved_by?: string;
  execution_time_ms?: number;
  metadata?: any;
  created_at: string;
}

export interface AIReadinessAssessment {
  id: string;
  assessment_date: string;
  assessment_type?: 'initial' | 'quarterly' | 'pre_deployment' | 'post_incident';
  overall_readiness_score?: number;
  data_classification_score?: number;
  consent_management_score?: number;
  audit_logging_score?: number;
  compliance_score?: number;
  technical_readiness_score?: number;
  blocking_issues?: any[];
  recommendations?: any[];
  assessed_by?: string;
  approved_by?: string;
  approval_date?: string;
  next_assessment_date?: string;
  status?: 'draft' | 'in_review' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DataOwnershipRegistry {
  id: string;
  data_domain: string;
  table_name: string;
  column_name?: string;
  business_owner_name: string;
  business_owner_email: string;
  business_owner_role?: string;
  technical_owner_name: string;
  technical_owner_email: string;
  technical_owner_role?: string;
  backup_owner_name?: string;
  backup_owner_email?: string;
  accountability_level?: 'primary' | 'secondary' | 'tertiary';
  decision_authority?: 'full' | 'limited' | 'advisory';
  escalation_contact?: string;
  last_reviewed_date?: string;
  next_review_date?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceAuditTrail {
  id: string;
  audit_date: string;
  audit_type?: 'scheduled' | 'triggered' | 'incident_response' | 'regulatory';
  framework: string;
  scope?: string;
  auditor_name: string;
  auditor_org?: string;
  items_checked?: number;
  items_passed?: number;
  items_failed?: number;
  critical_findings?: number;
  high_findings?: number;
  medium_findings?: number;
  low_findings?: number;
  findings?: any[];
  recommendations?: any[];
  remediation_plan?: any;
  remediation_deadline?: string;
  status?: 'in_progress' | 'completed' | 'remediation_required' | 'closed';
  result?: 'pass' | 'conditional_pass' | 'fail';
  certificate_issued?: boolean;
  certificate_expiry?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  conducted_by?: string;
  reviewed_by?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AIPolicyVersion {
  id: string;
  policy_code: string;
  policy_name: string;
  version: number;
  effective_date: string;
  expiry_date?: string;
  policy_text: string;
  policy_hash: string;
  change_summary?: string;
  changed_sections?: any[];
  author?: string;
  reviewed_by?: string;
  approved_by?: string;
  approval_date?: string;
  status?: 'draft' | 'in_review' | 'approved' | 'published' | 'superseded' | 'archived';
  supersedes_version?: number;
  requires_user_reacceptance?: boolean;
  is_current?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIGovernanceDashboard {
  overview: {
    total_data_assets: number;
    ai_safe_assets: number;
    ai_restricted_assets: number;
    avg_readiness_score: number;
    total_consent_scopes: number;
    active_consents: number;
    governance_logs_7d: number;
    compliance_audits_pending: number;
  };
  data_classifications: DataClassification[];
  consent_scopes: ConsentScope[];
  recent_governance_logs: AIGovernanceLog[];
  readiness_assessment: AIReadinessAssessment | null;
  compliance_status: ComplianceAuditTrail[];
  data_ownership: DataOwnershipRegistry[];
  policy_versions: AIPolicyVersion[];
}

export async function getAIGovernanceDashboard(): Promise<AIGovernanceDashboard> {
  const [
    classifications,
    scopes,
    logs,
    assessments,
    audits,
    ownership,
    policies,
  ] = await Promise.all([
    getDataClassifications(),
    getConsentScopes(),
    getGovernanceLogs(50),
    getLatestReadinessAssessment(),
    getComplianceAudits(),
    getDataOwnership(),
    getPublishedPolicies(),
  ]);

  const aiSafe = classifications.filter(c => c.ai_safe).length;
  const aiRestricted = classifications.filter(c => c.ai_restricted).length;
  const avgReadiness = classifications.length > 0
    ? classifications.reduce((sum, c) => sum + (c.ai_readiness_score || 0), 0) / classifications.length
    : 0;

  const activeConsents = await getActiveConsentCount();
  const logs7d = logs.filter(l =>
    new Date(l.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  const pendingAudits = audits.filter(a =>
    a.status === 'in_progress' || a.status === 'remediation_required'
  ).length;

  return {
    overview: {
      total_data_assets: classifications.length,
      ai_safe_assets: aiSafe,
      ai_restricted_assets: aiRestricted,
      avg_readiness_score: avgReadiness,
      total_consent_scopes: scopes.length,
      active_consents: activeConsents,
      governance_logs_7d: logs7d,
      compliance_audits_pending: pendingAudits,
    },
    data_classifications: classifications,
    consent_scopes: scopes,
    recent_governance_logs: logs,
    readiness_assessment: assessments,
    compliance_status: audits,
    data_ownership: ownership,
    policy_versions: policies,
  };
}

export async function getDataClassifications(): Promise<DataClassification[]> {
  const { data, error } = await supabase
    .from('data_classifications')
    .select('*')
    .order('table_name', { ascending: true })
    .limit(100);

  if (error) return generateMockClassifications();
  return data as DataClassification[];
}

export async function getConsentScopes(): Promise<ConsentScope[]> {
  const { data, error } = await supabase
    .from('consent_scopes')
    .select('*')
    .eq('is_active', true)
    .order('scope_code', { ascending: true });

  if (error) return generateMockConsentScopes();
  return data as ConsentScope[];
}

export async function getGovernanceLogs(limit: number = 100): Promise<AIGovernanceLog[]> {
  const { data, error } = await supabase
    .from('ai_governance_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return generateMockGovernanceLogs();
  return data as AIGovernanceLog[];
}

export async function getLatestReadinessAssessment(): Promise<AIReadinessAssessment | null> {
  const { data, error } = await supabase
    .from('ai_readiness_assessments')
    .select('*')
    .order('assessment_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return generateMockReadinessAssessment();
  return data as AIReadinessAssessment | null;
}

export async function getComplianceAudits(): Promise<ComplianceAuditTrail[]> {
  const { data, error } = await supabase
    .from('compliance_audit_trail')
    .select('*')
    .order('audit_date', { ascending: false })
    .limit(20);

  if (error) return generateMockComplianceAudits();
  return data as ComplianceAuditTrail[];
}

export async function getDataOwnership(): Promise<DataOwnershipRegistry[]> {
  const { data, error } = await supabase
    .from('data_ownership_registry')
    .select('*')
    .eq('is_active', true)
    .order('data_domain', { ascending: true })
    .limit(50);

  if (error) return generateMockDataOwnership();
  return data as DataOwnershipRegistry[];
}

export async function getPublishedPolicies(): Promise<AIPolicyVersion[]> {
  const { data, error } = await supabase
    .from('ai_policy_versions')
    .select('*')
    .in('status', ['published', 'approved'])
    .order('policy_code', { ascending: true });

  if (error) return generateMockPolicyVersions();
  return data as AIPolicyVersion[];
}

export async function getActiveConsentCount(): Promise<number> {
  const { count, error } = await supabase
    .from('user_consent_records')
    .select('*', { count: 'exact', head: true })
    .eq('consent_given', true)
    .is('revoked_at', null);

  if (error) return 0;
  return count || 0;
}

export async function logAIGovernanceEvent(
  log: Omit<AIGovernanceLog, 'id' | 'created_at'>
): Promise<AIGovernanceLog> {
  const { data, error } = await supabase
    .from('ai_governance_logs')
    .insert([log])
    .select()
    .single();

  if (error) throw error;
  return data as AIGovernanceLog;
}

export async function createDataClassification(
  classification: Omit<DataClassification, 'id' | 'created_at' | 'updated_at'>
): Promise<DataClassification> {
  const { data, error } = await supabase
    .from('data_classifications')
    .insert([classification])
    .select()
    .single();

  if (error) throw error;
  return data as DataClassification;
}

export async function updateDataClassification(
  id: string,
  updates: Partial<DataClassification>
): Promise<DataClassification> {
  const { data, error } = await supabase
    .from('data_classifications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DataClassification;
}

export async function createConsentScope(
  scope: Omit<ConsentScope, 'id' | 'created_at' | 'updated_at'>
): Promise<ConsentScope> {
  const { data, error } = await supabase
    .from('consent_scopes')
    .insert([scope])
    .select()
    .single();

  if (error) throw error;
  return data as ConsentScope;
}

export async function recordUserConsent(
  consent: Omit<UserConsentRecord, 'id' | 'created_at'>
): Promise<UserConsentRecord> {
  const { data, error } = await supabase
    .from('user_consent_records')
    .insert([consent])
    .select()
    .single();

  if (error) throw error;
  return data as UserConsentRecord;
}

export async function revokeUserConsent(
  consentId: string
): Promise<UserConsentRecord> {
  const { data, error } = await supabase
    .from('user_consent_records')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', consentId)
    .select()
    .single();

  if (error) throw error;
  return data as UserConsentRecord;
}

function generateMockClassifications(): DataClassification[] {
  return [
    {
      id: 'class-1',
      table_name: 'clinical_outcomes',
      column_name: 'pain_reduction_score',
      classification_level: 'internal',
      ai_safe: true,
      ai_restricted: false,
      pii_flag: false,
      phi_flag: false,
      retention_years: 7,
      deletion_eligible: false,
      owner_role: 'executive',
      consent_required: false,
      data_sensitivity_level: 2,
      ai_readiness_score: 90,
      business_owner: 'Clinical Operations',
      technical_owner: 'Data Engineering',
      compliance_frameworks: ['HIPAA', 'PHIPA', 'PIPEDA'],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'class-2',
      table_name: 'user_profiles',
      column_name: 'email',
      classification_level: 'confidential',
      ai_safe: false,
      ai_restricted: true,
      pii_flag: true,
      phi_flag: false,
      owner_role: 'admin',
      consent_required: true,
      data_sensitivity_level: 4,
      ai_readiness_score: 20,
      business_owner: 'Human Resources',
      technical_owner: 'IT Security',
      compliance_frameworks: ['PIPEDA', 'GDPR'],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'class-3',
      table_name: 'workload_metrics',
      classification_level: 'internal',
      ai_safe: true,
      ai_restricted: false,
      pii_flag: false,
      phi_flag: false,
      retention_years: 3,
      deletion_eligible: false,
      owner_role: 'executive',
      consent_required: false,
      data_sensitivity_level: 2,
      ai_readiness_score: 85,
      business_owner: 'Workforce Planning',
      technical_owner: 'Analytics Team',
      compliance_frameworks: ['Internal Policy'],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

function generateMockConsentScopes(): ConsentScope[] {
  return [
    {
      id: 'scope-1',
      scope_code: 'AI_TRAINING',
      scope_name: 'AI Model Training',
      description: 'Use of de-identified data for training AI models',
      data_types_covered: ['clinical_outcomes', 'appointment_slots', 'referrals'],
      ai_usage_allowed: true,
      analytics_allowed: true,
      third_party_sharing_allowed: false,
      ai_model_types_allowed: ['predictive_analytics', 'classification', 'regression'],
      data_retention_days: 1095,
      anonymization_required: true,
      human_review_required: false,
      opt_out_allowed: true,
      version: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'scope-2',
      scope_code: 'ANALYTICS',
      scope_name: 'Analytics & Reporting',
      description: 'Use of de-identified data for operational analytics',
      data_types_covered: ['workload_metrics', 'utilization_logs', 'financial_snapshots'],
      ai_usage_allowed: false,
      analytics_allowed: true,
      third_party_sharing_allowed: false,
      ai_model_types_allowed: [],
      data_retention_days: 730,
      anonymization_required: false,
      human_review_required: false,
      opt_out_allowed: true,
      version: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

function generateMockGovernanceLogs(): AIGovernanceLog[] {
  return [
    {
      id: 'log-1',
      log_type: 'policy_check',
      actor: 'system',
      action: 'Data classification verification',
      table_accessed: 'clinical_outcomes',
      records_affected: 0,
      consent_verified: true,
      classification_verified: true,
      purpose: 'Verify data safety for analytics',
      result: 'allowed',
      data_classification_level: 'internal',
      consent_scope_verified: 'ANALYTICS',
      anonymization_applied: false,
      risk_score: 15,
      execution_time_ms: 45,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-2',
      log_type: 'data_access',
      actor: 'analytics_engine',
      action: 'Aggregate metrics calculation',
      table_accessed: 'workload_metrics',
      records_affected: 250,
      consent_verified: true,
      classification_verified: true,
      purpose: 'Burnout risk analysis',
      result: 'allowed',
      data_classification_level: 'internal',
      consent_scope_verified: 'ANALYTICS',
      anonymization_applied: false,
      risk_score: 10,
      execution_time_ms: 234,
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function generateMockReadinessAssessment(): AIReadinessAssessment {
  return {
    id: 'assess-1',
    assessment_date: new Date().toISOString().split('T')[0],
    assessment_type: 'initial',
    overall_readiness_score: 72,
    data_classification_score: 85,
    consent_management_score: 78,
    audit_logging_score: 90,
    compliance_score: 65,
    technical_readiness_score: 55,
    blocking_issues: [
      { issue: 'PHI data not fully classified', severity: 'high' },
      { issue: 'AI model deployment procedures not documented', severity: 'medium' },
    ],
    recommendations: [
      { recommendation: 'Complete PHI classification audit', priority: 'high' },
      { recommendation: 'Document AI model deployment workflow', priority: 'medium' },
      { recommendation: 'Conduct user consent training for staff', priority: 'medium' },
    ],
    status: 'approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function generateMockComplianceAudits(): ComplianceAuditTrail[] {
  return [
    {
      id: 'audit-1',
      audit_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      audit_type: 'scheduled',
      framework: 'HIPAA',
      scope: 'Data classification and PHI handling',
      auditor_name: 'Jane Smith',
      auditor_org: 'Compliance Partners Inc.',
      items_checked: 45,
      items_passed: 42,
      items_failed: 3,
      critical_findings: 0,
      high_findings: 1,
      medium_findings: 2,
      low_findings: 0,
      findings: [
        { finding: 'Some PHI fields lack explicit consent tracking', severity: 'high' },
        { finding: 'Audit log retention period not documented', severity: 'medium' },
      ],
      status: 'remediation_required',
      result: 'conditional_pass',
      certificate_issued: false,
      follow_up_required: true,
      follow_up_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function generateMockDataOwnership(): DataOwnershipRegistry[] {
  return [
    {
      id: 'owner-1',
      data_domain: 'Clinical Operations',
      table_name: 'clinical_outcomes',
      business_owner_name: 'Dr. Sarah Chen',
      business_owner_email: 'sarah.chen@example.com',
      business_owner_role: 'Chief Clinical Officer',
      technical_owner_name: 'Mike Johnson',
      technical_owner_email: 'mike.johnson@example.com',
      technical_owner_role: 'Data Engineering Lead',
      accountability_level: 'primary',
      decision_authority: 'full',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'owner-2',
      data_domain: 'Workforce Management',
      table_name: 'workload_metrics',
      business_owner_name: 'Lisa Anderson',
      business_owner_email: 'lisa.anderson@example.com',
      business_owner_role: 'VP Workforce Planning',
      technical_owner_name: 'Tom Williams',
      technical_owner_email: 'tom.williams@example.com',
      technical_owner_role: 'Analytics Engineer',
      accountability_level: 'primary',
      decision_authority: 'full',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

function generateMockPolicyVersions(): AIPolicyVersion[] {
  return [
    {
      id: 'policy-1',
      policy_code: 'AI_USE_001',
      policy_name: 'AI Usage and Governance Policy',
      version: 1,
      effective_date: '2025-01-01',
      policy_text: 'This policy governs the ethical and compliant use of AI systems...',
      policy_hash: 'hash_001',
      status: 'published',
      is_current: true,
      requires_user_reacceptance: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'policy-2',
      policy_code: 'DATA_CLASS_001',
      policy_name: 'Data Classification Policy',
      version: 1,
      effective_date: '2025-01-01',
      policy_text: 'This policy defines data classification levels...',
      policy_hash: 'hash_002',
      status: 'published',
      is_current: true,
      requires_user_reacceptance: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}
