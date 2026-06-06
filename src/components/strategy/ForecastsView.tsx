import { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';

interface MonthPoint {
  month: string;
  actual: number | null;
  forecast: number | null;
  prior_year: number | null;
}

interface ForecastMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  vs: string;
}

interface ScenarioRow {
  scenario: string;
  fy_revenue: number;
  fy_patients: number;
  ebitda_margin: number;
  probability: number;
}

interface ForecastRecord {
  id: string;
  period_month: string;
  period_year: number;
  actual_revenue: number | null;
  forecast_revenue: number | null;
  prior_year_revenue: number | null;
}

const DEMO_MONTHLY: MonthPoint[] = [
  { month: 'Jan', actual: 892000, forecast: 875000, prior_year: 810000 },
  { month: 'Feb', actual: 938000, forecast: 920000, prior_year: 845000 },
  { month: 'Mar', actual: 971000, forecast: 955000, prior_year: 887000 },
  { month: 'Apr', actual: null, forecast: 998000, prior_year: 912000 },
  { month: 'May', actual: null, forecast: 1045000, prior_year: 945000 },
  { month: 'Jun', actual: null, forecast: 1078000, prior_year: 978000 },
  { month: 'Jul', actual: null, forecast: 1052000, prior_year: 952000 },
  { month: 'Aug', actual: null, forecast: 1095000, prior_year: 985000 },
  { month: 'Sep', actual: null, forecast: 1120000, prior_year: 1012000 },
  { month: 'Oct', actual: null, forecast: 1148000, prior_year: 1038000 },
  { month: 'Nov', actual: null, forecast: 1165000, prior_year: 1055000 },
  { month: 'Dec', actual: null, forecast: 1175000, prior_year: 1065000 },
];

const DEMO_METRICS: ForecastMetric[] = [
  { label: 'FY2026 Revenue Forecast', value: '$12.7M', change: '+13.8%', trend: 'up', vs: 'FY2025 actuals' },
  { label: 'Q2 Revenue Forecast', value: '$3.1M', change: '+8.2%', trend: 'up', vs: 'Q2 2025' },
  { label: 'Patient Volume Forecast', value: '14,850', change: '+11.5%', trend: 'up', vs: 'FY2025' },
  { label: 'EBITDA Forecast', value: '$2.28M', change: '+15.3%', trend: 'up', vs: 'FY2025' },
];

const DEMO_SCENARIOS: ScenarioRow[] = [
  { scenario: 'Base Case', fy_revenue: 12700000, fy_patients: 14850, ebitda_margin: 17.9, probability: 60 },
  { scenario: 'Bull Case', fy_revenue: 14200000, fy_patients: 16500, ebitda_margin: 19.5, probability: 20 },
  { scenario: 'Bear Case', fy_revenue: 11100000, fy_patients: 13200, ebitda_margin: 14.8, probability: 20 },
];

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtM = (v: number) => `$${(v / 1000000).toFixed(1)}M`;
const fmtK = (v: number) => `$${(v / 1000).toFixed(0)}K`;

export default function ForecastsView() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'scenarios' | 'drivers'>('revenue');
  const [monthly, setMonthly] = useState<MonthPoint[]>([]);
  const [metrics, setMetrics] = useState<ForecastMetric[]>([]);
  const [scenarios] = useState<ScenarioRow[]>(DEMO_SCENARIOS);
  const [loading, setLoading] = useState(true);
  const [isLiveData, setIsLiveData] = useState(false);

  useEffect(() => { loadForecasts(); }, []);

  async function loadForecasts() {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('revenue_forecasts')
        .select('id, period_month, period_year, actual_revenue, forecast_revenue, prior_year_revenue')
        .eq('period_year', currentYear)
        .order('period_month', { ascending: true });

      if (error || !data || data.length === 0) {
        setMonthly(DEMO_MONTHLY);
        setMetrics(DEMO_METRICS);
        setIsLiveData(false);
        return;
      }

      const rows = data as ForecastRecord[];
      const points: MonthPoint[] = rows.map(r => ({
        month: MONTH_ABBR[Number(r.period_month) - 1] || `M${r.period_month}`,
        actual: r.actual_revenue,
        forecast: r.forecast_revenue,
        prior_year: r.prior_year_revenue,
      }));

      setMonthly(points);
      setIsLiveData(true);

      const totalForecast = rows.reduce((s, r) => s + (r.forecast_revenue || 0), 0);
      const totalActual = rows.filter(r => r.actual_revenue != null).reduce((s, r) => s + (r.actual_revenue || 0), 0);
      const totalPY = rows.reduce((s, r) => s + (r.prior_year_revenue || 0), 0);
      const yoyPct = totalPY > 0 ? ((totalForecast - totalPY) / totalPY * 100).toFixed(1) : '—';

      setMetrics([
        { label: `FY${currentYear} Revenue Forecast`, value: fmtM(totalForecast), change: `+${yoyPct}%`, trend: 'up', vs: `FY${currentYear - 1} actuals` },
        { label: 'YTD Actual Revenue', value: fmtM(totalActual), change: 'Live', trend: 'up', vs: 'from revenue import' },
        { label: 'Prior Year Revenue', value: fmtM(totalPY), change: '', trend: 'flat', vs: `FY${currentYear - 1}` },
        { label: 'YoY Growth (Forecast)', value: `${yoyPct}%`, change: '', trend: Number(yoyPct) > 0 ? 'up' : 'down', vs: 'vs prior year' },
      ]);
    } catch {
      setMonthly(DEMO_MONTHLY);
      setMetrics(DEMO_METRICS);
      setIsLiveData(false);
    } finally {
      setLoading(false);
    }
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Forecasts</h2>
          <p className="text-gray-600 mt-1">FY{currentYear} revenue forecasting and scenario analysis</p>
        </div>
        <div className="flex items-center gap-3">
          {isLiveData ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full">
              <Database className="h-3 w-3" />
              Live data
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-full">
              <Database className="h-3 w-3" />
              Demo data — import revenue to activate
            </div>
          )}
          <button
            onClick={loadForecasts}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            {m.change && (
              <div className="flex items-center gap-1 mt-1">
                {m.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : m.trend === 'down' ? (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${m.trend === 'up' ? 'text-green-600' : m.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                  {m.change}
                </span>
                {m.vs && <span className="text-xs text-gray-500">vs {m.vs}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-6">
          {(['revenue', 'scenarios', 'drivers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'revenue' ? 'Revenue Forecast' : tab === 'scenarios' ? 'Scenarios' : 'Key Drivers'}
            </button>
          ))}
        </div>

        {activeTab === 'revenue' && (
          loading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-sm">Loading forecast data...</p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue — Actual vs Forecast</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={((v: number) => fmtK(v)) as any} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="Actual" connectNulls={false} />
                  <Line type="monotone" dataKey="forecast" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Forecast" />
                  <Line type="monotone" dataKey="prior_year" stroke="#9ca3af" strokeWidth={1.5} dot={false} name="Prior Year" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )
        )}

        {activeTab === 'scenarios' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">FY{currentYear} Scenario Analysis</h3>
            <div className="space-y-4">
              {scenarios.map(scenario => (
                <div key={scenario.scenario} className={`p-4 border rounded-lg ${scenario.scenario === 'Base Case' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900">{scenario.scenario}</span>
                    <span className="text-sm text-gray-600">{scenario.probability}% probability</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Revenue</div>
                      <div className="font-bold text-gray-900">{fmtM(scenario.fy_revenue)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Patients</div>
                      <div className="font-bold text-gray-900">{scenario.fy_patients.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">EBITDA Margin</div>
                      <div className="font-bold text-gray-900">{scenario.ebitda_margin}%</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Probability Weight</span>
                      <span>{scenario.probability}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${scenario.scenario === 'Bull Case' ? 'bg-green-500' : scenario.scenario === 'Bear Case' ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${scenario.probability}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Scenario probabilities are manually assigned by leadership. Connect financial modeling tools for dynamic scenario generation.</p>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Key Revenue Drivers — {currentYear}</h3>
            <div className="space-y-3">
              {[
                { driver: 'New Clinic Openings (South Commons)', impact: '+$420K', status: 'positive' },
                { driver: 'Patient Volume Growth (existing clinics)', impact: '+$280K', status: 'positive' },
                { driver: 'Corporate / Employer Program Expansion', impact: '+$165K', status: 'positive' },
                { driver: 'Fee Schedule Optimization', impact: '+$95K', status: 'positive' },
                { driver: 'Staff Turnover Risk', impact: '-$85K', status: 'negative' },
                { driver: 'Payer Mix Shift (more WCB, less cash)', impact: '-$45K', status: 'negative' },
              ].map(d => (
                <div key={d.driver} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    {d.status === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-800">{d.driver}</span>
                  </div>
                  <span className={`font-semibold text-sm flex-shrink-0 ml-4 ${d.status === 'positive' ? 'text-green-700' : 'text-red-700'}`}>
                    {d.impact}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Revenue drivers are curated by leadership. Connect revenue import and strategic initiatives for automated driver analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
