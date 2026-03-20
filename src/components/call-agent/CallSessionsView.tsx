import { useEffect, useState } from 'react';
import {
  Phone, PhoneIncoming, PhoneOff, Clock, TriangleAlert as AlertTriangle,
  CircleCheck as CheckCircle, Filter, Search, ChevronRight, User, MapPin,
  RefreshCw, TrendingUp, PhoneCall, Voicemail, ArrowUpRight, Zap, X
} from 'lucide-react';
import { aiCallAgentService, CallSession, CallSessionFilters, CallAgentStats, IntentType, RoutingResult } from '../../services/aiCallAgentService';
import { useToast } from '../../hooks/useToast';

interface CallSessionsViewProps {
  onSelectSession: (session: CallSession) => void;
}

export const INTENT_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  physio:          { label: 'Physio',      color: 'text-blue-700',   bg: 'bg-blue-100',   ring: 'ring-blue-200' },
  orthotics:       { label: 'Orthotics',   color: 'text-purple-700', bg: 'bg-purple-100', ring: 'ring-purple-200' },
  wcb:             { label: 'WCB',         color: 'text-amber-700',  bg: 'bg-amber-100',  ring: 'ring-amber-200' },
  mva:             { label: 'MVA',         color: 'text-orange-700', bg: 'bg-orange-100', ring: 'ring-orange-200' },
  employer:        { label: 'Employer',    color: 'text-slate-700',  bg: 'bg-slate-100',  ring: 'ring-slate-200' },
  existing_patient:{ label: 'Existing Pt', color: 'text-teal-700',   bg: 'bg-teal-100',   ring: 'ring-teal-200' },
  unknown:         { label: 'Unknown',     color: 'text-gray-500',   bg: 'bg-gray-100',   ring: 'ring-gray-200' },
  other:           { label: 'Other',       color: 'text-gray-500',   bg: 'bg-gray-100',   ring: 'ring-gray-200' },
};

export const ROUTING_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  booked:              { label: 'Booked',       color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  callback_requested:  { label: 'Callback',     color: 'text-amber-700',  bg: 'bg-amber-100',  icon: PhoneCall },
  transferred:         { label: 'Transferred',  color: 'text-blue-700',   bg: 'bg-blue-100',   icon: ArrowUpRight },
  voicemail:           { label: 'Voicemail',    color: 'text-gray-600',   bg: 'bg-gray-100',   icon: Voicemail },
  incomplete:          { label: 'Incomplete',   color: 'text-red-600',    bg: 'bg-red-50',     icon: PhoneOff },
  lost:                { label: 'Lost',         color: 'text-red-700',    bg: 'bg-red-100',    icon: PhoneOff },
  information_only:    { label: 'Info Only',    color: 'text-gray-600',   bg: 'bg-gray-100',   icon: Phone },
};

const URGENCY_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-emerald-500',
};

export function formatDuration(seconds: number) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function StatCard({ label, value, sub, icon: Icon, accent, bg }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`h-8 w-8 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-50">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-4 bg-gray-100 rounded w-48 flex-1" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-4 bg-gray-100 rounded w-10" />
          <div className="h-4 bg-gray-100 rounded w-8" />
        </div>
      ))}
    </div>
  );
}

function ActiveFilters({ intent, routing, escalation, search, onClear }: {
  intent: string; routing: string; escalation: boolean | null; search: string;
  onClear: (key: string) => void;
}) {
  const chips = [
    intent !== 'all' && { key: 'intent', label: INTENT_CONFIG[intent]?.label ?? intent },
    routing !== 'all' && { key: 'routing', label: ROUTING_CONFIG[routing]?.label ?? routing },
    escalation !== null && { key: 'escalation', label: escalation ? 'Escalations only' : 'No escalation' },
    search && { key: 'search', label: `"${search}"` },
  ].filter(Boolean) as { key: string; label: string }[];

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="text-xs text-gray-400">Active:</span>
      {chips.map(chip => (
        <button
          key={chip.key}
          onClick={() => onClear(chip.key)}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors"
        >
          {chip.label}
          <X className="h-2.5 w-2.5" />
        </button>
      ))}
    </div>
  );
}

export function CallSessionsView({ onSelectSession }: CallSessionsViewProps) {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [stats, setStats] = useState<CallAgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [intentFilter, setIntentFilter] = useState<IntentType | 'all'>('all');
  const [routingFilter, setRoutingFilter] = useState<RoutingResult | 'all'>('all');
  const [escalationFilter, setEscalationFilter] = useState<boolean | null>(null);
  const { error: showError } = useToast();

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const f: CallSessionFilters = {};
      if (intentFilter !== 'all') f.intent_type = intentFilter;
      if (routingFilter !== 'all') f.routing_result = routingFilter;
      if (escalationFilter !== null) f.escalation_required = escalationFilter;

      const [sessionsData, statsData] = await Promise.all([
        aiCallAgentService.getSessions(f, 200),
        aiCallAgentService.getStats(),
      ]);
      setSessions(sessionsData);
      setStats(statsData);
    } catch {
      showError('Failed to load call sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [intentFilter, routingFilter, escalationFilter]);

  const filtered = sessions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.caller_name?.toLowerCase().includes(q) ||
      s.caller_phone?.includes(q) ||
      s.issue_summary?.toLowerCase().includes(q) ||
      s.ai_summary?.toLowerCase().includes(q)
    );
  });

  const clearFilter = (key: string) => {
    if (key === 'intent') setIntentFilter('all');
    if (key === 'routing') setRoutingFilter('all');
    if (key === 'escalation') setEscalationFilter(null);
    if (key === 'search') setSearch('');
  };

  const statsCards = stats ? [
    { label: 'Total Calls', value: stats.total_calls, sub: `${stats.calls_today} today`, icon: Phone, accent: 'text-gray-700', bg: 'bg-gray-100' },
    { label: 'Booked', value: stats.bookings_from_calls, sub: `${stats.call_to_booking_rate}% rate`, icon: CheckCircle, accent: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Callbacks Pending', value: stats.callback_pending, sub: 'Awaiting follow-up', icon: PhoneCall, accent: 'text-amber-700', bg: 'bg-amber-100' },
    { label: 'Escalations', value: stats.escalations, sub: 'Needs staff review', icon: AlertTriangle, accent: 'text-red-700', bg: 'bg-red-100' },
    { label: 'Physio', value: stats.physio_bookings, icon: TrendingUp, accent: 'text-blue-700', bg: 'bg-blue-100' },
    { label: 'Orthotics', value: stats.orthotics_bookings, icon: Zap, accent: 'text-purple-700', bg: 'bg-purple-100' },
    { label: 'WCB / MVA', value: stats.wcb_mva_calls, icon: PhoneIncoming, accent: 'text-amber-700', bg: 'bg-amber-100' },
    { label: 'Employer', value: stats.employer_inquiries, icon: User, accent: 'text-slate-700', bg: 'bg-slate-100' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Call Sessions</h1>
          <p className="text-sm text-gray-400 mt-0.5">AI-managed inbound intake calls — live log and history</p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {loading && !stats
          ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse col-span-1">
              <div className="h-3 bg-gray-100 rounded mb-3 w-16" />
              <div className="h-7 bg-gray-100 rounded w-10" />
            </div>
          ))
          : statsCards.map(card => (
            <div key={card.label} className="col-span-1">
              <StatCard {...card} />
            </div>
          ))
        }
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-52">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search caller, issue, phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <select
              value={intentFilter}
              onChange={e => setIntentFilter(e.target.value as IntentType | 'all')}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="all">All Intents</option>
              <option value="physio">Physio</option>
              <option value="orthotics">Orthotics</option>
              <option value="wcb">WCB</option>
              <option value="mva">MVA</option>
              <option value="employer">Employer</option>
              <option value="existing_patient">Existing Patient</option>
              <option value="unknown">Unknown</option>
            </select>
            <select
              value={routingFilter}
              onChange={e => setRoutingFilter(e.target.value as RoutingResult | 'all')}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="all">All Outcomes</option>
              <option value="booked">Booked</option>
              <option value="callback_requested">Callback</option>
              <option value="transferred">Transferred</option>
              <option value="voicemail">Voicemail</option>
              <option value="incomplete">Incomplete</option>
              <option value="lost">Lost</option>
              <option value="information_only">Info Only</option>
            </select>
            <select
              value={escalationFilter === null ? 'all' : escalationFilter ? 'yes' : 'no'}
              onChange={e => {
                const v = e.target.value;
                setEscalationFilter(v === 'all' ? null : v === 'yes');
              }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="all">All Sessions</option>
              <option value="yes">Escalations Only</option>
              <option value="no">No Escalation</option>
            </select>
          </div>
        </div>
        <ActiveFilters
          intent={intentFilter}
          routing={routingFilter}
          escalation={escalationFilter}
          search={search}
          onClear={clearFilter}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Phone className="h-8 w-8 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-gray-600 font-medium">No call sessions found</p>
              <p className="text-sm text-gray-400 mt-1">
                {search || intentFilter !== 'all' || routingFilter !== 'all' || escalationFilter !== null
                  ? 'Try adjusting your filters'
                  : 'Call sessions will appear here as the AI agent handles incoming calls'}
              </p>
            </div>
            {(search || intentFilter !== 'all' || routingFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setIntentFilter('all'); setRoutingFilter('all'); setEscalationFilter(null); }}
                className="text-sm text-gray-500 underline hover:text-gray-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Caller</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Intent</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Urgency</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Flags</th>
                  <th className="px-4 py-3.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(session => {
                  const intent = INTENT_CONFIG[session.intent_type] || INTENT_CONFIG.unknown;
                  const routing = ROUTING_CONFIG[session.routing_result] || ROUTING_CONFIG.incomplete;
                  const RoutingIcon = routing.icon;
                  const isUrgent = session.urgency_level === 'high';
                  const hasEscalation = session.escalation_required;

                  return (
                    <tr
                      key={session.id}
                      onClick={() => onSelectSession(session)}
                      className={`hover:bg-gray-50/80 cursor-pointer transition-colors group ${
                        hasEscalation ? 'bg-red-50/30' : isUrgent ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm leading-tight">
                              {session.caller_name || 'Unknown Caller'}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">{session.caller_phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${intent.bg} ${intent.color}`}>
                          {intent.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-700 max-w-xs truncate text-sm">
                          {session.issue_summary || session.ai_summary || <span className="text-gray-400">—</span>}
                        </p>
                        {session.assigned_location?.name && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-gray-300" />
                            <span className="text-xs text-gray-400">{session.assigned_location.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${routing.bg} ${routing.color}`}>
                          <RoutingIcon className="h-3 w-3" />
                          {routing.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${URGENCY_DOT[session.urgency_level] || URGENCY_DOT.medium}`} />
                          <span className="text-xs text-gray-600 capitalize">{session.urgency_level}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-600 tabular-nums font-mono">
                          {formatDuration(session.call_duration_seconds)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(session.created_at)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {hasEscalation && (
                            <span title="Escalation Required" className="h-5 w-5 bg-red-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                            </span>
                          )}
                          {session.callback_needed && (
                            <span title="Callback Needed" className="h-5 w-5 bg-amber-100 rounded-full flex items-center justify-center">
                              <PhoneCall className="h-3 w-3 text-amber-600" />
                            </span>
                          )}
                          {session.lead_id && (
                            <span title="Lead Created" className="h-5 w-5 bg-emerald-100 rounded-full flex items-center justify-center">
                              <User className="h-3 w-3 text-emerald-600" />
                            </span>
                          )}
                          {session.appointment_id && (
                            <span title="Appointment Linked" className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-blue-600" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              <span className="font-medium text-gray-600">{filtered.length}</span>
              {filtered.length !== sessions.length && ` of ${sessions.length}`} sessions
            </p>
            <p className="text-xs text-gray-400">
              {sessions.filter(s => s.routing_result === 'booked').length} booked ·{' '}
              {sessions.filter(s => s.escalation_required).length} escalated
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
