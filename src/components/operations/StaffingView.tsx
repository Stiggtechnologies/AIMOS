import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { staffingService, StaffSchedule, TimeOffRequest } from '../../services/operationsService';

export default function StaffingView() {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const isManager = profile?.role === 'executive' || profile?.role === 'admin' || profile?.role === 'clinic_manager';

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 7);

      const [schedulesData, timeOffData] = await Promise.all([
        staffingService.getStaffSchedules(
          profile?.primary_clinic_id,
          selectedDate,
          endDate.toISOString().split('T')[0]
        ),
        staffingService.getTimeOffRequests()
      ]);

      setSchedules(schedulesData);
      setTimeOffRequests(timeOffData);
    } catch (error) {
      console.error('Error loading staffing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-600">Week view</span>
        </div>
        {isManager && (
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-5 w-5 mr-2" />
            New Schedule
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Staff Schedules
            </h3>

            {schedules.length > 0 ? (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            {schedule.staff?.user?.first_name} {schedule.staff?.user?.last_name}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            schedule.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : schedule.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : schedule.status === 'completed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {schedule.status}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(schedule.schedule_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {schedule.start_time} - {schedule.end_time}
                          </span>
                          {schedule.shift && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {schedule.shift.name}
                            </span>
                          )}
                        </div>
                        {schedule.notes && (
                          <p className="text-sm text-gray-600 mt-2">{schedule.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No schedules for this week</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Time Off Requests
            </h3>

            {timeOffRequests.length > 0 ? (
              <div className="space-y-3">
                {timeOffRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900">
                        {request.staff?.user?.first_name} {request.staff?.user?.last_name}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>{request.request_type}</div>
                      <div className="mt-1">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No pending requests</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Coverage Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">This Week</span>
                <span className="font-semibold text-green-600">98% Covered</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Next Week</span>
                <span className="font-semibold text-yellow-600">85% Covered</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Open Shifts</span>
                <span className="font-semibold text-red-600">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
