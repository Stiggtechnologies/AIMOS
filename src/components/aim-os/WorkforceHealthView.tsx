import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Heart,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MessageSquare,
  Shield,
  Battery,
  BatteryWarning,
} from 'lucide-react';
import {
  getWorkforceHealthDashboard,
  type WorkforceHealthDashboard,
  type WorkloadBalanceSummary,
  type StaffWellbeingFlag,
  type BurnoutRiskIndicator,
} from '../../services/workforceHealthService';

export default function WorkforceHealthView() {
  const [dashboard, setDashboard] = useState<WorkforceHealthDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'workload' | 'flags' | 'surveys' | 'trends'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getWorkforceHealthDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading workforce health dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading workforce health data...</div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6 text-gray-500">No data available</div>;
  }

  const getBalanceStatusColor = (status?: string) => {
    if (status === 'critical') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'strained') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getTrendColor = (direction?: string) => {
    if (direction === 'declining') return 'text-red-600';
    if (direction === 'improving') return 'text-green-600';
    return 'text-gray-600';
  };

  const getSeverityColor = (severity?: string) => {
    if (severity === 'high') return 'bg-red-100 text-red-800 border-red-200';
    if (severity === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getRiskLevelIcon = (risk?: number) => {
    if (!risk) return <Battery className="w-5 h-5 text-green-600" />;
    if (risk >= 70) return <BatteryWarning className="w-5 h-5 text-red-600" />;
    if (risk >= 50) return <BatteryWarning className="w-5 h-5 text-amber-600" />;
    return <Battery className="w-5 h-5 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Workforce Health & Burnout Prevention</h2>
        <p className="text-gray-600 mt-1">
          Reduce PT churn through early detection of burnout signals with aggregate, non-diagnostic indicators
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-1">Privacy Protection Notice</p>
            <p className="text-amber-800">
              All data shown is aggregated and non-diagnostic. Individual staff members cannot be identified.
              Minimum group size of 5 enforced for all reporting.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workforce Health Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{dashboard.overview.total_staff}</div>
            <div className="text-xs text-gray-600 mt-1">Total Staff</div>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{dashboard.overview.at_risk_count}</div>
            <div className="text-xs text-gray-600 mt-1">At Risk</div>
          </div>

          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-center mb-2">
              <BatteryWarning className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {dashboard.overview.high_risk_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">High Risk %</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {dashboard.overview.avg_burnout_score.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Avg Burnout Score</div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{dashboard.overview.active_flags}</div>
            <div className="text-xs text-gray-600 mt-1">Active Flags</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{dashboard.overview.resolved_flags_30d}</div>
            <div className="text-xs text-gray-600 mt-1">Resolved (30d)</div>
          </div>

          <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {dashboard.overview.survey_participation_rate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600 mt-1">Survey Rate</div>
          </div>

          <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-600">
              {dashboard.overview.avg_sentiment_score.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Sentiment Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Workload Balance by Department
          </h3>
          <div className="space-y-3">
            {dashboard.balance_summary.map((summary) => (
              <div key={summary.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{summary.department}</h4>
                    <p className="text-xs text-gray-500 mt-1">{summary.staff_count} staff members</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getBalanceStatusColor(summary.balance_status)}`}>
                      {summary.balance_status}
                    </span>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${getTrendColor(summary.trend_direction)}`}>
                      {summary.trend_direction === 'improving' && <TrendingUp className="w-3 h-3" />}
                      {summary.trend_direction === 'declining' && <TrendingDown className="w-3 h-3" />}
                      {summary.trend_direction}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Burnout Risk:</span>
                    <div className="flex items-center gap-1 mt-1">
                      {getRiskLevelIcon(summary.avg_burnout_risk)}
                      <span className="font-semibold text-gray-900">{summary.avg_burnout_risk?.toFixed(0) || 0}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg Overtime:</span>
                    <div className="font-semibold text-gray-900 mt-1">{summary.avg_overtime_hours?.toFixed(1) || 0}h</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Days Since PTO:</span>
                    <div className="font-semibold text-gray-900 mt-1">{summary.avg_days_since_pto?.toFixed(0) || 0}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">High Risk Staff:</span>
                    <span className="font-semibold text-red-600">{summary.high_risk_percentage?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Active Wellbeing Flags
          </h3>
          <div className="space-y-3">
            {dashboard.recent_flags.map((flag) => (
              <div key={flag.id} className={`border rounded-lg p-4 ${flag.intervention_recommended ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getSeverityColor(flag.severity)}`}>
                        {flag.severity}
                      </span>
                      <span className="text-xs text-gray-500">{flag.flag_type?.replace('_', ' ')}</span>
                      {flag.auto_generated && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Auto</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900">{flag.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-500">Flag Date:</span>
                    <div className="font-semibold text-gray-900 mt-0.5">
                      {new Date(flag.flag_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Escalation Level:</span>
                    <div className="font-semibold text-gray-900 mt-0.5">Level {flag.escalation_level || 1}</div>
                  </div>
                </div>
                {flag.intervention_recommended && (
                  <div className="mt-3 pt-3 border-t border-red-200 bg-red-50 -mx-4 -mb-4 px-4 py-2 rounded-b-lg">
                    <div className="flex items-center gap-2 text-xs text-red-900">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-semibold">Intervention Recommended</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {dashboard.recent_flags.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No active flags</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Critical Burnout Risk Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboard.critical_indicators.map(({ indicator }) => (
            <div key={indicator.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{indicator.indicator_name}</h4>
                    {indicator.intervention_trigger && (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{indicator.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <div className="font-semibold text-gray-900 mt-0.5 capitalize">{indicator.category}</div>
                </div>
                <div>
                  <span className="text-gray-500">Threshold:</span>
                  <div className="font-semibold text-gray-900 mt-0.5">{indicator.threshold_value}</div>
                </div>
                <div>
                  <span className="text-gray-500">Weight:</span>
                  <div className="font-semibold text-gray-900 mt-0.5">{indicator.severity_weight}x</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          Anonymous Pulse Surveys
        </h3>
        <div className="space-y-4">
          {dashboard.survey_insights.map(({ survey, response_count, avg_sentiment }) => (
            <div key={survey.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{survey.survey_name}</h4>
                    {survey.is_anonymous && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                        Anonymous
                      </span>
                    )}
                    {survey.is_active && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{survey.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Survey Period:</span>
                  <div className="font-semibold text-gray-900 mt-1">
                    {survey.start_date ? new Date(survey.start_date).toLocaleDateString() : 'N/A'} -
                    {survey.end_date ? new Date(survey.end_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Responses:</span>
                  <div className="font-semibold text-gray-900 mt-1">{response_count}</div>
                </div>
                <div>
                  <span className="text-gray-500">Avg Sentiment:</span>
                  <div className="font-semibold text-gray-900 mt-1">{avg_sentiment.toFixed(0)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Target Roles:</span>
                  <div className="font-semibold text-gray-900 mt-1 capitalize">
                    {survey.target_roles?.join(', ') || 'All'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-semibold mb-1">Non-Diagnostic Indicators Only</p>
              <p className="text-green-800">
                All metrics are descriptive indicators, not medical diagnoses. They identify patterns
                that may benefit from supportive intervention, not clinical conditions.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Aggregate Views Only</p>
              <p className="text-blue-800">
                Individual staff members cannot be identified from dashboard data. All reporting
                requires minimum group size of 5 to protect privacy.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Retention Protection Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">Early Detection</h4>
            </div>
            <p className="text-sm text-gray-600">
              Automated monitoring flags high-risk patterns before they lead to turnover
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-gray-900">Proactive Support</h4>
            </div>
            <p className="text-sm text-gray-600">
              Intervention recommendations enable timely support before burnout escalates
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Workload Balance</h4>
            </div>
            <p className="text-sm text-gray-600">
              Department-level insights help managers redistribute work and prevent overload
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
