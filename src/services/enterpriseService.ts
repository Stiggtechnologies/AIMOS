import { supabase } from '../lib/supabase';
import type {
  EnterpriseRole,
  Organization,
  Region,
  EmployeeAssignment,
  NetworkStats,
  RegionalPerformance,
  ClinicPerformance,
  ModuleKey
} from '../types/enterprise';

export const enterpriseService = {
  async getOrganization(): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
    return data;
  },

  async getRegions(): Promise<Region[]> {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching regions:', error);
      return [];
    }
    return data || [];
  },

  async getEnterpriseRoles(): Promise<EnterpriseRole[]> {
    const { data, error } = await supabase
      .from('enterprise_roles')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching enterprise roles:', error);
      return [];
    }
    return data || [];
  },

  async getUserAssignments(userId: string): Promise<EmployeeAssignment[]> {
    const { data, error } = await supabase
      .from('employee_assignments')
      .select(`
        *,
        enterprise_roles (
          name,
          code,
          role_level,
          role_category,
          permissions,
          default_modules
        ),
        regions (name, code),
        clinics (name, code)
      `)
      .eq('user_id', userId)
      .or('end_date.is.null,end_date.gt.now()');

    if (error) {
      console.error('Error fetching user assignments:', error);
      return [];
    }
    return data || [];
  },

  async getUserDefaultModules(userId: string): Promise<ModuleKey[]> {
    const { data, error } = await supabase
      .from('employee_assignments')
      .select(`
        enterprise_roles (default_modules)
      `)
      .eq('user_id', userId)
      .eq('is_primary', true)
      .or('end_date.is.null,end_date.gt.now()')
      .maybeSingle();

    if (error || !data) {
      return ['command_center', 'operations'];
    }

    const role = data.enterprise_roles as unknown as { default_modules: ModuleKey[] } | null;
    return role?.default_modules || ['command_center', 'operations'];
  },

  async getNetworkStats(): Promise<NetworkStats> {
    const { data, error } = await supabase
      .from('v_organization_summary')
      .select('*')
      .maybeSingle();

    if (error || !data) {
      return {
        totalClinics: 0,
        totalRegions: 0,
        totalEmployees: 0,
        ytdRevenue: 0,
        avgUtilization: 0,
        avgMargin: 0
      };
    }

    return {
      totalClinics: data.clinic_count || 0,
      totalRegions: data.region_count || 0,
      totalEmployees: data.employee_count || 0,
      ytdRevenue: data.ytd_revenue || 0,
      avgUtilization: data.avg_utilization || 0,
      avgMargin: data.avg_margin || 0
    };
  },

  async getRegionalPerformance(): Promise<RegionalPerformance[]> {
    const { data, error } = await supabase
      .from('v_regional_performance')
      .select('*')
      .order('total_revenue', { ascending: false });

    if (error) {
      console.error('Error fetching regional performance:', error);
      return [];
    }
    return (data || []) as unknown as RegionalPerformance[];
  },

  async getClinicPerformance(regionId?: string): Promise<ClinicPerformance[]> {
    let query = supabase
      .from('v_clinic_performance')
      .select('*');

    if (regionId) {
      query = query.eq('region_id', regionId);
    }

    const { data, error } = await query.order('mtd_revenue', { ascending: false });

    if (error) {
      console.error('Error fetching clinic performance:', error);
      return [];
    }
    return (data || []) as unknown as ClinicPerformance[];
  },

  async getClinicsWithRegions(): Promise<Array<{
    id: string;
    name: string;
    code: string;
    region_id: string | null;
    region_name: string | null;
    is_active: boolean;
  }>> {
    const { data, error } = await supabase
      .from('clinics')
      .select(`
        id,
        name,
        code,
        region_id,
        is_active,
        regions (name)
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching clinics:', error);
      return [];
    }

    return (data || []).map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      code: clinic.code,
      region_id: clinic.region_id,
      region_name: (clinic.regions as unknown as { name: string } | null)?.name || null,
      is_active: clinic.is_active
    }));
  },

  getRoleBasedModules(roleLevel: string, roleCategory: string): ModuleKey[] {
    const modulesByLevel: Record<string, ModuleKey[]> = {
      corporate: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence', 'strategy', 'admin'],
      regional: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence'],
      clinic: ['command_center', 'operations', 'clinical', 'revenue', 'growth'],
      clinical: ['command_center', 'clinical', 'operations'],
      support: ['command_center', 'operations', 'revenue'],
      external: ['growth']
    };

    return modulesByLevel[roleLevel] || ['command_center'];
  },

  getCommandCenterType(roleCode: string): 'executive' | 'clinic' | 'clinical' | 'growth' | 'strategy' | 'revenue' {
    const roleToCommandCenter: Record<string, 'executive' | 'clinic' | 'clinical' | 'growth' | 'strategy' | 'revenue'> = {
      'CEO': 'executive',
      'COO': 'executive',
      'CFO': 'revenue',
      'CCO': 'clinical',
      'CGO': 'growth',
      'CTO': 'strategy',
      'RD': 'executive',
      'RCD': 'clinical',
      'RGM': 'growth',
      'ROM': 'clinic',
      'CD': 'clinic',
      'CL': 'clinical',
      'FDS': 'clinic',
      'PT': 'clinical',
      'KIN': 'clinical',
      'RMT': 'clinical',
      'ET': 'clinical',
      'DC': 'clinical',
      'PCC': 'clinic',
      'BS': 'revenue',
      'MC': 'growth'
    };

    return roleToCommandCenter[roleCode] || 'clinic';
  }
};
