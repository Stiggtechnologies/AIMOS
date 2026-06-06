import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Users,
  DollarSign,
  XCircle,
  UserX,
} from 'lucide-react';
import {
  getUtilizationInsights,
  UtilizationOverview,
  CancellationBreakdown,
  ClinicianUtilization,
  ClinicCapacityHeatmap,
  UnderUtilizationAlert,
} from '../../services/utilizationService';
import { BarChartComponent, PieChartComponent, CapacityHeatmap } from '../shared/Charts';

export function UtilizationView() {
  const [overview, setOverview] = useState<UtilizationOverview | null>(null);
  const [cancellations, setCancellations] = useState<CancellationBreakdown[]>([]);
  const [clinicians, setClinicians] = useState<ClinicianUtilization[]>([]);
  const [heatmap, setHeatmap] = useState<ClinicCapacityHeatmap[]>([]);
  const [alerts, setAlerts] = useState<UnderUtilizationAlert[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    try {
      const insights = await getUtilizationInsights();
      setOverview(insights.overview);
      setCancellations(insights.cancellation_breakdown);
      setClinicians(insights.clinician_utilization);
      setHeatmap(insights.capacity_heatmap);
      setAlerts(insights.alerts);

      if (insights.capacity_heatmap.length > 0) {
        setSelectedClinic(insights.capacity_heatmap[0].clinic_id);
      }
    } catch (error) {
      console.error('Failed to load utilization insights:', error);
    } finally {
      setLoading(false);
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getStatusColor = (status: 'optimal' | 'underutilized' | 'overutilized') => {
    if (status === 'optimal') return 'text-green-600 bg-green-50';
    if (status === 'underutilized') return 'text-red-600 bg-red-50';
    return 'text-amber-600 bg-amber-50';
  };

  const getStatusLabel = (status: 'optimal' | 'underutilized' | 'overutilized') => {
    if (status === 'optimal') return 'Optimal';
    if (status === 'underutilized') return 'Under-Utilized';
    return 'Over-Utilized';
  };

  const getHeatmapColor = (status: 'high' | 'medium' | 'low' | 'empty') => {
    if (status === 'high') return 'bg-green-500';
    if (status === 'medium') return 'bg-amber-400';
    if (status === 'low') return 'bg-orange-300';
    return 'bg-gray-200';
  };

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    if (severity === 'critical') return 'border-red-500 bg-red-50';
    if (severity === 'warning') return 'border-amber-500 bg-amber-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    if (severity === 'critical') return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <Info className="w-5 h-5 text-blue-600" />;
  };

  const clinicList = [...new Set(heatmap.map(h => ({ id: h.clinic_id, name: h.clinic_name })))];
  const selectedClinicData = heatmap.filter(h => h.clinic_id === selectedClinic);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading utilization insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Utilization & Leakage Intelligence</h2>
        <p className="text-gray-600 mt-1">Identify capacity loss and revenue optimization opportunities</p>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Under-Utilization Alerts ({alerts.length})
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{alert.message}</h4>
                      <span className="text-xs text-gray-500 uppercase tracking-wide px-2 py-1 bg-white rounded">
                        {alert.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm mb-2">
                      <div>
                        <span className="text-gray-600">Current:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {alert.utilization_rate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Target:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {alert.target_rate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue at Risk:</span>
                        <span className="ml-2 font-semibold text-red-600">
                          ${alert.potential_revenue_loss.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                      <span className="font-semibold">Recommendation:</span> {alert.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {overview && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled vs Delivered Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{overview.overall_utilization.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 mt-1">Overall Utilization</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{overview.delivered_slots.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Delivered Slots</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-3xl font-bold text-amber-600">{overview.available_slots.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Available Slots</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">
                ${(overview.revenue_lost / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-600 mt-1">Revenue Lost</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{overview.scheduled_slots.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Scheduled Slots</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <XCircle className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{overview.cancelled_slots.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Cancellations</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <UserX className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{overview.no_show_slots.toLocaleString()}</div>
                <div className="text-sm text-gray-600">No-Shows</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-orange-600" />
            Cancellation Reason Breakdown
          </h3>
          <div className="space-y-3">
            {cancellations.map((cancellation, index) => (
              <div key={index} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{cancellation.reason}</span>
                    {getTrendIcon(cancellation.trend)}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{cancellation.count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${cancellation.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    <span className="text-gray-600">{cancellation.percentage.toFixed(1)}%</span>
                    <span className="text-red-600 font-semibold">
                      -${cancellation.estimated_revenue_loss.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Clinician Utilization
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {clinicians.map((clinician, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{clinician.clinician_name}</div>
                    <div className="text-xs text-gray-600">{clinician.specialty}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(clinician.status)}`}>
                    {getStatusLabel(clinician.status)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <div className="text-gray-600">Utilization</div>
                    <div className="font-semibold text-gray-900">{clinician.utilization_rate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Cancellations</div>
                    <div className="font-semibold text-gray-900">{clinician.cancellation_rate.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">No-Shows</div>
                    <div className="font-semibold text-gray-900">{clinician.no_show_rate.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      clinician.status === 'optimal' ? 'bg-green-500' :
                      clinician.status === 'underutilized' ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(clinician.utilization_rate, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {clinician.delivered_hours.toFixed(0)} / {clinician.scheduled_hours.toFixed(0)} hours
                  </span>
                  <span className="text-green-600 font-semibold">
                    ${clinician.avg_revenue_per_hour}/hr
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Clinic Capacity Heatmap
          </h3>
          <select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {clinicList.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
                  Time
                </th>
                {daysOfWeek.map((day) => (
                  <th key={day} className="text-center p-2 text-sm font-semibold text-gray-700 border-b border-gray-200">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((hour) => (
                <tr key={hour}>
                  <td className="p-2 text-sm text-gray-700 border-b border-gray-100 font-medium">
                    {hour}:00 - {hour + 1}:00
                  </td>
                  {daysOfWeek.map((day) => {
                    const cell = selectedClinicData.find(
                      (h) => h.day_of_week === day && h.hour === hour
                    );
                    return (
                      <td key={`${day}-${hour}`} className="p-1 border-b border-gray-100">
                        <div
                          className={`h-12 rounded ${cell ? getHeatmapColor(cell.status) : 'bg-gray-200'}
                            flex items-center justify-center text-xs font-semibold text-gray-900 cursor-pointer
                            hover:ring-2 hover:ring-gray-400 transition-all`}
                          title={
                            cell
                              ? `${cell.utilization_rate.toFixed(0)}% utilized\n${cell.appointment_count}/${cell.capacity} slots`
                              : 'No data'
                          }
                        >
                          {cell ? (
                            <div className="text-center">
                              <div>{cell.utilization_rate.toFixed(0)}%</div>
                              <div className="text-xs opacity-75">
                                {cell.appointment_count}/{cell.capacity}
                              </div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700">High (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-400 rounded"></div>
            <span className="text-gray-700">Medium (50-79%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-300 rounded"></div>
            <span className="text-gray-700">Low (1-49%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span className="text-gray-700">Empty (0%)</span>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-900">
            <p className="font-semibold mb-1">Revenue Optimization Potential</p>
            <p className="text-green-800">
              By addressing under-utilization patterns and reducing cancellations, you could recover up to{' '}
              <span className="font-semibold">${overview ? overview.revenue_lost.toLocaleString() : '0'}</span> in
              lost revenue per month.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UtilizationView;
