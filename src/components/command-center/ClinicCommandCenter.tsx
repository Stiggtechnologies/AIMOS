import { useState, useEffect } from 'react';
import {
  Building2, Calendar, Clock, Users, DollarSign,
  TriangleAlert as AlertTriangle, CircleCheck as CheckCircle,
  CircleAlert as AlertCircle, Brain, ArrowRight, ChevronRight,
  ChevronDown, ChevronUp, Star, Phone, MessageSquare, RefreshCw,
  Activity, TrendingUp, TrendingDown, UserX, BadgeCheck, Heart,
  Minus, ArrowUpRight, ArrowDownRight, FileText, Plus, Zap,
  Target, Award, UserPlus, ClipboardList
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Tab = 'overview' | 'schedule' | 'staffing' | 'revenue' | 'growth' | 'patients';

const CLINICS = [
  { key: 'south_commons', label: 'AIM South Commons' },
  { key: 'mahogany', label: 'AIM Mahogany' },
  { key: 'bridgeland', label: 'AIM Bridgeland' },
  { key: 'marda_loop', label: 'AIM Marda Loop' },
  { key: 'signal_hill', label: 'AIM Signal Hill' },
];

function fmt(v: number) {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function StatusDot({ status }: { status: 'completed' | 'in_progress' | 'checked_in' | 'scheduled' | 'no_show' | 'cancelled' }) {
  const map = {
    completed: 'bg-emerald-500',
    in_progress: 'bg-blue-500 animate-pulse',
    checked_in: 'bg-teal-500',
    scheduled: 'bg-gray-300',
    no_show: 'bg-red-500',
    cancelled: 'bg-gray-400',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status]}`} />;
}

function StatusLabel({ status }: { status: 'completed' | 'in_progress' | 'checked_in' | 'scheduled' | 'no_show' | 'cancelled' }) {
  const map: Record<string, [string, string]> = {
    completed: ['Completed', 'text-emerald-600'],
    in_progress: ['In Progress', 'text-blue-600'],
    checked_in: ['Checked In', 'text-teal-600'],
    scheduled: ['Scheduled', 'text-gray-500'],
    no_show: ['No Show', 'text-red-600'],
    cancelled: ['Cancelled', 'text-gray-500'],
  };
  const [label, color] = map[status];
  return <span className={`text-xs font-medium ${color}`}>{label}</span>;
}

function TrendChip({ value, suffix = '%', invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0;
  if (value > 0) return <span className={`flex items-center text-xs ${positive ? 'text-emerald-500' : 'text-red-500'}`}><ArrowUpRight className="h-3 w-3" />+{value}{suffix}</span>;
  if (value < 0) return <span className={`flex items-center text-xs ${positive ? 'text-emerald-500' : 'text-red-500'}`}><ArrowDownRight className="h-3 w-3" />{value}{suffix}</span>;
  return <span className="flex items-center text-xs text-gray-400"><Minus className="h-3 w-3" />0{suffix}</span>;
}

const PROVIDERS = [
  { id: 'p1', name: 'Dr. Sarah Patel', role: 'Physiotherapist', scheduled: 14, completed: 9, open: 1, utilization: 93, present: true, cred: true },
  { id: 'p2', name: 'Dr. Raj Singh', role: 'Physiotherapist', scheduled: 12, completed: 7, open: 4, utilization: 75, present: true, cred: true },
  { id: 'p3', name: 'Marcus Wong', role: 'Kinesiologist', scheduled: 10, completed: 6, open: 2, utilization: 83, present: true, cred: true },
  { id: 'p4', name: 'Claire Dubois', role: 'RMT', scheduled: 8, completed: 5, open: 0, utilization: 100, present: true, cred: false },
  { id: 'p5', name: 'James Thornton', role: 'Physiotherapist', scheduled: 0, completed: 0, open: 0, utilization: 0, present: false, cred: true },
];

type ApptStatus = 'completed' | 'in_progress' | 'checked_in' | 'scheduled' | 'no_show' | 'cancelled';

const APPOINTMENTS: Array<{
  id: string; time: string; patient: string; service: string;
  provider: string; providerId: string; status: ApptStatus;
  isNew: boolean; hasInsurance: boolean; room: string; duration: number;
}> = [
  { id: 'a1', time: '08:00', patient: 'Sarah Johnson', service: 'PT Follow-up', provider: 'Dr. Patel', providerId: 'p1', status: 'completed', isNew: false, hasInsurance: true, room: 'Rm 2', duration: 30 },
  { id: 'a2', time: '08:30', patient: 'Michael Chen', service: 'Initial Assessment', provider: 'Dr. Singh', providerId: 'p2', status: 'completed', isNew: true, hasInsurance: true, room: 'Rm 4', duration: 60 },
  { id: 'a3', time: '09:00', patient: 'Emma Wilson', service: 'Shockwave Therapy', provider: 'Dr. Patel', providerId: 'p1', status: 'completed', isNew: false, hasInsurance: false, room: 'Rm 2', duration: 30 },
  { id: 'a4', time: '09:30', patient: 'David Park', service: 'PT Follow-up', provider: 'Marcus Wong', providerId: 'p3', status: 'completed', isNew: false, hasInsurance: true, room: 'Gym', duration: 45 },
  { id: 'a5', time: '10:00', patient: 'Lisa Thompson', service: 'RMT 60min', provider: 'Claire Dubois', providerId: 'p4', status: 'no_show', isNew: false, hasInsurance: true, room: 'Rm 6', duration: 60 },
  { id: 'a6', time: '10:30', patient: 'Priya Sharma', service: 'PT Follow-up', provider: 'Dr. Patel', providerId: 'p1', status: 'in_progress', isNew: false, hasInsurance: true, room: 'Rm 2', duration: 30 },
  { id: 'a7', time: '10:45', patient: 'Tyler Brown', service: 'Initial Assessment', provider: 'Dr. Singh', providerId: 'p2', status: 'checked_in', isNew: true, hasInsurance: true, room: 'Rm 4', duration: 60 },
  { id: 'a8', time: '11:00', patient: 'Amanda Foster', service: 'Kinesiology', provider: 'Marcus Wong', providerId: 'p3', status: 'scheduled', isNew: false, hasInsurance: false, room: 'Gym', duration: 45 },
  { id: 'a9', time: '11:00', patient: 'Carlos Reyes', service: 'RMT 30min', provider: 'Claire Dubois', providerId: 'p4', status: 'scheduled', isNew: false, hasInsurance: true, room: 'Rm 6', duration: 30 },
  { id: 'a10', time: '11:30', patient: 'Nina Kowalski', service: 'PT Follow-up', provider: 'Dr. Patel', providerId: 'p1', status: 'scheduled', isNew: false, hasInsurance: true, room: 'Rm 2', duration: 30 },
  { id: 'a11', time: '11:30', patient: 'OPEN SLOT', service: '—', provider: 'Dr. Singh', providerId: 'p2', status: 'scheduled', isNew: false, hasInsurance: false, room: 'Rm 4', duration: 60 },
  { id: 'a12', time: '12:00', patient: 'Owen Clarke', service: 'PT Assessment', provider: 'Dr. Singh', providerId: 'p2', status: 'scheduled', isNew: true, hasInsurance: true, room: 'Rm 4', duration: 60 },
  { id: 'a13', time: '13:00', patient: 'Rachel Kim', service: 'PT Follow-up', provider: 'Dr. Patel', providerId: 'p1', status: 'scheduled', isNew: false, hasInsurance: true, room: 'Rm 2', duration: 30 },
  { id: 'a14', time: '14:00', patient: 'OPEN SLOT', service: '—', provider: 'Dr. Singh', providerId: 'p2', status: 'scheduled', isNew: false, hasInsurance: false, room: 'Rm 4', duration: 30 },
  { id: 'a15', time: '14:30', patient: 'Frank Martinez', service: 'Kinesiology', provider: 'Marcus Wong', providerId: 'p3', status: 'scheduled', isNew: false, hasInsurance: true, room: 'Gym', duration: 45 },
];

const ALERTS = [
  { id: 'al1', severity: 'critical', title: 'Credential renewal overdue — Claire Dubois (RMT)', action: 'Submit renewal immediately; suspend new bookings until cleared', module: 'operations', sub: 'credentials', icon: <BadgeCheck className="h-4 w-4" /> },
  { id: 'al2', severity: 'warning', title: 'Dr. Singh utilization 75% — 4 open slots today', action: 'Book 2 waitlist patients; contact recent inquiries first', module: 'operations', sub: 'schedule', icon: <Activity className="h-4 w-4" /> },
  { id: 'al3', severity: 'warning', title: 'Lisa Thompson no-show — 2nd consecutive appointment', action: 'Call patient; reassess dropout risk; flag to clinician', module: 'operations', sub: 'patients', icon: <UserX className="h-4 w-4" /> },
  { id: 'al4', severity: 'warning', title: '4 unbilled visits from yesterday not yet submitted', action: 'Complete billing in Revenue Cycle before 2:00 PM', module: 'revenue', sub: 'claims', icon: <FileText className="h-4 w-4" /> },
  { id: 'al5', severity: 'info', title: 'Wait time to first visit reached 6 days for new patients', action: 'Open Thursday evening blocks; Dr. Singh has availability', module: 'operations', sub: 'schedule', icon: <Clock className="h-4 w-4" /> },
];

const PATIENTS_AT_RISK = [
  { id: 'pr1', name: 'Lisa Thompson', issue: 'Missed 2 consecutive appointments', plan: '8-session plan (45% complete)', risk: 'dropout', action: 'Call to reschedule', waitDays: 0, sessions: 4, target: 8 },
  { id: 'pr2', name: 'Kevin Moore', issue: 'RTW case — overdue reassessment (Day 28)', plan: 'RTW protocol (60% complete)', risk: 'rtwDelay', action: 'Book reassessment ASAP', waitDays: 4, sessions: 6, target: 10 },
  { id: 'pr3', name: 'Maria Santos', issue: 'Treatment plan incomplete — no discharge scheduled', plan: '12-session plan (100% complete)', risk: 'noPlan', action: 'Schedule discharge / transition to maintenance', waitDays: 0, sessions: 12, target: 12 },
  { id: 'pr4', name: 'Tom Alvarez', issue: 'No show today — missed 2nd visit this month', plan: '6-session plan (33% complete)', risk: 'dropout', action: 'Text then call patient', waitDays: 0, sessions: 2, target: 6 },
];

const REFERRAL_SOURCES = [
  { name: 'Trainer Referrals', pct: 35, trend: 12 },
  { name: 'Physician Referral', pct: 24, trend: -2 },
  { name: 'Google / Digital', pct: 21, trend: 8 },
  { name: 'Employer Programs', pct: 12, trend: 5 },
  { name: 'Walk-in / Other', pct: 8, trend: -1 },
];

const AI_INSIGHTS = [
  { type: 'opportunity', title: 'Open 2 Thursday evening blocks for Dr. Singh', detail: '7 waitlisted patients + evening demand gap detected. Estimated uplift: +$1,800/week.', impact: '+$1,800/wk' },
  { type: 'recommendation', title: 'Trainer referrals up 21% after last outreach — repeat campaign', detail: 'Three trainers at Active Life Gym sent 8 referrals this week. Schedule a follow-up lunch-and-learn.', impact: '+10 pts/mo' },
  { type: 'risk', title: '2 patients showing early dropout signals', detail: 'Lisa Thompson and Tom Alvarez match dropout pattern (>1 missed appt in first 4 sessions). Proactive outreach reduces dropout 60%.', impact: 'Retain $3,200' },
  { type: 'opportunity', title: 'RMT morning slots 100% fill rate — add 1 more morning block', detail: 'Claire Dubois morning sessions fully booked 4 of last 5 days. Opening one additional block captures existing demand.', impact: '+$480/wk' },
];

interface Props {
  onNavigate: (module: string, subModule: string) => void;
}

export function ClinicCommandCenter({ onNavigate }: Props) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [clinicKey, setClinicKey] = useState('south_commons');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedAlert, setExpandedAlert] = useState<Set<string>>(new Set());
  const [expandedPatient, setExpandedPatient] = useState<Set<string>>(new Set());
  const [filterProvider, setFilterProvider] = useState('all');

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const clinic = CLINICS.find(c => c.key === clinicKey) ?? CLINICS[0];

  const completedAppts = APPOINTMENTS.filter(a => a.status === 'completed').length;
  const noShowAppts = APPOINTMENTS.filter(a => a.status === 'no_show').length;
  const totalAppts = APPOINTMENTS.filter(a => a.patient !== 'OPEN SLOT').length;
  const openSlots = APPOINTMENTS.filter(a => a.patient === 'OPEN SLOT').length;
  const critAlerts = ALERTS.filter(a => a.severity === 'critical').length;
  const revenueToday = completedAppts * 180 + 1200;

  const filteredAppts = filterProvider === 'all'
    ? APPOINTMENTS
    : APPOINTMENTS.filter(a => a.providerId === filterProvider);

  const toggleAlert = (id: string) => setExpandedAlert(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const togglePatient = (id: string) => setExpandedPatient(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const avgUtil = PROVIDERS.filter(p => p.present).reduce((s, p) => s + p.utilization, 0) / PROVIDERS.filter(p => p.present).length;
  const noShowRate = totalAppts > 0 ? Math.round(noShowAppts / totalAppts * 100) : 0;

  return (
    <div className="space-y-0 -mx-6 -mt-2">
      {/* Zone 1 — Clinic Health Bar */}
      <div className="bg-gray-900 text-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2 font-semibold text-gray-300 mr-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            Clinic Ops
          </div>
          <select
            value={clinicKey}
            onChange={e => setClinicKey(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none"
          >
            {CLINICS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <div className="w-px h-4 bg-gray-700 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Scheduled</span><span className="font-bold text-white">{totalAppts}</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Completed</span><span className="font-bold text-emerald-400">{completedAppts}</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Util.</span><span className={`font-bold ${avgUtil >= 85 ? 'text-emerald-400' : avgUtil >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{avgUtil.toFixed(0)}%</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">No-Show</span><span className={`font-bold ${noShowRate <= 5 ? 'text-emerald-400' : noShowRate <= 10 ? 'text-amber-400' : 'text-red-400'}`}>{noShowRate}%</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Rev Today</span><span className="font-bold text-emerald-400">{fmt(revenueToday)}</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Open Slots</span><span className={`font-bold ${openSlots > 3 ? 'text-amber-400' : 'text-white'}`}>{openSlots}</span></span>
          {critAlerts > 0 && (
            <div className="flex items-center gap-1.5 bg-red-900/60 px-2.5 py-1 rounded-full">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="font-bold text-red-300 text-xs">{critAlerts} Critical</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {currentTime.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}
            <button className="text-gray-500 hover:text-gray-300"><RefreshCw className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="px-6 pt-5 space-y-5 pb-8">
        {/* Header + filters */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinic Command Center</h1>
            <p className="text-sm text-gray-500 mt-0.5">{clinic.label} · {new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="all">All Providers</option>
              {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
            <button onClick={() => onNavigate('operations', 'schedule')} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5">
              <Plus className="h-4 w-4" />Add Appointment
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['overview', 'schedule', 'staffing', 'revenue', 'growth', 'patients'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {t}
              {t === 'patients' && PATIENTS_AT_RISK.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">{PATIENTS_AT_RISK.length}</span>}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ──────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Rev Today', value: fmt(revenueToday), sub: 'Target: $8.2K', trend: -11, color: 'from-blue-600 to-blue-700', icon: <DollarSign className="h-5 w-5 opacity-70" />, invert: false },
                { label: 'Utilization', value: `${avgUtil.toFixed(0)}%`, sub: 'Target: 85%', trend: -3, color: 'from-amber-600 to-amber-700', icon: <Activity className="h-5 w-5 opacity-70" />, invert: false },
                { label: 'Schedule Fill', value: `${Math.round((totalAppts / (totalAppts + openSlots)) * 100)}%`, sub: `${openSlots} open slots`, trend: -2, color: 'from-teal-600 to-teal-700', icon: <Calendar className="h-5 w-5 opacity-70" />, invert: false },
                { label: 'No-Show', value: `${noShowRate}%`, sub: 'Target: <8%', trend: noShowRate - 8, color: noShowRate > 10 ? 'from-red-600 to-red-700' : 'from-orange-600 to-orange-700', icon: <UserX className="h-5 w-5 opacity-70" />, invert: true },
                { label: 'AR Balance', value: '$64.2K', sub: '4 unbilled visits', trend: 4.1, color: 'from-rose-600 to-rose-700', icon: <FileText className="h-5 w-5 opacity-70" />, invert: true },
                { label: 'New Patients', value: '42', sub: 'Last 7 days', trend: 12, color: 'from-sky-600 to-sky-700', icon: <UserPlus className="h-5 w-5 opacity-70" />, invert: false },
              ].map((kpi, i) => (
                <button key={i} onClick={() => setTab(i < 3 ? 'schedule' : i < 5 ? 'revenue' : 'growth')} className={`bg-gradient-to-br ${kpi.color} rounded-xl p-4 text-white text-left hover:opacity-95 transition-opacity`}>
                  <div className="flex items-center justify-between mb-2">
                    {kpi.icon}
                    <TrendChip value={kpi.trend} invert={kpi.invert} />
                  </div>
                  <div className="text-2xl font-bold leading-none mb-1">{kpi.value}</div>
                  <div className="text-xs opacity-70">{kpi.label}</div>
                  <div className="text-xs opacity-50 mt-0.5">{kpi.sub}</div>
                </button>
              ))}
            </div>

            {/* Schedule summary + Alerts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Provider grid */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <h2 className="font-semibold text-gray-900">Today's Schedule</h2>
                  </div>
                  <button onClick={() => setTab('schedule')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">Full Schedule <ChevronRight className="h-4 w-4" /></button>
                </div>
                {/* AI scheduling insight */}
                <div className="mx-4 mt-3 mb-2 flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 text-xs">
                  <Brain className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-800">AI: Move 2 patients from Dr. Singh to Dr. Patel to increase utilization by 11%. Dr. Patel has 09:30 and 13:30 available.</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Provider</th>
                        <th className="px-4 py-3 text-right">Scheduled</th>
                        <th className="px-4 py-3 text-right">Done</th>
                        <th className="px-4 py-3 text-right">Open</th>
                        <th className="px-4 py-3 text-right">Util.</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {PROVIDERS.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 text-sm">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.role}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">{p.present ? p.scheduled : '—'}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-medium">{p.present ? p.completed : '—'}</td>
                          <td className={`px-4 py-3 text-right font-medium ${!p.present ? 'text-gray-400' : p.open > 2 ? 'text-amber-600' : p.open > 0 ? 'text-gray-600' : 'text-emerald-600'}`}>{p.present ? p.open : '—'}</td>
                          <td className="px-4 py-3 text-right">
                            {p.present ? (
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${p.utilization >= 85 ? 'bg-emerald-500' : p.utilization >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p.utilization}%` }} />
                                </div>
                                <span className={`text-xs font-medium ${p.utilization >= 85 ? 'text-emerald-600' : p.utilization >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{p.utilization}%</span>
                              </div>
                            ) : <span className="text-xs text-gray-400">Absent</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!p.cred && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1 justify-end"><BadgeCheck className="h-3 w-3" />Cred!</span>}
                            {!p.present && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Absent</span>}
                            {p.present && p.cred && <span className="text-xs text-emerald-500">Active</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Operational Alerts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h2 className="font-semibold text-gray-900">Alerts</h2>
                  </div>
                  {critAlerts > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">{critAlerts} critical</span>}
                </div>
                <div className="divide-y divide-gray-50">
                  {ALERTS.map(al => (
                    <div key={al.id} className={`border-l-4 ${al.severity === 'critical' ? 'border-red-500' : al.severity === 'warning' ? 'border-amber-400' : 'border-blue-400'}`}>
                      <button onClick={() => toggleAlert(al.id)} className="w-full px-4 py-3 text-left flex items-start justify-between gap-2 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className={`mt-0.5 flex-shrink-0 ${al.severity === 'critical' ? 'text-red-500' : al.severity === 'warning' ? 'text-amber-500' : 'text-blue-400'}`}>{al.icon}</span>
                          <p className="text-xs text-gray-800 leading-snug">{al.title}</p>
                        </div>
                        {expandedAlert.has(al.id) ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />}
                      </button>
                      {expandedAlert.has(al.id) && (
                        <div className="px-4 pb-3 ml-6 space-y-1.5">
                          <p className="text-xs text-gray-600">{al.action}</p>
                          <button onClick={() => onNavigate(al.module, al.sub)} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline">Take Action <ChevronRight className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenue + Growth row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-gray-400" /><h2 className="font-semibold text-gray-900">Revenue Cycle</h2></div>
                  <button onClick={() => setTab('revenue')} className="text-sm text-blue-600 hover:underline">Details</button>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Claims Today', value: '28', ok: true },
                    { label: 'Rejections', value: '3', ok: false },
                    { label: 'AR Balance', value: '$64.2K', ok: null },
                    { label: 'Payments Today', value: '$8,400', ok: true },
                    { label: 'Unbilled Visits', value: '4', ok: false },
                    { label: 'Denial Rate', value: '10.7%', ok: false },
                  ].map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <div className={`text-lg font-bold ${m.ok === true ? 'text-emerald-600' : m.ok === false ? 'text-red-600' : 'text-gray-900'}`}>{m.value}</div>
                      <div className="text-xs text-gray-500">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-gray-400" /><h2 className="font-semibold text-gray-900">Growth & Referrals</h2></div>
                  <button onClick={() => setTab('growth')} className="text-sm text-blue-600 hover:underline">Details</button>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New Patients (7 days)</span>
                    <span className="text-lg font-bold text-gray-900">42 <TrendChip value={12} /></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Inq → Visit Conv.</span>
                    <span className="font-semibold text-gray-900">68%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Google Rating</span>
                    <span className="flex items-center gap-1 font-semibold text-amber-500"><Star className="h-4 w-4" />4.8</span>
                  </div>
                  {REFERRAL_SOURCES.slice(0, 3).map(s => (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{s.name}</span><span className="font-medium text-gray-800">{s.pct}%</span></div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Clinic Insights */}
            <div className="bg-gray-900 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-blue-400" />
                <h2 className="font-semibold">AI Clinic Insights</h2>
                <span className="ml-auto text-xs text-gray-500">Updated just now</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {AI_INSIGHTS.map((ins, i) => (
                  <div key={i} className="bg-white/8 rounded-lg p-3.5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      {ins.type === 'opportunity' && <TrendingUp className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                      {ins.type === 'recommendation' && <Zap className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />}
                      {ins.type === 'risk' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                      <span className={`text-xs font-medium capitalize ${ins.type === 'opportunity' ? 'text-emerald-400' : ins.type === 'risk' ? 'text-amber-400' : 'text-blue-400'}`}>{ins.type}</span>
                    </div>
                    <p className="text-sm font-medium text-white mb-1 leading-snug">{ins.title}</p>
                    <p className="text-xs text-gray-400 mb-2 leading-snug">{ins.detail}</p>
                    <div className="text-xs font-semibold text-gray-300">Impact: {ins.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SCHEDULE TAB ─────────────────────────────────── */}
        {tab === 'schedule' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Visits Scheduled', value: totalAppts, color: 'text-gray-900', icon: <Calendar className="h-5 w-5 text-blue-500" /> },
                { label: 'Completed', value: completedAppts, color: 'text-emerald-600', icon: <CheckCircle className="h-5 w-5 text-emerald-500" /> },
                { label: 'No-Shows', value: noShowAppts, color: 'text-red-600', icon: <UserX className="h-5 w-5 text-red-500" /> },
                { label: 'Open Slots', value: openSlots, color: openSlots > 3 ? 'text-amber-600' : 'text-gray-900', icon: <Plus className="h-5 w-5 text-amber-500" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="mb-2">{m.icon}</div>
                  <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-sm text-gray-600">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Appointment List — Today</h2>
                <div className="flex items-center gap-2">
                  <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1">
                    <option value="all">All Providers</option>
                    {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <button onClick={() => onNavigate('operations', 'schedule')} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                    <Plus className="h-4 w-4" />Add
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Patient</th>
                      <th className="px-4 py-3 text-left">Service</th>
                      <th className="px-4 py-3 text-left">Provider</th>
                      <th className="px-4 py-3 text-left">Room</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Ins.</th>
                      <th className="px-4 py-3 text-center">New</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredAppts.map(a => (
                      <tr key={a.id} className={`hover:bg-gray-50 ${a.patient === 'OPEN SLOT' ? 'bg-amber-50/40' : a.status === 'no_show' ? 'bg-red-50/40' : ''}`}>
                        <td className="px-4 py-3 font-mono text-sm text-gray-700 font-medium">{a.time}</td>
                        <td className="px-4 py-3">
                          {a.patient === 'OPEN SLOT' ? (
                            <button onClick={() => onNavigate('operations', 'schedule')} className="text-amber-600 text-sm font-medium flex items-center gap-1 hover:underline">
                              <Plus className="h-3.5 w-3.5" />Book Slot
                            </button>
                          ) : <span className="text-gray-900 font-medium">{a.patient}</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{a.service}</td>
                        <td className="px-4 py-3 text-gray-700">{a.provider}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{a.room}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <StatusDot status={a.status} />
                            <StatusLabel status={a.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {a.patient !== 'OPEN SLOT' && (a.hasInsurance ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-xs text-gray-400">—</span>)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {a.isNew && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">New</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── STAFFING TAB ─────────────────────────────────── */}
        {tab === 'staffing' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Present Today', value: PROVIDERS.filter(p => p.present).length, of: PROVIDERS.length, color: 'text-gray-900', icon: <Users className="h-5 w-5 text-blue-500" /> },
                { label: 'Absent', value: PROVIDERS.filter(p => !p.present).length, of: null, color: 'text-amber-600', icon: <UserX className="h-5 w-5 text-amber-500" /> },
                { label: 'Cred. Alerts', value: PROVIDERS.filter(p => !p.cred).length, of: null, color: 'text-red-600', icon: <BadgeCheck className="h-5 w-5 text-red-500" /> },
                { label: 'Rooms Active', value: 7, of: 8, color: 'text-gray-900', icon: <Building2 className="h-5 w-5 text-teal-500" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="mb-2">{m.icon}</div>
                  <div className={`text-3xl font-bold ${m.color}`}>{m.value}{m.of !== null ? <span className="text-lg text-gray-400">/{m.of}</span> : ''}</div>
                  <div className="text-sm text-gray-600">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Provider Status — Today</h2>
                <button onClick={() => onNavigate('operations', 'staffing')} className="text-sm text-blue-600 hover:underline">Staffing Module</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Provider</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-center">Present</th>
                      <th className="px-4 py-3 text-right">Scheduled</th>
                      <th className="px-4 py-3 text-right">Done</th>
                      <th className="px-4 py-3 text-right">Open</th>
                      <th className="px-4 py-3 text-right">Util.</th>
                      <th className="px-4 py-3 text-center">Credential</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {PROVIDERS.map(p => (
                      <tr key={p.id} className={`hover:bg-gray-50 ${!p.present ? 'opacity-60' : ''} ${!p.cred ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.role}</td>
                        <td className="px-4 py-3 text-center">
                          {p.present ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> : <UserX className="h-4 w-4 text-red-400 mx-auto" />}
                        </td>
                        <td className="px-4 py-3 text-right">{p.present ? p.scheduled : '—'}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">{p.present ? p.completed : '—'}</td>
                        <td className={`px-4 py-3 text-right ${p.open > 2 ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>{p.present ? p.open : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          {p.present ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${p.utilization >= 85 ? 'bg-emerald-500' : p.utilization >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${p.utilization}%` }} />
                              </div>
                              <span className="text-xs font-medium text-gray-700">{p.utilization}%</span>
                            </div>
                          ) : <span className="text-gray-400 text-xs">Absent</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.cred ? <span className="text-xs text-emerald-600">Valid</span> : <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1 justify-center"><BadgeCheck className="h-3 w-3" />Expired</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Room Utilization</h3>
                {[
                  { room: 'Room 2', provider: 'Dr. Patel', util: 93 },
                  { room: 'Room 4', provider: 'Dr. Singh', util: 75 },
                  { room: 'Room 6', provider: 'Claire Dubois', util: 100 },
                  { room: 'Gym', provider: 'Marcus Wong', util: 83 },
                  { room: 'Room 1', provider: 'Unassigned', util: 40 },
                  { room: 'Room 3', provider: 'Unassigned', util: 20 },
                  { room: 'Room 5', provider: 'Admin / Intake', util: 60 },
                  { room: 'Room 7', provider: 'Available', util: 0 },
                ].map(r => (
                  <div key={r.room} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{r.room}</span>
                      <span className="text-gray-500 text-xs">{r.provider}</span>
                      <span className={`text-xs font-semibold ${r.util >= 80 ? 'text-emerald-600' : r.util >= 50 ? 'text-amber-600' : r.util === 0 ? 'text-gray-400' : 'text-red-500'}`}>{r.util}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${r.util >= 80 ? 'bg-emerald-500' : r.util >= 50 ? 'bg-amber-400' : 'bg-gray-300'}`} style={{ width: `${r.util}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Action Items</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <BadgeCheck className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-red-800">Claire Dubois — credential expired</div>
                      <div className="text-xs text-red-600">Submit RMT renewal immediately. Suspend new bookings after today.</div>
                      <button onClick={() => onNavigate('operations', 'credentials')} className="text-xs text-red-700 font-medium mt-1 hover:underline flex items-center gap-1">Credentials <ArrowRight className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <UserX className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-amber-800">James Thornton absent — reschedule patients</div>
                      <div className="text-xs text-amber-600">3 patients need reassignment or rescheduling</div>
                      <button onClick={() => onNavigate('operations', 'schedule')} className="text-xs text-amber-700 font-medium mt-1 hover:underline flex items-center gap-1">Open Scheduler <ArrowRight className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-blue-800">AI: Open Thu evening blocks for Dr. Singh</div>
                      <div className="text-xs text-blue-600">7 waitlisted patients + 6-day wait time detected</div>
                      <button onClick={() => onNavigate('operations', 'schedule')} className="text-xs text-blue-700 font-medium mt-1 hover:underline flex items-center gap-1">Add Blocks <ArrowRight className="h-3 w-3" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REVENUE TAB ──────────────────────────────────── */}
        {tab === 'revenue' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Claims Today', value: '28', ok: true },
                { label: 'Rejections', value: '3', ok: false },
                { label: 'AR Balance', value: '$64.2K', ok: null },
                { label: 'Payments Today', value: '$8,400', ok: true },
                { label: 'Unbilled Visits', value: '4', ok: false },
                { label: 'Denial Rate', value: '10.7%', ok: false },
              ].map((m, i) => (
                <div key={i} className={`bg-white rounded-xl shadow-sm border p-4 ${m.ok === false ? 'border-red-100' : 'border-gray-100'}`}>
                  <div className={`text-2xl font-bold ${m.ok === true ? 'text-emerald-600' : m.ok === false ? 'text-red-600' : 'text-gray-900'}`}>{m.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Claims Status — Today</h2>
                  <button onClick={() => onNavigate('revenue', 'claims')} className="text-sm text-blue-600 hover:underline">Full Claims View</button>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { payer: 'Alberta Blue Cross', submitted: 12, approved: 11, rejected: 1, amount: '$3,840', rejReason: null },
                    { payer: 'Sunlife', submitted: 9, approved: 7, rejected: 2, amount: '$2,610', rejReason: 'Coding error — 97110' },
                    { payer: 'WCB', submitted: 5, approved: 5, rejected: 0, amount: '$1,950', rejReason: null },
                    { payer: 'Self-Pay', submitted: 2, approved: 2, rejected: 0, amount: '$720', rejReason: null },
                  ].map(c => (
                    <div key={c.payer} className={`p-3 rounded-lg border ${c.rejected > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-800">{c.payer}</span>
                        <span className="text-sm font-semibold text-gray-900">{c.amount}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Submitted: {c.submitted}</span>
                        <span className="text-emerald-600">Approved: {c.approved}</span>
                        {c.rejected > 0 && <span className="text-red-600 font-medium">Rejected: {c.rejected}</span>}
                      </div>
                      {c.rejReason && <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700"><AlertTriangle className="h-3 w-3" />{c.rejReason}</div>}
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-4">
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                    <Brain className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-800">AI: Sunlife rejections increased for visit code 97110. Check therapist coding — 2 affected sessions this week.</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Revenue Performance — MTD</h2>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { label: 'Revenue MTD', value: '$92,400', target: '$96,000', pct: 96 },
                    { label: 'Visits MTD', value: '448', target: '500', pct: 90 },
                    { label: 'Rev / Visit', value: '$206', target: '$192', pct: 107 },
                    { label: 'Rev / Provider', value: '$23.1K', target: '$20K', pct: 116 },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600">{m.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{m.value}</span>
                          <span className="text-xs text-gray-400">/ {m.target}</span>
                          <span className={`text-xs font-medium ${m.pct >= 100 ? 'text-emerald-600' : m.pct >= 90 ? 'text-amber-600' : 'text-red-600'}`}>{m.pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${m.pct >= 100 ? 'bg-emerald-500' : m.pct >= 90 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${Math.min(m.pct, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">AR Days</span>
                      <span className="font-semibold text-amber-600">38 days <span className="text-xs text-gray-400">(target: 32)</span></span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Unbilled Visits Today</span>
                      <span className="font-semibold text-red-600">4 <button onClick={() => onNavigate('revenue', 'claims')} className="text-xs text-red-600 underline ml-1">Submit now</button></span>
                    </div>
                  </div>
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
                { label: 'New Patients (7d)', value: '42', trend: '+12%', icon: <UserPlus className="h-5 w-5 text-blue-500" /> },
                { label: 'Inq → Visit Conv.', value: '68%', trend: '+3pp', icon: <Target className="h-5 w-5 text-teal-500" /> },
                { label: 'Google Rating', value: '4.8', trend: '+0.1', icon: <Star className="h-5 w-5 text-amber-500" /> },
                { label: 'Trainer Referrals', value: '17', trend: '+21%', icon: <Award className="h-5 w-5 text-sky-500" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="mb-2">{m.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{m.value}</div>
                  <div className="text-sm text-gray-600">{m.label}</div>
                  <div className="text-xs text-emerald-500 mt-1">{m.trend} vs last week</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Referral Sources</h3>
                {REFERRAL_SOURCES.map(s => (
                  <div key={s.name} className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{s.pct}%</span>
                        <TrendChip value={s.trend} />
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
                <button onClick={() => onNavigate('growth', 'referral-sources')} className="text-xs text-blue-600 flex items-center gap-1 hover:underline mt-1">Referral Intelligence <ArrowRight className="h-3 w-3" /></button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
                {[
                  { stage: 'Inquiries (7d)', value: 62, pct: 100 },
                  { stage: 'Contacted', value: 58, pct: 94 },
                  { stage: 'Assessment Booked', value: 48, pct: 77 },
                  { stage: 'Visit Completed', value: 42, pct: 68 },
                  { stage: 'Treatment Plan Active', value: 36, pct: 58 },
                ].map((s, i) => (
                  <div key={s.stage} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{s.stage}</span>
                      <span className="font-semibold text-gray-800">{s.value} <span className="text-xs text-gray-400">({s.pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${i === 0 ? 'bg-blue-500' : i < 3 ? 'bg-teal-500' : 'bg-emerald-500'}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Growth Actions</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="text-sm font-medium text-emerald-800">Trainer outreach worked — repeat</div>
                    <div className="text-xs text-emerald-700 mt-0.5">21% referral increase after Active Life Gym visit</div>
                    <button onClick={() => onNavigate('growth', 'trainers')} className="text-xs text-emerald-700 font-medium mt-1 hover:underline flex items-center gap-1">Book Follow-up <ArrowRight className="h-3 w-3" /></button>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-sm font-medium text-blue-800">Google reviews — request from new patients</div>
                    <div className="text-xs text-blue-700 mt-0.5">5 new patients completed sessions this week without review request</div>
                    <button onClick={() => onNavigate('growth', 'reviews')} className="text-xs text-blue-700 font-medium mt-1 hover:underline flex items-center gap-1">Send Requests <ArrowRight className="h-3 w-3" /></button>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="text-sm font-medium text-amber-800">Employer program pitch due — Enerplus</div>
                    <div className="text-xs text-amber-700 mt-0.5">Proposal sent 2 weeks ago. Follow up this week.</div>
                    <button onClick={() => onNavigate('growth', 'employers')} className="text-xs text-amber-700 font-medium mt-1 hover:underline flex items-center gap-1">Employer Programs <ArrowRight className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PATIENTS TAB ─────────────────────────────────── */}
        {tab === 'patients' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'At-Risk Patients', value: PATIENTS_AT_RISK.length, color: 'text-red-600', icon: <AlertTriangle className="h-5 w-5 text-red-500" /> },
                { label: 'Active Cases', value: 84, color: 'text-gray-900', icon: <ClipboardList className="h-5 w-5 text-blue-500" /> },
                { label: 'RTW Cases', value: 6, color: 'text-gray-900', icon: <Activity className="h-5 w-5 text-teal-500" /> },
                { label: 'Plans Overdue', value: 2, color: 'text-amber-600', icon: <FileText className="h-5 w-5 text-amber-500" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="mb-2">{m.icon}</div>
                  <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-sm text-gray-600">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h2 className="font-semibold text-gray-900">Patient Journey — Risk Alerts</h2>
                </div>
                <button onClick={() => onNavigate('clinical', 'cases')} className="text-sm text-blue-600 hover:underline">All Cases</button>
              </div>
              <div className="divide-y divide-gray-50">
                {PATIENTS_AT_RISK.map(p => {
                  const pct = Math.round(p.sessions / p.target * 100);
                  const riskColor = p.risk === 'dropout' ? 'border-red-400' : p.risk === 'rtwDelay' ? 'border-amber-400' : 'border-blue-400';
                  const riskLabel = p.risk === 'dropout' ? 'Dropout Risk' : p.risk === 'rtwDelay' ? 'RTW Delay' : 'Plan Overdue';
                  const riskBg = p.risk === 'dropout' ? 'bg-red-100 text-red-700' : p.risk === 'rtwDelay' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
                  return (
                    <div key={p.id} className={`border-l-4 ${riskColor}`}>
                      <button onClick={() => togglePatient(p.id)} className="w-full px-4 py-3 text-left flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${riskBg}`}>{riskLabel}</span>
                            </div>
                            <p className="text-xs text-gray-500">{p.issue}</p>
                          </div>
                        </div>
                        {expandedPatient.has(p.id) ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                      </button>
                      {expandedPatient.has(p.id) && (
                        <div className="px-4 pb-4 ml-1 space-y-3">
                          <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Treatment Plan Progress</span>
                              <span>{p.sessions}/{p.target} sessions ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 90 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{p.plan}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 flex-1">
                              <div className="text-xs text-gray-500 mb-0.5">Recommended Action</div>
                              <div className="text-sm font-medium text-gray-800">{p.action}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => onNavigate('operations', 'schedule')} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />Reschedule
                            </button>
                            <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" />Call
                            </button>
                            <button className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />Text
                            </button>
                            <button onClick={() => onNavigate('clinical', 'cases')} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />View Case
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Clinical Performance</h2>
                <button onClick={() => onNavigate('clinical', 'assessments')} className="text-sm text-blue-600 hover:underline">Clinical View</button>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Outcome Improvement', value: '84%', target: '85%', ok: false },
                  { label: 'Reassess Compliance', value: '93%', target: '95%', ok: false },
                  { label: 'RTW Success Rate', value: '91%', target: '90%', ok: true },
                  { label: 'Plan Completion', value: '88%', target: '90%', ok: false },
                ].map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${m.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{m.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                    <div className="text-xs text-gray-400">Target: {m.target}</div>
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
