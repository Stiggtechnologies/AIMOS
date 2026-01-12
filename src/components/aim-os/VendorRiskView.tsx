import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  FileText,
  Clock,
  Activity,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Link2,
  Target,
  Zap,
} from 'lucide-react';
import {
  getVendors,
  getVendorContracts,
  getVendorCriticality,
  getVendorRiskAssessments,
  getVendorIncidents,
  getVendorDependencies,
  getSinglePointsOfFailure,
  getExpiringContracts,
  getHighRiskVendors,
  getOpenVendorIncidents,
  type Vendor,
  type VendorContract,
  type VendorCriticality,
  type VendorRiskAssessment,
  type VendorIncident,
  type VendorDependency,
} from '../../services/vendorRiskService';

export default function VendorRiskView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'contracts' | 'criticality' | 'assessments' | 'incidents' | 'dependencies'>('overview');

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contracts, setContracts] = useState<VendorContract[]>([]);
  const [criticality, setCriticality] = useState<VendorCriticality[]>([]);
  const [assessments, setAssessments] = useState<VendorRiskAssessment[]>([]);
  const [incidents, setIncidents] = useState<VendorIncident[]>([]);
  const [dependencies, setDependencies] = useState<VendorDependency[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [vendorsData, contractsData, criticalityData, assessmentsData, incidentsData, dependenciesData] = await Promise.all([
        getVendors(),
        getVendorContracts(),
        getVendorCriticality(),
        getVendorRiskAssessments(),
        getVendorIncidents(),
        getVendorDependencies(),
      ]);

      setVendors(vendorsData);
      setContracts(contractsData);
      setCriticality(criticalityData);
      setAssessments(assessmentsData);
      setIncidents(incidentsData);
      setDependencies(dependenciesData);
    } catch (error) {
      console.error('Error loading vendor risk data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Vendor Risk Management...</p>
        </div>
      </div>
    );
  }

  const activeVendors = vendors.filter(v => v.status === 'active').length;
  const expiringContracts = contracts.filter(c => {
    const endDate = new Date(c.end_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  }).length;

  const singlePointsOfFailure = criticality.filter(c => c.is_single_point_of_failure).length;
  const criticalVendors = criticality.filter(c => c.criticality_level === 'critical').length;
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
  const highRiskVendors = assessments.filter(a => a.overall_risk_score <= 60).length;

  const totalAnnualSpend = contracts.reduce((sum, c) => sum + (c.annual_cost || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Technology & Vendor Risk Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Clinics fail operationally through vendors, not staff
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Vendors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activeVendors}</p>
              <p className="text-xs text-gray-500 mt-1">{vendors.length} total</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Single Points of Failure</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{singlePointsOfFailure}</p>
              <p className="text-xs text-gray-500 mt-1">{criticalVendors} critical vendors</p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              singlePointsOfFailure > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <AlertTriangle className={`h-6 w-6 ${
                singlePointsOfFailure > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{expiringContracts}</p>
              <p className="text-xs text-gray-500 mt-1">within 90 days</p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              expiringContracts > 0 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <Clock className={`h-6 w-6 ${
                expiringContracts > 0 ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Incidents</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{openIncidents}</p>
              <p className="text-xs text-gray-500 mt-1">{incidents.length} total incidents</p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              openIncidents > 0 ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              <Activity className={`h-6 w-6 ${
                openIncidents > 0 ? 'text-orange-600' : 'text-green-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'vendors', label: 'Vendor Registry', icon: Shield },
            { id: 'contracts', label: 'Contracts', icon: FileText },
            { id: 'criticality', label: 'Criticality & SPOF', icon: AlertTriangle },
            { id: 'assessments', label: 'Risk Assessments', icon: Target },
            { id: 'incidents', label: 'Incidents', icon: AlertCircle },
            { id: 'dependencies', label: 'Dependencies', icon: Link2 },
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Vendor Portfolio Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Total Vendors</span>
                    <span className="font-bold text-blue-900">{vendors.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Active Contracts</span>
                    <span className="font-bold text-blue-900">{contracts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Annual Spend</span>
                    <span className="font-bold text-blue-900">${(totalAnnualSpend / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Dependencies Mapped</span>
                    <span className="font-bold text-blue-900">{dependencies.length}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
                <h3 className="text-sm font-semibold text-red-900 mb-3">Critical Risk Alerts</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Single Points of Failure</span>
                    <span className="font-bold text-red-900">{singlePointsOfFailure}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">High Risk Vendors</span>
                    <span className="font-bold text-red-900">{highRiskVendors}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Open Incidents</span>
                    <span className="font-bold text-red-900">{openIncidents}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Expiring Contracts</span>
                    <span className="font-bold text-red-900">{expiringContracts}</span>
                  </div>
                </div>
              </div>
            </div>

            {singlePointsOfFailure > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Single Points of Failure - Immediate Attention Required</h3>
                <div className="space-y-3">
                  {criticality.filter(c => c.is_single_point_of_failure).slice(0, 3).map((crit) => (
                    <div
                      key={crit.id}
                      className="p-4 bg-red-50 border-l-4 border-red-500 rounded"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{crit.vendor?.vendor_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{crit.business_impact_if_down}</p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Criticality</p>
                              <p className="font-semibold text-red-700">{crit.criticality_level?.toUpperCase()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Backup Vendor</p>
                              <p className="font-semibold text-gray-900">{crit.backup_vendor_exists ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Failover Plan</p>
                              <p className="font-semibold text-gray-900">{crit.failover_plan_exists ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expiringContracts > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contracts Expiring Soon</h3>
                <div className="space-y-2">
                  {contracts
                    .filter(c => {
                      const endDate = new Date(c.end_date);
                      const today = new Date();
                      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
                    })
                    .slice(0, 5)
                    .map((contract) => {
                      const endDate = new Date(contract.end_date);
                      const today = new Date();
                      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <div key={contract.id} className="p-3 bg-yellow-50 rounded flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{contract.vendor?.vendor_name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Expires: {new Date(contract.end_date).toLocaleDateString()} ({daysUntilExpiry} days)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">${(contract.annual_cost / 1000).toFixed(0)}K/yr</p>
                            {contract.auto_renewal && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-renew</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Registry</h3>
              <p className="text-sm text-gray-600">Complete vendor portfolio</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vendor.vendor_name}</div>
                        {vendor.website && (
                          <div className="text-xs text-blue-600">{vendor.website}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{vendor.vendor_type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          vendor.status === 'active' ? 'bg-green-100 text-green-800' :
                          vendor.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          vendor.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {vendor.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.primary_contact_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.next_review_date ? new Date(vendor.next_review_date).toLocaleDateString() : 'Not scheduled'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {vendors.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No vendors registered</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Contracts & Renewals</h3>
              <p className="text-sm text-gray-600">Contract terms and renewal tracking</p>
            </div>

            <div className="space-y-4">
              {contracts.map((contract) => {
                const endDate = new Date(contract.end_date);
                const today = new Date();
                const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysUntilExpiry <= 90 && daysUntilExpiry >= 0;

                return (
                  <div key={contract.id} className={`p-4 border rounded-lg ${
                    isExpiringSoon ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{contract.vendor?.vendor_name}</h4>
                        <p className="text-sm text-gray-600">{contract.contract_type || 'Service Agreement'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">${(contract.annual_cost / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-gray-600">{contract.payment_frequency || 'annual'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Start Date</p>
                        <p className="font-semibold text-gray-900">{new Date(contract.start_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">End Date</p>
                        <p className="font-semibold text-gray-900">{new Date(contract.end_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Auto Renewal</p>
                        <p className="font-semibold text-gray-900">{contract.auto_renewal ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Notice Period</p>
                        <p className="font-semibold text-gray-900">{contract.renewal_notice_days || 90} days</p>
                      </div>
                    </div>

                    {isExpiringSoon && (
                      <div className="mt-3 flex items-center space-x-2 text-yellow-700">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Expires in {daysUntilExpiry} days</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {contracts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No contracts recorded</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'criticality' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Criticality & Single Points of Failure</h3>
              <p className="text-sm text-gray-600">Business impact and continuity planning</p>
            </div>

            <div className="space-y-4">
              {criticality.map((crit) => (
                <div
                  key={crit.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    crit.is_single_point_of_failure ? 'bg-red-50 border-red-500' :
                    crit.criticality_level === 'critical' ? 'bg-orange-50 border-orange-500' :
                    crit.criticality_level === 'high' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-gray-50 border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{crit.vendor?.vendor_name}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          crit.criticality_level === 'critical' ? 'bg-red-100 text-red-800' :
                          crit.criticality_level === 'high' ? 'bg-orange-100 text-orange-800' :
                          crit.criticality_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {crit.criticality_level?.toUpperCase()}
                        </span>
                        {crit.is_single_point_of_failure && (
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                            <Zap className="h-3 w-3 inline mr-1" />
                            SPOF
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{crit.business_impact_if_down}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                        <div>
                          <p className="text-gray-600">Patient Impact</p>
                          <p className="font-semibold text-gray-900">{crit.patient_impact || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Revenue Impact/Day</p>
                          <p className="font-semibold text-gray-900">${(crit.revenue_impact_per_day / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Backup Vendor</p>
                          <p className="font-semibold text-gray-900">{crit.backup_vendor_exists ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Failover Plan</p>
                          <p className="font-semibold text-gray-900">{crit.failover_plan_exists ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {criticality.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No criticality assessments</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Risk Assessments</h3>
              <p className="text-sm text-gray-600">Comprehensive risk scoring and compliance tracking</p>
            </div>

            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{assessment.vendor?.vendor_name}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Assessed: {new Date(assessment.assessment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Overall Risk Score</p>
                      <p className={`text-2xl font-bold ${
                        assessment.overall_risk_score >= 80 ? 'text-green-600' :
                        assessment.overall_risk_score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {assessment.overall_risk_score}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Financial Stability</p>
                      <p className="text-sm font-semibold text-gray-900">{assessment.financial_stability_score}/100</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Security Compliance</p>
                      <p className="text-sm font-semibold text-gray-900">{assessment.security_compliance_score}/100</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Performance</p>
                      <p className="text-sm font-semibold text-gray-900">{assessment.performance_reliability_score}/100</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Support</p>
                      <p className="text-sm font-semibold text-gray-900">{assessment.support_responsiveness_score}/100</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {assessment.hipaa_compliant && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        HIPAA
                      </span>
                    )}
                    {assessment.soc2_certified && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        SOC 2
                      </span>
                    )}
                    {assessment.insurance_verified && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        Insurance
                      </span>
                    )}
                    {assessment.background_check_completed && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        Background Check
                      </span>
                    )}
                  </div>

                  {assessment.next_assessment_due && (
                    <p className="text-xs text-gray-600">
                      Next assessment due: {new Date(assessment.next_assessment_due).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}

              {assessments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No risk assessments completed</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Incidents</h3>
              <p className="text-sm text-gray-600">Track vendor-related incidents and outages</p>
            </div>

            <div className="space-y-3">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    incident.severity === 'critical' ? 'bg-red-50 border-red-500' :
                    incident.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                    incident.severity === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-gray-50 border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{incident.vendor?.vendor_name}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {incident.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          incident.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {incident.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(incident.incident_date).toLocaleString()}
                      </p>

                      <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                        <div>
                          <p className="text-gray-600">Downtime</p>
                          <p className="font-semibold text-gray-900">{incident.downtime_minutes} min</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Patients Affected</p>
                          <p className="font-semibold text-gray-900">{incident.patients_affected}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Revenue Impact</p>
                          <p className="font-semibold text-gray-900">${(incident.revenue_impact / 1000).toFixed(1)}K</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {incidents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No incidents recorded</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dependencies' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Vendor Dependencies</h3>
              <p className="text-sm text-gray-600">Map vendor interdependencies and critical paths</p>
            </div>

            <div className="space-y-3">
              {dependencies.map((dep) => (
                <div key={dep.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{dep.vendor?.vendor_name}</p>
                      <p className="text-xs text-gray-600">depends on</p>
                    </div>
                    <Link2 className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{dep.depends_on_vendor?.vendor_name}</p>
                      <p className="text-xs text-gray-600">{dep.dependency_type}</p>
                    </div>
                    {dep.is_critical_path && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                        CRITICAL PATH
                      </span>
                    )}
                  </div>
                  {dep.notes && (
                    <p className="text-sm text-gray-600 mt-2">{dep.notes}</p>
                  )}
                </div>
              ))}

              {dependencies.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Link2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No vendor dependencies mapped</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
