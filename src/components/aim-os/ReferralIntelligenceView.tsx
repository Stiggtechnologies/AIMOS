import { useState, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  AlertTriangle,
  AlertCircle,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Activity,
  Briefcase,
  Lock,
} from 'lucide-react';
import {
  getReferralIntelligenceDashboard,
  type ReferralIntelligenceDashboard,
  type ReferralSourceWithMetrics,
  type TrendAlert,
  type EmployerIntelligence,
} from '../../services/referralService';
import { useAuth } from '../../contexts/AuthContext';

export default function ReferralIntelligenceView() {
  const { profile, isRole } = useAuth();
  const [dashboard, setDashboard] = useState<ReferralIntelligenceDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'employers'>('sources');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isRole(['clinic_manager', 'executive'])) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, [isRole]);

  async function loadDashboard() {
    try {
      const data = await getReferralIntelligenceDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading referral intelligence:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading referral intelligence...</div>
      </div>
    );
  }

  if (!isRole(['clinic_manager', 'executive'])) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            Referral & Employer Intelligence is available to Clinic Managers and Executives only.
            This module contains sensitive business relationship and revenue data.
          </p>
          {profile && (
            <p className="mt-4 text-sm text-gray-500">
              Current role: <span className="font-semibold text-gray-700">{profile.role}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6 text-gray-500">No data available</div>;
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getHealthStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    if (status === 'healthy') return 'text-green-600 bg-green-50';
    if (status === 'warning') return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskLevelColor = (risk: 'low' | 'medium' | 'high') => {
    if (risk === 'low') return 'text-green-600 bg-green-50';
    if (risk === 'medium') return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    if (severity === 'critical') return 'border-red-500 bg-red-50';
    if (severity === 'warning') return 'border-amber-500 bg-amber-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    if (severity === 'critical') return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <Activity className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Referral & Employer Intelligence</h2>
        <p className="text-gray-600 mt-1">Protect and grow revenue-critical referral relationships</p>
      </div>

      {dashboard.trend_alerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Trend Alerts ({dashboard.trend_alerts.length})
          </h3>
          <div className="space-y-3">
            {dashboard.trend_alerts.map((alert) => (
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
                        {alert.alert_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm mb-2">
                      <div>
                        <span className="text-gray-600">Current:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {alert.current_value.toFixed(1)}
                          {alert.alert_type === 'volume_decline' ? ' referrals' : '%'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Previous:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {alert.previous_value.toFixed(1)}
                          {alert.alert_type === 'volume_decline' ? ' referrals' : '%'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Change:</span>
                        <span className={`ml-2 font-semibold ${alert.change_percentage < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {alert.change_percentage > 0 ? '+' : ''}{alert.change_percentage.toFixed(0)}%
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

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{dashboard.overview.active_sources}</div>
            <div className="text-sm text-gray-600 mt-1">Active Sources</div>
            <div className="text-xs text-gray-500 mt-1">of {dashboard.overview.total_sources} total</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{dashboard.overview.total_referrals_30d}</div>
            <div className="text-sm text-gray-600 mt-1">Referrals (30d)</div>
            <div className="text-xs text-gray-500 mt-1">
              {dashboard.overview.total_referrals_30d > dashboard.overview.total_referrals_60d ? '+' : ''}
              {dashboard.overview.total_referrals_30d - dashboard.overview.total_referrals_60d} vs prior
            </div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{dashboard.overview.overall_conversion_rate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600 mt-1">Conversion Rate</div>
            <div className="text-xs text-gray-500 mt-1">{dashboard.conversion_metrics.converted_referrals} converted</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <div className="text-3xl font-bold text-amber-600">{dashboard.overview.avg_time_to_first_appt.toFixed(1)}</div>
            <div className="text-sm text-gray-600 mt-1">Avg Days to Appt</div>
            <div className="text-xs text-gray-500 mt-1">{dashboard.overview.sla_compliance_rate.toFixed(0)}% SLA compliant</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Conversion Funnel
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Total Referrals</span>
                <span className="text-sm font-bold text-gray-900">{dashboard.conversion_metrics.total_referrals}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Converted</span>
                <span className="text-sm font-bold text-green-600">{dashboard.conversion_metrics.converted_referrals}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${dashboard.conversion_metrics.conversion_rate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Pending</span>
                <span className="text-sm font-bold text-amber-600">{dashboard.conversion_metrics.pending_referrals}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3">
                <div
                  className="bg-amber-500 h-3 rounded-full"
                  style={{
                    width: `${(dashboard.conversion_metrics.pending_referrals / dashboard.conversion_metrics.total_referrals) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Lost</span>
                <span className="text-sm font-bold text-red-600">{dashboard.conversion_metrics.lost_referrals}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{
                    width: `${(dashboard.conversion_metrics.lost_referrals / dashboard.conversion_metrics.total_referrals) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
            Average time to conversion: <span className="font-semibold text-gray-900">{dashboard.conversion_metrics.avg_conversion_days} days</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Time to First Appointment
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{dashboard.time_to_appt_metrics.avg_days}</div>
                <div className="text-xs text-gray-600 mt-1">Average Days</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{dashboard.time_to_appt_metrics.median_days}</div>
                <div className="text-xs text-gray-600 mt-1">Median Days</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Within 24 hours</span>
                <span className="font-semibold text-green-600">{dashboard.time_to_appt_metrics.within_24h}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Within 48 hours</span>
                <span className="font-semibold text-blue-600">{dashboard.time_to_appt_metrics.within_48h}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Within 72 hours</span>
                <span className="font-semibold text-amber-600">{dashboard.time_to_appt_metrics.within_72h}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Over 72 hours</span>
                <span className="font-semibold text-red-600">{dashboard.time_to_appt_metrics.over_72h}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6 pt-4">
            <button
              onClick={() => setActiveTab('sources')}
              className={`pb-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'sources'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Referral Sources ({dashboard.sources_with_metrics.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('employers')}
              className={`pb-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'employers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Employer Accounts ({dashboard.employer_intelligence.length})
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'sources' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type / Tier</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">30d Volume</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Conversion</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Days</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SLA</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Revenue 30d</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboard.sources_with_metrics.map((source) => (
                    <tr key={source.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">{source.organization_name}</div>
                        <div className="text-xs text-gray-500">{source.contact_person}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-gray-600 capitalize">{source.source_type}</div>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            source.relationship_tier === 'platinum'
                              ? 'bg-purple-100 text-purple-800'
                              : source.relationship_tier === 'gold'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {source.relationship_tier}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-semibold text-gray-900">{source.referral_count_30d}</span>
                          {getTrendIcon(source.trend)}
                        </div>
                        <div className={`text-xs ${source.trend_percentage > 0 ? 'text-green-600' : source.trend_percentage < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {source.trend_percentage > 0 ? '+' : ''}{source.trend_percentage.toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm font-semibold text-gray-900">{source.conversion_rate.toFixed(0)}%</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm text-gray-900">{source.avg_time_to_first_appt.toFixed(1)}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className={`text-sm font-semibold ${source.sla_compliance_rate >= 90 ? 'text-green-600' : source.sla_compliance_rate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                          {source.sla_compliance_rate.toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm font-semibold text-green-600">${(source.revenue_30d / 1000).toFixed(0)}K</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getHealthStatusColor(source.health_status)}`}>
                          {source.health_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboard.employer_intelligence.map((employer) => (
                <div key={employer.employer_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{employer.employer_name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {employer.employee_count.toLocaleString()} employees
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${(employer.contract_value / 1000).toFixed(0)}K contract
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold text-gray-900">{employer.health_score}</div>
                      <div className="text-xs text-gray-600">Health Score</div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(employer.risk_level)}`}>
                        {employer.risk_level} risk
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600 mb-1">30d Volume</div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-gray-900">{employer.referral_volume_30d}</span>
                        {getTrendIcon(employer.referral_volume_trend)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600 mb-1">Conversion</div>
                      <div className="text-lg font-bold text-gray-900">{employer.conversion_rate.toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600 mb-1">Revenue 30d</div>
                      <div className="text-lg font-bold text-green-600">${(employer.total_revenue_30d / 1000).toFixed(0)}K</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600 mb-1">Last Referral</div>
                      <div className="text-lg font-bold text-gray-900">{employer.days_since_last_referral}d ago</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-900">
            <p className="font-semibold mb-1">Revenue Protection & Growth</p>
            <p className="text-green-800">
              30-day referral revenue: <span className="font-semibold">${dashboard.overview.total_revenue_30d.toLocaleString()}</span> |
              At-risk revenue: <span className="font-semibold">${dashboard.overview.revenue_at_risk.toLocaleString()}</span> |
              Total employer contract value: <span className="font-semibold">${(dashboard.employer_intelligence.reduce((sum, e) => sum + e.contract_value, 0) / 1000000).toFixed(1)}M</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
