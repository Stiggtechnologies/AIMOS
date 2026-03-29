import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function AnalyticsView() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const [assetsRes, alertsRes, categoriesRes] = await Promise.all([
        supabase.from('assets').select('id, status, condition, criticality'),
        supabase.from('asset_alerts').select('id, severity, status'),
        supabase.from('asset_categories').select('id, name')
      ]);

      const assets = assetsRes.data || [];
      const alerts = alertsRes.data || [];

      setStats({
        total: assets.length,
        operational: assets.filter((a: any) => a.status === 'operational').length,
        maintenance: assets.filter((a: any) => a.status === 'maintenance').length,
        critical: assets.filter((a: any) => a.criticality === 'high').length,
        activeAlerts: alerts.filter((a: any) => a.status === 'active').length,
        criticalAlerts: alerts.filter((a: any) => a.severity === 'critical' && a.status === 'active').length,
        categories: categoriesRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Asset Analytics</h1>
        <p className="text-slate-400 mt-1">Live data from Supabase</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <BarChart3 className="w-4 h-4" /> Total Assets
          </div>
          <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-4 h-4" /> Operational
          </div>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.operational}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <TrendingUp className="w-4 h-4" /> In Maintenance
          </div>
          <p className="text-3xl font-bold text-amber-400 mt-2">{stats.maintenance}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" /> Critical
          </div>
          <p className="text-3xl font-bold text-red-400 mt-2">{stats.critical}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-2">Active Alerts</h3>
          <p className="text-4xl font-bold text-blue-400">{stats.activeAlerts}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-2">Categories</h3>
          <p className="text-4xl font-bold text-purple-400">{stats.categories}</p>
        </div>
      </div>
    </div>
  );
}
