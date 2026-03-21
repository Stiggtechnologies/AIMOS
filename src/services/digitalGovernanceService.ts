import { supabase } from '../lib/supabase';
import type {
  DigitalAsset,
  WorkspaceUser,
  WorkspaceRoleTemplate,
  AccessAuditLog,
  OnboardingQueueItem,
  OffboardingQueueItem,
  DigitalGovernanceDashboard,
  AuditAction,
} from '../types/digitalGovernance';

export type {
  DigitalAsset,
  WorkspaceUser,
  WorkspaceRoleTemplate,
  AccessAuditLog,
  OnboardingQueueItem,
  OffboardingQueueItem,
  DigitalGovernanceDashboard,
  AuditAction,
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

export async function getDigitalGovernanceDashboard(): Promise<DigitalGovernanceDashboard> {
  try {
    // Get MFA compliance
    const { data: mfaData } = await supabase.rpc('get_mfa_compliance_percentage');
    
    // Get admin count
    const { data: adminData } = await supabase.rpc('get_admin_count');
    
    // Get active users count
    const { count: userCount } = await supabase
      .from('workspace_users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    // Get users without MFA
    const { count: noMfaCount } = await supabase
      .from('workspace_users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('mfa_enrolled', false);
    
    // Get recent audit logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentLogs } = await supabase
      .from('access_audit_log')
      .select(`
        *,
        performer:user_profiles!performed_by_id(first_name, last_name)
      `)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get asset stats
    const { count: assetCount } = await supabase
      .from('digital_assets')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    const { count: assetsNeedingAudit } = await supabase
      .from('digital_assets')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .or('audit_status.eq.needs_review,audit_status.eq.pending');
    
    // Get pending queues
    const { count: pendingOnboarding } = await supabase
      .from('onboarding_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']);
    
    const { count: pendingOffboarding } = await supabase
      .from('offboarding_queue')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']);
    
    // Build alerts
    const alerts: DigitalGovernanceDashboard['alerts'] = [];
    
    if (noMfaCount && noMfaCount > 0) {
      alerts.push({
        type: 'mfa_missing',
        message: `${noMfaCount} user(s) missing MFA enrollment`,
        severity: 'high',
      });
    }
    
    if (assetsNeedingAudit && assetsNeedingAudit > 0) {
      alerts.push({
        type: 'audit_overdue',
        message: `${assetsNeedingAudit} asset(s) need audit review`,
        severity: 'medium',
      });
    }
    
    return {
      mfa_compliance_percentage: mfaData || 0,
      admin_count: adminData || 0,
      active_license_count: userCount || 0,
      alerts,
      recent_changes: recentLogs || [],
      total_assets: assetCount || 0,
      assets_by_type: [], // TODO: Aggregate by type
      assets_needing_audit: assetsNeedingAudit || 0,
      total_users: userCount || 0,
      users_without_mfa: noMfaCount || 0,
      pending_onboarding: pendingOnboarding || 0,
      pending_offboarding: pendingOffboarding || 0,
    };
  } catch (error) {
    console.error('Error fetching digital governance dashboard:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// DIGITAL ASSETS
// ═══════════════════════════════════════════════════════════════

export async function getDigitalAssets(filters?: {
  asset_type?: string;
  vendor?: string;
  audit_status?: string;
}): Promise<DigitalAsset[]> {
  let query = supabase
    .from('digital_assets')
    .select(`
      *,
      primary_owner:user_profiles!primary_owner_id(first_name, last_name),
      backup_owner:user_profiles!backup_owner_id(first_name, last_name),
      auditor:user_profiles!last_audit_by_id(first_name, last_name)
    `)
    .eq('is_active', true)
    .order('asset_name');
  
  if (filters?.asset_type) {
    query = query.eq('asset_type', filters.asset_type);
  }
  
  if (filters?.vendor) {
    query = query.eq('vendor', filters.vendor);
  }
  
  if (filters?.audit_status) {
    query = query.eq('audit_status', filters.audit_status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function createDigitalAsset(asset: Partial<DigitalAsset>): Promise<DigitalAsset> {
  const { data, error } = await supabase
    .from('digital_assets')
    .insert(asset)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('asset_added', 'asset', data.id, data.asset_name);
  
  return data;
}

export async function updateDigitalAsset(id: string, updates: Partial<DigitalAsset>): Promise<DigitalAsset> {
  const { data, error } = await supabase
    .from('digital_assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('asset_updated', 'asset', data.id, data.asset_name);
  
  return data;
}

// ═══════════════════════════════════════════════════════════════
// WORKSPACE USERS
// ═══════════════════════════════════════════════════════════════

export async function getWorkspaceUsers(filters?: {
  role_template?: string;
  mfa_enrolled?: boolean;
  status?: string;
}): Promise<WorkspaceUser[]> {
  let query = supabase
    .from('workspace_users')
    .select(`
      *,
      profile:user_profiles!user_profile_id(first_name, last_name),
      provisioner:user_profiles!provisioned_by_id(first_name, last_name)
    `)
    .order('workspace_email');
  
  if (filters?.role_template) {
    query = query.eq('role_template', filters.role_template);
  }
  
  if (filters?.mfa_enrolled !== undefined) {
    query = query.eq('mfa_enrolled', filters.mfa_enrolled);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function createWorkspaceUser(user: Partial<WorkspaceUser>): Promise<WorkspaceUser> {
  const { data, error } = await supabase
    .from('workspace_users')
    .insert(user)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('user_created', 'user', data.id, data.workspace_email);
  
  return data;
}

export async function suspendWorkspaceUser(id: string, reason: string): Promise<WorkspaceUser> {
  const { data: currentUser } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('workspace_users')
    .update({
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspended_by_id: currentUser?.user?.id,
      suspension_reason: reason,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('user_suspended', 'user', data.id, data.workspace_email, reason);
  
  return data;
}

export async function activateWorkspaceUser(id: string): Promise<WorkspaceUser> {
  const { data, error } = await supabase
    .from('workspace_users')
    .update({
      status: 'active',
      suspended_at: null,
      suspended_by_id: null,
      suspension_reason: null,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('user_activated', 'user', data.id, data.workspace_email);
  
  return data;
}

// ═══════════════════════════════════════════════════════════════
// ROLE TEMPLATES
// ═══════════════════════════════════════════════════════════════

export async function getRoleTemplates(): Promise<WorkspaceRoleTemplate[]> {
  const { data, error } = await supabase
    .from('workspace_role_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_name');
  
  if (error) throw error;
  return data || [];
}

export async function createRoleTemplate(template: Partial<WorkspaceRoleTemplate>): Promise<WorkspaceRoleTemplate> {
  const { data, error } = await supabase
    .from('workspace_role_templates')
    .insert(template)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('template_created', 'template', data.id, data.name);
  
  return data;
}

// ═══════════════════════════════════════════════════════════════
// ONBOARDING QUEUE
// ═══════════════════════════════════════════════════════════════

export async function getOnboardingQueue(status?: string): Promise<OnboardingQueueItem[]> {
  let query = supabase
    .from('onboarding_queue')
    .select(`
      *,
      role_template:workspace_role_templates!role_template_id(display_name),
      clinic:clinics!clinic_id(name),
      manager:user_profiles!manager_id(first_name, last_name),
      requester:user_profiles!requested_by_id(first_name, last_name)
    `)
    .order('start_date');
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function createOnboardingRequest(request: Partial<OnboardingQueueItem>): Promise<OnboardingQueueItem> {
  const { data: currentUser } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('onboarding_queue')
    .insert({
      ...request,
      requested_by_id: currentUser?.user?.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('onboarding_started', 'onboarding', data.id, `${data.first_name} ${data.last_name}`);
  
  return data;
}

export async function completeOnboarding(id: string): Promise<OnboardingQueueItem> {
  const { data: currentUser } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('onboarding_queue')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by_id: currentUser?.user?.id,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('onboarding_completed', 'onboarding', data.id, `${data.first_name} ${data.last_name}`);
  
  return data;
}

// ═══════════════════════════════════════════════════════════════
// OFFBOARDING QUEUE
// ═══════════════════════════════════════════════════════════════

export async function getOffboardingQueue(status?: string): Promise<OffboardingQueueItem[]> {
  let query = supabase
    .from('offboarding_queue')
    .select(`
      *,
      workspace_user:workspace_users!workspace_user_id(workspace_email),
      initiator:user_profiles!initiated_by_id(first_name, last_name)
    `)
    .order('last_day');
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function createOffboardingRequest(request: Partial<OffboardingQueueItem>): Promise<OffboardingQueueItem> {
  const { data: currentUser } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('offboarding_queue')
    .insert({
      ...request,
      initiated_by_id: currentUser?.user?.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('offboarding_started', 'offboarding', data.id, data.user_email);
  
  return data;
}

export async function completeOffboarding(id: string): Promise<OffboardingQueueItem> {
  const { data: currentUser } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('offboarding_queue')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by_id: currentUser?.user?.id,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  // Log audit action
  await logAuditAction('offboarding_completed', 'offboarding', data.id, data.user_email);
  
  return data;
}

// ═══════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════

export async function getAuditLog(filters?: {
  action?: string;
  target_type?: string;
  days?: number;
}): Promise<AccessAuditLog[]> {
  let query = supabase
    .from('access_audit_log')
    .select(`
      *,
      performer:user_profiles!performed_by_id(first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (filters?.action) {
    query = query.eq('action', filters.action);
  }
  
  if (filters?.target_type) {
    query = query.eq('target_type', filters.target_type);
  }
  
  if (filters?.days) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - filters.days);
    query = query.gte('created_at', daysAgo.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

async function logAuditAction(
  action: AuditAction,
  targetType: string,
  targetId: string,
  targetIdentifier: string,
  reason?: string
): Promise<void> {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', currentUser?.user?.id)
      .single();
    
    await supabase.rpc('log_audit_action', {
      p_performed_by_id: currentUser?.user?.id,
      p_performed_by_email: profile?.email || 'unknown',
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId,
      p_target_identifier: targetIdentifier,
      p_before_state: null,
      p_after_state: null,
      p_reason: reason,
    });
  } catch (error) {
    console.error('Error logging audit action:', error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

// ═══════════════════════════════════════════════════════════════
// GOOGLE ADMIN SDK INTEGRATION (Placeholder)
// ═══════════════════════════════════════════════════════════════

export async function provisionGoogleWorkspaceUser(
  email: string,
  firstName: string,
  lastName: string,
  orgUnitPath: string,
  groups: string[]
): Promise<{ success: boolean; userId?: string; error?: string }> {
  // TODO: Implement Google Admin SDK integration
  // This would call a Supabase Edge Function that uses the Google Admin SDK
  
  console.log('Provisioning Google Workspace user:', { email, firstName, lastName, orgUnitPath, groups });
  
  return {
    success: false,
    error: 'Google Admin SDK integration not yet implemented',
  };
}

export async function suspendGoogleWorkspaceUser(email: string): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement Google Admin SDK integration
  
  console.log('Suspending Google Workspace user:', email);
  
  return {
    success: false,
    error: 'Google Admin SDK integration not yet implemented',
  };
}

export async function enforceMfaForUser(email: string): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement Google Admin SDK integration
  
  console.log('Enforcing MFA for user:', email);
  
  return {
    success: false,
    error: 'Google Admin SDK integration not yet implemented',
  };
}
