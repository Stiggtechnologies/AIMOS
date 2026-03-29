import { useState } from 'react';
import { Search, Smartphone, ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

interface Props {
  onNavigate?: (module: string, subModule?: string, params?: any) => void;
}

export default function MobileAssetLookup({ onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, name, asset_id, location, status, condition')
        .or(`name.ilike.%${search}%,asset_id.ilike.%${search}%,serial_number.ilike.%${search}%`)
        .limit(20);
      setAssets(data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAssetClick(assetId: string) {
    if (onNavigate) onNavigate('assets', 'detail', { id: assetId });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Mobile Asset Lookup</h1>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search by name, asset ID, or serial..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500" />
        </div>
        <button onClick={handleSearch} disabled={loading}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
          {loading ? '...' : 'Search'}
        </button>
      </div>

      <div className="space-y-3">
        {assets.map((asset) => (
          <div key={asset.id} onClick={() => handleAssetClick(asset.id)}
            className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-blue-500/50 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{asset.name}</p>
                <p className="text-sm text-slate-400">{asset.asset_id || 'No ID'} • {asset.location || 'No location'}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex gap-2 mt-2">
              <span className={`px-2 py-1 rounded text-xs ${
                asset.status === 'operational' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
              }`}>{asset.status}</span>
              <span className="px-2 py-1 rounded text-xs bg-slate-500/20 text-slate-400">{asset.condition}</span>
            </div>
          </div>
        ))}
        {assets.length === 0 && search && !loading && (
          <p className="text-center text-slate-400 py-8">No assets found</p>
        )}
      </div>
    </div>
  );
}
