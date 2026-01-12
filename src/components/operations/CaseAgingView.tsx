import React, { useState, useEffect } from 'react';
import {
  Clock, AlertTriangle, AlertCircle, CheckCircle, TrendingUp,
  User, Calendar, Filter, Bell, RefreshCw, ChevronRight, FileText,
  ArrowUpCircle, XCircle
} from 'lucide-react';
import { caseAgingService, CaseAgingStatus, CaseAgingSummary } from '../../services/caseAgingService';

export default function CaseAgingView() {
  const [summary, setSummary] = useState<CaseAgingSummary | null>(null);
  const [cases, setCases] = useState<CaseAgingStatus[]>([]);
  const [myAlerts, setMyAlerts] = useState<any[]>([]);
  const [myEscalations, setMyEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'cases' | 'alerts' | 'escalations'>('overview');
  const [filters, setFilters] = useState({
    aging_status: '',
    case_type: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, casesData, alertsData, escalationsData] = await Promise.all([
        caseAgingService.getCaseAgingSummary(),
        caseAgingService.getCaseAgingStatus(filters.aging_status || filters.case_type ? filters : undefined),
        caseAgingService.getUnacknowledgedAlerts(),
        caseAgingService.getMyEscalations()
      ]);

      setSummary(summaryData);
      setCases(casesData);
      setMyAlerts(alertsData);
      setMyEscalations(escalationsData);
    } catch (error) {
      console.error('Error loading case aging data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await caseAgingService.acknowledgeAlert(alertId, 'Acknowledged from dashboard');
      loadData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolveEscalation = async (escalationId: string) => {
    const notes = prompt('Enter resolution notes:');
    if (!notes) return;

    try {
      await caseAgingService.resolveEscalation(escalationId, notes);
      loadData();
    } catch (error) {
      console.error('Error resolving escalation:', error);
    }
  };

  const handleRunAgingCheck = async () => {
    try {
      setLoading(true);
      const result = await caseAgingService.batchCheckCaseAging();
      alert(`Aging check complete:\n${result.cases_checked} cases checked\n${result.alerts_triggered} alerts triggered\n${result.escalations_created} escalations created`);
      loadData();
    } catch (error) {
      console.error('Error running aging check:', error);
    }
  };

  const getAgingStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'escalation': return 'text-orange-600 bg-orange-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'urgent': return 'text-orange-600 bg-orange-50';
      case 'high': return 'text-yellow-600 bg-yellow-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Case Aging Management</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor case aging, alerts, and escalations</p>
        </div>
        <button
          onClick={handleRunAgingCheck}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Run Aging Check
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Open Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_open_cases}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg age: {summary.avg_case_age_days.toFixed(1)} days
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Cases</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{summary.cases_critical}</p>
                <p className="text-xs text-gray-500 mt-1">Require immediate action</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Escalations</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{summary.active_escalations}</p>
                <p className="text-xs text-gray-500 mt-1">Pending resolution</p>
              </div>
              <ArrowUpCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unacknowledged Alerts</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{summary.unacknowledged_alerts}</p>
                <p className="text-xs text-gray-500 mt-1">Need attention</p>
              </div>
              <Bell className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('cases')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'cases'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Cases ({cases.length})
            </button>
            <button
              onClick={() => setSelectedTab('alerts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'alerts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Alerts ({myAlerts.length})
            </button>
            <button
              onClick={() => setSelectedTab('escalations')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'escalations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              My Escalations ({myEscalations.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {selectedTab === 'overview' && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">Warning Status</p>
                      <p className="text-2xl font-bold text-yellow-700">{summary.cases_warning}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Escalated</p>
                      <p className="text-2xl font-bold text-orange-700">{summary.cases_escalated}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-sm text-red-600 font-medium">Auth Expiring Soon</p>
                      <p className="text-2xl font-bold text-red-700">{summary.auth_expiring_soon}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Priority Cases</h3>
                <div className="space-y-2">
                  {cases.slice(0, 5).map((caseItem) => (
                    <div key={caseItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getAgingStatusColor(caseItem.aging_status)}`}>
                          {caseItem.aging_status.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{caseItem.case_number}</p>
                          <p className="text-sm text-gray-600">{caseItem.case_type} - {caseItem.clinic_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{caseItem.age_days} days old</p>
                          <p className="text-xs text-gray-600">{caseItem.unack_alerts_count} alerts</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'cases' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <select
                  value={filters.aging_status}
                  onChange={(e) => setFilters({ ...filters, aging_status: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Aging Status</option>
                  <option value="critical">Critical</option>
                  <option value="escalation">Escalation</option>
                  <option value="warning">Warning</option>
                  <option value="normal">Normal</option>
                </select>

                <select
                  value={filters.case_type}
                  onChange={(e) => setFilters({ ...filters, case_type: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Case Types</option>
                  <option value="Physical Therapy">Physical Therapy</option>
                  <option value="Occupational Therapy">Occupational Therapy</option>
                  <option value="Speech Therapy">Speech Therapy</option>
                  <option value="Work Conditioning">Work Conditioning</option>
                  <option value="FCE Assessment">FCE Assessment</option>
                  <option value="Post-Offer Testing">Post-Offer Testing</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Case Number</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Priority</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Age</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Aging Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Alerts</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Escalations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cases.map((caseItem) => (
                      <tr key={caseItem.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{caseItem.case_number}</p>
                          <p className="text-xs text-gray-600">{caseItem.clinic_name}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{caseItem.case_type}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {caseItem.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
                            {caseItem.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{caseItem.age_days}d</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getAgingStatusColor(caseItem.aging_status)}`}>
                            {caseItem.aging_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {caseItem.unack_alerts_count > 0 && (
                            <span className="flex items-center gap-1 text-sm text-orange-600">
                              <Bell className="w-4 h-4" />
                              {caseItem.unack_alerts_count}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {caseItem.active_escalations_count > 0 && (
                            <span className="flex items-center gap-1 text-sm text-red-600">
                              <ArrowUpCircle className="w-4 h-4" />
                              {caseItem.active_escalations_count}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedTab === 'alerts' && (
            <div className="space-y-3">
              {myAlerts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No unacknowledged alerts</p>
                </div>
              ) : (
                myAlerts.map((alert) => (
                  <div key={alert.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.alert_type === 'critical' ? 'bg-red-100 text-red-700' :
                            alert.alert_type === 'escalation' ? 'bg-orange-100 text-orange-700' :
                            alert.alert_type === 'authorization_expiry' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {alert.alert_type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">
                            {new Date(alert.triggered_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {alert.case?.case_number || 'Unknown Case'} - {alert.case?.case_type}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Case age: {alert.case_age_days} days | Status: {alert.case?.status}
                        </p>
                        {alert.metadata?.clinic_id && (
                          <p className="text-xs text-gray-500 mt-1">
                            Clinic: {alert.case?.clinic?.name}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="ml-4 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'escalations' && (
            <div className="space-y-3">
              {myEscalations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>No pending escalations</p>
                </div>
              ) : (
                myEscalations.map((escalation) => (
                  <div key={escalation.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                            LEVEL {escalation.escalation_level}
                          </span>
                          {escalation.auto_escalated && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                              AUTO
                            </span>
                          )}
                          <span className="text-sm text-gray-600">
                            {new Date(escalation.escalated_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {escalation.case?.case_number} - {escalation.case?.case_type}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          <span className="font-medium">Reason:</span> {escalation.escalation_reason}
                        </p>
                        {escalation.escalated_from_profile && (
                          <p className="text-xs text-gray-500 mt-1">
                            From: {escalation.escalated_from_profile.display_name}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleResolveEscalation(escalation.id)}
                        className="ml-4 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
