import { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, CheckCircle, XCircle, FileText, Edit,
  Save, Plus, Settings, Menu, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clinicianMobileService, AppointmentForCheckIn, QuickNote, ClinicianAvailability } from '../../services/clinicianMobileService';

type ViewType = 'schedule' | 'notes' | 'availability';

export default function ClinicianMobileDashboard() {
  const { user, profile } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('schedule');
  const [todaysAppointments, setTodaysAppointments] = useState<AppointmentForCheckIn[]>([]);
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [availability, setAvailability] = useState<ClinicianAvailability[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedDate]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [appts, notes, avail] = await Promise.all([
        clinicianMobileService.getTodaysAppointments(user.id),
        clinicianMobileService.getQuickNotes(user.id, { limit: 10 }),
        clinicianMobileService.getAvailability(user.id)
      ]);

      setTodaysAppointments(appts);
      setQuickNotes(notes);
      setAvailability(avail);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await clinicianMobileService.checkInPatient(appointmentId);
      await loadData();
    } catch (error) {
      console.error('Error checking in patient:', error);
      alert('Failed to check in patient');
    }
  };

  const handleCheckOut = async (appointmentId: string) => {
    try {
      await clinicianMobileService.checkOutPatient(appointmentId);
      await loadData();
    } catch (error) {
      console.error('Error checking out patient:', error);
      alert('Failed to check out patient');
    }
  };

  const handleSaveNote = async () => {
    if (!user || !newNoteText.trim()) return;

    try {
      await clinicianMobileService.createQuickNote({
        clinician_id: user.id,
        patient_id: selectedPatientId || undefined,
        appointment_id: selectedAppointmentId || undefined,
        note_type: 'clinical',
        note_text: newNoteText,
        tags: [],
        is_draft: false
      });

      setNewNoteText('');
      setSelectedPatientId('');
      setSelectedAppointmentId('');
      await loadData();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'checked_in':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderSchedule = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Today's Schedule</h2>
        <p className="text-blue-100">{todaysAppointments.length} appointments</p>
      </div>

      <div className="space-y-3">
        {todaysAppointments.map((apt) => (
          <div key={apt.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {apt.patient.first_name} {apt.patient.last_name}
                </h3>
                <p className="text-sm text-gray-600">MRN: {apt.patient.medical_record_number}</p>
                <p className="text-sm text-gray-600 mt-1">{apt.appointment_type}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                {apt.status.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
              </span>
            </div>

            {apt.reason_for_visit && (
              <p className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                {apt.reason_for_visit}
              </p>
            )}

            <div className="flex space-x-2">
              {apt.status === 'scheduled' || apt.status === 'confirmed' ? (
                <button
                  onClick={() => handleCheckIn(apt.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Check In</span>
                </button>
              ) : apt.status === 'checked_in' || apt.status === 'in_progress' ? (
                <button
                  onClick={() => handleCheckOut(apt.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Check Out</span>
                </button>
              ) : null}

              <button
                onClick={() => {
                  setSelectedPatientId(apt.patient_id);
                  setSelectedAppointmentId(apt.id);
                  setCurrentView('notes');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Add Note</span>
              </button>
            </div>
          </div>
        ))}
        {todaysAppointments.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No appointments today</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Create Quick Note</h3>
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Enter note text..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleSaveNote}
          disabled={!newNoteText.trim()}
          className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Note</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Recent Notes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {quickNotes.map((note) => (
            <div key={note.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {note.note_type}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{note.note_text}</p>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {quickNotes.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notes yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAvailability = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold text-gray-900 mb-3">My Availability</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your weekly availability schedule
        </p>
      </div>

      <div className="space-y-3">
        {availability.map((avail) => (
          <div key={avail.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{getDayName(avail.day_of_week)}</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                avail.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {avail.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{formatTime(avail.start_time)} - {formatTime(avail.end_time)}</span>
            </div>
            {avail.notes && (
              <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">{avail.notes}</p>
            )}
          </div>
        ))}
        {availability.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No availability set</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'schedule':
        return renderSchedule();
      case 'notes':
        return renderNotes();
      case 'availability':
        return renderAvailability();
      default:
        return renderSchedule();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Clinician Mobile</h1>
              <p className="text-xs text-gray-600">Dr. {profile?.last_name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className={`${menuOpen ? 'block' : 'hidden'} lg:block border-t border-gray-200`}>
          <nav className="flex overflow-x-auto">
            <button
              onClick={() => {
                setCurrentView('schedule');
                setMenuOpen(false);
              }}
              className={`flex-1 lg:flex-none px-6 py-3 font-medium text-sm whitespace-nowrap ${
                currentView === 'schedule'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Schedule
            </button>
            <button
              onClick={() => {
                setCurrentView('notes');
                setMenuOpen(false);
              }}
              className={`flex-1 lg:flex-none px-6 py-3 font-medium text-sm whitespace-nowrap ${
                currentView === 'notes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Quick Notes
            </button>
            <button
              onClick={() => {
                setCurrentView('availability');
                setMenuOpen(false);
              }}
              className={`flex-1 lg:flex-none px-6 py-3 font-medium text-sm whitespace-nowrap ${
                currentView === 'availability'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Availability
            </button>
          </nav>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
}
