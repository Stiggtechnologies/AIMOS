import { useState, useEffect } from 'react';
import { User, Clock, FileText, Activity, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Brain, TrendingUp, TrendingDown, Dumbbell, ClipboardList, ArrowRight, ChevronRight, ChevronDown, ChevronUp, RefreshCw, Star, Calendar, Minus, ArrowUpRight, ArrowDownRight, BookOpen, Zap, Heart, Target, MessageSquare, X, Send, Plus, CirclePlay as PlayCircle, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EvidenceOverlay } from '../aim-os/EvidenceOverlay';
import { SemanticSearchPanel } from '../aim-os/SemanticSearchPanel';
import { PatientEducationPanel } from '../patient/PatientEducationPanel';

type Tab = 'today' | 'patients' | 'charting' | 'outcomes' | 'evidence';

function TrendChip({ value, suffix = '%', invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0;
  if (value > 0) return <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-emerald-500' : 'text-red-500'}`}><ArrowUpRight className="h-3 w-3" />+{value}{suffix}</span>;
  if (value < 0) return <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-emerald-500' : 'text-red-500'}`}><ArrowDownRight className="h-3 w-3" />{value}{suffix}</span>;
  return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus className="h-3 w-3" />0{suffix}</span>;
}

function PainBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score <= 3 ? 'bg-emerald-500' : score <= 6 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold w-4 text-right ${score <= 3 ? 'text-emerald-600' : score <= 6 ? 'text-amber-600' : 'text-red-600'}`}>{score}</span>
    </div>
  );
}

type PatientFlag = 'reassessment_due' | 'pain_worsening' | 'low_adherence' | 'rtw_deadline' | 'new_patient' | 'plan_complete';

interface SchedulePatient {
  id: string;
  time: string;
  name: string;
  visitType: string;
  visitNum: number;
  totalVisits: number;
  condition: string;
  painScore: number;
  painTrend: number;
  outcomeImprovement: number;
  flags: PatientFlag[];
  notes: string;
  charted: boolean;
}

const CLINICIAN_PATIENTS: SchedulePatient[] = [
  { id: 'cp1', time: '08:00', name: 'John Smith', visitType: 'Treatment', visitNum: 4, totalVisits: 12, condition: 'Lumbar disc herniation', painScore: 5, painTrend: -2, outcomeImprovement: 18, flags: ['reassessment_due'], notes: 'Good progress with McKenzie. Reassessment overdue by 3 days.', charted: true },
  { id: 'cp2', time: '08:45', name: 'Sarah Johnson', visitType: 'Reassessment', visitNum: 8, totalVisits: 12, condition: 'Rotator cuff strain (R)', painScore: 4, painTrend: 1, outcomeImprovement: 31, flags: ['pain_worsening'], notes: 'Pain score increased last 2 visits. Consider manual therapy addition.', charted: false },
  { id: 'cp3', time: '09:30', name: 'Mark Lee', visitType: 'Initial Assessment', visitNum: 1, totalVisits: 1, condition: 'Post-op ACL reconstruction', painScore: 6, painTrend: 0, outcomeImprovement: 0, flags: ['new_patient'], notes: 'New post-op referral from Dr. Chen. Review surgical notes.', charted: false },
  { id: 'cp4', time: '10:15', name: 'David Park', visitType: 'Treatment', visitNum: 6, totalVisits: 10, condition: 'Cervical spondylosis', painScore: 3, painTrend: -3, outcomeImprovement: 44, flags: [], notes: 'Excellent compliance. Nearing treatment completion.', charted: false },
  { id: 'cp5', time: '11:00', name: 'Emma Wilson', visitType: 'Treatment', visitNum: 3, totalVisits: 8, condition: 'RTW — Shoulder impingement', painScore: 5, painTrend: 0, outcomeImprovement: 12, flags: ['rtw_deadline', 'low_adherence'], notes: 'RTW assessment due March 20. Exercise adherence only 55%.', charted: false },
  { id: 'cp6', time: '11:45', name: 'Rachel Kim', visitType: 'Discharge Assessment', visitNum: 12, totalVisits: 12, condition: 'Patellofemoral pain', painScore: 2, painTrend: -5, outcomeImprovement: 62, flags: ['plan_complete'], notes: 'Ready for discharge. Review maintenance program.', charted: false },
  { id: 'cp7', time: '13:00', name: 'Carlos Reyes', visitType: 'Treatment', visitNum: 2, totalVisits: 6, condition: 'Hip flexor strain', painScore: 4, painTrend: -1, outcomeImprovement: 8, flags: [], notes: 'Good range of motion gains. Continue hip mobility program.', charted: false },
  { id: 'cp8', time: '13:45', name: 'Nina Kowalski', visitType: 'Treatment', visitNum: 5, totalVisits: 8, condition: 'Thoracic outlet syndrome', painScore: 5, painTrend: 0, outcomeImprovement: 20, flags: ['low_adherence'], notes: 'Adherence dropped last 2 weeks. Review home program barriers.', charted: false },
];

const ALERT_PATIENTS = [
  { id: 'al1', name: 'Sarah Johnson', issue: 'Pain score increased last 2 visits (+1 each)', type: 'pain_worsening', action: 'Reassess treatment plan; consider adding manual therapy', urgency: 'high' },
  { id: 'al2', name: 'Emma Wilson', issue: 'RTW assessment deadline in 5 days — March 20', type: 'rtw_deadline', action: 'Complete functional capacity evaluation this visit', urgency: 'high' },
  { id: 'al3', name: 'John Smith', issue: 'Reassessment overdue by 3 days', type: 'reassessment_due', action: 'Schedule reassessment today; complete outcome measures', urgency: 'medium' },
  { id: 'al4', name: 'Nina Kowalski', issue: 'Exercise adherence dropped to 40% (was 85%)', type: 'low_adherence', action: 'Discuss barriers; simplify home program; consider app reminder', urgency: 'medium' },
];

const DOC_STATUS = [
  { id: 'd1', patient: 'John Smith', type: 'Visit Note', date: 'Today 08:00', status: 'pending', age: 2.5 },
  { id: 'd2', patient: 'Sarah Johnson', type: 'Reassessment Note', date: 'Yesterday', status: 'unsigned', age: 18 },
  { id: 'd3', patient: 'Carlos Reyes', type: 'Visit Note', date: 'Yesterday', status: 'pending', age: 22 },
  { id: 'd4', patient: 'John Smith', type: 'Outcome Measure (PSFS)', date: 'Due today', status: 'due', age: 0 },
  { id: 'd5', patient: 'Emma Wilson', type: 'RTW Functional Assessment', date: 'Due Mar 20', status: 'due', age: 0 },
];

const PATIENT_OUTCOMES = [
  {
    id: 'po1', name: 'Mark Lee', condition: 'Post-op ACL', visits: [
      { visit: 1, pain: 7, mobility: 30, date: 'Feb 10' },
      { visit: 2, pain: 6, mobility: 42, date: 'Feb 14' },
      { visit: 3, pain: 5, mobility: 55, date: 'Feb 18' },
      { visit: 4, pain: 6, mobility: 58, date: 'Mar 01' },
      { visit: 5, pain: 5, mobility: 65, date: 'Mar 08' },
      { visit: 6, pain: 4, mobility: 72, date: 'Mar 15' },
    ], improvement: 43, adherence: 82, status: 'progressing'
  },
  {
    id: 'po2', name: 'David Park', condition: 'Cervical spondylosis', visits: [
      { visit: 1, pain: 8, mobility: 40, date: 'Feb 01' },
      { visit: 2, pain: 7, mobility: 50, date: 'Feb 07' },
      { visit: 3, pain: 6, mobility: 60, date: 'Feb 14' },
      { visit: 4, pain: 4, mobility: 70, date: 'Feb 21' },
      { visit: 5, pain: 3, mobility: 80, date: 'Mar 07' },
      { visit: 6, pain: 3, mobility: 88, date: 'Mar 14' },
    ], improvement: 44, adherence: 96, status: 'excellent'
  },
  {
    id: 'po3', name: 'Sarah Johnson', condition: 'Rotator cuff strain', visits: [
      { visit: 1, pain: 7, mobility: 50, date: 'Feb 05' },
      { visit: 2, pain: 5, mobility: 58, date: 'Feb 12' },
      { visit: 3, pain: 4, mobility: 65, date: 'Feb 19' },
      { visit: 4, pain: 3, mobility: 72, date: 'Feb 26' },
      { visit: 5, pain: 4, mobility: 70, date: 'Mar 05' },
      { visit: 6, pain: 5, mobility: 68, date: 'Mar 12' },
    ], improvement: 31, adherence: 71, status: 'concerning'
  },
];

const EVIDENCE_PROTOCOLS = [
  {
    condition: 'Lumbar Disc Herniation',
    grade: 'A',
    protocol: ['McKenzie extension exercises (3×10 daily)', 'Core stabilization (progression over 6 wks)', 'Gradual return to loading', 'Avoid prolonged flexion'],
    outcomes: '78% improvement at 8 weeks',
    ref: 'Cochrane 2021 · JOSPT 2023'
  },
  {
    condition: 'Rotator Cuff Strain',
    grade: 'A',
    protocol: ['Pendulum exercises — acute phase', 'Rotator cuff strengthening (IR/ER)', 'Scapular stabilization', 'Gradual overhead loading'],
    outcomes: '82% return to function at 10 weeks',
    ref: 'JOSPT 2022 · BJSM 2023'
  },
  {
    condition: 'Post-op ACL Reconstruction',
    grade: 'A',
    protocol: ['Early ROM — days 1–7', 'Quad activation (NMES if needed)', 'Closed-chain strengthening from week 3', 'Plyometrics from week 12 (if criteria met)'],
    outcomes: '85% return to sport at 9 months',
    ref: 'AOSSM 2023 · BJSM 2022'
  },
  {
    condition: 'Patellofemoral Pain',
    grade: 'B',
    protocol: ['Hip abductor strengthening', 'Quad strengthening — VMO focus', 'Patellar taping (short-term)', 'Load management education'],
    outcomes: '70% pain-free at 12 weeks',
    ref: 'BJSM 2022 · Phys Ther 2023'
  },
];

const AI_CLINICAL_INSIGHTS = [
  { patient: 'Sarah Johnson', type: 'risk', insight: 'Pain score increased 2 consecutive visits — typical recovery trajectory diverging. Consider adding joint mobilization to current protocol.', evidence: 'Patients with rotator cuff strain who plateau at visit 5–6 respond 40% better with manual therapy addition.' },
  { patient: 'Emma Wilson', type: 'adherence', insight: 'Exercise adherence dropped from 85% to 40% in 2 weeks. Common barriers: time, pain with exercise, complexity.', evidence: 'Simplified 3-exercise programs achieve 72% adherence vs 48% for 8+ exercise programs.' },
  { patient: 'Mark Lee', type: 'milestone', insight: 'ACL patient on track for standard recovery timeline. Quad strength ≥80% LSI expected at visit 10 based on current progress.', evidence: 'Current mobility gains (30→72%) align with evidence-based benchmarks for week 5.' },
  { patient: 'David Park', type: 'success', insight: 'Excellent recovery trajectory. Patient nearing discharge criteria. Recommend transition to self-management program in 2 visits.', evidence: 'Patients with cervical spondylosis who reach >85% mobility improvement maintain gains at 6 months in 89% of cases.' },
];

const EXERCISE_PROGRAMS = [
  { id: 'ep1', name: 'Lumbar Core Stabilization', exercises: 6, duration: '20 min', level: 'Beginner', condition: 'Low Back Pain' },
  { id: 'ep2', name: 'Rotator Cuff Strengthening', exercises: 8, duration: '25 min', level: 'Intermediate', condition: 'Shoulder' },
  { id: 'ep3', name: 'ACL Rehab Phase 2', exercises: 10, duration: '35 min', level: 'Intermediate', condition: 'Knee' },
  { id: 'ep4', name: 'Cervical Mobility & Strengthening', exercises: 5, duration: '15 min', level: 'Beginner', condition: 'Neck' },
  { id: 'ep5', name: 'Hip Mobility Circuit', exercises: 7, duration: '20 min', level: 'Beginner', condition: 'Hip' },
];

const CLINICIAN_METRICS = {
  visitsToday: 8,
  visitsWeek: 38,
  utilization: 87,
  avgImprovement: 34,
  completionRate: 88,
  rtwSuccess: 79,
  patientRating: 4.8,
  docsComplete: 91,
};

const PATIENT_TIMELINES: Record<string, Array<{ date: string; event: string; type: 'assessment' | 'treatment' | 'milestone' | 'rtw' | 'discharge' }>> = {
  cp1: [
    { date: 'Feb 10', event: 'Initial Assessment — Lumbar disc herniation', type: 'assessment' },
    { date: 'Feb 14', event: 'Treatment #1 — McKenzie education + exercise', type: 'treatment' },
    { date: 'Feb 18', event: 'Treatment #2 — Core activation progress', type: 'treatment' },
    { date: 'Feb 25', event: 'Treatment #3 — Progressed loading', type: 'treatment' },
    { date: 'Mar 04', event: 'Reassessment overdue ⚠', type: 'milestone' },
    { date: 'Mar 15', event: 'Treatment #4 — Today', type: 'treatment' },
  ],
  cp2: [
    { date: 'Jan 28', event: 'Initial Assessment — Rotator cuff strain (R)', type: 'assessment' },
    { date: 'Feb 04', event: 'Treatment #1 — Pendulum + gentle ROM', type: 'treatment' },
    { date: 'Feb 11', event: 'Treatment #2 — IR/ER strengthening started', type: 'treatment' },
    { date: 'Feb 18', event: 'Treatment #3 — Progressed loading', type: 'treatment' },
    { date: 'Feb 25', event: 'Treatment #4 — Strong progress', type: 'treatment' },
    { date: 'Mar 04', event: 'Treatment #5 — Pain increased', type: 'treatment' },
    { date: 'Mar 11', event: 'Treatment #6 — Pain increased again ⚠', type: 'treatment' },
    { date: 'Mar 15', event: 'Reassessment — Today', type: 'assessment' },
  ],
};

const FLAG_CONFIG: Record<PatientFlag, { label: string; color: string; bg: string }> = {
  reassessment_due: { label: 'Reassessment Due', color: 'text-amber-700', bg: 'bg-amber-100' },
  pain_worsening: { label: 'Pain Worsening', color: 'text-red-700', bg: 'bg-red-100' },
  low_adherence: { label: 'Low Adherence', color: 'text-orange-700', bg: 'bg-orange-100' },
  rtw_deadline: { label: 'RTW Deadline', color: 'text-red-700', bg: 'bg-red-100' },
  new_patient: { label: 'New Patient', color: 'text-blue-700', bg: 'bg-blue-100' },
  plan_complete: { label: 'Plan Complete', color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

interface Props {
  onNavigate: (module: string, subModule: string) => void;
}

export function ClinicianCommandCenter({ onNavigate }: Props) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('today');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedAlert, setExpandedAlert] = useState<Set<string>>(new Set());
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [selectedPatientForEvidence, setSelectedPatientForEvidence] = useState<string>('cp1');
  const [expandedInsight, setExpandedInsight] = useState<Set<number>>(new Set());
  const [selectedProtocol, setSelectedProtocol] = useState<number | null>(null);
  const [assigningExercise, setAssigningExercise] = useState<string | null>(null);
  const [chartingPatient, setChartingPatient] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const completedVisits = CLINICIAN_PATIENTS.filter(p => p.charted).length;
  const pendingDocs = DOC_STATUS.filter(d => d.status === 'pending' || d.status === 'unsigned').length;
  const urgentAlerts = ALERT_PATIENTS.filter(a => a.urgency === 'high').length;
  const nextPatient = CLINICIAN_PATIENTS.find(p => !p.charted);

  const toggleAlert = (id: string) => setExpandedAlert(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleInsight = (i: number) => setExpandedInsight(prev => {
    const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n;
  });

  const selectedPatient = CLINICIAN_PATIENTS.find(p => p.id === expandedPatient);
  const patientProfile = { condition: selectedPatient?.condition ?? 'Lumbar disc herniation', age: 42, occupation: 'Office worker', flags: [] };

  return (
    <div className="space-y-0 -mx-6 -mt-2">
      {/* Clinician Status Bar */}
      <div className="bg-gray-900 text-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2 font-semibold text-gray-300">
            <User className="h-4 w-4 text-teal-400" />
            Clinician
          </div>
          <div className="w-px h-4 bg-gray-700 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Patients Today</span><span className="font-bold text-white">{CLINICIAN_PATIENTS.length}</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Charted</span><span className="font-bold text-emerald-400">{completedVisits}</span></span>
          <span className="flex items-center gap-1.5 text-xs"><span className="text-gray-400">Utilization</span><span className="font-bold text-amber-400">{CLINICIAN_METRICS.utilization}%</span></span>
          {urgentAlerts > 0 && (
            <div className="flex items-center gap-1.5 bg-red-900/60 px-2.5 py-1 rounded-full">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-bold text-red-300">{urgentAlerts} Urgent</span>
            </div>
          )}
          {pendingDocs > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-900/60 px-2.5 py-1 rounded-full">
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">{pendingDocs} Docs Pending</span>
            </div>
          )}
          {nextPatient && (
            <div className="flex items-center gap-1.5 bg-blue-900/60 px-2.5 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-bold text-blue-300">Next: {nextPatient.name} at {nextPatient.time}</span>
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
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinician Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile?.full_name ?? 'Physiotherapist'} · {new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => onNavigate('clinical', 'charting')} className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1.5">
              <FileText className="h-4 w-4" />Quick Chart
            </button>
            <button onClick={() => onNavigate('clinical', 'exercises')} className="px-3 py-1.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <Dumbbell className="h-4 w-4" />Assign Exercise
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {(['today', 'patients', 'charting', 'outcomes', 'evidence'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              {t}
              {t === 'charting' && pendingDocs > 0 && <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">{pendingDocs}</span>}
              {t === 'today' && urgentAlerts > 0 && <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">{urgentAlerts}</span>}
            </button>
          ))}
        </div>

        {/* ── TODAY TAB ─────────────────────────────────────── */}
        {tab === 'today' && (
          <div className="space-y-5">
            {/* Productivity KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Visits Today', value: CLINICIAN_PATIENTS.length, sub: `${completedVisits} charted`, icon: <Calendar className="h-5 w-5 text-teal-500" />, color: 'text-gray-900' },
                { label: 'Utilization', value: `${CLINICIAN_METRICS.utilization}%`, sub: 'Target: 85%', icon: <Activity className="h-5 w-5 text-amber-500" />, color: 'text-amber-600' },
                { label: 'Avg Improvement', value: `${CLINICIAN_METRICS.avgImprovement}%`, sub: 'All active patients', icon: <TrendingUp className="h-5 w-5 text-emerald-500" />, color: 'text-emerald-600' },
                { label: 'Patient Rating', value: CLINICIAN_METRICS.patientRating.toFixed(1), sub: 'Last 30 days', icon: <Star className="h-5 w-5 text-amber-400" />, color: 'text-amber-500' },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">{m.icon}<span className="text-xs text-gray-400">{m.sub}</span></div>
                  <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Patient Alerts */}
            {ALERT_PATIENTS.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h2 className="font-semibold text-gray-900">Patient Alerts — Action Required</h2>
                  </div>
                  <span className="text-xs text-gray-500">{ALERT_PATIENTS.length} alerts</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {ALERT_PATIENTS.map(al => (
                    <div key={al.id} className={`border-l-4 ${al.urgency === 'high' ? 'border-red-500' : 'border-amber-400'}`}>
                      <button onClick={() => toggleAlert(al.id)} className="w-full px-4 py-3 text-left flex items-start justify-between gap-2 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-900">{al.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${al.urgency === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {al.urgency === 'high' ? 'Urgent' : 'Attention'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{al.issue}</p>
                        </div>
                        {expandedAlert.has(al.id) ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                      </button>
                      {expandedAlert.has(al.id) && (
                        <div className="px-4 pb-3 ml-1 space-y-2">
                          <div className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2.5">
                            <span className="font-medium text-gray-900">Recommended: </span>{al.action}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setChartingPatient(al.id); setTab('charting'); }} className="text-xs px-2.5 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" />Chart Now
                            </button>
                            <button onClick={() => setTab('evidence')} className="text-xs px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />View Evidence
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Today's Patients</h2>
                </div>
                <span className="text-xs text-gray-500">{CLINICIAN_PATIENTS.length} appointments</span>
              </div>
              <div className="divide-y divide-gray-50">
                {CLINICIAN_PATIENTS.map(p => (
                  <div key={p.id}>
                    <button
                      onClick={() => setExpandedPatient(expandedPatient === p.id ? null : p.id)}
                      className={`w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-colors ${p.flags.includes('pain_worsening') || p.flags.includes('rtw_deadline') ? 'bg-red-50/20' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 text-center flex-shrink-0">
                          <div className="text-sm font-bold text-gray-700 font-mono">{p.time}</div>
                          {p.charted && <div className="text-xs text-emerald-500 flex items-center justify-center gap-0.5 mt-0.5"><CheckCircle className="h-3 w-3" />Charted</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                            <span className="text-xs text-gray-500">· {p.visitType}</span>
                            {p.visitNum > 1 && <span className="text-xs text-gray-400">#{p.visitNum}/{p.totalVisits}</span>}
                            {p.flags.map(f => (
                              <span key={f} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${FLAG_CONFIG[f].bg} ${FLAG_CONFIG[f].color}`}>
                                {FLAG_CONFIG[f].label}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{p.condition}</span>
                            {p.visitNum > 1 && (
                              <span className="flex items-center gap-1">
                                Pain: <PainBar score={p.painScore} />
                                <TrendChip value={p.painTrend} invert={true} />
                              </span>
                            )}
                            {p.outcomeImprovement > 0 && (
                              <span className="text-emerald-600 font-medium">+{p.outcomeImprovement}% outcomes</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {expandedPatient === p.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>
                    </button>

                    {expandedPatient === p.id && (
                      <div className="px-4 pb-4 ml-17 bg-gray-50/60 border-t border-gray-100 space-y-3">
                        <p className="text-xs text-gray-600 mt-3 bg-white rounded-lg p-3 border border-gray-100">{p.notes}</p>

                        {/* Progress timeline mini */}
                        {PATIENT_TIMELINES[p.id] && (
                          <div>
                            <button onClick={() => setShowTimeline(showTimeline === p.id ? null : p.id)} className="text-xs text-blue-600 font-medium flex items-center gap-1 mb-2 hover:underline">
                              <Calendar className="h-3.5 w-3.5" />Patient Timeline
                              {showTimeline === p.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            {showTimeline === p.id && (
                              <div className="relative pl-4 space-y-2 border-l-2 border-gray-200 ml-2">
                                {PATIENT_TIMELINES[p.id].map((ev, i) => (
                                  <div key={i} className="relative">
                                    <div className={`absolute -left-[1.3rem] w-2.5 h-2.5 rounded-full mt-0.5 ${ev.type === 'assessment' ? 'bg-blue-500' : ev.type === 'milestone' ? 'bg-amber-400' : ev.type === 'discharge' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                    <div className="text-xs text-gray-500 font-mono">{ev.date}</div>
                                    <div className="text-xs text-gray-800">{ev.event}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => onNavigate('clinical', 'charting')} className="text-xs px-2.5 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />Chart Visit
                          </button>
                          <button onClick={() => { setSelectedPatientForEvidence(p.id); setTab('evidence'); }} className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-white flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />Evidence
                          </button>
                          <button onClick={() => { setAssigningExercise(p.id); setTab('patients'); }} className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-white flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5" />Exercises
                          </button>
                          <button onClick={() => setTab('outcomes')} className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-white flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" />Outcomes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Clinical Insights */}
            <div className="bg-gray-900 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-teal-400" />
                <h2 className="font-semibold">AI Clinical Insights</h2>
                <span className="ml-auto text-xs text-gray-500">Updated this morning</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_CLINICAL_INSIGHTS.map((ins, i) => (
                  <button key={i} onClick={() => toggleInsight(i)} className="bg-white/8 rounded-lg p-3.5 border border-white/10 text-left hover:bg-white/12 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {ins.type === 'risk' && <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
                        {ins.type === 'adherence' && <Activity className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                        {ins.type === 'milestone' && <Target className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />}
                        {ins.type === 'success' && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                        <span className="text-xs font-medium text-gray-300">{ins.patient}</span>
                      </div>
                      {expandedInsight.has(i) ? <ChevronUp className="h-3.5 w-3.5 text-gray-500" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
                    </div>
                    <p className="text-sm text-white leading-snug">{ins.insight}</p>
                    {expandedInsight.has(i) && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-gray-400 leading-snug">{ins.evidence}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PATIENTS TAB ─────────────────────────────────── */}
        {tab === 'patients' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Patient list with drill-down */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Active Patients</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {CLINICIAN_PATIENTS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setExpandedPatient(expandedPatient === p.id ? null : p.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm">{p.name}</span>
                            {p.flags.slice(0, 2).map(f => (
                              <span key={f} className={`text-xs px-1.5 py-0.5 rounded-full ${FLAG_CONFIG[f].bg} ${FLAG_CONFIG[f].color}`}>
                                {FLAG_CONFIG[f].label}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500">{p.condition}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>Visit {p.visitNum}/{p.totalVisits}</span>
                            <span>Pain: {p.painScore}/10</span>
                            {p.outcomeImprovement > 0 && <span className="text-emerald-600">+{p.outcomeImprovement}%</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {expandedPatient === p.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>

                      {expandedPatient === p.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2" onClick={e => e.stopPropagation()}>
                          <p className="text-xs text-gray-600">{p.notes}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <button onClick={() => onNavigate('clinical', 'charting')} className="text-xs px-2 py-1 bg-teal-600 text-white rounded flex items-center gap-1">
                              <FileText className="h-3 w-3" />Chart
                            </button>
                            <button onClick={() => setTab('outcomes')} className="text-xs px-2 py-1 border border-gray-200 rounded flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />Outcomes
                            </button>
                            <button onClick={() => { setSelectedPatientForEvidence(p.id); setTab('evidence'); }} className="text-xs px-2 py-1 border border-gray-200 rounded flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />Evidence
                            </button>
                            <button onClick={() => onNavigate('clinical', 'exercises')} className="text-xs px-2 py-1 border border-gray-200 rounded flex items-center gap-1">
                              <Dumbbell className="h-3 w-3" />Exercises
                            </button>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercise Program Assignment */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-gray-400" />
                    <h2 className="font-semibold text-gray-900">Exercise Programs</h2>
                  </div>
                  <button onClick={() => onNavigate('clinical', 'exercises')} className="text-sm text-teal-600 hover:underline">Full Library</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {EXERCISE_PROGRAMS.map(ep => (
                    <div key={ep.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ep.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{ep.condition} · {ep.exercises} exercises · {ep.duration}</div>
                        <span className="text-xs text-gray-400">{ep.level}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button className="text-xs px-2.5 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 flex items-center gap-1">
                          <Send className="h-3 w-3" />Assign
                        </button>
                        <button onClick={() => onNavigate('clinical', 'exercises')} className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <PlayCircle className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100">
                  <button onClick={() => onNavigate('clinical', 'exercises')} className="w-full text-sm text-teal-600 flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
                    <Plus className="h-4 w-4" />Create Custom Program
                  </button>
                </div>
              </div>
            </div>

            {/* Patient Education */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Patient Education</h2>
                </div>
              </div>
              <div className="p-4">
                <PatientEducationPanel
                  patientProfile={{ condition: 'Lumbar disc herniation', age: 42, occupation: 'Office worker', flags: [] }}
                  readingLevel={6}
                  topicTags={['low-back-pain', 'exercise', 'posture']}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── CHARTING TAB ─────────────────────────────────── */}
        {tab === 'charting' && (
          <div className="space-y-5">
            {/* Doc status summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Notes Pending', value: DOC_STATUS.filter(d => d.status === 'pending').length, color: 'text-amber-600', icon: <FileText className="h-5 w-5 text-amber-500" /> },
                { label: 'Unsigned Notes', value: DOC_STATUS.filter(d => d.status === 'unsigned').length, color: 'text-red-600', icon: <FileText className="h-5 w-5 text-red-500" /> },
                { label: 'Items Due', value: DOC_STATUS.filter(d => d.status === 'due').length, color: 'text-orange-600', icon: <ClipboardList className="h-5 w-5 text-orange-500" /> },
                { label: 'Complete Today', value: DOC_STATUS.filter(d => d.status === 'complete').length, color: 'text-emerald-600', icon: <CheckCircle className="h-5 w-5 text-emerald-500" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="mb-2">{m.icon}</div>
                  <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-sm text-gray-600">{m.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Documentation queue */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Documentation Queue</h2>
                  <button onClick={() => onNavigate('clinical', 'charting')} className="text-sm text-teal-600 hover:underline">Full Charting</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {DOC_STATUS.map(doc => (
                    <div key={doc.id} className={`px-4 py-3 flex items-start justify-between gap-3 ${doc.status === 'unsigned' ? 'bg-red-50/30' : doc.status === 'due' ? 'bg-amber-50/30' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-gray-900">{doc.patient}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${doc.status === 'unsigned' ? 'bg-red-100 text-red-700' : doc.status === 'due' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            {doc.status === 'pending' ? 'Pending' : doc.status === 'unsigned' ? 'Unsigned' : 'Due'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{doc.type}</div>
                        <div className="text-xs text-gray-400">{doc.date}{doc.age > 0 ? ` · ${doc.age}h ago` : ''}</div>
                      </div>
                      <button onClick={() => onNavigate('clinical', 'charting')} className="text-xs px-2.5 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1 flex-shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                        {doc.status === 'unsigned' ? 'Sign' : 'Complete'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100">
                  <button onClick={() => onNavigate('clinical', 'charting')} className="w-full text-sm text-teal-600 flex items-center justify-center gap-1.5 py-1.5 border border-dashed border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
                    <Plus className="h-4 w-4" />New Visit Note
                  </button>
                </div>
              </div>

              {/* Today's patients quick chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Quick Chart — Today</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {CLINICIAN_PATIENTS.slice(0, 6).map(p => (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${p.charted ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.time} · {p.visitType}</div>
                        </div>
                      </div>
                      {p.charted ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />Charted</span>
                      ) : (
                        <button onClick={() => onNavigate('clinical', 'charting')} className="text-xs px-2.5 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />Chart
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── OUTCOMES TAB ─────────────────────────────────── */}
        {tab === 'outcomes' && (
          <div className="space-y-5">
            {/* Clinician aggregate KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Avg Improvement', value: `${CLINICIAN_METRICS.avgImprovement}%`, target: '30%', ok: true, icon: <TrendingUp className="h-5 w-5 text-emerald-500" /> },
                { label: 'Plan Completion', value: `${CLINICIAN_METRICS.completionRate}%`, target: '90%', ok: false, icon: <ClipboardList className="h-5 w-5 text-amber-500" /> },
                { label: 'RTW Success', value: `${CLINICIAN_METRICS.rtwSuccess}%`, target: '75%', ok: true, icon: <CheckCircle className="h-5 w-5 text-emerald-500" /> },
                { label: 'Documentation', value: `${CLINICIAN_METRICS.docsComplete}%`, target: '95%', ok: false, icon: <FileText className="h-5 w-5 text-amber-500" /> },
              ].map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">{m.icon}<span className="text-xs text-gray-400">Target: {m.target}</span></div>
                  <div className={`text-2xl font-bold ${m.ok ? 'text-emerald-600' : 'text-amber-600'}`}>{m.value}</div>
                  <div className="text-sm text-gray-600">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Patient outcome cards */}
            {PATIENT_OUTCOMES.map(po => {
              const first = po.visits[0];
              const last = po.visits[po.visits.length - 1];
              const painDelta = first.pain - last.pain;
              const mobilityDelta = last.mobility - first.mobility;
              return (
                <div key={po.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{po.name}</h3>
                      <div className="text-xs text-gray-500">{po.condition}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${po.status === 'excellent' ? 'bg-emerald-100 text-emerald-700' : po.status === 'progressing' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {po.status === 'excellent' ? 'Excellent' : po.status === 'progressing' ? 'Progressing' : 'Concerning'}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`text-2xl font-bold ${painDelta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {painDelta > 0 ? `-${painDelta}` : `+${Math.abs(painDelta)}`}
                        </div>
                        <div className="text-xs text-gray-500">Pain Score Change</div>
                        <div className="text-xs text-gray-400">{first.pain} → {last.pain}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">+{mobilityDelta}%</div>
                        <div className="text-xs text-gray-500">Mobility Improvement</div>
                        <div className="text-xs text-gray-400">{first.mobility}% → {last.mobility}%</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`text-2xl font-bold ${po.adherence >= 80 ? 'text-emerald-600' : po.adherence >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{po.adherence}%</div>
                        <div className="text-xs text-gray-500">Exercise Adherence</div>
                        <div className="text-xs text-gray-400">{po.improvement}% overall</div>
                      </div>
                    </div>

                    {/* Visual pain trend */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-600">Pain Score Trend</div>
                      <div className="flex items-end gap-1 h-16">
                        {po.visits.map((v, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className={`w-full rounded-t transition-all ${v.pain <= 3 ? 'bg-emerald-400' : v.pain <= 6 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ height: `${(v.pain / 10) * 100}%`, minHeight: '4px' }}
                            />
                            <span className="text-xs text-gray-400">{v.visit}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{first.date}</span>
                        <span className="text-gray-500">Visit progression →</span>
                        <span>{last.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── EVIDENCE TAB ─────────────────────────────────── */}
        {tab === 'evidence' && (
          <div className="space-y-5">
            {/* Evidence protocols grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {EVIDENCE_PROTOCOLS.map((ep, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedProtocol(selectedProtocol === i ? null : i)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ep.grade === 'A' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                          Grade {ep.grade}
                        </span>
                        <span className="text-xs text-gray-400">Evidence Level</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{ep.condition}</h3>
                    </div>
                    {selectedProtocol === i ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {ep.protocol.slice(0, selectedProtocol === i ? undefined : 2).map((step, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{j + 1}</span>
                        {step}
                      </div>
                    ))}
                    {selectedProtocol !== i && ep.protocol.length > 2 && (
                      <div className="text-xs text-gray-400">+{ep.protocol.length - 2} more steps</div>
                    )}
                  </div>

                  {selectedProtocol === i && (
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-emerald-700 font-medium">{ep.outcomes}</span>
                      </div>
                      <div className="text-xs text-gray-500 italic">{ep.ref}</div>
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={e => { e.stopPropagation(); onNavigate('clinical', 'exercises'); }} className="text-xs px-2.5 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5" />Add Exercise
                        </button>
                        <button onClick={e => { e.stopPropagation(); onNavigate('clinical', 'charting'); }} className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />Add to Chart
                        </button>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Semantic Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Clinical Knowledge Search</h2>
              </div>
              <div className="p-4">
                <SemanticSearchPanel />
              </div>
            </div>

            {/* Evidence Overlay for selected patient */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Clinical Decision Support</h2>
                </div>
                <select
                  value={selectedPatientForEvidence}
                  onChange={e => setSelectedPatientForEvidence(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white"
                >
                  {CLINICIAN_PATIENTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="p-4">
                <EvidenceOverlay
                  patientProfile={{
                    condition: CLINICIAN_PATIENTS.find(p => p.id === selectedPatientForEvidence)?.condition ?? 'Lumbar disc herniation',
                    age: 42,
                    occupation: 'Office worker',
                    flags: []
                  }}
                  onSelectPathway={(id) => onNavigate('clinical', 'charting')}
                  onSelectEducation={(id) => onNavigate('clinical', 'exercises')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
