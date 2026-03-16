import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, Building2, Wifi, Stethoscope, Users, Megaphone, CreditCard, Package, Plus, Search, HeartPulse, FileText, Link } from 'lucide-react';

const DOMAIN_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  Facilities: { icon: <Building2 className="h-4 w-4" />, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  IT: { icon: <Wifi className="h-4 w-4" />, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  'Clinical Ops': { icon: <Stethoscope className="h-4 w-4" />, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  'Staff Hiring': { icon: <Users className="h-4 w-4" />, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  Marketing: { icon: <Megaphone className="h-4 w-4" />, color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200' },
  Billing: { icon: <CreditCard className="h-4 w-4" />, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  Equipment: { icon: <Package className="h-4 w-4" />, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
  'Provider Credentialing': { icon: <HeartPulse className="h-4 w-4" />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  'Payer Setup': { icon: <CreditCard className="h-4 w-4" />, color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
  'Referral Pathways': { icon: <Link className="h-4 w-4" />, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  'Clinical Protocols': { icon: <FileText className="h-4 w-4" />, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  'IT & EMR': { icon: <Wifi className="h-4 w-4" />, color: 'text-indigo-700', bg: 'bg-slate-50 border-slate-200' },
  'EPC Staffing': { icon: <Users className="h-4 w-4" />, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  'EPC Marketing': { icon: <Megaphone className="h-4 w-4" />, color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200' },
};

interface PlaybookTask {
  id: string;
  domain: string;
  title: string;
  day: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  owner: string;
}

const NEW_CLINIC_TASKS: PlaybookTask[] = [
  { id: '1', domain: 'Facilities', title: 'Confirm lease and possession date', day: 1, priority: 'critical', status: 'completed', owner: 'Operations' },
  { id: '2', domain: 'Facilities', title: 'Engage contractor for build-out', day: 1, priority: 'critical', status: 'completed', owner: 'Operations' },
  { id: '3', domain: 'Facilities', title: 'Submit building permit application', day: 3, priority: 'high', status: 'completed', owner: 'Operations' },
  { id: '4', domain: 'Facilities', title: 'Signage design and ordering', day: 7, priority: 'medium', status: 'in_progress', owner: 'Marketing' },
  { id: '5', domain: 'Facilities', title: 'Furniture and fixtures procurement', day: 14, priority: 'high', status: 'in_progress', owner: 'Operations' },
  { id: '6', domain: 'Facilities', title: 'Final inspections and occupancy permit', day: 38, priority: 'critical', status: 'not_started', owner: 'Operations' },
  { id: '7', domain: 'IT', title: 'Internet and phone lines ordered', day: 1, priority: 'critical', status: 'completed', owner: 'IT' },
  { id: '8', domain: 'IT', title: 'EMR clinic profile setup (Jane App)', day: 5, priority: 'critical', status: 'completed', owner: 'IT' },
  { id: '9', domain: 'IT', title: 'POS and payment terminal configured', day: 10, priority: 'high', status: 'in_progress', owner: 'IT' },
  { id: '10', domain: 'IT', title: 'Staff accounts and credentials created', day: 14, priority: 'high', status: 'not_started', owner: 'IT' },
  { id: '11', domain: 'IT', title: 'AIM OS clinic integration activated', day: 20, priority: 'critical', status: 'not_started', owner: 'IT' },
  { id: '12', domain: 'IT', title: 'Security cameras and alarm installed', day: 35, priority: 'medium', status: 'not_started', owner: 'IT' },
  { id: '13', domain: 'Clinical Ops', title: 'Define service menu and treatment rooms', day: 1, priority: 'critical', status: 'completed', owner: 'Clinical Lead' },
  { id: '14', domain: 'Clinical Ops', title: 'Submit college registration forms', day: 3, priority: 'critical', status: 'completed', owner: 'Clinical Lead' },
  { id: '15', domain: 'Clinical Ops', title: 'SOP review and localization', day: 7, priority: 'high', status: 'in_progress', owner: 'Clinical Lead' },
  { id: '16', domain: 'Clinical Ops', title: 'Payer credentialing applications (WCB, DVA)', day: 7, priority: 'critical', status: 'in_progress', owner: 'Billing' },
  { id: '17', domain: 'Clinical Ops', title: 'Clinical workflow and intake protocol setup', day: 14, priority: 'high', status: 'not_started', owner: 'Clinical Lead' },
  { id: '18', domain: 'Clinical Ops', title: 'Emergency protocol and safety training', day: 38, priority: 'critical', status: 'not_started', owner: 'Clinical Lead' },
  { id: '19', domain: 'Staff Hiring', title: 'Post clinic director / senior PT job', day: 1, priority: 'critical', status: 'completed', owner: 'HR' },
  { id: '20', domain: 'Staff Hiring', title: 'Post all remaining clinical roles', day: 3, priority: 'high', status: 'completed', owner: 'HR' },
  { id: '21', domain: 'Staff Hiring', title: 'Interview shortlist for all positions', day: 10, priority: 'high', status: 'in_progress', owner: 'HR' },
  { id: '22', domain: 'Staff Hiring', title: 'Offers sent to all hired staff', day: 21, priority: 'critical', status: 'not_started', owner: 'HR' },
  { id: '23', domain: 'Staff Hiring', title: 'Onboarding and orientation complete', day: 38, priority: 'critical', status: 'not_started', owner: 'HR' },
  { id: '24', domain: 'Marketing', title: 'Google Business Profile created', day: 1, priority: 'critical', status: 'completed', owner: 'Marketing' },
  { id: '25', domain: 'Marketing', title: 'Local SEO and website page live', day: 7, priority: 'high', status: 'in_progress', owner: 'Marketing' },
  { id: '26', domain: 'Marketing', title: 'Facebook/Instagram ads launched', day: 14, priority: 'high', status: 'not_started', owner: 'Marketing' },
  { id: '27', domain: 'Marketing', title: 'GP and specialist outreach (referral pipeline)', day: 14, priority: 'high', status: 'not_started', owner: 'Marketing' },
  { id: '28', domain: 'Marketing', title: 'Grand opening event planned', day: 21, priority: 'medium', status: 'not_started', owner: 'Marketing' },
  { id: '29', domain: 'Marketing', title: 'Trainer and gym partner outreach', day: 21, priority: 'medium', status: 'not_started', owner: 'Marketing' },
  { id: '30', domain: 'Billing', title: 'Business registration and CRA number', day: 1, priority: 'critical', status: 'completed', owner: 'Finance' },
  { id: '31', domain: 'Billing', title: 'Bank account and merchant services', day: 3, priority: 'critical', status: 'completed', owner: 'Finance' },
  { id: '32', domain: 'Billing', title: 'Fee schedule loaded into EMR', day: 10, priority: 'high', status: 'in_progress', owner: 'Billing' },
  { id: '33', domain: 'Billing', title: 'WCB billing setup and test claim', day: 21, priority: 'critical', status: 'not_started', owner: 'Billing' },
  { id: '34', domain: 'Billing', title: 'Group benefits / direct billing activation', day: 28, priority: 'high', status: 'not_started', owner: 'Billing' },
  { id: '35', domain: 'Equipment', title: 'Equipment list finalized and approved', day: 1, priority: 'critical', status: 'completed', owner: 'Operations' },
  { id: '36', domain: 'Equipment', title: 'Orders placed for all major equipment', day: 5, priority: 'critical', status: 'completed', owner: 'Operations' },
  { id: '37', domain: 'Equipment', title: 'Ultrasound / shockwave units delivered', day: 21, priority: 'high', status: 'not_started', owner: 'Operations' },
  { id: '38', domain: 'Equipment', title: 'Treatment tables set up and tested', day: 35, priority: 'high', status: 'not_started', owner: 'Operations' },
  { id: '39', domain: 'Equipment', title: 'Gym rehab area equipped and tested', day: 38, priority: 'medium', status: 'not_started', owner: 'Operations' },
];

const EPC_TASKS: PlaybookTask[] = [
  { id: 'e1', domain: 'Provider Credentialing', title: 'Submit college registration for all EPC providers', day: 1, priority: 'critical', status: 'completed', owner: 'Clinical Lead' },
  { id: 'e2', domain: 'Provider Credentialing', title: 'WCB physician registration and provider codes', day: 3, priority: 'critical', status: 'completed', owner: 'Billing' },
  { id: 'e3', domain: 'Provider Credentialing', title: 'DVA (Veterans Affairs) provider application submitted', day: 5, priority: 'critical', status: 'in_progress', owner: 'Billing' },
  { id: 'e4', domain: 'Provider Credentialing', title: 'AHS (Alberta Health Services) enrollment', day: 7, priority: 'critical', status: 'in_progress', owner: 'Billing' },
  { id: 'e5', domain: 'Provider Credentialing', title: 'CPSBC / CPSA registration verified for all providers', day: 14, priority: 'critical', status: 'in_progress', owner: 'HR' },
  { id: 'e6', domain: 'Provider Credentialing', title: 'Malpractice and liability insurance confirmed', day: 14, priority: 'high', status: 'not_started', owner: 'HR' },
  { id: 'e7', domain: 'Provider Credentialing', title: 'All payer credentialing approvals received', day: 45, priority: 'critical', status: 'not_started', owner: 'Billing' },
  { id: 'e8', domain: 'Payer Setup', title: 'EMR billing codes mapped for EPC service lines', day: 5, priority: 'critical', status: 'completed', owner: 'Billing' },
  { id: 'e9', domain: 'Payer Setup', title: 'Direct billing configuration tested (WCB, DVA, group benefits)', day: 14, priority: 'critical', status: 'in_progress', owner: 'Billing' },
  { id: 'e10', domain: 'Payer Setup', title: 'Fee schedule loaded and validated in EMR', day: 21, priority: 'high', status: 'in_progress', owner: 'Billing' },
  { id: 'e11', domain: 'Payer Setup', title: 'Test claim submitted and adjudicated successfully (WCB)', day: 30, priority: 'critical', status: 'not_started', owner: 'Billing' },
  { id: 'e12', domain: 'Payer Setup', title: 'Group benefits / extended health plans activated', day: 35, priority: 'high', status: 'not_started', owner: 'Billing' },
  { id: 'e13', domain: 'Payer Setup', title: 'AIM OS revenue tracking integrated for EPC billing codes', day: 40, priority: 'high', status: 'not_started', owner: 'IT' },
  { id: 'e14', domain: 'Referral Pathways', title: 'Identify top 20 GP/specialist referral targets in catchment', day: 1, priority: 'high', status: 'completed', owner: 'Clinical Lead' },
  { id: 'e15', domain: 'Referral Pathways', title: 'Draft referral MOU template and service description one-pager', day: 7, priority: 'high', status: 'completed', owner: 'Clinical Lead' },
  { id: 'e16', domain: 'Referral Pathways', title: 'Outreach meetings scheduled with target GPs (10+ confirmed)', day: 14, priority: 'critical', status: 'in_progress', owner: 'Clinical Lead' },
  { id: 'e17', domain: 'Referral Pathways', title: 'Referral intake form and triage protocol designed', day: 21, priority: 'high', status: 'not_started', owner: 'Clinical Lead' },
  { id: 'e18', domain: 'Referral Pathways', title: 'Minimum 5 GP MOUs signed', day: 30, priority: 'critical', status: 'not_started', owner: 'Clinical Lead' },
  { id: 'e19', domain: 'Referral Pathways', title: 'Referral tracking dashboard configured in AIM OS', day: 35, priority: 'medium', status: 'not_started', owner: 'IT' },
  { id: 'e20', domain: 'Referral Pathways', title: 'Feedback loop established with referring GPs', day: 60, priority: 'medium', status: 'not_started', owner: 'Clinical Lead' },
  { id: 'e21', domain: 'Clinical Protocols', title: 'EPC chronic care management pathways documented', day: 7, priority: 'critical', status: 'completed', owner: 'Clinical Lead' },
  { id: 'e22', domain: 'Clinical Protocols', title: 'Concussion / post-concussion protocol finalized', day: 10, priority: 'high', status: 'completed', owner: 'Clinical Lead' },
  { id: 'e23', domain: 'Clinical Protocols', title: 'MSK (musculoskeletal) assessment and care pathway documented', day: 14, priority: 'high', status: 'in_progress', owner: 'Clinical Lead' },
  { id: 'e24', domain: 'Clinical Protocols', title: 'Pain management and RTW/RTS protocols localized', day: 21, priority: 'high', status: 'not_started', owner: 'Clinical Lead' },
  { id: 'e25', domain: 'Clinical Protocols', title: 'Staff clinical protocol training completed', day: 50, priority: 'critical', status: 'not_started', owner: 'Clinical Lead' },
  { id: 'e26', domain: 'IT & EMR', title: 'EPC clinic profile created in Jane App / EMR', day: 3, priority: 'critical', status: 'completed', owner: 'IT' },
  { id: 'e27', domain: 'IT & EMR', title: 'AIM OS clinic integration and data sync activated', day: 7, priority: 'critical', status: 'completed', owner: 'IT' },
  { id: 'e28', domain: 'IT & EMR', title: 'Patient intake forms and consent templates loaded', day: 14, priority: 'high', status: 'in_progress', owner: 'IT' },
  { id: 'e29', domain: 'IT & EMR', title: 'Chronic care outcome tracking fields configured', day: 21, priority: 'high', status: 'not_started', owner: 'IT' },
  { id: 'e30', domain: 'IT & EMR', title: 'Referral tracking and GP communication module tested', day: 30, priority: 'medium', status: 'not_started', owner: 'IT' },
  { id: 'e31', domain: 'EPC Staffing', title: 'EPC physician or NP lead hired and contracted', day: 7, priority: 'critical', status: 'completed', owner: 'HR' },
  { id: 'e32', domain: 'EPC Staffing', title: 'Secondary EPC provider offer accepted', day: 21, priority: 'critical', status: 'in_progress', owner: 'HR' },
  { id: 'e33', domain: 'EPC Staffing', title: 'Medical office admin with EPC billing experience hired', day: 21, priority: 'high', status: 'not_started', owner: 'HR' },
  { id: 'e34', domain: 'EPC Staffing', title: 'Allied health team (PT, OT) rostered and onboarded', day: 35, priority: 'high', status: 'not_started', owner: 'HR' },
  { id: 'e35', domain: 'EPC Staffing', title: 'All staff complete EPC orientation and protocol training', day: 55, priority: 'critical', status: 'not_started', owner: 'HR' },
  { id: 'e36', domain: 'EPC Marketing', title: 'EPC service page live on AIM website', day: 7, priority: 'high', status: 'completed', owner: 'Marketing' },
  { id: 'e37', domain: 'EPC Marketing', title: 'GP referral package printed and distributed', day: 14, priority: 'high', status: 'in_progress', owner: 'Marketing' },
  { id: 'e38', domain: 'EPC Marketing', title: 'LinkedIn and Google Ads targeting chronic care patients', day: 21, priority: 'medium', status: 'not_started', owner: 'Marketing' },
  { id: 'e39', domain: 'EPC Marketing', title: 'Patient testimonials and outcome stories collected', day: 75, priority: 'low', status: 'not_started', owner: 'Marketing' },
];

const STATUS_CONFIG = {
  completed: { label: 'Done', icon: <CheckCircle className="h-4 w-4 text-green-600" />, color: 'text-green-700', bg: 'bg-green-100' },
  in_progress: { label: 'In Progress', icon: <Clock className="h-4 w-4 text-blue-600" />, color: 'text-blue-700', bg: 'bg-blue-100' },
  not_started: { label: 'Not Started', icon: <Clock className="h-4 w-4 text-gray-400" />, color: 'text-gray-600', bg: 'bg-gray-100' },
  blocked: { label: 'Blocked', icon: <AlertCircle className="h-4 w-4 text-red-600" />, color: 'text-red-700', bg: 'bg-red-100' },
};

const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

const TEMPLATES = [
  { id: 'new_clinic', label: 'New Clinic Launch', days: 45, tasks: 39, description: 'Complete 45-day playbook — lease to first patient' },
  { id: 'epc', label: 'EPC Flagship Clinic', days: 90, tasks: 39, description: '90-day EPC launch — credentialing, referral pathways, and payer setup' },
  { id: 'acquisition', label: 'Acquired Clinic Integration', days: 90, tasks: 68, description: '90-day integration for acquired clinics into AIM OS' },
  { id: 'partner', label: 'Partner Clinic Onboarding', days: 30, tasks: 34, description: '30-day affiliate onboarding to the AIM network' },
  { id: 'satellite', label: 'Satellite Clinic Setup', days: 21, tasks: 22, description: 'Rapid 21-day setup for satellite/mobile locations' },
];

const EPC_DOMAINS_ORDER = ['Provider Credentialing', 'Payer Setup', 'Referral Pathways', 'Clinical Protocols', 'IT & EMR', 'EPC Staffing', 'EPC Marketing'];

interface LaunchPlaybookManagerProps {
  onNavigate?: (module: string, subModule: string) => void;
}

export default function LaunchPlaybookManager({ onNavigate }: LaunchPlaybookManagerProps) {
  const [activeTemplate, setActiveTemplate] = useState('new_clinic');
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    Facilities: true, IT: true, 'Clinical Ops': true, 'Staff Hiring': true,
    Marketing: false, Billing: false, Equipment: false,
    'Provider Credentialing': true, 'Payer Setup': true, 'Referral Pathways': true,
    'Clinical Protocols': false, 'IT & EMR': false, 'EPC Staffing': false, 'EPC Marketing': false,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  const activeTasks = activeTemplate === 'epc' ? EPC_TASKS : NEW_CLINIC_TASKS;

  const tasks = activeTasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const domains = activeTemplate === 'epc'
    ? EPC_DOMAINS_ORDER
    : ['Facilities', 'IT', 'Clinical Ops', 'Staff Hiring', 'Marketing', 'Billing', 'Equipment'];

  const completedCount = activeTasks.filter(t => t.status === 'completed').length;
  const inProgressCount = activeTasks.filter(t => t.status === 'in_progress').length;
  const blockedCount = activeTasks.filter(t => t.status === 'blocked').length;
  const overallPct = Math.round((completedCount / activeTasks.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Launch Playbooks</h2>
          <p className="text-gray-600 mt-1">Standardized launch playbooks for every clinic type</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Launch Project
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {TEMPLATES.map(t => {
          const isEpc = t.id === 'epc';
          const isActive = activeTemplate === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTemplate(t.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${isActive
                ? isEpc ? 'border-emerald-500 bg-emerald-50' : 'border-blue-500 bg-blue-50'
                : isEpc ? 'border-emerald-200 bg-white hover:border-emerald-400' : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <div className="flex items-center justify-between mb-2">
                {isEpc
                  ? <HeartPulse className={`h-5 w-5 ${isActive ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  : <BookOpen className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                }
                <span className="text-xs font-semibold text-gray-500">{t.days}d</span>
              </div>
              <div className={`text-sm font-semibold ${isActive
                ? isEpc ? 'text-emerald-700' : 'text-blue-700'
                : isEpc ? 'text-emerald-800' : 'text-gray-800'}`}>{t.label}</div>
              <div className="text-xs text-gray-500 mt-1">{t.tasks} tasks</div>
            </button>
          );
        })}
      </div>

      {(activeTemplate === 'new_clinic' || activeTemplate === 'epc') && (
        <>
          {activeTemplate === 'epc' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HeartPulse className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-emerald-800 text-sm">EPC Flagship Clinic — 90-Day Launch Playbook</div>
                  <p className="text-xs text-emerald-700 mt-1">Enhanced Primary Care launch with focus on provider credentialing, payer enrollment (WCB, DVA, AHS), GP referral pathway establishment, and chronic care management protocol rollout. All 7 domains must reach 85%+ readiness before full program launch.</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className={`text-2xl font-bold ${activeTemplate === 'epc' ? 'text-emerald-600' : 'text-blue-600'}`}>{overallPct}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${activeTemplate === 'epc' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${overallPct}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-amber-600">{inProgressCount}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-red-600">{blockedCount}</div>
              <div className="text-sm text-gray-600">Blocked</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="space-y-3">
              {domains.map(domain => {
                const domainTasks = tasks.filter(t => t.domain === domain);
                if (domainTasks.length === 0) return null;
                const cfg = DOMAIN_CONFIG[domain];
                const doneCount = domainTasks.filter(t => t.status === 'completed').length;
                const isExpanded = expandedDomains[domain];

                return (
                  <div key={domain} className={`border rounded-lg overflow-hidden ${cfg.bg}`}>
                    <button
                      onClick={() => toggleDomain(domain)}
                      className="w-full flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cfg.color}>{cfg.icon}</span>
                        <span className={`font-semibold ${cfg.color}`}>{domain}</span>
                        <span className="text-xs text-gray-500">{doneCount}/{domainTasks.length} done</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-current opacity-60"
                            style={{ width: `${Math.round((doneCount / domainTasks.length) * 100)}%` }}
                          />
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white divide-y divide-gray-100">
                        {domainTasks.map(task => {
                          const sc = STATUS_CONFIG[task.status];
                          return (
                            <div key={task.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {sc.icon}
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {task.title}
                                  </div>
                                  <div className="text-xs text-gray-500">Day {task.day} · {task.owner}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${PRIORITY_COLORS[task.priority]}`}>
                                  {task.priority}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${sc.bg} ${sc.color}`}>
                                  {sc.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTemplate !== 'new_clinic' && activeTemplate !== 'epc' && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {TEMPLATES.find(t => t.id === activeTemplate)?.label}
          </h3>
          <p className="text-gray-500 mb-4">{TEMPLATES.find(t => t.id === activeTemplate)?.description}</p>
          <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Start a Project with this Template
          </button>
        </div>
      )}
    </div>
  );
}
