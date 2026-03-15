import { useState, useEffect } from 'react';
import { Zap, RefreshCw, ToggleLeft, ToggleRight, CircleCheck as CheckCircle, Circle as XCircle, Clock, CircleAlert as AlertCircle, Filter, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { enterpriseOSService, FhirSubscription, FhirEventLog } from '../../services/enterpriseOSService';

const DEMO_SUBSCRIPTIONS: FhirSubscription[] = [
  {
    id: 'sub1',
    subscription_name: 'AR Days Threshold Alert',
    resource_type: 'Claim',
    event_type: 'threshold_crossed',
    filter_criteria: { metric: 'ar_days', operator: '>', value: 40 },
    action_type: 'notify',
    action_config: { channels: ['slack', 'email'], recipients: ['finance-team'], severity: 'high' },
    is_active: true,
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'sub2',
    subscription_name: 'New Patient Intake → CRM Lead',
    resource_type: 'Patient',
    event_type: 'created',
    filter_criteria: { source: 'booking-portal' },
    action_type: 'create_crm_lead',
    action_config: { pipeline: 'intake', stage: 'new_patient' },
    is_active: true,
    created_at: '2026-01-15T10:05:00Z',
  },
  {
    id: 'sub3',
    subscription_name: 'Claim Denial → Case Escalation',
    resource_type: 'ClaimResponse',
    event_type: 'status_changed',
    filter_criteria: { outcome: 'denied', payer_code: ['BC', 'WSIB'] },
    action_type: 'create_case',
    action_config: { case_type: 'billing_denial', priority: 'high', assign_to: 'billing-team' },
    is_active: true,
    created_at: '2026-01-16T09:00:00Z',
  },
  {
    id: 'sub4',
    subscription_name: 'Episode Completion → Outcome Survey',
    resource_type: 'EpisodeOfCare',
    event_type: 'status_changed',
    filter_criteria: { status: 'finished' },
    action_type: 'send_survey',
    action_config: { survey_type: 'patient_satisfaction', delay_hours: 24 },
    is_active: false,
    created_at: '2026-01-16T11:00:00Z',
  },
  {
    id: 'sub5',
    subscription_name: 'Clinician Schedule Gap Alert',
    resource_type: 'Appointment',
    event_type: 'pattern_detected',
    filter_criteria: { pattern: 'consecutive_gaps', threshold: 3 },
    action_type: 'notify',
    action_config: { channels: ['email'], recipients: ['clinic-manager'], severity: 'medium' },
    is_active: true,
    created_at: '2026-01-17T08:00:00Z',
  },
];

const DEMO_EVENT_LOG: FhirEventLog[] = [
  { id: 'ev1', resource_type: 'Claim', event_type: 'threshold_crossed', payload: { ar_days: 44, clinic: 'AIM Kanata' }, fired_at: '2026-03-15T08:12:00Z', processed: true, error_message: null, retry_count: 0 },
  { id: 'ev2', resource_type: 'Patient', event_type: 'created', payload: { patient_id: 'p-9182', source: 'booking-portal' }, fired_at: '2026-03-15T07:55:00Z', processed: true, error_message: null, retry_count: 0 },
  { id: 'ev3', resource_type: 'ClaimResponse', event_type: 'status_changed', payload: { claim_id: 'CLM-3344', outcome: 'denied', payer: 'Blue Cross' }, fired_at: '2026-03-15T07:40:00Z', processed: true, error_message: null, retry_count: 0 },
  { id: 'ev4', resource_type: 'Appointment', event_type: 'pattern_detected', payload: { clinician: 'Dr. B. Wong', gaps: 4 }, fired_at: '2026-03-14T16:22:00Z', processed: false, error_message: 'Notification service timeout', retry_count: 2 },
  { id: 'ev5', resource_type: 'Claim', event_type: 'threshold_crossed', payload: { ar_days: 41, clinic: 'AIM Barrhaven' }, fired_at: '2026-03-14T14:05:00Z', processed: true, error_message: null, retry_count: 0 },
  { id: 'ev6', resource_type: 'Patient', event_type: 'created', payload: { patient_id: 'p-9185', source: 'referral' }, fired_at: '2026-03-14T11:30:00Z', processed: true, error_message: null, retry_count: 0 },
  { id: 'ev7', resource_type: 'EpisodeOfCare', event_type: 'status_changed', payload: { episode_id: 'ep-887', status: 'finished' }, fired_at: '2026-03-14T10:12:00Z', processed: true, error_message: null, retry_count: 0 },
  { id: 'ev8', resource_type: 'ClaimResponse', event_type: 'status_changed', payload: { claim_id: 'CLM-3299', outcome: 'denied', payer: 'WSIB' }, fired_at: '2026-03-13T15:50:00Z', processed: false, error_message: 'Case creation failed: missing clinic_id', retry_count: 1 },
];

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  created:              { label: 'Created',             color: 'text-emerald-700', bg: 'bg-emerald-50' },
  updated:              { label: 'Updated',             color: 'text-blue-700',    bg: 'bg-blue-50' },
  deleted:              { label: 'Deleted',             color: 'text-red-700',     bg: 'bg-red-50' },
  status_changed:       { label: 'Status Changed',      color: 'text-amber-700',   bg: 'bg-amber-50' },
  threshold_crossed:    { label: 'Threshold Crossed',   color: 'text-orange-700',  bg: 'bg-orange-50' },
  deadline_approaching: { label: 'Deadline Approaching',color: 'text-yellow-700',  bg: 'bg-yellow-50' },
  pattern_detected:     { label: 'Pattern Detected',    color: 'text-teal-700',    bg: 'bg-teal-50' },
};

const ACTION_TYPE_CONFIG: Record<string, { label: string }> = {
  notify:          { label: 'Send Notification' },
  create_case:     { label: 'Create Case' },
  create_crm_lead: { label: 'Create CRM Lead' },
  send_survey:     { label: 'Send Survey' },
  run_workflow:    { label: 'Run Workflow' },
  webhook:         { label: 'Webhook POST' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function EventTypeBadge({ type }: { type: string }) {
  const cfg = EVENT_TYPE_CONFIG[type] ?? { label: type, color: 'text-gray-600', bg: 'bg-gray-50' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>;
}

function SubscriptionCard({ sub, onToggle }: { sub: FhirSubscription; onToggle: (id: string, val: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${sub.is_active ? 'border-gray-100' : 'border-gray-200 opacity-70'}`}>
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${sub.is_active ? 'bg-teal-50' : 'bg-gray-100'}`}>
          <Zap className={`h-4 w-4 ${sub.is_active ? 'text-teal-600' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 leading-tight">{sub.subscription_name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${sub.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {sub.is_active ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
            <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded">{sub.resource_type}</span>
            <EventTypeBadge type={sub.event_type} />
            <span className="text-gray-400">→</span>
            <span className="text-gray-600">{ACTION_TYPE_CONFIG[sub.action_type]?.label ?? sub.action_type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1 text-gray-400 hover:text-gray-700"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onToggle(sub.id, !sub.is_active)}
            className={`p-1 transition-colors ${sub.is_active ? 'text-teal-600 hover:text-teal-800' : 'text-gray-400 hover:text-gray-600'}`}
            title={sub.is_active ? 'Pause subscription' : 'Activate subscription'}
          >
            {sub.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50 px-4 py-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-semibold text-gray-500 uppercase tracking-wide mb-1">Filter Criteria</div>
            <pre className="text-gray-700 text-xs font-mono whitespace-pre-wrap break-all">{JSON.stringify(sub.filter_criteria, null, 2)}</pre>
          </div>
          <div>
            <div className="font-semibold text-gray-500 uppercase tracking-wide mb-1">Action Config</div>
            <pre className="text-gray-700 text-xs font-mono whitespace-pre-wrap break-all">{JSON.stringify(sub.action_config, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function EventLogRow({ event }: { event: FhirEventLog }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-gray-50 last:border-0">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-shrink-0">
          {event.processed
            ? <CheckCircle className="h-4 w-4 text-emerald-500" />
            : event.error_message
              ? <XCircle className="h-4 w-4 text-red-500" />
              : <Clock className="h-4 w-4 text-amber-500" />}
        </div>
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{event.resource_type}</span>
          <EventTypeBadge type={event.event_type} />
          {event.error_message && (
            <span className="text-xs text-red-600 font-medium truncate max-w-xs">{event.error_message}</span>
          )}
          {event.retry_count > 0 && (
            <span className="text-xs text-amber-600">retry ×{event.retry_count}</span>
          )}
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{relativeTime(event.fired_at)}</span>
        <span className="text-gray-300 flex-shrink-0">{expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</span>
      </div>
      {expanded && (
        <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
          <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-all mt-2">{JSON.stringify(event.payload, null, 2)}</pre>
          <div className="text-xs text-gray-400 mt-1">{new Date(event.fired_at).toLocaleString()} · id: {event.id}</div>
        </div>
      )}
    </div>
  );
}

type Tab = 'subscriptions' | 'log';

export function FHIREventBusView() {
  const [tab, setTab] = useState<Tab>('subscriptions');
  const [subs, setSubs] = useState<FhirSubscription[]>(DEMO_SUBSCRIPTIONS);
  const [events, setEvents] = useState<FhirEventLog[]>(DEMO_EVENT_LOG);
  const [loading, setLoading] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        enterpriseOSService.getFhirSubscriptions(),
        enterpriseOSService.getFhirEventLog(50),
      ]);
      setSubs(s.length > 0 ? s : DEMO_SUBSCRIPTIONS);
      setEvents(e.length > 0 ? e : DEMO_EVENT_LOG);
    } catch {
      setSubs(DEMO_SUBSCRIPTIONS);
      setEvents(DEMO_EVENT_LOG);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string, val: boolean) {
    setSubs(prev => prev.map(s => s.id === id ? { ...s, is_active: val } : s));
    try {
      await enterpriseOSService.toggleFhirSubscription(id, val);
    } catch {
      setSubs(prev => prev.map(s => s.id === id ? { ...s, is_active: !val } : s));
    }
  }

  const activeSubs = subs.filter(s => s.is_active).length;
  const processedEvents = events.filter(e => e.processed).length;
  const failedEvents = events.filter(e => !e.processed && e.error_message).length;
  const pendingEvents = events.filter(e => !e.processed && !e.error_message).length;

  const resourceTypes = ['all', ...Array.from(new Set(subs.map(s => s.resource_type)))];

  const filteredSubs = resourceFilter === 'all' ? subs : subs.filter(s => s.resource_type === resourceFilter);
  const filteredEvents = resourceFilter === 'all' ? events : events.filter(e => e.resource_type === resourceFilter);

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'subscriptions', label: 'Subscriptions', count: subs.length },
    { id: 'log', label: 'Event Log', count: events.length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-teal-600" />
          <div>
            <h2 className="font-semibold text-gray-900">FHIR Event Bus</h2>
            <p className="text-xs text-gray-500">Subscription-driven event routing — operational events → actions</p>
          </div>
        </div>
        <button onClick={load} className="p-1.5 text-gray-400 hover:text-gray-700">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="text-2xl font-bold text-gray-900">{activeSubs}</div>
            <Activity className="h-4 w-4 text-teal-500" />
          </div>
          <div className="text-xs text-gray-500">Active Subscriptions</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-2xl font-bold text-emerald-700">{processedEvents}</div>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-xs text-emerald-600">Events Processed</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-2xl font-bold text-amber-700">{pendingEvents}</div>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-xs text-amber-600">Pending</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-2xl font-bold text-red-700">{failedEvents}</div>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-xs text-red-600">Failed / Retrying</div>
        </div>
      </div>

      {/* Filters + Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
              <span className={`text-xs px-1.5 rounded-full ${tab === t.id ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={resourceFilter}
            onChange={e => setResourceFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white"
          >
            {resourceTypes.map(r => (
              <option key={r} value={r}>{r === 'all' ? 'All Resources' : r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'subscriptions' && (
        <div className="space-y-3">
          {filteredSubs.map(sub => (
            <SubscriptionCard key={sub.id} sub={sub} onToggle={handleToggle} />
          ))}
          {filteredSubs.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
              No subscriptions for this resource type.
            </div>
          )}
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-sm text-teal-800">
            <strong>How it works:</strong> Each subscription listens for a specific FHIR resource event (created, updated, threshold_crossed, etc.) and routes it to an action — notification, case creation, CRM update, or survey trigger. Pausing a subscription stops new events from being processed but does not delete history.
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Recent Events</span>
            <span className="text-xs text-gray-400">{filteredEvents.length} events</span>
          </div>
          <div className="divide-y divide-gray-50">
            {filteredEvents.map(ev => (
              <EventLogRow key={ev.id} event={ev} />
            ))}
            {filteredEvents.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">No events for this filter.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
