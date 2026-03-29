import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Boxes, AlertTriangle, CheckCircle, Clock, Wrench, 
  TrendingUp, Calendar, DollarSign, Activity
} from 'lucide-react';
import { useAuth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── LIVE DATA ────────────────────────────────────────────────────────────────
// Query: assets, asset_categories, asset_alerts

export default function AssetDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    operational: 0,
    maintenance: 0,
    critical: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch assets with stats
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*, asset_categories(name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (assetsError) throw assetsError;
      setAssets(assetsData || []);

      // Fetch critical alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('asset_alerts')
        .select('*, assets(name)')
        .eq('severity', 'critical')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;
      setAlerts(alertsData || []);

      // Calculate stats
      const total = assetsData?.length || 0;
      const operational = assetsData?.filter(a => a.status === 'operational').length || 0;
      const maintenance = assetsData?.filter(a => a.status === 'maintenance').length || 0;
      setStats({ total, operational, maintenance, critical: alertsData?.length || 0 });
    } catch (error) {
      console.error('Error fetching asset data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Asset Dashboard</h1>
        <p className="text-slate-400 mt-1">Live data from Supabase assets table</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Total Assets</span>
            <Boxes className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Operational</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.operational}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">In Maintenance</span>
            <Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-amber-400 mt-2">{stats.maintenance}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Critical Alerts</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-red-400 mt-2">{stats.critical}</p>
        </div>
      </div>

      {/* Recent Assets */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Recent Assets</h2>
        </div>
        <div className="divide-y divide-slate-700">
          {assets.slice(0, 5).map((asset) => (
            <div 
              key={asset.id}
              className="p-4 hover:bg-slate-700/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/assets/${asset.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{asset.name}</p>
                  <p className="text-sm text-slate-400">{asset.asset_categories?.name || 'Uncategorized'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  asset.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400' :
                  asset.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {asset.status}
                </span>
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <p className="p-4 text-slate-400 text-center">No assets found</p>
          )}
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-500/10 rounded-lg border border-red-500/20 p-4">
          <h2 className="text-lg font-semibold text-red-400 mb-3">Critical Alerts</h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-2 bg-slate-800 rounded">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-white text-sm">{alert.title}</span>
                <span className="text-slate-400 text-xs ml-auto">{alert.assets?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
