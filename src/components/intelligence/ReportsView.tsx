import { useState, useEffect } from 'react';
import { ChartBar as FileBarChart, Download, Clock, Star, Search, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { ModuleKey } from '../../types/enterprise';

interface ReportsViewProps {
  onNavigate?: (module: ModuleKey, subModule: string) => void;
}

interface Report {
  id: string;
  name: string;
  category: string;
  description: string;
  last_run?: string;
  is_favorite: boolean;
  tags: string[];
  module: ModuleKey;
  subModule: string;
}

const BASE_REPORTS: Omit<Report, 'is_favorite'>[] = [
  {
    id: '1',
    name: 'Monthly Revenue Summary',
    category: 'Revenue',
    description: 'Network-wide revenue, collections, and AR by clinic for the current month.',
    last_run: '2026-03-14',
    tags: ['finance', 'monthly'],
    module: 'revenue',
    subModule: 'dashboard',
  },
  {
    id: '2',
    name: 'Clinic Performance Scorecard',
    category: 'Operations',
    description: 'KPI scorecard comparing all clinics against network benchmarks.',
    last_run: '2026-03-13',
    tags: ['kpi', 'weekly'],
    module: 'intelligence',
    subModule: 'clinic-performance',
  },
  {
    id: '3',
    name: 'Patient Acquisition by Channel',
    category: 'Growth',
    description: 'New patient volume broken down by referral source and acquisition channel.',
    last_run: '2026-03-10',
    tags: ['growth', 'monthly'],
    module: 'growth',
    subModule: 'demand-acquisition',
  },
  {
    id: '4',
    name: 'Clinician Utilization Report',
    category: 'Clinical',
    description: 'Provider utilization, scheduled vs. completed visits, and productivity metrics.',
    last_run: '2026-03-14',
    tags: ['clinical', 'weekly'],
    module: 'intelligence',
    subModule: 'utilization',
  },
  {
    id: '5',
    name: 'Accounts Receivable Aging',
    category: 'Revenue',
    description: 'Aging buckets (0-30, 31-60, 61-90, 90+) across all payers and clinics.',
    last_run: '2026-03-07',
    tags: ['finance', 'weekly'],
    module: 'revenue',
    subModule: 'ar',
  },
  {
    id: '6',
    name: 'Referral Source Intelligence',
    category: 'Growth',
    description: 'Referral source trends, conversion rates, and physician engagement scores.',
    last_run: '2026-03-01',
    tags: ['growth', 'monthly'],
    module: 'growth',
    subModule: 'referral-sources',
  },
  {
    id: '7',
    name: 'Workforce Credential Status',
    category: 'Workforce',
    description: 'All staff credentials with expiry dates, compliance status, and renewal pipeline.',
    last_run: '2026-03-12',
    tags: ['hr', 'monthly'],
    module: 'workforce',
    subModule: 'credentials',
  },
  {
    id: '8',
    name: 'OKR Progress Report',
    category: 'Strategy',
    description: 'Current status of all active OKRs across corporate, regional, and clinic levels.',
    last_run: '2026-03-01',
    tags: ['strategy', 'monthly'],
    module: 'strategy',
    subModule: 'okrs',
  },
  {
    id: '9',
    name: 'After Hours Call Analytics',
    category: 'Operations',
    description: 'After-hours call volume, resolution rates, and conversion to appointments.',
    last_run: '2026-03-10',
    tags: ['ops', 'weekly'],
    module: 'operations',
    subModule: 'after-hours',
  },
  {
    id: '10',
    name: 'Launch Readiness Summary',
    category: 'Operations',
    description: 'Status of all active clinic launches against phase-gate criteria.',
    last_run: '2026-03-08',
    tags: ['launch'],
    module: 'operations',
    subModule: 'launch-readiness',
  },
];

const CATEGORIES = ['All', 'Revenue', 'Operations', 'Growth', 'Clinical', 'Workforce', 'Strategy'];

const categoryColors: Record<string, string> = {
  Revenue: 'bg-amber-50 text-amber-700',
  Operations: 'bg-emerald-50 text-emerald-700',
  Growth: 'bg-rose-50 text-rose-700',
  Clinical: 'bg-teal-50 text-teal-700',
  Workforce: 'bg-orange-50 text-orange-700',
  Strategy: 'bg-sky-50 text-sky-700',
};

export default function ReportsView({ onNavigate }: ReportsViewProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(['1', '2', '4', '8']));
  const [loadingFavs, setLoadingFavs] = useState(false);

  useEffect(() => {
    if (user) loadFavorites();
  }, [user]);

  async function loadFavorites() {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_report_favorites')
        .select('report_id')
        .eq('user_id', user.id);
      if (data && data.length > 0) {
        setFavoriteIds(new Set(data.map((r: { report_id: string }) => r.report_id)));
      }
    } catch {
      // keep defaults
    }
  }

  async function toggleFavorite(reportId: string) {
    if (!user) return;
    setLoadingFavs(true);
    const isFav = favoriteIds.has(reportId);
    try {
      if (isFav) {
        await supabase
          .from('user_report_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('report_id', reportId);
        setFavoriteIds(prev => { const n = new Set(prev); n.delete(reportId); return n; });
      } else {
        await supabase
          .from('user_report_favorites')
          .upsert({ user_id: user.id, report_id: reportId }, { onConflict: 'user_id,report_id' });
        setFavoriteIds(prev => new Set([...prev, reportId]));
      }
    } catch {
      // silently keep current state
    } finally {
      setLoadingFavs(false);
    }
  }

  function runReport(report: Report) {
    if (onNavigate) {
      onNavigate(report.module, report.subModule);
    }
  }

  const reports: Report[] = BASE_REPORTS.map(r => ({
    ...r,
    is_favorite: favoriteIds.has(r.id),
  }));

  const filtered = reports.filter(r => {
    if (showFavOnly && !r.is_favorite) return false;
    if (category !== 'All' && r.category !== category) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise report library — run, download, or schedule</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <FileBarChart className="h-4 w-4" />
          <span>Custom Report</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFavOnly(!showFavOnly)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${showFavOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Star className="h-4 w-4" />
          Favorites
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category === cat ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(report => (
          <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-all">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileBarChart className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900 text-sm">{report.name}</p>
                  {report.is_favorite && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 mb-2">{report.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[report.category] || 'bg-gray-100 text-gray-600'}`}>{report.category}</span>
                  {report.tags.map(tag => (
                    <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {report.last_run && (
                <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />{report.last_run}
                </span>
              )}
              <button
                onClick={() => toggleFavorite(report.id)}
                disabled={loadingFavs}
                className={`p-2 rounded-lg transition-colors ${report.is_favorite ? 'text-amber-400 hover:bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
                title={report.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`h-4 w-4 ${report.is_favorite ? 'fill-amber-400' : ''}`} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600" title="Download">
                <Download className="h-4 w-4" />
              </button>
              {onNavigate && (
                <button
                  onClick={() => runReport(report)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  title="Open report"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <RefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No reports match your filters</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or category selection</p>
          </div>
        )}
      </div>
    </div>
  );
}
