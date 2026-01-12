import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  PieChart,
  FileText,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  getPayerContracts,
  getContractRenewalAlerts,
  getMarginByServiceLine,
  getServicePricing,
  type PayerContract,
  type ContractRenewalAlert,
  type MarginByServiceLine,
  type ServicePricing,
} from '../../services/pricingPayerService';

export default function PricingPayerView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'pricing' | 'margins' | 'risk'>('overview');

  const [contracts, setContracts] = useState<PayerContract[]>([]);
  const [renewalAlerts, setRenewalAlerts] = useState<ContractRenewalAlert[]>([]);
  const [margins, setMargins] = useState<MarginByServiceLine[]>([]);
  const [pricing, setPricing] = useState<ServicePricing[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [contractsData, alertsData, marginsData, pricingData] = await Promise.all([
        getPayerContracts(),
        getContractRenewalAlerts(),
        getMarginByServiceLine(),
        getServicePricing(),
      ]);

      setContracts(contractsData);
      setRenewalAlerts(alertsData);
      setMargins(marginsData);
      setPricing(pricingData);
    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Pricing Intelligence...</p>
        </div>
      </div>
    );
  }

  const totalRevenue = contracts.reduce((sum, c) => sum + c.revenue_last_12_months, 0);
  const averageMargin = margins.length > 0
    ? margins.reduce((sum, m) => sum + m.gross_margin_percentage, 0) / margins.length
    : 0;

  const concentrationRisk = contracts.filter(c => c.revenue_percentage > 30).length;
  const criticalRenewals = renewalAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  const latestMargins = margins.slice(0, 1)[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pricing, Contracting & Payer Intelligence</h2>
        <p className="text-sm text-gray-600 mt-1">
          Protect margin before revenue hits the clinic
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contract Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${(totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 12 months</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Margin</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {averageMargin.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Across service lines</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concentration Risk</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{concentrationRisk}</p>
              <p className="text-xs text-gray-500 mt-1">Payers over 30%</p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              concentrationRisk > 0 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                concentrationRisk > 0 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Renewals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{criticalRenewals}</p>
              <p className="text-xs text-gray-500 mt-1">Requiring attention</p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              criticalRenewals > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <Calendar className={`h-6 w-6 ${
                criticalRenewals > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'contracts', label: 'Payer Contracts', icon: FileText },
            { id: 'pricing', label: 'Pricing Matrix', icon: DollarSign },
            { id: 'margins', label: 'Service Line Margins', icon: TrendingUp },
            { id: 'risk', label: 'Risk Analysis', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Distribution by Payer</h3>
              <div className="space-y-3">
                {contracts.slice(0, 5).map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{contract.payer_name}</p>
                        <span className="text-sm font-semibold text-gray-900">
                          {contract.revenue_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            contract.revenue_percentage > 30 ? 'bg-red-500' :
                            contract.revenue_percentage > 20 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(contract.revenue_percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">{contract.contract_type}</p>
                        <p className="text-sm text-gray-600">
                          ${(contract.revenue_last_12_months / 1000000).toFixed(2)}M
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {renewalAlerts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Contract Renewals</h3>
                <div className="space-y-3">
                  {renewalAlerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                        alert.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                        'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{alert.contract?.payer_name}</p>
                          <p className="text-sm text-gray-600 mt-1">{alert.action_required}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Action by: {new Date(alert.action_by_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.days_until_renewal} days
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {latestMargins && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Line Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      ${(latestMargins.total_revenue / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-green-700 mt-1">Current period</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Gross Margin</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {latestMargins.gross_margin_percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      ${(latestMargins.gross_margin / 1000).toFixed(0)}K profit
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Contribution Margin</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                      {latestMargins.contribution_margin_percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-purple-700 mt-1">After overhead</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Payer Contracts</h3>
              <p className="text-sm text-gray-600">Manage and monitor all payer relationships</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payer Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract End
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Annual Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue %
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{contract.payer_name}</p>
                            {contract.contract_number && (
                              <p className="text-xs text-gray-500">{contract.contract_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{contract.contract_type}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {new Date(contract.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        ${(contract.revenue_last_12_months / 1000000).toFixed(2)}M
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <span className={`text-sm font-semibold ${
                            contract.revenue_percentage > 30 ? 'text-red-600' :
                            contract.revenue_percentage > 20 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {contract.revenue_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          contract.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                          contract.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {contract.risk_level || 'low'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          contract.status === 'active' ? 'bg-green-100 text-green-800' :
                          contract.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contract.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Pricing Matrix</h3>
              <p className="text-sm text-gray-600">Compare rates across payers and services</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Standard Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payer Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variance
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pricing.map((price) => {
                    const variance = price.payer_rate ? price.payer_rate - price.standard_price : 0;
                    const variancePercent = price.payer_rate_percentage ? price.payer_rate_percentage - 100 : 0;

                    return (
                      <tr key={price.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {price.service_name}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {price.service_code || 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          ${price.standard_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {price.payer_name || 'Standard Rate'}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {price.payer_rate ? `$${price.payer_rate.toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="px-4 py-4">
                          {price.payer_rate ? (
                            <div className="flex items-center space-x-1">
                              {variancePercent > 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-green-600" />
                              ) : variancePercent < 0 ? (
                                <ArrowDownRight className="h-4 w-4 text-red-600" />
                              ) : (
                                <span className="h-4 w-4" />
                              )}
                              <span className={`text-sm font-semibold ${
                                variancePercent > 0 ? 'text-green-600' :
                                variancePercent < 0 ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {price.is_active ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'margins' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Line Margin Analysis</h3>
              <p className="text-sm text-gray-600">Profitability by service line</p>
            </div>

            <div className="space-y-4">
              {margins.map((margin) => (
                <div key={margin.id} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{margin.service_line_name}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(margin.period_start).toLocaleDateString()} - {new Date(margin.period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {margin.gross_margin_percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">Gross Margin</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-xs text-blue-700 font-medium">Revenue</p>
                      <p className="text-lg font-bold text-blue-900 mt-1">
                        ${(margin.total_revenue / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 rounded">
                      <p className="text-xs text-red-700 font-medium">Direct Costs</p>
                      <p className="text-lg font-bold text-red-900 mt-1">
                        ${(margin.direct_costs / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-xs text-green-700 font-medium">Gross Margin $</p>
                      <p className="text-lg font-bold text-green-900 mt-1">
                        ${(margin.gross_margin / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded">
                      <p className="text-xs text-purple-700 font-medium">Contribution %</p>
                      <p className="text-lg font-bold text-purple-900 mt-1">
                        {margin.contribution_margin_percentage?.toFixed(1) || '0'}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Margin Performance</span>
                      <span className="font-semibold text-gray-900">
                        {margin.gross_margin_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          margin.gross_margin_percentage >= 70 ? 'bg-green-500' :
                          margin.gross_margin_percentage >= 50 ? 'bg-blue-500' :
                          margin.gross_margin_percentage >= 30 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(margin.gross_margin_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payer Concentration Risk Analysis</h3>
              <p className="text-sm text-gray-600">Identify over-reliance on single payers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900">High Risk</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {contracts.filter(c => c.revenue_percentage > 30).length}
                    </p>
                    <p className="text-xs text-red-700 mt-1">Payers over 30%</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Medium Risk</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {contracts.filter(c => c.revenue_percentage > 20 && c.revenue_percentage <= 30).length}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">Payers 20-30%</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-yellow-600" />
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Diversified</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {contracts.filter(c => c.revenue_percentage <= 20).length}
                    </p>
                    <p className="text-xs text-green-700 mt-1">Payers under 20%</p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-900">Risk Assessment by Payer</h4>
              {contracts
                .sort((a, b) => b.revenue_percentage - a.revenue_percentage)
                .map((contract) => {
                  const riskLevel = contract.revenue_percentage > 30 ? 'high' :
                                   contract.revenue_percentage > 20 ? 'medium' : 'low';

                  return (
                    <div
                      key={contract.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        riskLevel === 'high' ? 'bg-red-50 border-red-500' :
                        riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-green-50 border-green-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <p className="font-semibold text-gray-900">{contract.payer_name}</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                              riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                              riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {riskLevel.toUpperCase()} RISK
                            </span>
                          </div>
                          <div className="flex items-center space-x-6 mt-2">
                            <div>
                              <p className="text-xs text-gray-500">Revenue Share</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {contract.revenue_percentage.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Annual Value</p>
                              <p className="text-sm font-semibold text-gray-900">
                                ${(contract.revenue_last_12_months / 1000000).toFixed(2)}M
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Contract End</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(contract.end_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        {riskLevel === 'high' && (
                          <div className="text-right">
                            <p className="text-xs font-medium text-red-700">ACTION REQUIRED</p>
                            <p className="text-xs text-red-600 mt-1">Diversify revenue sources</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-blue-900">Concentration Risk Guidelines</h4>
                  <div className="mt-2 text-sm text-blue-700 space-y-1">
                    <p>• No single payer should exceed 30% of total revenue</p>
                    <p>• Top 3 payers should not exceed 60% combined</p>
                    <p>• Diversification protects against contract loss or rate cuts</p>
                    <p>• Monitor renewal dates for high-concentration payers closely</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
