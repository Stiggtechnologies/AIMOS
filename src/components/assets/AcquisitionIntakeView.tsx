import { useState, useEffect } from 'react';
import { PackagePlus, Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function AcquisitionIntakeView() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcquisitions();
  }, []);

  async function fetchAcquisitions() {
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, name, asset_id, purchase_date, cost, vendor, manufacturer, model, status')
        .order('purchase_date', { ascending: false })
        .limit(50);
      setAssets(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <PackagePlus className="w-6 h-6 text-blue-400" />
            Acquisition & Intake
          </h1>
          <p className="text-slate-400 mt-1">Live data from Supabase assets table</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Recent Acquisitions</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr className="text-left text-xs text-slate-400 uppercase">
              <th className="px-4 py-3">Asset ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Manufacturer</th>
              <th className="px-4 py-3">Purchase Date</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3 text-sm text-slate-400">{asset.asset_id || '—'}</td>
                <td className="px-4 py-3 text-white">{asset.name}</td>
                <td className="px-4 py-3 text-slate-300">{asset.manufacturer || '—'}</td>
                <td className="px-4 py-3 text-slate-300">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3 text-white">{asset.cost ? `$${asset.cost.toLocaleString()}` : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    asset.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>{asset.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assets.length === 0 && <p className="p-8 text-center text-slate-400">No acquisitions found</p>}
      </div>
    </div>
  );
}
