import { useState } from 'react';
import { TrendingUp, DollarSign, Users, Activity, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const REVENUE_FORECAST = [
  { month: 'Oct', actual: 412000, forecast: null, low: null, high: null },
  { month: 'Nov', actual: 389000, forecast: null, low: null, high: null },
  { month: 'Dec', actual: 375000, forecast: null, low: null, high: null },
  { month: 'Jan', actual: 428000, forecast: null, low: null, high: null },
  { month: 'Feb', actual: 445000, forecast: null, low: null, high: null },
  { month: 'Mar', actual: 461000, forecast: null, low: null, high: null },
  { month: 'Apr', actual: null, forecast: 478000, low: 452000, high: 504000 },
  { month: 'May', actual: null, forecast: 492000, low: 461000, high: 523000 },
  { month: 'Jun', actual: null, forecast: 508000, low: 470000, high: 546000 },
  { month: 'Jul', actual: null, forecast: 521000, low: 478000, high: 564000 },
  { month: 'Aug', actual: null, forecast: 536000, low: 485000, high: 587000 },
  { month: 'Sep', actual: null, forecast: 550000, low: 492000, high: 608000 },
];

const VISIT_FORECAST = [
  { month: 'Oct', actual: 1820, forecast: null },
  { month: 'Nov', actual: 1710, forecast: null },
  { month: 'Dec', actual: 1650, forecast: null },
  { month: 'Jan', actual: 1890, forecast: null },
  { month: 'Feb', actual: 1960, forecast: null },
  { month: 'Mar', actual: 2030, forecast: null },
  { month: 'Apr', actual: null, forecast: 2095 },
  { month: 'May', actual: null, forecast: 2160 },
  { month: 'Jun', actual: null, forecast: 2230 },
];

const formatCurrency = (v: number) => `$${(v / 1000).toFixed(0)}k`;

export default function ForecastingView() {
  const [metric, setMetric] = useState<'revenue' | 'visits' | 'patients'>('revenue');

  const projectedAnnual = REVENUE_FORECAST.reduce((s, d) => s + (d.actual || d.forecast || 0), 0);
  const yoyGrowth = 11.2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forecasting</h1>
          <p className="text-sm text-gray-500 mt-1">Revenue, visit volume, and growth projections</p>
        </div>
        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
          <Info className="h-4 w-4" />
          <span>Model updated Mar 14</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Projected FY Revenue', value: `$${(projectedAnnual / 1000000).toFixed(2)}M`, sub: '+11.2% YoY', color: 'green', icon: DollarSign },
          { label: 'Q2 Revenue Forecast', value: '$1.48M', sub: 'Apr–Jun 2026', color: 'blue', icon: TrendingUp },
          { label: 'Projected New Patients', value: '2,340', sub: 'Next 12 months', color: 'teal', icon: Users },
          { label: 'Forecast Confidence', value: '87%', sub: 'Based on 8-factor model', color: 'amber', icon: Activity },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-9 h-9 rounded-lg bg-${color}-50 flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 text-${color}-600`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Revenue Forecast — Actuals + Projection</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 bg-blue-500 inline-block" /> Actual</span>
            <span className="flex items-center gap-1"><span className="w-6 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block" /> Forecast</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={REVENUE_FORECAST}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [formatCurrency(v as number), '']} />
            <ReferenceLine x="Mar" stroke="#d1d5db" strokeDasharray="4 4" label={{ value: 'Today', fontSize: 10, fill: '#9ca3af' }} />
            <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="high" stroke="#d1fae5" strokeWidth={1} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="low" stroke="#d1fae5" strokeWidth={1} dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Visit Volume Forecast</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={VISIT_FORECAST}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Model Inputs</h3>
          <div className="space-y-3">
            {[
              { factor: 'Historical Revenue Trend', weight: 32 },
              { factor: 'Seasonality Index', weight: 18 },
              { factor: 'New Patient Intake Rate', weight: 15 },
              { factor: 'Referral Source Growth', weight: 12 },
              { factor: 'Utilization Rate', weight: 10 },
              { factor: 'Pricing Changes', weight: 8 },
              { factor: 'Staff Capacity', weight: 5 },
            ].map(({ factor, weight }) => (
              <div key={factor} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-44 truncate">{factor}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${weight * 3}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
