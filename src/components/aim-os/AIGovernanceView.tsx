import { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Database,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
  BookOpen,
  Award,
  Eye,
  FileCheck,
  Clock,
  Layers,
} from 'lucide-react';
import {
  getAIGovernanceDashboard,
  type AIGovernanceDashboard,
  type DataClassification,
  type ConsentScope,
  type AIGovernanceLog,
} from '../../services/aiGovernanceService';

export default function AIGovernanceView() {
  const [dashboard, setDashboard] = useState<AIGovernanceDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'classifications' | 'consent' | 'logs' | 'compliance'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getAIGovernanceDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading AI governance dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading AI governance data...</div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6 text-gray-500">No data available</div>;
  }

  const getClassificationColor = (level?: string) => {
    if (level === 'restricted') return 'bg-red-100 text-red-800 border-red-200';
    if (level === 'confidential') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level === 'internal') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getReadinessColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getResultColor = (result?: string) => {
    if (result === 'allowed' || result === 'pass') return 'text-green-600';
    if (result === 'conditional_pass') return 'text-amber-600';
    if (result === 'denied' || result === 'fail') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Governance & Readiness</h2>
        <p className="text-gray-600 mt-1">
          Future-proof safely with data classification, consent management, and comprehensive audit logging
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Governance Layer Only - No AI Models Deployed</p>
            <p className="text-blue-800">
              This system provides AI governance infrastructure without deploying AI models. When ready to deploy AI,
              all necessary compliance, consent, and audit mechanisms are already in place.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Governance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <Database className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{dashboard.overview.total_data_assets}</div>
            <div className="text-xs text-gray-600 mt-1">Data Assets</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <Unlock className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{dashboard.overview.ai_safe_assets}</div>
            <div className="text-xs text-gray-600 mt-1">AI-Safe</div>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{dashboard.overview.ai_restricted_assets}</div>
            <div className="text-xs text-gray-600 mt-1">AI-Restricted</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {dashboard.overview.avg_readiness_score.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600 mt-1">Avg Readiness</div>
          </div>

          <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">{dashboard.overview.total_consent_scopes}</div>
            <div className="text-xs text-gray-600 mt-1">Consent Scopes</div>
          </div>

          <div className="text-center p-4 bg-teal-50 rounded-lg border border-teal-200">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-600">{dashboard.overview.active_consents}</div>
            <div className="text-xs text-gray-600 mt-1">Active Consents</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{dashboard.overview.governance_logs_7d}</div>
            <div className="text-xs text-gray-600 mt-1">Logs (7d)</div>
          </div>

          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{dashboard.overview.compliance_audits_pending}</div>
            <div className="text-xs text-gray-600 mt-1">Audits Pending</div>
          </div>
        </div>
      </div>

      {dashboard.readiness_assessment && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            AI Readiness Assessment
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Overall Readiness</span>
                  <span className={`text-2xl font-bold ${getReadinessColor(dashboard.readiness_assessment.overall_readiness_score)}`}>
                    {dashboard.readiness_assessment.overall_readiness_score?.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      (dashboard.readiness_assessment.overall_readiness_score || 0) >= 80
                        ? 'bg-green-500'
                        : (dashboard.readiness_assessment.overall_readiness_score || 0) >= 60
                        ? 'bg-blue-500'
                        : (dashboard.readiness_assessment.overall_readiness_score || 0) >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${dashboard.readiness_assessment.overall_readiness_score || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Data Classification:</span>
                  <div className={`font-semibold ${getReadinessColor(dashboard.readiness_assessment.data_classification_score)}`}>
                    {dashboard.readiness_assessment.data_classification_score?.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Consent Management:</span>
                  <div className={`font-semibold ${getReadinessColor(dashboard.readiness_assessment.consent_management_score)}`}>
                    {dashboard.readiness_assessment.consent_management_score?.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Audit Logging:</span>
                  <div className={`font-semibold ${getReadinessColor(dashboard.readiness_assessment.audit_logging_score)}`}>
                    {dashboard.readiness_assessment.audit_logging_score?.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Compliance:</span>
                  <div className={`font-semibold ${getReadinessColor(dashboard.readiness_assessment.compliance_score)}`}>
                    {dashboard.readiness_assessment.compliance_score?.toFixed(0)}%
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    dashboard.readiness_assessment.status === 'approved' ? 'bg-green-100 text-green-800' :
                    dashboard.readiness_assessment.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {dashboard.readiness_assessment.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(dashboard.readiness_assessment.assessment_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Blocking Issues</h4>
                <div className="space-y-2">
                  {dashboard.readiness_assessment.blocking_issues?.map((issue: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        issue.severity === 'high' ? 'text-red-600' :
                        issue.severity === 'medium' ? 'text-amber-600' :
                        'text-blue-600'
                      }`} />
                      <span className="text-gray-700">{issue.issue}</span>
                    </div>
                  ))}
                  {(!dashboard.readiness_assessment.blocking_issues || dashboard.readiness_assessment.blocking_issues.length === 0) && (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      No blocking issues
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
                <div className="space-y-2">
                  {dashboard.readiness_assessment.recommendations?.slice(0, 3).map((rec: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{rec.recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Data Classifications
          </h3>
          <div className="space-y-3">
            {dashboard.data_classifications.slice(0, 5).map((classification) => (
              <div key={classification.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {classification.table_name}
                        {classification.column_name && <span className="text-gray-500">.{classification.column_name}</span>}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getClassificationColor(classification.classification_level)}`}>
                        {classification.classification_level}
                      </span>
                      {classification.ai_safe && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded border border-green-200">
                          AI-Safe
                        </span>
                      )}
                      {classification.ai_restricted && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded border border-red-200">
                          AI-Restricted
                        </span>
                      )}
                      {classification.pii_flag && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                          PII
                        </span>
                      )}
                      {classification.phi_flag && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded">
                          PHI
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getReadinessColor(classification.ai_readiness_score)}`}>
                      {classification.ai_readiness_score?.toFixed(0) || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Readiness</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-gray-500">Sensitivity:</span>
                    <span className="font-semibold text-gray-900 ml-1">Level {classification.data_sensitivity_level || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Owner:</span>
                    <span className="font-semibold text-gray-900 ml-1">{classification.business_owner || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Consent Scopes
          </h3>
          <div className="space-y-3">
            {dashboard.consent_scopes.map((scope) => (
              <div key={scope.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{scope.scope_name}</h4>
                      {scope.is_active && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{scope.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    {scope.ai_usage_allowed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400 mx-auto" />
                    )}
                    <div className="text-xs text-gray-600 mt-1">AI Usage</div>
                  </div>
                  <div className="text-center">
                    {scope.anonymization_required ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mx-auto" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400 mx-auto" />
                    )}
                    <div className="text-xs text-gray-600 mt-1">Anonymization</div>
                  </div>
                  <div className="text-center">
                    {scope.human_review_required ? (
                      <CheckCircle2 className="w-5 h-5 text-amber-600 mx-auto" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400 mx-auto" />
                    )}
                    <div className="text-xs text-gray-600 mt-1">Human Review</div>
                  </div>
                </div>
                {scope.data_retention_days && (
                  <div className="mt-2 text-xs text-gray-600">
                    Retention: {scope.data_retention_days} days
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Recent Governance Activity
        </h3>
        <div className="space-y-2">
          {dashboard.recent_governance_logs.slice(0, 10).map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{log.action}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                    {log.log_type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {log.actor}
                  </span>
                  {log.table_accessed && (
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {log.table_accessed}
                    </span>
                  )}
                  {log.records_affected !== undefined && log.records_affected > 0 && (
                    <span>{log.records_affected} records</span>
                  )}
                  {log.execution_time_ms && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.execution_time_ms}ms
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {log.consent_verified && (
                  <CheckCircle2 className="w-4 h-4 text-green-600" title="Consent Verified" />
                )}
                {log.classification_verified && (
                  <Shield className="w-4 h-4 text-blue-600" title="Classification Verified" />
                )}
                {log.anonymization_applied && (
                  <Eye className="w-4 h-4 text-purple-600" title="Anonymized" />
                )}
                <span className={`text-sm font-semibold ${getResultColor(log.result)}`}>
                  {log.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-green-600" />
            Compliance Audits
          </h3>
          <div className="space-y-3">
            {dashboard.compliance_status.map((audit) => (
              <div key={audit.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{audit.framework}</h4>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        audit.status === 'completed' ? 'bg-green-100 text-green-800' :
                        audit.status === 'remediation_required' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {audit.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{audit.scope}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getResultColor(audit.result)}`}>
                      {audit.result?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs mt-2 pt-2 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{audit.critical_findings || 0}</div>
                    <div className="text-gray-600">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{audit.high_findings || 0}</div>
                    <div className="text-gray-600">High</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">{audit.medium_findings || 0}</div>
                    <div className="text-gray-600">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{audit.low_findings || 0}</div>
                    <div className="text-gray-600">Low</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Data Ownership
          </h3>
          <div className="space-y-3">
            {dashboard.data_ownership.map((owner) => (
              <div key={owner.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{owner.data_domain}</h4>
                    <p className="text-xs text-gray-600">{owner.table_name}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    owner.accountability_level === 'primary' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {owner.accountability_level}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-gray-100">
                  <div>
                    <div className="text-gray-500 mb-0.5">Business Owner:</div>
                    <div className="font-semibold text-gray-900">{owner.business_owner_name}</div>
                    <div className="text-gray-600">{owner.business_owner_role}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">Technical Owner:</div>
                    <div className="font-semibold text-gray-900">{owner.technical_owner_name}</div>
                    <div className="text-gray-600">{owner.technical_owner_role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Published Policies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboard.policy_versions.map((policy) => (
            <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{policy.policy_name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{policy.policy_code}</p>
                </div>
                {policy.is_current && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                    Current
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span>Version {policy.version}</span>
                  <span>{new Date(policy.effective_date).toLocaleDateString()}</span>
                </div>
                {policy.requires_user_reacceptance && (
                  <div className="mt-1 text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Requires reacceptance
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Readiness Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900 text-sm">Data Classification</h4>
            </div>
            <p className="text-xs text-gray-600">
              All data assets classified with AI safety flags
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900 text-sm">Consent Management</h4>
            </div>
            <p className="text-xs text-gray-600">
              Consent scopes defined for AI usage
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900 text-sm">Audit Logging</h4>
            </div>
            <p className="text-xs text-gray-600">
              Comprehensive governance logging in place
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900 text-sm">Ready to Deploy</h4>
            </div>
            <p className="text-xs text-gray-600">
              When ready, AI can be deployed safely
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-semibold mb-1">Legal Risk Mitigation</p>
              <p className="text-green-800">
                Comprehensive governance layer mitigates legal risks before AI deployment
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Compliance Ready</p>
              <p className="text-blue-800">
                HIPAA, PHIPA, PIPEDA compliance built into data classification
              </p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-900">
              <p className="font-semibold mb-1">Future-Proof</p>
              <p className="text-indigo-800">
                Ready to safely deploy AI when business needs require it
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
