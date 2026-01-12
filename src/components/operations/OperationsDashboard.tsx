import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, Shield, Users, Home, TrendingUp, XCircle } from 'lucide-react';
import { credentialsService, CredentialAlert } from '../../services/credentialsService';
import { useAuth } from '../../contexts/AuthContext';

interface CredentialSummary {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
  pending_verification: number;
}

interface AlertSummary {
  urgent: number;
  critical: number;
  warning: number;
  total_unresolved: number;
}

interface ClinicCompliance {
  clinic_id: string;
  clinic_name: string;
  total_staff: number;
  compliant_staff: number;
  at_risk_staff: number;
  compliance_rate: number;
  critical_alerts: number;
}

export default function OperationsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [credentialSummary, setCredentialSummary] = useState<CredentialSummary | null>(null);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<CredentialAlert[]>([]);
  const [clinicCompliance, setClinicCompliance] = useState<ClinicCompliance[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const [credentials, alerts] = await Promise.all([
        credentialsService.getCredentials(),
        credentialsService.getCredentialAlerts(undefined, false)
      ]);

      const summary: CredentialSummary = {
        total: credentials.length,
        active: credentials.filter(c => c.status === 'active').length,
        expiring_soon: credentials.filter(c => {
          if (!c.expiry_date) return false;
          const daysUntil = Math.ceil((new Date(c.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysUntil > 0 && daysUntil <= 90;
        }).length,
        expired: credentials.filter(c => c.status === 'expired').length,
        pending_verification: credentials.filter(c => c.verification_status === 'pending').length
      };

      const alertSummaryData: AlertSummary = {
        urgent: alerts.filter(a => a.severity === 'urgent').length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        total_unresolved: alerts.length
      };

      const critical = alerts
        .filter(a => a.severity === 'urgent' || a.severity === 'critical')
        .slice(0, 5);

      const clinicMap = new Map<string, {
        name: string;
        staff: Set<string>;
        compliantStaff: Set<string>;
        atRiskStaff: Set<string>;
        criticalAlerts: number;
      }>();

      credentials.forEach(cred => {
        if (!cred.staff?.clinic_id) return;

        const clinicId = cred.staff.clinic_id;
        const staffId = cred.staff_id;

        if (!clinicMap.has(clinicId)) {
          clinicMap.set(clinicId, {
            name: cred.staff.clinic?.name || 'Unknown Clinic',
            staff: new Set(),
            compliantStaff: new Set(),
            atRiskStaff: new Set(),
            criticalAlerts: 0
          });
        }

        const clinic = clinicMap.get(clinicId)!;
        clinic.staff.add(staffId);

        if (cred.status === 'active' && cred.verification_status === 'verified') {
          const daysUntil = cred.expiry_date
            ? Math.ceil((new Date(cred.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          if (daysUntil > 90) {
            clinic.compliantStaff.add(staffId);
          } else if (daysUntil <= 90) {
            clinic.atRiskStaff.add(staffId);
          }
        } else if (cred.status === 'expired' || cred.status === 'suspended' || cred.status === 'revoked') {
          clinic.atRiskStaff.add(staffId);
        }
      });

      alerts.forEach(alert => {
        if (!alert.staff?.clinic_id) return;
        const clinicId = alert.staff.clinic_id;
        const clinic = clinicMap.get(clinicId);

        if (clinic && (alert.severity === 'urgent' || alert.severity === 'critical')) {
          clinic.criticalAlerts++;
        }
      });

      const complianceData: ClinicCompliance[] = Array.from(clinicMap.entries()).map(([id, data]) => ({
        clinic_id: id,
        clinic_name: data.name,
        total_staff: data.staff.size,
        compliant_staff: data.compliantStaff.size,
        at_risk_staff: data.atRiskStaff.size,
        compliance_rate: data.staff.size > 0 ? (data.compliantStaff.size / data.staff.size) * 100 : 0,
        critical_alerts: data.criticalAlerts
      })).sort((a, b) => a.compliance_rate - b.compliance_rate);

      setCredentialSummary(summary);
      setAlertSummary(alertSummaryData);
      setCriticalAlerts(critical);
      setClinicCompliance(complianceData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading operations dashboard...</div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Credentials</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{credentialSummary?.total || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-gray-600">{credentialSummary?.active || 0} active</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{credentialSummary?.expiring_soon || 0}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Within 90 days
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Alerts</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {(alertSummary?.urgent || 0) + (alertSummary?.critical || 0)}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Requires immediate action
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{credentialSummary?.expired || 0}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Urgent renewal needed
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
            <span className="text-sm text-gray-500">{criticalAlerts.length} active</span>
          </div>

          {criticalAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p>No critical alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase">{alert.severity}</span>
                        {alert.days_until_expiry !== undefined && (
                          <span className="text-xs">
                            {alert.days_until_expiry < 0
                              ? `${Math.abs(alert.days_until_expiry)} days overdue`
                              : `${alert.days_until_expiry} days remaining`
                            }
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{alert.alert_message}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {alert.staff?.user?.first_name} {alert.staff?.user?.last_name}
                        {alert.credential?.credential_type?.type_name && ` • ${alert.credential.credential_type.type_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs font-semibold bg-white bg-opacity-50 px-2 py-1 rounded">
                        Risk: {alert.risk_score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Clinic Compliance</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>

          {clinicCompliance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Home className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No clinic data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clinicCompliance.map(clinic => (
                <div key={clinic.clinic_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{clinic.clinic_name}</h4>
                    <span className={`text-sm font-semibold px-2 py-1 rounded ${getComplianceColor(clinic.compliance_rate)}`}>
                      {clinic.compliance_rate.toFixed(0)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Total Staff</p>
                      <p className="font-semibold text-gray-900">{clinic.total_staff}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Compliant</p>
                      <p className="font-semibold text-green-600">{clinic.compliant_staff}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">At Risk</p>
                      <p className="font-semibold text-red-600">{clinic.at_risk_staff}</p>
                    </div>
                  </div>

                  {clinic.critical_alerts > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center text-sm text-red-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span>{clinic.critical_alerts} critical alert{clinic.critical_alerts !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">Urgent</span>
              <span className="text-2xl font-bold text-red-600">{alertSummary?.urgent || 0}</span>
            </div>
          </div>
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-600">Critical</span>
              <span className="text-2xl font-bold text-orange-600">{alertSummary?.critical || 0}</span>
            </div>
          </div>
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-600">Warning</span>
              <span className="text-2xl font-bold text-yellow-600">{alertSummary?.warning || 0}</span>
            </div>
          </div>
          <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Unresolved</span>
              <span className="text-2xl font-bold text-gray-900">{alertSummary?.total_unresolved || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
