import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

function conditionScoreToLabel(score: number | null | undefined): string {
  if (score == null) return '—';
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Fair';
  if (score >= 3) return 'Poor';
  return 'Critical';
}

export default function CapitalPlanningView() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAssets(); }, []);

  async function fetchAssets() {
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, name, asset_tag, purchase_date, replacement_cost, condition_score, expected_replacement_date, status')
        .order('expected_replacement_date', { ascending: true })
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

  const withReplacement = assets.filter((a: any) => a.expected_replacement_date);
  const totalReplacement = assets.reduce((sum: number, a: any) => sum + (a.replacement_cost || 0), 0);
  const dueSoon = withReplacement.filter((a: any) => new Date(a.expected_replacement_date) <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Calculator className="w-6 h-6 text-blue-600" /> Capital Planning
        </h1>
        <p className="text-gray-500 mt-1">Asset replacement schedule and cost projections</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
            <DollarSign className="w-4 h-4 text-blue-500" /> Total Replacement Value
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalReplacement.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-600 mb-2">
            <Calendar className="w-4 h-4" /> Due Within 12 Months
          </div>
          <p className="text-3xl font-bold text-amber-600">{dueSoon.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-400" /> Total Assets Tracked
          </div>
          <p className="text-3xl font-bold text-gray-900">{assets.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Replacement Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Replacement Cost</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Condition</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withReplacement.slice(0, 20).map((asset: any) => {
                const isOverdue = new Date(asset.expected_replacement_date) < new Date();
                const conditionLabel = conditionScoreToLabel(asset.condition_score);
                return (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      <p className="text-xs text-gray-500">{asset.asset_tag || '—'}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {asset.replacement_cost != null ? `$${asset.replacement_cost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                        {new Date(asset.expected_replacement_date).toLocaleDateString()}
                        {isOverdue && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">Overdue</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{conditionLabel} {asset.condition_score != null ? `(${asset.condition_score})` : ''}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        asset.status === 'operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>{asset.status || '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {withReplacement.length === 0 && <p className="px-6 py-10 text-center text-gray-500">No assets with scheduled replacements</p>}
        </div>
      </div>
    </div>
  );
}
