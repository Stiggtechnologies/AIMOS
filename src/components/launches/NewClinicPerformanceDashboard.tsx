import { useState } from 'react';
import { TrendingUp, Users, DollarSign, Star, Calendar, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

const CLINICS = ['AIM South Commons', 'AIM Crowfoot (Simulated)'];

const DAY_90_DATA = [
  { day: 'Day 1', patients: 3, revenue: 780, utilization: 18, target_patients: 5 },
  { day: 'Day 7', patients: 12, revenue: 3840, utilization: 42, target_patients: 15 },
  { day: 'Day 14', patients: 19, revenue: 6270, utilization: 58, target_patients: 22 },
  { day: 'Day 21', patients: 27, revenue: 9180, utilization: 68, target_patients: 28 },
  { day: 'Day 30', patients: 34, revenue: 11560, utilization: 74, target_patients: 35 },
  { day: 'Day 45', patients: 41, revenue: 14350, utilization: 80, target_patients: 42 },
  { day: 'Day 60', patients: 47, revenue: 16450, utilization: 84, target_patients: 48 },
  { day: 'Day 75', patients: 52, revenue: 18720, utilization: 87, target_patients: 53 },
  { day: 'Day 90', patients: 56, revenue: 20160, utilization: 89, target_patients: 58 },
];

const KPI_MILESTONES = [
  {
    phase: 'Day 1–30',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'text-blue-800',
    kpis: [
      { label: 'New patients', target: '35+', actual: 34, unit: 'patients', pct: 97 },
      { label: 'Daily visits', target: '15+', actual: 12, unit: 'visits/day', pct: 80 },
      { label: 'Utilization', target: '60%+', actual: 74, unit: '%', pct: 123 },
      { label: 'Patient satisfaction', target: '4.5+', actual: 4.7, unit: '/ 5.0', pct: 104 },
      { label: 'Revenue', target: '$10K+', actual: 11.6, unit: 'K', pct: 116 },
    ],
  },
  {
    phase: 'Day 31–60',
    color: 'bg-teal-50 border-teal-200',
    headerColor: 'text-teal-800',
    kpis: [
      { label: 'Active caseload', target: '80+', actual: 78, unit: 'patients', pct: 97 },
      { label: 'Daily visits', target: '25+', actual: 24, unit: 'visits/day', pct: 96 },
      { label: 'Utilization', target: '75%+', actual: 84, unit: '%', pct: 112 },
      { label: 'Google reviews', target: '10+', actual: 14, unit: 'reviews', pct: 140 },
      { label: 'Revenue', target: '$16K+', actual: 16.5, unit: 'K', pct: 103 },
    ],
  },
  {
    phase: 'Day 61–90',
    color: 'bg-green-50 border-green-200',
    headerColor: 'text-green-800',
    kpis: [
      { label: 'Active caseload', target: '120+', actual: 112, unit: 'patients', pct: 93 },
      { label: 'Daily visits', target: '35+', actual: 33, unit: 'visits/day', pct: 94 },
      { label: 'Utilization', target: '85%+', actual: 89, unit: '%', pct: 105 },
      { label: 'Staff efficiency', target: '90%+', actual: 88, unit: '%', pct: 98 },
      { label: 'Revenue', target: '$20K+', actual: 20.2, unit: 'K', pct: 101 },
    ],
  },
];

const WEEKLY_BREAKDOWN = [
  { week: 'W1', new: 7, returning: 3, revenue: 3200 },
  { week: 'W2', new: 9, returning: 8, revenue: 5800 },
  { week: 'W3', new: 8, returning: 14, revenue: 7200 },
  { week: 'W4', new: 10, returning: 18, revenue: 9100 },
  { week: 'W5', new: 7, returning: 22, revenue: 9800 },
  { week: 'W6', new: 9, returning: 25, revenue: 11200 },
  { week: 'W7', new: 8, returning: 28, revenue: 12000 },
  { week: 'W8', new: 7, returning: 30, revenue: 12500 },
  { week: 'W9', new: 6, returning: 32, revenue: 13100 },
  { week: 'W10', new: 8, returning: 34, revenue: 14200 },
  { week: 'W11', new: 7, returning: 36, revenue: 14800 },
  { week: 'W12', new: 9, returning: 38, revenue: 15900 },
  { week: 'W13', new: 6, returning: 40, revenue: 16500 },
];

const STABILIZATION_ALERTS = [
  { type: 'success', message: 'Day 90 utilization target (85%) exceeded — 89%' },
  { type: 'success', message: 'Patient satisfaction score 4.7/5.0 — above benchmark' },
  { type: 'warning', message: 'Active caseload 112 vs 120 target — 93% of goal' },
  { type: 'warning', message: 'Staff efficiency at 88% — approaching 90% target' },
];

export default function NewClinicPerformanceDashboard() {
  const [selectedClinic, setSelectedClinic] = useState(CLINICS[0]);
  const [activeChart, setActiveChart] = useState<'ramp' | 'weekly'>('ramp');

  const day90 = DAY_90_DATA[DAY_90_DATA.length - 1];
  const stabilized = day90.utilization >= 85;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Post-Launch Performance</h2>
          <p className="text-gray-600 mt-1">90-day stabilization KPIs and ramp-up monitoring</p>
        </div>
        <select
          value={selectedClinic}
          onChange={e => setSelectedClinic(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          {CLINICS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className={`rounded-xl border-2 p-5 flex items-center justify-between ${stabilized ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${stabilized ? 'bg-green-100' : 'bg-amber-100'}`}>
            {stabilized ? <CheckCircle className="h-7 w-7 text-green-600" /> : <AlertTriangle className="h-7 w-7 text-amber-600" />}
          </div>
          <div>
            <div className={`text-lg font-bold ${stabilized ? 'text-green-800' : 'text-amber-800'}`}>
              {stabilized ? 'Clinic Stabilized — 90-Day Ramp Complete' : 'Stabilization In Progress'}
            </div>
            <div className="text-sm text-gray-600">{selectedClinic} · Day 90 Utilization: {day90.utilization}% · Target: 85%</div>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{day90.patients}</div>
            <div className="text-xs text-gray-500">Active Patients</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">${(day90.revenue / 1000).toFixed(0)}K</div>
            <div className="text-xs text-gray-500">Day 90 Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{day90.utilization}%</div>
            <div className="text-xs text-gray-500">Utilization</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients (Day 90)', value: day90.patients, icon: <Users className="h-5 w-5 text-blue-400" />, color: 'text-blue-700' },
          { label: 'Monthly Revenue Run Rate', value: `$${(day90.revenue * 1.5 / 1000).toFixed(0)}K`, icon: <DollarSign className="h-5 w-5 text-green-400" />, color: 'text-green-700' },
          { label: 'Utilization', value: `${day90.utilization}%`, icon: <TrendingUp className="h-5 w-5 text-teal-400" />, color: 'text-teal-700' },
          { label: 'Patient Satisfaction', value: '4.7 / 5.0', icon: <Star className="h-5 w-5 text-amber-400" />, color: 'text-amber-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">{s.icon}<span className={`text-xl font-bold ${s.color}`}>{s.value}</span></div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-5">
          <h3 className="font-semibold text-gray-900">Ramp-Up Charts</h3>
          <div className="flex gap-2">
            {(['ramp', 'weekly'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveChart(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeChart === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {t === 'ramp' ? 'Ramp Curve' : 'Weekly Breakdown'}
              </button>
            ))}
          </div>
        </div>

        {activeChart === 'ramp' && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={DAY_90_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="patients" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="Active Patients" />
              <Line yAxisId="left" type="monotone" dataKey="target_patients" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Target Patients" />
              <Line yAxisId="right" type="monotone" dataKey="utilization" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} name="Utilization %" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'weekly' && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={WEEKLY_BREAKDOWN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="new" name="New Patients" fill="#2563eb" radius={[2, 2, 0, 0]} />
              <Bar dataKey="returning" name="Returning Patients" fill="#0d9488" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Stabilization KPI Scorecard</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {KPI_MILESTONES.map(phase => (
            <div key={phase.phase} className={`border rounded-lg p-4 ${phase.color}`}>
              <div className={`font-semibold text-sm mb-3 ${phase.headerColor}`}>{phase.phase}</div>
              <div className="space-y-3">
                {phase.kpis.map(kpi => (
                  <div key={kpi.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{kpi.label}</span>
                      <span className={`font-semibold ${kpi.pct >= 100 ? 'text-green-700' : kpi.pct >= 90 ? 'text-amber-700' : 'text-red-700'}`}>
                        {kpi.actual}{kpi.unit} / {kpi.target}
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${kpi.pct >= 100 ? 'bg-green-500' : kpi.pct >= 90 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(kpi.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Stabilization Alerts</h3>
        <div className="space-y-2">
          {STABILIZATION_ALERTS.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${alert.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              {alert.type === 'success'
                ? <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                : <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />}
              <span className={`text-sm ${alert.type === 'success' ? 'text-green-800' : 'text-amber-800'}`}>{alert.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
