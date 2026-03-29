import { useState, useEffect } from 'react';
import { ChartBar as BarChart3, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function AnalyticsView() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  async function fetchAnalytics() {
    try {
      const [assetsRes, alertsRes, categoriesRes] = await Promise.all([
        supabase.from('assets').select('id, status, criticality'),
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
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const statCards = [
    { label: 'Total Assets',   value: stats.total,       icon: <BarChart3 className="w-5 h-5 text-blue-600" />,    bg: 'bg-blue-50',    num: 'text-gray-900' },
    { label: 'Operational',    value: stats.operational,  icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50', num: 'text-emerald-600' },
    { label: 'In Maintenance', value: stats.maintenance,  icon: <TrendingUp className="w-5 h-5 text-amber-600" />,  bg: 'bg-amber-50',   num: 'text-amber-600' },
    { label: 'High Criticality',value: stats.critical,    icon: <AlertTriangle className="w-5 h-5 text-red-600" />, bg: 'bg-red-50',     num: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asset Analytics</h1>
        <p className="text-gray-500 mt-1">Portfolio health and alert summary</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon, bg, num }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
            </div>
            <p className={`text-3xl font-bold ${num}`}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500 mb-2">Active Alerts</p>
          <p className="text-4xl font-bold text-blue-600">{stats.activeAlerts ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500 mb-2">Critical Alerts</p>
          <p className="text-4xl font-bold text-red-600">{stats.criticalAlerts ?? 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-medium text-gray-500 mb-2">Asset Categories</p>
          <p className="text-4xl font-bold text-gray-900">{stats.categories ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
