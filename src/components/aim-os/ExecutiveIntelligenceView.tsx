import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  Info,
  DollarSign,
  Users,
  Activity,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  getExecutiveInsights,
  ExecutiveKPI,
  UtilizationMetric,
  ClinicalOutcome,
  ReferralPerformance,
  DriftAlert,
} from '../../services/executiveIntelligenceService';

export default function ExecutiveIntelligenceView() {
  const [kpis, setKpis] = useState<ExecutiveKPI[]>([]);
  const [utilization, setUtilization] = useState<UtilizationMetric[]>([]);
  const [clinicalOutcomes, setClinicalOutcomes] = useState<ClinicalOutcome[]>([]);
  const [referralPerformance, setReferralPerformance] = useState<ReferralPerformance[]>([]);
  const [driftAlerts, setDriftAlerts] = useState<DriftAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    try {
      const insights = await getExecutiveInsights();
      setKpis(insights.kpis);
      setUtilization(insights.utilization);
      setClinicalOutcomes(insights.clinical_outcomes);
      setReferralPerformance(insights.referral_performance);
      setDriftAlerts(insights.drift_alerts);
    } catch (error) {
      console.error('Failed to load executive insights:', error);
    } finally {
      setLoading(false);
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getStatusColor = (status: 'green' | 'amber' | 'red') => {
    if (status === 'green') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'amber') return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusDot = (status: 'green' | 'amber' | 'red') => {
    if (status === 'green') return 'bg-green-500';
    if (status === 'amber') return 'bg-amber-500';
    return 'bg-red-500';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading executive insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Executive Intelligence</h2>
        <p className="text-gray-600 mt-1">Real-time insights and performance indicators</p>
      </div>

      {driftAlerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Drift Alerts ({driftAlerts.length})
          </h3>
          <div className="space-y-3">
            {driftAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{alert.message}</h4>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {alert.category}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600">Current:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {alert.current_value.toFixed(1)}
                          {alert.metric.includes('Rate') || alert.metric.includes('Percent') ? '%' : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Target:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {alert.expected_value.toFixed(1)}
                          {alert.metric.includes('Rate') || alert.metric.includes('Percent') ? '%' : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Variance:</span>
                        <span className={`ml-2 font-semibold ${alert.variance_percent < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {alert.variance_percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg border-2 p-6 ${getStatusColor(kpi.status)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {index === 0 && <DollarSign className="w-5 h-5" />}
                {index === 2 && <Users className="w-5 h-5" />}
                {index === 4 && <Activity className="w-5 h-5" />}
                <h3 className="font-semibold text-gray-900">{kpi.label}</h3>
              </div>
              <div className={`w-3 h-3 rounded-full ${getStatusDot(kpi.status)}`} />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                <div className="text-xs text-gray-600">{kpi.period}</div>
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(kpi.change).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Utilization Intelligence
          </h3>
          <div className="space-y-4">
            {utilization.map((metric, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{metric.clinic_name}</span>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.trend)}
                    <div className={`w-3 h-3 rounded-full ${getStatusDot(metric.status)}`} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 text-xs mb-1">Capacity</div>
                    <div className="font-semibold text-gray-900">
                      {metric.capacity_utilization.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs mb-1">Provider</div>
                    <div className="font-semibold text-gray-900">
                      {metric.provider_utilization.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs mb-1">Room</div>
                    <div className="font-semibold text-gray-900">
                      {metric.room_utilization.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-2 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metric.status === 'green' ? 'bg-green-500' :
                      metric.status === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${metric.capacity_utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Clinical Outcomes
            <span className="text-xs text-gray-500 font-normal ml-2">(Aggregated, De-identified)</span>
          </h3>
          <div className="space-y-4">
            {clinicalOutcomes.map((outcome, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{outcome.metric}</span>
                  <div className={`w-3 h-3 rounded-full ${getStatusDot(outcome.status)}`} />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 text-xs mb-1">Current</div>
                    <div className="font-semibold text-gray-900">
                      {outcome.value.toFixed(1)}
                      {outcome.metric.includes('Satisfaction') ? '/5' : '%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs mb-1">Benchmark</div>
                    <div className="font-semibold text-gray-900">
                      {outcome.benchmark.toFixed(1)}
                      {outcome.metric.includes('Satisfaction') ? '/5' : '%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs mb-1">Variance</div>
                    <div className={`font-semibold ${outcome.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {outcome.variance >= 0 ? '+' : ''}{outcome.variance.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-2 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      outcome.status === 'green' ? 'bg-green-500' :
                      outcome.status === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: outcome.metric.includes('Satisfaction')
                        ? `${(outcome.value / 5) * 100}%`
                        : `${Math.min(outcome.value, 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Referral Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Source</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Volume</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Conversion</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Revenue</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Trend</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {referralPerformance.map((perf, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{perf.source}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{perf.volume}</td>
                  <td className="py-3 px-4 text-right text-gray-900">{perf.conversion_rate.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right text-gray-900">${perf.avg_revenue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      {getTrendIcon(perf.trend)}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className={`inline-block w-3 h-3 rounded-full ${getStatusDot(perf.status)}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Data Privacy Notice</p>
            <p className="text-blue-800">
              All data displayed is aggregated and de-identified. No Protected Health Information (PHI)
              or individual patient data is shown. Metrics represent organizational performance only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
