import { useEffect, useState } from 'react';
import { X, Phone, User, MapPin, Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, PhoneCall, FileText, ExternalLink, MessageSquare, Save, ChevronDown, PhoneOff, Calendar, Mic, Tag, ArrowUpRight } from 'lucide-react';
import { aiCallAgentService, CallSession } from '../../services/aiCallAgentService';
import { useToast } from '../../hooks/useToast';

interface CallSessionDetailProps {
  sessionId: string;
  onClose: () => void;
  onNavigateToLead?: (leadId: string) => void;
  onNavigateToAppointment?: (appointmentId: string) => void;
}

const INTENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  physio:          { label: 'Physiotherapy',     color: 'text-blue-700',   bg: 'bg-blue-100' },
  orthotics:       { label: 'Custom Orthotics',  color: 'text-purple-700', bg: 'bg-purple-100' },
  wcb:             { label: 'WCB / Workplace',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  mva:             { label: 'MVA / Accident',    color: 'text-orange-700', bg: 'bg-orange-100' },
  employer:        { label: 'Employer Inquiry',  color: 'text-slate-700',  bg: 'bg-slate-100' },
  existing_patient:{ label: 'Existing Patient',  color: 'text-teal-700',   bg: 'bg-teal-100' },
  unknown:         { label: 'Unknown',           color: 'text-gray-500',   bg: 'bg-gray-100' },
  other:           { label: 'Other',             color: 'text-gray-500',   bg: 'bg-gray-100' },
};

const ROUTING_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  booked:              { label: 'Appointment Booked', color: 'text-green-700',  bg: 'bg-green-100' },
  callback_requested:  { label: 'Callback Requested', color: 'text-amber-700',  bg: 'bg-amber-100' },
  transferred:         { label: 'Transferred to Staff', color: 'text-blue-700', bg: 'bg-blue-100' },
  voicemail:           { label: 'Voicemail',           color: 'text-gray-600',  bg: 'bg-gray-100' },
  incomplete:          { label: 'Incomplete',           color: 'text-red-600',   bg: 'bg-red-50' },
  lost:                { label: 'Lost',                 color: 'text-red-700',   bg: 'bg-red-100' },
  information_only:    { label: 'Information Only',     color: 'text-gray-600',  bg: 'bg-gray-100' },
};

const SENTIMENT_CONFIG: Record<string, { label: string; color: string }> = {
  positive:   { label: 'Positive',   color: 'text-green-600' },
  neutral:    { label: 'Neutral',    color: 'text-gray-600' },
  frustrated: { label: 'Frustrated', color: 'text-amber-600' },
  angry:      { label: 'Angry',      color: 'text-red-600' },
};

function formatDuration(seconds: number) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s} sec`;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

export function CallSessionDetail({ sessionId, onClose, onNavigateToLead, onNavigateToAppointment }: CallSessionDetailProps) {
  const [session, setSession] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffNotes, setStaffNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const { error: showError, success } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await aiCallAgentService.getSessionById(sessionId);
        if (data) {
          setSession(data);
          setStaffNotes(data.staff_notes || '');
        }
      } catch {
        showError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  const handleSaveNotes = async () => {
    if (!session) return;
    try {
      setSavingNotes(true);
      await aiCallAgentService.addStaffNotes(session.id, staffNotes);
      success('Notes saved');
    } catch {
      showError('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEscalate = async () => {
    if (!session || !escalationReason.trim()) return;
    try {
      setEscalating(true);
      await aiCallAgentService.escalate(session.id, escalationReason);
      setSession({ ...session, escalation_required: true, escalation_reason: escalationReason });
      setShowEscalateForm(false);
      success('Escalation flagged');
    } catch {
      showError('Failed to escalate');
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const intent = INTENT_CONFIG[session.intent_type] || INTENT_CONFIG.unknown;
  const routing = ROUTING_CONFIG[session.routing_result] || ROUTING_CONFIG.incomplete;
  const sentiment = SENTIMENT_CONFIG[session.sentiment] || SENTIMENT_CONFIG.neutral;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{session.caller_name || 'Unknown Caller'}</h2>
              <p className="text-sm text-gray-500">{session.caller_phone} · {formatDateTime(session.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${intent.bg} ${intent.color}`}>
              {intent.label}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${routing.bg} ${routing.color}`}>
              {routing.label}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 ${sentiment.color}`}>
              Sentiment: {sentiment.label}
            </span>
            {session.escalation_required && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Escalation Required
              </span>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-semibold text-gray-900">{formatDuration(session.call_duration_seconds)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Tag className="h-4 w-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Stage Reached</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{session.stage_reached || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Mic className="h-4 w-4 text-gray-400 mx-auto mb-1" />
              <p className="text-xs text-gray-500">AI Provider</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{session.ai_provider || 'Retell'}</p>
            </div>
          </div>

          {/* AI Summary */}
          {session.ai_summary && (
            <Section title="AI Summary">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-gray-800 leading-relaxed">{session.ai_summary}</p>
              </div>
            </Section>
          )}

          {/* Issue Summary */}
          {session.issue_summary && (
            <Section title="Issue / Chief Complaint">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-800">{session.issue_summary}</p>
              </div>
            </Section>
          )}

          {/* Structured Fields */}
          <Section title="Extracted Information">
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {[
                { label: 'Location Preference', value: session.location_preference || session.assigned_location?.name },
                { label: 'Insurance / Payer', value: session.insurance_context },
                { label: 'Existing Patient', value: session.is_existing_patient ? 'Yes' : 'No' },
                { label: 'Callback Needed', value: session.callback_needed ? 'Yes' : 'No' },
                { label: 'Urgency', value: session.urgency_level ? session.urgency_level.charAt(0).toUpperCase() + session.urgency_level.slice(1) : undefined },
              ].filter(f => f.value).map(f => (
                <div key={f.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500">{f.label}</span>
                  <span className="text-sm font-medium text-gray-900">{f.value}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Escalation */}
          {session.escalation_required && session.escalation_reason && (
            <Section title="Escalation Reason">
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <p className="text-sm text-red-800">{session.escalation_reason}</p>
              </div>
            </Section>
          )}

          {/* Transcript */}
          {session.transcript && (
            <Section title="Call Transcript">
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Full Transcript</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${transcriptExpanded ? 'rotate-180' : ''}`} />
                </button>
                {transcriptExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed mt-3">
                      {session.transcript}
                    </pre>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Linked Records */}
          <Section title="Linked Records">
            <div className="space-y-2">
              {session.lead_id ? (
                <button
                  onClick={() => onNavigateToLead?.(session.lead_id!)}
                  className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-green-800">Lead Record</p>
                      {session.lead && (
                        <p className="text-xs text-green-600">{session.lead.first_name} {session.lead.last_name} · {session.lead.status}</p>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-green-500" />
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-400">
                  <User className="h-4 w-4" />
                  <span className="text-sm">No lead created</span>
                </div>
              )}

              {session.appointment_id ? (
                <button
                  onClick={() => onNavigateToAppointment?.(session.appointment_id!)}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-800">Appointment Booked</p>
                      {session.appointment && (
                        <p className="text-xs text-blue-600">
                          {session.appointment.status}
                          {session.appointment.start_time && ` · ${formatDateTime(session.appointment.start_time)}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">No appointment created</span>
                </div>
              )}
            </div>
          </Section>

          {/* Staff Notes */}
          <Section title="Staff Notes">
            <textarea
              value={staffNotes}
              onChange={e => setStaffNotes(e.target.value)}
              placeholder="Add internal notes for this call session..."
              className="w-full h-24 text-sm px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
          </Section>
        </div>

        {/* Action Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center gap-3">
            {!session.escalation_required && (
              <>
                {!showEscalateForm ? (
                  <button
                    onClick={() => setShowEscalateForm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Flag Escalation
                  </button>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={escalationReason}
                      onChange={e => setEscalationReason(e.target.value)}
                      placeholder="Reason for escalation..."
                      className="flex-1 text-sm px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <button
                      onClick={handleEscalate}
                      disabled={escalating || !escalationReason.trim()}
                      className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {escalating ? 'Saving...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowEscalateForm(false)}
                      className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}

            {session.routing_result === 'callback_requested' && (
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                <PhoneCall className="h-4 w-4" />
                Mark Called Back
              </button>
            )}

            {!session.appointment_id && session.routing_result === 'booked' && (
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Calendar className="h-4 w-4" />
                Book Appointment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
