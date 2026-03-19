import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Clock, CreditCard, FileText, Building2, Filter } from 'lucide-react';
import { procurementService } from '../../services/procurementService';
import { expenseService } from '../../services/expenseService';
import type { SpendAlert, ClinicBudgetAllocation } from '../../services/procurementService';

interface DashboardStats {
  totalBudget: number;
  totalSpent: number;
  totalCommitted: number;
  avgUtilization: number;
  pendingApprovals: number;
  activeAlerts: number;
}

interface ExecutiveFinancialDashboardProps {
  onNavigate?: (module: string, subModule: string) => void;
}

export function ExecutiveFinancialDashboard({ onNavigate }: ExecutiveFinancialDashboardProps = {}) {
  const [stats, setStats] = useState<DashboardStats>({
    totalBudget: 0,
    totalSpent: 0,
    totalCommitted: 0,
    avgUtilization: 0,
    pendingApprovals: 0,
    activeAlerts: 0,
  });
  const [alerts, setAlerts] = useState<SpendAlert[]>([]);
  const [budgetAllocations, setBudgetAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClinic, setSelectedClinic] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, [selectedClinic]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load alerts
      const alertsData = await procurementService.getSpendAlerts(
        selectedClinic === 'all' ? undefined : selectedClinic,
        false
      );
      setAlerts(alertsData);

      // Load purchase requests for pending approvals
      const requests = await procurementService.getPurchaseRequests(
        selectedClinic === 'all' ? undefined : selectedClinic
      );
      const pendingCount = requests.filter(r => r.status === 'submitted').length;

      setStats(prev => ({
        ...prev,
        pendingApprovals: pendingCount,
        activeAlerts: alertsData.length,
      }));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await procurementService.resolveSpendAlert(alertId, 'Reviewed and resolved');
      loadDashboardData();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'medium':
        return <Clock className="h-5 w-5" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">Real-time spend monitoring and budget control</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Clinics</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Budget</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                ${stats.totalBudget.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                ${stats.totalSpent.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Under budget</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.pendingApprovals}
              </p>
              <p className="text-sm text-gray-600 mt-1">Purchase requests</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Alerts</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats.activeAlerts}
              </p>
              <p className="text-sm text-gray-600 mt-1">Require attention</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Spend Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Spend Alerts</h2>
            <p className="text-sm text-gray-600 mt-1">
              Anomalies and budget overruns requiring attention
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-6 ${getSeverityColor(alert.severity)} border-l-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <h3 className="font-semibold">{alert.title}</h3>
                      <p className="text-sm mt-1">{alert.description}</p>
                      {alert.metric_value && alert.threshold_value && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Amount:</span> ${alert.metric_value.toLocaleString()}{' '}
                          <span className="text-gray-600">(Threshold: ${alert.threshold_value.toLocaleString()})</span>
                        </p>
                      )}
                      <p className="text-xs mt-2 opacity-75">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="px-3 py-1 text-sm font-medium rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>

          {alerts.length > 5 && (
            <div className="p-4 bg-gray-50 text-center">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View all {alerts.length} alerts
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Building2 className="h-8 w-8 text-blue-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Clinic Budgets</h3>
          <p className="text-sm text-gray-600 mb-4">
            Review and adjust monthly budget allocations
          </p>
          <button onClick={() => onNavigate?.('operations', 'procurement')} className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors">
            Manage Budgets
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <FileText className="h-8 w-8 text-green-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Expense Reports</h3>
          <p className="text-sm text-gray-600 mb-4">
            Generate financial reports and analytics
          </p>
          <button onClick={() => onNavigate?.('intelligence', 'reports')} className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors">
            View Reports
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <CreditCard className="h-8 w-8 text-sky-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Card Reconciliation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Reconcile corporate card transactions
          </p>
          <button onClick={() => onNavigate?.('revenue', 'payments')} className="w-full px-4 py-2 bg-sky-50 text-sky-700 rounded-lg font-medium hover:bg-sky-100 transition-colors">
            Reconcile Cards
          </button>
        </div>
      </div>

      {/* Empty State */}
      {alerts.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            All systems running smoothly
          </h3>
          <p className="text-green-700">
            No budget overruns or spending anomalies detected
          </p>
        </div>
      )}
    </div>
  );
}
