import { useEffect, useState } from 'react';
import {
  Calendar, CircleCheck as CheckCircle, Clock,
  RefreshCw, Globe, MessageSquare, Users, MapPin, User,
  ChevronDown, Bot, CircleX,
} from 'lucide-react';
import { aiCallAgentService, AIAppointment, AppointmentStatus, BookingSource, AppointmentServiceType } from '../../services/aiCallAgentService';
import { useToast } from '../../hooks/useToast';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  scheduled:            { label: 'Scheduled',   color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Calendar },
  confirmed:            { label: 'Confirmed',   color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  completed:            { label: 'Completed',   color: 'text-gray-600',   bg: 'bg-gray-100',   icon: CheckCircle },
  no_show:              { label: 'No Show',     color: 'text-red-700',    bg: 'bg-red-100',    icon: CircleX },
  cancelled:            { label: 'Cancelled',   color: 'text-red-600',    bg: 'bg-red-50',     icon: CircleX },
  reschedule_requested: { label: 'Reschedule',  color: 'text-amber-700',  bg: 'bg-amber-100',  icon: Clock },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ai_call_agent:  { label: 'AI Call Agent',  color: 'text-blue-700',  bg: 'bg-blue-100',  icon: Bot },
  web_form:       { label: 'Web Form',       color: 'text-teal-700',  bg: 'bg-teal-100',  icon: Globe },
  staff_manual:   { label: 'Staff Manual',   color: 'text-gray-600',  bg: 'bg-gray-100',  icon: Users },
  messenger:      { label: 'Messenger',      color: 'text-rose-700',  bg: 'bg-rose-100',  icon: MessageSquare },
  google:         { label: 'Google',         color: 'text-amber-700', bg: 'bg-amber-100', icon: Globe },
  facebook:       { label: 'Facebook',       color: 'text-blue-600',  bg: 'bg-blue-100',  icon: Globe },
  patient_portal: { label: 'Patient Portal', color: 'text-teal-600',  bg: 'bg-teal-100',  icon: User },
};

const SERVICE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  physio:         { label: 'Physio',       color: 'text-blue-700',   bg: 'bg-blue-100' },
  orthotics:      { label: 'Orthotics',    color: 'text-cyan-700',   bg: 'bg-cyan-100' },
  wcb_assessment: { label: 'WCB',          color: 'text-amber-700',  bg: 'bg-amber-100' },
  mva_assessment: { label: 'MVA',          color: 'text-orange-700', bg: 'bg-orange-100' },
  assessment:     { label: 'Assessment',   color: 'text-teal-700',   bg: 'bg-teal-100' },
  follow_up:      { label: 'Follow Up',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  consultation:   { label: 'Consultation', color: 'text-gray-600',   bg: 'bg-gray-100' },
  employer_call:  { label: 'Employer',     color: 'text-slate-700',  bg: 'bg-slate-100' },
};

const INSURANCE_LABELS: Record<string, string> = {
  private: 'Private',
  wcb: 'WCB',
  mva: 'MVA',
  employer: 'Employer',
  direct_billing: 'Direct',
};

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-50">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-36" />
          <div className="h-4 bg-gray-100 rounded w-24" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-16 ml-auto" />
          <div className="h-5 bg-gray-100 rounded-full w-20" />
        </div>
      ))}
    </div>
  );
}

interface InlineStatusMenuProps {
  apptId: string;
  current: AppointmentStatus;
  onUpdate: (id: string, status: AppointmentStatus) => Promise<void>;
}

function InlineStatusMenu({ apptId, current, onUpdate }: InlineStatusMenuProps) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const cfg = STATUS_CONFIG[current];
  const Icon = cfg.icon;

  const handleSelect = async (status: AppointmentStatus) => {
    setOpen(false);
    if (status === current) return;
    setUpdating(true);
    await onUpdate(apptId, status);
    setUpdating(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={updating}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} hover:opacity-90 transition-opacity`}
      >
        {updating ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <Icon className="h-3 w-3" />
        )}
        {cfg.label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
            {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map(s => {
              const c = STATUS_CONFIG[s];
              const SI = c.icon;
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                    s === current ? `${c.color} font-semibold bg-gray-50` : 'text-gray-700'
                  }`}
                >
                  <SI className={`h-3.5 w-3.5 ${c.color}`} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function AppointmentsDashboard() {
  const [appointments, setAppointments] = useState<AIAppointment[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof aiCallAgentService.getAppointmentStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<BookingSource | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<AppointmentServiceType | 'all'>('all');
  const [view, setView] = useState<'today' | 'week' | 'all'>('all');
  const { error: showError, success } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const filters: Parameters<typeof aiCallAgentService.getAppointments>[0] = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (sourceFilter !== 'all') filters.booking_source = sourceFilter;
      if (serviceFilter !== 'all') filters.service_type = serviceFilter;

      if (view === 'today') {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const end = new Date(); end.setHours(23, 59, 59, 999);
        filters.date_from = start.toISOString();
        filters.date_to = end.toISOString();
      } else if (view === 'week') {
        const start = new Date();
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        filters.date_from = start.toISOString();
        filters.date_to = end.toISOString();
      }

      const [appts, statsData] = await Promise.all([
        aiCallAgentService.getAppointments(filters),
        aiCallAgentService.getAppointmentStats(),
      ]);
      setAppointments(appts);
      setStats(statsData);
    } catch {
      showError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter, sourceFilter, serviceFilter, view]);

  const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
    try {
      await aiCallAgentService.updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      success(`Status updated to ${STATUS_CONFIG[status].label}`);
    } catch {
      showError('Failed to update status');
    }
  };

  const estRevenue = appointments.reduce((sum, a) => sum + (a.estimated_revenue || 0), 0);
  const aiBooked = appointments.filter(a => a.booking_source === 'ai_call_agent').length;
  const newPatients = appointments.filter(a => a.is_new_patient).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-400 mt-0.5">AI-booked and staff-created appointments across all channels</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {(['today', 'week', 'all'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                  view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {v === 'week' ? 'This Week' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Today', value: stats.today, sub: `${stats.today_ai} AI`, color: 'text-gray-900', bg: 'bg-gray-50' },
            { label: 'Scheduled', value: stats.scheduled, sub: 'pending', color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Confirmed', value: stats.confirmed, sub: 'ready', color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'No Shows', value: stats.no_shows, sub: 'this period', color: 'text-red-700', bg: 'bg-red-50' },
            { label: 'AI Booked', value: stats.from_ai_agent, sub: 'via call agent', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Est. Revenue', value: formatCurrency(stats.estimated_revenue), sub: 'total pipeline', color: 'text-green-700', bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border border-gray-100 rounded-2xl p-3.5`}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Statuses</option>
            {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as BookingSource | 'all')}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Sources</option>
            {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value as AppointmentServiceType | 'all')}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Services</option>
            {Object.entries(SERVICE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <span>{appointments.length} appointments</span>
            {aiBooked > 0 && <span className="text-blue-600 font-medium">{aiBooked} AI-booked</span>}
            {newPatients > 0 && <span className="text-green-600 font-medium">{newPatients} new patients</span>}
            {estRevenue > 0 && <span className="font-medium text-gray-600">{formatCurrency(estRevenue)} est.</span>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Table Head */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
          {['Patient', 'Time', 'Service', 'Source', 'Insurance', 'Status'].map(col => (
            <span key={col} className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{col}</span>
          ))}
        </div>

        {loading ? (
          <TableSkeleton />
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No appointments found</p>
            <p className="text-sm text-gray-400">Try adjusting the filters above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {appointments.map(appt => {
              const service = SERVICE_CONFIG[appt.service_type] || { label: appt.service_type, color: 'text-gray-600', bg: 'bg-gray-100' };
              const source = SOURCE_CONFIG[appt.booking_source] || SOURCE_CONFIG.staff_manual;
              const SourceIcon = source.icon;
              const needsAttention = appt.status === 'reschedule_requested' || appt.status === 'no_show';

              return (
                <div
                  key={appt.id}
                  className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/80 transition-colors ${
                    needsAttention ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Patient */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500">
                          {(appt.patient_name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{appt.patient_name || '—'}</p>
                        {appt.is_new_patient && (
                          <p className="text-[10px] text-green-600 font-semibold">New Patient</p>
                        )}
                      </div>
                    </div>
                    {appt.confirmation_code && (
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 ml-9">{appt.confirmation_code}</p>
                    )}
                  </div>

                  {/* Time */}
                  <div>
                    <p className="text-sm text-gray-700">{formatDateTime(appt.start_time)}</p>
                    {appt.clinic_location?.name && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {appt.clinic_location.name}
                      </p>
                    )}
                  </div>

                  {/* Service */}
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${service.bg} ${service.color}`}>
                      {service.label}
                    </span>
                    {appt.practitioner?.name && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{appt.practitioner.name}</p>
                    )}
                  </div>

                  {/* Source */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${source.bg} ${source.color}`}>
                      <SourceIcon className="h-2.5 w-2.5" />
                      {source.label}
                    </span>
                  </div>

                  {/* Insurance */}
                  <div>
                    <p className="text-sm text-gray-600">{INSURANCE_LABELS[appt.insurance_type] || appt.insurance_type}</p>
                    {appt.estimated_revenue > 0 && (
                      <p className="text-[10px] text-green-600 font-medium mt-0.5">{formatCurrency(appt.estimated_revenue)}</p>
                    )}
                  </div>

                  {/* Status — inline dropdown */}
                  <InlineStatusMenu
                    apptId={appt.id}
                    current={appt.status}
                    onUpdate={handleStatusUpdate}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {!loading && appointments.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-400">
            <span>{appointments.length} appointments</span>
            <span>{appointments.filter(a => a.status === 'confirmed' || a.status === 'scheduled').length} upcoming · {appointments.filter(a => a.status === 'no_show' || a.status === 'cancelled').length} issues</span>
          </div>
        )}
      </div>
    </div>
  );
}
