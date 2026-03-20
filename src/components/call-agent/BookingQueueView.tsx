import { useEffect, useState } from 'react';
import { PhoneCall, TriangleAlert as AlertTriangle, Building2, User, Clock, MapPin, RefreshCw, ChevronRight, Phone, Check } from 'lucide-react';
import { aiCallAgentService, CallSession } from '../../services/aiCallAgentService';
import { useToast } from '../../hooks/useToast';

interface BookingQueue {
  callbacks: CallSession[];
  escalations: CallSession[];
  employers: CallSession[];
  existingPatients: CallSession[];
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

const INTENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  physio:          { label: 'Physio',     color: 'text-blue-700',   bg: 'bg-blue-100' },
  orthotics:       { label: 'Orthotics',  color: 'text-purple-700', bg: 'bg-purple-100' },
  wcb:             { label: 'WCB',        color: 'text-amber-700',  bg: 'bg-amber-100' },
  mva:             { label: 'MVA',        color: 'text-orange-700', bg: 'bg-orange-100' },
  employer:        { label: 'Employer',   color: 'text-slate-700',  bg: 'bg-slate-100' },
  existing_patient:{ label: 'Existing',   color: 'text-teal-700',   bg: 'bg-teal-100' },
  unknown:         { label: 'Unknown',    color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const URGENCY_CONFIG: Record<string, { dot: string }> = {
  high:   { dot: 'bg-red-500' },
  medium: { dot: 'bg-amber-400' },
  low:    { dot: 'bg-green-500' },
};

interface QueueCardProps {
  session: CallSession;
  onAction?: (session: CallSession) => void;
  actionLabel?: string;
  onSelect: (session: CallSession) => void;
}

function QueueCard({ session, onAction, actionLabel, onSelect }: QueueCardProps) {
  const intent = INTENT_CONFIG[session.intent_type] || INTENT_CONFIG.unknown;
  const urgency = URGENCY_CONFIG[session.urgency_level] || URGENCY_CONFIG.medium;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${urgency.dot}`} />
            <span className="font-semibold text-gray-900 truncate">{session.caller_name || 'Unknown Caller'}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${intent.bg} ${intent.color}`}>
              {intent.label}
            </span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{session.issue_summary || session.ai_summary || '—'}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {session.caller_phone}
            </div>
            {session.assigned_location?.name && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {session.assigned_location.name}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(session.created_at)}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          {onAction && actionLabel && (
            <button
              onClick={() => onAction(session)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Check className="h-3 w-3" />
              {actionLabel}
            </button>
          )}
          <button
            onClick={() => onSelect(session)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface BookingQueueViewProps {
  onSelectSession: (session: CallSession) => void;
}

export function BookingQueueView({ onSelectSession }: BookingQueueViewProps) {
  const [queue, setQueue] = useState<BookingQueue>({ callbacks: [], escalations: [], employers: [], existingPatients: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'callbacks' | 'escalations' | 'employers' | 'existing'>('callbacks');
  const { error: showError, success } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await aiCallAgentService.getBookingQueue();
      setQueue(data);
    } catch {
      showError('Failed to load booking queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleMarkCalledBack = async (session: CallSession) => {
    try {
      await aiCallAgentService.updateSession(session.id, { routing_result: 'transferred', follow_up_sent_at: new Date().toISOString() } as any);
      success('Marked as called back');
      setQueue(prev => ({
        ...prev,
        callbacks: prev.callbacks.filter(c => c.id !== session.id),
      }));
    } catch {
      showError('Failed to update');
    }
  };

  const handleResolveEscalation = async (session: CallSession) => {
    try {
      await aiCallAgentService.updateSession(session.id, { escalation_required: false } as any);
      success('Escalation resolved');
      setQueue(prev => ({
        ...prev,
        escalations: prev.escalations.filter(e => e.id !== session.id),
      }));
    } catch {
      showError('Failed to resolve');
    }
  };

  const tabs = [
    { key: 'callbacks', label: 'Callbacks', count: queue.callbacks.length, icon: PhoneCall, color: 'text-amber-600' },
    { key: 'escalations', label: 'Escalations', count: queue.escalations.length, icon: AlertTriangle, color: 'text-red-600' },
    { key: 'employers', label: 'Employer Inquiries', count: queue.employers.length, icon: Building2, color: 'text-slate-600' },
    { key: 'existing', label: 'Existing Patients', count: queue.existingPatients.length, icon: User, color: 'text-teal-600' },
  ] as const;

  const currentSessions = {
    callbacks: queue.callbacks,
    escalations: queue.escalations,
    employers: queue.employers,
    existing: queue.existingPatients,
  }[activeTab];

  const getActionConfig = () => {
    switch (activeTab) {
      case 'callbacks':
        return { action: handleMarkCalledBack, label: 'Mark Called Back' };
      case 'escalations':
        return { action: handleResolveEscalation, label: 'Resolve' };
      default:
        return undefined;
    }
  };

  const actionConfig = getActionConfig();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pending callbacks, escalations, and follow-up actions</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`bg-white rounded-xl border p-4 text-left transition-all ${
                activeTab === tab.key ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${tab.color}`} />
                <span className="text-xs font-medium text-gray-500">{tab.label}</span>
              </div>
              <p className={`text-2xl font-bold ${tab.count > 0 ? tab.color : 'text-gray-300'}`}>
                {tab.count}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : currentSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center h-48 gap-2">
            <PhoneCall className="h-10 w-10 text-gray-300" />
            <p className="text-gray-500 text-sm">Queue is clear</p>
          </div>
        ) : (
          currentSessions.map(session => (
            <QueueCard
              key={session.id}
              session={session}
              onSelect={onSelectSession}
              onAction={actionConfig?.action}
              actionLabel={actionConfig?.label}
            />
          ))
        )}
      </div>
    </div>
  );
}
