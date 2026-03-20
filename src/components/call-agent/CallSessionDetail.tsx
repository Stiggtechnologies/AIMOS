import { useEffect, useState } from 'react';
import { X, User, TriangleAlert as AlertTriangle, PhoneCall, Save, ChevronDown, Calendar, Mic, Tag, CircleCheck as CheckCircle2, RefreshCw, Bot, CircleUser as UserCircle, ChevronRight } from 'lucide-react';
import { aiCallAgentService, CallSession, AIAppointment, AIClinicLocation, AIPractitioner } from '../../services/aiCallAgentService';
import { useToast } from '../../hooks/useToast';

interface CallSessionDetailProps {
  sessionId: string;
  onClose: () => void;
  onNavigateToLead?: (leadId: string) => void;
  onNavigateToAppointment?: (appointmentId: string) => void;
}

const INTENT_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  physio:           { label: 'Physiotherapy',    color: 'text-blue-700',   bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  orthotics:        { label: 'Custom Orthotics', color: 'text-cyan-700',   bg: 'bg-cyan-100',   dot: 'bg-cyan-500' },
  wcb:              { label: 'WCB / Workplace',  color: 'text-amber-700',  bg: 'bg-amber-100',  dot: 'bg-amber-500' },
  mva:              { label: 'MVA / Accident',   color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
  employer:         { label: 'Employer Inquiry', color: 'text-slate-700',  bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  existing_patient: { label: 'Existing Patient', color: 'text-teal-700',   bg: 'bg-teal-100',   dot: 'bg-teal-500' },
  unknown:          { label: 'Unknown',          color: 'text-gray-500',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  other:            { label: 'Other',            color: 'text-gray-500',   bg: 'bg-gray-100',   dot: 'bg-gray-400' },
};

const ROUTING_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  booked:             { label: 'Booked',            color: 'text-green-700',  bg: 'bg-green-100' },
  callback_requested: { label: 'Callback Pending',  color: 'text-amber-700',  bg: 'bg-amber-100' },
  transferred:        { label: 'Transferred',       color: 'text-blue-700',   bg: 'bg-blue-100' },
  voicemail:          { label: 'Voicemail',         color: 'text-gray-600',   bg: 'bg-gray-100' },
  incomplete:         { label: 'Incomplete',        color: 'text-red-600',    bg: 'bg-red-50' },
  lost:               { label: 'Lost',              color: 'text-red-700',    bg: 'bg-red-100' },
  information_only:   { label: 'Info Only',         color: 'text-gray-600',   bg: 'bg-gray-100' },
};

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  positive:   { label: 'Positive',   color: 'text-green-600', icon: '😊' },
  neutral:    { label: 'Neutral',    color: 'text-gray-500',  icon: '😐' },
  frustrated: { label: 'Frustrated', color: 'text-amber-600', icon: '😤' },
  angry:      { label: 'Angry',      color: 'text-red-600',   icon: '😠' },
};

function formatDuration(seconds: number) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
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

function parseTranscript(raw: string): { role: 'ai' | 'caller'; text: string }[] {
  if (!raw) return [];
  const lines = raw.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const aiMatch = line.match(/^(AI|Agent|Assistant|Bot):\s*/i);
    const callerMatch = line.match(/^(Caller|Patient|User|Customer):\s*/i);
    if (aiMatch) return { role: 'ai' as const, text: line.replace(aiMatch[0], '').trim() };
    if (callerMatch) return { role: 'caller' as const, text: line.replace(callerMatch[0], '').trim() };
    return { role: 'ai' as const, text: line.trim() };
  });
}

function TranscriptBubble({ role, text }: { role: 'ai' | 'caller'; text: string }) {
  if (role === 'ai') {
    return (
      <div className="flex items-start gap-2">
        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="h-3 w-3 text-blue-600" />
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
          <p className="text-xs font-semibold text-blue-600 mb-0.5">AI Agent</p>
          <p className="text-sm text-gray-800 leading-relaxed">{text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 flex-row-reverse">
      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
        <UserCircle className="h-3 w-3 text-gray-500" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
        <p className="text-xs font-semibold text-gray-500 mb-0.5 text-right">Caller</p>
        <p className="text-sm text-gray-800 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{children}</h3>
  );
}

function InfoRow({ label, value, accent }: { label: string; value?: string | null; accent?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${accent || 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

interface BookingFormState {
  location_id: string;
  practitioner_id: string;
  appointment_type: string;
  service_type: string;
  start_time: string;
  insurance_type: string;
  notes: string;
}

const APPOINTMENT_TYPES = [
  { value: 'initial_assessment', label: 'Initial Assessment' },
  { value: 'orthotics_assessment', label: 'Orthotics Assessment' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'employer_call', label: 'Employer Call' },
  { value: 'reassessment', label: 'Reassessment' },
  { value: 'discharge', label: 'Discharge' },
];

const SERVICE_TYPES = [
  { value: 'physio', label: 'Physiotherapy' },
  { value: 'orthotics', label: 'Orthotics' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'wcb_assessment', label: 'WCB Assessment' },
  { value: 'mva_assessment', label: 'MVA Assessment' },
];

const INSURANCE_TYPES = [
  { value: 'private', label: 'Private / Extended Health' },
  { value: 'wcb', label: 'WCB' },
  { value: 'mva', label: 'MVA' },
  { value: 'employer', label: 'Employer / Corporate' },
  { value: 'direct_billing', label: 'Direct Billing' },
];

export function CallSessionDetail({ sessionId, onClose, onNavigateToLead, onNavigateToAppointment }: CallSessionDetailProps) {
  const [session, setSession] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffNotes, setStaffNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [locations, setLocations] = useState<AIClinicLocation[]>([]);
  const [practitioners, setPractitioners] = useState<AIPractitioner[]>([]);
  const [bookingForm, setBookingForm] = useState<BookingFormState>({
    location_id: '', practitioner_id: '', appointment_type: 'initial_assessment',
    service_type: 'physio', start_time: '', insurance_type: 'private', notes: '',
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [markingCalledBack, setMarkingCalledBack] = useState(false);
  const { error: showError, success } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [data, locs, pracs] = await Promise.all([
          aiCallAgentService.getSessionById(sessionId),
          aiCallAgentService.getLocations(),
          aiCallAgentService.getPractitioners(),
        ]);
        if (data) {
          setSession(data);
          setStaffNotes(data.staff_notes || '');
          const intentInsurance: Record<string, string> = {
            wcb: 'wcb', mva: 'mva', employer: 'employer',
          };
          setBookingForm(prev => ({
            ...prev,
            location_id: data.assigned_location_id || (locs[0]?.id ?? ''),
            service_type: data.service_type === 'both' ? 'physio' : (data.service_type || 'physio'),
            insurance_type: intentInsurance[data.intent_type] || 'private',
            notes: data.issue_summary || '',
          }));
        }
        setLocations(locs);
        setPractitioners(pracs);
      } catch {
        showError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  const filteredPractitioners = bookingForm.location_id
    ? practitioners.filter(p => p.clinic_location_id === bookingForm.location_id && p.active)
    : practitioners.filter(p => p.active);

  const handleSaveNotes = async () => {
    if (!session) return;
    try {
      setSavingNotes(true);
      await aiCallAgentService.addStaffNotes(session.id, staffNotes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
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

  const handleBookAppointment = async () => {
    if (!session) return;
    if (!bookingForm.location_id || !bookingForm.start_time) {
      showError('Please select a location and time');
      return;
    }
    try {
      setSubmittingBooking(true);
      const appt = await aiCallAgentService.createAppointment({
        lead_id: session.lead_id || undefined,
        clinic_location_id: bookingForm.location_id,
        practitioner_id: bookingForm.practitioner_id || undefined,
        service_type: bookingForm.service_type as AIAppointment['service_type'],
        appointment_type: bookingForm.appointment_type as AIAppointment['appointment_type'],
        start_time: bookingForm.start_time,
        insurance_type: bookingForm.insurance_type,
        notes: bookingForm.notes,
        patient_name: session.caller_name || '',
        patient_phone: session.caller_phone,
        booking_source: 'staff_manual',
        is_new_patient: !session.is_existing_patient,
      });
      await aiCallAgentService.updateSession(session.id, { appointment_id: appt.id } as Partial<CallSession>);
      setSession({ ...session, appointment_id: appt.id, appointment: { id: appt.id, status: 'scheduled', start_time: bookingForm.start_time } });
      setShowBookingForm(false);
      success(`Appointment booked — ${appt.confirmation_code}`);
    } catch {
      showError('Failed to book appointment');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleMarkCalledBack = async () => {
    if (!session) return;
    try {
      setMarkingCalledBack(true);
      await aiCallAgentService.updateSession(session.id, {
        routing_result: 'transferred',
        follow_up_sent_at: new Date().toISOString(),
      } as Partial<CallSession>);
      setSession({ ...session, routing_result: 'transferred', follow_up_sent_at: new Date().toISOString() });
      success('Marked as called back');
    } catch {
      showError('Failed to update');
    } finally {
      setMarkingCalledBack(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
        <div
          className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="animate-pulse flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 rounded-full" />
              <div className="space-y-1.5">
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-48" />
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <div className="flex-1 p-6 space-y-6 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="h-16 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const intent = INTENT_CONFIG[session.intent_type] || INTENT_CONFIG.unknown;
  const routing = ROUTING_CONFIG[session.routing_result] || ROUTING_CONFIG.incomplete;
  const sentiment = SENTIMENT_CONFIG[session.sentiment] || SENTIMENT_CONFIG.neutral;
  const transcriptLines = parseTranscript(session.transcript || '');
  const isCallbackPending = session.routing_result === 'callback_requested';
  const canBook = !session.appointment_id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-[slideInRight_0.25s_ease-out]"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideInRight 0.2s ease-out' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded-full ${intent.bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-sm font-bold ${intent.color}`}>
                {(session.caller_name || '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900 truncate">
                  {session.caller_name || 'Unknown Caller'}
                </h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${intent.bg} ${intent.color} flex-shrink-0`}>
                  {intent.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {session.caller_phone}
                <span className="font-sans mx-1.5">·</span>
                {timeAgo(session.created_at)}
                <span className="font-sans mx-1.5">·</span>
                {formatDuration(session.call_duration_seconds)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* ── Status Bar ── */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 bg-gray-50/60 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${routing.bg} ${routing.color}`}>
            {routing.label}
          </span>
          <span className="text-gray-200 text-sm">|</span>
          <span className={`text-xs font-medium ${sentiment.color}`}>
            {sentiment.icon} {sentiment.label}
          </span>
          {session.urgency_level === 'high' && (
            <>
              <span className="text-gray-200 text-sm">|</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                High Urgency
              </span>
            </>
          )}
          {session.escalation_required && (
            <>
              <span className="text-gray-200 text-sm">|</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                <AlertTriangle className="h-3 w-3" />
                Escalation Required
              </span>
            </>
          )}
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <Tag className="h-3 w-3" />
            <span className="capitalize">{session.stage_reached || 'unknown'}</span>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-6">

            {/* AI Summary */}
            {session.ai_summary && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-50/30 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 mb-1">AI Summary</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{session.ai_summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Escalation Alert */}
            {session.escalation_required && session.escalation_reason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-1">Escalation Reason</p>
                    <p className="text-sm text-red-800">{session.escalation_reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Call Details Grid */}
            <div>
              <SectionLabel>Call Details</SectionLabel>
              <div className="mt-2 bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                <InfoRow label="Chief Complaint" value={session.issue_summary} />
                <InfoRow label="Location Preference" value={session.location_preference || session.assigned_location?.name} />
                <InfoRow label="Insurance / Payer" value={session.insurance_context} />
                <InfoRow
                  label="Existing Patient"
                  value={session.is_existing_patient ? 'Yes — returning patient' : 'No — new patient'}
                  accent={session.is_existing_patient ? 'text-teal-700' : 'text-blue-700'}
                />
                <InfoRow
                  label="Callback Needed"
                  value={session.callback_needed ? 'Yes' : 'No'}
                  accent={session.callback_needed ? 'text-amber-700' : 'text-gray-800'}
                />
                <InfoRow
                  label="Urgency"
                  value={session.urgency_level ? session.urgency_level.charAt(0).toUpperCase() + session.urgency_level.slice(1) : undefined}
                  accent={session.urgency_level === 'high' ? 'text-red-600' : session.urgency_level === 'medium' ? 'text-amber-600' : 'text-green-600'}
                />
                <InfoRow label="Called" value={formatDateTime(session.created_at)} />
              </div>
            </div>

            {/* Linked Records */}
            <div>
              <SectionLabel>Linked Records</SectionLabel>
              <div className="mt-2 space-y-2">
                {session.lead_id ? (
                  <button
                    onClick={() => onNavigateToLead?.(session.lead_id!)}
                    className="w-full flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Lead Record</p>
                        {session.lead && (
                          <p className="text-xs text-gray-500">{session.lead.first_name} {session.lead.last_name} · {session.lead.status}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3 p-3.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-400">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-300" />
                    </div>
                    <p className="text-sm">No lead created yet</p>
                  </div>
                )}

                {session.appointment_id ? (
                  <button
                    onClick={() => onNavigateToAppointment?.(session.appointment_id!)}
                    className="w-full flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">Appointment Booked</p>
                        {session.appointment && (
                          <p className="text-xs text-gray-500 capitalize">
                            {session.appointment.status}
                            {session.appointment.start_time && ` · ${formatDateTime(session.appointment.start_time)}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3 text-gray-400">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-gray-300" />
                      </div>
                      <p className="text-sm">No appointment created</p>
                    </div>
                    {canBook && (
                      <button
                        onClick={() => setShowBookingForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Calendar className="h-3 w-3" />
                        Book Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Booking Override Form */}
            {showBookingForm && canBook && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">Book Appointment</span>
                  </div>
                  <button onClick={() => setShowBookingForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Location *</label>
                      <select
                        value={bookingForm.location_id}
                        onChange={e => setBookingForm({ ...bookingForm, location_id: e.target.value, practitioner_id: '' })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select location</option>
                        {locations.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Practitioner</label>
                      <select
                        value={bookingForm.practitioner_id}
                        onChange={e => setBookingForm({ ...bookingForm, practitioner_id: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Any available</option>
                        {filteredPractitioners.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — {p.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Appointment Type</label>
                      <select
                        value={bookingForm.appointment_type}
                        onChange={e => setBookingForm({ ...bookingForm, appointment_type: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {APPOINTMENT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Service</label>
                      <select
                        value={bookingForm.service_type}
                        onChange={e => setBookingForm({ ...bookingForm, service_type: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {SERVICE_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={bookingForm.start_time}
                        onChange={e => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Insurance</label>
                      <select
                        value={bookingForm.insurance_type}
                        onChange={e => setBookingForm({ ...bookingForm, insurance_type: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {INSURANCE_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      rows={2}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Appointment notes..."
                    />
                  </div>
                  <button
                    onClick={handleBookAppointment}
                    disabled={submittingBooking || !bookingForm.location_id || !bookingForm.start_time}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {submittingBooking ? (
                      <><RefreshCw className="h-4 w-4 animate-spin" /> Booking...</>
                    ) : (
                      <><Calendar className="h-4 w-4" /> Confirm Appointment</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Recording */}
            <div>
              <SectionLabel>Call Recording</SectionLabel>
              <div className="mt-2">
                {session.recording_url ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <audio
                      controls
                      src={session.recording_url}
                      className="w-full"
                      preload="none"
                    >
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-gray-400">
                    <Mic className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">No recording available</p>
                      <p className="text-xs text-gray-400 mt-0.5">Recordings appear here once connected to Retell, Vapi, or Twilio.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transcript */}
            {session.transcript && (
              <div>
                <button
                  onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                  className="w-full flex items-center justify-between group"
                >
                  <SectionLabel>
                    Transcript ({transcriptLines.length} lines)
                  </SectionLabel>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${transcriptExpanded ? 'rotate-180' : ''}`} />
                </button>

                {transcriptExpanded && (
                  <div className="mt-3 bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3 max-h-96 overflow-y-auto">
                    {transcriptLines.length > 0 ? (
                      transcriptLines.map((line, i) => (
                        <TranscriptBubble key={i} role={line.role} text={line.text} />
                      ))
                    ) : (
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
                        {session.transcript}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Staff Notes */}
            <div>
              <SectionLabel>Staff Notes</SectionLabel>
              <div className="mt-2 space-y-2">
                <textarea
                  value={staffNotes}
                  onChange={e => { setStaffNotes(e.target.value); setNotesSaved(false); }}
                  placeholder="Add internal notes for this call session..."
                  rows={3}
                  className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-3 w-3" />
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                  {notesSaved && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Action Footer ── */}
        <div className="border-t border-gray-100 px-5 py-3.5 bg-white">
          {showEscalateForm ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={escalationReason}
                onChange={e => setEscalationReason(e.target.value)}
                placeholder="Reason for escalation..."
                autoFocus
                className="flex-1 text-sm px-3 py-2 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                onClick={handleEscalate}
                disabled={escalating || !escalationReason.trim()}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {escalating ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowEscalateForm(false)}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {!session.escalation_required && (
                <button
                  onClick={() => setShowEscalateForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Flag Escalation
                </button>
              )}

              {isCallbackPending && session.routing_result !== 'transferred' && (
                <button
                  onClick={handleMarkCalledBack}
                  disabled={markingCalledBack}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {markingCalledBack ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <PhoneCall className="h-3.5 w-3.5" />
                  )}
                  Mark Called Back
                </button>
              )}

              {canBook && !showBookingForm && (
                <button
                  onClick={() => setShowBookingForm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Book Appointment
                </button>
              )}

              <div className="ml-auto text-xs text-gray-400">
                ID: {sessionId.slice(0, 8)}…
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
