import { useEffect, useState } from 'react';
import {
  PhoneCall, TriangleAlert as AlertTriangle, Building2, User,
  Clock, MapPin, RefreshCw, ChevronRight, Phone, Check, PhoneOff,
} from 'lucide-react';
import { aiCallAgentService, CallSession } from '../../services/aiCallAgentService';
import { useToast } from '../../hooks/useToast';

interface BookingQueue {
  callbacks: CallSession[];
  escalations: CallSession[];
  employers: CallSession[];
  existingPatients: CallSession[];
  bookingFailed: CallSession[];
}

function waitTime(dateStr: string): { label: string; urgent: boolean } {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 30) return { label: `${mins}m`, urgent: false };
  if (mins < 60) return { label: `${mins}m`, urgent: true };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `${hrs}h ${mins % 60}m`, urgent: true };
  return { label: `${Math.floor(hrs / 24)}d`, urgent: true };
}

const INTENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  physio:           { label: 'Physio',    color: 'text-blue-700',   bg: 'bg-blue-100' },
  orthotics:        { label: 'Orthotics', color: 'text-cyan-700',   bg: 'bg-cyan-100' },
  wcb:              { label: 'WCB',       color: 'text-amber-700',  bg: 'bg-amber-100' },
  mva:              { label: 'MVA',       color: 'text-orange-700', bg: 'bg-orange-100' },
  employer:         { label: 'Employer',  color: 'text-slate-700',  bg: 'bg-slate-100' },
  existing_patient: { label: 'Existing',  color: 'text-teal-700',   bg: 'bg-teal-100' },
  unknown:          { label: 'Unknown',   color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const URGENCY_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-green-400',
};

interface QueueCardProps {
  session: CallSession;
  onAction?: (session: CallSession) => Promise<void>;
  actionLabel?: string;
  actionIcon?: React.ElementType;
  actionStyle?: string;
  onSelect: (session: CallSession) => void;
  actionPending?: string | null;
}

function QueueCard({
  session, onAction, actionLabel, actionIcon: ActionIcon, actionStyle,
  onSelect, actionPending,
}: QueueCardProps) {
  const intent = INTENT_CONFIG[session.intent_type] || INTENT_CONFIG.unknown;
  const urgencyDot = URGENCY_DOT[session.urgency_level] || URGENCY_DOT.medium;
  const wait = waitTime(session.created_at);
  const isPending = actionPending === session.id;

  return (
    <div className={`bg-white border rounded-2xl p-4 hover:shadow-sm transition-all ${
      session.escalation_required ? 'border-red-200 bg-red-50/20' :
      session.urgency_level === 'high' ? 'border-amber-200 bg-amber-50/10' :
      'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start gap-3">
        {/* Avatar + urgency ring */}
        <div className="relative flex-shrink-0">
          <div className={`h-10 w-10 rounded-full ${intent.bg} flex items-center justify-center`}>
            <span className={`text-sm font-bold ${intent.color}`}>
              {(session.caller_name || '?')[0].toUpperCase()}
            </span>
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${urgencyDot}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + intent + wait time */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm truncate">
                {session.caller_name || 'Unknown Caller'}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${intent.bg} ${intent.color} flex-shrink-0`}>
                {intent.label}
              </span>
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold flex-shrink-0 ${wait.urgent ? 'text-red-600' : 'text-gray-400'}`}>
              <Clock className="h-3 w-3" />
              {wait.label}
            </div>
          </div>

          {/* Summary */}
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
            {session.issue_summary || session.ai_summary || 'No summary available'}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
            <div className="flex items-center gap-1 font-mono">
              <Phone className="h-3 w-3" />
              {session.caller_phone}
            </div>
            {session.assigned_location?.name && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {session.assigned_location.name}
              </div>
            )}
            {session.escalation_required && (
              <span className="flex items-center gap-1 text-red-600 font-semibold">
                <AlertTriangle className="h-3 w-3" />
                Escalation Required
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {onAction && actionLabel && ActionIcon && (
            <button
              onClick={() => onAction(session)}
              disabled={isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors ${
                actionStyle || 'bg-gray-900 text-white hover:bg-gray-700'
              }`}
            >
              {isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <ActionIcon className="h-3 w-3" />
              )}
              {isPending ? '...' : actionLabel}
            </button>
          )}
          <button
            onClick={() => onSelect(session)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            View
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-40" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
            <div className="h-7 w-24 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface BookingQueueViewProps {
  onSelectSession: (session: CallSession) => void;
}

export function BookingQueueView({ onSelectSession }: BookingQueueViewProps) {
  const [queue, setQueue] = useState<BookingQueue>({
    callbacks: [], escalations: [], employers: [], existingPatients: [], bookingFailed: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'callbacks' | 'escalations' | 'employers' | 'existing' | 'failed'>('callbacks');
  const [actionPending, setActionPending] = useState<string | null>(null);
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
    setActionPending(session.id);
    try {
      await aiCallAgentService.updateSession(session.id, {
        routing_result: 'transferred',
        follow_up_sent_at: new Date().toISOString(),
      } as Partial<CallSession>);
      success('Marked as called back');
      setQueue(prev => ({ ...prev, callbacks: prev.callbacks.filter(c => c.id !== session.id) }));
    } catch {
      showError('Failed to update');
    } finally {
      setActionPending(null);
    }
  };

  const handleResolveEscalation = async (session: CallSession) => {
    setActionPending(session.id);
    try {
      await aiCallAgentService.updateSession(session.id, { escalation_required: false } as Partial<CallSession>);
      success('Escalation resolved');
      setQueue(prev => ({ ...prev, escalations: prev.escalations.filter(e => e.id !== session.id) }));
    } catch {
      showError('Failed to resolve');
    } finally {
      setActionPending(null);
    }
  };

  const tabs = [
    {
      key: 'callbacks' as const,
      label: 'Callbacks',
      count: queue.callbacks.length,
      icon: PhoneCall,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      dot: 'bg-amber-500',
    },
    {
      key: 'escalations' as const,
      label: 'Escalations',
      count: queue.escalations.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      dot: 'bg-red-500',
    },
    {
      key: 'failed' as const,
      label: 'Booking Failed',
      count: queue.bookingFailed.length,
      icon: PhoneOff,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      dot: 'bg-rose-400',
    },
    {
      key: 'employers' as const,
      label: 'Employer Inquiries',
      count: queue.employers.length,
      icon: Building2,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      dot: 'bg-slate-400',
    },
    {
      key: 'existing' as const,
      label: 'Existing Patients',
      count: queue.existingPatients.length,
      icon: User,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      dot: 'bg-teal-500',
    },
  ] as const;

  const currentSessions = {
    callbacks: queue.callbacks,
    escalations: queue.escalations,
    failed: queue.bookingFailed,
    employers: queue.employers,
    existing: queue.existingPatients,
  }[activeTab];

  const getActionConfig = (): {
    action: (s: CallSession) => Promise<void>;
    label: string;
    icon: React.ElementType;
    style?: string;
  } | undefined => {
    if (activeTab === 'callbacks') {
      return { action: handleMarkCalledBack, label: 'Called Back', icon: Check, style: 'bg-amber-600 text-white hover:bg-amber-700' };
    }
    if (activeTab === 'escalations') {
      return { action: handleResolveEscalation, label: 'Resolve', icon: Check, style: 'bg-green-700 text-white hover:bg-green-800' };
    }
    return undefined;
  };

  const actionConfig = getActionConfig();
  const totalPending = queue.callbacks.length + queue.escalations.length + queue.bookingFailed.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Queue</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalPending > 0 ? (
              <span className="text-amber-600 font-medium">{totalPending} items need attention</span>
            ) : (
              'All queues clear'
            )}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tab Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? `${tab.bg} ${tab.color} shadow-sm`
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold ${
                  isActive ? `${tab.color} bg-white/70` : `${tab.bg} ${tab.color}`
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Queue Content */}
      {loading ? (
        <QueueSkeleton />
      ) : currentSessions.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
            <Check className="h-6 w-6 text-green-500" />
          </div>
          <p className="font-semibold text-gray-700">Queue is clear</p>
          <p className="text-sm text-gray-400">No {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} to action right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Sort: high urgency & escalations first */}
          {[...currentSessions]
            .sort((a, b) => {
              const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
              const aUrgency = urgencyOrder[a.urgency_level] ?? 1;
              const bUrgency = urgencyOrder[b.urgency_level] ?? 1;
              if (a.escalation_required !== b.escalation_required) return a.escalation_required ? -1 : 1;
              if (aUrgency !== bUrgency) return aUrgency - bUrgency;
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            })
            .map(session => (
              <QueueCard
                key={session.id}
                session={session}
                onSelect={onSelectSession}
                onAction={actionConfig?.action}
                actionLabel={actionConfig?.label}
                actionIcon={actionConfig?.icon}
                actionStyle={actionConfig?.style}
                actionPending={actionPending}
              />
            ))}
        </div>
      )}
    </div>
  );
}
