import { useState } from 'react';
import { TrendingUp, ChartBar as BarChart2, ArrowUpRight, ArrowDownRight, Minus, CircleAlert as AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

const MONTHLY_FORECAST = [
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

const METRICS = [
  { label: 'FY2026 Revenue Forecast', value: '$12.7M', change: '+13.8%', trend: 'up', vs: 'FY2025 actuals' },
  { label: 'Q2 Revenue Forecast', value: '$3.1M', change: '+8.2%', trend: 'up', vs: 'Q2 2025' },
  { label: 'Patient Volume Forecast', value: '14,850', change: '+11.5%', trend: 'up', vs: 'FY2025' },
  { label: 'EBITDA Forecast', value: '$2.28M', change: '+15.3%', trend: 'up', vs: 'FY2025' },
];

const SCENARIO_DATA = [
  { scenario: 'Base Case', fy_revenue: 12700000, fy_patients: 14850, ebitda_margin: 17.9, probability: 60 },
  { scenario: 'Bull Case', fy_revenue: 14200000, fy_patients: 16500, ebitda_margin: 19.5, probability: 20 },
  { scenario: 'Bear Case', fy_revenue: 11100000, fy_patients: 13200, ebitda_margin: 14.8, probability: 20 },
];

const fmtM = (v: number) => `$${(v / 1000000).toFixed(1)}M`;
const fmtK = (v: number) => `$${(v / 1000).toFixed(0)}K`;

export default function ForecastsView() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'scenarios' | 'drivers'>('revenue');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Forecasts</h2>
          <p className="text-gray-600 mt-1">FY2026 revenue forecasting and scenario analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {METRICS.map(m => (
          <div key={m.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
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
              <span className="text-xs text-gray-500">vs {m.vs}</span>
            </div>
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
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue — Actual vs Forecast</h3>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={MONTHLY_FORECAST}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtK(v)} />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="Actual" connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Forecast" />
                <Line type="monotone" dataKey="prior_year" stroke="#9ca3af" strokeWidth={1.5} dot={false} name="Prior Year" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">FY2026 Scenario Analysis</h3>
            <div className="space-y-4">
              {SCENARIO_DATA.map(scenario => (
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
                      <span>Probability</span>
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
          </div>
        )}

        {activeTab === 'drivers' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Key Revenue Drivers</h3>
            <div className="space-y-3">
              {[
                { driver: 'New Clinic Openings (South Commons)', impact: '+$420K', status: 'positive' },
                { driver: 'Patient Volume Growth (existing clinics)', impact: '+$280K', status: 'positive' },
                { driver: 'Corporate / Employer Program Expansion', impact: '+$165K', status: 'positive' },
                { driver: 'Fee Schedule Optimization', impact: '+$95K', status: 'positive' },
                { driver: 'Staff Turnover Risk', impact: '-$85K', status: 'negative' },
                { driver: 'Payer Mix Shift (more MSP, less cash)', impact: '-$45K', status: 'negative' },
              ].map(d => (
                <div key={d.driver} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    {d.status === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm text-gray-800">{d.driver}</span>
                  </div>
                  <span className={`font-semibold text-sm ${d.status === 'positive' ? 'text-green-700' : 'text-red-700'}`}>
                    {d.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
