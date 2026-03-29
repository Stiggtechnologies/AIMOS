import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

interface Props {
  onNavigate?: (module: string, subModule?: string, params?: any) => void;
}

function conditionScoreToLabel(score: number | null | undefined): string {
  if (score == null) return '—';
  if (score >= 9) return 'excellent';
  if (score >= 7) return 'good';
  if (score >= 5) return 'fair';
  if (score >= 3) return 'poor';
  return 'critical';
}

export default function AssetRegisterView({ onNavigate }: Props) {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', condition: 'all', category: 'all' });
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [assetsRes, categoriesRes] = await Promise.all([
        supabase.from('assets').select('*, asset_categories(name)').order('name'),
        supabase.from('asset_categories').select('*').order('name')
      ]);
      if (assetsRes.data) setAssets(assetsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const s = search.toLowerCase();
      const matchesSearch = !s || asset.name?.toLowerCase().includes(s) || asset.asset_tag?.toLowerCase().includes(s) || asset.room_location?.toLowerCase().includes(s);
      const matchesStatus = filters.status === 'all' || asset.status === filters.status;
      const matchesCondition = filters.condition === 'all' || conditionScoreToLabel(asset.condition_score) === filters.condition;
      const matchesCategory = filters.category === 'all' || asset.category_id === filters.category;
      return matchesSearch && matchesStatus && matchesCondition && matchesCategory;
    }).sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      return ((a[sortField] || '') as string).localeCompare((b[sortField] || '') as string) * dir;
    });
  }, [assets, search, filters, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const conditionBadge = (label: string, score: number | null) => {
    const cls =
      label === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
      label === 'good'      ? 'bg-blue-100 text-blue-700' :
      label === 'fair'      ? 'bg-amber-100 text-amber-700' :
      label === 'poor'      ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>{label} {score != null ? `(${score})` : ''}</span>;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asset Register</h1>
        <p className="text-gray-500 mt-1">{filteredAssets.length} assets</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Status', key: 'status', options: [['all','All Status'],['operational','Operational'],['maintenance','Maintenance'],['decommissioned','Decommissioned']] },
                { label: 'Condition', key: 'condition', options: [['all','All Conditions'],['excellent','Excellent'],['good','Good'],['fair','Fair'],['poor','Poor'],['critical','Critical']] },
                { label: 'Category', key: 'category', options: [['all','All Categories'], ...categories.map(c => [c.id, c.name])] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <select value={(filters as any)[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Asset Name <SortIcon field="name" /></div>
                </th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 cursor-pointer hover:text-gray-700" onClick={() => handleSort('condition_score')}>
                  <div className="flex items-center gap-1">Condition <SortIcon field="condition_score" /></div>
                </th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssets.map((asset) => {
                const conditionLabel = conditionScoreToLabel(asset.condition_score);
                return (
                  <tr key={asset.id} className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onNavigate?.('assets', 'register')}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      <p className="text-xs text-gray-500">{asset.asset_tag || 'No Tag'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        asset.status === 'operational' ? 'bg-emerald-100 text-emerald-700' :
                        asset.status === 'maintenance'  ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{asset.status || '—'}</span>
                    </td>
                    <td className="px-6 py-4">{conditionBadge(conditionLabel, asset.condition_score)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{asset.room_location || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{asset.asset_categories?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <button onClick={e => { e.stopPropagation(); onNavigate?.('assets', 'register'); }}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredAssets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="w-8 h-8 mb-3" />
              <p className="text-sm">No assets found</p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">{filteredAssets.length} records</p>
        </div>
      </div>
    </div>
  );
}
