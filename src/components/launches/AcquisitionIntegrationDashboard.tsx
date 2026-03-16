import { useState } from 'react';
import { CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, TriangleAlert as AlertTriangle, Building2, Wifi, Stethoscope, Users, CreditCard, BookOpen, Megaphone, ChevronDown, ChevronRight } from 'lucide-react';

const DOMAIN_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  'Branding & Signage': { icon: <Megaphone className="h-4 w-4" />, color: 'text-pink-600' },
  'IT & Systems': { icon: <Wifi className="h-4 w-4" />, color: 'text-blue-600' },
  'Clinical Ops': { icon: <Stethoscope className="h-4 w-4" />, color: 'text-teal-600' },
  'HR & Payroll': { icon: <Users className="h-4 w-4" />, color: 'text-green-600' },
  'Billing & Payers': { icon: <CreditCard className="h-4 w-4" />, color: 'text-amber-600' },
  'Governance & Compliance': { icon: <BookOpen className="h-4 w-4" />, color: 'text-gray-600' },
  'Facilities': { icon: <Building2 className="h-4 w-4" />, color: 'text-orange-600' },
};

interface IntTask {
  title: string;
  domain: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'blocked';
  owner: string;
  critical: boolean;
}

const PHASES: { id: 'day1' | 'day30' | 'day90'; label: string; description: string; tasks: IntTask[] }[] = [
  {
    id: 'day1',
    label: 'Day 1 — Immediate',
    description: 'Day 1 actions required before the first patient is seen at the new location',
    tasks: [
      { title: 'Change clinic name and contact info in all directories', domain: 'Branding & Signage', status: 'completed', owner: 'Marketing', critical: true },
      { title: 'Update Google Business Profile to AIM branding', domain: 'Branding & Signage', status: 'completed', owner: 'Marketing', critical: true },
      { title: 'Transfer existing patient files and consent forms', domain: 'Clinical Ops', status: 'completed', owner: 'Clinical Lead', critical: true },
      { title: 'Notify all active patients of ownership change', domain: 'Clinical Ops', status: 'completed', owner: 'Front Desk', critical: true },
      { title: 'AIM OS access granted to all staff', domain: 'IT & Systems', status: 'completed', owner: 'IT', critical: true },
      { title: 'EMR migration initiated or Jane App configured', domain: 'IT & Systems', status: 'in_progress', owner: 'IT', critical: true },
      { title: 'Payroll moved to AIM payroll system', domain: 'HR & Payroll', status: 'completed', owner: 'HR', critical: true },
      { title: 'Employment contracts signed with all retained staff', domain: 'HR & Payroll', status: 'completed', owner: 'HR', critical: true },
      { title: 'Bank account and payment terminals switched', domain: 'Billing & Payers', status: 'completed', owner: 'Finance', critical: true },
      { title: 'WCB provider number change notification sent', domain: 'Billing & Payers', status: 'in_progress', owner: 'Billing', critical: true },
      { title: 'AIM liability and malpractice insurance in place', domain: 'Governance & Compliance', status: 'completed', owner: 'Operations', critical: true },
      { title: 'College of PT updated with new ownership', domain: 'Governance & Compliance', status: 'in_progress', owner: 'Clinical Lead', critical: true },
    ],
  },
  {
    id: 'day30',
    label: 'Day 30 — Integration',
    description: 'Complete all operational integration tasks within the first 30 days',
    tasks: [
      { title: 'Full AIM signage installed inside and outside', domain: 'Branding & Signage', status: 'in_progress', owner: 'Marketing', critical: false },
      { title: 'AIM website location page published', domain: 'Branding & Signage', status: 'completed', owner: 'Marketing', critical: false },
      { title: 'EMR full migration complete and legacy data verified', domain: 'IT & Systems', status: 'in_progress', owner: 'IT', critical: true },
      { title: 'All staff passed AIM OS platform training', domain: 'IT & Systems', status: 'not_started', owner: 'IT', critical: false },
      { title: 'AIM service menu and fee schedule applied', domain: 'Clinical Ops', status: 'in_progress', owner: 'Clinical Lead', critical: true },
      { title: 'All SOPs distributed and signed off', domain: 'Clinical Ops', status: 'not_started', owner: 'Clinical Lead', critical: true },
      { title: 'Staff performance reviews completed', domain: 'HR & Payroll', status: 'not_started', owner: 'HR', critical: false },
      { title: 'Gap roles posted for hiring', domain: 'HR & Payroll', status: 'in_progress', owner: 'HR', critical: false },
      { title: 'WCB and DVA billing fully transitioned to AIM accounts', domain: 'Billing & Payers', status: 'not_started', owner: 'Billing', critical: true },
      { title: 'Group benefits and direct billing activated', domain: 'Billing & Payers', status: 'not_started', owner: 'Billing', critical: false },
      { title: 'Lease novation or assignment to AIM entity completed', domain: 'Governance & Compliance', status: 'in_progress', owner: 'Legal', critical: true },
      { title: 'Data privacy audit and PIPA sign-off', domain: 'Governance & Compliance', status: 'not_started', owner: 'Legal', critical: true },
    ],
  },
  {
    id: 'day90',
    label: 'Day 90 — Stabilization',
    description: 'Complete full stabilization and performance baseline by Day 90',
    tasks: [
      { title: 'Local marketing campaigns generating leads', domain: 'Branding & Signage', status: 'not_started', owner: 'Marketing', critical: false },
      { title: 'Google Reviews reaching 20+ with 4.5+ rating', domain: 'Branding & Signage', status: 'not_started', owner: 'Marketing', critical: false },
      { title: 'All legacy data archived or migrated', domain: 'IT & Systems', status: 'not_started', owner: 'IT', critical: false },
      { title: 'Analytics and reporting active in AIM OS', domain: 'IT & Systems', status: 'not_started', owner: 'IT', critical: false },
      { title: 'Clinical outcome tracking live', domain: 'Clinical Ops', status: 'not_started', owner: 'Clinical Lead', critical: false },
      { title: 'Referral partnerships established (GP, specialists)', domain: 'Clinical Ops', status: 'not_started', owner: 'Clinical Lead', critical: false },
      { title: 'Full staffing complement achieved', domain: 'HR & Payroll', status: 'not_started', owner: 'HR', critical: true },
      { title: 'Staff turnover risk assessment complete', domain: 'HR & Payroll', status: 'not_started', owner: 'HR', critical: false },
      { title: 'AR under 30 days', domain: 'Billing & Payers', status: 'not_started', owner: 'Billing', critical: true },
      { title: 'Revenue at 80%+ of AIM benchmark', domain: 'Billing & Payers', status: 'not_started', owner: 'Billing', critical: true },
      { title: 'Board and executive reporting integrated', domain: 'Governance & Compliance', status: 'not_started', owner: 'Operations', critical: false },
      { title: 'Facilities upgrades completed to AIM standard', domain: 'Facilities', status: 'not_started', owner: 'Operations', critical: false },
    ],
  },
];

const STATUS_CONFIG = {
  completed: { label: 'Done', icon: <CheckCircle className="h-4 w-4 text-green-600" />, bg: 'bg-green-100', color: 'text-green-700' },
  in_progress: { label: 'In Progress', icon: <Clock className="h-4 w-4 text-blue-600" />, bg: 'bg-blue-100', color: 'text-blue-700' },
  not_started: { label: 'Not Started', icon: <Clock className="h-4 w-4 text-gray-400" />, bg: 'bg-gray-100', color: 'text-gray-600' },
  blocked: { label: 'Blocked', icon: <AlertCircle className="h-4 w-4 text-red-600" />, bg: 'bg-red-100', color: 'text-red-700' },
};

const ACQUISITIONS = ['Acquired Clinic — Calgary NE (Demo)', 'New Acquisition Site'];

interface AcquisitionIntegrationDashboardProps {
  onNavigate?: (module: string, subModule: string) => void;
}

export default function AcquisitionIntegrationDashboard({ onNavigate }: AcquisitionIntegrationDashboardProps) {
  const [selectedAcq, setSelectedAcq] = useState(ACQUISITIONS[0]);
  const [activePhase, setActivePhase] = useState<'day1' | 'day30' | 'day90'>('day1');
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({ 'Branding & Signage': true, 'IT & Systems': true });

  const toggleDomain = (d: string) => setExpandedDomains(p => ({ ...p, [d]: !p[d] }));

  const currentPhase = PHASES.find(p => p.id === activePhase)!;
  const allTasks = PHASES.flatMap(p => p.tasks);
  const totalDone = allTasks.filter(t => t.status === 'completed').length;
  const day1Done = PHASES[0].tasks.filter(t => t.status === 'completed').length;
  const day30Done = PHASES[1].tasks.filter(t => t.status === 'completed').length;
  const day90Done = PHASES[2].tasks.filter(t => t.status === 'completed').length;
  const overallPct = Math.round(totalDone / allTasks.length * 100);

  const domains = Object.keys(DOMAIN_CONFIG);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Acquisition Integration Dashboard</h2>
          <p className="text-gray-600 mt-1">Day 1 / Day 30 / Day 90 integration milestone tracker</p>
        </div>
        <select
          value={selectedAcq}
          onChange={e => setSelectedAcq(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          {ACQUISITIONS.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Progress', value: `${overallPct}%`, color: 'text-blue-700' },
          { label: 'Day 1 Complete', value: `${day1Done}/${PHASES[0].tasks.length}`, color: 'text-green-700' },
          { label: 'Day 30 Complete', value: `${day30Done}/${PHASES[1].tasks.length}`, color: 'text-amber-700' },
          { label: 'Day 90 Complete', value: `${day90Done}/${PHASES[2].tasks.length}`, color: 'text-gray-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          {PHASES.map((phase, idx) => {
            const phaseDone = phase.tasks.filter(t => t.status === 'completed').length;
            const phasePct = Math.round(phaseDone / phase.tasks.length * 100);
            return (
              <div key={phase.id} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setActivePhase(phase.id)}
                  className={`flex-1 p-3 rounded-lg border-2 text-left transition-all ${activePhase === phase.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <div className={`text-sm font-semibold ${activePhase === phase.id ? 'text-blue-700' : 'text-gray-700'}`}>{phase.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{phaseDone}/{phase.tasks.length} done · {phasePct}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full ${phasePct === 100 ? 'bg-green-500' : activePhase === phase.id ? 'bg-blue-500' : 'bg-gray-400'}`} style={{ width: `${phasePct}%` }} />
                  </div>
                </button>
                {idx < PHASES.length - 1 && <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900">{currentPhase.label}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{currentPhase.description}</p>
        </div>

        <div className="space-y-3">
          {domains.map(domain => {
            const domainTasks = currentPhase.tasks.filter(t => t.domain === domain);
            if (domainTasks.length === 0) return null;
            const cfg = DOMAIN_CONFIG[domain];
            const doneCt = domainTasks.filter(t => t.status === 'completed').length;
            const isExpanded = expandedDomains[domain] ?? false;
            const hasBlocked = domainTasks.some(t => t.status === 'blocked');
            const critPending = domainTasks.filter(t => t.status !== 'completed' && t.critical).length;

            return (
              <div key={domain} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleDomain(domain)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={cfg.color}>{cfg.icon}</span>
                    <span className="font-medium text-gray-800 text-sm">{domain}</span>
                    <span className="text-xs text-gray-500">{doneCt}/{domainTasks.length}</span>
                    {hasBlocked && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3" />Blocked
                      </span>
                    )}
                    {critPending > 0 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">{critPending} critical</span>
                    )}
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 divide-y divide-gray-100 bg-gray-50">
                    {domainTasks.map((task, idx) => {
                      const sc = STATUS_CONFIG[task.status];
                      return (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white transition-colors">
                          {sc.icon}
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {task.title}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">{task.owner}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {task.critical && task.status !== 'completed' && (
                              <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700">Critical</span>
                            )}
                            <span className={`px-2 py-0.5 text-xs rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
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
    </div>
  );
}
