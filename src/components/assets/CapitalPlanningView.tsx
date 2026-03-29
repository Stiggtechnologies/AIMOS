import { useState, useEffect } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function CapitalPlanningView() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, name, asset_id, purchase_date, replacement_cost, condition, replacement_date, status')
        .order('replacement_date', { ascending: true })
        .limit(50);
      setAssets(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;

  const totalReplacement = assets.reduce((sum: number, a: any) => sum + (a.replacement_cost || 0), 0);
  const dueSoon = assets.filter((a: any) => a.replacement_date && new Date(a.replacement_date) <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Calculator className="w-6 h-6 text-blue-400" />
          Capital Planning
        </h1>
        <p className="text-slate-400 mt-1">Live data from Supabase assets table</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <TrendingUp className="w-4 h-4" /> Total Replacement Value
          </div>
          <p className="text-3xl font-bold text-white mt-2">${totalReplacement.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-amber-400 text-sm">Due Within 1 Year</div>
          <p className="text-3xl font-bold text-amber-400 mt-2">{dueSoon.length}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-sm">Total Assets</div>
          <p className="text-3xl font-bold text-white mt-2">{assets.length}</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Replacement Schedule</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr className="text-left text-xs text-slate-400 uppercase">
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Replacement Cost</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {assets.filter((a: any) => a.replacement_date).slice(0, 20).map((asset) => {
              const isOverdue = new Date(asset.replacement_date) < new Date();
              return (
                <tr key={asset.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <p className="text-white">{asset.name}</p>
                    <p className="text-xs text-slate-400">{asset.asset_id}</p>
                  </td>
                  <td className="px-4 py-3 text-white">${asset.replacement_cost?.toLocaleString() || '—'}</td>
                  <td className={`px-4 py-3 ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                    {new Date(asset.replacement_date).toLocaleDateString()}
                    {isOverdue && ' (OVERDUE)'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{asset.condition}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      asset.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>{asset.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
