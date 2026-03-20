import { useEffect, useState } from 'react';
import { Calendar, CircleCheck as CheckCircle, Circle as XCircle, Clock, TriangleAlert as AlertTriangle, Filter, RefreshCw, Phone, Globe, MessageSquare, Users, TrendingUp, MapPin, User, Building2, ChevronDown, DollarSign } from 'lucide-react';
import { aiCallAgentService, AIAppointment, AppointmentStatus, BookingSource, AppointmentServiceType } from '../../services/aiCallAgentService';
import { useToast } from '../../hooks/useToast';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  scheduled:            { label: 'Scheduled',   color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Calendar },
  confirmed:            { label: 'Confirmed',   color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  completed:            { label: 'Completed',   color: 'text-gray-700',   bg: 'bg-gray-100',   icon: CheckCircle },
  no_show:              { label: 'No Show',     color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle },
  cancelled:            { label: 'Cancelled',   color: 'text-red-600',    bg: 'bg-red-50',     icon: XCircle },
  reschedule_requested: { label: 'Reschedule',  color: 'text-amber-700',  bg: 'bg-amber-100',  icon: Clock },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ai_call_agent:  { label: 'AI Call Agent', color: 'text-blue-700',  bg: 'bg-blue-100',  icon: Phone },
  web_form:       { label: 'Web Form',      color: 'text-teal-700',  bg: 'bg-teal-100',  icon: Globe },
  staff_manual:   { label: 'Staff Manual',  color: 'text-gray-600',  bg: 'bg-gray-100',  icon: Users },
  messenger:      { label: 'Messenger',     color: 'text-rose-700',  bg: 'bg-rose-100',  icon: MessageSquare },
  google:         { label: 'Google',        color: 'text-amber-700', bg: 'bg-amber-100', icon: Globe },
  facebook:       { label: 'Facebook',      color: 'text-blue-600',  bg: 'bg-blue-100',  icon: Globe },
  patient_portal: { label: 'Patient Portal',color: 'text-teal-600',  bg: 'bg-teal-100',  icon: User },
};

const SERVICE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  physio:          { label: 'Physio',         color: 'text-blue-700',   bg: 'bg-blue-100' },
  orthotics:       { label: 'Orthotics',      color: 'text-purple-700', bg: 'bg-purple-100' },
  wcb_assessment:  { label: 'WCB',            color: 'text-amber-700',  bg: 'bg-amber-100' },
  mva_assessment:  { label: 'MVA',            color: 'text-orange-700', bg: 'bg-orange-100' },
  assessment:      { label: 'Assessment',     color: 'text-teal-700',   bg: 'bg-teal-100' },
  follow_up:       { label: 'Follow Up',      color: 'text-gray-700',   bg: 'bg-gray-100' },
  consultation:    { label: 'Consultation',   color: 'text-gray-700',   bg: 'bg-gray-100' },
  employer_call:   { label: 'Employer',       color: 'text-slate-700',  bg: 'bg-slate-100' },
};

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);
}

function StatCard({ label, value, sub, icon: Icon, accent, onClick }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-all' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-${accent.split('-')[1]}-100`}>
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>
      </div>
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
  const [view, setView] = useState<'today' | 'all'>('all');
  const { error: showError } = useToast();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-booked and manually-created appointments across all channels</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('today')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Today
            </button>
            <button
              onClick={() => setView('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              All
            </button>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="col-span-2 md:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Today</p>
              <p className="text-2xl font-bold mt-1 text-gray-900">{stats.today}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stats.today_ai} from AI agent</p>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scheduled</p>
              <p className="text-2xl font-bold mt-1 text-blue-700">{stats.scheduled}</p>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Confirmed</p>
              <p className="text-2xl font-bold mt-1 text-green-700">{stats.confirmed}</p>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">No Shows</p>
              <p className="text-2xl font-bold mt-1 text-red-700">{stats.no_shows}</p>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cancelled</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{stats.cancelled}</p>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Booked</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.from_ai_agent}</p>
              <p className="text-xs text-gray-400 mt-0.5">of {stats.total} total</p>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Est. Revenue</p>
              <p className="text-xl font-bold mt-1 text-green-700">{formatCurrency(stats.total_revenue)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Service Breakdown */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Physio', value: stats.physio, accent: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Orthotics', value: stats.orthotics, accent: 'text-purple-700', bg: 'bg-purple-50' },
            { label: 'WCB', value: stats.wcb, accent: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'MVA', value: stats.mva, accent: 'text-orange-700', bg: 'bg-orange-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200 p-4 flex items-center justify-between`}>
              <div>
                <p className="text-xs font-medium text-gray-500">{s.label} Appointments</p>
                <p className={`text-2xl font-bold mt-1 ${s.accent}`}>{s.value}</p>
              </div>
              <TrendingUp className={`h-6 w-6 ${s.accent} opacity-40`} />
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="no_show">No Show</option>
            <option value="cancelled">Cancelled</option>
            <option value="reschedule_requested">Reschedule Requested</option>
          </select>

          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as BookingSource | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sources</option>
            <option value="ai_call_agent">AI Call Agent</option>
            <option value="web_form">Web Form</option>
            <option value="staff_manual">Staff Manual</option>
            <option value="messenger">Messenger</option>
            <option value="google">Google</option>
            <option value="facebook">Facebook</option>
          </select>

          <select
            value={serviceFilter}
            onChange={e => setServiceFilter(e.target.value as AppointmentServiceType | 'all')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Services</option>
            <option value="physio">Physio</option>
            <option value="orthotics">Orthotics</option>
            <option value="wcb_assessment">WCB Assessment</option>
            <option value="mva_assessment">MVA Assessment</option>
            <option value="assessment">General Assessment</option>
            <option value="follow_up">Follow Up</option>
            <option value="employer_call">Employer Call</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Calendar className="h-10 w-10 text-gray-300" />
            <p className="text-gray-500 text-sm">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Practitioner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map(appt => {
                  const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled;
                  const source = SOURCE_CONFIG[appt.booking_source] || SOURCE_CONFIG.staff_manual;
                  const service = SERVICE_CONFIG[appt.service_type] || SERVICE_CONFIG.physio;
                  const StatusIcon = status.icon;
                  const SourceIcon = source.icon;

                  return (
                    <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{appt.patient_name || appt.lead?.first_name + ' ' + appt.lead?.last_name || '—'}</div>
                        <div className="text-xs text-gray-400">{appt.patient_phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.bg} ${service.color}`}>
                          {service.label}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5 capitalize">{appt.appointment_type?.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        {formatDateTime(appt.start_time)}
                        <div className="text-xs text-gray-400">{appt.duration_minutes} min</div>
                      </td>
                      <td className="px-4 py-3">
                        {appt.clinic_location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-gray-700">{appt.clinic_location.name}</span>
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {appt.practitioner ? (
                          <div>
                            <div className="text-gray-700">{appt.practitioner.name}</div>
                            <div className="text-xs text-gray-400">{appt.practitioner.title}</div>
                          </div>
                        ) : <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${source.bg} ${source.color}`}>
                          <SourceIcon className="h-3 w-3" />
                          {source.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {appt.estimated_revenue > 0 ? formatCurrency(appt.estimated_revenue) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={appt.status}
                          onChange={async e => {
                            try {
                              await aiCallAgentService.updateAppointmentStatus(appt.id, e.target.value as AppointmentStatus);
                              setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: e.target.value as AppointmentStatus } : a));
                            } catch {
                              showError('Failed to update status');
                            }
                          }}
                          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none"
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="no_show">No Show</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="reschedule_requested">Reschedule</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-500">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}
