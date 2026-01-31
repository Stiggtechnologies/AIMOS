import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Activity, Search, Filter } from 'lucide-react';
import { writeBackService, AuditEntry } from '../../services/writeBackService';

interface ApprovalHistoryViewProps {
  clinicId: string;
}

export default function ApprovalHistoryView({ clinicId }: ApprovalHistoryViewProps) {
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [clinicId]);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, eventTypeFilter]);

  async function loadHistory() {
    try {
      setLoading(true);
      const data = await writeBackService.getApprovalHistory(clinicId, 100);
      setHistory(data);
    } catch (error) {
      console.error('Error loading approval history:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterHistory() {
    let filtered = history;

    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.action_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.event_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (eventTypeFilter) {
      filtered = filtered.filter((entry) => entry.event_type === eventTypeFilter);
    }

    setFilteredHistory(filtered);
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'approval_granted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'approval_denied':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'recommendation_generated':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'execution_completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'execution_failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      recommendation_generated: 'Recommendation Generated',
      approval_requested: 'Approval Requested',
      approval_granted: 'Approval Granted',
      approval_denied: 'Approval Denied',
      execution_initiated: 'Execution Started',
      execution_completed: 'Execution Completed',
      execution_failed: 'Execution Failed',
      outcome_recorded: 'Outcome Recorded',
    };
    return labels[eventType] || eventType;
  };

  const eventTypes = Array.from(new Set(history.map((h) => h.event_type)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading approval history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Approval Audit Trail
        </h2>
        <button
          onClick={loadHistory}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by description or event type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={eventTypeFilter || ''}
            onChange={(e) => setEventTypeFilter(e.target.value || null)}
            className="bg-transparent border-none focus:outline-none text-sm cursor-pointer"
          >
            <option value="">All Event Types</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {getEventLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No audit entries found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((entry, idx) => (
            <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">{getEventIcon(entry.event_type)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getEventLabel(entry.event_type)}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1">{entry.action_description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {new Date(entry.recorded_at).toLocaleDateString()} at{' '}
                        {new Date(entry.recorded_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    {entry.actor_role && (
                      <div>
                        <span className="text-gray-500">Actor Role:</span>
                        <p className="font-medium text-gray-900">{entry.actor_role}</p>
                      </div>
                    )}
                    {entry.ai_confidence !== undefined && entry.ai_confidence !== null && (
                      <div>
                        <span className="text-gray-500">AI Confidence:</span>
                        <p className="font-medium text-gray-900">
                          {entry.ai_confidence.toFixed(0)}%
                        </p>
                      </div>
                    )}
                    {entry.outcome && Object.keys(entry.outcome).length > 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Outcome:</span>
                        <p className="font-medium text-gray-900 mt-1">
                          {JSON.stringify(entry.outcome, null, 2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline Connector */}
              {idx < filteredHistory.length - 1 && (
                <div className="ml-8 mt-3 border-l-2 border-gray-200 h-4" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
