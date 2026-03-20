export type RoleLevel = 'corporate' | 'regional' | 'clinic' | 'clinical' | 'support' | 'external';
export type RoleCategory = 'executive' | 'operations' | 'clinical' | 'growth' | 'finance' | 'technology' | 'support' | 'partner';

export type ModuleKey = 'command_center' | 'operations' | 'clinical' | 'revenue' | 'growth' | 'intelligence' | 'strategy' | 'workforce' | 'supply_chain' | 'admin' | 'patient_experience' | 'aim_automation' | 'call_agent';

export interface EnterpriseRole {
  id: string;
  name: string;
  code: string;
  role_level: RoleLevel;
  role_category: RoleCategory;
  description: string;
  permissions: string[];
  default_modules: ModuleKey[];
  can_delegate: boolean;
  reports_to: string | null;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  legal_name: string;
  settings: Record<string, unknown>;
  is_active: boolean;
}

export interface Region {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description: string;
  regional_director_id: string | null;
  target_clinic_count: number;
  target_revenue: number;
  is_active: boolean;
}

export interface EmployeeAssignment {
  id: string;
  user_id: string;
  organization_id: string;
  region_id: string | null;
  clinic_id: string | null;
  department_id: string | null;
  role_id: string;
  is_primary: boolean;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'casual';
  effective_date: string;
  end_date: string | null;
}

export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  description: string;
  icon: string;
  color: string;
  subModules: SubModule[];
}

export interface SubModule {
  key: string;
  label: string;
  icon: string;
  roles?: string[];
  badge?: string;
}

export interface CommandCenterConfig {
  roleCode: string;
  roleName: string;
  kpis: KPIConfig[];
  widgets: WidgetConfig[];
  quickActions: QuickAction[];
}

export interface KPIConfig {
  key: string;
  label: string;
  format: 'currency' | 'percentage' | 'number' | 'duration';
  target?: number;
  alertThreshold?: number;
}

export interface WidgetConfig {
  key: string;
  type: 'chart' | 'list' | 'table' | 'metric' | 'alert';
  title: string;
  size: 'small' | 'medium' | 'large';
  refreshInterval?: number;
}

export interface QuickAction {
  key: string;
  label: string;
  icon: string;
  action: string;
}

export interface NetworkStats {
  totalClinics: number;
  totalRegions: number;
  totalEmployees: number;
  ytdRevenue: number;
  avgUtilization: number;
  avgMargin: number;
}

export interface RegionalPerformance {
  region_id: string;
  region_name: string;
  region_code: string;
  clinic_count: number;
  total_revenue: number;
  avg_utilization: number;
  avg_margin: number;
  target_revenue: number;
  target_achievement_pct: number;
}

export interface ClinicPerformance {
  clinic_id: string;
  clinic_name: string;
  clinic_code: string;
  region_name: string;
  clinic_type: string;
  mtd_revenue: number;
  mtd_visits: number;
  utilization_rate: number;
  revenue_per_visit: number;
  target_revenue: number;
  revenue_target_pct: number;
  performance_status: 'on_track' | 'at_risk' | 'behind';
}
