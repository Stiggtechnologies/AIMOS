import { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Lock,
  FileCheck,
  Calendar,
  TrendingUp,
  Download,
  History,
  Users,
  AlertCircle,
} from 'lucide-react';
import {
  getGovernanceDashboard,
  type GovernanceDashboard,
  type Document,
  type DocumentVersion,
  type DocumentReviewSchedule,
  type AccessStatistic,
} from '../../services/documentGovernanceService';

export default function DocumentLibraryView() {
  const [dashboard, setDashboard] = useState<GovernanceDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'reviews' | 'attestations' | 'access'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getGovernanceDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Error loading document governance dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading document library...</div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="p-6 text-gray-500">No data available</div>;
  }

  const getConfidentialityColor = (level?: string) => {
    if (level === 'restricted') return 'bg-red-100 text-red-800 border-red-200';
    if (level === 'confidential') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level === 'internal') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status?: string) => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'draft') return 'bg-gray-100 text-gray-800';
    if (status === 'archived') return 'bg-amber-100 text-amber-800';
    if (status === 'retired') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getReviewStatusColor = (status?: string) => {
    if (status === 'overdue') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'upcoming') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Governance & Document Library</h2>
        <p className="text-gray-600 mt-1">Stop SOP drift and IP leakage with version control, attestations, and audit trails</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Governance Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{dashboard.overview.total_documents}</div>
            <div className="text-xs text-gray-600 mt-1">Total Documents</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{dashboard.overview.official_documents}</div>
            <div className="text-xs text-gray-600 mt-1">Official SOPs</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{dashboard.overview.ip_sensitive_documents}</div>
            <div className="text-xs text-gray-600 mt-1">IP Protected</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{dashboard.overview.overdue_reviews}</div>
            <div className="text-xs text-gray-600 mt-1">Overdue Reviews</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-600">{dashboard.overview.pending_attestations}</div>
            <div className="text-xs text-gray-600 mt-1">Pending Attestations</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{dashboard.overview.version_drift_alerts}</div>
            <div className="text-xs text-gray-600 mt-1">Version Drift Alerts</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Critical Documents Requiring Attention
          </h3>
          <div className="space-y-3">
            {dashboard.critical_documents.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{doc.document_code}</span>
                      {doc.is_official && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">Official</span>
                      )}
                      {doc.ip_sensitive && (
                        <Lock className="w-3 h-3 text-purple-600" />
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{doc.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{doc.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getReviewStatusColor(doc.review_cycle_status)}`}>
                    {doc.review_cycle_status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-500">Next Review:</span>
                    <div className="font-semibold text-gray-900">{doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString() : 'Not set'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidentiality:</span>
                    <div className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border mt-1 ${getConfidentialityColor(doc.confidentiality_level)}`}>
                      {doc.confidentiality_level}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Overdue Document Reviews
          </h3>
          <div className="space-y-3">
            {dashboard.overdue_reviews.length > 0 ? (
              dashboard.overdue_reviews.map((review) => (
                <div key={review.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">Document Review Required</h4>
                      <p className="text-xs text-gray-600 mt-1">Review Type: {review.review_type?.replace('_', ' ')}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold bg-red-200 text-red-900 rounded-full">
                      Overdue
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-red-200 text-xs">
                    <div>
                      <span className="text-gray-600">Scheduled:</span>
                      <div className="font-semibold text-gray-900">{new Date(review.scheduled_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Days Overdue:</span>
                      <div className="font-semibold text-red-600">
                        {Math.floor((new Date().getTime() - new Date(review.scheduled_date).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>All reviews up to date</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6 pt-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-4 px-2 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                All Documents
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 px-2 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'reviews'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Review Schedule
              </div>
            </button>
            <button
              onClick={() => setActiveTab('attestations')}
              className={`pb-4 px-2 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'attestations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Attestations
              </div>
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`pb-4 px-2 border-b-2 font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'access'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Access Audit
              </div>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'documents' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Document Library</h4>
                <p className="text-xs text-gray-600">Official documents with version control and governance tracking</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Confidentiality</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Governance</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Next Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboard.critical_documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-semibold text-blue-600">{doc.document_code}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{doc.description}</div>
                        </td>
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doc.document_type}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded border ${getConfidentialityColor(doc.confidentiality_level)}`}>
                            {doc.confidentiality_level}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {doc.is_official && (
                              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded" title="Official SOP">
                                <FileCheck className="w-3 h-3" />
                              </span>
                            )}
                            {doc.ip_sensitive && (
                              <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-800 rounded" title="IP Sensitive">
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                            {doc.attestation_required && (
                              <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded" title="Attestation Required">
                                <Shield className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <div className={`text-sm font-semibold ${
                            doc.review_cycle_status === 'overdue' ? 'text-red-600' :
                            doc.review_cycle_status === 'upcoming' ? 'text-amber-600' : 'text-gray-900'
                          }`}>
                            {doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString() : 'Not set'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Document Review Schedule</h4>
                <p className="text-xs text-gray-600">Automated review cycles to prevent SOP drift</p>
              </div>
              <div className="space-y-3">
                {dashboard.overdue_reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">Document Review</h4>
                        <p className="text-sm text-gray-600 mt-1">Type: {review.review_type?.replace('_', ' ')}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        review.status === 'completed' ? 'bg-green-100 text-green-800' :
                        review.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        review.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Scheduled Date:</span>
                        <div className="font-semibold text-gray-900 mt-0.5">{new Date(review.scheduled_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <div className="font-semibold text-gray-900 mt-0.5">{review.status}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Next Review:</span>
                        <div className="font-semibold text-gray-900 mt-0.5">
                          {review.next_review_date ? new Date(review.next_review_date).toLocaleDateString() : 'TBD'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {dashboard.overdue_reviews.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No scheduled reviews</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'attestations' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Policy Attestations</h4>
                <p className="text-xs text-gray-600">Required acknowledgments and compliance tracking</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Attestation Requirements</p>
                    <p className="text-blue-800">
                      Critical documents require user attestation with IP address logging for audit trail.
                      Attestations expire annually and trigger automatic re-attestation reminders.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {dashboard.critical_documents
                  .filter(d => d.attestation_required)
                  .map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-500">{doc.document_code}</span>
                            <Shield className="w-4 h-4 text-green-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm">{doc.title}</h4>
                        </div>
                        <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700">
                          Attest Now
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        <span className="font-semibold">Regulatory Reference:</span> {doc.regulatory_reference || 'N/A'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Access Audit Trail</h4>
                <p className="text-xs text-gray-600">Complete audit log for compliance and IP protection</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Views</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unique Users</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Completion</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Last Accessed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dashboard.access_statistics.map((stat) => (
                      <tr key={stat.document_id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{stat.document_title}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900">{stat.total_views}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900">{stat.unique_users}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-sm font-semibold text-gray-900">{stat.avg_completion}%</div>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-blue-600 rounded-full"
                                style={{ width: `${stat.avg_completion}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {stat.last_accessed ? new Date(stat.last_accessed).toLocaleDateString() : 'Never'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dashboard.access_statistics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No access logs available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-semibold mb-1">IP Protection</p>
              <p className="text-green-800">
                All IP-sensitive documents are marked, access-controlled, and fully audited.
                Confidentiality levels enforce appropriate access restrictions.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <History className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Version Control & Audit Trail</p>
              <p className="text-blue-800">
                Complete version history with change tracking, approval workflows, and immutable audit logs
                for regulatory compliance and legal defensibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
