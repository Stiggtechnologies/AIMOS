import { supabase } from '../lib/supabase';

export type PermissionKey =
  | 'view_dashboards'
  | 'edit_clinics'
  | 'view_staffing'
  | 'view_credentials'
  | 'ai_insights'
  | 'audit_logs';

export type AccessLevel = 'full' | 'read_only' | 'none';

export interface UserPermission {
  userId: string;
  email: string;
  role: string;
  permissionKey: PermissionKey;
  permissionName: string;
  accessLevel: AccessLevel;
  scope: string;
  isGranted: boolean;
  effectiveAccess: AccessLevel;
}

export const permissionsService = {
  async checkPermission(permissionKey: PermissionKey, requiredLevel: 'full' | 'read_only' = 'full'): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_permission', {
        p_permission_key: permissionKey,
        p_required_level: requiredLevel
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error(`Error checking permission ${permissionKey}:`, error);
      return false;
    }
  },

  async canViewDashboards(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_view_dashboards');
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking can_view_dashboards:', error);
      return false;
    }
  },

  async canEditDashboards(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_edit_dashboards');
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking can_edit_dashboards:', error);
      return false;
    }
  },

  async canEditClinics(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_edit_clinics');
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking can_edit_clinics:', error);
      return false;
    }
  },

  async canViewStaffing(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_view_staffing');
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking can_view_staffing:', error);
      return false;
    }
  },

  async canEditStaffing(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_edit_staffing');
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking can_edit_staffing:', error);
      return false;
    }
  },

  async canViewCredentials(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_view_credentials');
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking can_view_credentials:', error);
      return false;
    }
  },

  async canEditCredentials(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_edit_credentials');
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking can_edit_credentials:', error);
      return false;
    }
  },

  async canViewAIInsights(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_view_ai_insights');
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking can_view_ai_insights:', error);
      return false;
    }
  },

  async canAccessAuditLogs(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_access_audit_logs');
      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking can_access_audit_logs:', error);
      return false;
    }
  },

  async getUserPermissions(): Promise<UserPermission[]> {
    try {
      const { data, error } = await supabase
        .from('user_permissions_view')
        .select('*');

      if (error) throw error;
      return (data || []) as UserPermission[];
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return [];
    }
  },

  async getAllPermissions(role: string): Promise<UserPermission[]> {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []) as any[];
    } catch (error) {
      console.error('Error fetching all permissions:', error);
      return [];
    }
  }
};
