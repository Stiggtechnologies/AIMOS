import { useState, useEffect } from 'react';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Circle as XCircle, Filter, RefreshCw, Bell, Activity, DollarSign, Users, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  clinic_name?: string;
  created_at: string;
  acknowledged: boolean;
  resolved: boolean;
}

const MOCK_ALERTS: Alert[] = [
  { id: '1', type: 'critical', category: 'Revenue', title: 'AR Days Threshold Exceeded', description: 'South Commons AR days at 52 — threshold is 45. Immediate review required.', clinic_name: 'South Commons', created_at: new Date(Date.now() - 3600000).toISOString(), acknowledged: false, resolved: false },
  { id: '2', type: 'critical', category: 'Clinical', title: 'Credential Expiry in 7 Days', description: '3 clinician credentials expire within 7 days. Insurance coverage at risk.', clinic_name: 'All Clinics', created_at: new Date(Date.now() - 7200000).toISOString(), acknowledged: false, resolved: false },
  { id: '3', type: 'warning', category: 'Capacity', title: 'Schedule Utilization Below Target', description: 'West End clinic at 61% utilization — target is 75%.', clinic_name: 'West End', created_at: new Date(Date.now() - 14400000).toISOString(), acknowledged: true, resolved: false },
  { id: '4', type: 'warning', category: 'Growth', title: 'Intake Conversion Drop', description: 'New patient conversion rate dropped 8% week-over-week.', clinic_name: 'Network', created_at: new Date(Date.now() - 86400000).toISOString(), acknowledged: false, resolved: false },
  { id: '5', type: 'info', category: 'Operations', title: 'After Hours Call Volume Up', description: 'After-hours call volume increased 22% this week — consider staffing review.', clinic_name: 'Network', created_at: new Date(Date.now() - 172800000).toISOString(), acknowledged: true, resolved: false },
  { id: '6', type: 'info', category: 'Revenue', title: 'Monthly Revenue Target on Track', description: 'Network is at 94% of monthly revenue target with 8 days remaining.', clinic_name: 'Network', created_at: new Date(Date.now() - 259200000).toISOString(), acknowledged: true, resolved: true },
];

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Revenue: DollarSign,
  Clinical: Activity,
  Capacity: Building2,
  Growth: Users,
  Operations: Bell,
};

export default function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'unresolved'>('unresolved');
  const [loading, setLoading] = useState(false);

  const filtered = alerts.filter(a => {
    if (filter === 'unresolved') return !a.resolved;
    if (filter === 'all') return true;
    return a.type === filter;
  });

  const counts = {
    critical: alerts.filter(a => a.type === 'critical' && !a.resolved).length,
    warning: alerts.filter(a => a.type === 'warning' && !a.resolved).length,
    info: alerts.filter(a => a.type === 'info' && !a.resolved).length,
  };

  const acknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const resolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true, acknowledged: true } : a));
  };

  const typeConfig = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, iconColor: 'text-red-500', badge: 'bg-red-100 text-red-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Bell, iconColor: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">Network-wide alerts requiring attention</p>
        </div>
        <button
          onClick={() => setLoading(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Critical', count: counts.critical, color: 'red' },
          { label: 'Warnings', count: counts.warning, color: 'amber' },
          { label: 'Info', count: counts.info, color: 'blue' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-200 p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{label}</span>
              <span className={`text-2xl font-bold text-${color}-600`}>{count}</span>
            </div>
            <div className={`mt-2 h-1.5 rounded-full bg-${color}-100`}>
              <div className={`h-full rounded-full bg-${color}-500`} style={{ width: `${Math.min(100, count * 20)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        {(['unresolved', 'critical', 'warning', 'info', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {f}
          </button>
        ))}
        <span className="text-sm text-gray-400 ml-2">{filtered.length} alerts</span>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No alerts in this category</p>
          </div>
        )}
        {filtered.map(alert => {
          const cfg = typeConfig[alert.type];
          const Icon = cfg.icon;
          const CategoryIcon = categoryIcons[alert.category] || Bell;
          return (
            <div key={alert.id} className={`${cfg.bg} ${cfg.border} border rounded-xl p-4 flex items-start justify-between gap-4`}>
              <div className="flex items-start space-x-3 flex-1">
                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>{alert.type.toUpperCase()}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <CategoryIcon className="h-3 w-3" />{alert.category}
                    </span>
                    {alert.clinic_name && <span className="text-xs text-gray-500">• {alert.clinic_name}</span>}
                    <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                      <Clock className="h-3 w-3" />{formatTime(alert.created_at)}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{alert.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledge(alert.id)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                {!alert.resolved && (
                  <button
                    onClick={() => resolve(alert.id)}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Resolve
                  </button>
                )}
                {alert.resolved && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />Resolved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
