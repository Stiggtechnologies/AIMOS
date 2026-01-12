import { useState, useEffect } from 'react';
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  DollarSign,
  Users,
  Server,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { getPayerContracts, getContractRenewalAlerts, type PayerContract, type ContractRenewalAlert } from '../../services/pricingPayerService';
import { getServiceLines, type ServiceLine } from '../../services/servicePortfolioService';
import { getAnomalyDetections, getAuditFlags, type AnomalyDetection, type AuditFlag } from '../../services/internalControlsService';
import { getDataQualityAlerts, getSystemHealthScores, type DataQualityAlert, type SystemHealthScore } from '../../services/systemHealthService';
import { getObjectives, type Objective } from '../../services/strategyOKRService';
import { getValuationKPIs, type ValuationKPI } from '../../services/valuationReadinessService';

export default function MetaSystemsView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [payerContracts, setPayerContracts] = useState<PayerContract[]>([]);
  const [renewalAlerts, setRenewalAlerts] = useState<ContractRenewalAlert[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [auditFlags, setAuditFlags] = useState<AuditFlag[]>([]);
  const [dataQualityAlerts, setDataQualityAlerts] = useState<DataQualityAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthScore[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [valuationKPIs, setValuationKPIs] = useState<ValuationKPI[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [
        contracts,
        renewals,
        services,
        anomalyData,
        auditData,
        qualityData,
        healthData,
        objectivesData,
        valuationData,
      ] = await Promise.all([
        getPayerContracts(),
        getContractRenewalAlerts(),
        getServiceLines(),
        getAnomalyDetections(),
        getAuditFlags(),
        getDataQualityAlerts(),
        getSystemHealthScores(),
        getObjectives(),
        getValuationKPIs(),
      ]);

      setPayerContracts(contracts);
      setRenewalAlerts(renewals);
      setServiceLines(services);
      setAnomalies(anomalyData);
      setAuditFlags(auditData);
      setDataQualityAlerts(qualityData);
      setSystemHealth(healthData);
      setObjectives(objectivesData);
      setValuationKPIs(valuationData);
    } catch (error) {
      console.error('Error loading meta systems data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Meta Systems...</p>
        </div>
      </div>
    );
  }

  const latestValuation = valuationKPIs[0];
  const latestHealth = systemHealth[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Meta Systems</h2>
        <p className="text-sm text-gray-600 mt-1">
          Strategic management systems that govern and optimize the entire organization
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {latestHealth ? (latestHealth.overall_health_score * 100).toFixed(0) : '0'}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {latestHealth?.health_grade || 'N/A'} Grade
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active OKRs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{objectives.length}</p>
              <p className="text-xs text-gray-500 mt-1">Strategic Objectives</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {anomalies.length + auditFlags.length + dataQualityAlerts.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Requiring Attention</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valuation Readiness</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {latestValuation?.rule_of_40_score?.toFixed(0) || '0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Rule of 40 Score</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'pricing', label: 'Pricing & Payers', icon: DollarSign },
            { id: 'services', label: 'Service Portfolio', icon: Users },
            { id: 'strategy', label: 'Strategy & OKRs', icon: Target },
            { id: 'controls', label: 'Controls & Risk', icon: Shield },
            { id: 'health', label: 'System Health', icon: Zap },
            { id: 'valuation', label: 'Valuation', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900">Payer Contracts</p>
                      <p className="text-sm text-blue-700 mt-1">{payerContracts.length} active contracts</p>
                      <p className="text-xs text-blue-600 mt-1">{renewalAlerts.length} renewal alerts</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>

                  <div className="flex items-start justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">Service Portfolio</p>
                      <p className="text-sm text-green-700 mt-1">{serviceLines.length} active service lines</p>
                      <p className="text-xs text-green-600 mt-1">Strategic positioning monitored</p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>

                  <div className="flex items-start justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-purple-900">Strategy Execution</p>
                      <p className="text-sm text-purple-700 mt-1">{objectives.length} active OKRs</p>
                      <p className="text-xs text-purple-600 mt-1">Cross-organization alignment</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-red-900">Internal Controls</p>
                      <p className="text-sm text-red-700 mt-1">{anomalies.length} anomalies detected</p>
                      <p className="text-xs text-red-600 mt-1">{auditFlags.length} audit flags open</p>
                    </div>
                    <Shield className="h-8 w-8 text-red-600" />
                  </div>

                  <div className="flex items-start justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900">Data Quality</p>
                      <p className="text-sm text-yellow-700 mt-1">{dataQualityAlerts.length} active alerts</p>
                      <p className="text-xs text-yellow-600 mt-1">System health monitored</p>
                    </div>
                    <Server className="h-8 w-8 text-yellow-600" />
                  </div>

                  <div className="flex items-start justify-between p-4 bg-indigo-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-indigo-900">Valuation Readiness</p>
                      <p className="text-sm text-indigo-700 mt-1">
                        {latestValuation ? `${latestValuation.ebitda_margin.toFixed(1)}%` : 'N/A'} EBITDA margin
                      </p>
                      <p className="text-xs text-indigo-600 mt-1">Exit-ready monitoring active</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payer Contracts & Renewal Alerts</h3>
              <p className="text-sm text-gray-600">Monitor contract health and upcoming renewals</p>
            </div>

            {renewalAlerts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Upcoming Renewals</h4>
                {renewalAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alert.contract?.payer_name || 'Contract'}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.action_required}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {new Date(alert.action_by_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.days_until_renewal} days
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Active Contracts</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payerContracts.slice(0, 10).map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{contract.payer_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contract.contract_type}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(contract.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{contract.revenue_percentage.toFixed(1)}%</td>
                        <td className="px-4 py-3">
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
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Line Portfolio</h3>
              <p className="text-sm text-gray-600">Strategic service offerings and growth potential</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceLines.map((service) => (
                <div key={service.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{service.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{service.category}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                      service.status === 'active' ? 'bg-green-100 text-green-800' :
                      service.status === 'launching' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`font-medium ${
                      service.growth_potential === 'high' ? 'text-green-600' :
                      service.growth_potential === 'medium' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {service.growth_potential} growth
                    </span>
                    <span className="text-gray-500">{service.strategic_priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'strategy' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Strategic Objectives & Key Results</h3>
              <p className="text-sm text-gray-600">Organization-wide OKRs and execution tracking</p>
            </div>

            <div className="space-y-4">
              {objectives.map((objective) => (
                <div key={objective.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{objective.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                      <p className="text-xs text-gray-500 mt-1">FY{objective.fiscal_year} Q{objective.fiscal_quarter}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        objective.status === 'active' ? 'bg-green-100 text-green-800' :
                        objective.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {objective.status}
                      </span>
                      <span className="text-xs text-gray-500">Confidence: {objective.confidence_level}/10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Internal Controls & Risk Management</h3>
              <p className="text-sm text-gray-600">Anomaly detection, audit flags, and compliance monitoring</p>
            </div>

            {anomalies.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Active Anomalies</h4>
                {anomalies.map((anomaly) => (
                  <div key={anomaly.id} className="flex items-start justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{anomaly.anomaly_type}</p>
                      <p className="text-sm text-gray-600 mt-1">{anomaly.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Risk Score: {anomaly.risk_score} | Status: {anomaly.investigation_status}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                      anomaly.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      anomaly.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {anomaly.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {auditFlags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Audit Flags</h4>
                {auditFlags.map((flag) => (
                  <div key={flag.id} className="flex items-start justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{flag.flag_type}</p>
                      <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Area: {flag.area}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                      flag.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      flag.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {flag.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">System Health & Data Quality</h3>
              <p className="text-sm text-gray-600">Monitor system performance and data integrity</p>
            </div>

            {latestHealth && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Data Quality</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {(latestHealth.data_quality_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Adoption Rate</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {(latestHealth.adoption_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {(latestHealth.completion_rate_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-900">Overall Health</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {latestHealth.health_grade}
                  </p>
                </div>
              </div>
            )}

            {dataQualityAlerts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Data Quality Alerts</h4>
                {dataQualityAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alert.alert_type}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.issue_description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Table: {alert.affected_table} | Module: {alert.affected_module || 'N/A'}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'valuation' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Valuation & Exit Readiness</h3>
              <p className="text-sm text-gray-600">Key metrics for business valuation and M&A preparedness</p>
            </div>

            {latestValuation && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Revenue</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    ${(latestValuation.revenue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Growth: {latestValuation.revenue_growth_rate.toFixed(1)}%
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Adjusted EBITDA</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ${(latestValuation.adjusted_ebitda / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Margin: {latestValuation.ebitda_margin.toFixed(1)}%
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <p className="text-sm font-medium text-purple-900">Rule of 40</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {latestValuation.rule_of_40_score.toFixed(0)}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    LTV/CAC: {latestValuation.ltv_cac_ratio.toFixed(1)}x
                  </p>
                </div>

                <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <p className="text-sm font-medium text-orange-900">Gross Margin</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {latestValuation.gross_margin.toFixed(1)}%
                  </p>
                  <p className="text-xs text-orange-700 mt-1">Operating margin: {latestValuation.operating_margin.toFixed(1)}%</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Free Cash Flow</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    ${(latestValuation.free_cash_flow / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-red-700 mt-1">Quality of earnings: {(latestValuation.quality_of_earnings_score * 100).toFixed(0)}%</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                  <p className="text-sm font-medium text-indigo-900">Retention</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">
                    {latestValuation.customer_retention_rate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    NRR: {latestValuation.net_revenue_retention.toFixed(0)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
