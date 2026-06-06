import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Filter, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { credentialsService, Credential, CredentialAlert } from '../../services/credentialsService';
import { BulkActions, commonBulkActions } from '../shared/BulkActions';

type SeverityFilter = 'all' | 'urgent' | 'critical' | 'warning' | 'info';
type StatusFilter = 'all' | 'active' | 'expired' | 'pending_renewal' | 'suspended';

export default function CredentialsView() {
  const { profile, user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [alerts, setAlerts] = useState<CredentialAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());

  const isManager = profile?.role === 'executive' || profile?.role === 'admin' || profile?.role === 'clinic_manager';

  const handleBulkAcknowledge = async (alertIds: string[]) => {
    if (!user) return;
    try {
      await Promise.all(alertIds.map(id => credentialsService.acknowledgeAlert(id, user.id)));
      await loadData();
      setSelectedAlerts(new Set());
    } catch (error) {
      console.error('Error bulk acknowledging alerts:', error);
    }
  };

  const handleBulkResolve = async (alertIds: string[]) => {
    try {
      await Promise.all(alertIds.map(id => credentialsService.resolveAlert(id)));
      await loadData();
      setSelectedAlerts(new Set());
    } catch (error) {
      console.error('Error bulk resolving alerts:', error);
    }
  };

  const bulkActions = [
    {
      id: 'acknowledge',
      label: 'Acknowledge',
      icon: <Check className="w-4 h-4" />,
      variant: 'default' as const,
      onClick: handleBulkAcknowledge
    },
    {
      id: 'resolve',
      label: 'Resolve',
      icon: <CheckCircle className="w-4 h-4" />,
      variant: 'success' as const,
      onClick: handleBulkResolve,
      confirmMessage: 'Are you sure you want to resolve the selected alerts?'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [credentialsData, alertsData] = await Promise.all([
        credentialsService.getCredentials(),
        credentialsService.getCredentialAlerts(undefined, false)
      ]);

      setCredentials(credentialsData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!user) return;

    try {
      await credentialsService.acknowledgeAlert(alertId, user.id);
      await loadData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await credentialsService.resolveAlert(alertId);
      await loadData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'critical':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending_renewal':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredAlerts = alerts.filter(alert => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (!showAcknowledged && alert.is_acknowledged) return false;
    return true;
  });

  const filteredCredentials = credentials.filter(credential => {
    if (statusFilter !== 'all' && credential.status !== statusFilter) return false;
    return true;
  });

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'urgent');
  const expiringCredentials = credentials.filter(c => {
    if (!c.expiry_date) return false;
    const days = Math.ceil((new Date(c.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 90;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Active</span>
          </div>
          <div className="text-3xl font-bold">{credentials.filter(c => c.status === 'active').length}</div>
          <div className="text-sm opacity-80 mt-1">Valid Credentials</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Expiring Soon</span>
          </div>
          <div className="text-3xl font-bold">{expiringCredentials.length}</div>
          <div className="text-sm opacity-80 mt-1">Next 90 Days</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-8 w-8 opacity-80" />
            <span className="text-sm opacity-80">Critical Alerts</span>
          </div>
          <div className="text-3xl font-bold">{criticalAlerts.length}</div>
          <div className="text-sm opacity-80 mt-1">Require Attention</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Active Alerts ({filteredAlerts.length})
            </h3>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All Severities</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAcknowledged}
                  onChange={(e) => setShowAcknowledged(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Show acknowledged
              </label>
            </div>
          </div>

          <BulkActions
            items={filteredAlerts}
            selectedIds={selectedAlerts}
            onSelectionChange={setSelectedAlerts}
            getItemId={(alert) => alert.id}
            actions={bulkActions}
          />

          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold">
                        {alert.staff?.user?.first_name} {alert.staff?.user?.last_name}
                      </span>
                      <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                        Risk: {alert.risk_score}/100
                      </span>
                    </div>
                    <p className="text-sm">{alert.alert_message}</p>
                    {alert.credential && (
                      <p className="text-xs mt-1 opacity-75">
                        {alert.credential.credential_type?.type_name}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                    alert.severity === 'urgent' ? 'bg-red-200' :
                    alert.severity === 'critical' ? 'bg-orange-200' :
                    alert.severity === 'warning' ? 'bg-yellow-200' :
                    'bg-blue-200'
                  }`}>
                    {alert.severity}
                  </span>
                </div>

                {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-current opacity-50">
                    <div className="text-xs font-semibold mb-1">Recommended Actions:</div>
                    <ul className="text-xs space-y-1">
                      {alert.recommended_actions.slice(0, 2).map((action, idx) => (
                        <li key={idx}>• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {isManager && (
                  <div className="mt-3 pt-3 border-t border-current opacity-50 flex gap-2">
                    {!alert.is_acknowledged && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="text-xs px-3 py-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded transition-colors font-medium"
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.is_acknowledged && (
                      <div className="text-xs flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>Acknowledged</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="text-xs px-3 py-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded transition-colors font-medium"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">All Credentials ({filteredCredentials.length})</h3>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending_renewal">Pending Renewal</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {filteredCredentials.length > 0 ? (
          <div className="space-y-3">
            {filteredCredentials.map((credential) => {
              const daysUntilExpiry = credential.expiry_date
                ? Math.ceil((new Date(credential.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div key={credential.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">
                          {credential.staff?.user?.first_name} {credential.staff?.user?.last_name}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(credential.status)}`}>
                          {credential.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="font-medium">{credential.credential_type?.type_name}</div>
                        <div className="flex items-center space-x-4">
                          <span>Authority: {credential.issuing_authority}</span>
                          {credential.credential_number && (
                            <span>#{credential.credential_number}</span>
                          )}
                        </div>
                        {credential.expiry_date && (
                          <div className="flex items-center space-x-2">
                            <span>Expires: {new Date(credential.expiry_date).toLocaleDateString()}</span>
                            {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
                              <span className={`text-xs ${
                                daysUntilExpiry <= 30 ? 'text-red-600 font-semibold' :
                                daysUntilExpiry <= 90 ? 'text-yellow-600' :
                                'text-gray-500'
                              }`}>
                                ({daysUntilExpiry} days)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No credentials on file</p>
          </div>
        )}
      </div>
    </div>
  );
}
