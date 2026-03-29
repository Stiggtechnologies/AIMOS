import { useState } from 'react';
import { Search, Smartphone, ArrowRight, MapPin, Tag, Activity } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

function conditionScoreToLabel(score: number | null | undefined): { label: string; color: string } {
  if (score == null) return { label: '—', color: 'text-gray-400' };
  if (score >= 9) return { label: 'Excellent', color: 'text-emerald-600' };
  if (score >= 7) return { label: 'Good',      color: 'text-blue-600' };
  if (score >= 5) return { label: 'Fair',      color: 'text-amber-600' };
  if (score >= 3) return { label: 'Poor',      color: 'text-orange-600' };
  return              { label: 'Critical',   color: 'text-red-600' };
}

interface Props {
  onNavigate?: (module: string, subModule?: string, params?: any) => void;
}

export default function MobileAssetLookup({ onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, name, asset_tag, room_location, status, condition_score')
        .or(`name.ilike.%${search}%,asset_tag.ilike.%${search}%`)
        .limit(20);
      setAssets(data || []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  const statusStyle = (s: string) => {
    switch (s) {
      case 'operational':   return 'bg-emerald-100 text-emerald-700';
      case 'maintenance':   return 'bg-amber-100 text-amber-700';
      case 'decommissioned':return 'bg-red-100 text-red-700';
      default:              return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Smartphone className="w-6 h-6 text-blue-600" /> Mobile Asset Lookup
        </h1>
        <p className="text-gray-500 mt-1">Quick search by name or asset tag</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or asset tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !search.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {!searched && (
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16 text-gray-400">
          <Smartphone className="w-10 h-10 mb-3" />
          <p className="text-sm">Enter a name or asset tag to search</p>
        </div>
      )}

      {searched && !loading && assets.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col items-center justify-center py-16 text-gray-400">
          <Search className="w-10 h-10 mb-3" />
          <p className="font-medium text-gray-600">No assets found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}

      {assets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">{assets.length} result{assets.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="divide-y divide-gray-100">
            {assets.map((asset) => {
              const condition = conditionScoreToLabel(asset.condition_score);
              return (
                <div
                  key={asset.id}
                  onClick={() => onNavigate?.('assets', `asset-detail:${asset.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{asset.name}</p>
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        {asset.asset_tag && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Tag className="w-3 h-3" />{asset.asset_tag}
                          </span>
                        )}
                        {asset.room_location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />{asset.room_location}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-xs font-medium ${condition.color}`}>
                          <Activity className="w-3 h-3" />{condition.label}
                          {asset.condition_score != null && <span className="text-gray-400 font-normal">({asset.condition_score}/10)</span>}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle(asset.status)}`}>
                        {asset.status || '—'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
