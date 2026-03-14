import type { ModuleKey } from '../types/enterprise';

export interface NavModule {
  key: ModuleKey;
  label: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  subItems: NavSubItem[];
}

export interface NavSubItem {
  key: string;
  label: string;
  icon: string;
  roles?: string[];
  badge?: {
    type: 'count' | 'status' | 'new';
    value?: string | number;
  };
}

export const moduleConfig: NavModule[] = [
  {
    key: 'command_center',
    label: 'Command Center',
    description: 'Real-time overview, alerts, KPIs, tasks, and AI insights',
    icon: 'LayoutDashboard',
    color: 'blue',
    gradient: 'from-blue-600 to-blue-700',
    subItems: [
      { key: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
      { key: 'alerts', label: 'Alerts', icon: 'AlertTriangle', badge: { type: 'count' } },
      { key: 'tasks', label: 'My Tasks', icon: 'CheckSquare' },
      { key: 'ai-insights', label: 'AI Insights', icon: 'Brain' },
      { key: 'performance', label: 'Performance', icon: 'TrendingUp' },
      { key: 'notifications', label: 'Notifications', icon: 'Bell', badge: { type: 'count' } }
    ]
  },
  {
    key: 'operations',
    label: 'Operations',
    description: 'Schedule, rooms, staff, equipment, tasks, clinic launches',
    icon: 'Settings',
    color: 'emerald',
    gradient: 'from-emerald-600 to-emerald-700',
    subItems: [
      { key: 'schedule', label: 'Schedule', icon: 'Calendar' },
      { key: 'rooms', label: 'Rooms', icon: 'DoorOpen' },
      { key: 'staff', label: 'Staff', icon: 'Users' },
      { key: 'equipment', label: 'Equipment', icon: 'Wrench' },
      { key: 'tasks', label: 'Tasks', icon: 'ListTodo' },
      { key: 'launches', label: 'Clinic Launches', icon: 'Rocket', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'partners', label: 'Partner Clinics', icon: 'Handshake', roles: ['executive', 'admin'] },
      { key: 'after-hours', label: 'After Hours', icon: 'Phone', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'communications', label: 'Communications', icon: 'MessageCircle' }
    ]
  },
  {
    key: 'clinical',
    label: 'Clinical',
    description: 'Patients, cases, assessments, treatment plans, visits',
    icon: 'Stethoscope',
    color: 'teal',
    gradient: 'from-teal-600 to-teal-700',
    subItems: [
      { key: 'patients', label: 'Patients', icon: 'Users' },
      { key: 'cases', label: 'Cases', icon: 'FolderOpen' },
      { key: 'assessments', label: 'Assessments', icon: 'ClipboardList' },
      { key: 'treatment-plans', label: 'Treatment Plans', icon: 'FileText' },
      { key: 'visits', label: 'Visits', icon: 'Calendar' },
      { key: 'exercises', label: 'Exercise Programs', icon: 'Dumbbell' },
      { key: 'rtw-rts', label: 'RTW / RTS', icon: 'Target' },
      { key: 'documents', label: 'Documents', icon: 'FileStack' },
      { key: 'outcomes', label: 'Outcomes', icon: 'TrendingUp' },
      { key: 'intelligence', label: 'Clinical Intelligence', icon: 'Brain', roles: ['executive', 'admin', 'clinician'] }
    ]
  },
  {
    key: 'revenue',
    label: 'Revenue',
    description: 'Claims, invoices, payments, AR, retail, inventory',
    icon: 'DollarSign',
    color: 'amber',
    gradient: 'from-amber-600 to-amber-700',
    subItems: [
      { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { key: 'claims', label: 'Claims', icon: 'FileText' },
      { key: 'invoices', label: 'Invoices', icon: 'Receipt' },
      { key: 'payments', label: 'Payments', icon: 'CreditCard' },
      { key: 'ar', label: 'Accounts Receivable', icon: 'Banknote' },
      { key: 'retail', label: 'Retail Sales', icon: 'ShoppingCart' },
      { key: 'inventory', label: 'Inventory', icon: 'Package' },
      { key: 'fee-schedules', label: 'Fee Schedules', icon: 'List' },
      { key: 'import', label: 'Revenue Import', icon: 'Upload', roles: ['executive', 'admin', 'finance'] }
    ]
  },
  {
    key: 'growth',
    label: 'Growth',
    description: 'Leads, referrals, employer programs, campaigns',
    icon: 'TrendingUp',
    color: 'rose',
    gradient: 'from-rose-600 to-rose-700',
    subItems: [
      { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { key: 'leads', label: 'Leads', icon: 'UserPlus' },
      { key: 'trainers', label: 'Trainer Referrals', icon: 'Dumbbell' },
      { key: 'employers', label: 'Employer Programs', icon: 'Building2' },
      { key: 'campaigns', label: 'Campaigns', icon: 'Megaphone' },
      { key: 'reviews', label: 'Google Reviews', icon: 'Star' },
      { key: 'referral-sources', label: 'Referral Sources', icon: 'Share2' },
      { key: 'call-tracking', label: 'Call Tracking', icon: 'Phone', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'crm', label: 'CRM', icon: 'Target' }
    ]
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    description: 'Analytics, outcomes, forecasting, reporting',
    icon: 'BarChart3',
    color: 'violet',
    gradient: 'from-violet-600 to-violet-700',
    subItems: [
      { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { key: 'clinic-performance', label: 'Clinic Performance', icon: 'Building2' },
      { key: 'clinical-outcomes', label: 'Clinical Outcomes', icon: 'Activity' },
      { key: 'revenue-analytics', label: 'Revenue Analytics', icon: 'DollarSign' },
      { key: 'referral-analytics', label: 'Referral Analytics', icon: 'Share2' },
      { key: 'acquisition', label: 'Patient Acquisition', icon: 'UserPlus' },
      { key: 'forecasting', label: 'Forecasting', icon: 'TrendingUp' },
      { key: 'agent-execution', label: 'AI Agents', icon: 'Bot', roles: ['executive', 'admin'] },
      { key: 'reports', label: 'Reports', icon: 'FileBarChart' }
    ]
  },
  {
    key: 'strategy',
    label: 'Strategy',
    description: 'Strategic plan, OKRs, initiatives, budgets, expansion',
    icon: 'Compass',
    color: 'sky',
    gradient: 'from-sky-600 to-sky-700',
    subItems: [
      { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { key: 'strategic-plan', label: 'Strategic Plan', icon: 'Map' },
      { key: 'okrs', label: 'OKRs', icon: 'Target' },
      { key: 'initiatives', label: 'Initiatives', icon: 'Rocket' },
      { key: 'budgets', label: 'Budgets', icon: 'Calculator' },
      { key: 'forecasts', label: 'Forecasts', icon: 'TrendingUp' },
      { key: 'expansion', label: 'Expansion Pipeline', icon: 'Map' },
      { key: 'risk', label: 'Risk Register', icon: 'AlertTriangle' },
      { key: 'governance', label: 'Digital Governance', icon: 'Shield', roles: ['executive'] }
    ]
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'Users, roles, services, settings, integrations',
    icon: 'Cog',
    color: 'slate',
    gradient: 'from-slate-600 to-slate-700',
    subItems: [
      { key: 'users', label: 'Users', icon: 'Users' },
      { key: 'roles', label: 'Roles & Permissions', icon: 'Shield' },
      { key: 'services', label: 'Services', icon: 'List' },
      { key: 'fee-schedules', label: 'Fee Schedules', icon: 'DollarSign' },
      { key: 'policies', label: 'Policies', icon: 'FileText' },
      { key: 'integrations', label: 'Integrations', icon: 'Plug' },
      { key: 'settings', label: 'Settings', icon: 'Settings' },
      { key: 'audit-log', label: 'Audit Log', icon: 'ScrollText', roles: ['executive', 'admin'] }
    ]
  }
];

export const getModuleByKey = (key: ModuleKey): NavModule | undefined => {
  return moduleConfig.find(m => m.key === key);
};

export const getAccessibleModules = (roleLevel: string): ModuleKey[] => {
  const modulesByLevel: Record<string, ModuleKey[]> = {
    corporate: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence', 'strategy', 'admin'],
    regional: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence'],
    clinic: ['command_center', 'operations', 'clinical', 'revenue', 'growth'],
    clinical: ['command_center', 'clinical', 'operations'],
    support: ['command_center', 'operations', 'revenue'],
    external: ['growth']
  };

  return modulesByLevel[roleLevel] || ['command_center'];
};

export const filterSubItemsByRole = (subItems: NavSubItem[], userRole: string): NavSubItem[] => {
  return subItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });
};
