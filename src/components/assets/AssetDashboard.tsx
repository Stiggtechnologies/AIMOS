import { useState, useEffect } from 'react';
import { Boxes, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Wrench } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

interface Props {
  onNavigate?: (module: string, subModule?: string, params?: any) => void;
  view?: string;
}

export default function AssetDashboard({ onNavigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, operational: 0, maintenance: 0, critical: 0 });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [assetsRes, alertsRes] = await Promise.all([
        supabase.from('assets').select('*, asset_categories(name)').order('created_at', { ascending: false }).limit(50),
        supabase.from('asset_alerts').select('*, assets(name)').eq('severity', 'critical').eq('status', 'active').order('created_at', { ascending: false }).limit(10)
      ]);
      if (assetsRes.data) setAssets(assetsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
      const total = assetsRes.data?.length || 0;
      const operational = assetsRes.data?.filter((a: any) => a.status === 'operational').length || 0;
      const maintenance = assetsRes.data?.filter((a: any) => a.status === 'maintenance').length || 0;
      setStats({ total, operational, maintenance, critical: alertsRes.data?.length || 0 });
    } catch (err) {
      console.error('Error fetching asset data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const statCards = [
    { label: 'Total Assets',     value: stats.total,       color: 'blue',    icon: <Boxes className="w-5 h-5 text-blue-600" /> },
    { label: 'Operational',      value: stats.operational,  color: 'emerald', icon: <CheckCircle className="w-5 h-5 text-emerald-600" /> },
    { label: 'In Maintenance',   value: stats.maintenance,  color: 'amber',   icon: <Wrench className="w-5 h-5 text-amber-600" /> },
    { label: 'Critical Alerts',  value: stats.critical,     color: 'red',     icon: <AlertTriangle className="w-5 h-5 text-red-600" /> },
  ];

  const valueColor: Record<string, string> = {
    blue: 'text-gray-900', emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600',
  };
  const bgColor: Record<string, string> = {
    blue: 'bg-blue-50', emerald: 'bg-emerald-50', amber: 'bg-amber-50', red: 'bg-red-50',
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

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Recent Assets</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {assets.slice(0, 8).map((asset) => (
            <div key={asset.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onNavigate?.('assets', 'register')}>
              <div>
                <p className="font-medium text-gray-900">{asset.name}</p>
                <p className="text-sm text-gray-500">{asset.asset_categories?.name || 'Uncategorized'}</p>
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

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Critical Alerts
          </h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 bg-white border border-red-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-gray-900 text-sm flex-1">{alert.title}</span>
                <span className="text-gray-500 text-xs">{alert.assets?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
