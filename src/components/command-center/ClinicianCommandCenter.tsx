import { useState, useEffect } from 'react';
import { Clock, FileText, Activity, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Brain, TrendingUp, Dumbbell, ClipboardList, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ClinicianCommandCenterProps {
  onNavigate: (module: string, subModule: string) => void;
}

interface TodayPatient {
  id: string;
  time: string;
  name: string;
  caseType: string;
  visitNumber: number;
  goals: string[];
  flags: ('progress_concern' | 'reassessment_due' | 'low_adherence' | 'new_patient')[];
  lastVisit: string;
}

interface PendingNote {
  id: string;
  patientName: string;
  visitDate: string;
  visitType: string;
  ageHours: number;
}

interface ReassessmentDue {
  id: string;
  patientName: string;
  caseType: string;
  dueDate: string;
  daysPastDue: number;
  outcomeMeasures: string[];
}

interface AdherenceAlert {
  id: string;
  patientName: string;
  program: string;
  adherenceRate: number;
  lastActivity: string;
}

interface ClinicalInsight {
  id: string;
  type: 'progress' | 'adherence' | 'outcome' | 'recommendation';
  patientName: string;
  title: string;
  description: string;
  confidence: number;
  suggestedAction: string;
}

export function ClinicianCommandCenter({ onNavigate }: ClinicianCommandCenterProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [todayPatients] = useState<TodayPatient[]>([
    {
      id: '1', time: '10:30 AM', name: 'Sarah Johnson', caseType: 'ACL Reconstruction',
      visitNumber: 8, goals: ['ROM improvement', 'Strength building'],
      flags: ['reassessment_due'], lastVisit: '3 days ago'
    },
    {
      id: '2', time: '11:00 AM', name: 'Michael Chen', caseType: 'Initial Assessment',
      visitNumber: 1, goals: ['Pain assessment', 'Treatment planning'],
      flags: ['new_patient'], lastVisit: 'N/A'
    },
    {
      id: '3', time: '11:30 AM', name: 'Emma Wilson', caseType: 'Chronic Low Back Pain',
      visitNumber: 12, goals: ['Core stability', 'Return to work'],
      flags: ['progress_concern', 'low_adherence'], lastVisit: '1 week ago'
    },
    {
      id: '4', time: '1:00 PM', name: 'James Anderson', caseType: 'Shoulder Impingement',
      visitNumber: 5, goals: ['Overhead mobility', 'Rotator cuff strengthening'],
      flags: [], lastVisit: '2 days ago'
    },
    {
      id: '5', time: '1:30 PM', name: 'Lisa Thompson', caseType: 'Post-op Hip Replacement',
      visitNumber: 6, goals: ['Gait training', 'Stair negotiation'],
      flags: [], lastVisit: '3 days ago'
    },
  ]);

  const [pendingNotes] = useState<PendingNote[]>([
    { id: '1', patientName: 'Robert Kim', visitDate: 'Yesterday', visitType: 'Follow-up', ageHours: 18 },
    { id: '2', patientName: 'Amanda Lee', visitDate: 'Yesterday', visitType: 'Initial Assessment', ageHours: 22 },
  ]);

  const [reassessmentsDue] = useState<ReassessmentDue[]>([
    { id: '1', patientName: 'Sarah Johnson', caseType: 'ACL Reconstruction', dueDate: 'Today', daysPastDue: 0, outcomeMeasures: ['IKDC', 'LEFS'] },
    { id: '2', patientName: 'David Brown', caseType: 'Rotator Cuff Repair', dueDate: '2 days ago', daysPastDue: 2, outcomeMeasures: ['QuickDASH', 'SPADI'] },
    { id: '3', patientName: 'Jennifer Martinez', caseType: 'Total Knee Replacement', dueDate: '1 week ago', daysPastDue: 7, outcomeMeasures: ['KOOS', 'TUG'] },
  ]);

  const [adherenceAlerts] = useState<AdherenceAlert[]>([
    { id: '1', patientName: 'Emma Wilson', program: 'Core Stability Program', adherenceRate: 35, lastActivity: '5 days ago' },
    { id: '2', patientName: 'Chris Taylor', program: 'Home Exercise Program', adherenceRate: 42, lastActivity: '4 days ago' },
  ]);

  const [insights] = useState<ClinicalInsight[]>([
    {
      id: '1', type: 'progress', patientName: 'Emma Wilson',
      title: 'Progress slower than expected',
      description: 'Pain scores unchanged across last 3 visits. Exercise adherence at 35%.',
      confidence: 82,
      suggestedAction: 'Consider reassessment and exercise modification'
    },
    {
      id: '2', type: 'outcome', patientName: 'Sarah Johnson',
      title: 'Outcome measure trending positive',
      description: 'IKDC improved 18 points since initial. On track for discharge criteria.',
      confidence: 88,
      suggestedAction: 'Schedule reassessment to document progress'
    },
    {
      id: '3', type: 'recommendation', patientName: 'James Anderson',
      title: 'Progression opportunity',
      description: 'Patient meeting all phase 2 criteria. Consider advancing program.',
      confidence: 91,
      suggestedAction: 'Progress to phase 3 exercises'
    },
  ]);

  const getFlagColor = (flag: TodayPatient['flags'][0]) => {
    const colors = {
      progress_concern: 'bg-red-100 text-red-700',
      reassessment_due: 'bg-amber-100 text-amber-700',
      low_adherence: 'bg-orange-100 text-orange-700',
      new_patient: 'bg-blue-100 text-blue-700'
    };
    return colors[flag];
  };

  const getFlagLabel = (flag: TodayPatient['flags'][0]) => {
    const labels = {
      progress_concern: 'Progress Concern',
      reassessment_due: 'Reassess Due',
      low_adherence: 'Low Adherence',
      new_patient: 'New Patient'
    };
    return labels[flag];
  };

  const getInsightIcon = (type: ClinicalInsight['type']) => {
    const icons = {
      progress: AlertTriangle,
      adherence: Dumbbell,
      outcome: TrendingUp,
      recommendation: Brain
    };
    return icons[type];
  };

  const getInsightColor = (type: ClinicalInsight['type']) => {
    const colors = {
      progress: 'text-amber-500',
      adherence: 'text-orange-500',
      outcome: 'text-emerald-500',
      recommendation: 'text-blue-500'
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinician Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} -
            Welcome back, {profile?.first_name || 'Dr.'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{todayPatients.length}</div>
            <div className="text-xs text-gray-500">Patients Today</div>
          </div>
          <button
            onClick={() => setLoading(true)}
            disabled={loading}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Urgent Alerts Row */}
      {(pendingNotes.length > 0 || reassessmentsDue.filter(r => r.daysPastDue > 0).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingNotes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-800">Unsigned Notes</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">{pendingNotes.length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {pendingNotes.map(note => (
                  <div key={note.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-amber-900">{note.patientName}</span>
                      <span className="text-xs text-amber-700 ml-2">{note.visitType} - {note.visitDate}</span>
                    </div>
                    <button className="text-sm text-amber-700 font-medium hover:text-amber-800">
                      Sign <ArrowRight className="h-3 w-3 inline" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adherenceAlerts.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Dumbbell className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-orange-800">Low Adherence</span>
                  <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs rounded-full">{adherenceAlerts.length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {adherenceAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-orange-900">{alert.patientName}</span>
                      <span className="text-xs text-orange-700 ml-2">{alert.adherenceRate}% - Last: {alert.lastActivity}</span>
                    </div>
                    <button className="text-sm text-orange-700 font-medium hover:text-orange-800">
                      Contact <ArrowRight className="h-3 w-3 inline" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Patients */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Today's Patients</h2>
            </div>
            <button
              onClick={() => onNavigate('clinical', 'patients')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {todayPatients.map(patient => (
              <div key={patient.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-gray-500 w-20">{patient.time}</span>
                      <span className="font-medium text-gray-900">{patient.name}</span>
                      {patient.flags.map(flag => (
                        <span key={flag} className={`px-2 py-0.5 text-xs rounded-full ${getFlagColor(flag)}`}>
                          {getFlagLabel(flag)}
                        </span>
                      ))}
                    </div>
                    <div className="ml-20 mt-1">
                      <div className="text-sm text-gray-600">
                        {patient.caseType} - Visit #{patient.visitNumber}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Goals: {patient.goals.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onNavigate('clinical', 'cases')}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                    >
                      Open Case
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100">
                      Start Note
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reassessments Due */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Reassessments Due</h2>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
              {reassessmentsDue.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {reassessmentsDue.map(reassess => (
              <div key={reassess.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{reassess.patientName}</span>
                  {reassess.daysPastDue > 0 ? (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                      {reassess.daysPastDue}d overdue
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      Due today
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{reassess.caseType}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {reassess.outcomeMeasures.map(measure => (
                    <span key={measure} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {measure}
                    </span>
                  ))}
                </div>
                <button className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700">
                  Schedule Reassessment <ArrowRight className="h-3 w-3 inline" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Clinical Insights */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-blue-400" />
          <h2 className="font-semibold text-lg">AI Clinical Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map(insight => {
            const Icon = getInsightIcon(insight.type);
            return (
              <div key={insight.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className={`h-4 w-4 ${getInsightColor(insight.type)}`} />
                  <span className="text-sm font-medium text-gray-300">{insight.patientName}</span>
                </div>
                <p className="text-sm font-medium mb-1">{insight.title}</p>
                <p className="text-xs text-gray-400 mb-2">{insight.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-400">{insight.confidence}% confidence</span>
                  <button className="text-xs text-blue-400 hover:text-blue-300">
                    {insight.suggestedAction} <ArrowRight className="h-3 w-3 inline" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('clinical', 'assessments')}
          className="flex items-center justify-center space-x-2 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <ClipboardList className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-gray-700">New Assessment</span>
        </button>
        <button
          onClick={() => onNavigate('clinical', 'exercises')}
          className="flex items-center justify-center space-x-2 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <Dumbbell className="h-5 w-5 text-emerald-500" />
          <span className="font-medium text-gray-700">Exercise Library</span>
        </button>
        <button
          onClick={() => onNavigate('clinical', 'outcomes')}
          className="flex items-center justify-center space-x-2 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <Activity className="h-5 w-5 text-amber-500" />
          <span className="font-medium text-gray-700">Outcomes</span>
        </button>
        <button
          onClick={() => onNavigate('clinical', 'documents')}
          className="flex items-center justify-center space-x-2 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Templates</span>
        </button>
      </div>
    </div>
  );
}
