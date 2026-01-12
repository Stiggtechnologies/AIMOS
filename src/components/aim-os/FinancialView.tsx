import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Activity, AlertCircle } from 'lucide-react';
import { getFinancialSnapshots, getClinicFinancialMetrics } from '../../services/financialService';
import FinancialSignalsView from './FinancialSignalsView';

export default function FinancialView() {
  return <FinancialSignalsView />;
}

export function FinancialViewBasic() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  async function loadFinancialData() {
    try {
      setLoading(true);
      setError(null);

      const snapshotsData = await getFinancialSnapshots();
      setSnapshots(snapshotsData);

      const metricsData = await getClinicFinancialMetrics();
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const latestSnapshot = snapshots[0];
  const previousSnapshot = snapshots[1];

  function calculateChange(current?: number, previous?: number): { value: number; isPositive: boolean } | null {
    if (!current || !previous) return null;
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  }

  const revenueChange = latestSnapshot?.variance_vs_prior_period_percent
    ? { value: Math.abs(latestSnapshot.variance_vs_prior_period_percent), isPositive: latestSnapshot.variance_vs_prior_period_percent >= 0 }
    : calculateChange(latestSnapshot?.total_revenue, previousSnapshot?.total_revenue);

  const revenuePerVisitChange = calculateChange(
    latestSnapshot?.revenue_per_visit,
    previousSnapshot?.revenue_per_visit
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading financial data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Signals</h1>
          <p className="text-gray-600 mt-1">Executive-grade financial insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {latestSnapshot ? `${formatDate(latestSnapshot.period_start)} - ${formatDate(latestSnapshot.period_end)}` : 'No data'}
          </span>
        </div>
      </div>

      {snapshots.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <DollarSign className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">No Financial Data Yet</h3>
          <p className="text-sm text-blue-700 max-w-md mx-auto">
            Financial snapshots will appear here once data is recorded. These provide high-level insights into revenue, utilization, and financial performance.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestSnapshot ? formatCurrency(latestSnapshot.total_revenue) : '-'}
                  </p>
                  {revenueChange && (
                    <div className={`flex items-center mt-2 text-sm ${revenueChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {revenueChange.isPositive ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      <span>{formatPercentage(revenueChange.value)} vs prev period</span>
                    </div>
                  )}
                </div>
                <DollarSign className="h-10 w-10 text-emerald-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Visits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestSnapshot ? latestSnapshot.total_visits.toLocaleString() : '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Patient encounters</p>
                </div>
                <Activity className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Revenue per Visit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestSnapshot?.revenue_per_visit ? formatCurrency(latestSnapshot.revenue_per_visit) : '-'}
                  </p>
                  {revenuePerVisitChange && (
                    <div className={`flex items-center mt-2 text-sm ${revenuePerVisitChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {revenuePerVisitChange.isPositive ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      <span>{formatPercentage(revenuePerVisitChange.value)}</span>
                    </div>
                  )}
                </div>
                <TrendingUp className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Margin</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestSnapshot?.operating_margin_percent ? formatPercentage(latestSnapshot.operating_margin_percent) : '-'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Operating margin</p>
                </div>
                <Activity className="h-10 w-10 text-amber-500 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Financial Snapshots</h2>
              <p className="text-sm text-gray-600 mt-1">Historical performance over time</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rev/Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rev/Hour
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margin %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {snapshots.slice(0, 10).map((snapshot) => (
                    <tr key={snapshot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(snapshot.period_start)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(snapshot.total_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {snapshot.total_visits.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {snapshot.revenue_per_visit ? formatCurrency(snapshot.revenue_per_visit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {snapshot.revenue_per_clinician_hour ? formatCurrency(snapshot.revenue_per_clinician_hour) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {snapshot.operating_margin_percent ? formatPercentage(snapshot.operating_margin_percent) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {snapshot.trend_direction && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            snapshot.trend_direction === 'improving' ? 'bg-green-100 text-green-800' :
                            snapshot.trend_direction === 'declining' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {snapshot.trend_direction}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {metrics.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quarterly Performance</h2>
                <p className="text-sm text-gray-600 mt-1">Detailed financial metrics by period</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margin %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variance vs Prior
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trend
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alert
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.slice(0, 10).map((metric) => (
                      <tr key={metric.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(metric.period_start)} - {formatDate(metric.period_end)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(metric.total_revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.total_visits?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {metric.operating_margin_percent ? formatPercentage(metric.operating_margin_percent) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {metric.variance_vs_prior_period_percent !== null && metric.variance_vs_prior_period_percent !== undefined ? (
                            <span className={metric.variance_vs_prior_period_percent >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {metric.variance_vs_prior_period_percent > 0 ? '+' : ''}{formatPercentage(metric.variance_vs_prior_period_percent)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {metric.trend_direction && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              metric.trend_direction === 'improving' ? 'bg-green-100 text-green-800' :
                              metric.trend_direction === 'declining' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {metric.trend_direction}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {metric.alert_flag && metric.alert_message ? (
                            <span className="text-amber-600 font-medium">{metric.alert_message}</span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">About Financial Signals</h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          Financial Signals provides executive-grade insights into revenue performance, visit metrics, and operational efficiency.
          Track key performance indicators across time periods to identify trends and opportunities for optimization.
        </p>
      </div>
    </div>
  );
}
