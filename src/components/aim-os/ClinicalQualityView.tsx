import { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Trophy,
  Shield,
  Clock,
  Heart,
} from 'lucide-react';
import {
  getQualityDashboard,
  type QualityDashboard,
  type OutcomeTrend,
  type ClinicBenchmark,
  type AnonymizedClinicianPerformance,
  type QualityIndicator,
  type IndustryBenchmark,
} from '../../services/clinicalQualityService';

export default function ClinicalQualityView() {
  const [dashboard, setDashboard] = useState<QualityDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'clinics' | 'clinicians' | 'industry'>('trends');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getQualityDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading quality dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading clinical quality data...</div>
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

  const getCategoryIcon = (category: string) => {
    if (category === 'clinical') return <Activity className="w-4 h-4" />;
    if (category === 'satisfaction') return <Heart className="w-4 h-4" />;
    if (category === 'safety') return <Shield className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    if (category === 'clinical') return 'text-blue-600 bg-blue-50';
    if (category === 'satisfaction') return 'text-pink-600 bg-pink-50';
    if (category === 'safety') return 'text-green-600 bg-green-50';
    return 'text-purple-600 bg-purple-50';
  };

  const getTierColor = (tier: string) => {
    if (tier === 'top') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (tier === 'above_avg') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (tier === 'avg') return 'text-gray-600 bg-gray-50 border-gray-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  const getComparisonColor = (comparison: string) => {
    if (comparison === 'above_p90') return 'text-emerald-600 bg-emerald-50';
    if (comparison === 'above_p75') return 'text-blue-600 bg-blue-50';
    if (comparison === 'above_avg') return 'text-gray-600 bg-gray-50';
    return 'text-amber-600 bg-amber-50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Clinical Quality & Outcomes</h2>
        <p className="text-gray-600 mt-1">Build quality as a competitive moat - aggregate views only, no PHI</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Performance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{dashboard.overview.total_episodes}</div>
            <div className="text-sm text-gray-600 mt-1">Total Episodes</div>
            <div className="text-xs text-gray-500 mt-1">{dashboard.overview.completed_episodes} completed</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{dashboard.overview.avg_improvement.toFixed(1)}%</div>
            <div className="text-sm text-gray-600 mt-1">Avg Improvement</div>
            <div className="text-xs text-gray-500 mt-1">Functional outcomes</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{dashboard.overview.patient_satisfaction_avg.toFixed(1)}</div>
            <div className="text-sm text-gray-600 mt-1">Patient Satisfaction</div>
            <div className="text-xs text-gray-500 mt-1">out of 10</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-3xl font-bold text-emerald-600">{dashboard.overview.excellent_outcomes_pct.toFixed(1)}%</div>
            <div className="text-sm text-gray-600 mt-1">Excellent Outcomes</div>
            <div className="text-xs text-gray-500 mt-1">{dashboard.overview.readmission_rate.toFixed(1)}% readmissions</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Key Quality Indicators
          </h3>
          <div className="space-y-3">
            {dashboard.quality_indicators.slice(0, 6).map((indicator) => (
              <div key={indicator.indicator_name} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`p-1.5 rounded ${getCategoryColor(indicator.category)}`}>
                      {getCategoryIcon(indicator.category)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{indicator.indicator_name}</div>
                      <div className="text-xs text-gray-500 capitalize">{indicator.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(indicator.trend)}
                    {indicator.meets_target && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm ml-11">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{indicator.current_value.toFixed(1)}</span>
                    <span className="text-gray-600">{indicator.unit}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Target: {indicator.target_value.toFixed(1)}{indicator.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            vs. Industry Benchmarks
          </h3>
          <div className="space-y-4">
            {dashboard.industry_benchmarks.map((benchmark) => (
              <div key={benchmark.metric_name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{benchmark.metric_name}</span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getComparisonColor(benchmark.comparison)}`}>
                    {benchmark.comparison.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <span className="font-semibold text-gray-900">
                    Us: {benchmark.our_value}{benchmark.unit}
                  </span>
                  <span>|</span>
                  <span>P50: {benchmark.industry_p50}{benchmark.unit}</span>
                  <span>|</span>
                  <span>P75: {benchmark.industry_p75}{benchmark.unit}</span>
                  <span>|</span>
                  <span>P90: {benchmark.industry_p90}{benchmark.unit}</span>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute h-2 bg-gradient-to-r from-amber-300 via-blue-400 to-emerald-500"
                    style={{ width: '100%' }}
                  />
                  <div
                    className="absolute h-2 w-1 bg-gray-900"
                    style={{
                      left: `${Math.min(
                        100,
                        Math.max(0, ((benchmark.our_value - benchmark.industry_p50) / (benchmark.industry_p90 - benchmark.industry_p50)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6 pt-4">
            <button
              onClick={() => setActiveTab('trends')}
              className={`pb-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'trends'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Outcome Trends
              </div>
            </button>
            <button
              onClick={() => setActiveTab('clinics')}
              className={`pb-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'clinics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Clinic Benchmarks ({dashboard.clinic_benchmarks.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('clinicians')}
              className={`pb-4 px-2 border-b-2 font-semibold transition-colors ${
                activeTab === 'clinicians'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clinician Performance (Anonymized)
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'trends' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">6-Month Outcome Trends</h4>
                <p className="text-xs text-gray-600">Aggregated clinical outcomes across all episodes (no PHI)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Episodes</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Improvement</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Satisfaction</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Excellent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboard.outcome_trends.map((trend) => (
                      <tr key={trend.period} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{trend.month}</div>
                          <div className="text-xs text-gray-500">{trend.period}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900">{trend.total_episodes}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-green-600">{trend.avg_improvement.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-purple-600">{trend.patient_satisfaction.toFixed(1)}/10</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-blue-600">{trend.completion_rate.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-emerald-600">{trend.excellent_outcomes}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'clinics' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Clinic Performance Benchmarks</h4>
                <p className="text-xs text-gray-600">Compare performance across network locations</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clinic</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Episodes</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Improvement</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Satisfaction</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completion</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Excellent %</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">vs Network</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboard.clinic_benchmarks.map((clinic) => (
                      <tr key={clinic.clinic_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            {clinic.rank <= 3 && <Trophy className="w-4 h-4 text-amber-500 mr-1" />}
                            <span className="text-sm font-semibold text-gray-900">{clinic.rank}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-gray-900">{clinic.clinic_name}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm text-gray-900">{clinic.total_episodes}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-green-600">{clinic.avg_improvement.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-purple-600">{clinic.patient_satisfaction.toFixed(1)}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm text-gray-900">{clinic.completion_rate.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-emerald-600">{clinic.excellent_outcomes_pct.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className={`text-sm font-semibold ${clinic.vs_network_avg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {clinic.vs_network_avg >= 0 ? '+' : ''}{clinic.vs_network_avg.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getTierColor(clinic.performance_tier)}`}>
                            {clinic.performance_tier.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'clinicians' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Anonymized Clinician Performance</h4>
                <p className="text-xs text-gray-600">Aggregate outcomes by provider (fully anonymized, no identifying info)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Episodes</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Improvement</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Satisfaction</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completion</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Excellent %</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">vs Avg</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboard.clinician_performance.map((clinician) => (
                      <tr key={clinician.clinician_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-gray-900">{clinician.clinician_label}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                            {clinician.specialty}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm text-gray-900">{clinician.total_episodes}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-green-600">{clinician.avg_improvement.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-purple-600">{clinician.patient_satisfaction.toFixed(1)}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm text-gray-900">{clinician.completion_rate.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-emerald-600">{clinician.excellent_outcomes_pct.toFixed(1)}%</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className={`text-sm font-semibold ${clinician.vs_avg >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {clinician.vs_avg >= 0 ? '+' : ''}{clinician.vs_avg.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getTierColor(clinician.performance_tier)}`}>
                            {clinician.performance_tier.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">PHI Protection & Data Aggregation</p>
            <p className="text-blue-800">
              All data displayed is aggregated and anonymized. No Protected Health Information (PHI) or personally identifiable clinician data is shown.
              Episode-level data uses reference codes only. This enables quality benchmarking while maintaining strict privacy compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
