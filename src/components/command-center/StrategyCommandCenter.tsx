import { useState } from 'react';
import { Compass, TrendingUp, TrendingDown, Minus, Target, Rocket, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, DollarSign, ChartBar as BarChart3, Map, GitBranch, Calendar, BookOpen, Zap, ArrowRight, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import type { ModuleKey } from '../../types/enterprise';

interface StrategyCommandCenterProps {
  onNavigate: (module: ModuleKey, subModule: string) => void;
}

const STRATEGIC_KPIS = [
  { label: 'BHAG Progress', value: '34%', target: '100% by 2030', trend: 'up', status: 'green' },
  { label: '3-Year Revenue Target', value: '$8.4M', target: '$12M by 2028', trend: 'up', status: 'green' },
  { label: 'Active Clinic Count', value: '7', target: '12 by 2028', trend: 'up', status: 'green' },
  { label: 'YTD EBITDA Margin', value: '18.2%', target: '20%+', trend: 'stable', status: 'yellow' },
  { label: 'Annual OKR On-Track', value: '4 / 6', target: '6 / 6', trend: 'stable', status: 'yellow' },
  { label: 'Capital Deployed YTD', value: '$1.2M', target: '$2.1M budget', trend: 'up', status: 'green' },
];

const OKR_ROCKS = [
  { id: 'o1', title: 'Reach $8.4M annualized network revenue', progress: 72, status: 'on_track', owner: 'CEO', due: 'Dec 2026', category: 'financial' },
  { id: 'o2', title: 'Open 2 new clinic locations (Crowfoot + Cochrane)', progress: 55, status: 'on_track', owner: 'COO', due: 'Nov 2026', category: 'growth' },
  { id: 'o3', title: 'Achieve 87% provider utilization network-wide', progress: 81, status: 'at_risk', owner: 'COO', due: 'Dec 2026', category: 'operations' },
  { id: 'o4', title: 'Deploy EPC partner clinic replication model', progress: 90, status: 'on_track', owner: 'CMO', due: 'Jun 2026', category: 'growth' },
  { id: 'o5', title: 'Reduce net AR days below 35', progress: 30, status: 'behind', owner: 'CFO', due: 'Dec 2026', category: 'financial' },
  { id: 'o6', title: 'Launch employer program at 3 enterprise accounts', progress: 60, status: 'at_risk', owner: 'CGO', due: 'Sep 2026', category: 'growth' },
];

const EXPANSION_PIPELINE = [
  { name: 'Crowfoot', stage: 'Build-Out', readiness: 78, budget: 280000, spent: 195000, target: 'Sep 2026', risk: 'medium' },
  { name: 'Cochrane', stage: 'Site Secured', readiness: 42, budget: 310000, spent: 62000, target: 'Jan 2027', risk: 'low' },
  { name: 'Okotoks', stage: 'Due Diligence', readiness: 18, budget: 0, spent: 8000, target: 'Q1 2027', risk: 'medium' },
  { name: 'NE Acquisition Target', stage: 'LOI Signed', readiness: 35, budget: 1200000, spent: 45000, target: 'Q2 2027', risk: 'high' },
];

const CAPITAL_ALLOCATION = [
  { category: 'Clinic Build-Outs', budgeted: 1100000, deployed: 695000, remaining: 405000 },
  { category: 'Technology & Systems', budgeted: 320000, deployed: 280000, remaining: 40000 },
  { category: 'Acquisition Diligence', budgeted: 200000, deployed: 53000, remaining: 147000 },
  { category: 'Equipment & Fit-Out', budgeted: 480000, deployed: 172000, remaining: 308000 },
];

const STRATEGIC_RISKS = [
  { id: 'r1', title: 'AR Days elevated — cash flow pressure', severity: 'critical', owner: 'CFO', module: 'revenue', sub: 'ar', actionLabel: 'View AR' },
  { id: 'r2', title: 'EPC utilization below breakeven (69%)', severity: 'warning', owner: 'COO', module: 'command_center', sub: 'clinic', actionLabel: 'View Clinic' },
  { id: 'r3', title: 'NE Acquisition — Title search delay', severity: 'warning', owner: 'CEO', module: 'strategy', sub: 'expansion', actionLabel: 'Expansion' },
  { id: 'r4', title: 'Crowfoot build contractor behind 3 weeks', severity: 'warning', owner: 'COO', module: 'operations', sub: 'launches', actionLabel: 'Launches' },
];

const MEETING_PULSE = [
  { cadence: 'Daily Huddle', last: 'Today 8:00 AM', next: 'Tomorrow 8:00 AM', status: 'current', color: 'teal' },
  { cadence: 'Weekly Tactical', last: 'Mon Mar 10', next: 'Mon Mar 17', status: 'upcoming', color: 'blue' },
  { cadence: 'Monthly Business Review', last: 'Mar 7 2026', next: 'Apr 4 2026', status: 'upcoming', color: 'amber' },
  { cadence: 'Quarterly Planning', last: 'Jan 31 2026', next: 'Apr 30 2026', status: 'upcoming', color: 'orange' },
];

const STATUS_CONFIG = {
  on_track: { label: 'On Track', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  at_risk:  { label: 'At Risk',  dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50'  },
  behind:   { label: 'Behind',   dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50'    },
};

const RISK_CONFIG = {
  critical: { bar: 'bg-red-500', label: 'Critical', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  warning:  { bar: 'bg-amber-500', label: 'Warning', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
};

type Tab = 'overview' | 'okrs' | 'expansion' | 'capital' | 'cadence';

function TrendIcon({ trend, status }: { trend: string; status: string }) {
  const color = status === 'green' ? 'text-emerald-600' : status === 'yellow' ? 'text-amber-600' : 'text-red-600';
  if (trend === 'up') return <TrendingUp className={`h-4 w-4 ${color}`} />;
  if (trend === 'down') return <TrendingDown className={`h-4 w-4 ${color}`} />;
  return <Minus className={`h-4 w-4 ${color}`} />;
}

export function StrategyCommandCenter({ onNavigate }: StrategyCommandCenterProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const criticalCount = STRATEGIC_RISKS.filter(r => r.severity === 'critical').length;
  const behindOKRs = OKR_ROCKS.filter(o => o.status === 'behind').length;
  const atRiskOKRs = OKR_ROCKS.filter(o => o.status === 'at_risk').length;

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Compass className="h-4 w-4" /> },
    { key: 'okrs', label: 'OKRs & Goals', icon: <Target className="h-4 w-4" /> },
    { key: 'expansion', label: 'Expansion', icon: <Rocket className="h-4 w-4" /> },
    { key: 'capital', label: 'Capital', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'cadence', label: 'Meeting Cadence', icon: <Calendar className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-0">
      {/* Status Bar */}
      <div className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-sky-400" />
          <span className="font-semibold text-white">Strategy Command</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">OKRs On-Track:</span>
          <span className="font-semibold text-emerald-400">4 / 6</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">Expansion Pipeline:</span>
          <span className="font-semibold text-sky-400">4 sites</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">Capital Deployed:</span>
          <span className="font-semibold text-white">$1.2M / $2.1M</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">EBITDA Margin:</span>
          <span className="font-semibold text-amber-400">18.2%</span>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 rounded-full text-xs font-bold">
              <AlertTriangle className="h-3 w-3" />
              {criticalCount} Critical
            </span>
          </div>
        )}
        <button onClick={handleRefresh} className="ml-auto p-1 text-gray-400 hover:text-white">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Strategic KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {STRATEGIC_KPIS.map((kpi, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 truncate">{kpi.label}</span>
                    <TrendIcon trend={kpi.trend} status={kpi.status} />
                  </div>
                  <div className={`text-2xl font-bold ${kpi.status === 'green' ? 'text-gray-900' : kpi.status === 'yellow' ? 'text-amber-700' : 'text-red-700'}`}>
                    {kpi.value}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{kpi.target}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Strategic Risks */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Strategic Risks & Issues
                  </h3>
                  <span className="text-xs text-gray-400">{STRATEGIC_RISKS.length} active</span>
                </div>
                <div className="space-y-2">
                  {STRATEGIC_RISKS.map(risk => {
                    const cfg = RISK_CONFIG[risk.severity as keyof typeof RISK_CONFIG];
                    const isExpanded = expandedRisk === risk.id;
                    return (
                      <div key={risk.id} className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className={`mt-0.5 flex-shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                            <span className="text-sm text-gray-800 leading-tight">{risk.title}</span>
                          </div>
                          <button onClick={() => setExpandedRisk(isExpanded ? null : risk.id)} className="flex-shrink-0 text-gray-400">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Owner: <span className="font-medium">{risk.owner}</span></span>
                            <button
                              onClick={() => onNavigate(risk.module as ModuleKey, risk.sub)}
                              className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
                            >
                              {risk.actionLabel} <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OKR Snapshot */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Target className="h-4 w-4 text-sky-600" />
                    Annual OKR Snapshot
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{behindOKRs} behind</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />{atRiskOKRs} at risk</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {OKR_ROCKS.map(okr => {
                    const cfg = STATUS_CONFIG[okr.status as keyof typeof STATUS_CONFIG];
                    return (
                      <div key={okr.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 truncate flex-1 mr-3">{okr.title}</span>
                          <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${okr.status === 'on_track' ? 'bg-emerald-500' : okr.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${okr.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0 w-8 text-right">{okr.progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => onNavigate('strategy', 'okrs')}
                  className="mt-3 text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
                >
                  Full Goal Cascade <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Enterprise OS Quick Links */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-sky-600" />
                Enterprise OS — Quick Access
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { key: 'scorecard', label: 'Scorecard Engine', icon: <BarChart3 className="h-5 w-5 text-sky-600" />, desc: 'RAG scorecards' },
                  { key: 'goal-cascade', label: 'Goal Cascade', icon: <GitBranch className="h-5 w-5 text-sky-600" />, desc: 'BHAG → Owner' },
                  { key: 'meeting-cadence', label: 'Meeting Cadence', icon: <Calendar className="h-5 w-5 text-sky-600" />, desc: 'Huddle → Annual' },
                  { key: 'kpi-governance', label: 'KPI Governance', icon: <BookOpen className="h-5 w-5 text-sky-600" />, desc: 'Canonical metrics' },
                  { key: 'fhir-event-bus', label: 'FHIR Event Bus', icon: <Zap className="h-5 w-5 text-sky-600" />, desc: 'Event routing' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => onNavigate('strategy', item.key)}
                    className="flex flex-col items-center text-center p-4 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-100 transition-colors group"
                  >
                    <div className="mb-2">{item.icon}</div>
                    <div className="text-sm font-medium text-gray-800 group-hover:text-sky-700">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* OKRs TAB */}
        {activeTab === 'okrs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Annual Strategic Objectives — FY 2026</h3>
              <button
                onClick={() => onNavigate('strategy', 'goal-cascade')}
                className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
              >
                Goal Cascade View <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {OKR_ROCKS.map(okr => {
                const cfg = STATUS_CONFIG[okr.status as keyof typeof STATUS_CONFIG];
                const catColor: Record<string, string> = { financial: 'bg-emerald-100 text-emerald-700', growth: 'bg-rose-100 text-rose-700', operations: 'bg-teal-100 text-teal-700' };
                return (
                  <div key={okr.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${catColor[okr.category] ?? 'bg-gray-100 text-gray-700'}`}>
                          {okr.category.charAt(0).toUpperCase() + okr.category.slice(1)}
                        </span>
                        <span className="font-medium text-gray-800">{okr.title}</span>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all ${okr.status === 'on_track' ? 'bg-emerald-500' : okr.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${okr.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-10 text-right">{okr.progress}%</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Due {okr.due}</span>
                      <span>Owner: <span className="font-medium text-gray-700">{okr.owner}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EXPANSION TAB */}
        {activeTab === 'expansion' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Active Expansion Pipeline</h3>
              <button
                onClick={() => onNavigate('strategy', 'expansion')}
                className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
              >
                Full Pipeline <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXPANSION_PIPELINE.map((site, i) => {
                const riskColors: Record<string, string> = {
                  low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  medium: 'text-amber-700 bg-amber-50 border-amber-200',
                  high: 'text-red-700 bg-red-50 border-red-200',
                };
                const budgetPct = site.budget > 0 ? Math.round((site.spent / site.budget) * 100) : 0;
                return (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-gray-800">{site.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{site.stage} · Target: {site.target}</div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${riskColors[site.risk]}`}>
                        {site.risk.charAt(0).toUpperCase() + site.risk.slice(1)} Risk
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Launch Readiness</span>
                          <span className="font-semibold text-gray-700">{site.readiness}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${site.readiness >= 75 ? 'bg-emerald-500' : site.readiness >= 40 ? 'bg-amber-500' : 'bg-sky-400'}`}
                            style={{ width: `${site.readiness}%` }}
                          />
                        </div>
                      </div>
                      {site.budget > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Budget</span>
                            <span className="font-medium">${(site.spent / 1000).toFixed(0)}K / ${(site.budget / 1000).toFixed(0)}K ({budgetPct}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-400 rounded-full" style={{ width: `${budgetPct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onNavigate('operations', 'launches')}
                      className="mt-3 text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
                    >
                      Launch Dashboard <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CAPITAL TAB */}
        {activeTab === 'capital' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Capital Deployment — FY 2026</h3>
              <button
                onClick={() => onNavigate('strategy', 'capital')}
                className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
              >
                Capital Allocation <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CAPITAL_ALLOCATION.map((item, i) => {
                const pct = Math.round((item.deployed / item.budgeted) * 100);
                return (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">{item.category}</span>
                      <span className="text-sm font-semibold text-gray-700">{pct}% deployed</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mb-2">
                      <span>Budgeted: <span className="font-medium text-gray-700">${(item.budgeted / 1000).toFixed(0)}K</span></span>
                      <span>Deployed: <span className="font-medium text-emerald-700">${(item.deployed / 1000).toFixed(0)}K</span></span>
                      <span>Remaining: <span className="font-medium text-gray-700">${(item.remaining / 1000).toFixed(0)}K</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">$2.1M</div>
                  <div className="text-xs text-gray-500">Total FY Budget</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-sky-700">$1.2M</div>
                  <div className="text-xs text-gray-500">Deployed YTD</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-700">$900K</div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEETING CADENCE TAB */}
        {activeTab === 'cadence' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Meeting Cadence Pulse</h3>
              <button
                onClick={() => onNavigate('strategy', 'meeting-cadence')}
                className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
              >
                Full Meeting Engine <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MEETING_PULSE.map((meeting, i) => {
                const colorMap: Record<string, string> = {
                  teal: 'bg-teal-50 border-teal-200 text-teal-700',
                  blue: 'bg-blue-50 border-blue-200 text-blue-700',
                  amber: 'bg-amber-50 border-amber-200 text-amber-700',
                  orange: 'bg-orange-50 border-orange-200 text-orange-700',
                };
                const cls = colorMap[meeting.color];
                return (
                  <div key={i} className={`rounded-xl border p-5 ${cls.split(' ').slice(0, 2).join(' ')} bg-white`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{meeting.cadence}</span>
                      {meeting.status === 'current' && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 space-y-1 mt-2">
                      <div>Last: <span className="font-medium text-gray-700">{meeting.last}</span></div>
                      <div>Next: <span className="font-medium text-gray-700">{meeting.next}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h4 className="font-medium text-gray-700 mb-3">Enterprise OS Access</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { key: 'scorecard', label: 'Scorecards', icon: <BarChart3 className="h-4 w-4" /> },
                  { key: 'goal-cascade', label: 'Goal Cascade', icon: <GitBranch className="h-4 w-4" /> },
                  { key: 'meeting-cadence', label: 'Meeting Cadence', icon: <Calendar className="h-4 w-4" /> },
                  { key: 'kpi-governance', label: 'KPI Dictionary', icon: <BookOpen className="h-4 w-4" /> },
                  { key: 'fhir-event-bus', label: 'Event Bus', icon: <Zap className="h-4 w-4" /> },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => onNavigate('strategy', item.key)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-sky-50 hover:text-sky-700 rounded-lg text-sm text-gray-600 font-medium transition-colors border border-gray-100 hover:border-sky-200"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
