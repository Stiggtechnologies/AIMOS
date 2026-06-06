import { ChartBar as BarChart2, TrendingUp, Award, TriangleAlert as AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const CLINIC_BENCHMARKS = [
  { clinic: 'South Commons', utilization: 78, ar_days: 38, visits_per_day: 28, nps: 72, revenue_per_visit: 182 },
  { clinic: 'West End', utilization: 61, ar_days: 52, visits_per_day: 22, nps: 65, revenue_per_visit: 168 },
  { clinic: 'North Gate', utilization: 74, ar_days: 41, visits_per_day: 26, nps: 70, revenue_per_visit: 175 },
  { clinic: 'Beltline', utilization: 82, ar_days: 34, visits_per_day: 31, nps: 78, revenue_per_visit: 191 },
  { clinic: 'Chinook', utilization: 69, ar_days: 44, visits_per_day: 24, nps: 68, revenue_per_visit: 172 },
  { clinic: 'NW Calgary', utilization: 71, ar_days: 42, visits_per_day: 25, nps: 71, revenue_per_visit: 178 },
];

const NETWORK_TARGETS = {
  utilization: 75,
  ar_days: 40,
  visits_per_day: 26,
  nps: 70,
  revenue_per_visit: 178,
};

const RADAR_DATA = [
  { metric: 'Utilization', network: 72.5, target: 75, top: 82 },
  { metric: 'AR Days', network: 75, target: 80, top: 94 },
  { metric: 'Visit Volume', network: 68, target: 75, top: 90 },
  { metric: 'NPS', network: 70.7, target: 70, top: 78 },
  { metric: 'Rev/Visit', network: 71, target: 70, top: 91 },
];

export default function BenchmarkingView() {
  const networkAvg = {
    utilization: (CLINIC_BENCHMARKS.reduce((s, c) => s + c.utilization, 0) / CLINIC_BENCHMARKS.length).toFixed(1),
    ar_days: (CLINIC_BENCHMARKS.reduce((s, c) => s + c.ar_days, 0) / CLINIC_BENCHMARKS.length).toFixed(1),
    revenue_per_visit: (CLINIC_BENCHMARKS.reduce((s, c) => s + c.revenue_per_visit, 0) / CLINIC_BENCHMARKS.length).toFixed(0),
    nps: (CLINIC_BENCHMARKS.reduce((s, c) => s + c.nps, 0) / CLINIC_BENCHMARKS.length).toFixed(1),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Benchmarking</h1>
          <p className="text-sm text-gray-500 mt-1">Clinic-vs-clinic and clinic-vs-target performance comparisons</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-lg">
          <Award className="h-4 w-4 text-amber-500" />
          Top performer: Beltline
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Avg Utilization', value: `${networkAvg.utilization}%`, target: '75%', above: parseFloat(networkAvg.utilization) >= 75 },
          { label: 'Avg AR Days', value: `${networkAvg.ar_days}d`, target: '40d', above: parseFloat(networkAvg.ar_days) <= 40 },
          { label: 'Avg Rev/Visit', value: `$${networkAvg.revenue_per_visit}`, target: '$178', above: parseInt(networkAvg.revenue_per_visit) >= 178 },
          { label: 'Avg NPS', value: networkAvg.nps, target: '70', above: parseFloat(networkAvg.nps) >= 70 },
        ].map(({ label, value, target, above }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{label}</span>
              {above ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">Target: {target}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Utilization by Clinic vs Target (75%)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={CLINIC_BENCHMARKS} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="clinic" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={((v: number) => [`${v}%`, 'Utilization']) as any} />
            <Bar dataKey="utilization" fill="#3b82f6" radius={[3, 3, 0, 0]}
              label={{ position: 'top', fontSize: 10, formatter: ((v: number) => `${v}%`) as any }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Clinic Scorecard vs Network vs Target</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">Clinic</th>
                <th className="text-right py-2 text-gray-500 font-medium">Utilization</th>
                <th className="text-right py-2 text-gray-500 font-medium">AR Days</th>
                <th className="text-right py-2 text-gray-500 font-medium">Visits/Day</th>
                <th className="text-right py-2 text-gray-500 font-medium">NPS</th>
                <th className="text-right py-2 text-gray-500 font-medium">Rev/Visit</th>
                <th className="text-right py-2 text-gray-500 font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {CLINIC_BENCHMARKS.sort((a, b) => b.utilization - a.utilization).map((c, i) => {
                const score = Math.round(
                  (c.utilization / NETWORK_TARGETS.utilization * 20) +
                  (NETWORK_TARGETS.ar_days / c.ar_days * 20) +
                  (c.visits_per_day / NETWORK_TARGETS.visits_per_day * 20) +
                  (c.nps / NETWORK_TARGETS.nps * 20) +
                  (c.revenue_per_visit / NETWORK_TARGETS.revenue_per_visit * 20)
                );
                return (
                  <tr key={c.clinic} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-900 flex items-center gap-2">
                      {i === 0 && <Award className="h-4 w-4 text-amber-400" />}
                      {c.clinic}
                    </td>
                    <td className={`py-2.5 text-right ${c.utilization >= NETWORK_TARGETS.utilization ? 'text-green-600' : 'text-red-500'}`}>{c.utilization}%</td>
                    <td className={`py-2.5 text-right ${c.ar_days <= NETWORK_TARGETS.ar_days ? 'text-green-600' : 'text-red-500'}`}>{c.ar_days}d</td>
                    <td className="py-2.5 text-right text-gray-700">{c.visits_per_day}</td>
                    <td className={`py-2.5 text-right ${c.nps >= NETWORK_TARGETS.nps ? 'text-green-600' : 'text-amber-600'}`}>{c.nps}</td>
                    <td className="py-2.5 text-right text-gray-700">${c.revenue_per_visit}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-semibold ${score >= 95 ? 'text-green-600' : score >= 85 ? 'text-blue-600' : 'text-amber-600'}`}>{score}</span>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium">
                <td className="py-2.5 text-gray-700">Network Avg</td>
                <td className="py-2.5 text-right text-gray-700">{networkAvg.utilization}%</td>
                <td className="py-2.5 text-right text-gray-700">{networkAvg.ar_days}d</td>
                <td className="py-2.5 text-right text-gray-700">26</td>
                <td className="py-2.5 text-right text-gray-700">{networkAvg.nps}</td>
                <td className="py-2.5 text-right text-gray-700">${networkAvg.revenue_per_visit}</td>
                <td className="py-2.5 text-right text-gray-500">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
