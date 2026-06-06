import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  FileText,
  Users,
  Target,
  Shield,
  XCircle,
  Calendar,
  Search,
} from 'lucide-react';
import {
  getIncidentResolutionDashboard,
  type IncidentResolutionDashboard,
  type IncidentPattern,
  type EnhancedCorrectivePlan,
  type EnhancedIncidentAction,
  type ResolutionMetric,
} from '../../services/incidentResolutionService';
import type { IncidentReport } from '../../types/intranet';

export default function IncidentResolutionView() {
  const [dashboard, setDashboard] = useState<IncidentResolutionDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'plans' | 'actions' | 'patterns'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getIncidentResolutionDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading incident resolution dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading incident resolution data...</div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6 text-gray-500">No data available</div>;
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-600';
    if (trend === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'bg-red-100 text-red-800 border-red-200';
    if (severity === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (severity === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getStatusColor = (status: string) => {
    if (status === 'resolved' || status === 'closed' || status === 'completed' || status === 'verified') {
      return 'bg-green-100 text-green-800';
    }
    if (status === 'in_progress') return 'bg-blue-100 text-blue-800';
    if (status === 'under_review') return 'bg-purple-100 text-purple-800';
    if (status === 'pending') return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRiskLevelIcon = (risk: string) => {
    if (risk === 'critical' || risk === 'high') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (risk === 'medium') return <AlertCircle className="w-5 h-5 text-amber-600" />;
    return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Incident Resolution & Action Loop</h2>
        <p className="text-gray-600 mt-1">Root cause analysis, corrective actions, and pattern detection for legal defensibility</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution Performance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{dashboard.overview.total_incidents}</div>
            <div className="text-xs text-gray-600 mt-1">Total Incidents</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{dashboard.overview.open_incidents}</div>
            <div className="text-xs text-gray-600 mt-1">Open Incidents</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{dashboard.overview.plans_in_progress}</div>
            <div className="text-xs text-gray-600 mt-1">Plans Active</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{dashboard.overview.overdue_actions}</div>
            <div className="text-xs text-gray-600 mt-1">Overdue Actions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{dashboard.overview.avg_resolution_days}</div>
            <div className="text-xs text-gray-600 mt-1">Avg Days to Resolve</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <Search className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{dashboard.overview.patterns_detected}</div>
            <div className="text-xs text-gray-600 mt-1">Patterns Detected</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Resolution Metrics
          </h3>
          <div className="space-y-4">
            {dashboard.resolution_metrics.map((metric) => (
              <div key={metric.metric_name} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{metric.metric_name}</span>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-xs font-semibold ${getTrendColor(metric.trend)}`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.unit === '%' ? metric.current_value.toFixed(1) : metric.current_value}
                  </span>
                  <span className="text-sm text-gray-600">{metric.unit}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    Target: {metric.target_value}{metric.unit}
                  </span>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute h-2 rounded-full ${
                      metric.trend === 'improving' ? 'bg-green-500' :
                      metric.trend === 'declining' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{
                      width: metric.unit === '%'
                        ? `${Math.min(100, metric.current_value)}%`
                        : `${Math.min(100, (metric.current_value / metric.target_value) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            High-Risk Patterns Detected
          </h3>
          <div className="space-y-4">
            {dashboard.detected_patterns.slice(0, 3).map((pattern) => (
              <div key={pattern.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  {getRiskLevelIcon(pattern.risk_level || 'low')}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">{pattern.pattern_name}</h4>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getSeverityColor(pattern.risk_level || 'low')}`}>
                        {pattern.risk_level}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{pattern.pattern_description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs">
                    <span className="text-gray-500">Frequency:</span>
                    <span className="font-semibold text-gray-900 ml-1">{pattern.frequency} incidents</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Clinics:</span>
                    <span className="font-semibold text-gray-900 ml-1">{pattern.affected_clinics.length}</span>
                  </div>
                  <div className="text-xs col-span-2">
                    <span className="text-gray-500">Trend:</span>
                    <span className={`font-semibold ml-1 ${
                      pattern.severity_trend === 'increasing' ? 'text-red-600' :
                      pattern.severity_trend === 'decreasing' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {pattern.severity_trend || 'stable'}
                    </span>
                  </div>
                </div>
                {pattern.executive_summary && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-700 italic">{pattern.executive_summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6 pt-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`pb-4 px-2 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'incidents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Recent Incidents ({dashboard.recent_incidents.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`pb-4 px-2 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'plans'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Active Plans ({dashboard.active_plans.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`pb-4 px-2 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'actions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Overdue Actions ({dashboard.overdue_actions.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`pb-4 px-2 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'patterns'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                All Patterns ({dashboard.detected_patterns.length})
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'incidents' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Recent Incidents Requiring Action</h4>
                <p className="text-xs text-gray-600">Track all incidents through resolution lifecycle</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incident #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Severity</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboard.recent_incidents.map((incident) => {
                      const daysOpen = Math.floor((new Date().getTime() - new Date(incident.incident_date).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={incident.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-blue-600">{incident.incident_number}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">{incident.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{incident.description}</div>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-900">{new Date(incident.incident_date).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(incident.severity)}`}>
                              {incident.severity}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                              {incident.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className={`text-sm font-semibold ${daysOpen > 30 ? 'text-red-600' : daysOpen > 14 ? 'text-amber-600' : 'text-gray-900'}`}>
                              {daysOpen}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Active Corrective Action Plans</h4>
                <p className="text-xs text-gray-600">Root cause analysis and corrective measures with ownership and deadlines</p>
              </div>
              <div className="space-y-4">
                {dashboard.active_plans.map((plan) => (
                  <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{plan.plan_summary || 'Corrective Action Plan'}</h4>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(plan.plan_status || 'draft')}`}>
                            {(plan.plan_status || 'draft').replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{plan.root_cause_analysis}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Owner:</span>
                        <div className="font-semibold text-gray-900">{plan.owner_name || 'Unassigned'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <div className="font-semibold text-gray-900">{plan.due_date ? new Date(plan.due_date).toLocaleDateString() : 'Not set'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Effectiveness:</span>
                        <div className="font-semibold text-gray-900">
                          {plan.effectiveness_rating ? `${plan.effectiveness_rating}/5` : 'Not rated'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <div className="font-semibold text-gray-900">{new Date(plan.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {dashboard.active_plans.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No active corrective action plans</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Overdue Corrective Actions</h4>
                <p className="text-xs text-gray-600">Actions requiring immediate attention with assigned owners</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days Overdue</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboard.overdue_actions.map((action) => {
                      const daysOverdue = Math.floor((new Date().getTime() - new Date(action.due_date).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={action.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">{action.action_description}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm text-gray-900">{action.assigned_to_name || 'Unassigned'}</div>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <div className="text-sm text-gray-900">{new Date(action.due_date).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className={`text-sm font-semibold ${
                              daysOverdue > 7 ? 'text-red-600' : daysOverdue > 3 ? 'text-orange-600' : 'text-amber-600'
                            }`}>
                              {daysOverdue}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(action.action_status || 'pending')}`}>
                              {(action.action_status || 'pending').replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {dashboard.overdue_actions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No overdue actions - excellent compliance!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'patterns' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Cross-Clinic Incident Patterns</h4>
                <p className="text-xs text-gray-600">Automated pattern detection for systemic risk identification</p>
              </div>
              <div className="space-y-4">
                {dashboard.detected_patterns.map((pattern) => (
                  <div key={pattern.id} className="border border-gray-200 rounded-lg p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0">
                        {getRiskLevelIcon(pattern.risk_level || 'low')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{pattern.pattern_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{pattern.pattern_description}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ml-4 ${getSeverityColor(pattern.risk_level || 'low')}`}>
                            {pattern.risk_level} risk
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-xs text-gray-500">Frequency</div>
                            <div className="text-lg font-semibold text-gray-900">{pattern.frequency}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Affected Clinics</div>
                            <div className="text-lg font-semibold text-gray-900">{pattern.affected_clinics.length}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">First Seen</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {pattern.first_occurrence ? new Date(pattern.first_occurrence).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Last Seen</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {pattern.last_occurrence ? new Date(pattern.last_occurrence).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>

                        {pattern.systemic_root_cause && (
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="text-xs font-semibold text-amber-900 mb-1">Systemic Root Cause</div>
                            <p className="text-sm text-amber-800">{pattern.systemic_root_cause}</p>
                          </div>
                        )}

                        {pattern.recommended_actions && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-xs font-semibold text-blue-900 mb-1">Recommended Actions</div>
                            <p className="text-sm text-blue-800">{pattern.recommended_actions}</p>
                          </div>
                        )}

                        {pattern.executive_summary && (
                          <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                            <div className="text-xs font-semibold text-gray-900 mb-1">Executive Summary</div>
                            <p className="text-sm text-gray-700 italic">{pattern.executive_summary}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Legal Defensibility & Compliance</p>
            <p className="text-blue-800">
              All incidents tracked with root cause analysis, assigned ownership, documented corrective actions, and completion deadlines.
              Pattern detection enables proactive risk management. Full audit trail maintained for regulatory compliance and legal defense.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
