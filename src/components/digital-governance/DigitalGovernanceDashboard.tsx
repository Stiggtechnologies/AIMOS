import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Database,
  UserPlus,
  UserMinus,
  FileText,
} from 'lucide-react';
import { getDigitalGovernanceDashboard, type DigitalGovernanceDashboard } from '../../services/digitalGovernanceService';

export default function DigitalGovernanceDashboardView() {
  const [dashboard, setDashboard] = useState<DigitalGovernanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'users' | 'onboarding' | 'audit'>('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getDigitalGovernanceDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Digital Governance Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Failed to load dashboard</p>
      </div>
    );
  }

  const mfaStatus = dashboard.mfa_compliance_percentage >= 95 ? 'good' : dashboard.mfa_compliance_percentage >= 80 ? 'warning' : 'critical';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Digital Governance Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Centralized access control and compliance management</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* MFA Compliance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">MFA Compliance</span>
            {mfaStatus === 'good' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : mfaStatus === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {dashboard.mfa_compliance_percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {dashboard.users_without_mfa} users without MFA
          </div>
        </div>

        {/* Admin Count */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Admins</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboard.admin_count}</div>
          <div className="text-xs text-gray-500 mt-1">Workspace administrators</div>
        </div>

        {/* Active Licenses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Active Licenses</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboard.active_license_count}</div>
          <div className="text-xs text-gray-500 mt-1">Total user accounts</div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Alerts</span>
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{dashboard.alerts.length}</div>
          <div className="text-xs text-gray-500 mt-1">Requiring attention</div>
        </div>
      </div>

      {/* Alerts Section */}
      {dashboard.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Alerts
          </h2>
          <div className="space-y-3">
            {dashboard.alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border border-red-200'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    alert.severity === 'high'
                      ? 'text-red-600'
                      : alert.severity === 'medium'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-1">Type: {alert.type.replace(/_/g, ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Changes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Recent Changes (Last 7 Days)
        </h2>
        {dashboard.recent_changes.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent changes</p>
        ) : (
          <div className="space-y-2">
            {dashboard.recent_changes.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {log.action.includes('user') ? (
                    <Users className="w-4 h-4 text-blue-600" />
                  ) : log.action.includes('asset') ? (
                    <Database className="w-4 h-4 text-green-600" />
                  ) : log.action.includes('onboarding') ? (
                    <UserPlus className="w-4 h-4 text-purple-600" />
                  ) : log.action.includes('offboarding') ? (
                    <UserMinus className="w-4 h-4 text-red-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{log.change_summary}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    by {log.performed_by_email} • {new Date(log.created_at).toLocaleString()}
                  </p>
                  {log.reason && <p className="text-xs text-gray-500 mt-1">Reason: {log.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Digital Assets</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{dashboard.total_assets}</div>
          <p className="text-sm text-gray-600">{dashboard.assets_needing_audit} need audit review</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <UserPlus className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">Onboarding</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{dashboard.pending_onboarding}</div>
          <p className="text-sm text-gray-600">Pending new hires</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <UserMinus className="w-6 h-6 text-red-600" />
            <h3 className="font-semibold text-gray-900">Offboarding</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{dashboard.pending_offboarding}</div>
          <p className="text-sm text-gray-600">Pending exits</p>
        </div>
      </div>
    </div>
  );
}
