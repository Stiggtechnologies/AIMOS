import { useState } from 'react';
import { Calendar, Clock, Plus, ChevronRight, CircleCheck as CheckCircle, X, RefreshCw } from 'lucide-react';
import type { PatientAppointment } from '../../services/patientPortalService';
import BookingFlow from '../public-booking/BookingFlow';

interface PatientAppointmentsViewProps {
  appointments: PatientAppointment[];
  loading: boolean;
  onRefresh: () => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
}
function formatTime(t: string) {
  return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const STATUS_STYLES: Record<string, string> = {
  scheduled:  'bg-blue-100 text-blue-800',
  confirmed:  'bg-green-100 text-green-800',
  completed:  'bg-gray-100 text-gray-700',
  cancelled:  'bg-red-100 text-red-800',
  no_show:    'bg-orange-100 text-orange-800',
};

export default function PatientAppointmentsView({ appointments, loading, onRefresh }: PatientAppointmentsViewProps) {
  const [showBooking, setShowBooking] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const now = new Date();

  const filtered = appointments.filter(a => {
    const d = new Date(a.appointment_date);
    if (filter === 'upcoming') return d >= now && a.status !== 'cancelled';
    if (filter === 'past') return d < now || a.status === 'completed';
    return true;
  });

  if (showBooking) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
          <button onClick={() => setShowBooking(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <BookingFlow />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Appointments</h2>
        <button
          onClick={() => setShowBooking(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Book
        </button>
      </div>

      <div className="flex gap-2">
        {(['upcoming', 'past', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
        <button onClick={onRefresh} className="ml-auto p-1.5 text-gray-400 hover:text-gray-700">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No {filter === 'all' ? '' : filter} appointments</p>
          {filter === 'upcoming' && (
            <button onClick={() => setShowBooking(true)} className="mt-3 text-sm text-blue-600 font-semibold">
              Book your next visit
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => (
            <div key={apt.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-start gap-4">
              <div className="w-12 h-14 rounded-xl bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600 leading-tight">
                  {new Date(apt.appointment_date).toLocaleDateString('en-CA', { month: 'short' }).toUpperCase()}
                </span>
                <span className="text-xl font-bold text-blue-700 leading-tight">
                  {new Date(apt.appointment_date).getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{apt.appointment_type}</p>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[apt.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {apt.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(apt.appointment_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(apt.start_time)}
                  </span>
                </div>
                {apt.reason_for_visit && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{apt.reason_for_visit}</p>
                )}
              </div>
              {apt.status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
