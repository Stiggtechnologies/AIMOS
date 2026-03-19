import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Building2, Users, DollarSign, Activity, TriangleAlert as AlertTriangle,
  Brain, ChevronRight, Rocket, Star, CircleCheck as CheckCircle,
  CircleAlert as AlertCircle, Zap, Clock, ArrowUpRight, ArrowDownRight,
  Target, TrendingUp, RefreshCw, ChevronDown, ChevronUp, Minus,
  ArrowRight, Award, Phone, UserX, BadgeCheck, Heart, ChartBar as BarChart3
} from 'lucide-react';

type Tab = 'overview' | 'operations' | 'staffing' | 'growth' | 'launches';

const REGIONS = [
  { key: 'ab_south', label: 'AB South', clinicCount: 3 },
  { key: 'ab_west', label: 'AB West', clinicCount: 3 },
  { key: 'ab_east', label: 'AB East', clinicCount: 3 },
  { key: 'ab_north', label: 'AB North', clinicCount: 1 },
  { key: 'ab_sw', label: 'AB SW', clinicCount: 1 },
];

const ALL_CLINICS = [
  { id: '1', name: 'South Commons', region: 'ab_south', revMTD: 92400, revTarget: 96000, utilization: 78, nps: 4.7, noShow: 8, waitDays: 3, alerts: 0, status: 'green', launching: false, integrating: false, newPatients: 42, arDays: 31, denialRate: 4.1, fillRate: 82, outcomes: 84, rtw: 91, reassess: 93, providers: 4 },
  { id: '2', name: 'Mahogany', region: 'ab_south', revMTD: 88200, revTarget: 90000, utilization: 82, nps: 4.8, noShow: 6, waitDays: 2, alerts: 0, status: 'green', launching: false, integrating: false, newPatients: 38, arDays: 29, denialRate: 3.8, fillRate: 88, outcomes: 87, rtw: 93, reassess: 96, providers: 4 },
  { id: '3', name: 'Okotoks', region: 'ab_south', revMTD: 0, revTarget: 0, utilization: 0, nps: 0, noShow: 0, waitDays: 0, alerts: 0, status: 'blue', launching: true, integrating: false, newPatients: 0, arDays: 0, denialRate: 0, fillRate: 0, outcomes: 0, rtw: 0, reassess: 0, providers: 0 },
  { id: '4', name: 'Signal Hill', region: 'ab_west', revMTD: 74100, revTarget: 90000, utilization: 64, nps: 4.2, noShow: 14, waitDays: 7, alerts: 2, status: 'red', launching: false, integrating: false, newPatients: 21, arDays: 47, denialRate: 9.2, fillRate: 71, outcomes: 76, rtw: 84, reassess: 80, providers: 5 },
  { id: '5', name: 'Marda Loop', region: 'ab_west', revMTD: 81000, revTarget: 85000, utilization: 74, nps: 4.5, noShow: 10, waitDays: 4, alerts: 1, status: 'yellow', launching: false, integrating: false, newPatients: 28, arDays: 38, denialRate: 5.4, fillRate: 79, outcomes: 82, rtw: 88, reassess: 89, providers: 4 },
  { id: '6', name: 'Cochrane', region: 'ab_west', revMTD: 0, revTarget: 0, utilization: 0, nps: 0, noShow: 0, waitDays: 0, alerts: 0, status: 'blue', launching: true, integrating: false, newPatients: 0, arDays: 0, denialRate: 0, fillRate: 0, outcomes: 0, rtw: 0, reassess: 0, providers: 0 },
  { id: '7', name: 'Bridgeland', region: 'ab_east', revMTD: 95800, revTarget: 95000, utilization: 88, nps: 4.9, noShow: 5, waitDays: 2, alerts: 0, status: 'green', launching: false, integrating: false, newPatients: 51, arDays: 27, denialRate: 2.9, fillRate: 91, outcomes: 91, rtw: 95, reassess: 97, providers: 5 },
  { id: '8', name: 'Renfrew', region: 'ab_east', revMTD: 68400, revTarget: 80000, utilization: 61, nps: 4.1, noShow: 16, waitDays: 8, alerts: 3, status: 'red', launching: false, integrating: false, newPatients: 18, arDays: 52, denialRate: 11.3, fillRate: 68, outcomes: 73, rtw: 81, reassess: 78, providers: 3 },
  { id: '9', name: 'NE Acquisition', region: 'ab_east', revMTD: 55200, revTarget: 75000, utilization: 58, nps: 3.9, noShow: 18, waitDays: 9, alerts: 2, status: 'red', launching: false, integrating: true, newPatients: 14, arDays: 58, denialRate: 13.1, fillRate: 62, outcomes: 68, rtw: 76, reassess: 71, providers: 3 },
  { id: '10', name: 'Airdrie', region: 'ab_north', revMTD: 71400, revTarget: 72000, utilization: 71, nps: 4.4, noShow: 11, waitDays: 5, alerts: 0, status: 'yellow', launching: false, integrating: false, newPatients: 31, arDays: 34, denialRate: 5.1, fillRate: 77, outcomes: 81, rtw: 87, reassess: 88, providers: 4 },
  { id: '11', name: 'Bridlewood', region: 'ab_sw', revMTD: 77800, revTarget: 78000, utilization: 73, nps: 4.5, noShow: 9, waitDays: 4, alerts: 0, status: 'green', launching: false, integrating: false, newPatients: 35, arDays: 32, denialRate: 4.4, fillRate: 80, outcomes: 83, rtw: 90, reassess: 92, providers: 4 },
];

const STAFFING = {
  ab_south: [
    { role: 'Physiotherapist', filled: 8, needed: 9, burnout: 1, credAlerts: 0 },
    { role: 'Kinesiologist', filled: 4, needed: 4, burnout: 0, credAlerts: 0 },
    { role: 'Massage Therapist', filled: 3, needed: 4, burnout: 0, credAlerts: 1 },
    { role: 'Clinic Coordinator', filled: 3, needed: 3, burnout: 0, credAlerts: 0 },
  ],
  ab_west: [
    { role: 'Physiotherapist', filled: 7, needed: 9, burnout: 2, credAlerts: 1 },
    { role: 'Kinesiologist', filled: 3, needed: 4, burnout: 1, credAlerts: 0 },
    { role: 'Massage Therapist', filled: 4, needed: 4, burnout: 0, credAlerts: 0 },
    { role: 'Clinic Coordinator', filled: 2, needed: 3, burnout: 0, credAlerts: 0 },
  ],
  ab_east: [
    { role: 'Physiotherapist', filled: 8, needed: 11, burnout: 2, credAlerts: 1 },
    { role: 'Kinesiologist', filled: 3, needed: 5, burnout: 0, credAlerts: 0 },
    { role: 'Massage Therapist', filled: 4, needed: 5, burnout: 1, credAlerts: 0 },
    { role: 'Clinic Coordinator', filled: 3, needed: 3, burnout: 0, credAlerts: 0 },
  ],
  ab_north: [
    { role: 'Physiotherapist', filled: 3, needed: 4, burnout: 0, credAlerts: 0 },
    { role: 'Kinesiologist', filled: 2, needed: 2, burnout: 0, credAlerts: 0 },
    { role: 'Clinic Coordinator', filled: 1, needed: 1, burnout: 0, credAlerts: 0 },
  ],
  ab_sw: [
    { role: 'Physiotherapist', filled: 3, needed: 3, burnout: 0, credAlerts: 0 },
    { role: 'Kinesiologist', filled: 2, needed: 2, burnout: 0, credAlerts: 0 },
    { role: 'Clinic Coordinator', filled: 1, needed: 1, burnout: 0, credAlerts: 0 },
  ],
};

const EXCEPTIONS_BY_REGION: Record<string, typeof EXCEPTIONS_AB_WEST> = {};

const EXCEPTIONS_AB_EAST = [
  { id: 'e1', severity: 'critical', issue: 'NE Acquisition claim denial rate 13.1% — 3× regional avg', owner: 'Revenue Cycle Lead', action: 'Audit payer coding workflow; assign RCM coach on-site', module: 'revenue', sub: 'claims' },
  { id: 'e2', severity: 'critical', issue: 'Renfrew utilization 61% — 3rd consecutive week below 65%', owner: 'Clinic Manager, Renfrew', action: 'Activate capacity playbook; add evening shift blocks', module: 'operations', sub: 'schedule' },
  { id: 'e3', severity: 'warning', issue: 'NE Acquisition integration Day 45 — revenue cycle migration still pending', owner: 'Regional Ops Manager', action: 'Escalate IT migration; assign dedicated billing resource', module: 'operations', sub: 'acquisition-integration' },
  { id: 'e4', severity: 'warning', issue: '2 providers at burnout risk in AB East (HBI scores elevated)', owner: 'Regional Clinical Director', action: 'Review caseloads; schedule 1-on-1s this week', module: 'workforce', sub: 'workforce-health' },
];

const EXCEPTIONS_AB_WEST = [
  { id: 'w1', severity: 'critical', issue: 'Signal Hill no-show rate 14% — above threshold 3 consecutive weeks', owner: 'Clinic Manager, Signal Hill', action: 'Enable automated SMS reminders + implement deposit policy', module: 'operations', sub: 'schedule' },
  { id: 'w2', severity: 'warning', issue: 'Cochrane launch staffing gap — PT role unfilled, target open May 1', owner: 'Regional Director', action: 'Escalate to executive sponsor; post to additional job boards', module: 'operations', sub: 'launches' },
  { id: 'w3', severity: 'warning', issue: 'Signal Hill evening schedule 40% unfilled — unmet demand detected', owner: 'Regional Ops Manager', action: 'Shift 1 provider to Tu/Th evenings; open 3 new blocks', module: 'operations', sub: 'schedule' },
];

const EXCEPTIONS_AB_SOUTH = [
  { id: 's1', severity: 'warning', issue: 'Massage therapy credential renewal overdue for 1 provider at Mahogany', owner: 'Clinic Manager, Mahogany', action: 'Submit renewal immediately; suspend bookings until cleared', module: 'workforce', sub: 'credentials' },
  { id: 's2', severity: 'info', issue: 'Okotoks launch permit delayed — site confirmation expected next week', owner: 'VP Expansion', action: 'Follow up with developer; update target open date if >7 day delay', module: 'operations', sub: 'launches' },
];

const EXCEPTIONS_AB_NORTH = [
  { id: 'n1', severity: 'warning', issue: 'Airdrie referral volume declined 3 consecutive weeks from trainer channel', owner: 'Regional Growth Manager', action: 'Activate trainer outreach playbook; schedule lunch-and-learns', module: 'growth', sub: 'trainers' },
];

const EXCEPTIONS_AB_SW = [
  { id: 'sw1', severity: 'info', issue: 'Bridlewood revenue 99.7% of target — minor scheduling gap on Fridays', owner: 'Clinic Manager, Bridlewood', action: 'Open 2 additional Friday afternoon slots', module: 'operations', sub: 'schedule' },
];

EXCEPTIONS_BY_REGION['ab_east'] = EXCEPTIONS_AB_EAST;
EXCEPTIONS_BY_REGION['ab_west'] = EXCEPTIONS_AB_WEST;
EXCEPTIONS_BY_REGION['ab_south'] = EXCEPTIONS_AB_SOUTH;
EXCEPTIONS_BY_REGION['ab_north'] = EXCEPTIONS_AB_NORTH;
EXCEPTIONS_BY_REGION['ab_sw'] = EXCEPTIONS_AB_SW;

const AI_INSIGHTS_BY_REGION: Record<string, Array<{ type: string; title: string; detail: string; impact: string; confidence: number }>> = {
  ab_east: [
    { type: 'risk', title: 'NE Acquisition breakeven delayed 28 days at current pace', detail: 'Revenue cycle migration is the primary blocker. Assigning a dedicated RCM resource could recover 18 days.', impact: '−$38K', confidence: 84 },
    { type: 'opportunity', title: 'Shift 2 providers to evening blocks at Bridgeland', detail: 'Unmet demand Tuesday–Thursday evenings. Modelled uplift +$14,200/month with no new hires required.', impact: '+$170K/yr', confidence: 91 },
    { type: 'recommendation', title: 'Renfrew recovery: add Kin + 8 new blocks before end of month', detail: '3-week utilization trend requires immediate intervention or Q2 target miss is probable.', impact: '+8pp util', confidence: 78 },
  ],
  ab_west: [
    { type: 'risk', title: 'Cochrane launch at risk — PT gap 47 days from target open', detail: 'Without PT hire confirmed by Apr 7, opening will slip past May 1 target.', impact: '−$28K rev', confidence: 81 },
    { type: 'opportunity', title: 'Signal Hill no-show fix could add $9,400/month', detail: 'Automated reminders + deposit policy reduces no-show rate from 14% to ~7% within 6 weeks.', impact: '+$113K/yr', confidence: 87 },
    { type: 'recommendation', title: 'Marda Loop evening utilization gap — add 2 blocks Tue/Thu', detail: 'Current fill rate 79% — 6 unfilled prime-time slots per week visible in scheduling data.', impact: '+5pp util', confidence: 83 },
  ],
  ab_south: [
    { type: 'opportunity', title: 'Mahogany and South Commons trainer referral programs growing', detail: 'Combined trainer referrals +18% vs last month. Replication to Okotoks at launch recommended.', impact: '+22 pts/mo', confidence: 88 },
    { type: 'risk', title: 'Okotoks launch permit delay may push opening past Q2', detail: 'Current milestone is 12 days late. Update financial forecast if delay extends past Apr 15.', impact: 'Q2 revenue miss', confidence: 74 },
  ],
  ab_north: [
    { type: 'risk', title: 'Airdrie trainer referral decline — 3 consecutive weeks', detail: 'Likely cause: 2 trainer contacts changed gyms. Outreach reactivation estimated to recover volume in 3–4 weeks.', impact: '−12 pts/mo', confidence: 80 },
    { type: 'recommendation', title: 'Airdrie employer program has room for 2 additional contracts', detail: 'Current capacity allows adding Telus and Enerplus contracts based on current scheduler availability.', impact: '+$7,200/mo', confidence: 77 },
  ],
  ab_sw: [
    { type: 'opportunity', title: 'Bridlewood Friday slot gap — minimal action, high return', detail: '2 additional Friday PM slots would achieve 100% target achievement without added headcount.', impact: '+$400/mo', confidence: 96 },
  ],
};

const LAUNCHES_BY_REGION: Record<string, Array<{ name: string; stage: string; readiness: number; openDate: string; risk: string | null; budget: number; spent: number; tracks: Array<{ name: string; pct: number }> }>> = {
  ab_west: [
    {
      name: 'AIM Cochrane', stage: 'Opening Soon', readiness: 91, openDate: '2026-05-01', risk: 'PT hire still pending', budget: 390000, spent: 378000,
      tracks: [{ name: 'Facility', pct: 100 }, { name: 'Hiring', pct: 75 }, { name: 'IT Setup', pct: 98 }, { name: 'Marketing', pct: 95 }],
    },
  ],
  ab_south: [
    {
      name: 'AIM Okotoks', stage: 'Due Diligence', readiness: 38, openDate: '2027-04-01', risk: 'Site permit not confirmed', budget: 440000, spent: 28000,
      tracks: [{ name: 'Facility', pct: 20 }, { name: 'Hiring', pct: 10 }, { name: 'IT Setup', pct: 0 }, { name: 'Marketing', pct: 45 }],
    },
  ],
  ab_east: [],
  ab_north: [],
  ab_sw: [],
};

const REFERRAL_SOURCES = [
  { name: 'Trainer Network', pct: 32 },
  { name: 'Employer Programs', pct: 26 },
  { name: 'Physician Referral', pct: 21 },
  { name: 'Digital / Google', pct: 14 },
  { name: 'Other', pct: 7 },
];

function fmt(v: number) {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function StatusChip({ status }: { status: string }) {
  if (status === 'green') return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">On Target</span>;
  if (status === 'yellow') return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Watch</span>;
  if (status === 'red') return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Intervene</span>;
  if (status === 'blue') return <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Launching</span>;
  return null;
}

function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value > 0) return <span className="flex items-center text-emerald-400 text-xs"><ArrowUpRight className="h-3 w-3" />+{value}{suffix}</span>;
  if (value < 0) return <span className="flex items-center text-red-400 text-xs"><ArrowDownRight className="h-3 w-3" />{value}{suffix}</span>;
  return <span className="flex items-center text-gray-400 text-xs"><Minus className="h-3 w-3" />0{suffix}</span>;
}

interface Props {
  onNavigate: (module: string, subModule: string) => void;
}

type ClinicItem = typeof ALL_CLINICS[number];

export function RegionalOpsCommandCenter({ onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [regionKey, setRegionKey] = useState('ab_east');
  const [drillClinic, setDrillClinic] = useState<string | null>(null);
  const [expandedEx, setExpandedEx] = useState<Set<string>>(new Set());
  const [allClinicsData, setAllClinicsData] = useState<ClinicItem[]>(ALL_CLINICS);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('clinics')
          .select('id, name, region, status, is_active, launch_date, is_partner_clinic')
          .order('name');
        if (data && data.length > 0) {
          const regionMap: Record<string, string> = {
            'AB South': 'ab_south', 'AB West': 'ab_west', 'AB East': 'ab_east',
            'AB North': 'ab_north', 'AB SW': 'ab_sw',
          };
          const mapped: ClinicItem[] = data.map((c) => {
            const existing = ALL_CLINICS.find(x => x.name.toLowerCase().includes((c.name ?? '').toLowerCase().split(' ')[1] ?? '___'));
            if (existing) return existing;
            return {
              id: String(c.id), name: c.name ?? 'Clinic',
              region: regionMap[c.region ?? ''] ?? 'ab_east',
              revMTD: 0, revTarget: 0, utilization: 0, nps: 0, noShow: 0, waitDays: 0,
              alerts: 0, status: c.is_active ? 'green' : 'blue',
              launching: !c.is_active, integrating: false,
              newPatients: 0, arDays: 0, denialRate: 0, fillRate: 0,
              outcomes: 0, rtw: 0, reassess: 0, providers: 0,
            };
          });
          setAllClinicsData(mapped);
          const regions = [...new Set(mapped.map(c => c.region))];
          if (regions.length > 0 && !regions.includes('ab_east')) setRegionKey(regions[0]);
        }
      } catch {
      }
    })();
  }, []);

  const region = REGIONS.find(r => r.key === regionKey) ?? REGIONS[0];
  const clinics = allClinicsData.filter(c => c.region === regionKey);
  const openClinics = clinics.filter(c => !c.launching);
  const exceptions = EXCEPTIONS_BY_REGION[regionKey] ?? [];
  const aiInsights = AI_INSIGHTS_BY_REGION[regionKey] ?? [];
  const launches = LAUNCHES_BY_REGION[regionKey] ?? [];
  const staffing = (STAFFING as Record<string, typeof STAFFING['ab_south']>)[regionKey] ?? [];

  const revMTD = openClinics.reduce((s, c) => s + c.revMTD, 0);
  const revTarget = openClinics.reduce((s, c) => s + c.revTarget, 0);
  const avgUtil = openClinics.length ? openClinics.reduce((s, c) => s + c.utilization, 0) / openClinics.length : 0;
  const newPatients = openClinics.reduce((s, c) => s + c.newPatients, 0);
  const critAlerts = exceptions.filter(e => e.severity === 'critical').length;
  const providers = openClinics.reduce((s, c) => s + c.providers, 0);
  const avgArDays = openClinics.length ? openClinics.reduce((s, c) => s + c.arDays, 0) / openClinics.length : 0;
  const avgDenial = openClinics.length ? openClinics.reduce((s, c) => s + c.denialRate, 0) / openClinics.length : 0;
  const avgNoShow = openClinics.length ? openClinics.reduce((s, c) => s + c.noShow, 0) / openClinics.length : 0;
  const avgFill = openClinics.length ? openClinics.reduce((s, c) => s + c.fillRate, 0) / openClinics.length : 0;
  const avgOutcomes = openClinics.filter(c => c.outcomes > 0).length ? openClinics.filter(c => c.outcomes > 0).reduce((s, c) => s + c.outcomes, 0) / openClinics.filter(c => c.outcomes > 0).length : 0;

  const totalNeeded = staffing.reduce((s, r) => s + r.needed, 0);
  const totalFilled = staffing.reduce((s, r) => s + r.filled, 0);
  const burnoutCount = staffing.reduce((s, r) => s + r.burnout, 0);
  const credAlerts = staffing.reduce((s, r) => s + r.credAlerts, 0);
  const openRoles = totalNeeded - totalFilled;

  const toggleEx = (id: string) => {
    setExpandedEx(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div className="space-y-0 -mx-6 -mt-2">
      {/* Zone 1 — Regional Health Bar */}
      <div className="bg-gray-900 text-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2 font-semibold text-gray-300 mr-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            Regional Ops
          </div>
          <select
            value={regionKey}
            onChange={e => { setRegionKey(e.target.value); setDrillClinic(null); }}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none"
          >
            {REGIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <div className="w-px h-4 bg-gray-700 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Clinics</span><span className="font-bold text-white">{clinics.length}</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Providers</span><span className="font-bold text-white">{providers}</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Rev MTD</span><span className="font-bold text-emerald-400">{fmt(revMTD)}</span><span className="text-gray-500 text-xs">/ {fmt(revTarget)}</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Utilization</span><span className={`font-bold ${avgUtil >= 80 ? 'text-emerald-400' : avgUtil >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{avgUtil.toFixed(0)}%</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">New Patients</span><span className="font-bold text-white">{newPatients}</span></span>
          {launches.length > 0 && <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Launches</span><span className="font-bold text-blue-400">{launches.length}</span></span>}
          {critAlerts > 0 && (
            <div className="flex items-center gap-1.5 bg-red-900/60 px-2.5 py-1 rounded-full">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="font-bold text-red-300 text-xs">{critAlerts} Critical</span>
            </div>
          )}
          <button className="ml-auto text-gray-500 hover:text-gray-300 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-6 pt-5 space-y-5 pb-8">
        {/* Header + tabs */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Regional Command Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">{region.label} · {clinics.length} clinics · {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long' })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
              <option>All Clinics</option>
              {clinics.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
              <option>MTD March 2026</option>
              <option>Q1 2026</option>
              <option>Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200">
          {(['overview', 'operations', 'staffing', 'growth', 'launches'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {/* Zone 2 — Regional KPI Band */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Revenue MTD', value: fmt(revMTD), sub: `${revTarget > 0 ? Math.round(revMTD / revTarget * 100) : 0}% of plan`, trend: revTarget > 0 ? +(((revMTD / revTarget) - 1) * 100).toFixed(1) : 0, color: 'from-blue-600 to-blue-700', icon: <DollarSign className="h-5 w-5 opacity-70" /> },
                { label: 'Utilization', value: `${avgUtil.toFixed(0)}%`, sub: 'Target: 85%', trend: -2.1, color: 'from-amber-600 to-amber-700', icon: <Activity className="h-5 w-5 opacity-70" /> },
                { label: 'New Patients', value: newPatients.toString(), sub: 'MTD', trend: 8.4, color: 'from-teal-600 to-teal-700', icon: <Users className="h-5 w-5 opacity-70" /> },
                { label: 'AR Days', value: avgArDays.toFixed(0), sub: 'Target: 32', trend: -1.5, color: 'from-rose-600 to-rose-700', icon: <Clock className="h-5 w-5 opacity-70" /> },
                { label: 'Denial Rate', value: `${avgDenial.toFixed(1)}%`, sub: 'Target: <5%', trend: -0.3, color: avgDenial > 7 ? 'from-red-700 to-red-800' : 'from-orange-600 to-orange-700', icon: <AlertCircle className="h-5 w-5 opacity-70" /> },
                { label: 'Avg NPS', value: openClinics.filter(c => c.nps > 0).length ? (openClinics.filter(c => c.nps > 0).reduce((s, c) => s + c.nps, 0) / openClinics.filter(c => c.nps > 0).length).toFixed(1) : '—', sub: 'Target: 4.6', trend: 0.2, color: 'from-sky-600 to-sky-700', icon: <Star className="h-5 w-5 opacity-70" /> },
              ].map((kpi, i) => (
                <button key={i} onClick={() => setTab('operations')} className={`bg-gradient-to-br ${kpi.color} rounded-xl p-4 text-white text-left hover:opacity-95 transition-opacity`}>
                  <div className="flex items-center justify-between mb-2">
                    {kpi.icon}
                    <TrendBadge value={kpi.trend} />
                  </div>
                  <div className="text-2xl font-bold leading-none mb-1">{kpi.value}</div>
                  <div className="text-xs opacity-70">{kpi.label}</div>
                  <div className="text-xs opacity-50 mt-0.5">{kpi.sub}</div>
                </button>
              ))}
            </div>

            {/* Zone 3 — Clinic Performance Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Clinic Performance Grid</h2>
                </div>
                <button onClick={() => onNavigate('intelligence', 'clinic-performance')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">Deep Analysis <ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Clinic</th>
                      <th className="px-4 py-3 text-right">Rev MTD</th>
                      <th className="px-4 py-3 text-right">vs Plan</th>
                      <th className="px-4 py-3 text-right">Util.</th>
                      <th className="px-4 py-3 text-right">New Pts</th>
                      <th className="px-4 py-3 text-right">NPS</th>
                      <th className="px-4 py-3 text-right">No-Show</th>
                      <th className="px-4 py-3 text-right">AR Days</th>
                      <th className="px-4 py-3 text-center">Alerts</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {clinics.map(c => {
                      const pct = c.revTarget > 0 ? Math.round(c.revMTD / c.revTarget * 100) : null;
                      const isSelected = drillClinic === c.id;
                      return (
                        <>
                          <tr
                            key={c.id}
                            onClick={() => setDrillClinic(isSelected ? null : c.id)}
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''} ${c.status === 'red' ? 'border-l-2 border-red-400' : c.status === 'yellow' ? 'border-l-2 border-amber-400' : ''}`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                              {c.name}
                              {c.integrating && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Integrating</span>}
                            </td>
                            <td className="px-4 py-3 text-right">{c.launching ? '—' : fmt(c.revMTD)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${pct === null ? 'text-gray-400' : pct >= 100 ? 'text-emerald-600' : pct >= 90 ? 'text-amber-600' : 'text-red-600'}`}>{pct !== null ? `${pct}%` : '—'}</td>
                            <td className={`px-4 py-3 text-right ${c.launching ? 'text-gray-400' : c.utilization >= 80 ? 'text-emerald-600' : c.utilization >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{c.launching ? '—' : `${c.utilization}%`}</td>
                            <td className="px-4 py-3 text-right">{c.launching ? '—' : c.newPatients}</td>
                            <td className="px-4 py-3 text-right">{c.nps > 0 ? c.nps.toFixed(1) : '—'}</td>
                            <td className={`px-4 py-3 text-right ${c.launching ? 'text-gray-400' : c.noShow <= 8 ? 'text-emerald-600' : c.noShow <= 12 ? 'text-amber-600' : 'text-red-600'}`}>{c.launching ? '—' : `${c.noShow}%`}</td>
                            <td className={`px-4 py-3 text-right ${c.launching ? 'text-gray-400' : c.arDays <= 35 ? 'text-emerald-600' : c.arDays <= 45 ? 'text-amber-600' : 'text-red-600'}`}>{c.launching ? '—' : c.arDays}</td>
                            <td className="px-4 py-3 text-center">
                              {c.alerts > 0 ? <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs"><AlertTriangle className="h-3.5 w-3.5" />{c.alerts}</span> : <span className="text-gray-400 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3 text-center"><StatusChip status={c.status} /></td>
                          </tr>
                          {isSelected && !c.launching && (
                            <tr key={`drill-${c.id}`} className="bg-blue-50">
                              <td colSpan={10} className="px-4 py-4">
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-3">
                                  {[
                                    { label: 'Schedule Fill', value: `${c.fillRate}%`, ok: c.fillRate >= 85 },
                                    { label: 'Outcomes', value: `${c.outcomes}%`, ok: c.outcomes >= 85 },
                                    { label: 'RTW Rate', value: `${c.rtw}%`, ok: c.rtw >= 88 },
                                    { label: 'Reassess Comp.', value: `${c.reassess}%`, ok: c.reassess >= 92 },
                                    { label: 'Denial Rate', value: `${c.denialRate}%`, ok: c.denialRate < 5 },
                                    { label: 'Providers', value: c.providers.toString(), ok: true },
                                  ].map((m, i) => (
                                    <div key={i} className={`p-2 rounded border text-center ${m.ok ? 'bg-white border-emerald-200' : 'bg-white border-amber-200'}`}>
                                      <div className="text-sm font-bold text-gray-900">{m.value}</div>
                                      <div className="text-xs text-gray-500">{m.label}</div>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => onNavigate('command_center', 'clinic')} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" />Clinic Command Center
                                  </button>
                                  <button onClick={() => onNavigate('intelligence', 'clinic-performance')} className="text-xs px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors">Full Analysis</button>
                                  <button onClick={() => onNavigate('operations', 'schedule')} className="text-xs px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors">Scheduler</button>
                                  <button onClick={() => onNavigate('revenue', 'claims')} className="text-xs px-3 py-1.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors">Revenue Cycle</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Zone 4 + AI side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Zone 4 — Operational Exceptions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h2 className="font-semibold text-gray-900">Operational Exceptions</h2>
                  </div>
                  {critAlerts > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">{critAlerts} critical</span>}
                </div>
                {exceptions.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                    <p className="text-sm">No exceptions for this region</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {exceptions.map(ex => (
                      <div key={ex.id} className={`border-l-4 ${ex.severity === 'critical' ? 'border-red-500' : ex.severity === 'warning' ? 'border-amber-500' : 'border-blue-400'}`}>
                        <button onClick={() => toggleEx(ex.id)} className="w-full px-4 py-3 text-left flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${ex.severity === 'critical' ? 'bg-red-500' : ex.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                            <p className="text-sm text-gray-800 leading-snug">{ex.issue}</p>
                          </div>
                          {expandedEx.has(ex.id) ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                        </button>
                        {expandedEx.has(ex.id) && (
                          <div className="px-4 pb-3 ml-5 space-y-1.5">
                            <div className="text-xs text-gray-500">Owner: <span className="text-gray-700 font-medium">{ex.owner}</span></div>
                            <div className="text-xs text-gray-600">{ex.action}</div>
                            <button onClick={() => onNavigate(ex.module, ex.sub)} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline mt-1">Take Action <ChevronRight className="h-3 w-3" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Regional Scorecard Snapshot */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-teal-600" aria-hidden="true" />
                    <h2 className="font-semibold text-gray-900">Regional Scorecard — Feb 2026</h2>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium" role="status" aria-label="Overall regional scorecard status: At Risk">At Risk</span>
                  </div>
                  <button
                    onClick={() => onNavigate('strategy', 'scorecard')}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    aria-label="Open full Scorecard Engine"
                  >
                    Full Scorecard <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4" role="list" aria-label="Regional scorecard metrics">
                    {[
                      { label: 'Avg Utilization', value: '74%', target: '85%', rag: 'yellow' as const },
                      { label: 'Net AR Days', value: '39d', target: '35d', rag: 'yellow' as const },
                      { label: 'New Patients', value: '279', target: '310', rag: 'yellow' as const },
                      { label: 'No-Show Rate', value: '10%', target: '<8%', rag: 'red' as const },
                      { label: 'Plan Completion', value: '83%', target: '85%', rag: 'yellow' as const },
                      { label: 'Denial Rate', value: '5.8%', target: '<5%', rag: 'red' as const },
                    ].map(metric => {
                      const ragStyles = {
                        green: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', label: 'On Track' },
                        yellow: { dot: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', label: 'At Risk' },
                        red: { dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', label: 'Off Track' },
                      }[metric.rag];
                      return (
                        <div
                          key={metric.label}
                          role="listitem"
                          className={`rounded-lg p-3 border ${ragStyles.bg} ${ragStyles.border}`}
                          aria-label={`${metric.label}: ${metric.value}, target ${metric.target}, ${ragStyles.label}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`w-2 h-2 rounded-full ${ragStyles.dot} flex-shrink-0`} aria-hidden="true" />
                            <span className={`text-xs font-medium ${ragStyles.text}`}>{ragStyles.label}</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{metric.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Target: {metric.target}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>1 on track · 4 at risk · 2 off track across region</span>
                    <button
                      onClick={() => onNavigate('strategy', 'scorecard')}
                      className="text-blue-600 font-medium hover:underline flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      Drill into clinics <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Operational Insights */}
              <div className="bg-gray-900 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5 text-blue-400" />
                  <h2 className="font-semibold">Operational Insights</h2>
                  <span className="ml-auto text-xs text-gray-500">Ranked by impact</span>
                </div>
                {aiInsights.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-8">No insights for this region yet.</div>
                ) : (
                  <div className="space-y-3">
                    {aiInsights.map((ins, i) => (
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
                )}
              </div>
            </div>

            {/* Zone 5 staffing summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><Users className="h-5 w-5 text-gray-400" /><h2 className="font-semibold text-gray-900">Staffing Snapshot</h2></div>
                <button onClick={() => setTab('staffing')} className="text-sm text-blue-600 hover:underline">Full Staffing View</button>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${openRoles > 2 ? 'text-red-600' : openRoles > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{openRoles}</div>
                  <div className="text-xs text-gray-600">Open Roles</div>
                  <div className="text-xs text-gray-400">{totalFilled}/{totalNeeded} filled</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${burnoutCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{burnoutCount}</div>
                  <div className="text-xs text-gray-600">Burnout Risk</div>
                  <div className="text-xs text-gray-400">HBI flagged</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${credAlerts > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{credAlerts}</div>
                  <div className="text-xs text-gray-600">Cred. Alerts</div>
                  <div className="text-xs text-gray-400">Renewal due</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{providers}</div>
                  <div className="text-xs text-gray-600">Active Providers</div>
                  <div className="text-xs text-gray-400">Across {openClinics.length} clinics</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── OPERATIONS TAB ───────────────────────────────── */}
        {tab === 'operations' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { group: 'Financial', kpis: [
                  { label: 'Revenue MTD', value: fmt(revMTD), target: fmt(revTarget), ok: revMTD >= revTarget * 0.95 },
                  { label: 'Rev vs Plan', value: `${revTarget > 0 ? Math.round(revMTD / revTarget * 100) : 0}%`, target: '≥100%', ok: revMTD >= revTarget },
                  { label: 'AR Days', value: avgArDays.toFixed(0), target: '32', ok: avgArDays <= 35 },
                  { label: 'Claim Denial', value: `${avgDenial.toFixed(1)}%`, target: '<5%', ok: avgDenial < 5 },
                  { label: 'Rev / Provider', value: fmt(providers > 0 ? revMTD / providers : 0), target: '$20K', ok: providers > 0 && revMTD / providers >= 18000 },
                ]},
                { group: 'Operations', kpis: [
                  { label: 'Utilization', value: `${avgUtil.toFixed(0)}%`, target: '85%', ok: avgUtil >= 80 },
                  { label: 'Schedule Fill', value: `${avgFill.toFixed(0)}%`, target: '90%', ok: avgFill >= 85 },
                  { label: 'No-Show Rate', value: `${avgNoShow.toFixed(1)}%`, target: '<8%', ok: avgNoShow < 8 },
                  { label: 'Wait (1st Visit)', value: `${openClinics.length ? (openClinics.reduce((s, c) => s + c.waitDays, 0) / openClinics.length).toFixed(1) : 0} days`, target: '<4 days', ok: openClinics.length > 0 && openClinics.reduce((s, c) => s + c.waitDays, 0) / openClinics.length < 4 },
                ]},
                { group: 'Clinical', kpis: [
                  { label: 'Outcome Rate', value: `${avgOutcomes.toFixed(0)}%`, target: '85%', ok: avgOutcomes >= 85 },
                  { label: 'RTW Success', value: `${openClinics.filter(c => c.rtw > 0).length ? (openClinics.filter(c => c.rtw > 0).reduce((s, c) => s + c.rtw, 0) / openClinics.filter(c => c.rtw > 0).length).toFixed(0) : 0}%`, target: '90%', ok: false },
                  { label: 'Reassess Comp.', value: `${openClinics.filter(c => c.reassess > 0).length ? (openClinics.filter(c => c.reassess > 0).reduce((s, c) => s + c.reassess, 0) / openClinics.filter(c => c.reassess > 0).length).toFixed(0) : 0}%`, target: '95%', ok: false },
                  { label: 'Avg NPS', value: openClinics.filter(c => c.nps > 0).length ? (openClinics.filter(c => c.nps > 0).reduce((s, c) => s + c.nps, 0) / openClinics.filter(c => c.nps > 0).length).toFixed(1) : '—', target: '4.6', ok: false },
                ]},
                { group: 'Growth', kpis: [
                  { label: 'New Patients', value: newPatients.toString(), target: 'On track', ok: true },
                  { label: 'Referral Growth', value: '+9%', target: '+12%', ok: false },
                  { label: 'Inq→Visit Conv.', value: '66%', target: '75%', ok: false },
                  { label: 'Trainer Referrals', value: '41', target: '45', ok: false },
                ]},
              ].map(group => (
                <div key={group.group} className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">{group.group}</div>
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
                <h2 className="font-semibold text-gray-900">Clinic Comparison — Key Metrics</h2>
                <button onClick={() => onNavigate('intelligence', 'benchmarking')} className="text-sm text-blue-600 hover:underline">Benchmarking</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Clinic</th>
                      <th className="px-4 py-3 text-right">Fill Rate</th>
                      <th className="px-4 py-3 text-right">No-Show</th>
                      <th className="px-4 py-3 text-right">AR Days</th>
                      <th className="px-4 py-3 text-right">Denial %</th>
                      <th className="px-4 py-3 text-right">Outcomes</th>
                      <th className="px-4 py-3 text-right">RTW</th>
                      <th className="px-4 py-3 text-right">Reassess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {openClinics.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className={`px-4 py-3 text-right ${c.fillRate >= 85 ? 'text-emerald-600' : c.fillRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{c.fillRate}%</td>
                        <td className={`px-4 py-3 text-right ${c.noShow <= 8 ? 'text-emerald-600' : c.noShow <= 12 ? 'text-amber-600' : 'text-red-600'}`}>{c.noShow}%</td>
                        <td className={`px-4 py-3 text-right ${c.arDays <= 35 ? 'text-emerald-600' : c.arDays <= 45 ? 'text-amber-600' : 'text-red-600'}`}>{c.arDays}</td>
                        <td className={`px-4 py-3 text-right ${c.denialRate < 5 ? 'text-emerald-600' : c.denialRate < 8 ? 'text-amber-600' : 'text-red-600'}`}>{c.denialRate}%</td>
                        <td className={`px-4 py-3 text-right ${c.outcomes >= 85 ? 'text-emerald-600' : c.outcomes >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{c.outcomes}%</td>
                        <td className={`px-4 py-3 text-right ${c.rtw >= 90 ? 'text-emerald-600' : c.rtw >= 82 ? 'text-amber-600' : 'text-red-600'}`}>{c.rtw}%</td>
                        <td className={`px-4 py-3 text-right ${c.reassess >= 92 ? 'text-emerald-600' : c.reassess >= 83 ? 'text-amber-600' : 'text-red-600'}`}>{c.reassess}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── STAFFING TAB ──────────────────────────────────── */}
        {tab === 'staffing' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Open Roles', value: openRoles, color: openRoles > 2 ? 'text-red-600' : openRoles > 0 ? 'text-amber-600' : 'text-emerald-600', sub: `${totalFilled}/${totalNeeded} filled`, icon: <UserX className="h-5 w-5" /> },
                { label: 'Burnout Risk', value: burnoutCount, color: burnoutCount > 0 ? 'text-amber-600' : 'text-emerald-600', sub: 'HBI score flagged', icon: <Heart className="h-5 w-5" /> },
                { label: 'Cred. Alerts', value: credAlerts, color: credAlerts > 0 ? 'text-red-600' : 'text-emerald-600', sub: 'Renewal required', icon: <BadgeCheck className="h-5 w-5" /> },
                { label: 'Total Providers', value: providers, color: 'text-gray-900', sub: `Across ${openClinics.length} clinics`, icon: <Users className="h-5 w-5" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="text-gray-400 mb-2">{m.icon}</div>
                  <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-sm text-gray-700 font-medium">{m.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Staffing by Role</h2>
                <button onClick={() => onNavigate('workforce', 'recruiting')} className="text-sm text-blue-600 hover:underline">Open Recruiting</button>
              </div>
              <div className="p-5 space-y-4">
                {staffing.map(r => {
                  const gap = r.needed - r.filled;
                  return (
                    <div key={r.role}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-800">{r.role}</span>
                          {r.burnout > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1"><Heart className="h-3 w-3" />{r.burnout} burnout risk</span>}
                          {r.credAlerts > 0 && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1"><BadgeCheck className="h-3 w-3" />{r.credAlerts} cred alert</span>}
                        </div>
                        <span className={`text-sm font-semibold ${gap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{r.filled}/{r.needed}{gap > 0 ? ` (${gap} open)` : ''}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${gap > 1 ? 'bg-red-500' : gap > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.round(r.filled / r.needed * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Provider Capacity by Clinic</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        <th className="pb-2 text-left">Clinic</th>
                        <th className="pb-2 text-right">Providers</th>
                        <th className="pb-2 text-right">Util.</th>
                        <th className="pb-2 text-right">Fill Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {openClinics.map(c => (
                        <tr key={c.id}>
                          <td className="py-2 text-gray-800">{c.name}</td>
                          <td className="py-2 text-right">{c.providers}</td>
                          <td className={`py-2 text-right ${c.utilization >= 80 ? 'text-emerald-600' : c.utilization >= 65 ? 'text-amber-600' : 'text-red-600'}`}>{c.utilization}%</td>
                          <td className={`py-2 text-right ${c.fillRate >= 85 ? 'text-emerald-600' : c.fillRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{c.fillRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Recommended Actions</h3>
                <div className="space-y-3">
                  {openRoles > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <UserX className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-red-800">Fill {openRoles} open role{openRoles !== 1 ? 's' : ''}</div>
                        <div className="text-xs text-red-600">Post to job boards and activate recruiting pipeline</div>
                        <button onClick={() => onNavigate('workforce', 'recruiting')} className="text-xs text-red-700 font-medium mt-1 hover:underline flex items-center gap-1">Open Recruiting <ArrowRight className="h-3 w-3" /></button>
                      </div>
                    </div>
                  )}
                  {burnoutCount > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <Heart className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-amber-800">Address {burnoutCount} burnout-risk provider{burnoutCount !== 1 ? 's' : ''}</div>
                        <div className="text-xs text-amber-600">Schedule 1-on-1s; review caseload distribution</div>
                        <button onClick={() => onNavigate('workforce', 'workforce-health')} className="text-xs text-amber-700 font-medium mt-1 hover:underline flex items-center gap-1">Workforce Health <ArrowRight className="h-3 w-3" /></button>
                      </div>
                    </div>
                  )}
                  {credAlerts > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <BadgeCheck className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-red-800">{credAlerts} credential renewal overdue</div>
                        <div className="text-xs text-red-600">Suspend affected bookings until renewed</div>
                        <button onClick={() => onNavigate('operations', 'credentials')} className="text-xs text-red-700 font-medium mt-1 hover:underline flex items-center gap-1">Credentials <ArrowRight className="h-3 w-3" /></button>
                      </div>
                    </div>
                  )}
                  {openRoles === 0 && burnoutCount === 0 && credAlerts === 0 && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm text-emerald-800">No urgent staffing actions for this region</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── GROWTH TAB ───────────────────────────────────── */}
        {tab === 'growth' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'New Patients MTD', value: newPatients, trend: '+8.4%', icon: <Users className="h-5 w-5 text-blue-500" /> },
                { label: 'Inq→Visit Conv.', value: '66%', trend: '+2.1pp', icon: <Target className="h-5 w-5 text-teal-500" /> },
                { label: 'Trainer Referrals', value: '41', trend: '-3 vs prev', icon: <Award className="h-5 w-5 text-amber-500" /> },
                { label: 'Employer Programs', value: '3 active', trend: 'New pitch sent', icon: <Building2 className="h-5 w-5 text-sky-500" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="mb-2">{m.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                  <div className="text-sm text-gray-600">{m.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{m.trend}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">New Patients by Clinic</h3>
                {openClinics.map(c => (
                  <div key={c.id} className="mb-3">
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{c.name}</span><span className="font-semibold text-gray-900">{c.newPatients}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(c.newPatients / (newPatients || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Referral Mix</h3>
                {REFERRAL_SOURCES.map(s => (
                  <div key={s.name} className="mb-3">
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{s.name}</span><span className="font-semibold text-gray-900">{s.pct}%</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
                <button onClick={() => onNavigate('growth', 'referral-sources')} className="mt-3 text-xs text-blue-600 flex items-center gap-1 hover:underline">Referral Intelligence <ArrowRight className="h-3 w-3" /></button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Employer Programs</h3>
                {[
                  { name: 'Telus Health', clinics: 2, patients: 18, status: 'active' },
                  { name: 'Suncor EAP', clinics: 1, patients: 9, status: 'active' },
                  { name: 'ATCO', clinics: 1, patients: 7, status: 'active' },
                  { name: 'Enerplus (pending)', clinics: 0, patients: 0, status: 'pending' },
                ].map(ep => (
                  <div key={ep.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{ep.name}</div>
                      <div className="text-xs text-gray-500">{ep.clinics > 0 ? `${ep.clinics} clinic${ep.clinics !== 1 ? 's' : ''}, ${ep.patients} pts MTD` : 'Not yet active'}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ep.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ep.status}</span>
                  </div>
                ))}
                <button onClick={() => onNavigate('growth', 'employers')} className="mt-3 text-xs text-blue-600 flex items-center gap-1 hover:underline">Employer Programs <ArrowRight className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        )}

        {/* ── LAUNCHES TAB ─────────────────────────────────── */}
        {tab === 'launches' && (
          <div className="space-y-5">
            {launches.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Rocket className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No active launches in {region.label}</p>
                <p className="text-gray-400 text-sm mt-1">Check another region or the Network Command Center for all active launches.</p>
                <button onClick={() => onNavigate('command_center', 'network')} className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1 justify-center">
                  Network View <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : launches.map(l => (
              <div key={l.name} className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Rocket className="h-5 w-5 text-blue-500" />
                    <div>
                      <h2 className="font-semibold text-gray-900">{l.name}</h2>
                      <p className="text-sm text-gray-500">{l.stage} · Target open {new Date(l.openDate).toLocaleDateString()}</p>
                    </div>
                    {l.risk && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{l.risk}</span>}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${l.readiness >= 85 ? 'text-emerald-600' : l.readiness >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{l.readiness}%</div>
                    <div className="text-xs text-gray-500">Readiness</div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {l.tracks.map(t => (
                      <div key={t.name} className={`p-3 rounded-lg border text-center ${t.pct >= 90 ? 'bg-emerald-50 border-emerald-200' : t.pct >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`text-lg font-bold ${t.pct >= 90 ? 'text-emerald-700' : t.pct >= 60 ? 'text-amber-700' : 'text-red-700'}`}>{t.pct}%</div>
                        <div className="text-xs text-gray-600">{t.name}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2 text-gray-500">
                    <span>Budget: {fmt(l.spent)} spent / {fmt(l.budget)} approved ({Math.round(l.spent / l.budget * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round(l.spent / l.budget * 100)}%` }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onNavigate('operations', 'launches')} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Launch Dashboard</button>
                    <button onClick={() => onNavigate('operations', 'launch-playbooks')} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Playbook</button>
                    <button onClick={() => onNavigate('operations', 'launch-readiness')} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Readiness Check</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
