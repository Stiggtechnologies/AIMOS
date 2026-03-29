import { useState } from 'react';
import { Search, Smartphone, ArrowRight, MapPin, Tag, Activity } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

function conditionScoreToLabel(score: number | null | undefined): { label: string; color: string } {
  if (score == null) return { label: '—', color: 'text-slate-400' };
  if (score >= 9) return { label: 'Excellent', color: 'text-emerald-400' };
  if (score >= 7) return { label: 'Good', color: 'text-blue-400' };
  if (score >= 5) return { label: 'Fair', color: 'text-amber-400' };
  if (score >= 3) return { label: 'Poor', color: 'text-orange-400' };
  return { label: 'Critical', color: 'text-red-400' };
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

  const statusStyle = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
      case 'maintenance': return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
      case 'decommissioned': return 'bg-red-500/15 text-red-400 border border-red-500/25';
      default: return 'bg-slate-500/15 text-slate-400 border border-slate-500/25';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="flex-shrink-0 px-6 py-5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-blue-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Mobile Asset Lookup</h1>
        </div>
        <p className="text-sm text-slate-400 ml-11">Quick search by name or asset tag</p>

        <div className="mt-5 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or asset tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-sm transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !search.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {!searched && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Smartphone className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">Enter a name or asset tag to search</p>
          </div>
        )}

        {searched && !loading && assets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-slate-300 font-medium mb-1">No assets found</p>
            <p className="text-slate-500 text-sm">Try a different search term</p>
          </div>
        )}

        {assets.length > 0 && (
          <div className="space-y-3 max-w-2xl mx-auto">
            <p className="text-xs text-slate-500 mb-4">{assets.length} result{assets.length !== 1 ? 's' : ''} found</p>
            {assets.map((asset) => {
              const condition = conditionScoreToLabel(asset.condition_score);
              return (
                <div
                  key={asset.id}
                  onClick={() => onNavigate?.('assets', 'register')}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-4 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-100 truncate group-hover:text-white transition-colors">{asset.name}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {asset.asset_tag && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Tag className="w-3 h-3" />
                            {asset.asset_tag}
                          </span>
                        )}
                        {asset.room_location && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {asset.room_location}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-xs">
                          <Activity className="w-3 h-3 text-slate-500" />
                          <span className={condition.color}>{condition.label}</span>
                          {asset.condition_score != null && (
                            <span className="text-slate-500">({asset.condition_score}/10)</span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${statusStyle(asset.status)}`}>
                        {asset.status || '—'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
