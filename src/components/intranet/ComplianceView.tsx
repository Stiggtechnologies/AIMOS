import { useEffect, useState } from 'react';
import { Shield, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { complianceService } from '../../services/intranetService';
import { useAuth } from '../../contexts/AuthContext';
import type { Policy, IncidentReport } from '../../types/intranet';

export default function ComplianceView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'policies' | 'incidents'>('policies');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pols, incs] = await Promise.all([
        complianceService.getPolicies(),
        complianceService.getIncidents()
      ]);
      setPolicies(pols);
      setIncidents(incs);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (policyId: string) => {
    if (!user) return;
    try {
      await complianceService.acknowledgePolicy(user.id, policyId);
      loadData();
    } catch (error) {
      console.error('Error acknowledging policy:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (selectedPolicy) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedPolicy(null)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Policies
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{selectedPolicy.title}</h1>
              <span className="text-sm text-gray-500">{selectedPolicy.policy_number}</span>
            </div>
            {selectedPolicy.description && (
              <p className="text-gray-600 mb-4">{selectedPolicy.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Version: {selectedPolicy.version}</span>
              <span>Effective: {new Date(selectedPolicy.effective_date).toLocaleDateString()}</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {selectedPolicy.category}
              </span>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {selectedPolicy.content}
            </div>
          </div>

          {selectedPolicy.requires_acknowledgment && !selectedPolicy.acknowledged && (
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => handleAcknowledge(selectedPolicy.id)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                I Acknowledge This Policy
              </button>
            </div>
          )}

          {selectedPolicy.acknowledged && (
            <div className="pt-6 border-t border-gray-200 flex items-center text-green-600">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              <span className="font-medium">You have acknowledged this policy</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance</h1>
        <p className="mt-2 text-gray-600">Policies, procedures, and incident reporting</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('policies')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'policies'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Policies ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'incidents'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Incidents ({incidents.length})
          </button>
        </div>
      </div>

      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {policies.map(policy => (
            <div
              key={policy.id}
              onClick={() => setSelectedPolicy(policy)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                {policy.requires_acknowledgment && !policy.acknowledged && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                    Action Required
                  </span>
                )}
                {policy.acknowledged && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{policy.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{policy.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{policy.policy_number}</span>
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">{policy.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {incidents.slice(0, 10).map(incident => {
              const severityColors = {
                low: 'bg-green-100 text-green-800',
                medium: 'bg-yellow-100 text-yellow-800',
                high: 'bg-orange-100 text-orange-800',
                critical: 'bg-red-100 text-red-800'
              };

              return (
                <div key={incident.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        incident.severity === 'critical' || incident.severity === 'high'
                          ? 'text-red-600'
                          : incident.severity === 'medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{incident.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${severityColors[incident.severity]}`}>
                      {incident.severity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
                    <span>{incident.incident_number}</span>
                    <span>{new Date(incident.incident_date).toLocaleDateString()}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{incident.status}</span>
                  </div>
                </div>
              );
            })}

            {incidents.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No incidents reported</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
