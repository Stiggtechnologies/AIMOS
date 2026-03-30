import { useState, useEffect } from 'react';
import { Boxes, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Wrench, X, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  onNavigate?: (module: string, subModule?: string, params?: any) => void;
  view?: string;
}

export default function AssetDashboard({ onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [actioning, setActioning] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, operational: 0, maintenance: 0, critical: 0 });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [assetsRes, alertsRes] = await Promise.all([
        supabase.from('assets').select('*, asset_categories(name)').order('created_at', { ascending: false }).limit(50),
        supabase.from('asset_alerts').select('*, assets(name)').eq('status', 'active').order('severity', { ascending: false }).order('created_at', { ascending: false }).limit(20)
      ]);
      if (assetsRes.data) setAssets(assetsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
      const total = assetsRes.data?.length || 0;
      const operational = assetsRes.data?.filter((a: any) => a.status === 'operational').length || 0;
      const maintenance = assetsRes.data?.filter((a: any) => a.status === 'maintenance').length || 0;
      const critical = alertsRes.data?.filter((a: any) => a.severity === 'critical').length || 0;
      setStats({ total, operational, maintenance, critical });
    } catch (err) {
      console.error('Error fetching asset data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function acknowledgeAlert(alertId: string) {
    setActioning(alertId + ':ack');
    const { error } = await supabase.from('asset_alerts').update({
      acknowledged_at: new Date().toISOString(),
      status: 'acknowledged',
    }).eq('id', alertId);
    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setStats(s => ({ ...s, critical: Math.max(0, s.critical - 1) }));
    }
    setActioning(null);
  }

  async function resolveAlert(alertId: string) {
    setActioning(alertId + ':res');
    const { error } = await supabase.from('asset_alerts').update({
      resolved_at: new Date().toISOString(),
      status: 'resolved',
    }).eq('id', alertId);
    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setStats(s => ({ ...s, critical: Math.max(0, s.critical - 1) }));
    }
    setActioning(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const statCards = [
    { label: 'Total Assets',    value: stats.total,       color: 'blue',    icon: <Boxes className="w-5 h-5 text-blue-600" /> },
    { label: 'Operational',     value: stats.operational,  color: 'emerald', icon: <CheckCircle className="w-5 h-5 text-emerald-600" /> },
    { label: 'In Maintenance',  value: stats.maintenance,  color: 'amber',   icon: <Wrench className="w-5 h-5 text-amber-600" /> },
    { label: 'Active Alerts',   value: alerts.length,      color: 'red',     icon: <AlertTriangle className="w-5 h-5 text-red-600" /> },
  ];

  const valueColor: Record<string, string> = {
    blue: 'text-gray-900', emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600',
  };
  const bgColor: Record<string, string> = {
    blue: 'bg-blue-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50', red: 'bg-red-50',
  };

  const severityConfig: Record<string, { bg: string; border: string; badge: string; dot: string }> = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    high:     { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    medium:   { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
    low:      { bg: 'bg-blue-50', border: 'border-blue-100', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asset Dashboard</h1>
        <p className="text-gray-500 mt-1">Live overview of all assets across the network</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color, icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bgColor[color]} flex items-center justify-center`}>{icon}</div>
            </div>
            <p className={`text-3xl font-bold ${valueColor[color]}`}>{value}</p>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-500" /> Active Alerts
              <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">{alerts.length}</span>
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {alerts.map((alert) => {
              const sc = severityConfig[alert.severity] || severityConfig.low;
              const isActioning = actioning?.startsWith(alert.id);
              return (
                <div key={alert.id} className={`px-6 py-4 flex items-start gap-4 ${sc.bg}`}>
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{alert.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${sc.badge}`}>{alert.severity}</span>
                    </div>
                    {alert.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{alert.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {alert.assets?.name && <span className="font-medium text-gray-500">{alert.assets.name}</span>}
                      {alert.created_at && <span className="ml-2">{new Date(alert.created_at).toLocaleDateString()}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      disabled={isActioning}
                      className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actioning === alert.id + ':ack' ? '...' : 'Acknowledge'}
                    </button>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      disabled={isActioning}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actioning === alert.id + ':res' ? '...' : 'Resolve'}
                    </button>
                    <button
                      onClick={() => alert.asset_id && onNavigate?.('assets', `asset-detail:${alert.asset_id}`)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View asset"
                    >
                      <X className="w-3.5 h-3.5 rotate-45" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Assets</h2>
          <button onClick={() => onNavigate?.('assets', 'register')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</button>
        </div>
        <div className="divide-y divide-gray-100">
          {assets.slice(0, 8).map((asset) => (
            <div key={asset.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onNavigate?.('assets', `asset-detail:${asset.id}`)}>
              <div>
                <p className="font-medium text-gray-900">{asset.name}</p>
                <p className="text-sm text-gray-500">{asset.asset_categories?.name || asset.category || 'Uncategorized'}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                asset.status === 'operational' ? 'bg-emerald-100 text-emerald-700' :
                asset.status === 'maintenance'  ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              }`}>{asset.status || '—'}</span>
            </div>
          ))}
          {assets.length === 0 && <p className="px-6 py-8 text-gray-500 text-center">No assets found</p>}
        </div>
      </div>
    </div>
  );
}
