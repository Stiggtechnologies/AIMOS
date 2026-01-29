import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, MapPin, Filter, TrendingUp } from 'lucide-react';
import { schedulerService, SchedulerAppointment, SchedulerProvider, ScheduleIntelligence } from '../../services/schedulerService';

export default function SchedulerView() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClinic, setSelectedClinic] = useState('bf3a060f-a018-43da-b45a-e184a40ec94b'); // Edmonton Central
  const [view, setView] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<SchedulerAppointment[]>([]);
  const [providers, setProviders] = useState<SchedulerProvider[]>([]);
  const [insights, setInsights] = useState<ScheduleIntelligence[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<SchedulerAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAIOverlays, setShowAIOverlays] = useState(true);

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    loadScheduleData();
  }, [selectedDate, selectedClinic]);

  async function loadScheduleData() {
    try {
      setLoading(true);
      const [appts, provs, intel] = await Promise.all([
        schedulerService.getAppointments(selectedClinic, selectedDate),
        schedulerService.getProviders(selectedClinic),
        schedulerService.getScheduleIntelligence(selectedClinic, selectedDate),
      ]);
      setAppointments(appts);
      setProviders(provs);
      setInsights(intel);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateTimeSlots(): string[] {
    const slots = [];
    for (let hour = 8; hour <= 19; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }

  function getAppointmentsForProvider(providerId: string): SchedulerAppointment[] {
    return appointments.filter(a => a.provider_id === providerId);
  }

  function calculateBlockPosition(startTime: string, endTime: string) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const dayStart = 8 * 60; // 8:00 AM
    const top = ((startMinutes - dayStart) / 15) * 24; // 24px per 15-min slot
    const height = ((endMinutes - startMinutes) / 15) * 24;
    return { top, height };
  }

  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function changeDate(delta: number) {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + delta);
    setSelectedDate(current.toISOString().split('T')[0]);
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">AIM OS Scheduler</h1>
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
            <MapPin className="h-4 w-4" />
            <select
              value={selectedClinic}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none"
            >
              <option value="bf3a060f-a018-43da-b45a-e184a40ec94b">Edmonton Central</option>
              <option value="0931b80a-e808-4afe-b464-ecab6c86b2b8">Calgary North</option>
              <option value="25a1a69d-cdb7-4083-bba9-050266b85e82">Calgary South</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-slate-700 rounded"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-4 py-2">
              <Calendar className="h-4 w-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-white focus:outline-none"
              />
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-2 hover:bg-slate-700 rounded"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-1 rounded ${view === 'day' ? 'bg-blue-600' : 'hover:bg-slate-600'}`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-1 rounded ${view === 'week' ? 'bg-blue-600' : 'hover:bg-slate-600'}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">Filters:</span>
          </div>
          <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
            All Providers ({providers.length})
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">
            All Statuses
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showAIOverlays}
            onChange={(e) => setShowAIOverlays(e.target.checked)}
            className="rounded"
          />
          <TrendingUp className="h-4 w-4" />
          Show AI Overlays
        </label>
      </div>

      <div className="text-center py-3 bg-gray-100 border-b">
        <p className="text-sm font-medium text-gray-700">{formatDate(selectedDate)}</p>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Time Rail (Left) */}
        <div className="w-18 bg-gray-50 border-r border-gray-200 flex-shrink-0">
          <div className="h-12 border-b border-gray-200"></div>
          <div className="relative">
            {timeSlots.filter((_, i) => i % 4 === 0).map((time) => (
              <div key={time} className="h-24 border-b border-gray-100 px-2 py-1">
                <span className="text-xs text-gray-500">{time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Provider Columns (Center) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div className="flex min-w-max">
            {providers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-96">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No providers scheduled for this day</p>
                </div>
              </div>
            ) : (
              providers.map((provider) => (
                <div key={provider.id} className="w-64 border-r border-gray-200 flex-shrink-0">
                  {/* Provider Header */}
                  <div className="h-12 border-b border-gray-200 px-3 py-2 bg-white sticky top-0 z-10">
                    <div className="font-medium text-sm text-gray-900 truncate">{provider.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{provider.role}</span>
                      {provider.utilization && (
                        <div className="flex-1 max-w-20">
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${provider.utilization > 85 ? 'bg-green-600' : 'bg-blue-600'}`}
                              style={{ width: `${provider.utilization}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment Grid */}
                  <div className="relative bg-white" style={{ height: `${timeSlots.length * 6}px` }}>
                    {timeSlots.map((time, i) => (
                      <div
                        key={time}
                        className={`absolute left-0 right-0 border-b ${i % 4 === 0 ? 'border-gray-200' : 'border-gray-100'}`}
                        style={{ top: `${i * 24}px`, height: '24px' }}
                      ></div>
                    ))}

                    {/* Appointment Blocks */}
                    {getAppointmentsForProvider(provider.id).map((appt) => {
                      const { top, height } = calculateBlockPosition(appt.start_time, appt.end_time);
                      const hasRisk = (appt.no_show_risk || 0) > 70;

                      return (
                        <button
                          key={appt.id}
                          onClick={() => setSelectedAppointment(appt)}
                          className="absolute left-1 right-1 rounded-md border-2 p-2 text-left hover:ring-2 hover:ring-blue-400 transition-shadow cursor-pointer"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            backgroundColor: appt.color_code,
                            borderColor: hasRisk && showAIOverlays ? '#F59E0B' : 'transparent',
                          }}
                        >
                          <div className="text-xs font-semibold truncate">{appt.patient_name}</div>
                          <div className="text-xs text-gray-600">
                            {schedulerService.getStatusIcon(appt.status)} {appt.start_time} – {appt.end_time}
                          </div>
                          {appt.appointment_type && (
                            <div className="text-xs text-gray-500 truncate">{appt.appointment_type}</div>
                          )}
                          {hasRisk && showAIOverlays && (
                            <div className="mt-1 text-xs text-orange-700 font-medium">
                              🧠 {appt.no_show_risk?.toFixed(0)}% no-show risk
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Intelligence Panel (Right) */}
        <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Scheduling Intelligence</h3>
            <p className="text-xs text-gray-500 mt-1">AI-powered insights for today</p>
          </div>

          <div className="p-4 space-y-3">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No insights for this schedule
              </div>
            ) : (
              insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${
                    insight.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    insight.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                    insight.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {insight.type === 'no_show_risk' ? '🔶' :
                       insight.type === 'overbooking' ? '🔴' :
                       insight.type === 'capacity_gap' ? '🔵' :
                       insight.type === 'waitlist_opportunity' ? '🟢' : '🟣'}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Confidence: {insight.confidence}%
                        </span>
                      </div>
                      {insight.suggested_action && (
                        <div className="mt-2 text-xs font-medium text-gray-700 bg-white p-2 rounded">
                          💡 {insight.suggested_action}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Appointment Detail Drawer */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-end">
          <div className="w-96 bg-white h-full shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Patient</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{selectedAppointment.patient_name}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Appointment</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{selectedAppointment.appointment_date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">
                        {selectedAppointment.start_time} – {selectedAppointment.end_time}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-medium">{selectedAppointment.provider_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{selectedAppointment.appointment_type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium capitalize">{selectedAppointment.status}</span>
                    </div>
                  </div>
                </div>

                {selectedAppointment.no_show_risk && selectedAppointment.no_show_risk > 50 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Insights</h3>
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🧠</span>
                        <span className="font-semibold text-orange-900">No-Show Risk</span>
                      </div>
                      <p className="text-sm text-orange-800">
                        This appointment has a {selectedAppointment.no_show_risk.toFixed(0)}% probability of no-show based on patient history and patterns.
                      </p>
                      <div className="mt-3 p-2 bg-white rounded text-xs text-gray-700">
                        💡 Suggested: Send appointment reminder or prepare standby patient
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <button
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                    onClick={() => window.alert('Opens Practice Perfect appointment view')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Practice Perfect
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    AIM OS is read-only. Edit in Practice Perfect.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
