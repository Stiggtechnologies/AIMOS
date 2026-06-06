import { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Activity, AlertCircle,
  AlertTriangle, Clock, PieChart, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  getFinancialKPIs,
  getAccountsReceivableAging,
  getCashFlowForecasts,
  getFinancialAlerts,
  getServiceLinePerformance,
  getFinancialSnapshots
} from '../../services/financialService';
import { TrendLineChart, BarChartComponent, PieChartComponent } from '../shared/Charts';

type TabView = 'overview' | 'ar_aging' | 'cash_flow' | 'service_lines' | 'alerts';

export default function FinancialSignalsView() {
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [kpis, setKpis] = useState<any>(null);
  const [arAging, setArAging] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [serviceLine, setServiceLine] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  async function loadFinancialData() {
    try {
      setLoading(true);
      setError(null);

      const [kpisData, arData, cashData, alertsData, serviceData, snapshotsData] = await Promise.all([
        getFinancialKPIs(),
        getAccountsReceivableAging(),
        getCashFlowForecasts(),
        getFinancialAlerts(),
        getServiceLinePerformance(),
        getFinancialSnapshots()
      ]);

      setKpis(kpisData);
      setArAging(arData);
      setCashFlow(cashData);
      setAlerts(alertsData);
      setServiceLine(serviceData);
      setSnapshots(snapshotsData);
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

  const tabs = [
    { id: 'overview' as TabView, label: 'Overview', icon: BarChart3 },
    { id: 'ar_aging' as TabView, label: 'AR Aging', icon: Clock },
    { id: 'cash_flow' as TabView, label: 'Cash Flow', icon: DollarSign },
    { id: 'service_lines' as TabView, label: 'Service Lines', icon: PieChart },
    { id: 'alerts' as TabView, label: `Alerts (${alerts.length})`, icon: AlertTriangle }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Loading financial intelligence...</span>
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
          <p className="text-gray-600 mt-1">Executive-grade financial intelligence and risk signals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Updated: {formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.totalRevenue)}</p>
                  <p className="text-xs text-gray-500 mt-2">Latest period</p>
                </div>
                <DollarSign className="h-10 w-10 text-emerald-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Operating Margin</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(kpis.operatingMargin)}</p>
                  <p className="text-xs text-gray-500 mt-2">Latest period</p>
                </div>
                <Activity className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">AR at Risk</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.atRiskAR)}</p>
                  <p className="text-xs text-red-600 mt-2">{formatPercentage(kpis.arPercentAtRisk)} of total AR</p>
                </div>
                <Clock className="h-10 w-10 text-amber-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{kpis.totalAlerts}</p>
                  <p className="text-xs text-red-600 mt-2">{kpis.criticalAlerts + kpis.highAlerts} high priority</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-500 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 6 Months)</h3>
            <TrendLineChart
              data={snapshots.slice(-6).map(s => ({
                period: s.period_end.substring(5, 7) + '/' + s.period_end.substring(0, 4),
                revenue: s.total_revenue,
                margin: s.operating_margin
              }))}
              xKey="period"
              yKeys={['revenue']}
              labels={{ revenue: 'Total Revenue ($)' }}
              height={300}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Service Lines by Revenue</h3>
              <div className="space-y-4">
                {serviceLine.slice(0, 5).map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{service.service_line}</span>
                        <span className="text-sm text-gray-600">{formatCurrency(service.total_revenue)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              service.gross_margin_percent > 40 ? 'bg-green-500' :
                              service.gross_margin_percent > 20 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(service.gross_margin_percent, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{formatPercentage(service.gross_margin_percent)} margin</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent High-Priority Alerts</h3>
              <div className="space-y-3">
                {alerts.filter((a: any) => a.severity === 'critical' || a.severity === 'high').slice(0, 4).map((alert: any) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ar_aging' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Accounts Receivable Aging Analysis</h2>
              <p className="text-sm text-gray-600 mt-1">Outstanding receivables by payer and aging period</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">0-30 Days</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">31-60 Days</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">61-90 Days</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">90+ Days</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {arAging.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.payer_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.payer_type}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(item.current_0_30_days)}</td>
                      <td className="px-6 py-4 text-sm text-right text-amber-600">{formatCurrency(item.days_31_60)}</td>
                      <td className="px-6 py-4 text-sm text-right text-orange-600">{formatCurrency(item.days_61_90)}</td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">{formatCurrency(item.days_over_90)}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{formatCurrency(item.total_outstanding)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                          item.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                          item.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cash_flow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Cash Flow Forecasts</h2>
              <p className="text-sm text-gray-600 mt-1">Forward-looking cash position projections</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Inflows</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outflows</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Confidence</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cashFlow.map((forecast: any) => (
                    <tr key={forecast.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(forecast.forecast_date)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(forecast.opening_balance)}</td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                        <div className="flex items-center justify-end">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          {formatCurrency(forecast.projected_inflows)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">
                        <div className="flex items-center justify-end">
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                          {formatCurrency(forecast.projected_outflows)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{formatCurrency(forecast.projected_closing_balance)}</td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          forecast.confidence_score >= 80 ? 'bg-green-100 text-green-800' :
                          forecast.confidence_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {forecast.confidence_score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {forecast.liquidity_risk_flag ? (
                          <AlertTriangle className="h-5 w-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-green-600">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'service_lines' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Service Line Performance</h2>
              <p className="text-sm text-gray-600 mt-1">Profitability and strategic analysis by service</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Line</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rev/Visit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin %</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Utilization</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strategy</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {serviceLine.map((service: any) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{service.service_line}</td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">{formatCurrency(service.total_revenue)}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{service.total_visits}</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(service.revenue_per_visit)}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={service.gross_margin_percent < 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          {formatPercentage(service.gross_margin_percent)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.capacity_utilization_percent >= 75 ? 'bg-green-100 text-green-800' :
                          service.capacity_utilization_percent >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(service.capacity_utilization_percent)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {service.trend_direction === 'growing' ? (
                          <TrendingUp className="h-5 w-5 text-green-500 mx-auto" />
                        ) : service.trend_direction === 'declining' ? (
                          <TrendingDown className="h-5 w-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.strategic_priority === 'expand' ? 'bg-green-100 text-green-800' :
                          service.strategic_priority === 'maintain' ? 'bg-blue-100 text-blue-800' :
                          service.strategic_priority === 'optimize' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {service.strategic_priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <AlertCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">No Active Alerts</h3>
              <p className="text-sm text-green-700">All financial metrics are within acceptable thresholds.</p>
            </div>
          ) : (
            alerts.map((alert: any) => (
              <div key={alert.id} className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                alert.severity === 'critical' ? 'border-red-500' :
                alert.severity === 'high' ? 'border-orange-500' :
                alert.severity === 'warning' ? 'border-yellow-500' :
                'border-blue-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <AlertTriangle className={`h-6 w-6 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'text-red-500' :
                      alert.severity === 'high' ? 'text-orange-500' :
                      alert.severity === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{alert.description}</p>
                      {alert.recommended_action && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-900">
                            <span className="font-semibold">Recommended Action:</span> {alert.recommended_action}
                          </p>
                        </div>
                      )}
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Alert Date: {formatDate(alert.alert_date)}</span>
                        <span>•</span>
                        <span>Type: {alert.alert_type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">About Financial Signals</h3>
        <p className="text-sm text-blue-800 leading-relaxed">
          Financial Signals provides comprehensive financial intelligence including revenue analytics, AR aging,
          cash flow forecasting, service line profitability, and automated risk alerts. All data is updated in real-time
          and designed to support proactive financial decision-making.
        </p>
      </div>
    </div>
  );
}
