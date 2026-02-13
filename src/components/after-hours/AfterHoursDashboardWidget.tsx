import { useState, useEffect } from 'react';
import { Phone, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { afterHoursService } from '../../services/afterHoursService';
import type { AfterHoursCall, AfterHoursStats } from '../../types/afterHours';

interface Props {
  onViewAll: () => void;
}

export function AfterHoursDashboardWidget({ onViewAll }: Props) {
  const [recentCalls, setRecentCalls] = useState<AfterHoursCall[]>([]);
  const [stats, setStats] = useState<AfterHoursStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [calls, statsData] = await Promise.all([
        afterHoursService.getRecentCalls(5),
        afterHoursService.getStats()
      ]);
      setRecentCalls(calls);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading after-hours data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return `${mins}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Phone className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">After-Hours Calls</h3>
        </div>
        {stats && stats.pending_follow_ups > 0 && (
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {stats.pending_follow_ups} pending
          </span>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="px-6 py-4 bg-gray-50 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600">Total (30d)</p>
            <p className="text-xl font-bold text-gray-900">{stats.total_calls}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Conversion</p>
            <p className="text-xl font-bold text-green-600">{stats.conversion_rate.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Response Time</p>
            <p className="text-xl font-bold text-blue-600">
              {stats.avg_response_time_minutes > 0 
                ? `${Math.round(stats.avg_response_time_minutes / 60)}h`
                : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Calls (24h)</h4>
        {recentCalls.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No calls in the last 24 hours
          </p>
        ) : (
          <div className="space-y-3">
            {recentCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={onViewAll}
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${getUrgencyColor(call.urgency_level)}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {call.patient_name || call.from_number}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {call.injury_description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(call.call_started_at)}
                  </p>
                </div>
                {call.urgency_level === 'high' || call.urgency_level === 'emergency' ? (
                  <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={onViewAll}
          className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View All After-Hours Calls →
        </button>
      </div>
    </div>
  );
}
