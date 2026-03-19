import { useMemo } from 'react';
import { TriangleAlert as AlertTriangle, Circle as XCircle, Info, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import type { CampaignAlert, ContentPost } from '../../services/aimAutomationService';

interface ExceptionCenterViewProps {
  alerts: CampaignAlert[];
  failedPosts: ContentPost[];
  loading: boolean;
  onResolveAlert: (alertId: string) => Promise<void>;
  onRetryPost: (postId: string) => Promise<void>;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-700',
    label: 'Critical',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Warning',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Info',
  },
};

export default function ExceptionCenterView({
  alerts,
  failedPosts,
  loading,
  onResolveAlert,
  onRetryPost,
}: ExceptionCenterViewProps) {
  const openAlerts = useMemo(() => alerts.filter(a => !a.is_resolved), [alerts]);
  const resolvedAlerts = useMemo(() => alerts.filter(a => a.is_resolved), [alerts]);

  const heldPosts = useMemo(() => failedPosts.filter(p => p.status === 'held'), [failedPosts]);
  const errorPosts = useMemo(() => failedPosts.filter(p => p.status === 'failed'), [failedPosts]);

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const totalExceptions = openAlerts.length + failedPosts.length;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open Alerts', value: openAlerts.length, color: openAlerts.length > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Failed Posts', value: errorPosts.length, color: errorPosts.length > 0 ? 'text-orange-600' : 'text-gray-900' },
          { label: 'Held Posts', value: heldPosts.length, color: heldPosts.length > 0 ? 'text-amber-600' : 'text-gray-900' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {totalExceptions === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">No exceptions</p>
          <p className="text-sm text-gray-500 mt-1">All systems are operating normally.</p>
        </div>
      )}

      {openAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Campaign Alerts</h3>
          {openAlerts.map(alert => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const Icon = cfg.icon;
            return (
              <div key={alert.id} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
                <div className={`flex items-center gap-2 px-4 py-2 ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {alert.alert_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="bg-white px-4 py-3">
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">
                      {new Date(alert.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {errorPosts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Failed Posts</h3>
          {errorPosts.map(post => (
            <div key={post.id} className="bg-white rounded-xl border border-red-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{post.title || post.body.slice(0, 60) + '...'}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{post.platform.replace('_', ' ')} · {post.aim_locations?.name}</p>
                  {post.failure_reason && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700 border border-red-100">
                      {post.failure_reason}
                    </div>
                  )}
                  {post.retry_count > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{post.retry_count} retry attempt{post.retry_count !== 1 ? 's' : ''}</p>
                  )}
                </div>
                <button
                  onClick={() => onRetryPost(post.id)}
                  className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {heldPosts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Held Posts (Compliance Review)</h3>
          {heldPosts.map(post => (
            <div key={post.id} className="bg-white rounded-xl border border-orange-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{post.title || post.body.slice(0, 60) + '...'}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{post.platform.replace('_', ' ')} · {post.aim_locations?.name}</p>
                  {post.failure_reason && (
                    <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700 border border-orange-100">
                      <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                      {post.failure_reason}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onRetryPost(post.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Release
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvedAlerts.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 font-medium">{resolvedAlerts.length} resolved alert{resolvedAlerts.length !== 1 ? 's' : ''} in history</p>
        </div>
      )}
    </div>
  );
}
