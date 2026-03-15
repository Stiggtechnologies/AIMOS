import { useState } from 'react';
import { ChartBar as FileBarChart, Download, Clock, Star, Search, Filter, ExternalLink } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  category: string;
  description: string;
  last_run?: string;
  is_favorite: boolean;
  tags: string[];
}

const REPORTS: Report[] = [
  { id: '1', name: 'Monthly Revenue Summary', category: 'Revenue', description: 'Network-wide revenue, collections, and AR by clinic for the current month.', last_run: '2026-03-14', is_favorite: true, tags: ['finance', 'monthly'] },
  { id: '2', name: 'Clinic Performance Scorecard', category: 'Operations', description: 'KPI scorecard comparing all clinics against network benchmarks.', last_run: '2026-03-13', is_favorite: true, tags: ['kpi', 'weekly'] },
  { id: '3', name: 'Patient Acquisition by Channel', category: 'Growth', description: 'New patient volume broken down by referral source and acquisition channel.', last_run: '2026-03-10', is_favorite: false, tags: ['growth', 'monthly'] },
  { id: '4', name: 'Clinician Utilization Report', category: 'Clinical', description: 'Provider utilization, scheduled vs. completed visits, and productivity metrics.', last_run: '2026-03-14', is_favorite: true, tags: ['clinical', 'weekly'] },
  { id: '5', name: 'Accounts Receivable Aging', category: 'Revenue', description: 'Aging buckets (0-30, 31-60, 61-90, 90+) across all payers and clinics.', last_run: '2026-03-07', is_favorite: false, tags: ['finance', 'weekly'] },
  { id: '6', name: 'Referral Source Intelligence', category: 'Growth', description: 'Referral source trends, conversion rates, and physician engagement scores.', last_run: '2026-03-01', is_favorite: false, tags: ['growth', 'monthly'] },
  { id: '7', name: 'Workforce Credential Status', category: 'Workforce', description: 'All staff credentials with expiry dates, compliance status, and renewal pipeline.', last_run: '2026-03-12', is_favorite: false, tags: ['hr', 'monthly'] },
  { id: '8', name: 'OKR Progress Report', category: 'Strategy', description: 'Current status of all active OKRs across corporate, regional, and clinic levels.', last_run: '2026-03-01', is_favorite: true, tags: ['strategy', 'monthly'] },
  { id: '9', name: 'After Hours Call Analytics', category: 'Operations', description: 'After-hours call volume, resolution rates, and conversion to appointments.', last_run: '2026-03-10', is_favorite: false, tags: ['ops', 'weekly'] },
  { id: '10', name: 'Launch Readiness Summary', category: 'Operations', description: 'Status of all active clinic launches against phase-gate criteria.', last_run: '2026-03-08', is_favorite: false, tags: ['launch'] },
];

const CATEGORIES = ['All', 'Revenue', 'Operations', 'Growth', 'Clinical', 'Workforce', 'Strategy'];

export default function ReportsView() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showFavOnly, setShowFavOnly] = useState(false);

  const filtered = REPORTS.filter(r => {
    if (showFavOnly && !r.is_favorite) return false;
    if (category !== 'All' && r.category !== category) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categoryColors: Record<string, string> = {
    Revenue: 'bg-amber-50 text-amber-700',
    Operations: 'bg-emerald-50 text-emerald-700',
    Growth: 'bg-rose-50 text-rose-700',
    Clinical: 'bg-teal-50 text-teal-700',
    Workforce: 'bg-orange-50 text-orange-700',
    Strategy: 'bg-sky-50 text-sky-700',
  };

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
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${showFavOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600'}`}
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
            <div className="flex items-center gap-3 flex-shrink-0">
              {report.last_run && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />{report.last_run}
                </span>
              )}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
                <Download className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Open">
                <ExternalLink className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            No reports match your filters
          </div>
        )}
      </div>
    </div>
  );
}
