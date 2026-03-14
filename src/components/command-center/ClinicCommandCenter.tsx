import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, DollarSign, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Phone, MessageCircle, TrendingUp, Star, RefreshCw, UserPlus, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ClinicCommandCenterProps {
  onNavigate: (module: string, subModule: string) => void;
}

interface TodayAppointment {
  id: string;
  time: string;
  patientName: string;
  service: string;
  provider: string;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'no_show';
  isNew: boolean;
  hasInsurance: boolean;
}

interface StaffGap {
  id: string;
  date: string;
  shift: string;
  role: string;
  urgency: 'critical' | 'high' | 'medium';
}

interface ClinicTask {
  id: string;
  title: string;
  type: 'intake' | 'claims' | 'followup' | 'launch';
  dueTime: string;
  priority: 'high' | 'medium' | 'low';
}

export function ClinicCommandCenter({ onNavigate }: ClinicCommandCenterProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [todayStats] = useState({
    totalAppointments: 42,
    completed: 18,
    remaining: 24,
    openSlots: 6,
    noShows: 2,
    staffOnDuty: 8,
    roomsAvailable: 3,
    roomConflicts: 1
  });

  const [upcomingAppointments] = useState<TodayAppointment[]>([
    { id: '1', time: '10:30 AM', patientName: 'Sarah Johnson', service: 'PT Follow-up', provider: 'Dr. Smith', status: 'scheduled', isNew: false, hasInsurance: true },
    { id: '2', time: '10:45 AM', patientName: 'Michael Chen', service: 'Initial Assessment', provider: 'Dr. Lee', status: 'checked_in', isNew: true, hasInsurance: true },
    { id: '3', time: '11:00 AM', patientName: 'Emma Wilson', service: 'Massage Therapy', provider: 'J. Brown', status: 'scheduled', isNew: false, hasInsurance: false },
    { id: '4', time: '11:15 AM', patientName: 'James Anderson', service: 'PT Follow-up', provider: 'Dr. Smith', status: 'scheduled', isNew: false, hasInsurance: true },
    { id: '5', time: '11:30 AM', patientName: 'Lisa Thompson', service: 'Shockwave', provider: 'Dr. Lee', status: 'scheduled', isNew: false, hasInsurance: true },
  ]);

  const [staffGaps] = useState<StaffGap[]>([
    { id: '1', date: 'Tomorrow', shift: 'Morning', role: 'RMT', urgency: 'critical' },
    { id: '2', date: 'Friday', shift: 'Afternoon', role: 'PT', urgency: 'high' },
  ]);

  const [tasks] = useState<ClinicTask[]>([
    { id: '1', title: 'Complete intake for Michael Chen', type: 'intake', dueTime: 'Before 10:45 AM', priority: 'high' },
    { id: '2', title: 'Submit 3 pending WSIB claims', type: 'claims', dueTime: 'Today', priority: 'high' },
    { id: '3', title: 'Follow up with inactive patients (5)', type: 'followup', dueTime: 'Today', priority: 'medium' },
    { id: '4', title: 'Confirm equipment delivery', type: 'launch', dueTime: 'Today', priority: 'medium' },
  ]);

  const [revenueToday] = useState({
    collected: 4250,
    outstanding: 1850,
    claimsPending: 12,
    claimsToSubmit: 5
  });

  const [growthSnapshot] = useState({
    trainerReferrals: 3,
    reviewRequests: 8,
    reviewsCompleted: 5,
    newLeads: 4
  });

  const getStatusColor = (status: TodayAppointment['status']) => {
    const colors = {
      scheduled: 'bg-gray-100 text-gray-700',
      checked_in: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-amber-100 text-amber-700',
      completed: 'bg-emerald-100 text-emerald-700',
      no_show: 'bg-red-100 text-red-700'
    };
    return colors[status];
  };

  const getTaskTypeIcon = (type: ClinicTask['type']) => {
    const icons = {
      intake: FileText,
      claims: DollarSign,
      followup: Phone,
      launch: CheckCircle
    };
    const Icon = icons[type];
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - {profile?.clinic_name || 'AIM South Commons'}
          </p>
        </div>
        <button
          onClick={() => setLoading(true)}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Today Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{todayStats.totalAppointments}</div>
          <div className="text-xs text-gray-500">Total Appts</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{todayStats.completed}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{todayStats.remaining}</div>
          <div className="text-xs text-gray-500">Remaining</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{todayStats.openSlots}</div>
          <div className="text-xs text-gray-500">Open Slots</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{todayStats.noShows}</div>
          <div className="text-xs text-gray-500">No-Shows</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{todayStats.staffOnDuty}</div>
          <div className="text-xs text-gray-500">Staff On Duty</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{todayStats.roomsAvailable}</div>
          <div className="text-xs text-gray-500">Rooms Free</div>
        </div>
        <div className={`rounded-lg border p-3 text-center ${todayStats.roomConflicts > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className={`text-2xl font-bold ${todayStats.roomConflicts > 0 ? 'text-red-600' : 'text-gray-900'}`}>{todayStats.roomConflicts}</div>
          <div className="text-xs text-gray-500">Room Conflicts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Next Appointments</h2>
            </div>
            <button
              onClick={() => onNavigate('operations', 'schedule')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Full Schedule
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingAppointments.map(appt => (
              <div key={appt.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center w-16">
                    <div className="text-sm font-semibold text-gray-900">{appt.time}</div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{appt.patientName}</span>
                      {appt.isNew && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">NEW</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{appt.service} with {appt.provider}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appt.status)}`}>
                    {appt.status.replace('_', ' ')}
                  </span>
                  <div className="flex space-x-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Check In">
                      <CheckCircle className="h-4 w-4 text-gray-400 hover:text-emerald-500" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Message">
                      <MessageCircle className="h-4 w-4 text-gray-400 hover:text-blue-500" />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg" title="Reschedule">
                      <Calendar className="h-4 w-4 text-gray-400 hover:text-amber-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks & Alerts */}
        <div className="space-y-6">
          {/* Staff Gaps Alert */}
          {staffGaps.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold text-red-800">Staffing Gaps</h3>
              </div>
              <div className="space-y-2">
                {staffGaps.map(gap => (
                  <div key={gap.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-700">{gap.date} {gap.shift} - {gap.role}</span>
                    <button className="text-red-600 font-medium hover:text-red-700">
                      Fill <ArrowRight className="h-3 w-3 inline" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Queue */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <h2 className="font-semibold text-gray-900">Tasks</h2>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{tasks.length}</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {tasks.map(task => (
                <div key={task.id} className="p-4 flex items-start space-x-3">
                  <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{task.dueTime}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  {getTaskTypeIcon(task.type)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue & Growth Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Today */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <h2 className="font-semibold text-gray-900">Revenue Today</h2>
            </div>
            <button
              onClick={() => onNavigate('revenue', 'dashboard')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View Details
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-700">${revenueToday.collected.toLocaleString()}</div>
              <div className="text-sm text-emerald-600">Collected</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-amber-700">${revenueToday.outstanding.toLocaleString()}</div>
              <div className="text-sm text-amber-600">Outstanding</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">{revenueToday.claimsPending}</div>
              <div className="text-sm text-blue-600">Claims Pending</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-700">{revenueToday.claimsToSubmit}</div>
              <div className="text-sm text-red-600">To Submit</div>
            </div>
          </div>
        </div>

        {/* Growth Snapshot */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Growth Snapshot</h2>
            </div>
            <button
              onClick={() => onNavigate('growth', 'dashboard')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View Details
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">{growthSnapshot.trainerReferrals}</div>
              <div className="text-sm text-blue-600">Trainer Referrals</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-emerald-700">{growthSnapshot.newLeads}</div>
              <div className="text-sm text-emerald-600">New Leads</div>
            </div>
            <div className="flex items-center space-x-2 bg-amber-50 rounded-lg p-4">
              <Star className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-xl font-bold text-amber-700">{growthSnapshot.reviewsCompleted}/{growthSnapshot.reviewRequests}</div>
                <div className="text-sm text-amber-600">Reviews</div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('growth', 'reviews')}
              className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
            >
              <UserPlus className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <div className="text-sm text-gray-600">Request Review</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
