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
    description: 'Role-based landing layer for rapid decisions',
    icon: 'LayoutDashboard',
    color: 'blue',
    gradient: 'from-blue-600 to-blue-700',
    subItems: [
      { key: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
      { key: 'network', label: 'Network', icon: 'Globe', roles: ['executive', 'admin'] },
      { key: 'executive', label: 'Executive', icon: 'Crown', roles: ['executive', 'admin'] },
      { key: 'regional', label: 'Regional Ops', icon: 'Map', roles: ['executive', 'admin', 'regional_director'] },
      { key: 'clinic', label: 'Clinic Ops', icon: 'Building2', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'clinician', label: 'Clinician', icon: 'Stethoscope', roles: ['clinician'] },
      { key: 'revenue-cycle', label: 'Revenue Cycle', icon: 'DollarSign', roles: ['executive', 'admin', 'finance'] },
      { key: 'growth', label: 'Growth', icon: 'TrendingUp', roles: ['executive', 'admin', 'marketing'] },
      { key: 'strategy', label: 'Strategy', icon: 'Compass', roles: ['executive', 'admin'] },
      { key: 'alerts', label: 'Alerts', icon: 'AlertTriangle', badge: { type: 'count' } },
      { key: 'tasks', label: 'My Tasks', icon: 'CheckSquare' },
      { key: 'ai-insights', label: 'AI Insights', icon: 'Brain' },
      { key: 'notifications', label: 'Notifications', icon: 'Bell', badge: { type: 'count' } }
    ]
  },
  {
    key: 'operations',
    label: 'Operations',
    description: 'Clinic operational workflows and day-to-day management',
    icon: 'Settings',
    color: 'emerald',
    gradient: 'from-emerald-600 to-emerald-700',
    subItems: [
      { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { key: 'schedule', label: 'Schedule', icon: 'Calendar' },
      { key: 'rooms', label: 'Rooms & Capacity', icon: 'DoorOpen' },
      { key: 'staffing', label: 'Staffing', icon: 'Users' },
      { key: 'equipment', label: 'Equipment', icon: 'Wrench' },
      { key: 'tasks', label: 'Tasks & Automation', icon: 'ListTodo' },
      { key: 'case-aging', label: 'Case Aging', icon: 'Clock' },
      { key: 'ai-agents', label: 'Operational AI', icon: 'Bot', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'excellence', label: 'Operational Excellence', icon: 'Award', roles: ['executive', 'admin'] },
      { key: 'clinics', label: 'Clinics', icon: 'Building2', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'launches', label: 'Clinic Launches', icon: 'Rocket', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'partners', label: 'Partner Clinics', icon: 'Handshake', roles: ['executive', 'admin'] },
      { key: 'after-hours', label: 'After Hours', icon: 'Phone', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'communications', label: 'Communications', icon: 'MessageCircle' }
    ]
  },
  {
    key: 'assets',
    label: 'Assets',
    internalTitle: 'Asset Intelligence & Lifecycle Command Center',
    description: 'Physical asset tracking, maintenance, and capital planning',
    icon: 'Boxes',
    color: 'orange',
    gradient: 'from-orange-600 to-orange-700',
    subItems: [
      { key: 'dashboard', label: 'Asset Dashboard', icon: 'LayoutDashboard' },
      { key: 'register', label: 'Asset Register', icon: 'BookOpen' },
      { key: 'work-orders', label: 'Work Orders', icon: 'ClipboardList' },
      { key: 'acquisitions', label: 'Acquisition & Intake', icon: 'PackagePlus' },
      { key: 'capital-planning', label: 'Capital Planning', icon: 'Calculator' },
      { key: 'documents', label: 'Documents Center', icon: 'FileStack' },
      { key: 'analytics', label: 'Asset Analytics', icon: 'BarChart3' },
      { key: 'ai-copilot', label: 'AI Asset Copilot', icon: 'Bot' },
      { key: 'mobile-lookup', label: 'Mobile Lookup', icon: 'Smartphone' }
    ]
  },
  {
    key: 'clinical',
    label: 'Clinical',
    description: 'Patient care delivery and clinical intelligence',
    icon: 'Stethoscope',
    color: 'teal',
    gradient: 'from-teal-600 to-teal-700',
    subItems: [
      { key: 'patients', label: 'Patients', icon: 'Users' },
      { key: 'cases', label: 'Cases', icon: 'FolderOpen' },
      { key: 'assessments', label: 'Assessments', icon: 'ClipboardList' },
      { key: 'treatment-plans', label: 'Treatment Plans', icon: 'FileText' },
      { key: 'visits', label: 'Visits & Charting', icon: 'Calendar' },
      { key: 'exercises', label: 'Exercise Programs', icon: 'Dumbbell' },
      { key: 'gym-rehab', label: 'Gym Rehab', icon: 'Activity' },
      { key: 'rtw-rts', label: 'RTW / RTS', icon: 'Target' },
      { key: 'outcomes', label: 'Outcomes', icon: 'TrendingUp' },
      { key: 'documents', label: 'Documents', icon: 'FileStack' },
      { key: 'documentation', label: 'Clinical Documentation', icon: 'FileText', roles: ['clinician', 'admin', 'executive'] },
      { key: 'patient-education', label: 'Patient Education', icon: 'BookOpen' },
      { key: 'intelligence', label: 'Clinical Intelligence', icon: 'Brain', roles: ['executive', 'admin', 'clinician'] },
      { key: 'cii', label: 'CII Automation', icon: 'Cpu', roles: ['executive', 'admin', 'clinician'] },
      { key: 'evidence', label: 'Evidence & Research', icon: 'FlaskConical', roles: ['executive', 'admin', 'clinician'] },
      { key: 'semantic-search', label: 'Semantic Search', icon: 'Search', roles: ['executive', 'admin', 'clinician'] },
      { key: 'mobile', label: 'Mobile Dashboard', icon: 'Smartphone', roles: ['clinician'] }
    ]
  },
  {
    key: 'revenue',
    label: 'Revenue',
    description: 'Revenue cycle, financial execution, and clinic monetization',
    icon: 'DollarSign',
    color: 'amber',
    gradient: 'from-amber-600 to-amber-700',
    subItems: [
      { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { key: 'claims', label: 'Claims', icon: 'FileText' },
      { key: 'invoices', label: 'Invoices', icon: 'Receipt' },
      { key: 'payments', label: 'Payments', icon: 'CreditCard' },
      { key: 'ar', label: 'Accounts Receivable', icon: 'Banknote' },
      { key: 'cash-flow', label: 'Cash Flow', icon: 'TrendingUp', roles: ['executive', 'admin', 'finance'] },
      { key: 'retail', label: 'Retail Sales', icon: 'ShoppingCart' },
      { key: 'inventory', label: 'Inventory', icon: 'Package' },
      { key: 'fee-schedules', label: 'Fee Schedules', icon: 'List' },
      { key: 'pricing', label: 'Pricing & Payers', icon: 'Tag', roles: ['executive', 'admin', 'finance'] },
      { key: 'executive-finance', label: 'Executive Finance', icon: 'BarChart3', roles: ['executive', 'admin', 'finance'] },
      { key: 'import', label: 'Revenue Import', icon: 'Upload', roles: ['executive', 'admin', 'finance'] }
    ]
  },
  {
    key: 'growth',
    label: 'Growth',
    description: 'Patient acquisition, referrals, and growth engine',
    icon: 'TrendingUp',
    color: 'rose',
    gradient: 'from-rose-600 to-rose-700',
    subItems: [
      { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { key: 'leads', label: 'Leads', icon: 'UserPlus' },
      { key: 'intake-conversion', label: 'Intake Conversion', icon: 'Filter' },
      { key: 'trainers', label: 'Trainer Referrals', icon: 'Dumbbell' },
      { key: 'employers', label: 'Employer Programs', icon: 'Building2' },
      { key: 'campaigns', label: 'Campaigns', icon: 'Megaphone' },
      { key: 'demand-acquisition', label: 'Demand Acquisition', icon: 'Target' },
      { key: 'reviews', label: 'Google Reviews', icon: 'Star' },
      { key: 'referral-sources', label: 'Referral Sources', icon: 'Share2' },
      { key: 'experience', label: 'Experience & Reputation', icon: 'Heart' },
      { key: 'call-tracking', label: 'Call Tracking', icon: 'Phone', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'growth-engine', label: 'Growth Engine', icon: 'Zap', roles: ['executive', 'admin', 'marketing'] },
      { key: 'growth-engine-pipeline', label: 'Pipeline', icon: 'LayoutKanban', roles: ['executive', 'admin', 'marketing', 'clinic_manager'] },
      { key: 'growth-engine-attribution', label: 'Attribution', icon: 'BarChart2', roles: ['executive', 'admin', 'marketing'] },
      { key: 'growth-engine-messenger', label: 'Messenger Intake', icon: 'MessageCircle', roles: ['executive', 'admin', 'marketing', 'clinic_manager'] },
      { key: 'growth-engine-landing', label: 'Landing Pages', icon: 'Globe', roles: ['executive', 'admin', 'marketing'] },
      { key: 'growth-engine-automation', label: 'Automation Engine', icon: 'GitBranch', roles: ['executive', 'admin', 'marketing'] },
      { key: 'crm', label: 'CRM', icon: 'Target' },
      { key: 'revops', label: 'RevOps', icon: 'DollarSign', roles: ['executive', 'admin'] },
      { key: 'playbooks', label: 'Growth Playbooks', icon: 'BookOpen', roles: ['executive', 'admin', 'marketing'] }
    ]
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    description: 'Cross-domain analytics, forecasting, and AI agent execution',
    icon: 'BarChart3',
    color: 'cyan',
    gradient: 'from-cyan-600 to-cyan-700',
    subItems: [
      { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { key: 'clinic-performance', label: 'Clinic Performance', icon: 'Building2' },
      { key: 'clinical-outcomes', label: 'Clinical Outcomes', icon: 'Activity' },
      { key: 'revenue-analytics', label: 'Revenue Analytics', icon: 'DollarSign' },
      { key: 'referral-analytics', label: 'Referral Analytics', icon: 'Share2' },
      { key: 'acquisition', label: 'Patient Acquisition', icon: 'UserPlus' },
      { key: 'utilization', label: 'Utilization', icon: 'PieChart' },
      { key: 'forecasting', label: 'Forecasting', icon: 'TrendingUp' },
      { key: 'benchmarking', label: 'Benchmarking', icon: 'BarChart2' },
      { key: 'reports', label: 'Reports', icon: 'FileBarChart' },
      { key: 'agent-execution', label: 'AI Agents', icon: 'Bot', roles: ['executive', 'admin'] }
    ]
  },
  {
    key: 'strategy',
    label: 'Strategy',
    description: 'Enterprise planning, capital decisions, and governance',
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
      { key: 'capital', label: 'Capital Allocation', icon: 'Banknote', roles: ['executive', 'admin', 'finance'] },
      { key: 'expansion', label: 'Expansion Pipeline', icon: 'Map' },
      { key: 'risk', label: 'Risk Register', icon: 'AlertTriangle' },
      { key: 'vendor', label: 'Vendor Risk', icon: 'ShieldAlert', roles: ['executive', 'admin'] },
      { key: 'controls', label: 'Internal Controls', icon: 'Shield', roles: ['executive', 'admin'] },
      { key: 'valuation', label: 'Valuation Readiness', icon: 'TrendingUp', roles: ['executive'] },
      { key: 'governance', label: 'Digital Governance', icon: 'Shield', roles: ['executive'] },
      { key: 'ai-governance', label: 'AI Governance', icon: 'Bot', roles: ['executive', 'admin'] },
      { key: 'scorecard', label: 'Scorecard Engine', icon: 'BarChart3', roles: ['executive', 'admin', 'clinic_manager', 'regional_director'] },
      { key: 'goal-cascade', label: 'Goal Cascade', icon: 'GitBranch', roles: ['executive', 'admin', 'regional_director'] },
      { key: 'meeting-cadence', label: 'Meeting Cadence', icon: 'Calendar', roles: ['executive', 'admin', 'clinic_manager', 'regional_director'] },
      { key: 'kpi-governance', label: 'KPI Governance', icon: 'BookOpen', roles: ['executive', 'admin', 'regional_director'] },
      { key: 'fhir-event-bus', label: 'FHIR Event Bus', icon: 'Zap', roles: ['executive', 'admin'] }
    ]
  },
  {
    key: 'workforce',
    label: 'Workforce',
    description: 'People systems, credentialing, and workforce planning',
    icon: 'Users',
    color: 'orange',
    gradient: 'from-orange-600 to-orange-700',
    subItems: [
      { key: 'people', label: 'People', icon: 'Users' },
      { key: 'org-structure', label: 'Org Structure', icon: 'GitBranch' },
      { key: 'recruiting', label: 'Recruiting', icon: 'UserPlus' },
      { key: 'candidates', label: 'Candidate Pipeline', icon: 'ClipboardList' },
      { key: 'jobs', label: 'Jobs', icon: 'Briefcase' },
      { key: 'credentials', label: 'Credentials', icon: 'BadgeCheck' },
      { key: 'academy', label: 'Training Academy', icon: 'GraduationCap' },
      { key: 'workforce-health', label: 'Workforce Health', icon: 'Heart' },
      { key: 'talent-metrics', label: 'Talent Metrics', icon: 'BarChart2', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'capacity-planning', label: 'Capacity Planning', icon: 'BarChart3' },
      { key: 'roles', label: 'Roles & Permissions', icon: 'Shield', roles: ['executive', 'admin'] }
    ]
  },
  {
    key: 'supply_chain',
    label: 'Supply Chain',
    description: 'Procurement, inventory, and equipment management',
    icon: 'Package',
    color: 'stone',
    gradient: 'from-stone-600 to-stone-700',
    subItems: [
      { key: 'dashboard', label: 'Procurement Dashboard', icon: 'LayoutDashboard' },
      { key: 'purchase', label: 'Quick Purchase', icon: 'ShoppingCart' },
      { key: 'equipment', label: 'Equipment Purchasing', icon: 'Wrench' },
      { key: 'inventory', label: 'Inventory', icon: 'Package' },
      { key: 'vendors', label: 'Vendor Requests', icon: 'Handshake' },
      { key: 'budgets', label: 'Budget Controls', icon: 'Calculator', roles: ['executive', 'admin', 'clinic_manager'] }
    ]
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'Configuration, governance, and system management',
    icon: 'Cog',
    color: 'slate',
    gradient: 'from-slate-600 to-slate-700',
    subItems: [
      { key: 'users', label: 'Users', icon: 'Users' },
      { key: 'services', label: 'Services', icon: 'List' },
      { key: 'fee-schedules', label: 'Fee Schedules', icon: 'DollarSign' },
      { key: 'sops', label: 'Policies & SOPs', icon: 'FileText' },
      { key: 'forms', label: 'Forms', icon: 'ClipboardList' },
      { key: 'announcements', label: 'Announcements', icon: 'Megaphone' },
      { key: 'documents', label: 'Document Library', icon: 'FolderOpen' },
      { key: 'compliance', label: 'Compliance', icon: 'CheckSquare' },
      { key: 'dashboards', label: 'Dashboard Directory', icon: 'LayoutGrid' },
      { key: 'integrations', label: 'Integrations', icon: 'Plug' },
      { key: 'meta-systems', label: 'Meta Systems', icon: 'Cpu', roles: ['executive', 'admin'] },
      { key: 'approvals', label: 'Approval History', icon: 'CheckCircle', roles: ['executive', 'admin'] },
      { key: 'seed', label: 'Seed Tools', icon: 'Database', roles: ['admin'] },
      { key: 'settings', label: 'Settings', icon: 'Settings' },
      { key: 'audit-log', label: 'Audit Log', icon: 'ScrollText', roles: ['executive', 'admin'] }
    ]
  },
  {
    key: 'patient_experience',
    label: 'Patient Portal',
    description: 'Patient-facing app for appointments, exercises, progress, messages, and billing',
    icon: 'HeartPulse',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    subItems: [
      { key: 'portal', label: 'My Portal', icon: 'Home' }
    ]
  },
  {
    key: 'call_agent',
    label: 'Call Agent',
    description: '24/7 AI inbound call agent — intake, triage, booking, and escalation',
    icon: 'PhoneCall',
    color: 'blue',
    gradient: 'from-blue-700 to-cyan-600',
    subItems: [
      { key: 'sessions', label: 'Call Sessions', icon: 'Phone', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'appointments', label: 'Appointments', icon: 'Calendar', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'queue', label: 'Booking Queue', icon: 'PhoneCall', roles: ['executive', 'admin', 'clinic_manager'] },
      { key: 'settings', label: 'Agent Settings', icon: 'Settings', roles: ['executive', 'admin'] },
    ]
  },
  {
    key: 'aim_automation',
    label: 'Automation',
    description: 'Marketing automation, social media, content approvals, and review management',
    icon: 'Zap',
    color: 'blue',
    gradient: 'from-blue-600 to-blue-700',
    subItems: [
      { key: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
      { key: 'content-queue', label: 'Content Queue', icon: 'ListChecks' },
      { key: 'approval-center', label: 'Approval Center', icon: 'CheckSquare' },
      { key: 'review-triage', label: 'Review Triage', icon: 'MessageSquare' },
      { key: 'exception-center', label: 'Exception Center', icon: 'AlertTriangle' },
      { key: 'campaign-health', label: 'Campaign Health', icon: 'BarChart3' },
      { key: 'locations', label: 'Locations', icon: 'MapPin', roles: ['admin', 'executive'] },
      { key: 'integrations', label: 'Integrations', icon: 'Plug', roles: ['admin', 'executive'] },
      { key: 'policy-rules', label: 'Policy Rules', icon: 'Shield', roles: ['admin', 'executive'] },
      { key: 'audit-log', label: 'Audit Log', icon: 'ScrollText', roles: ['admin', 'executive'] },
      { key: 'settings', label: 'Settings', icon: 'Settings', roles: ['admin', 'executive'] }
    ]
  }
];

export const getModuleByKey = (key: ModuleKey): NavModule | undefined => {
  return moduleConfig.find(m => m.key === key);
};

export const getAccessibleModules = (roleLevel: string): ModuleKey[] => {
  const modulesByLevel: Record<string, ModuleKey[]> = {
    corporate: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence', 'strategy', 'workforce', 'supply_chain', 'admin', 'call_agent', 'aim_automation'],
    regional: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'intelligence', 'workforce', 'call_agent', 'aim_automation'],
    clinic: ['command_center', 'operations', 'clinical', 'revenue', 'growth', 'workforce', 'supply_chain', 'call_agent', 'aim_automation'],
    clinical: ['command_center', 'clinical', 'operations'],
    support: ['command_center', 'operations', 'revenue'],
    external: ['growth']
  };

  return modulesByLevel[roleLevel] || ['command_center'];
};

const ROLE_HIERARCHY: Record<string, string[]> = {
  executive: ['executive', 'admin', 'regional_director', 'clinic_manager', 'finance', 'marketing', 'clinician', 'contractor'],
  admin: ['executive', 'admin', 'regional_director', 'clinic_manager', 'finance', 'marketing', 'clinician', 'contractor'],
  regional_director: ['regional_director', 'clinic_manager'],
  clinic_manager: ['clinic_manager'],
  clinician: ['clinician'],
  contractor: ['contractor'],
  partner_read_only: ['partner_read_only'],
};

export const filterSubItemsByRole = (subItems: NavSubItem[], userRole: string): NavSubItem[] => {
  const effectiveRoles = ROLE_HIERARCHY[userRole] || [userRole];
  return subItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(r => effectiveRoles.includes(r));
  });
};

// Asset Management module should be added AFTER operations
