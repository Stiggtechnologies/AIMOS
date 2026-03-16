import { useState } from 'react';
import { Building2, TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, DollarSign, Activity, Users, Target, ArrowUpRight, ArrowDownRight, Brain, ChevronRight, Rocket, Star, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Zap, ChartBar as BarChart3, Map, RefreshCw, Phone, Clock, Calendar, Shield, Award, ChevronDown, ChevronUp, Minus, ArrowRight } from 'lucide-react';

type Tab = 'overview' | 'performance' | 'growth' | 'expansion' | 'strategy';
type DrillLevel = 'network' | 'region' | 'clinic';

const CLINICS = [
  { id: '1', name: 'South Commons', region: 'AB South', revMTD: 92400, revTarget: 96000, utilization: 78, nps: 4.7, noShow: 8, waitDays: 3, alerts: 0, status: 'green', launching: false, integrating: false, newPatients: 42, arDays: 31, denialRate: 4.1 },
  { id: '2', name: 'Mahogany', region: 'AB South', revMTD: 88200, revTarget: 90000, utilization: 82, nps: 4.8, noShow: 6, waitDays: 2, alerts: 0, status: 'green', launching: false, integrating: false, newPatients: 38, arDays: 29, denialRate: 3.8 },
  { id: '3', name: 'Signal Hill', region: 'AB West', revMTD: 74100, revTarget: 90000, utilization: 64, nps: 4.2, noShow: 14, waitDays: 7, alerts: 2, status: 'red', launching: false, integrating: false, newPatients: 21, arDays: 47, denialRate: 9.2 },
  { id: '4', name: 'Marda Loop', region: 'AB West', revMTD: 81000, revTarget: 85000, utilization: 74, nps: 4.5, noShow: 10, waitDays: 4, alerts: 1, status: 'yellow', launching: false, integrating: false, newPatients: 28, arDays: 38, denialRate: 5.4 },
  { id: '5', name: 'Bridgeland', region: 'AB East', revMTD: 95800, revTarget: 95000, utilization: 88, nps: 4.9, noShow: 5, waitDays: 2, alerts: 0, status: 'green', launching: false, integrating: false, newPatients: 51, arDays: 27, denialRate: 2.9 },
  { id: '6', name: 'Renfrew', region: 'AB East', revMTD: 68400, revTarget: 80000, utilization: 61, nps: 4.1, noShow: 16, waitDays: 8, alerts: 3, status: 'red', launching: false, integrating: false, newPatients: 18, arDays: 52, denialRate: 11.3 },
  { id: '7', name: 'Crowfoot', region: 'AB NW', revMTD: 0, revTarget: 0, utilization: 0, nps: 0, noShow: 0, waitDays: 0, alerts: 0, status: 'blue', launching: true, integrating: false, newPatients: 0, arDays: 0, denialRate: 0 },
  { id: '8', name: 'Cochrane', region: 'AB West', revMTD: 0, revTarget: 0, utilization: 0, nps: 0, noShow: 0, waitDays: 0, alerts: 0, status: 'blue', launching: true, integrating: false, newPatients: 0, arDays: 0, denialRate: 0 },
  { id: '9', name: 'NE Acquisition', region: 'AB East', revMTD: 55200, revTarget: 75000, utilization: 58, nps: 3.9, noShow: 18, waitDays: 9, alerts: 2, status: 'red', launching: false, integrating: true, newPatients: 14, arDays: 58, denialRate: 13.1 },
  { id: '10', name: 'Airdrie', region: 'AB North', revMTD: 71400, revTarget: 72000, utilization: 71, nps: 4.4, noShow: 11, waitDays: 5, alerts: 0, status: 'yellow', launching: false, integrating: false, newPatients: 31, arDays: 34, denialRate: 5.1 },
  { id: '11', name: 'Okotoks', region: 'AB South', revMTD: 0, revTarget: 0, utilization: 0, nps: 0, noShow: 0, waitDays: 0, alerts: 0, status: 'blue', launching: true, integrating: false, newPatients: 0, arDays: 0, denialRate: 0 },
  { id: '12', name: 'Bridlewood', region: 'AB SW', revMTD: 77800, revTarget: 78000, utilization: 73, nps: 4.5, noShow: 9, waitDays: 4, alerts: 0, status: 'green', launching: false, integrating: false, newPatients: 35, arDays: 32, denialRate: 4.4 },
];

const REGIONS = ['AB South', 'AB West', 'AB East', 'AB NW', 'AB North', 'AB SW'];

const EXCEPTIONS = [
  { id: '1', severity: 'critical', issue: 'Claim denial rate 13.1% at NE Acquisition — 3× network avg', owner: 'Revenue Cycle Director', action: 'Audit payer coding workflow for acquired clinic', module: 'revenue', sub: 'claims' },
  { id: '2', severity: 'critical', issue: 'Renfrew utilization at 61% — 24pp below target, 3 open alerts', owner: 'Regional Director AB East', action: 'Activate capacity playbook, review provider scheduling', module: 'operations', sub: 'staffing' },
  { id: '3', severity: 'warning', issue: 'Signal Hill no-show rate 14% — above 10% threshold for 3 weeks', owner: 'Clinic Manager Signal Hill', action: 'Enable automated reminders + deposit policy', module: 'operations', sub: 'schedule' },
  { id: '4', severity: 'warning', issue: 'Crowfoot launch staffing gap — PT role unfilled, target open Jul 1', owner: 'VP Operations', action: 'Escalate recruitment to executive sponsor', module: 'operations', sub: 'launches' },
  { id: '5', severity: 'warning', issue: '4 providers across network flagged at burnout risk (HBI scores)', owner: 'Chief Clinical Officer', action: 'Schedule 1-on-1s and review caseload allocation', module: 'workforce', sub: 'workforce-health' },
  { id: '6', severity: 'info', issue: 'Alberta North region referral growth slowed 3 consecutive weeks', owner: 'Chief Growth Officer', action: 'Activate employer outreach playbook for Airdrie', module: 'growth', sub: 'referral-sources' },
];

const AI_INSIGHTS = [
  { type: 'opportunity', title: 'Shift 2 providers into evening blocks at Bridgeland', detail: 'Unmet demand identified on Tuesday–Thursday evenings. Modelled revenue uplift: +$14,200/month.', impact: '+$170K/yr', confidence: 89 },
  { type: 'risk', title: 'NE Acquisition revenue at risk from integration delays', detail: 'Integration track is 11 days behind milestone. At current pace, breakeven will be 28 days late.', impact: '−$38K', confidence: 82 },
  { type: 'opportunity', title: 'South Commons on track to exceed breakeven by 21 days', detail: 'High trainer referral rate and low no-show driving ahead-of-plan performance.', impact: '+$22K early', confidence: 91 },
  { type: 'recommendation', title: 'Reallocate $8K marketing spend from print to employer partnerships', detail: 'Print CAC is $410 vs employer program CAC of $72. Reallocation modelled at 5.7× better efficiency.', impact: '+22% ROI', confidence: 88 },
  { type: 'risk', title: 'Renfrew + Signal Hill combined shortfall projects to $48K below Q2 target', detail: 'Operational intervention needed in next 14 days to avoid quarterly miss.', impact: '−$48K Q2', confidence: 76 },
];

const LAUNCHES = [
  { name: 'AIM Crowfoot', stage: 'Under Construction', readiness: 71, openDate: '2026-07-01', risk: 'Staffing gap (PT)', budget: 520000, spent: 340000 },
  { name: 'AIM Cochrane', stage: 'Opening Soon', readiness: 91, openDate: '2026-05-01', risk: null, budget: 390000, spent: 378000 },
  { name: 'AIM Okotoks', stage: 'Due Diligence', readiness: 38, openDate: '2027-04-01', risk: 'Site not confirmed', budget: 440000, spent: 28000 },
];

const OKR_ROCKS = [
  { title: 'Achieve $62M network revenue by EOY', progress: 62, status: 'on_track' },
  { title: 'Launch 3 new clinics in 2026', progress: 33, status: 'at_risk' },
  { title: 'Reduce avg AR days to 32', progress: 55, status: 'on_track' },
  { title: 'Reach 85% network utilization', progress: 71, status: 'behind' },
  { title: 'NPS ≥ 4.6 across all open clinics', progress: 80, status: 'on_track' },
  { title: 'Complete 2 acquisition integrations', progress: 50, status: 'at_risk' },
];

const openClinics = CLINICS.filter(c => !c.launching && !c.integrating);
const networkRevMTD = openClinics.reduce((s, c) => s + c.revMTD, 0);
const networkRevTarget = openClinics.reduce((s, c) => s + c.revTarget, 0);
const avgUtilization = openClinics.reduce((s, c) => s + c.utilization, 0) / openClinics.length;
const avgNPS = openClinics.filter(c => c.nps > 0).reduce((s, c) => s + c.nps, 0) / openClinics.filter(c => c.nps > 0).length;
const criticalAlerts = EXCEPTIONS.filter(e => e.severity === 'critical').length;

function fmt(v: number) {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function StatusDot({ status }: { status: string }) {
  const cls = status === 'green' ? 'bg-emerald-500' : status === 'yellow' ? 'bg-amber-500' : status === 'red' ? 'bg-red-500' : 'bg-blue-400';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls} flex-shrink-0`} />;
}

function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value > 0) return <span className="flex items-center text-emerald-400 text-xs"><ArrowUpRight className="h-3 w-3" />+{value}{suffix}</span>;
  if (value < 0) return <span className="flex items-center text-red-400 text-xs"><ArrowDownRight className="h-3 w-3" />{value}{suffix}</span>;
  return <span className="flex items-center text-gray-400 text-xs"><Minus className="h-3 w-3" />0{suffix}</span>;
}

interface Props {
  onNavigate: (module: string, subModule: string) => void;
}

export function NetworkCommandCenter({ onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [region, setRegion] = useState('');
  const [drillClinic, setDrillClinic] = useState<string | null>(null);
  const [expandedExceptions, setExpandedExceptions] = useState<Set<string>>(new Set());

  const filteredClinics = region ? CLINICS.filter(c => c.region === region) : CLINICS;

  const toggleException = (id: string) => {
    setExpandedExceptions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-0 -mx-6 -mt-2">
      {/* Zone 1 — Global Health Bar */}
      <div className="bg-gray-900 text-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2 font-semibold text-gray-300 mr-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            AIM Network
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs">Open Clinics</span>
            <span className="font-bold text-white">{openClinics.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs">Launching</span>
            <span className="font-bold text-blue-400">{CLINICS.filter(c => c.launching).length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs">Integrating</span>
            <span className="font-bold text-amber-400">{CLINICS.filter(c => c.integrating).length}</span>
          </div>
          <div className="w-px h-4 bg-gray-700 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs">Revenue MTD</span>
            <span className="font-bold text-emerald-400">{fmt(networkRevMTD)}</span>
            <span className="text-gray-500 text-xs">/ {fmt(networkRevTarget)} target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs">Utilization</span>
            <span className={`font-bold ${avgUtilization >= 80 ? 'text-emerald-400' : avgUtilization >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{avgUtilization.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs">Avg NPS</span>
            <span className="font-bold text-white">{avgNPS.toFixed(1)}</span>
          </div>
          <div className="w-px h-4 bg-gray-700 hidden sm:block" />
          {criticalAlerts > 0 && (
            <div className="flex items-center gap-1.5 bg-red-900/60 px-2.5 py-1 rounded-full">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="font-bold text-red-300 text-xs">{criticalAlerts} Critical Alerts</span>
            </div>
          )}
          <button onClick={() => {}} className="ml-auto text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-6 pt-5 space-y-5 pb-8">
        {/* Header + Tabs + Filters */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Network Command Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">Executive operating view — {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long' })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={region} onChange={e => setRegion(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="">All Regions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
              <option>MTD March 2026</option>
              <option>Q1 2026</option>
              <option>YTD 2026</option>
              <option>Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200">
          {(['overview', 'performance', 'growth', 'expansion', 'strategy'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {/* Zone 2 — Core KPI Band */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Revenue MTD', value: fmt(networkRevMTD), sub: `vs ${fmt(networkRevTarget)} target`, trend: ((networkRevMTD / networkRevTarget - 1) * 100).toFixed(1), color: 'from-blue-600 to-blue-700', icon: <DollarSign className="h-5 w-5 opacity-70" /> },
                { label: 'EBITDA Margin', value: '23.4%', sub: 'Target: 25%', trend: 1.2, color: 'from-emerald-600 to-emerald-700', icon: <Target className="h-5 w-5 opacity-70" /> },
                { label: 'Utilization', value: `${avgUtilization.toFixed(0)}%`, sub: 'Target: 85%', trend: -2.1, color: 'from-amber-600 to-amber-700', icon: <Activity className="h-5 w-5 opacity-70" /> },
                { label: 'AR Days', value: '38', sub: 'Target: 32', trend: -2, color: 'from-rose-600 to-rose-700', icon: <Clock className="h-5 w-5 opacity-70" /> },
                { label: 'NPS Score', value: avgNPS.toFixed(1), sub: '+12 new reviews', trend: 0.2, color: 'from-teal-600 to-teal-700', icon: <Star className="h-5 w-5 opacity-70" /> },
                { label: 'New Patients', value: openClinics.reduce((s, c) => s + c.newPatients, 0).toString(), sub: 'MTD across network', trend: 8.4, color: 'from-sky-600 to-sky-700', icon: <Users className="h-5 w-5 opacity-70" /> },
              ].map((kpi, i) => (
                <button key={i} onClick={() => setTab('performance')} className={`bg-gradient-to-br ${kpi.color} rounded-xl p-4 text-white text-left hover:opacity-95 transition-opacity`}>
                  <div className="flex items-center justify-between mb-2">
                    {kpi.icon}
                    <TrendBadge value={Number(kpi.trend)} />
                  </div>
                  <div className="text-2xl font-bold leading-none mb-1">{kpi.value}</div>
                  <div className="text-xs opacity-70">{kpi.label}</div>
                  <div className="text-xs opacity-50 mt-0.5">{kpi.sub}</div>
                </button>
              ))}
            </div>

            {/* Zone 3 — Clinic Status Matrix */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Clinic Status Matrix</h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />On Target</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />Watch</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Needs Intervention</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />Launching/Integrating</span>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {filteredClinics.map(clinic => {
                  const pct = clinic.revTarget > 0 ? Math.round(clinic.revMTD / clinic.revTarget * 100) : null;
                  return (
                    <button
                      key={clinic.id}
                      onClick={() => setDrillClinic(drillClinic === clinic.id ? null : clinic.id)}
                      className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                        clinic.status === 'green' ? 'bg-emerald-50 border-emerald-200' :
                        clinic.status === 'yellow' ? 'bg-amber-50 border-amber-200' :
                        clinic.status === 'red' ? 'bg-red-50 border-red-200' :
                        'bg-blue-50 border-blue-200'
                      } ${drillClinic === clinic.id ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <StatusDot status={clinic.status} />
                        <span className="text-xs font-semibold text-gray-800 leading-tight">{clinic.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">{clinic.region}</div>
                      {clinic.launching ? (
                        <div className="text-xs font-medium text-blue-600 flex items-center gap-1"><Rocket className="h-3 w-3" />Launching</div>
                      ) : clinic.integrating ? (
                        <div className="text-xs font-medium text-amber-600 flex items-center gap-1"><Zap className="h-3 w-3" />Integrating</div>
                      ) : (
                        <>
                          <div className="text-xs text-gray-700">Rev: {pct}% of plan</div>
                          <div className="text-xs text-gray-700">Util: {clinic.utilization}%</div>
                          <div className="text-xs text-gray-700">NPS: {clinic.nps.toFixed(1)}</div>
                          {clinic.alerts > 0 && <div className="text-xs text-red-600 font-medium mt-1 flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" />{clinic.alerts} alerts</div>}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              {drillClinic && (() => {
                const c = CLINICS.find(x => x.id === drillClinic)!;
                return (
                  <div className="mx-5 mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{c.name} — Drill-Down</h3>
                      <button onClick={() => onNavigate('intelligence', 'clinic-performance')} className="text-xs text-blue-600 flex items-center gap-1 hover:underline">Full Analysis <ArrowRight className="h-3 w-3" /></button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {[
                        { label: 'Rev MTD', value: fmt(c.revMTD) },
                        { label: 'vs Target', value: c.revTarget > 0 ? `${Math.round(c.revMTD / c.revTarget * 100)}%` : 'N/A' },
                        { label: 'Utilization', value: `${c.utilization}%` },
                        { label: 'No-Show', value: `${c.noShow}%` },
                        { label: 'Wait Days', value: c.waitDays.toString() },
                        { label: 'AR Days', value: c.arDays.toString() },
                      ].map((m, i) => (
                        <div key={i} className="bg-white p-2 rounded border border-gray-200 text-center">
                          <div className="text-sm font-bold text-gray-900">{m.value}</div>
                          <div className="text-xs text-gray-500">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Zones 4 + 7 side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Zone 4 — Exception Management */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h2 className="font-semibold text-gray-900">Exception Management</h2>
                  </div>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">{criticalAlerts} critical</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {EXCEPTIONS.map(ex => (
                    <div key={ex.id} className={`border-l-4 ${ex.severity === 'critical' ? 'border-red-500' : ex.severity === 'warning' ? 'border-amber-500' : 'border-blue-400'}`}>
                      <button onClick={() => toggleException(ex.id)} className="w-full px-4 py-3 text-left flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <span className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${ex.severity === 'critical' ? 'bg-red-500' : ex.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                          <p className="text-sm text-gray-800 leading-snug">{ex.issue}</p>
                        </div>
                        {expandedExceptions.has(ex.id) ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                      </button>
                      {expandedExceptions.has(ex.id) && (
                        <div className="px-4 pb-3 ml-5">
                          <div className="text-xs text-gray-500 mb-1">Owner: <span className="text-gray-700 font-medium">{ex.owner}</span></div>
                          <div className="text-xs text-gray-600 mb-2">Suggested: {ex.action}</div>
                          <button onClick={() => onNavigate(ex.module, ex.sub)} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline">
                            Take Action <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone 7 — AI Executive Insights */}
              <div className="bg-gray-900 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-blue-400" />
                  <h2 className="font-semibold">AI Executive Insights</h2>
                  <span className="ml-auto text-xs text-gray-500">Ranked by impact</span>
                </div>
                <div className="space-y-3">
                  {AI_INSIGHTS.map((ins, i) => (
                    <div key={i} className="bg-white/8 rounded-lg p-3.5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1.5">
                        {ins.type === 'opportunity' && <TrendingUp className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                        {ins.type === 'risk' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                        {ins.type === 'recommendation' && <Zap className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />}
                        <span className={`text-xs font-medium capitalize ${ins.type === 'opportunity' ? 'text-emerald-400' : ins.type === 'risk' ? 'text-amber-400' : 'text-blue-400'}`}>{ins.type}</span>
                        <span className="ml-auto text-xs text-gray-500">{ins.confidence}% conf.</span>
                      </div>
                      <p className="text-sm font-medium text-white mb-1">{ins.title}</p>
                      <p className="text-xs text-gray-400 leading-snug mb-2">{ins.detail}</p>
                      <div className="text-xs font-semibold text-gray-300">Impact: {ins.impact}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Zones 5 + 6 side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Zone 5 — Growth & Expansion */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><Rocket className="h-5 w-5 text-sky-500" /><h2 className="font-semibold text-gray-900">Growth & Expansion</h2></div>
                  <button onClick={() => setTab('expansion')} className="text-sm text-blue-600 hover:underline">Details</button>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'New Patients MTD', value: openClinics.reduce((s, c) => s + c.newPatients, 0), sub: '+8.4% vs last month' },
                      { label: 'Launches Active', value: CLINICS.filter(c => c.launching).length, sub: 'Avg readiness 67%' },
                      { label: 'Avg Launch Time', value: '39 days', sub: 'vs 120 days pre-CRE' },
                      { label: 'Integrations', value: CLINICS.filter(c => c.integrating).length, sub: '1 behind milestone' },
                    ].map((m, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xl font-bold text-gray-900">{m.value}</div>
                        <div className="text-xs font-medium text-gray-700">{m.label}</div>
                        <div className="text-xs text-gray-500">{m.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Launch Readiness</div>
                    {LAUNCHES.map(l => (
                      <div key={l.name} className="flex items-center gap-3 py-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800 truncate">{l.name}</span>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{l.stage}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${l.readiness >= 85 ? 'bg-emerald-500' : l.readiness >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${l.readiness}%` }} />
                          </div>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${l.readiness >= 85 ? 'text-emerald-600' : l.readiness >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{l.readiness}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Zone 6 — Strategic Forecast */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-sky-500" /><h2 className="font-semibold text-gray-900">Strategic & Forecast</h2></div>
                  <button onClick={() => setTab('strategy')} className="text-sm text-blue-600 hover:underline">Details</button>
                </div>
                <div className="p-5 space-y-3">
                  {OKR_ROCKS.map((okr, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 leading-snug">{okr.title}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${okr.status === 'on_track' ? 'bg-emerald-100 text-emerald-700' : okr.status === 'at_risk' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {okr.status === 'on_track' ? 'On Track' : okr.status === 'at_risk' ? 'At Risk' : 'Behind'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${okr.status === 'on_track' ? 'bg-emerald-500' : okr.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${okr.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{okr.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PERFORMANCE TAB ──────────────────────────────── */}
        {tab === 'performance' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { group: 'Financial', kpis: [
                  { label: 'Revenue MTD', value: fmt(networkRevMTD), target: fmt(networkRevTarget), ok: networkRevMTD >= networkRevTarget * 0.95 },
                  { label: 'EBITDA Margin', value: '23.4%', target: '25%', ok: false },
                  { label: 'AR Days', value: '38', target: '32', ok: false },
                  { label: 'Denial Rate', value: `${(openClinics.reduce((s, c) => s + c.denialRate, 0) / openClinics.length).toFixed(1)}%`, target: '< 5%', ok: false },
                  { label: 'Cash Conv. Cycle', value: '42 days', target: '35 days', ok: false },
                  { label: 'Rev / Provider', value: '$18,400', target: '$20,000', ok: false },
                ]},
                { group: 'Operations', kpis: [
                  { label: 'Network Utilization', value: `${avgUtilization.toFixed(0)}%`, target: '85%', ok: avgUtilization >= 80 },
                  { label: 'Total Visits MTD', value: '4,812', target: '5,200', ok: false },
                  { label: 'No-Show Rate', value: `${(openClinics.reduce((s, c) => s + c.noShow, 0) / openClinics.length).toFixed(1)}%`, target: '< 8%', ok: false },
                  { label: 'Wait (First Visit)', value: `${(openClinics.reduce((s, c) => s + c.waitDays, 0) / openClinics.length).toFixed(1)} days`, target: '< 4 days', ok: false },
                  { label: 'Schedule Fill Rate', value: '79%', target: '90%', ok: false },
                  { label: 'OT Usage', value: '6.2%', target: '< 5%', ok: false },
                ]},
                { group: 'Growth', kpis: [
                  { label: 'New Patients MTD', value: openClinics.reduce((s, c) => s + c.newPatients, 0).toString(), target: '320+', ok: true },
                  { label: 'Inquiry→Visit Conv.', value: '68%', target: '75%', ok: false },
                  { label: 'Referral Growth', value: '+11%', target: '+12%', ok: false },
                  { label: 'Google Review Vel.', value: '31/mo', target: '40/mo', ok: false },
                  { label: 'Trainer Referrals', value: '84', target: '80', ok: true },
                  { label: 'Employer Programs', value: '7 active', target: '10', ok: false },
                ]},
                { group: 'Clinical', kpis: [
                  { label: 'Outcome Improve.', value: '81%', target: '85%', ok: false },
                  { label: 'RTW Success Rate', value: '88%', target: '90%', ok: false },
                  { label: 'Plan Completion', value: '74%', target: '80%', ok: false },
                  { label: 'Reassess Compliance', value: '91%', target: '95%', ok: false },
                  { label: 'Avg NPS', value: avgNPS.toFixed(1), target: '4.6', ok: avgNPS >= 4.6 },
                  { label: 'Protocol Compliance', value: '87%', target: '92%', ok: false },
                ]},
              ].map(group => (
                <div key={group.group} className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">{group.group} KPIs</div>
                  <div className="divide-y divide-gray-50">
                    {group.kpis.map(kpi => (
                      <div key={kpi.label} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-sm text-gray-600">{kpi.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{kpi.value}</span>
                          {kpi.ok ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Clinic Performance League</h2>
                <button onClick={() => onNavigate('intelligence', 'clinic-performance')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">Full Analysis <ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Clinic</th>
                      <th className="px-4 py-3 text-left">Region</th>
                      <th className="px-4 py-3 text-right">Rev MTD</th>
                      <th className="px-4 py-3 text-right">vs Plan</th>
                      <th className="px-4 py-3 text-right">Util.</th>
                      <th className="px-4 py-3 text-right">No-Show</th>
                      <th className="px-4 py-3 text-right">AR Days</th>
                      <th className="px-4 py-3 text-right">NPS</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...openClinics].sort((a, b) => (b.revMTD / (b.revTarget || 1)) - (a.revMTD / (a.revTarget || 1))).map(c => {
                      const pct = c.revTarget > 0 ? Math.round(c.revMTD / c.revTarget * 100) : 0;
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                          <td className="px-4 py-3 text-gray-500">{c.region}</td>
                          <td className="px-4 py-3 text-right">{fmt(c.revMTD)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${pct >= 100 ? 'text-emerald-600' : pct >= 90 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</td>
                          <td className={`px-4 py-3 text-right ${c.utilization >= 80 ? 'text-emerald-600' : c.utilization >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{c.utilization}%</td>
                          <td className={`px-4 py-3 text-right ${c.noShow <= 8 ? 'text-emerald-600' : c.noShow <= 12 ? 'text-amber-600' : 'text-red-600'}`}>{c.noShow}%</td>
                          <td className={`px-4 py-3 text-right ${c.arDays <= 35 ? 'text-emerald-600' : c.arDays <= 45 ? 'text-amber-600' : 'text-red-600'}`}>{c.arDays}</td>
                          <td className="px-4 py-3 text-right">{c.nps.toFixed(1)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${c.status === 'green' ? 'bg-emerald-100 text-emerald-700' : c.status === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              <StatusDot status={c.status} />
                              {c.status === 'green' ? 'On Target' : c.status === 'yellow' ? 'Watch' : 'Intervene'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── GROWTH TAB ───────────────────────────────────── */}
        {tab === 'growth' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'New Patients MTD', value: openClinics.reduce((s, c) => s + c.newPatients, 0), trend: '+8.4%', icon: <Users className="h-5 w-5" />, color: 'text-blue-600' },
                { label: 'Inquiry→Visit Conv.', value: '68%', trend: '+2.1pp', icon: <Target className="h-5 w-5" />, color: 'text-emerald-600' },
                { label: 'Referral Sources', value: '147', trend: '+11%', icon: <Award className="h-5 w-5" />, color: 'text-teal-600' },
                { label: 'Google Reviews', value: '31/mo', trend: '+4 velocity', icon: <Star className="h-5 w-5" />, color: 'text-amber-600' },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className={`${m.color} mb-2`}>{m.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                  <div className="text-sm text-gray-600">{m.label}</div>
                  <div className="text-xs text-emerald-600 mt-1">{m.trend}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">New Patients by Region</h3>
                {[
                  { region: 'AB South', value: 108, max: 140 },
                  { region: 'AB East', value: 87, max: 140 },
                  { region: 'AB West', value: 62, max: 140 },
                  { region: 'AB NW', value: 31, max: 140 },
                  { region: 'AB North', value: 31, max: 140 },
                  { region: 'AB SW', value: 35, max: 140 },
                ].map(r => (
                  <div key={r.region} className="mb-3">
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{r.region}</span><span className="font-semibold text-gray-900">{r.value}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(r.value / r.max) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Top Referral Sources</h3>
                {[
                  { name: 'Trainer Network', count: 84, pct: 34 },
                  { name: 'Google Search', count: 61, pct: 25 },
                  { name: 'MD Referral', count: 52, pct: 21 },
                  { name: 'Employer Programs', count: 28, pct: 11 },
                  { name: 'Past Patients', count: 22, pct: 9 },
                ].map(s => (
                  <div key={s.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">{s.count}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{s.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Marketing ROI</h3>
                {[
                  { channel: 'Employer Partnerships', cac: 72, roi: '14.2×' },
                  { channel: 'Trainer Referrals', cac: 95, roi: '10.8×' },
                  { channel: 'Google Ads', cac: 218, roi: '4.7×' },
                  { channel: 'Social Media', cac: 285, roi: '3.6×' },
                  { channel: 'Print / Direct Mail', cac: 410, roi: '2.5×' },
                ].map(c => (
                  <div key={c.channel} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{c.channel}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">CAC ${c.cac}</span>
                      <span className="text-sm font-semibold text-emerald-600">{c.roi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── EXPANSION TAB ────────────────────────────────── */}
        {tab === 'expansion' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Clinics in Pipeline', value: 7, sub: '1 open, 3 active', icon: <Map className="h-5 w-5" /> },
                { label: 'Avg Launch Time', value: '39 days', sub: 'vs 120 pre-CRE', icon: <Clock className="h-5 w-5" /> },
                { label: 'Avg Readiness', value: '67%', sub: '2 of 3 > 85%', icon: <CheckCircle className="h-5 w-5" /> },
                { label: 'Active Integrations', value: 1, sub: '1 behind milestone', icon: <Zap className="h-5 w-5" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="text-blue-500 mb-2">{m.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                  <div className="text-sm text-gray-600">{m.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Active Launches</h2>
                <button onClick={() => onNavigate('operations', 'launches')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">Launch Command Center <ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="divide-y divide-gray-100">
                {LAUNCHES.map(l => (
                  <div key={l.name} className="p-5 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-48">
                      <div className="flex items-center gap-2 mb-1">
                        <Rocket className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-gray-900">{l.name}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{l.stage}</span>
                      </div>
                      <div className="text-sm text-gray-500">Target open: {new Date(l.openDate).toLocaleDateString()}</div>
                      {l.risk && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 mt-1 inline-block"><AlertTriangle className="h-3 w-3 inline mr-1" />{l.risk}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Readiness</div>
                      <div className={`text-2xl font-bold ${l.readiness >= 85 ? 'text-emerald-600' : l.readiness >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{l.readiness}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Budget</div>
                      <div className="text-sm font-semibold text-gray-900">{fmt(l.spent)} / {fmt(l.budget)}</div>
                      <div className="text-xs text-gray-500">{Math.round(l.spent / l.budget * 100)}% used</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onNavigate('operations', 'launch-readiness')} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Readiness</button>
                      <button onClick={() => onNavigate('operations', 'launch-playbooks')} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Playbook</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Integration Status — NE Acquisition</h2>
                <button onClick={() => onNavigate('operations', 'acquisition-integration')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">Full Dashboard <ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { track: 'Branding & Signage', pct: 100, ok: true },
                  { track: 'IT & Systems', pct: 72, ok: false },
                  { track: 'Clinical Ops', pct: 60, ok: false },
                  { track: 'HR & Payroll', pct: 85, ok: true },
                  { track: 'Billing & Revenue', pct: 45, ok: false },
                  { track: 'Governance', pct: 80, ok: false },
                  { track: 'Facilities', pct: 95, ok: true },
                  { track: 'Overall Day 30', pct: 77, ok: false },
                ].map(t => (
                  <div key={t.track} className={`p-3 rounded-lg border ${t.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className={`text-lg font-bold ${t.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{t.pct}%</div>
                    <div className="text-xs text-gray-600">{t.track}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STRATEGY TAB ─────────────────────────────────── */}
        {tab === 'strategy' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Annual OKR Progress</h2>
                  <button onClick={() => onNavigate('strategy', 'okrs')} className="text-sm text-blue-600 hover:underline">Full OKRs</button>
                </div>
                <div className="space-y-4">
                  {OKR_ROCKS.map((okr, i) => (
                    <div key={i}>
                      <div className="flex items-start justify-between mb-1.5 gap-2">
                        <span className="text-sm text-gray-800 leading-snug">{okr.title}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${okr.status === 'on_track' ? 'bg-emerald-100 text-emerald-700' : okr.status === 'at_risk' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {okr.status === 'on_track' ? 'On Track' : okr.status === 'at_risk' ? 'At Risk' : 'Behind'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${okr.status === 'on_track' ? 'bg-emerald-500' : okr.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${okr.progress}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-10 text-right">{okr.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Financial Forecast vs Budget</h2>
                  <button onClick={() => onNavigate('strategy', 'forecasts')} className="text-sm text-blue-600 hover:underline">Forecasts</button>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Annual Revenue Target', budget: 62000000, forecast: 58400000 },
                    { label: 'EBITDA Target', budget: 15500000, forecast: 13700000 },
                    { label: 'Expansion CapEx Budget', budget: 3800000, forecast: 2060000, note: 'Deployed' },
                    { label: 'Marketing Spend Budget', budget: 1200000, forecast: 780000, note: 'Used' },
                  ].map(f => {
                    const pct = Math.round(f.forecast / f.budget * 100);
                    return (
                      <div key={f.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{f.label}</span>
                          <span className="font-semibold text-gray-900">{fmt(f.forecast)} / {fmt(f.budget)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{pct}% {f.note || 'achieved'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Capital Deployment Summary</h2>
                  <button onClick={() => onNavigate('strategy', 'capital')} className="text-sm text-blue-600 hover:underline">Capital Plan</button>
                </div>
                {[
                  { category: 'New Clinic Build-Outs', allocated: 2400000, deployed: 1440000 },
                  { category: 'Acquisition Integrations', allocated: 800000, deployed: 480000 },
                  { category: 'Tech & Systems', allocated: 350000, deployed: 140000 },
                  { category: 'Equipment & Facility Upgrades', allocated: 250000, deployed: 165000 },
                ].map(c => (
                  <div key={c.category} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{c.category}</span>
                      <span className="text-gray-500 text-xs">{fmt(c.deployed)} / {fmt(c.allocated)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.round(c.deployed / c.allocated * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Acquisition Pipeline</h2>
                  <button onClick={() => onNavigate('strategy', 'expansion')} className="text-sm text-blue-600 hover:underline">Expansion</button>
                </div>
                {[
                  { name: 'Calgary NE Clinic', stage: 'Target Identified', noi: '$280K', capex: '$340K', status: 'active' },
                  { name: 'Red Deer Clinic Group', stage: 'Initial Outreach', noi: '$420K', capex: '$520K', status: 'early' },
                  { name: 'Edmonton South Practice', stage: 'LOI Signed', noi: '$190K', capex: '$260K', status: 'active' },
                  { name: 'Lethbridge Physio', stage: 'Due Diligence', noi: '$310K', capex: '$380K', status: 'advanced' },
                  { name: 'Medicine Hat Clinic', stage: 'Watching', noi: '$140K', capex: '$210K', status: 'watch' },
                ].map(a => (
                  <div key={a.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{a.name}</div>
                      <div className="text-xs text-gray-500">{a.stage}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">NOI {a.noi} · CapEx {a.capex}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === 'advanced' ? 'bg-emerald-100 text-emerald-700' : a.status === 'active' ? 'bg-blue-100 text-blue-700' : a.status === 'early' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
