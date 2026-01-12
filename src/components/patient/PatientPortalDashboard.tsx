import { useState, useEffect } from 'react';
import {
  Calendar, FileText, MessageSquare, Clipboard, User, LogOut,
  Clock, AlertCircle, Download, Send, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { patientPortalService, PatientProfile, PatientAppointment, PatientDocument, PatientMessage, TreatmentPlan } from '../../services/patientPortalService';

type ViewType = 'dashboard' | 'appointments' | 'documents' | 'messages' | 'treatment-plans' | 'profile';

export default function PatientPortalDashboard() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [messages, setMessages] = useState<PatientMessage[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPatientData();
    }
  }, [user]);

  const loadPatientData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const patientProfile = await patientPortalService.getPatientProfile(user.id);

      if (patientProfile) {
        setProfile(patientProfile);

        const [appts, docs, msgs, plans] = await Promise.all([
          patientPortalService.getAppointments(patientProfile.id, { limit: 5 }),
          patientPortalService.getDocuments(patientProfile.id, { limit: 5 }),
          patientPortalService.getMessages(patientProfile.id, { limit: 5 }),
          patientPortalService.getTreatmentPlans(patientProfile.id)
        ]);

        setAppointments(appts);
        setDocuments(docs);
        setMessages(msgs);
        setTreatmentPlans(plans);

        await patientPortalService.logAccess(patientProfile.id, 'portal_login');
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your health portal...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Please contact your healthcare provider to set up your portal access.</p>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const navigation = [
    { key: 'dashboard', label: 'Dashboard', icon: User },
    { key: 'appointments', label: 'Appointments', icon: Calendar },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'treatment-plans', label: 'Treatment Plans', icon: Clipboard }
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome, {profile.first_name}!</h2>
        <p className="text-blue-100">Here's your health summary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Next Appointment</h3>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          {appointments.length > 0 ? (
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatDate(appointments[0].appointment_date)}</p>
              <p className="text-sm text-gray-600">{formatTime(appointments[0].start_time)}</p>
              <p className="text-sm text-gray-600 mt-2">{appointments[0].appointment_type}</p>
            </div>
          ) : (
            <p className="text-gray-500">No upcoming appointments</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Unread Messages</h3>
            <MessageSquare className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {messages.filter(m => !m.is_read).length}
          </p>
          <p className="text-sm text-gray-600">New messages</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">New Documents</h3>
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {documents.filter(d => !d.viewed_by_patient_at).length}
          </p>
          <p className="text-sm text-gray-600">Unviewed documents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h3>
          <div className="space-y-3">
            {appointments.slice(0, 3).map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{apt.appointment_type}</p>
                  <p className="text-sm text-gray-600">{formatDate(apt.appointment_date)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                  {apt.status}
                </span>
              </div>
            ))}
            {appointments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No appointments found</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Treatment Plans</h3>
          <div className="space-y-3">
            {treatmentPlans.filter(p => p.status === 'active').map((plan) => (
              <div key={plan.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{plan.diagnosis}</p>
                <p className="text-sm text-gray-600 mt-1">{plan.treatment_goals}</p>
                <p className="text-xs text-gray-500 mt-2">Started: {formatDate(plan.start_date)}</p>
              </div>
            ))}
            {treatmentPlans.filter(p => p.status === 'active').length === 0 && (
              <p className="text-gray-500 text-center py-4">No active treatment plans</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">My Appointments</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {appointments.map((apt) => (
          <div key={apt.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{apt.appointment_type}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(apt.appointment_date)}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                  </span>
                </div>
                {apt.reason_for_visit && (
                  <p className="mt-2 text-sm text-gray-600">{apt.reason_for_visit}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {appointments.length === 0 && (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No appointments found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">My Documents</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {documents.map((doc) => (
          <div key={doc.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                    {!doc.viewed_by_patient_at && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">New</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{doc.document_type.replace('_', ' ')}</p>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">{formatDate(doc.created_at)}</p>
                </div>
              </div>
              <button className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No documents available</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Send className="w-4 h-4" />
            <span>New Message</span>
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {messages.map((msg) => (
          <div key={msg.id} className={`p-6 hover:bg-gray-50 ${!msg.is_read ? 'bg-blue-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{msg.subject}</h3>
                  {!msg.is_read && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Unread</span>
                  )}
                  {msg.priority === 'urgent' && (
                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">Urgent</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{msg.message}</p>
                <p className="text-xs text-gray-500">{formatDate(msg.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTreatmentPlans = () => (
    <div className="space-y-6">
      {treatmentPlans.map((plan) => (
        <div key={plan.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{plan.diagnosis}</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                plan.status === 'active' ? 'bg-green-100 text-green-800' :
                plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {plan.status}
              </span>
            </div>
          </div>

          {plan.treatment_goals && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Treatment Goals</h4>
              <p className="text-gray-600">{plan.treatment_goals}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium text-gray-900">{formatDate(plan.start_date)}</p>
            </div>
            {plan.end_date && (
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium text-gray-900">{formatDate(plan.end_date)}</p>
              </div>
            )}
          </div>

          {plan.progress_notes && plan.progress_notes.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Progress Notes</h4>
              <div className="space-y-2">
                {plan.progress_notes.map((note: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{note.note || note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      {treatmentPlans.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clipboard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No treatment plans available</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'appointments':
        return renderAppointments();
      case 'documents':
        return renderDocuments();
      case 'messages':
        return renderMessages();
      case 'treatment-plans':
        return renderTreatmentPlans();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-sm text-gray-600">{profile.first_name} {profile.last_name}</p>
          <p className="text-xs text-gray-500">MRN: {profile.medical_record_number}</p>
        </div>

        <nav className="p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key as ViewType)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  );
}
