import { useState, useEffect } from 'react';
import { PackagePlus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function AcquisitionIntakeView() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAcquisitions(); }, []);

  async function fetchAcquisitions() {
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, name, asset_tag, purchase_date, purchase_cost, supplier, manufacturer, model, status')
        .order('purchase_date', { ascending: false })
        .limit(50);
      setAssets(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <PackagePlus className="w-6 h-6 text-blue-600" /> Acquisition & Intake
        </h1>
        <p className="text-gray-500 mt-1">{assets.length} assets on record</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Recent Acquisitions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">Asset Tag</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Manufacturer</th>
                <th className="px-6 py-3">Purchase Date</th>
                <th className="px-6 py-3">Cost</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{asset.asset_tag || '—'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.manufacturer || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{asset.purchase_cost != null ? `$${asset.purchase_cost.toLocaleString()}` : '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      asset.status === 'operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>{asset.status || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assets.length === 0 && <p className="px-6 py-10 text-center text-gray-500">No acquisitions found</p>}
        </div>
      </div>
    </div>
  );
}
