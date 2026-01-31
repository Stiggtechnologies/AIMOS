import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, MapPin, Filter, TrendingUp, Search, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { schedulerService, SchedulerAppointment, SchedulerProvider, ScheduleIntelligence } from '../../services/schedulerService';
import AIScheduleInsights from './AIScheduleInsights';

interface WeekData {
  date: string;
  dayName: string;
  appointments: SchedulerAppointment[];
  blocks: {[providerId: string]: any[]};
}

export default function SchedulerView() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClinic, setSelectedClinic] = useState('bf3a060f-a018-43da-b45a-e184a40ec94b'); // Edmonton Central
  const [view, setView] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<SchedulerAppointment[]>([]);
  const [providers, setProviders] = useState<SchedulerProvider[]>([]);
  const [insights, setInsights] = useState<ScheduleIntelligence[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<SchedulerAppointment | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<ScheduleIntelligence | null>(null);
  const [highlightedAppointmentIds, setHighlightedAppointmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIOverlays, setShowAIOverlays] = useState(true);
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    const enabled = schedulerService.isFeatureEnabled('aim_scheduler_enabled');
    setSchedulerEnabled(enabled);

    if (enabled) {
      schedulerService.startAutoRefresh(6 * 60 * 1000);
    }

    return () => {
      schedulerService.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    loadScheduleData();
  }, [selectedDate, selectedClinic, view]);

  async function loadScheduleData() {
    try {
      setLoading(true);
      const provs = await schedulerService.getProviders(selectedClinic);
      setProviders(provs);

      if (view === 'week') {
        await loadWeekData();
      } else {
        const [appts, intel] = await Promise.all([
          schedulerService.getAppointments(selectedClinic, selectedDate),
          schedulerService.getScheduleIntelligence(selectedClinic, selectedDate),
        ]);
        setAppointments(appts);
        setInsights(intel);
      }

      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualRefresh() {
    setIsRefreshing(true);
    try {
      await schedulerService.refreshScheduleData(selectedClinic, selectedDate);
      await loadScheduleData();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }

  function formatRefreshTime(date: Date | null): string {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  }

  async function loadWeekData() {
    const startOfWeek = getMonday(new Date(selectedDate));
    const days: WeekData[] = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const appts = await schedulerService.getAppointments(selectedClinic, dateStr);
      const blocks: {[key: string]: any[]} = {};

      for (const provider of providers) {
        blocks[provider.id] = await schedulerService.getProviderBlocks(provider.id, dateStr);
      }

      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        appointments: appts,
        blocks
      });
    }

    setWeekData(days);
  }

  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
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

  function getAppointmentsForProvider(providerId: string, appts?: SchedulerAppointment[]): SchedulerAppointment[] {
    const source = appts || appointments;
    return source.filter(a => a.provider_id === providerId);
  }

  function handleInsightClick(insight: ScheduleIntelligence) {
    setSelectedInsight(selectedInsight?.id === insight.id ? null : insight);

    const affectedIds: string[] = [];
    if (insight.type === 'no_show_risk') {
      appointments.forEach(appt => {
        if ((appt.no_show_risk || 0) > 70) {
          affectedIds.push(appt.id);
        }
      });
    } else if (insight.type === 'overbooking') {
      appointments.forEach(appt => {
        if (appt.provider_id === insight.metadata?.provider_id) {
          affectedIds.push(appt.id);
        }
      });
    } else if (insight.type === 'capacity_gap') {
      appointments.forEach(appt => {
        if (appt.status === 'available' || appt.status === 'gap') {
          affectedIds.push(appt.id);
        }
      });
    } else if (insight.type === 'waitlist_opportunity') {
      const patientIds = insight.metadata?.patient_ids || [];
      appointments.forEach(appt => {
        if (patientIds.includes(appt.patient_id)) {
          affectedIds.push(appt.id);
        }
      });
    }

    setHighlightedAppointmentIds(affectedIds);
  }

  function renderProviderColumn(
    provider: SchedulerProvider,
    appts: SchedulerAppointment[],
    date: string,
    compact: boolean = false
  ) {
    const providerAppts = getAppointmentsForProvider(provider.id, appts);

    return (
      <div key={`${provider.id}-${date}`} className={`${compact ? 'w-48' : 'w-64'} border-r border-gray-200 flex-shrink-0`}>
        {!compact && (
          /* Provider Header for Day View */
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
        )}

        {compact && (
          /* Provider Sub-header for Week View */
          <div className="h-10 border-b border-gray-100 px-2 py-1 bg-white text-center">
            <div className="font-medium text-xs text-gray-900 truncate">{provider.name.split(' ')[1] || provider.name}</div>
          </div>
        )}

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
          {providerAppts.map((appt) => {
            const { top, height } = calculateBlockPosition(appt.start_time, appt.end_time);
            const hasRisk = (appt.no_show_risk || 0) > 70;
            const isLate = schedulerService.isAppointmentLate(appt);

            const isHighlighted = highlightedAppointmentIds.includes(appt.id);

            return (
              <button
                key={appt.id}
                onClick={() => setSelectedAppointment(appt)}
                className={`absolute left-1 right-1 rounded-md border-2 p-1 text-left transition-all cursor-pointer overflow-hidden ${
                  isHighlighted ? 'ring-4 ring-yellow-400 shadow-lg' : 'hover:ring-2 hover:ring-blue-400'
                } ${isLate ? 'animate-pulse' : ''}`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: isLate ? '#FCA5A5' : appt.color_code,
                  borderColor: isHighlighted ? '#FCD34D' : (isLate ? '#EF4444' : (hasRisk && showAIOverlays ? '#F59E0B' : 'transparent')),
                  opacity: isHighlighted ? 1 : 1,
                }}
              >
                {isLate && (
                  <div className="text-xs font-bold text-red-900 mb-1">LATE</div>
                )}
                <div className="text-xs font-semibold truncate">{appt.patient_name}</div>
                {!compact && (
                  <>
                    <div className="text-xs text-gray-600">
                      {schedulerService.getStatusIcon(appt.status)} {appt.start_time.substring(0, 5)}
                    </div>
                    {appt.appointment_type && height > 60 && (
                      <div className="text-xs text-gray-500 truncate">{appt.appointment_type}</div>
                    )}
                    {hasRisk && showAIOverlays && height > 80 && !isLate && (
                      <div className="mt-1 text-xs text-orange-700 font-medium">
                        🧠 {appt.no_show_risk?.toFixed(0)}%
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
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
    if (view === 'week') {
      current.setDate(current.getDate() + (delta * 7));
    } else {
      current.setDate(current.getDate() + delta);
    }
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
          <div>
            <h1 className="text-xl font-bold">AIM OS Scheduler</h1>
            {schedulerEnabled && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-xs text-slate-300">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span>Practice Perfect Sync Active</span>
                  {lastRefreshed && (
                    <span className="text-slate-400 ml-1">(Last sync: {formatRefreshTime(lastRefreshed)})</span>
                  )}
                </div>
              </div>
            )}
          </div>
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
          <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patient..."
              className="bg-transparent border-none text-white placeholder-gray-400 focus:outline-none w-48"
            />
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

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title={`Last refreshed: ${lastRefreshed ? formatRefreshTime(lastRefreshed) : 'Never'}`}
            className={`p-2 rounded transition-all ${
              isRefreshing
                ? 'bg-slate-600 cursor-not-allowed'
                : 'hover:bg-slate-700'
            }`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

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
          {schedulerEnabled && (
            <div className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Read-Only (Practice Perfect is source of record)
            </div>
          )}
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

        {view === 'day' ? (
          /* Day View - Provider Columns */
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
                providers.map((provider) => renderProviderColumn(provider, appointments, selectedDate))
              )}
            </div>
          </div>
        ) : (
          /* Week View - Day Columns with Providers */
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <div className="flex min-w-max">
              {weekData.map((day) => (
                <div key={day.date} className="border-r border-gray-200">
                  {/* Day Header */}
                  <div className="h-12 border-b border-gray-200 px-3 py-2 bg-gray-50 sticky top-0 z-20 text-center">
                    <div className="font-semibold text-sm text-gray-900">{day.dayName}</div>
                  </div>

                  {/* Provider Sub-columns */}
                  <div className="flex">
                    {providers.map((provider) => renderProviderColumn(provider, day.appointments, day.date, true))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intelligence Panel (Right) */}
        <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className={`p-4 border-b-2 transition-colors ${
            selectedInsight
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-white border-gray-200'
          }`}>
            <h3 className="font-semibold text-gray-900">Scheduling Intelligence</h3>
            <p className="text-xs text-gray-500 mt-1">
              {selectedInsight
                ? `Highlighting ${highlightedAppointmentIds.length} affected appointment(s)`
                : 'AI-powered insights for today'}
            </p>
            {selectedInsight && (
              <button
                onClick={() => {
                  setSelectedInsight(null);
                  setHighlightedAppointmentIds([]);
                }}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            <AIScheduleInsights clinicId={selectedClinic} date={selectedDate} />

            {insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No insights for this schedule
              </div>
            ) : (
              insights.map((insight, idx) => {
                const isSelected = selectedInsight?.id === insight.id;
                return (
                  <button
                    key={idx}
                    onClick={() => handleInsightClick(insight)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? `ring-2 ring-yellow-400 ${
                          insight.severity === 'critical' ? 'bg-red-100 border-red-400' :
                          insight.severity === 'high' ? 'bg-orange-100 border-orange-400' :
                          insight.severity === 'medium' ? 'bg-yellow-100 border-yellow-400' :
                          'bg-blue-100 border-blue-400'
                        }`
                        : `${
                          insight.severity === 'critical' ? 'bg-red-50 border-red-200' :
                          insight.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                          insight.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`
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
                          {isSelected && (
                            <span className="text-xs font-semibold text-yellow-600 bg-yellow-200 px-2 py-1 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                        {insight.suggested_action && (
                          <div className="mt-2 text-xs font-medium text-gray-700 bg-white p-2 rounded">
                            💡 {insight.suggested_action}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
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
