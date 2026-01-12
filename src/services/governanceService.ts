import { supabase } from '../lib/supabase';

export interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  status: 'disabled' | 'pilot' | 'beta' | 'enabled' | 'deprecated';
  enabled_for_roles: string[];
  enabled_for_users: string[];
  pilot_clinic_ids: string[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AuditEvent {
  id: string;
  user_id: string;
  action: 'insert' | 'update' | 'delete' | 'select' | 'login' | 'logout' | 'access' | 'permission_check';
  table_name: string;
  record_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[];
  created_at: string;
}

export interface Permission {
  id: string;
  role: string;
  permission_key: string;
  permission_name: string;
  scope: 'global' | 'clinic' | 'self';
  description: string;
  is_active: boolean;
}

export interface PermissionCheck {
  id: string;
  user_id: string;
  permission_key: string;
  check_passed: boolean;
  denial_reason: string | null;
  checked_at: string;
}

export const governanceService = {
  async checkFeatureAccess(featureKey: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data, error } = await supabase.rpc('has_feature_access', {
        p_user_id: user.user.id,
        p_feature_key: featureKey
      });

      if (error) {
        console.error('Error checking feature access:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Feature access check failed:', error);
      return false;
    }
  },

  async checkPermission(permissionKey: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data, error } = await supabase.rpc('check_permission', {
        p_user_id: user.user.id,
        p_permission_key: permissionKey
      });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  },

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('feature_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      return [];
    }
  },

  async getFeatureFlag(featureKey: string): Promise<FeatureFlag | null> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching feature flag:', error);
      return null;
    }
  },

  async getAuditEvents(filters?: {
    userId?: string;
    tableName?: string;
    action?: string;
    limit?: number;
  }): Promise<AuditEvent[]> {
    try {
      let query = supabase
        .from('audit_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.tableName) {
        query = query.eq('table_name', filters.tableName);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      query = query.limit(filters?.limit || 100);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit events:', error);
      return [];
    }
  },

  async getRolePermissions(role: string): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role)
        .eq('is_active', true)
        .order('permission_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  },

  async getPermissionChecks(userId?: string, limit = 50): Promise<PermissionCheck[]> {
    try {
      let query = supabase
        .from('permission_checks')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching permission checks:', error);
      return [];
    }
  },

  async getFeatureAccessLog(userId?: string, limit = 50) {
    try {
      let query = supabase
        .from('feature_access_log')
        .select('*')
        .order('accessed_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feature access log:', error);
      return [];
    }
  },

  async updateFeatureFlag(
    featureKey: string,
    updates: Partial<Pick<FeatureFlag, 'status' | 'enabled_for_roles' | 'enabled_for_users' | 'config'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('feature_key', featureKey);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating feature flag:', error);
      return false;
    }
  },

  v2Features: {
    employerIntelligence: 'v2_employer_intelligence',
    payorIntelligence: 'v2_payor_intelligence',
    caseManagement: 'v2_case_management',
    credentialAlerts: 'v2_credential_alerts',
    capacityIntelligence: 'v2_capacity_intelligence',
    emrIntegration: 'v2_emr_integration',
    assistiveAI: 'v2_assistive_ai',
    advancedAudit: 'v2_advanced_audit'
  }
};
