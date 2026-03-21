import React, { useState, useEffect } from 'react';
import { ChartBar as BarChart2, TrendingUp, DollarSign, Target, Users, Zap, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { growthEngineService, type ChannelMetrics } from '../../services/growthEngineService';

const ROAS_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

const getRoasColor = (roas: number) =>
  roas >= 6 ? '#10B981' : roas >= 4 ? '#3B82F6' : roas >= 2 ? '#F59E0B' : '#EF4444';

const fmt$ = (n: number) => n === 0 ? '$0' : `$${n.toLocaleString('en-CA', { minimumFractionDigits: 0 })}`;

const MetricToggle: React.FC<{
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}> = ({ options, value, onChange }) => (
  <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
    {options.map(o => (
      <button
        key={o.key}
        onClick={() => onChange(o.key)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          value === o.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const CustomBarTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (!active || !Array.isArray(payload) || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800 mb-1">{label as string}</p>
      {payload.map((p: Record<string, unknown>, i: number) => (
        <p key={i} style={{ color: p.fill as string }} className="font-medium">
          {p.name as string}: {
            (p.name as string).toLowerCase().includes('$') || (p.name as string).toLowerCase().includes('revenue') || (p.name as string).toLowerCase().includes('spend')
              ? fmt$(p.value as number)
              : typeof p.value === 'number' && p.value < 100
                ? `${(p.value as number).toFixed(2)}x`
                : (p.value as number).toLocaleString()
          }
        </p>
      ))}
    </div>
  );
};

export const ChannelAttributionView: React.FC = () => {
  const [channels, setChannels] = useState<ChannelMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [barMetric, setBarMetric] = useState<'leads' | 'bookings' | 'revenue' | 'roas'>('leads');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await growthEngineService.getChannelMetrics();
      setChannels(data);
    } catch { /* ignore */ } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const paidChannels = channels.filter(c => c.spend > 0);
  const totalSpend   = paidChannels.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
  const totalLeads   = channels.reduce((s, c) => s + c.leads, 0);

  const barData = channels.map(c => ({
    name: c.label.replace('Google Business Profile', 'GBP'),
    leads: c.leads,
    bookings: c.bookings,
    revenue: c.revenue,
    roas: c.roas,
    fill: c.color,
  }));

  const pieData = channels
    .filter(c => c.leads > 0)
    .map(c => ({ name: c.label, value: c.leads, color: c.color }));

  const spendPie = paidChannels.map(c => ({
    name: c.label, value: c.spend, color: c.color,
  }));

  const METRIC_OPTIONS = [
    { key: 'leads',    label: 'Leads' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'revenue',  label: 'Revenue' },
    { key: 'roas',     label: 'ROAS' },
  ];

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Channel Attribution</h1>
              <p className="text-xs text-gray-500">ROI analysis across all acquisition channels · March 2026</p>
            </div>
          </div>
          <button onClick={() => { setRefreshing(true); load(); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users,      label: 'Total Leads',   value: totalLeads.toLocaleString(),    accent: 'bg-blue-500' },
            { icon: DollarSign, label: 'Total Revenue', value: fmt$(totalRevenue),              accent: 'bg-emerald-500' },
            { icon: Target,     label: 'Total Spend',   value: fmt$(totalSpend),               accent: 'bg-amber-500' },
            { icon: TrendingUp, label: 'Blended ROAS',  value: totalSpend > 0 ? `${(totalRevenue/totalSpend).toFixed(2)}x` : '—', accent: 'bg-rose-500' },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Channel Comparison</h3>
              <p className="text-xs text-gray-400 mt-0.5">Select a metric to compare across channels</p>
            </div>
            <MetricToggle options={METRIC_OPTIONS} value={barMetric} onChange={v => setBarMetric(v as typeof barMetric)} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey={barMetric} name={barMetric.charAt(0).toUpperCase() + barMetric.slice(1)} radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={barMetric === 'roas' ? getRoasColor(entry.roas) : entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lead Share */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-5">Lead Share by Channel</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={((v: number) => [`${v} leads`, '']) as any} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Spend Distribution */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-5">Spend Distribution (Paid)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={spendPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={2}>
                  {spendPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={((v: number) => [fmt$(v), '']) as any} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROAS Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Efficiency Matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {['Channel', 'Leads', 'Conv %', 'CPL', 'Cost / Booked', 'Revenue', 'ROAS', 'Efficiency'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {channels.sort((a, b) => b.roas - a.roas).map(ch => {
                  const eff = ch.roas >= 6 ? 'Excellent' : ch.roas >= 4 ? 'Good' : ch.roas >= 2 ? 'Fair' : ch.spend === 0 ? 'Organic' : 'Poor';
                  const effColor = eff === 'Excellent' ? 'bg-green-100 text-green-700' :
                    eff === 'Good' ? 'bg-blue-100 text-blue-700' :
                    eff === 'Fair' ? 'bg-amber-100 text-amber-700' :
                    eff === 'Organic' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700';
                  return (
                    <tr key={ch.channel} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
                          <span className="font-medium text-gray-900">{ch.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{ch.leads}</td>
                      <td className="px-5 py-3.5 text-gray-700">{ch.convRate.toFixed(1)}%</td>
                      <td className="px-5 py-3.5 text-gray-700">{ch.cpl === 0 ? '—' : fmt$(ch.cpl)}</td>
                      <td className="px-5 py-3.5 text-gray-700">{ch.cpb === 0 ? '—' : fmt$(ch.cpb)}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">{fmt$(ch.revenue)}</td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: getRoasColor(ch.roas) }}>
                        {ch.roas === 0 ? '—' : `${ch.roas.toFixed(2)}x`}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium ${effColor}`}>
                          {eff}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attribution Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Zap,
              title: 'Highest ROI',
              body: channels.filter(c => c.roas > 0).sort((a, b) => b.roas - a.roas)[0],
              color: 'text-amber-500',
              bg: 'bg-amber-50 border-amber-100',
              fmt: (c: ChannelMetrics) => `${c.roas.toFixed(2)}x ROAS on $${c.spend.toLocaleString()} spend`,
            },
            {
              icon: Users,
              title: 'Most Leads',
              body: channels.sort((a, b) => b.leads - a.leads)[0],
              color: 'text-blue-500',
              bg: 'bg-blue-50 border-blue-100',
              fmt: (c: ChannelMetrics) => `${c.leads} leads · ${c.convRate.toFixed(1)}% conversion`,
            },
            {
              icon: DollarSign,
              title: 'Most Revenue',
              body: channels.sort((a, b) => b.revenue - a.revenue)[0],
              color: 'text-emerald-500',
              bg: 'bg-emerald-50 border-emerald-100',
              fmt: (c: ChannelMetrics) => `${fmt$(c.revenue)} from ${c.bookings} bookings`,
            },
          ].map(({ icon: Icon, title, body, color, bg, fmt: fmtFn }) =>
            body ? (
              <div key={title} className={`rounded-xl border p-5 ${bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{title}</span>
                </div>
                <p className="font-bold text-gray-900 text-base">{body.label}</p>
                <p className="text-sm text-gray-600 mt-0.5">{fmtFn(body)}</p>
              </div>
            ) : null
          )}
        </div>

      </div>
    </div>
  );
};
