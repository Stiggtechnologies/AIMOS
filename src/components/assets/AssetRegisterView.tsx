import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useAuth } from '@/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ─── LIVE DATA ────────────────────────────────────────────────────────────────
// Query: assets, asset_categories

export default function AssetRegisterView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    condition: 'all',
    criticality: 'all',
    category: 'all',
  });
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [assetsRes, categoriesRes] = await Promise.all([
        supabase.from('assets').select('*, asset_categories(name)').order('name'),
        supabase.from('asset_categories').select('*').order('name')
      ]);

      if (assetsRes.data) setAssets(assetsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = search === '' || 
        asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        asset.asset_id?.toLowerCase().includes(search.toLowerCase()) ||
        asset.location?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || asset.status === filters.status;
      const matchesCondition = filters.condition === 'all' || asset.condition === filters.condition;
      const matchesCriticality = filters.criticality === 'all' || asset.criticality === filters.criticality;
      const matchesCategory = filters.category === 'all' || asset.asset_category_id === filters.category;
      
      return matchesSearch && matchesStatus && matchesCondition && matchesCriticality && matchesCategory;
    }).sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      return (aVal || '').localeCompare(bVal || '') * direction;
    });
  }, [assets, search, filters, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900/50 px-6 py-4">
        <h1 className="text-xl font-semibold text-white">Asset Register</h1>
        <p className="text-sm text-slate-400 mt-1">Live data from Supabase • {filteredAssets.length} records</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm">
                  <option value="all">All Status</option>
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="decommissioned">Decommissioned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm">
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
            <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
              <th className="px-6 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Asset Name <SortIcon field="name" /></div>
              </th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('condition')}>
                <div className="flex items-center gap-1">Condition <SortIcon field="condition" /></div>
              </th>
              <th className="px-6 py-3 font-medium">Location</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredAssets.map((asset) => (
              <tr key={asset.id} className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/assets/${asset.id}`)}>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{asset.name}</p>
                    <p className="text-xs text-slate-400">{asset.asset_id || 'No ID'}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    asset.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400' :
                    asset.status === 'maintenance' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>{asset.status}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    asset.condition === 'excellent' ? 'bg-emerald-500/20 text-emerald-400' :
                    asset.condition === 'good' ? 'bg-blue-500/20 text-blue-400' :
                    asset.condition === 'fair' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{asset.condition}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">{asset.location || '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-300">{asset.asset_categories?.name || '—'}</td>
                <td className="px-6 py-4">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/assets/${asset.id}`); }}
                    className="p-2 hover:bg-slate-700 rounded transition-colors">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Search className="w-8 h-8 mb-3 opacity-50" />
            <p>No assets found</p>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 border-t border-slate-800 px-6 py-3 bg-slate-900/50">
        <p className="text-xs text-slate-500">{filteredAssets.length} records • Live data from Supabase</p>
      </div>
    </div>
  );
}
