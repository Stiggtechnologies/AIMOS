// Digital Governance & Access Control Module Types

export type AssetType = 
  | 'domain'
  | 'workspace'
  | 'hosting'
  | 'ads'
  | 'analytics'
  | 'crm'
  | 'email'
  | 'social'
  | 'payment'
  | 'other';

export type AuditStatus = 
  | 'compliant'
  | 'needs_review'
  | 'non_compliant'
  | 'pending';

export type WorkspaceUserStatus =
  | 'active'
  | 'suspended'
  | 'archived';

export type OnboardingStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed';

export type OffboardingStatus =
  | 'pending'
  | 'in_progress'
  | 'completed';

export type OffboardingType =
  | 'voluntary'
  | 'involuntary'
  | 'contract_end'
  | 'other';

export type AuditAction =
  | 'user_created'
  | 'user_suspended'
  | 'user_activated'
  | 'user_deleted'
  | 'role_changed'
  | 'group_added'
  | 'group_removed'
  | 'mfa_enforced'
  | 'mfa_reset'
  | 'asset_added'
  | 'asset_updated'
  | 'asset_deleted'
  | 'audit_completed'
  | 'credentials_accessed'
  | 'template_created'
  | 'template_updated'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'offboarding_started'
  | 'offboarding_completed';

export interface DigitalAsset {
  id: string;
  asset_name: string;
  asset_type: AssetType;
  vendor: string;
  primary_owner_id?: string;
  primary_owner_name?: string;
  backup_owner_id?: string;
  backup_owner_name?: string;
  mfa_enabled: boolean;
  mfa_required: boolean;
  shared_credentials_allowed: boolean;
  account_email?: string;
  account_identifier?: string;
  renewal_date?: string;
  cost_monthly?: number;
  currency: string;
  last_audit_date?: string;
  last_audit_by_id?: string;
  last_audit_by_name?: string;
  audit_status?: AuditStatus;
  audit_notes?: string;
  credentials_vault_reference?: string;
  recovery_email?: string;
  recovery_phone?: string;
  runbook_url?: string;
  documentation_url?: string;
  notes?: string;
  is_active: boolean;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceUser {
  id: string;
  user_profile_id?: string;
  user_profile_name?: string;
  workspace_email: string;
  external_user_id?: string;
  role_template: string;
  role_template_display?: string;
  organizational_unit?: string;
  groups: string[];
  mfa_enrolled: boolean;
  mfa_enforced: boolean;
  recovery_email?: string;
  recovery_phone?: string;
  status: WorkspaceUserStatus;
  suspended_at?: string;
  suspended_by_id?: string;
  suspended_by_name?: string;
  suspension_reason?: string;
  provisioned_at?: string;
  provisioned_by_id?: string;
  provisioned_by_name?: string;
  offboarded_at?: string;
  offboarded_by_id?: string;
  offboarded_by_name?: string;
  offboarding_checklist_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceRoleTemplate {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  default_ou?: string;
  default_groups: string[];
  permissions: Record<string, any>;
  require_mfa: boolean;
  require_recovery_email: boolean;
  require_recovery_phone: boolean;
  auto_offboard_after_days?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccessAuditLog {
  id: string;
  performed_by_id: string;
  performed_by_email: string;
  performed_by_name?: string;
  action: AuditAction;
  target_type?: string;
  target_id?: string;
  target_identifier?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  change_summary?: string;
  reason?: string;
  ticket_reference?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface OnboardingQueueItem {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  personal_email?: string;
  phone?: string;
  role_template_id: string;
  role_template_name?: string;
  clinic_id?: string;
  clinic_name?: string;
  department?: string;
  start_date: string;
  manager_id?: string;
  manager_name?: string;
  status: OnboardingStatus;
  workspace_user_id?: string;
  workspace_email?: string;
  provisioning_error?: string;
  account_created: boolean;
  groups_assigned: boolean;
  mfa_pending: boolean;
  welcome_email_sent: boolean;
  equipment_assigned: boolean;
  requested_by_id: string;
  requested_by_name?: string;
  requested_at: string;
  completed_at?: string;
  completed_by_id?: string;
  completed_by_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OffboardingQueueItem {
  id: string;
  workspace_user_id: string;
  user_email: string;
  user_name?: string;
  last_day: string;
  offboarding_type?: OffboardingType;
  reason?: string;
  status: OffboardingStatus;
  account_suspended: boolean;
  groups_removed: boolean;
  emails_forwarded: boolean;
  data_transferred: boolean;
  equipment_returned: boolean;
  access_revoked: boolean;
  initiated_by_id: string;
  initiated_by_name?: string;
  initiated_at: string;
  completed_at?: string;
  completed_by_id?: string;
  completed_by_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DigitalGovernanceDashboard {
  // Compliance metrics
  mfa_compliance_percentage: number;
  admin_count: number;
  active_license_count: number;
  
  // Alerts
  alerts: {
    type: 'mfa_missing' | 'new_admin' | 'offboarding_overdue' | 'audit_overdue';
    message: string;
    severity: 'low' | 'medium' | 'high';
    target_id?: string;
  }[];
  
  // Recent changes (last 7 days)
  recent_changes: AccessAuditLog[];
  
  // Asset summary
  total_assets: number;
  assets_by_type: { type: AssetType; count: number }[];
  assets_needing_audit: number;
  
  // User summary
  total_users: number;
  users_without_mfa: number;
  pending_onboarding: number;
  pending_offboarding: number;
}

// Google Admin SDK integration types
export interface GoogleWorkspaceUser {
  primaryEmail: string;
  name: {
    givenName: string;
    familyName: string;
    fullName: string;
  };
  suspended: boolean;
  orgUnitPath: string;
  isAdmin: boolean;
  isDelegatedAdmin: boolean;
}

export interface GoogleWorkspaceGroup {
  id: string;
  email: string;
  name: string;
  description?: string;
  directMembersCount: number;
}
