import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface ChartData {
  [key: string]: string | number;
}

interface BaseChartProps {
  data: ChartData[];
  height?: number;
  colors?: string[];
}

interface TimeSeriesChartProps extends BaseChartProps {
  xKey: string;
  yKeys: string[];
  labels?: { [key: string]: string };
}

interface PieChartProps extends BaseChartProps {
  nameKey: string;
  valueKey: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316'  // orange
];

export function TrendLineChart({ data, xKey, yKeys, labels, height = 300, colors = DEFAULT_COLORS }: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tick={{ fill: '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: '#E5E7EB' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px'
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => labels?.[value] || value}
        />
        {yKeys.map((key, idx) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[idx % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={labels?.[key] || key}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaChartComponent({ data, xKey, yKeys, labels, height = 300, colors = DEFAULT_COLORS }: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tick={{ fill: '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: '#E5E7EB' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px'
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => labels?.[value] || value}
        />
        {yKeys.map((key, idx) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[idx % colors.length]}
            fill={colors[idx % colors.length]}
            fillOpacity={0.6}
            name={labels?.[key] || key}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarChartComponent({ data, xKey, yKeys, labels, height = 300, colors = DEFAULT_COLORS }: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey={xKey}
          tick={{ fill: '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tick={{ fill: '#6B7280', fontSize: 12 }}
          tickLine={{ stroke: '#E5E7EB' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px'
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => labels?.[value] || value}
        />
        {yKeys.map((key, idx) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[idx % colors.length]}
            name={labels?.[key] || key}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieChartComponent({ data, nameKey, valueKey, height = 300, colors = DEFAULT_COLORS }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey={valueKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '12px'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CapacityHeatmap({ data, height = 400 }: { data: Array<{ day: string; hour: number; utilization: number }>, height?: number }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getColor = (utilization: number) => {
    if (utilization >= 90) return '#DC2626';
    if (utilization >= 75) return '#F59E0B';
    if (utilization >= 50) return '#10B981';
    return '#3B82F6';
  };

  const getCellData = (day: string, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour);
  };

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: '600px' }}>
        <div className="flex mb-2">
          <div className="w-16"></div>
          {hours.map(hour => (
            <div key={hour} className="flex-1 text-center text-xs text-gray-600">
              {hour}
            </div>
          ))}
        </div>
        {days.map(day => (
          <div key={day} className="flex mb-1">
            <div className="w-16 text-sm text-gray-700 flex items-center">{day}</div>
            {hours.map(hour => {
              const cellData = getCellData(day, hour);
              const utilization = cellData?.utilization || 0;
              return (
                <div
                  key={`${day}-${hour}`}
                  className="flex-1 aspect-square m-0.5 rounded"
                  style={{ backgroundColor: getColor(utilization) }}
                  title={`${day} ${hour}:00 - ${utilization}% utilization`}
                />
              );
            })}
          </div>
        ))}
        <div className="flex justify-center items-center space-x-4 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
            <span>0-50%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <span>50-75%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
            <span>75-90%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#DC2626' }}></div>
            <span>90-100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface NetworkNode {
  id: string;
  name: string;
  group: string;
  value: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  value: number;
}

export function NetworkGraph({
  nodes,
  links,
  height = 400
}: {
  nodes: NetworkNode[];
  links: NetworkLink[];
  height?: number;
}) {
  const groupColors: { [key: string]: string } = {
    'primary': '#3B82F6',
    'partner': '#10B981',
    'referral': '#F59E0B',
    'specialty': '#8B5CF6'
  };

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" className="border border-gray-200 rounded-lg bg-gray-50">
        <g>
          {links.map((link, idx) => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            const sourceIdx = nodes.indexOf(sourceNode);
            const targetIdx = nodes.indexOf(targetNode);
            const radius = 200;
            const centerX = 300;
            const centerY = 200;

            const sourceAngle = (sourceIdx / nodes.length) * 2 * Math.PI;
            const targetAngle = (targetIdx / nodes.length) * 2 * Math.PI;

            const x1 = centerX + radius * Math.cos(sourceAngle);
            const y1 = centerY + radius * Math.sin(sourceAngle);
            const x2 = centerX + radius * Math.cos(targetAngle);
            const y2 = centerY + radius * Math.sin(targetAngle);

            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#D1D5DB"
                strokeWidth={Math.max(1, link.value / 10)}
                opacity={0.6}
              />
            );
          })}

          {nodes.map((node, idx) => {
            const radius = 200;
            const centerX = 300;
            const centerY = 200;
            const angle = (idx / nodes.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            return (
              <g key={node.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={Math.max(10, node.value / 5)}
                  fill={groupColors[node.group] || '#6B7280'}
                  opacity={0.8}
                />
                <text
                  x={x}
                  y={y + radius * 0.15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#374151"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow p-3 text-xs">
        {Object.entries(groupColors).map(([group, color]) => (
          <div key={group} className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="capitalize">{group}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
