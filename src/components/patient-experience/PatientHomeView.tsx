import { Calendar, Dumbbell, TrendingUp, MessageSquare, CreditCard, ChevronRight, Activity, BookOpen } from 'lucide-react';
import type { PatientProfile, PatientAppointment, TreatmentPlan } from '../../services/patientPortalService';
import type { PatientProgressScore } from '../../services/patientExperienceService';
import type { PatientView } from './PatientAppShell';

interface PatientHomeViewProps {
  profile: PatientProfile;
  nextAppointment: PatientAppointment | null;
  activePlans: TreatmentPlan[];
  latestProgress: PatientProgressScore | null;
  unreadMessages: number;
  outstandingBalance: number;
  onNavigate: (v: PatientView) => void;
}

function getDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(t: string) {
  return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function PatientHomeView({
  profile,
  nextAppointment,
  activePlans,
  latestProgress,
  unreadMessages,
  outstandingBalance,
  onNavigate,
}: PatientHomeViewProps) {
  const plan = activePlans[0] ?? null;

  const quickActions: { view: PatientView; icon: React.ElementType; label: string; desc: string; color: string }[] = [
    { view: 'appointments', icon: Calendar, label: 'Appointments', desc: 'View & book visits', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { view: 'exercises', icon: Dumbbell, label: 'Exercises', desc: 'Track your program', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { view: 'progress', icon: TrendingUp, label: 'My Progress', desc: 'Log & review scores', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { view: 'messages', icon: MessageSquare, label: 'Messages', desc: 'Contact your clinic', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { view: 'billing', icon: CreditCard, label: 'Billing', desc: 'Invoices & payments', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { view: 'education', icon: BookOpen, label: 'Education', desc: 'Recovery resources', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-md">
        <p className="text-blue-100 text-sm font-medium mb-1">{getDayGreeting()}</p>
        <h1 className="text-2xl font-bold mb-1">{profile.first_name} {profile.last_name}</h1>
        <p className="text-blue-100 text-sm">Your recovery journey continues today.</p>
        {latestProgress && (
          <div className="mt-4 bg-white/15 rounded-xl px-4 py-3 flex items-center gap-3">
            <Activity className="w-5 h-5 text-white/80" />
            <div>
              <p className="text-xs text-blue-100">Last pain check-in</p>
              <p className="font-semibold">
                Pain {latestProgress.pain_score}/10 · Function {latestProgress.function_score}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alerts row */}
      {(unreadMessages > 0 || outstandingBalance > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {unreadMessages > 0 && (
            <button
              onClick={() => onNavigate('messages')}
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left hover:bg-amber-100 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">{unreadMessages} unread message{unreadMessages > 1 ? 's' : ''}</p>
                <p className="text-xs text-amber-700">Tap to view</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </button>
          )}
          {outstandingBalance > 0 && (
            <button
              onClick={() => onNavigate('billing')}
              className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-left hover:bg-rose-100 transition-colors"
            >
              <CreditCard className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-900">${outstandingBalance.toFixed(2)} outstanding</p>
                <p className="text-xs text-rose-700">Payment due</p>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-500" />
            </button>
          )}
        </div>
      )}

      {/* Next appointment card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-base font-semibold text-gray-900">Next Appointment</h2>
          <button onClick={() => onNavigate('appointments')} className="text-xs text-blue-600 font-medium">View all</button>
        </div>
        {nextAppointment ? (
          <button
            onClick={() => onNavigate('appointments')}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-blue-700 leading-tight">
                {new Date(nextAppointment.appointment_date).toLocaleDateString('en-CA', { month: 'short' }).toUpperCase()}
              </span>
              <span className="text-lg font-bold text-blue-700 leading-tight">
                {new Date(nextAppointment.appointment_date).getDate()}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 text-sm">{nextAppointment.appointment_type}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(nextAppointment.appointment_date)}</p>
              <p className="text-xs text-gray-500">{formatTime(nextAppointment.start_time)} – {formatTime(nextAppointment.end_time)}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              nextAppointment.status === 'confirmed' || nextAppointment.status === 'scheduled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
            }`}>
              {nextAppointment.status}
            </span>
          </button>
        ) : (
          <div className="px-5 py-6 text-center border-t border-gray-100">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No upcoming appointments</p>
            <button onClick={() => onNavigate('appointments')} className="mt-3 text-sm text-blue-600 font-medium">Book now</button>
          </div>
        )}
      </div>

      {/* Active treatment plan */}
      {plan && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Active Treatment Plan</h2>
          <div className="bg-teal-50 rounded-xl px-4 py-3">
            <p className="font-semibold text-teal-900 text-sm">{plan.diagnosis}</p>
            {plan.treatment_goals && <p className="text-xs text-teal-700 mt-1">{plan.treatment_goals}</p>}
            <p className="text-xs text-teal-600 mt-2">Started {new Date(plan.start_date).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {/* Quick actions grid */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.view}
                onClick={() => onNavigate(action.view)}
                className={`flex flex-col items-start gap-2 p-4 rounded-2xl border ${action.color} hover:opacity-80 transition-all text-left`}
              >
                <Icon className="w-5 h-5" />
                <div>
                  <p className="text-sm font-semibold leading-tight">{action.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{action.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
