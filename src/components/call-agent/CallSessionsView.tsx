import { useEffect, useState } from 'react';
import { Phone, PhoneIncoming, PhoneOff, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Filter, Search, ChevronRight, User, MapPin, RefreshCw, TrendingUp, PhoneCall, Voicemail, ArrowUpRight, Zap } from 'lucide-react';
import { aiCallAgentService, CallSession, CallSessionFilters, CallAgentStats, IntentType, RoutingResult } from '../../services/aiCallAgentService';
import { useToast } from '../../hooks/useToast';

interface CallSessionsViewProps {
  onSelectSession: (session: CallSession) => void;
}

const INTENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  physio:          { label: 'Physio',     color: 'text-blue-700',   bg: 'bg-blue-100' },
  orthotics:       { label: 'Orthotics',  color: 'text-purple-700', bg: 'bg-purple-100' },
  wcb:             { label: 'WCB',        color: 'text-amber-700',  bg: 'bg-amber-100' },
  mva:             { label: 'MVA',        color: 'text-orange-700', bg: 'bg-orange-100' },
  employer:        { label: 'Employer',   color: 'text-slate-700',  bg: 'bg-slate-100' },
  existing_patient:{ label: 'Existing Pt',color: 'text-teal-700',   bg: 'bg-teal-100' },
  unknown:         { label: 'Unknown',    color: 'text-gray-500',   bg: 'bg-gray-100' },
  other:           { label: 'Other',      color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const ROUTING_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  booked:              { label: 'Booked',       color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  callback_requested:  { label: 'Callback',     color: 'text-amber-700',  bg: 'bg-amber-100',  icon: PhoneCall },
  transferred:         { label: 'Transferred',  color: 'text-blue-700',   bg: 'bg-blue-100',   icon: ArrowUpRight },
  voicemail:           { label: 'Voicemail',    color: 'text-gray-600',   bg: 'bg-gray-100',   icon: Voicemail },
  incomplete:          { label: 'Incomplete',   color: 'text-red-600',    bg: 'bg-red-50',     icon: PhoneOff },
  lost:                { label: 'Lost',         color: 'text-red-700',    bg: 'bg-red-100',    icon: PhoneOff },
  information_only:    { label: 'Info Only',    color: 'text-gray-600',   bg: 'bg-gray-100',   icon: Phone },
};

const URGENCY_CONFIG: Record<string, { label: string; dot: string }> = {
  high:   { label: 'High',   dot: 'bg-red-500' },
  medium: { label: 'Medium', dot: 'bg-amber-400' },
  low:    { label: 'Low',    dot: 'bg-green-500' },
};

function formatDuration(seconds: number) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${accent.replace('text-', 'bg-').replace('-700', '-100').replace('-600', '-100')}`}>
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>
      </div>
    </div>
  );
}

export function CallSessionsView({ onSelectSession }: CallSessionsViewProps) {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [stats, setStats] = useState<CallAgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CallSessionFilters>({});
  const [search, setSearch] = useState('');
  const [intentFilter, setIntentFilter] = useState<IntentType | 'all'>('all');
  const [routingFilter, setRoutingFilter] = useState<RoutingResult | 'all'>('all');
  const [escalationFilter, setEscalationFilter] = useState<boolean | null>(null);
  const { error: showError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Sessions</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-managed inbound intake calls — live log and history</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="col-span-2">
            <StatCard label="Total Calls" value={stats.total_calls} sub={`${stats.calls_today} today`} icon={Phone} accent="text-gray-700" />
          </div>
          <div className="col-span-2">
            <StatCard label="Bookings" value={stats.bookings_from_calls} sub={`${stats.call_to_booking_rate}% conversion`} icon={CheckCircle} accent="text-green-600" />
          </div>
          <div className="col-span-2">
            <StatCard label="Callbacks Pending" value={stats.callback_pending} sub="Need follow-up" icon={PhoneCall} accent="text-amber-600" />
          </div>
          <div className="col-span-2">
            <StatCard label="Escalations" value={stats.escalations} sub="Requires staff" icon={AlertTriangle} accent="text-red-600" />
          </div>
          <div className="col-span-2">
            <StatCard label="Physio Bookings" value={stats.physio_bookings} icon={TrendingUp} accent="text-blue-600" />
          </div>
          <div className="col-span-2">
            <StatCard label="Orthotics Bookings" value={stats.orthotics_bookings} icon={Zap} accent="text-purple-600" />
          </div>
          <div className="col-span-2">
            <StatCard label="WCB / MVA Calls" value={stats.wcb_mva_calls} icon={PhoneIncoming} accent="text-amber-700" />
          </div>
          <div className="col-span-2">
            <StatCard label="Employer Inquiries" value={stats.employer_inquiries} icon={User} accent="text-slate-600" />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search caller, issue, phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={intentFilter}
              onChange={e => setIntentFilter(e.target.value as IntentType | 'all')}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Outcomes</option>
              <option value="booked">Booked</option>
              <option value="callback_requested">Callback</option>
              <option value="transferred">Transferred</option>
              <option value="voicemail">Voicemail</option>
              <option value="incomplete">Incomplete</option>
              <option value="lost">Lost</option>
            </select>

            <select
              value={escalationFilter === null ? 'all' : escalationFilter ? 'yes' : 'no'}
              onChange={e => {
                const v = e.target.value;
                setEscalationFilter(v === 'all' ? null : v === 'yes');
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sessions</option>
              <option value="yes">Escalations Only</option>
              <option value="no">No Escalation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Phone className="h-10 w-10 text-gray-300" />
            <p className="text-gray-500 text-sm">No call sessions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Caller</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Intent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Urgency</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Flags</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(session => {
                  const intent = INTENT_CONFIG[session.intent_type] || INTENT_CONFIG.unknown;
                  const routing = ROUTING_CONFIG[session.routing_result] || ROUTING_CONFIG.incomplete;
                  const urgency = URGENCY_CONFIG[session.urgency_level] || URGENCY_CONFIG.medium;
                  const RoutingIcon = routing.icon;

                  return (
                    <tr
                      key={session.id}
                      onClick={() => onSelectSession(session)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{session.caller_name || 'Unknown Caller'}</div>
                        <div className="text-xs text-gray-400">{session.caller_phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${intent.bg} ${intent.color}`}>
                          {intent.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700 max-w-xs truncate">{session.issue_summary || session.ai_summary || '—'}</p>
                        {session.assigned_location?.name && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-400">{session.assigned_location.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${routing.bg} ${routing.color}`}>
                          <RoutingIcon className="h-3 w-3" />
                          {routing.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${urgency.dot}`} />
                          <span className="text-xs text-gray-600">{urgency.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {formatDuration(session.call_duration_seconds)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {timeAgo(session.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {session.escalation_required && (
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
                            <span title="Lead Created" className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="h-3 w-3 text-green-600" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              {filtered.length} session{filtered.length !== 1 ? 's' : ''} shown
              {filtered.length < sessions.length && ` (${sessions.length} total)`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
