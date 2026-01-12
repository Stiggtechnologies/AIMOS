import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Building2, Users, AlertCircle, CheckCircle,
  Download, RefreshCw, BarChart3, Activity, Shield, Clock, ArrowUpRight,
  Filter, Calendar, ChevronDown, FileText, Zap
} from 'lucide-react';
import {
  analyticsReportingService,
  ExecutiveSummary,
  OperationalHealth,
  ClinicPerformance,
  CredentialImpact,
  MetricTrendPoint
} from '../../services/analyticsReportingService';

type ViewMode = 'overview' | 'operational' | 'compliance' | 'performance' | 'trends';

export default function ExecutiveAnalyticsView() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [operationalHealth, setOperationalHealth] = useState<OperationalHealth[]>([]);
  const [clinicPerformance, setClinicPerformance] = useState<ClinicPerformance[]>([]);
  const [credentialImpact, setCredentialImpact] = useState<CredentialImpact[]>([]);
  const [trendData, setTrendData] = useState<MetricTrendPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'open_cases' | 'expired_credentials' | 'active_staff'>('open_cases');
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  useEffect(() => {
    if (viewMode === 'trends') {
      loadTrendData();
    }
  }, [viewMode, selectedMetric, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [summaryData, healthData, performanceData, impactData] = await Promise.all([
        analyticsReportingService.getExecutiveSummary(),
        analyticsReportingService.getOperationalHealth(),
        analyticsReportingService.getClinicPerformanceComparison(),
        analyticsReportingService.getCredentialImpact(undefined, 'high_risk')
      ]);

      setSummary(summaryData);
      setOperationalHealth(healthData);
      setClinicPerformance(performanceData);
      setCredentialImpact(impactData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = async () => {
    try {
      const data = await analyticsReportingService.getMetricTrend(selectedMetric, undefined, timeRange);
      setTrendData(data);
    } catch (error) {
      console.error('Error loading trend data:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const data = viewMode === 'operational' ? operationalHealth :
        viewMode === 'performance' ? clinicPerformance :
        viewMode === 'compliance' ? credentialImpact :
        [summary];

      const filename = `analytics_${viewMode}_${new Date().toISOString().split('T')[0]}.${format}`;

      if (format === 'csv') {
        await analyticsReportingService.exportToCSV(data, filename);
      } else {
        await analyticsReportingService.exportToJSON(data, filename);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Executive Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive insights across all operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Operational Health</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {analyticsReportingService.formatNumber(summary.avg_operational_health, 1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Average score</p>
              </div>
              <Activity className={`w-8 h-8 ${
                summary.avg_operational_health >= 80 ? 'text-green-600' :
                summary.avg_operational_health >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Clinics</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_active_clinics}</p>
                <p className="text-xs text-gray-500 mt-1">{summary.total_active_staff} staff</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_open_cases}</p>
                <p className="text-xs text-red-600 mt-1">{summary.critical_cases} critical</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Risk</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{summary.staff_at_risk}</p>
                <p className="text-xs text-gray-500 mt-1">Staff at risk</p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Secondary Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Capacity Utilization</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {analyticsReportingService.formatPercentage(summary.capacity_utilization_pct)}
                </p>
              </div>
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 font-medium">Avg Case Age</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {analyticsReportingService.formatNumber(summary.avg_case_age_days, 1)} days
                </p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Active Escalations</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{summary.active_escalations}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'operational', label: 'Operational Health', icon: Activity },
              { key: 'performance', label: 'Clinic Performance', icon: TrendingUp },
              { key: 'compliance', label: 'Compliance Risk', icon: Shield },
              { key: 'trends', label: 'Trends', icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as ViewMode)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  viewMode === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {viewMode === 'overview' && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Total Expired Credentials</span>
                      <span className="text-lg font-semibold text-red-600">
                        {summary.total_expired_credentials}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Credentials Expiring Soon</span>
                      <span className="text-lg font-semibold text-orange-600">
                        {summary.credentials_expiring_soon}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Unacknowledged Alerts</span>
                      <span className="text-lg font-semibold text-yellow-600">
                        {summary.unacknowledged_alerts}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Concerns</h3>
                  <div className="space-y-3">
                    {summary.staff_at_risk > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900">{summary.staff_at_risk} Staff at Risk</p>
                          <p className="text-xs text-red-700 mt-1">
                            Staff with expired or expiring credentials
                          </p>
                        </div>
                      </div>
                    )}
                    {summary.critical_cases > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-900">{summary.critical_cases} Critical Cases</p>
                          <p className="text-xs text-orange-700 mt-1">
                            Cases requiring immediate attention
                          </p>
                        </div>
                      </div>
                    )}
                    {summary.active_escalations > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">{summary.active_escalations} Active Escalations</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Cases escalated to management
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'operational' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Operational Health by Clinic</h3>
                <span className="text-sm text-gray-600">{operationalHealth.length} clinics</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Clinic</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Health Score</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Staff</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Credentials</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Open Cases</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Alerts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {operationalHealth.map((clinic) => (
                      <tr key={clinic.clinic_id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{clinic.clinic_name}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            analyticsReportingService.getHealthScoreColor(clinic.health_score)
                          }`}>
                            {analyticsReportingService.formatNumber(clinic.health_score, 1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm">
                          {clinic.active_staff} / {clinic.total_staff}
                        </td>
                        <td className="py-3 px-4 text-center text-sm">
                          <span className={clinic.expired_credentials > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                            {clinic.expired_credentials > 0 && `${clinic.expired_credentials} expired`}
                            {clinic.expiring_soon_credentials > 0 && ` (${clinic.expiring_soon_credentials} expiring)`}
                            {clinic.expired_credentials === 0 && clinic.expiring_soon_credentials === 0 && '✓ Compliant'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={clinic.critical_cases > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                            {clinic.open_cases} {clinic.critical_cases > 0 && `(${clinic.critical_cases} critical)`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {clinic.unack_aging_alerts > 0 ? (
                            <span className="text-orange-600 font-medium">{clinic.unack_aging_alerts}</span>
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'performance' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Clinic Performance Comparison</h3>
                <span className="text-sm text-gray-600">{clinicPerformance.length} clinics</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Clinic</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Performance Score</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Cases</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Completion Rate</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Avg Duration</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Staff Productivity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clinicPerformance.map((clinic) => (
                      <tr key={clinic.clinic_id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{clinic.clinic_name}</p>
                          <p className="text-xs text-gray-500">{clinic.staff_count} staff</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            analyticsReportingService.getHealthScoreColor(clinic.overall_performance_score)
                          }`}>
                            {analyticsReportingService.formatNumber(clinic.overall_performance_score, 1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm">
                          {clinic.completed_cases} / {clinic.total_cases}
                        </td>
                        <td className="py-3 px-4 text-center text-sm">
                          {clinic.total_cases > 0 ?
                            analyticsReportingService.formatPercentage((clinic.completed_cases / clinic.total_cases) * 100) :
                            'N/A'
                          }
                        </td>
                        <td className="py-3 px-4 text-center text-sm">
                          {analyticsReportingService.formatNumber(clinic.avg_case_duration_days, 1)} days
                        </td>
                        <td className="py-3 px-4 text-center text-sm font-medium">
                          {analyticsReportingService.formatNumber(clinic.staff_productivity_score, 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'compliance' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">High-Risk Credential Issues</h3>
                <span className="text-sm text-gray-600">{credentialImpact.length} staff at risk</span>
              </div>
              {credentialImpact.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">No high-risk credential issues</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Staff Member</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Clinic</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Credentials</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Active Cases</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {credentialImpact.map((item) => (
                        <tr key={item.staff_id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{item.staff_name}</p>
                            <p className="text-xs text-gray-500">{item.employment_type}</p>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">{item.clinic_name}</td>
                          <td className="py-3 px-4 text-center text-sm">
                            <span className="text-red-600 font-medium">
                              {item.expired_credentials} expired
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-sm font-medium">
                            {item.active_cases}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              analyticsReportingService.getRiskLevelColor(item.risk_level)
                            }`}>
                              {item.risk_level.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {viewMode === 'trends' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Metric Trends</h3>
                <div className="flex items-center gap-3">
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value as any)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="open_cases">Open Cases</option>
                    <option value="expired_credentials">Expired Credentials</option>
                    <option value="active_staff">Active Staff</option>
                  </select>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="space-y-2">
                  {trendData.map((point, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 w-24">
                        {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex-1 bg-white rounded h-6 relative overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${(point.value / Math.max(...trendData.map(p => p.value))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {analyticsReportingService.formatNumber(point.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
