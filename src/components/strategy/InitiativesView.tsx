import { useState, useEffect } from 'react';
import { Rocket, Plus, Search, Target, Calendar, User, TrendingUp, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Initiative {
  id: string;
  title: string;
  description?: string;
  category: string;
  owner: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  targetDate: string;
  budget: number;
  spent: number;
  linked_okr?: string;
  impact_area?: string;
}

const DEMO_INITIATIVES: Initiative[] = [
  { id: '1', title: 'AIM South Commons Launch', category: 'Expansion', owner: 'Sarah Chen', status: 'in_progress', priority: 'high', progress: 68, startDate: '2026-01-01', targetDate: '2026-04-30', budget: 450000, spent: 312000, linked_okr: 'Expand to 6 locations by Q4 2026' },
  { id: '2', title: 'Digital Intake Automation', category: 'Technology', owner: 'Mark Patel', status: 'in_progress', priority: 'high', progress: 45, startDate: '2026-02-01', targetDate: '2026-06-30', budget: 85000, spent: 38000, linked_okr: 'Reduce intake time by 40%' },
  { id: '3', title: 'Corporate Wellness Program Rollout', category: 'Growth', owner: 'Lisa Wong', status: 'planning', priority: 'medium', progress: 15, startDate: '2026-03-01', targetDate: '2026-08-31', budget: 120000, spent: 18000, linked_okr: 'Add 200 employer-covered patients' },
  { id: '4', title: 'Clinician Training Academy', category: 'Workforce', owner: 'Dr. James Liu', status: 'in_progress', priority: 'medium', progress: 82, startDate: '2025-11-01', targetDate: '2026-03-31', budget: 35000, spent: 29000, linked_okr: 'Achieve 95% staff certification rate' },
  { id: '5', title: 'Revenue Cycle Optimization', category: 'Finance', owner: 'Tom Brady', status: 'completed', priority: 'high', progress: 100, startDate: '2025-10-01', targetDate: '2026-01-31', budget: 60000, spent: 55000, linked_okr: 'Reduce AR days to <30' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3.5 w-3.5 text-blue-600" /> },
  planning: { label: 'Planning', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-3.5 w-3.5 text-yellow-600" /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3.5 w-3.5 text-green-600" /> },
  on_hold: { label: 'On Hold', color: 'bg-gray-100 text-gray-700', icon: <AlertCircle className="h-3.5 w-3.5 text-gray-500" /> }
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600'
};

export default function InitiativesView() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => { loadInitiatives(); }, []);

  async function loadInitiatives() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('strategic_initiatives')
        .select('id, title, description, category, owner_name, status, priority, progress_percent, budget_allocated, budget_spent, start_date, target_date, impact_area')
        .order('priority', { ascending: false });

      if (error || !data || data.length === 0) {
        setInitiatives(DEMO_INITIATIVES);
      } else {
        setInitiatives(data.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category || 'General',
          owner: r.owner_name || '—',
          status: r.status || 'planning',
          priority: r.priority || 'medium',
          progress: Number(r.progress_percent) || 0,
          startDate: r.start_date || '',
          targetDate: r.target_date || '',
          budget: Number(r.budget_allocated) || 0,
          spent: Number(r.budget_spent) || 0,
          impact_area: r.impact_area,
        })));
      }
    } catch {
      setInitiatives(DEMO_INITIATIVES);
    } finally {
      setLoading(false);
    }
  }

  const filtered = initiatives.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || i.status === statusFilter;
    const matchCat = !categoryFilter || i.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const categories = [...new Set(initiatives.map(i => i.category))];
  const totalBudget = initiatives.reduce((s, i) => s + i.budget, 0);
  const totalSpent = initiatives.reduce((s, i) => s + i.spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Strategic Initiatives</h2>
          <p className="text-gray-600 mt-1">Track and manage enterprise-wide strategic programs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadInitiatives}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Initiative
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-blue-600">{initiatives.length}</div>
          <div className="text-sm text-gray-600">Total Initiatives</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-green-600">{initiatives.filter(i => i.status === 'in_progress').length}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-gray-900">${(totalBudget / 1000).toFixed(0)}K</div>
          <div className="text-sm text-gray-600">Total Budget</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-2xl font-bold text-amber-600">{totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0}%</div>
          <div className="text-sm text-gray-600">Budget Utilized</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search initiatives..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm">Loading initiatives...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Rocket className="h-12 w-12 mx-auto mb-2 text-gray-200" />
            <p className="font-medium text-gray-500">No initiatives found</p>
            <p className="text-xs mt-1">Adjust your filters or create a new initiative</p>
          </div>
        ) : null}

        <div className="space-y-3">
          {!loading && filtered.map(initiative => {
            const statusCfg = STATUS_CONFIG[initiative.status];
            const budgetPct = initiative.budget > 0 ? Math.round((initiative.spent / initiative.budget) * 100) : 0;
            return (
              <div key={initiative.id} className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <Rocket className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">{initiative.title}</span>
                      <div className="flex items-center gap-1">
                        {statusCfg.icon}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${PRIORITY_COLORS[initiative.priority]}`}>
                        {initiative.priority}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 ml-7">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{initiative.owner || '—'}</span>
                      <span className="flex items-center gap-1"><Target className="h-3 w-3" />{initiative.category}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Target: {initiative.targetDate ? new Date(initiative.targetDate).toLocaleDateString() : '—'}</span>
                    </div>
                    {initiative.linked_okr && (
                      <div className="ml-7 mt-1 text-xs text-blue-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        OKR: {initiative.linked_okr}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 ml-7">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{initiative.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${initiative.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${initiative.progress}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Budget (${(initiative.spent / 1000).toFixed(0)}K / ${(initiative.budget / 1000).toFixed(0)}K)</span>
                      <span>{budgetPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(budgetPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
