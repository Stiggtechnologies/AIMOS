import { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, ChartBar as BarChart2, ChevronDown, ChevronUp } from 'lucide-react';

const BUDGET_DATA = [
  { id: '1', category: 'Clinical Operations', allocated: 2400000, spent: 1820000, forecast: 2380000, variance: 20000, status: 'on_track' },
  { id: '2', category: 'Staff & HR', allocated: 3100000, spent: 2450000, forecast: 3180000, variance: -80000, status: 'over_budget' },
  { id: '3', category: 'Marketing & Growth', allocated: 480000, spent: 290000, forecast: 450000, variance: 30000, status: 'under_budget' },
  { id: '4', category: 'Technology & Systems', allocated: 320000, spent: 195000, forecast: 310000, variance: 10000, status: 'on_track' },
  { id: '5', category: 'Facilities & Equipment', allocated: 680000, spent: 620000, forecast: 695000, variance: -15000, status: 'at_risk' },
  { id: '6', category: 'Administrative', allocated: 210000, spent: 148000, forecast: 200000, variance: 10000, status: 'under_budget' },
  { id: '7', category: 'Expansion Capital', allocated: 1200000, spent: 890000, forecast: 1180000, variance: 20000, status: 'on_track' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: JSX.Element; label: string }> = {
  on_track: { color: 'text-green-700 bg-green-100', label: 'On Track', icon: <TrendingUp className="h-3.5 w-3.5 text-green-600" /> },
  over_budget: { color: 'text-red-700 bg-red-100', label: 'Over Budget', icon: <TrendingDown className="h-3.5 w-3.5 text-red-600" /> },
  under_budget: { color: 'text-blue-700 bg-blue-100', label: 'Under Budget', icon: <TrendingDown className="h-3.5 w-3.5 text-blue-600" /> },
  at_risk: { color: 'text-yellow-700 bg-yellow-100', label: 'At Risk', icon: <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" /> }
};

const FISCAL_YEAR = '2026';
const MONTH = 'March';

export default function BudgetsView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalAllocated = BUDGET_DATA.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = BUDGET_DATA.reduce((s, b) => s + b.spent, 0);
  const totalForecast = BUDGET_DATA.reduce((s, b) => s + b.forecast, 0);
  const totalVariance = totalAllocated - totalForecast;
  const spentPct = Math.round((totalSpent / totalAllocated) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budgets</h2>
          <p className="text-gray-600 mt-1">FY{FISCAL_YEAR} budget tracking and variance analysis — as of {MONTH}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Total Budget</div>
          <div className="text-2xl font-bold text-gray-900">${(totalAllocated / 1000000).toFixed(1)}M</div>
          <div className="text-sm text-gray-600">FY{FISCAL_YEAR} Allocated</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">YTD Spent</div>
          <div className="text-2xl font-bold text-blue-600">${(totalSpent / 1000000).toFixed(1)}M</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${spentPct}%` }} />
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
        <div className="space-y-2">
          {BUDGET_DATA.map(row => {
            const spentPct = Math.round((row.spent / row.allocated) * 100);
            const forecastPct = Math.round((row.forecast / row.allocated) * 100);
            const cfg = STATUS_CONFIG[row.status];
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
                        className="h-2 rounded-full bg-blue-500 absolute top-0 left-0"
                        style={{ width: `${Math.min(spentPct, 100)}%` }}
                      />
                      <div
                        className="h-2 rounded-l-none rounded-r-full opacity-40 bg-blue-300 absolute top-0 left-0"
                        style={{ width: `${Math.min(forecastPct, 100)}%` }}
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
                        <div className="text-xs text-gray-500">{spentPct}% of budget</div>
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
      </div>
    </div>
  );
}
