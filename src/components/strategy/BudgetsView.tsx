import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, ChartBar as BarChart2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BudgetRow {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  forecast: number;
  variance: number;
  status: string;
}

const DEMO_BUDGET_DATA: BudgetRow[] = [
  { id: '1', category: 'Clinical Operations', allocated: 2400000, spent: 1820000, forecast: 2380000, variance: 20000, status: 'on_track' },
  { id: '2', category: 'Staff & HR', allocated: 3100000, spent: 2450000, forecast: 3180000, variance: -80000, status: 'over_budget' },
  { id: '3', category: 'Marketing & Growth', allocated: 480000, spent: 290000, forecast: 450000, variance: 30000, status: 'under_budget' },
  { id: '4', category: 'Technology & Systems', allocated: 320000, spent: 195000, forecast: 310000, variance: 10000, status: 'on_track' },
  { id: '5', category: 'Facilities & Equipment', allocated: 680000, spent: 620000, forecast: 695000, variance: -15000, status: 'at_risk' },
  { id: '6', category: 'Administrative', allocated: 210000, spent: 148000, forecast: 200000, variance: 10000, status: 'under_budget' },
  { id: '7', category: 'Expansion Capital', allocated: 1200000, spent: 890000, forecast: 1180000, variance: 20000, status: 'on_track' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  on_track: { color: 'text-green-700 bg-green-100', label: 'On Track', icon: <TrendingUp className="h-3.5 w-3.5 text-green-600" /> },
  over_budget: { color: 'text-red-700 bg-red-100', label: 'Over Budget', icon: <TrendingDown className="h-3.5 w-3.5 text-red-600" /> },
  under_budget: { color: 'text-blue-700 bg-blue-100', label: 'Under Budget', icon: <TrendingDown className="h-3.5 w-3.5 text-blue-600" /> },
  at_risk: { color: 'text-yellow-700 bg-yellow-100', label: 'At Risk', icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" /> }
};

function deriveBudgetStatus(allocated: number, forecast: number): string {
  const ratio = forecast / allocated;
  if (ratio > 1.02) return 'over_budget';
  if (ratio < 0.92) return 'under_budget';
  if (ratio > 0.97) return 'at_risk';
  return 'on_track';
}

export default function BudgetsView() {
  const [budgetData, setBudgetData] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadBudgets(); }, []);

  async function loadBudgets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_line_items')
        .select('id, category, allocated_amount, ytd_spent, full_year_forecast, fiscal_year')
        .eq('fiscal_year', new Date().getFullYear())
        .order('allocated_amount', { ascending: false });

      if (error || !data || data.length === 0) {
        setBudgetData(DEMO_BUDGET_DATA);
      } else {
        setBudgetData(data.map((r: Record<string, unknown>) => {
          const allocated = Number(r.allocated_amount) || 0;
          const spent = Number(r.ytd_spent) || 0;
          const forecast = Number(r.full_year_forecast) || allocated;
          const variance = allocated - forecast;
          return {
            id: r.id as string,
            category: (r.category as string) || 'Other',
            allocated,
            spent,
            forecast,
            variance,
            status: deriveBudgetStatus(allocated, forecast),
          };
        }));
      }
    } catch {
      setBudgetData(DEMO_BUDGET_DATA);
    } finally {
      setLoading(false);
    }
  }

  const totalAllocated = budgetData.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const totalForecast = budgetData.reduce((s, b) => s + b.forecast, 0);
  const totalVariance = totalAllocated - totalForecast;
  const spentPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>
          <p className="text-gray-600 mt-1">FY{currentYear} budget tracking and variance analysis — as of {currentMonth}</p>
        </div>
        <button
          onClick={loadBudgets}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Total Budget</div>
          <div className="text-2xl font-bold text-gray-900">${(totalAllocated / 1000000).toFixed(1)}M</div>
          <div className="text-sm text-gray-600">FY{currentYear} Allocated</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">YTD Spent</div>
          <div className="text-2xl font-bold text-blue-600">${(totalSpent / 1000000).toFixed(1)}M</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(spentPct, 100)}%` }} />
            </div>
            <span className="text-xs text-gray-600">{spentPct}%</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Full-Year Forecast</div>
          <div className="text-2xl font-bold text-gray-900">${(totalForecast / 1000000).toFixed(1)}M</div>
          <div className="text-sm text-gray-600">vs ${(totalAllocated / 1000000).toFixed(1)}M budget</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Variance</div>
          <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalVariance >= 0 ? '+' : ''}{(totalVariance / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-gray-600">{totalVariance >= 0 ? 'Under budget' : 'Over budget'}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-blue-600" />
          Budget by Category
        </h3>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm">Loading budget data...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {budgetData.map(row => {
              const rowSpentPct = row.allocated > 0 ? Math.round((row.spent / row.allocated) * 100) : 0;
              const forecastPct = row.allocated > 0 ? Math.round((row.forecast / row.allocated) * 100) : 0;
              const cfg = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.on_track;
              const isExpanded = expandedId === row.id;

              return (
                <div key={row.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : row.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{row.category}</span>
                          <div className="flex items-center gap-1">
                            {cfg.icon}
                            <span className={`px-2 py-0.5 text-xs rounded-full ${cfg.color}`}>{cfg.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">${(row.allocated / 1000).toFixed(0)}K budget</span>
                          <span className={`font-medium ${row.variance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {row.variance >= 0 ? '+' : ''}${(row.variance / 1000).toFixed(0)}K
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 rounded-full bg-blue-300 absolute top-0 left-0"
                          style={{ width: `${Math.min(forecastPct, 100)}%` }}
                        />
                        <div
                          className="h-2 rounded-full bg-blue-500 absolute top-0 left-0"
                          style={{ width: `${Math.min(rowSpentPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 bg-gray-50 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">YTD Spent</div>
                          <div className="font-semibold text-gray-900">${row.spent.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{rowSpentPct}% of budget</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Full-Year Forecast</div>
                          <div className="font-semibold text-gray-900">${row.forecast.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{forecastPct}% of budget</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Variance to Budget</div>
                          <div className={`font-semibold ${row.variance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {row.variance >= 0 ? '+' : ''}${row.variance.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
