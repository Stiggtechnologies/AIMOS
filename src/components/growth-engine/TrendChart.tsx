import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DailyTrend } from '../../services/growthEngineService';

interface Props {
  data: DailyTrend[];
  metric: 'leads' | 'bookings' | 'revenue';
}

const COLOR_MAP = {
  leads:    '#3B82F6',
  bookings: '#10B981',
  revenue:  '#F59E0B',
};

const LABEL_MAP = {
  leads:    'Leads',
  bookings: 'Bookings',
  revenue:  'Revenue ($)',
};

const formatDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};

const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (!active || !Array.isArray(payload) || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-medium text-gray-700 mb-1">{formatDate(label as string)}</p>
      {payload.map((p: Record<string, unknown>, i: number) => (
        <p key={i} style={{ color: p.color as string }} className="font-semibold">
          {p.name as string}: {typeof p.value === 'number' && (p.name as string).includes('$')
            ? `$${(p.value as number).toLocaleString()}`
            : (p.value as number).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export const TrendChart: React.FC<Props> = ({ data, metric }) => (
  <ResponsiveContainer width="100%" height={180}>
    <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={COLOR_MAP[metric]} stopOpacity={0.15} />
          <stop offset="95%" stopColor={COLOR_MAP[metric]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
      <XAxis
        dataKey="date"
        tickFormatter={formatDate}
        tick={{ fontSize: 10, fill: '#9CA3AF' }}
        axisLine={false}
        tickLine={false}
        interval={2}
      />
      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Area
        type="monotone"
        dataKey={metric}
        name={LABEL_MAP[metric]}
        stroke={COLOR_MAP[metric]}
        strokeWidth={2}
        fill={`url(#grad-${metric})`}
        dot={false}
        activeDot={{ r: 4, strokeWidth: 0 }}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const MultiTrendChart: React.FC<{ data: DailyTrend[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="grad-leads2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.12} />
          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="grad-bookings2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="#10B981" stopOpacity={0.12} />
          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
      <XAxis dataKey="date" tickFormatter={formatDate}
        tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={2} />
      <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} />
      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
      <Area type="monotone" dataKey="leads" name="Leads" stroke="#3B82F6" strokeWidth={2}
        fill="url(#grad-leads2)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#10B981" strokeWidth={2}
        fill="url(#grad-bookings2)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
    </AreaChart>
  </ResponsiveContainer>
);
