import { useState, useEffect, useCallback } from 'react';
import { CircleAlert as AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { patientPortalService } from '../../services/patientPortalService';
import { patientExperienceService } from '../../services/patientExperienceService';
import type { PatientProfile, PatientAppointment, TreatmentPlan } from '../../services/patientPortalService';
import type {
  PatientExerciseProgram,
  PatientExerciseLog,
  PatientProgressScore,
  PatientSecureMessage,
  PatientBillingSummary,
} from '../../services/patientExperienceService';
import PatientAppShell, { type PatientView } from './PatientAppShell';
import PatientHomeView from './PatientHomeView';
import PatientAppointmentsView from './PatientAppointmentsView';
import PatientExercisesView from './PatientExercisesView';
import PatientProgressView from './PatientProgressView';
import PatientMessagesView from './PatientMessagesView';
import PatientBillingView from './PatientBillingView';
import { PatientEducationPanel } from '../patient/PatientEducationPanel';

export default function PatientExperienceDashboard() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<PatientView>('home');

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [exercisePrograms, setExercisePrograms] = useState<PatientExerciseProgram[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<PatientExerciseLog[]>([]);
  const [progressScores, setProgressScores] = useState<PatientProgressScore[]>([]);
  const [messages, setMessages] = useState<PatientSecureMessage[]>([]);
  const [billing, setBilling] = useState<PatientBillingSummary[]>([]);

  const [profileLoading, setProfileLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [exercisesLoading, setExercisesLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    patientPortalService.getPatientProfile(user.id)
      .then(p => { setProfile(p); setProfileError(null); })
      .catch(() => setProfileError('Unable to load your profile. Please refresh.'))
      .finally(() => setProfileLoading(false));
  }, [user]);

  const loadAppointments = useCallback(() => {
    if (!profile) return;
    setAppointmentsLoading(true);
    patientPortalService.getAppointments(profile.id)
      .then(setAppointments)
      .catch(() => {})
      .finally(() => setAppointmentsLoading(false));
  }, [profile]);

  const loadExercises = useCallback(() => {
    if (!profile) return;
    setExercisesLoading(true);
    Promise.all([
      patientExperienceService.getExercisePrograms(profile.id),
      patientExperienceService.getExerciseLogs(profile.id),
    ])
      .then(([programs, logs]) => { setExercisePrograms(programs); setExerciseLogs(logs); })
      .catch(() => {})
      .finally(() => setExercisesLoading(false));
  }, [profile]);

  const loadProgress = useCallback(() => {
    if (!profile) return;
    setProgressLoading(true);
    patientExperienceService.getProgressScores(profile.id)
      .then(setProgressScores)
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  }, [profile]);

  const loadMessages = useCallback(() => {
    if (!profile) return;
    setMessagesLoading(true);
    patientExperienceService.getMessages(profile.id)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setMessagesLoading(false));
  }, [profile]);

  const loadBilling = useCallback(() => {
    if (!profile) return;
    setBillingLoading(true);
    patientExperienceService.getBillingSummaries(profile.id)
      .then(setBilling)
      .catch(() => {})
      .finally(() => setBillingLoading(false));
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    patientPortalService.getTreatmentPlans(profile.id).then(setTreatmentPlans).catch(() => {});
    loadAppointments();
    loadExercises();
    loadProgress();
    loadMessages();
    loadBilling();
  }, [profile, loadAppointments, loadExercises, loadProgress, loadMessages, loadBilling]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Patient Profile Not Found</h2>
          <p className="text-sm text-gray-500">{profileError ?? 'No patient profile is linked to your account. Please contact your clinic.'}</p>
        </div>
      </div>
    );
  }

  const nextAppointment = appointments.find(a => {
    const d = new Date(a.appointment_date);
    return d >= new Date() && a.status !== 'cancelled';
  }) ?? null;

  const activePlans = treatmentPlans.filter(p => p.status === 'active');
  const latestProgress = progressScores[0] ?? null;
  const unreadMessages = messages.filter(m => !m.is_read && m.sender_type === 'staff').length;
  const outstandingBalance = billing.reduce((sum, b) => sum + (b.amount_outstanding ?? 0), 0);

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return (
          <PatientHomeView
            profile={profile}
            nextAppointment={nextAppointment}
            activePlans={activePlans}
            latestProgress={latestProgress}
            unreadMessages={unreadMessages}
            outstandingBalance={outstandingBalance}
            onNavigate={setActiveView}
          />
        );
      case 'appointments':
        return (
          <PatientAppointmentsView
            appointments={appointments}
            loading={appointmentsLoading}
            onRefresh={loadAppointments}
          />
        );
      case 'exercises':
        return (
          <PatientExercisesView
            programs={exercisePrograms}
            logs={exerciseLogs}
            patientId={profile.id}
            loading={exercisesLoading}
            onLogExercise={async log => {
              await patientExperienceService.logExercise(log);
              loadExercises();
            }}
            onRefresh={loadExercises}
          />
        );
      case 'progress':
        return (
          <PatientProgressView
            scores={progressScores}
            patientId={profile.id}
            loading={progressLoading}
            onAddScore={async score => {
              await patientExperienceService.addProgressScore(score);
              loadProgress();
            }}
            onRefresh={loadProgress}
          />
        );
      case 'messages':
        return (
          <PatientMessagesView
            messages={messages}
            patientId={profile.id}
            patientName={`${profile.first_name} ${profile.last_name}`}
            loading={messagesLoading}
            onSend={async msg => {
              await patientExperienceService.sendMessage({
                patient_id: profile.id,
                sender_type: 'patient',
                sender_name: `${profile.first_name} ${profile.last_name}`,
                subject: msg.subject,
                body: msg.body,
                priority: (msg.priority as 'normal' | 'urgent' | 'low') ?? 'normal',
                thread_id: msg.thread_id,
              });
              loadMessages();
            }}
            onMarkRead={async id => {
              await patientExperienceService.markMessageRead(id);
              setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
            }}
            onRefresh={loadMessages}
          />
        );
      case 'billing':
        return (
          <PatientBillingView
            summaries={billing}
            loading={billingLoading}
            onRefresh={loadBilling}
          />
        );
      case 'education':
        return <PatientEducationPanel />;
      default:
        return null;
    }
  };

  return (
    <PatientAppShell
      profile={profile}
      activeView={activeView}
      onViewChange={setActiveView}
      unreadMessages={unreadMessages}
    >
      {renderView()}
    </PatientAppShell>
  );
}
