import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  Flag,
  Bell,
  FileWarning,
  UserX,
  DollarSign,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  getSODRules,
  getApprovalThresholds,
  getDutyViolations,
  getOverrideTracking,
  getUnreviewedOverrides,
  getManualAnomalyFlags,
  getAuditAlerts,
  getCriticalAuditAlerts,
  getPendingApprovalWorkflows,
  calculateControlMetrics,
  type SegregationOfDutiesRule,
  type ApprovalThreshold,
  type DutyViolation,
  type OverrideTracking,
  type ManualAnomalyFlag,
  type AuditAlert,
  type ApprovalWorkflow,
} from '../../services/internalControlsService';

export default function InternalControlsView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sod' | 'thresholds' | 'violations' | 'overrides' | 'flags' | 'alerts' | 'workflows'>('overview');

  const [sodRules, setSODRules] = useState<SegregationOfDutiesRule[]>([]);
  const [thresholds, setThresholds] = useState<ApprovalThreshold[]>([]);
  const [violations, setViolations] = useState<DutyViolation[]>([]);
  const [overrides, setOverrides] = useState<OverrideTracking[]>([]);
  const [unreviewedOverrides, setUnreviewedOverrides] = useState<OverrideTracking[]>([]);
  const [anomalyFlags, setAnomalyFlags] = useState<ManualAnomalyFlag[]>([]);
  const [auditAlerts, setAuditAlerts] = useState<AuditAlert[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<AuditAlert[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [
        sodData,
        thresholdsData,
        violationsData,
        overridesData,
        unreviewedData,
        flagsData,
        alertsData,
        criticalAlertsData,
        workflowsData,
        metricsData,
      ] = await Promise.all([
        getSODRules(),
        getApprovalThresholds(),
        getDutyViolations(),
        getOverrideTracking(),
        getUnreviewedOverrides(),
        getManualAnomalyFlags(),
        getAuditAlerts(),
        getCriticalAuditAlerts(),
        getPendingApprovalWorkflows(),
        calculateControlMetrics(),
      ]);

      setSODRules(sodData);
      setThresholds(thresholdsData);
      setViolations(violationsData);
      setOverrides(overridesData);
      setUnreviewedOverrides(unreviewedData);
      setAnomalyFlags(flagsData);
      setAuditAlerts(alertsData);
      setCriticalAlerts(criticalAlertsData);
      setWorkflows(workflowsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading internal controls data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading Internal Controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Internal Controls & Fraud Prevention</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manages internal risk as headcount grows
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.criticalAlerts}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.totalAuditAlerts} total alerts</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Violations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.openViolations}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.criticalViolations} critical</p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <UserX className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unreviewed Overrides</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.unreviewedOverrides}</p>
                <p className="text-xs text-gray-500 mt-1">{metrics.flaggedForAudit} flagged</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Anomaly Flags</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.activeAnomalyFlags}</p>
                <p className="text-xs text-gray-500 mt-1">Under investigation</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Flag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'sod', label: 'SOD Rules', icon: UserX },
            { id: 'thresholds', label: 'Thresholds', icon: DollarSign },
            { id: 'violations', label: 'Violations', icon: XCircle },
            { id: 'overrides', label: 'Overrides', icon: Eye },
            { id: 'flags', label: 'Anomaly Flags', icon: Flag },
            { id: 'alerts', label: 'Audit Alerts', icon: Bell },
            { id: 'workflows', label: 'Approvals', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
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
              <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
                <h3 className="text-sm font-semibold text-red-900 mb-3">Critical Issues</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Critical Alerts</span>
                    <span className="font-bold text-red-900">{metrics.criticalAlerts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Critical Violations</span>
                    <span className="font-bold text-red-900">{metrics.criticalViolations}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">High Risk Overrides</span>
                    <span className="font-bold text-red-900">{metrics.highRiskOverrides}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Control Framework</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Active SOD Rules</span>
                    <span className="font-bold text-blue-900">{metrics.activeSODRules}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Approval Thresholds</span>
                    <span className="font-bold text-blue-900">{thresholds.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Pending Approvals</span>
                    <span className="font-bold text-blue-900">{metrics.pendingApprovals}</span>
                  </div>
                </div>
              </div>
            </div>

            {criticalAlerts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  Critical Alerts Requiring Immediate Action
                </h3>
                <div className="space-y-3">
                  {criticalAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="p-4 border-2 border-red-300 bg-red-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900">{alert.alert_message}</h4>
                          <p className="text-sm text-red-700 mt-1">
                            {alert.alert_type} • Risk Score: {alert.risk_score}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold bg-red-200 text-red-900 rounded">
                          CRITICAL
                        </span>
                      </div>
                      <div className="text-xs text-red-600">
                        Triggered: {new Date(alert.triggered_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unreviewedOverrides.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Unreviewed Overrides</h3>
                <div className="space-y-3">
                  {unreviewedOverrides.slice(0, 5).map((override) => (
                    <div key={override.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{override.override_type}</h4>
                          <p className="text-sm text-gray-600 mt-1">{override.justification}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          override.risk_assessment === 'critical' ? 'bg-red-100 text-red-800' :
                          override.risk_assessment === 'high' ? 'bg-orange-100 text-orange-800' :
                          override.risk_assessment === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {override.risk_assessment.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold text-gray-900">${override.actual_amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Transaction</p>
                          <p className="font-semibold text-gray-900">{override.transaction_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Timestamp</p>
                          <p className="font-semibold text-gray-900">{new Date(override.approval_timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sod' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segregation of Duties Rules</h3>
              <p className="text-sm text-gray-600">Incompatible role combinations that create risk</p>
            </div>

            <div className="space-y-4">
              {sodRules.map((rule) => (
                <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{rule.rule_name}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          rule.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          rule.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rule.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Rule #</p>
                          <p className="font-semibold text-gray-900">{rule.rule_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Incompatible A</p>
                          <p className="font-semibold text-gray-900">{rule.incompatible_role_a}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Incompatible B</p>
                          <p className="font-semibold text-gray-900">{rule.incompatible_role_b}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Action</p>
                          <p className="font-semibold text-gray-900">{rule.violation_action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sodRules.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <UserX className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No SOD rules configured</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'thresholds' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Approval Thresholds</h3>
              <p className="text-sm text-gray-600">Transaction approval requirements by type and amount</p>
            </div>

            <div className="space-y-4">
              {thresholds.map((threshold) => (
                <div key={threshold.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{threshold.threshold_name}</h4>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Transaction Type</p>
                          <p className="font-semibold text-gray-900">{threshold.transaction_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount Range</p>
                          <p className="font-semibold text-gray-900">
                            ${threshold.amount_min.toLocaleString()}
                            {threshold.amount_max && ` - $${threshold.amount_max.toLocaleString()}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Required Role</p>
                          <p className="font-semibold text-gray-900">{threshold.required_approver_role}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Approvals Needed</p>
                          <p className="font-semibold text-gray-900">{threshold.approver_count_required}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {thresholds.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No approval thresholds configured</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Duty Violations</h3>
              <p className="text-sm text-gray-600">Detected segregation of duty violations</p>
            </div>

            <div className="space-y-4">
              {violations.map((violation) => (
                <div key={violation.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{violation.violation_type}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          violation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          violation.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          violation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {violation.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          violation.status === 'open' ? 'bg-red-100 text-red-800' :
                          violation.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {violation.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{violation.description}</p>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Violation #</p>
                          <p className="font-semibold text-gray-900">{violation.violation_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Risk Score</p>
                          <p className="font-semibold text-gray-900">{violation.risk_score}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Detected</p>
                          <p className="font-semibold text-gray-900">{new Date(violation.detected_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {violations.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30 text-green-500" />
                  <p>No open violations</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overrides' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Override Tracking</h3>
              <p className="text-sm text-gray-600">Control overrides in the last 30 days</p>
            </div>

            <div className="space-y-4">
              {overrides.map((override) => (
                <div key={override.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{override.override_type}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          override.risk_assessment === 'critical' ? 'bg-red-100 text-red-800' :
                          override.risk_assessment === 'high' ? 'bg-orange-100 text-orange-800' :
                          override.risk_assessment === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {override.risk_assessment.toUpperCase()}
                        </span>
                        {override.flagged_for_audit && (
                          <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                            FLAGGED FOR AUDIT
                          </span>
                        )}
                        {!override.reviewed && (
                          <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded">
                            UNREVIEWED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{override.justification}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Override #</p>
                          <p className="font-semibold text-gray-900">{override.override_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Transaction</p>
                          <p className="font-semibold text-gray-900">{override.transaction_type}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-semibold text-gray-900">${override.actual_amount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Timestamp</p>
                          <p className="font-semibold text-gray-900">{new Date(override.approval_timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {overrides.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No overrides in the last 30 days</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manual Anomaly Flags</h3>
              <p className="text-sm text-gray-600">Manually flagged suspicious activity</p>
            </div>

            <div className="space-y-4">
              {anomalyFlags.map((flag) => (
                <div key={flag.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{flag.anomaly_category}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          flag.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          flag.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          flag.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {flag.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          flag.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          flag.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                          flag.status === 'escalated' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {flag.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{flag.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Flag #</p>
                          <p className="font-semibold text-gray-900">{flag.flag_number}</p>
                        </div>
                        {flag.estimated_impact && (
                          <div>
                            <p className="text-gray-600">Estimated Impact</p>
                            <p className="font-semibold text-gray-900">${flag.estimated_impact.toLocaleString()}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600">Flagged</p>
                          <p className="font-semibold text-gray-900">{new Date(flag.flagged_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {anomalyFlags.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No active anomaly flags</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit Alerts</h3>
              <p className="text-sm text-gray-600">System-generated alerts requiring review</p>
            </div>

            <div className="space-y-4">
              {auditAlerts.map((alert) => (
                <div key={alert.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{alert.alert_message}</h4>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        {alert.requires_immediate_action && (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            IMMEDIATE ACTION
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {alert.alert_type} • Risk Score: {alert.risk_score}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Alert #</p>
                          <p className="font-semibold text-gray-900">{alert.alert_number}</p>
                        </div>
                        {alert.source_system && (
                          <div>
                            <p className="text-gray-600">Source</p>
                            <p className="font-semibold text-gray-900">{alert.source_system}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600">Status</p>
                          <p className="font-semibold text-gray-900">{alert.status}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Triggered</p>
                          <p className="font-semibold text-gray-900">{new Date(alert.triggered_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {auditAlerts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No active audit alerts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Approval Workflows</h3>
              <p className="text-sm text-gray-600">Transactions awaiting approval</p>
            </div>

            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{workflow.transaction_type}</h4>
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                          PENDING
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Approval Progress</span>
                          <span className="font-semibold text-gray-900">
                            {workflow.current_approvals}/{workflow.required_approvals}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(workflow.current_approvals / workflow.required_approvals) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Workflow #</p>
                          <p className="font-semibold text-gray-900">{workflow.workflow_number}</p>
                        </div>
                        {workflow.transaction_amount && (
                          <div>
                            <p className="text-gray-600">Amount</p>
                            <p className="font-semibold text-gray-900">${workflow.transaction_amount.toLocaleString()}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600">Requested</p>
                          <p className="font-semibold text-gray-900">{new Date(workflow.requested_at).toLocaleDateString()}</p>
                        </div>
                        {workflow.approval_deadline && (
                          <div>
                            <p className="text-gray-600">Deadline</p>
                            <p className="font-semibold text-gray-900">{new Date(workflow.approval_deadline).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {workflows.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30 text-green-500" />
                  <p>No pending approval workflows</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
