import { useEffect, useState } from 'react';
import { Phone, TrendingUp } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { callTrackingService } from '../../services/callTrackingService';
import type { CallTrackingCall, CallTrackingStats, CallOutcome, CallSourceType } from '../../types/callTracking';

const OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: 'booked', label: 'Booked' },
  { value: 'callback', label: 'Callback' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'not_qualified', label: 'Not Qualified' },
  { value: 'price_objection', label: 'Price Objection' },
  { value: 'already_booked', label: 'Already Booked' },
  { value: 'spam', label: 'Spam' },
];

function formatDuration(seconds?: number | null) {
  if (!seconds && seconds !== 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatSourceLabel(sourceType: CallSourceType | null, detail: string | null) {
  const base = sourceType ? sourceType.replace('_', ' ') : 'unknown';
  return detail ? `${base} — ${detail}` : base;
}

export default function CallTrackingView() {
  const [calls, setCalls] = useState<CallTrackingCall[]>([]);
  const [stats, setStats] = useState<CallTrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const { error: showError, success } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = sourceFilter === 'all' ? undefined : { source_type: sourceFilter as any };
      const [callsData, statsData] = await Promise.all([
        callTrackingService.getCalls(filters),
        callTrackingService.getStats(),
      ]);
      setCalls(callsData);
      setStats(statsData);
    } catch (e) {
      console.error(e);
      showError('Failed to load call tracking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter]);

  const onSetOutcome = async (call: CallTrackingCall, outcome: CallOutcome) => {
    try {
      await callTrackingService.setOutcome(call.id, outcome);
      success('Outcome saved');
      await loadData();
    } catch (e) {
      console.error(e);
      showError('Failed to save outcome');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Call Tracking (Business Hours)</h1>
        <p className="text-gray-600">Inbound calls attributed to marketing sources via tracking numbers</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_calls}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Answered</p>
                <p className="text-2xl font-bold text-green-600">{stats.answered_calls}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Missed</p>
                <p className="text-2xl font-bold text-orange-600">{stats.missed_calls}</p>
              </div>
              <Phone className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Booked</p>
                <p className="text-2xl font-bold text-purple-600">{stats.booked_calls}</p>
              </div>
              <Phone className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Booking Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.booking_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Source:</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="all">All</option>
            <option value="google_ads">Google Ads</option>
            <option value="meta_ads">Meta Ads</option>
            <option value="bing_ads">Bing Ads</option>
            <option value="organic">Organic</option>
            <option value="referral">Referral</option>
            <option value="direct">Direct</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No calls found</td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{call.from_number || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">To: {call.to_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {formatSourceLabel(call.source_type, call.source_detail)}
                      </div>
                      {call.utm_campaign && (
                        <div className="text-xs text-gray-500 max-w-xs truncate">Campaign: {call.utm_campaign}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(call.call_started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(call.call_duration_seconds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {call.call_status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={call.outcome || ''}
                        onChange={(e) => {
                          const val = e.target.value as CallOutcome;
                          if (!val) return;
                          onSetOutcome(call, val);
                        }}
                        className="border border-gray-300 rounded px-3 py-1 text-sm"
                      >
                        <option value="">—</option>
                        {OUTCOMES.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
