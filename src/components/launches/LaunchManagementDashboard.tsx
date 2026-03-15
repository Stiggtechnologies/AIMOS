import { useState } from 'react';
import { Rocket, Plus, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, TrendingUp, DollarSign, Users, Calendar, ChevronRight, Building2 } from 'lucide-react';

interface LaunchProject {
  id: string;
  name: string;
  type: 'new_clinic' | 'acquisition' | 'partner' | 'satellite' | 'epc';
  status: 'planning' | 'active' | 'at_risk' | 'completed' | 'on_hold';
  goLiveDate: string;
  kickoffDate: string;
  readiness: number;
  budget: number;
  spent: number;
  staffingFilled: number;
  staffingTarget: number;
  pm: string;
  risks: string[];
  domainProgress: Record<string, number>;
}

const PROJECTS: LaunchProject[] = [
  {
    id: '0',
    name: 'AIM EPC Flagship',
    type: 'epc',
    status: 'at_risk',
    goLiveDate: '2026-04-01',
    kickoffDate: '2026-01-15',
    readiness: 63,
    budget: 320000,
    spent: 198000,
    staffingFilled: 3,
    staffingTarget: 5,
    pm: 'Dr. Aisha Okonkwo',
    risks: ['2 providers still onboarding (WCB credentialing)', 'Payer billing setup delayed — DVA not yet active', 'Referral pathway MOU with 4 GPs pending sign-off'],
    domainProgress: { 'Provider Credentialing': 60, 'Payer Setup': 45, 'Referral Pathways': 55, 'Clinical Protocols': 78, 'IT & EMR': 82, 'Staffing': 65, 'Marketing': 70 },
  },
  {
    id: '1',
    name: 'AIM South Commons',
    type: 'new_clinic',
    status: 'active',
    goLiveDate: '2026-04-15',
    kickoffDate: '2026-03-01',
    readiness: 87,
    budget: 580000,
    spent: 412000,
    staffingFilled: 7,
    staffingTarget: 9,
    pm: 'Sarah Chen',
    risks: ['Occupancy permit pending', '2 clinical roles unfilled'],
    domainProgress: { Facilities: 92, IT: 88, 'Clinical Ops': 95, Staffing: 78, Marketing: 84, Billing: 90, Equipment: 82 },
  },
  {
    id: '2',
    name: 'AIM Crowfoot',
    type: 'new_clinic',
    status: 'planning',
    goLiveDate: '2026-07-01',
    kickoffDate: '2026-05-01',
    readiness: 38,
    budget: 520000,
    spent: 95000,
    staffingFilled: 1,
    staffingTarget: 9,
    pm: 'Mark Patel',
    risks: ['Lease not yet signed', 'Contractor not selected'],
    domainProgress: { Facilities: 35, IT: 20, 'Clinical Ops': 25, Staffing: 15, Marketing: 40, Billing: 30, Equipment: 10 },
  },
  {
    id: '3',
    name: 'AIM Bridlewood',
    type: 'new_clinic',
    status: 'planning',
    goLiveDate: '2026-10-01',
    kickoffDate: '2026-07-15',
    readiness: 12,
    budget: 495000,
    spent: 18000,
    staffingFilled: 0,
    staffingTarget: 9,
    pm: 'TBD',
    risks: ['Launch not yet kicked off'],
    domainProgress: { Facilities: 15, IT: 5, 'Clinical Ops': 10, Staffing: 0, Marketing: 12, Billing: 5, Equipment: 0 },
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  planning: { label: 'Planning', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  at_risk: { label: 'At Risk', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
};

const TYPE_LABELS: Record<string, string> = {
  new_clinic: 'New Clinic',
  acquisition: 'Acquisition',
  partner: 'Partner',
  satellite: 'Satellite',
  epc: 'EPC Flagship',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  new_clinic: 'bg-blue-100 text-blue-700',
  acquisition: 'bg-amber-100 text-amber-700',
  partner: 'bg-teal-100 text-teal-700',
  satellite: 'bg-gray-100 text-gray-600',
  epc: 'bg-emerald-100 text-emerald-700',
};

const DOMAINS = ['Facilities', 'IT', 'Clinical Ops', 'Staffing', 'Marketing', 'Billing', 'Equipment'];
const EPC_DOMAINS = ['Provider Credentialing', 'Payer Setup', 'Referral Pathways', 'Clinical Protocols', 'IT & EMR', 'Staffing', 'Marketing'];
const DOMAIN_COLORS = ['bg-orange-500', 'bg-blue-500', 'bg-teal-500', 'bg-green-500', 'bg-pink-500', 'bg-amber-500', 'bg-gray-500'];

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function LaunchManagementDashboard() {
  const [selectedProject, setSelectedProject] = useState<LaunchProject | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = PROJECTS.filter(p => !statusFilter || p.status === statusFilter);
  const activeCount = PROJECTS.filter(p => p.status === 'active').length;
  const atRiskCount = PROJECTS.filter(p => p.status === 'at_risk').length;
  const totalBudget = PROJECTS.reduce((s, p) => s + p.budget, 0);
  const totalSpent = PROJECTS.reduce((s, p) => s + p.spent, 0);

  if (selectedProject) {
    return <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Launch Command Center</h2>
          <p className="text-gray-600 mt-1">CRE — Clinic Replication Engine · All active clinic launches</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4 mr-2" />
          New Launch
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Launches', value: activeCount, color: 'text-blue-600', icon: <Rocket className="h-5 w-5 text-blue-400" /> },
          { label: 'At Risk', value: atRiskCount, color: 'text-red-600', icon: <AlertTriangle className="h-5 w-5 text-red-400" /> },
          { label: 'Total CapEx Pipeline', value: `$${(totalBudget / 1000000).toFixed(1)}M`, color: 'text-gray-900', icon: <DollarSign className="h-5 w-5 text-gray-400" /> },
          { label: 'Budget Utilized', value: `${Math.round(totalSpent / totalBudget * 100)}%`, color: 'text-amber-600', icon: <TrendingUp className="h-5 w-5 text-amber-400" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">{s.icon}<span className={`text-2xl font-bold ${s.color}`}>{s.value}</span></div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Launch Projects</h3>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="at_risk">At Risk</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="space-y-4">
          {filtered.map(project => {
            const sc = STATUS_CONFIG[project.status];
            const daysLeft = daysUntil(project.goLiveDate);
            const budgetPct = Math.round(project.spent / project.budget * 100);

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`border rounded-lg p-5 cursor-pointer transition-colors hover:shadow-sm ${project.type === 'epc' ? 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/30' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Building2 className={`h-5 w-5 ${project.type === 'epc' ? 'text-emerald-500' : 'text-gray-400'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{project.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${sc.color}`}>{sc.label}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${TYPE_BADGE_COLORS[project.type] ?? 'bg-gray-100 text-gray-600'}`}>{TYPE_LABELS[project.type]}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Go-Live: {new Date(project.goLiveDate).toLocaleDateString()}</span>
                        <span>{daysLeft > 0 ? `${daysLeft} days away` : 'Overdue'}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />PM: {project.pm}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Readiness</span>
                      <span className={project.readiness >= 85 ? 'text-green-700 font-semibold' : project.readiness >= 70 ? 'text-amber-700 font-semibold' : 'text-red-700 font-semibold'}>{project.readiness}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${project.readiness >= 85 ? 'bg-green-500' : project.readiness >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${project.readiness}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Budget (${(project.spent / 1000).toFixed(0)}K / ${(project.budget / 1000).toFixed(0)}K)</span>
                      <span>{budgetPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Staffing</span>
                      <span>{project.staffingFilled}/{project.staffingTarget}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: `${Math.round(project.staffingFilled / project.staffingTarget * 100)}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {(project.type === 'epc' ? EPC_DOMAINS : DOMAINS).map((domain, idx) => {
                    const pct = project.domainProgress[domain] ?? 0;
                    return (
                      <div key={domain} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${DOMAIN_COLORS[idx]}`} />
                        <span className="text-xs text-gray-600">{domain}</span>
                        <span className={`text-xs font-medium ${pct >= 85 ? 'text-green-700' : pct >= 70 ? 'text-amber-700' : 'text-red-600'}`}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>

                {project.risks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.risks.map((r, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-700 border border-red-200">
                        <AlertTriangle className="h-3 w-3" />{r}
                      </span>
                    ))}
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

function ProjectDetail({ project, onBack }: { project: LaunchProject; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'timeline'>('overview');
  const sc = STATUS_CONFIG[project.status];
  const daysLeft = daysUntil(project.goLiveDate);
  const budgetPct = Math.round(project.spent / project.budget * 100);

  const EPC_TIMELINE = [
    { day: 1, label: 'EPC Program Kickoff', desc: 'Service model confirmed, referral agreements drafted, job postings live', done: true },
    { day: 14, label: 'Provider Recruitment', desc: 'EPC physicians/NPs shortlisted, credentialing applications submitted', done: true },
    { day: 21, label: 'Payer & Billing Setup', desc: 'WCB, DVA, and group benefits credentialing packages submitted', done: true },
    { day: 30, label: 'Referral MOUs Signed', desc: 'GP/specialist outreach completed, referral intake protocol finalized', done: false },
    { day: 45, label: 'Provider Credentialing Complete', desc: 'All providers approved by payers, EMR billing codes configured', done: false },
    { day: 60, label: 'Soft Launch', desc: 'First EPC patients onboarded, chronic care management protocols live', done: false },
    { day: 90, label: 'Full Program Launch', desc: 'All providers active, full referral pipeline operational, reporting live', done: false },
  ];

  const TIMELINE = project.type === 'epc' ? EPC_TIMELINE : [
    { day: 1, label: 'Kickoff', desc: 'Lease confirmed, contractor engaged, all job postings live', done: true },
    { day: 7, label: 'Systems Ordered', desc: 'Internet, phones, EMR clinic profile initiated', done: true },
    { day: 14, label: 'Staff Shortlist', desc: 'Interviews underway, contractor mobilized, equipment ordered', done: true },
    { day: 21, label: 'Systems Live', desc: 'All IT active, marketing launched, billing configured', done: true },
    { day: 28, label: 'Staff Hired', desc: 'All offers accepted, payroll configured, EMR fully loaded', done: false },
    { day: 35, label: 'Pre-Open Readiness', desc: 'Walk-through done, all equipment tested, staff trained', done: false },
    { day: 45, label: 'Go-Live', desc: 'First patient appointment, all systems operational', done: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 text-sm flex items-center gap-1">
          ← Back
        </button>
        <div className="flex-1 flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
          <span className={`px-2 py-0.5 text-xs rounded-full ${sc.color}`}>{sc.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Readiness', value: `${project.readiness}%`, color: project.readiness >= 85 ? 'text-green-700' : 'text-amber-700' },
          { label: 'Days to Go-Live', value: daysLeft > 0 ? `${daysLeft}d` : 'Overdue', color: daysLeft < 14 ? 'text-red-700' : 'text-gray-900' },
          { label: 'Budget Used', value: `${budgetPct}%`, color: budgetPct > 90 ? 'text-red-700' : 'text-gray-900' },
          { label: 'Staffing', value: `${project.staffingFilled}/${project.staffingTarget}`, color: 'text-gray-900' },
          { label: 'Project Manager', value: project.pm || 'TBD', color: 'text-gray-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-3 mb-6">
          {(['overview', 'domains', 'timeline'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'domains' ? 'Domain Progress' : 'Timeline'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-500">Go-Live Date</div>
                <div className="font-medium">{new Date(project.goLiveDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Kickoff Date</div>
                <div className="font-medium">{new Date(project.kickoffDate).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Budget</div>
                <div className="font-medium">${(project.budget / 1000).toFixed(0)}K</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Spent to Date</div>
                <div className="font-medium">${(project.spent / 1000).toFixed(0)}K</div>
              </div>
            </div>
            {project.risks.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-red-800 mb-2">Active Risks</div>
                <div className="space-y-2">
                  {project.risks.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />{r}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="space-y-3">
            {(project.type === 'epc' ? EPC_DOMAINS : DOMAINS).map((domain, idx) => {
              const pct = project.domainProgress[domain] ?? 0;
              return (
                <div key={domain} className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${DOMAIN_COLORS[idx]}`} />
                  <div className="w-28 text-sm text-gray-700 font-medium">{domain}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div className={`h-3 rounded-full ${pct >= 85 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`w-10 text-sm font-bold text-right ${pct >= 85 ? 'text-green-700' : pct >= 70 ? 'text-amber-700' : 'text-red-600'}`}>{pct}%</div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-6">
              {TIMELINE.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pl-12">
                  <div className={`absolute left-3 w-5 h-5 rounded-full flex items-center justify-center border-2 ${step.done ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                    {step.done && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">Day {step.day}</span>
                      <span className={`font-semibold text-sm ${step.done ? 'text-green-700' : 'text-gray-700'}`}>{step.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
