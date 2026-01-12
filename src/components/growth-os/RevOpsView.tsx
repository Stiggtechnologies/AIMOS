import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  DollarSign,
  Clock,
  Target,
  Activity,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import {
  getRevOpsDashboard,
  acknowledgeGrowthAlert,
  type RevOpsDashboard,
  type PipelineMetrics,
  type Bottleneck,
  type ClinicianProductivity,
  type GrowthAlert,
} from '../../services/revopsService';
import { useAuth } from '../../contexts/AuthContext';

export default function RevOpsView() {
  const { profile } = useAuth();
  const [dashboard, setDashboard] = useState<RevOpsDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getRevOpsDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading RevOps dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledgeAlert(alertId: string) {
    if (!profile) return;
    try {
      await acknowledgeGrowthAlert(alertId, profile.id);
      loadDashboard();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading Revenue Operations...</div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6 text-gray-500">No data available</div>;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'severe':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'moderate':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'minor':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical' || severity === 'severe') {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    if (severity === 'warning' || severity === 'moderate') {
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
    return <Activity className="w-5 h-5 text-blue-600" />;
  };

  const getPerformanceTierColor = (tier: string) => {
    switch (tier) {
      case 'top_performer':
        return 'bg-green-100 text-green-800';
      case 'above_average':
        return 'bg-blue-100 text-blue-800';
      case 'average':
        return 'bg-gray-100 text-gray-800';
      case 'below_average':
        return 'bg-amber-100 text-amber-800';
      case 'needs_improvement':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceTierLabel = (tier: string) => {
    return tier.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Revenue Operations Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Marketing → Intake → Capacity → Revenue pipeline with bottleneck detection
        </p>
      </div>

      {dashboard.growth_alerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Critical Growth Alerts ({dashboard.growth_alerts.length})
          </h3>
          <div className="space-y-3">
            {dashboard.growth_alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900">{alert.recommended_action}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-600">Demand</div>
                    <div className="text-lg font-bold text-gray-900">{alert.current_demand}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-600">Capacity</div>
                    <div className="text-lg font-bold text-gray-900">{alert.current_capacity}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-600">Gap</div>
                    <div className="text-lg font-bold text-red-600">{alert.gap_percentage.toFixed(1)}%</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-600">Revenue at Risk</div>
                    <div className="text-lg font-bold text-red-600">
                      ${(alert.potential_revenue_loss / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-3">
                  <div className="text-sm font-semibold text-blue-900 mb-2">Financial Impact</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-blue-700">Investment:</span>
                      <span className="ml-1 font-semibold text-blue-900">
                        ${(alert.estimated_cost / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Gain:</span>
                      <span className="ml-1 font-semibold text-green-600">
                        ${(alert.estimated_revenue_gain / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">ROI:</span>
                      <span className="ml-1 font-semibold text-green-600">
                        {alert.roi_percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {alert.status === 'active' && (
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Acknowledge Alert
                  </button>
                )}
                {alert.status === 'acknowledged' && (
                  <div className="text-xs text-green-600 font-medium">✓ Acknowledged</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Revenue (Last Week)</div>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${(dashboard.summary.total_revenue_last_week / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Marketing ROI: {dashboard.summary.marketing_roi.toFixed(0)}%
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Revenue per Hour</div>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${dashboard.summary.revenue_per_hour.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Per clinician hour</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Utilization Rate</div>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {dashboard.summary.utilization_rate.toFixed(1)}%
          </div>
          <div className={`text-xs mt-1 ${dashboard.summary.utilization_rate > 90 ? 'text-red-600' : 'text-gray-500'}`}>
            {dashboard.summary.utilization_rate > 90 ? 'At capacity' : 'Healthy'}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Capacity Gap</div>
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div className={`text-2xl font-bold ${dashboard.summary.capacity_gap < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {Math.abs(dashboard.summary.capacity_gap).toFixed(0)}h
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {dashboard.summary.capacity_gap < 0 ? 'Shortage' : 'Surplus'}
          </div>
        </div>
      </div>

      {dashboard.latest_pipeline && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Pipeline Flow</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <div className="bg-blue-100 rounded-lg p-4 mb-2">
                  <div className="text-2xl font-bold text-blue-900">
                    {dashboard.latest_pipeline.marketing_leads}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">Marketing Leads</div>
                </div>
                <div className="text-xs text-gray-600">
                  ${(dashboard.latest_pipeline.cost_per_lead).toFixed(0)} CPL
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              <div className="text-center">
                <div className="bg-green-100 rounded-lg p-4 mb-2">
                  <div className="text-2xl font-bold text-green-900">
                    {dashboard.latest_pipeline.intake_qualified}
                  </div>
                  <div className="text-xs text-green-700 mt-1">Qualified</div>
                </div>
                <div className="text-xs text-gray-600">
                  {dashboard.latest_pipeline.intake_conversion_rate.toFixed(1)}% conversion
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              <div className="text-center">
                <div className="bg-purple-100 rounded-lg p-4 mb-2">
                  <div className="text-2xl font-bold text-purple-900">
                    {dashboard.latest_pipeline.appointments_scheduled}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">Scheduled</div>
                </div>
                <div className="text-xs text-gray-600">
                  {dashboard.latest_pipeline.schedule_conversion_rate.toFixed(1)}% conversion
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div className="col-start-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <ArrowRight className="w-6 h-6 text-gray-400 transform rotate-90" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div className="col-start-3 text-center">
                <div className="bg-orange-100 rounded-lg p-4 mb-2">
                  <div className="text-2xl font-bold text-orange-900">
                    {dashboard.latest_pipeline.appointments_completed}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">Completed</div>
                </div>
                <div className="text-xs text-gray-600">
                  {dashboard.latest_pipeline.completion_rate.toFixed(1)}% completion
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              <div className="text-center">
                <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4 mb-2">
                  <div className="text-2xl font-bold text-green-900">
                    ${(dashboard.latest_pipeline.total_revenue / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-green-700 mt-1">Revenue</div>
                </div>
                <div className="text-xs text-gray-600">
                  ${dashboard.latest_pipeline.revenue_per_appointment.toFixed(0)} per appt
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Overall Conversion:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {dashboard.latest_pipeline.overall_conversion_rate.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Marketing ROI:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {dashboard.latest_pipeline.marketing_roi.toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Revenue per Lead:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    ${dashboard.latest_pipeline.revenue_per_lead.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {dashboard.latest_pipeline.primary_bottleneck && (
              <div className={`border-l-4 p-3 rounded ${getSeverityColor(dashboard.latest_pipeline.bottleneck_severity || 'info')}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">Primary Bottleneck:</span>
                  <span className="capitalize">{dashboard.latest_pipeline.primary_bottleneck}</span>
                  <span className="text-xs uppercase px-2 py-0.5 bg-white rounded font-semibold">
                    {dashboard.latest_pipeline.bottleneck_severity}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {dashboard.active_bottlenecks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-600" />
            Active Bottlenecks ({dashboard.active_bottlenecks.length})
          </h3>
          <div className="space-y-4">
            {dashboard.active_bottlenecks.map((bottleneck) => (
              <div
                key={bottleneck.id}
                className={`border-l-4 p-4 rounded ${getSeverityColor(bottleneck.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(bottleneck.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs uppercase tracking-wide font-semibold px-2 py-0.5 bg-white rounded">
                          {bottleneck.bottleneck_stage}
                        </span>
                        <span className={`ml-2 text-xs uppercase tracking-wide font-semibold px-2 py-0.5 rounded ${
                          bottleneck.severity === 'critical' || bottleneck.severity === 'severe'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {bottleneck.severity}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">Priority: {bottleneck.priority}/10</div>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 mb-3">{bottleneck.root_cause}</p>

                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <div className="text-xs text-gray-600">Delayed</div>
                        <div className="text-sm font-bold text-amber-600">{bottleneck.appointments_delayed}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <div className="text-xs text-gray-600">Lost</div>
                        <div className="text-sm font-bold text-red-600">{bottleneck.appointments_lost}</div>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <div className="text-xs text-gray-600">Revenue Lost</div>
                        <div className="text-sm font-bold text-red-600">
                          ${(bottleneck.revenue_lost / 1000).toFixed(1)}K
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-200">
                        <div className="text-xs text-gray-600">Throughput Gap</div>
                        <div className="text-sm font-bold text-gray-900">
                          {bottleneck.throughput_gap_percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Contributing Factors:</div>
                      <ul className="text-xs text-gray-600 space-y-0.5">
                        {bottleneck.contributing_factors.map((factor, idx) => (
                          <li key={idx}>• {factor}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-green-50 border border-green-200 p-3 rounded">
                      <div className="text-xs font-semibold text-green-900 mb-1">
                        Recommended Actions (Est. Impact: ${(bottleneck.estimated_impact_if_resolved / 1000).toFixed(0)}K):
                      </div>
                      <ul className="text-xs text-green-800 space-y-0.5">
                        {bottleneck.recommended_actions.map((action, idx) => (
                          <li key={idx}>• {action}</li>
                        ))}
                      </ul>
                      <div className="text-xs text-green-700 mt-2">
                        Est. Resolution Time: {bottleneck.estimated_resolution_time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dashboard.clinician_productivity.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Clinician Productivity
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clinician
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Utilization
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Revenue/Hour
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Patients
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Total Revenue
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Satisfaction
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Tier
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboard.clinician_productivity.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {prod.clinician?.display_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {prod.worked_hours.toFixed(1)}h / {prod.scheduled_hours.toFixed(1)}h
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={`text-sm font-semibold ${
                        prod.utilization_rate >= 95 ? 'text-red-600' :
                        prod.utilization_rate >= 85 ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {prod.utilization_rate.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        ${prod.revenue_per_hour.toFixed(0)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm text-gray-900">{prod.patients_seen}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm font-semibold text-green-600">
                        ${(prod.total_revenue / 1000).toFixed(1)}K
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm text-gray-900">
                        {prod.patient_satisfaction_score ? `${prod.patient_satisfaction_score.toFixed(2)}/5` : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceTierColor(prod.performance_tier || 'average')}`}>
                        {getPerformanceTierLabel(prod.performance_tier || 'average')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">RevOps Intelligence</p>
            <p className="text-blue-800">
              {dashboard.summary.bottlenecks_count} active bottlenecks • {dashboard.summary.alerts_count} growth alerts •
              {dashboard.summary.utilization_rate.toFixed(0)}% capacity utilization •
              ${dashboard.summary.revenue_per_hour.toFixed(0)}/hr revenue rate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
