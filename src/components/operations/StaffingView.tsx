import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Plus, Check, X, ChevronDown, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { staffingService, StaffSchedule, TimeOffRequest } from '../../services/operationsService';

interface ScheduleFormData {
  schedule_date: string;
  start_time: string;
  end_time: string;
  notes: string;
  status: 'scheduled' | 'confirmed';
}

export default function StaffingView() {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormData>({
    schedule_date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '17:00',
    notes: '',
    status: 'scheduled'
  });
  const [timeOffForm, setTimeOffForm] = useState({
    request_type: 'vacation',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });

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

  const handleCreateSchedule = async () => {
    setSavingSchedule(true);
    try {
      await staffingService.createSchedule({
        ...scheduleForm,
        clinic_id: profile?.primary_clinic_id
      });
      setShowScheduleModal(false);
      setScheduleForm({
        schedule_date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '17:00',
        notes: '',
        status: 'scheduled'
      });
      await loadData();
    } catch (error) {
      console.error('Error creating schedule:', error);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleCreateTimeOffRequest = async () => {
    setSavingSchedule(true);
    try {
      await staffingService.createTimeOffRequest({
        ...timeOffForm,
        staff_id: profile?.id,
        status: 'pending'
      });
      setShowTimeOffModal(false);
      await loadData();
    } catch (error) {
      console.error('Error creating time off request:', error);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleApproveTimeOff = async (id: string) => {
    if (!profile?.id) return;
    setProcessingId(id);
    try {
      await staffingService.approveTimeOffRequest(id, profile.id);
      await loadData();
    } catch (error) {
      console.error('Error approving time off:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTimeOff = async (id: string) => {
    const reason = window.prompt('Rejection reason (optional):') ?? 'Not approved';
    if (!profile?.id) return;
    setProcessingId(id);
    try {
      await staffingService.rejectTimeOffRequest(id, profile.id, reason);
      await loadData();
    } catch (error) {
      console.error('Error rejecting time off:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800'
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staffing</h2>
          <p className="text-gray-600 mt-1">Manage staff schedules and time-off requests</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTimeOffModal(true)}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Request Time Off
          </button>
          {isManager && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Week starting:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
                          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[schedule.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {schedule.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(schedule.schedule_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {schedule.start_time} – {schedule.end_time}
                          </span>
                          {schedule.shift && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {schedule.shift.name}
                            </span>
                          )}
                        </div>
                        {schedule.notes && (
                          <p className="text-sm text-gray-500 mt-2">{schedule.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No schedules for this week</p>
                {isManager && (
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Create First Schedule
                  </button>
                )}
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
                {timeOffRequests.slice(0, 8).map((request) => (
                  <div key={request.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {request.staff?.user?.first_name} {request.staff?.user?.last_name}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[request.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {request.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <div className="capitalize">{request.request_type?.replace('_', ' ')}</div>
                      <div className="mt-0.5">
                        {new Date(request.start_date).toLocaleDateString()} – {new Date(request.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    {isManager && request.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleApproveTimeOff(request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectTimeOff(request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No pending requests</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-blue-600" />
              Coverage Status
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">This Week</span>
                <span className="font-semibold text-green-600">
                  {schedules.filter(s => s.status === 'confirmed' || s.status === 'scheduled').length} shifts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Pending Time Off</span>
                <span className="font-semibold text-yellow-600">
                  {timeOffRequests.filter(r => r.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Approved Time Off</span>
                <span className="font-semibold text-blue-600">
                  {timeOffRequests.filter(r => r.status === 'approved').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">New Staff Schedule</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={scheduleForm.schedule_date}
                  onChange={e => setScheduleForm(f => ({ ...f, schedule_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={e => setScheduleForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={e => setScheduleForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={scheduleForm.status}
                  onChange={e => setScheduleForm(f => ({ ...f, status: e.target.value as 'scheduled' | 'confirmed' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Any notes for this shift..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                disabled={savingSchedule}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingSchedule ? 'Saving...' : 'Create Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTimeOffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Request Time Off</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={timeOffForm.request_type}
                  onChange={e => setTimeOffForm(f => ({ ...f, request_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={timeOffForm.start_date}
                    onChange={e => setTimeOffForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={timeOffForm.end_date}
                    onChange={e => setTimeOffForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea
                  value={timeOffForm.reason}
                  onChange={e => setTimeOffForm(f => ({ ...f, reason: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Reason for request..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowTimeOffModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTimeOffRequest}
                disabled={savingSchedule}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {savingSchedule ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
