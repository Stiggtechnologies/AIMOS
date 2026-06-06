import { useState } from 'react';
import { UserPlus, TrendingUp, Phone, Globe, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const MONTHLY_DATA = [
  { month: 'Sep', new_patients: 142, leads: 210, conversion: 67.6 },
  { month: 'Oct', new_patients: 158, leads: 228, conversion: 69.3 },
  { month: 'Nov', new_patients: 147, leads: 215, conversion: 68.4 },
  { month: 'Dec', new_patients: 131, leads: 198, conversion: 66.2 },
  { month: 'Jan', new_patients: 162, leads: 234, conversion: 69.2 },
  { month: 'Feb', new_patients: 178, leads: 251, conversion: 70.9 },
  { month: 'Mar', new_patients: 191, leads: 268, conversion: 71.3 },
];

const CHANNELS = [
  { name: 'Physician Referral', patients: 68, share: 35.6, trend: +4.2, color: 'bg-blue-500' },
  { name: 'Google / SEO', patients: 42, share: 22.0, trend: +8.1, color: 'bg-emerald-500' },
  { name: 'Trainer Referral', patients: 28, share: 14.7, trend: +2.3, color: 'bg-teal-500' },
  { name: 'Employer Program', patients: 22, share: 11.5, trend: +12.4, color: 'bg-amber-500' },
  { name: 'Google Ads', patients: 18, share: 9.4, trend: -1.2, color: 'bg-rose-500' },
  { name: 'Walk-in', patients: 13, share: 6.8, trend: -3.1, color: 'bg-gray-400' },
];

export default function AcquisitionView() {
  const [period, setPeriod] = useState<'30d' | '90d' | '12m'>('90d');

  const total = CHANNELS.reduce((s, c) => s + c.patients, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Acquisition</h1>
          <p className="text-sm text-gray-500 mt-1">New patient volume, channel mix, and conversion trends</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(['30d', '90d', '12m'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm ${period === p ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'New Patients (Mar)', value: '191', delta: '+7.3%', up: true, icon: UserPlus },
          { label: 'Lead Volume', value: '268', delta: '+6.8%', up: true, icon: Phone },
          { label: 'Conversion Rate', value: '71.3%', delta: '+0.4pp', up: true, icon: TrendingUp },
          { label: 'Cost per New Patient', value: '$42', delta: '-3.1%', up: true, icon: Globe },
        ].map(({ label, value, delta, up, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <Icon className="h-5 w-5 text-gray-400" />
              <span className={`text-xs flex items-center gap-0.5 ${up ? 'text-green-600' : 'text-red-500'}`}>
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{delta}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">New Patient Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="new_patients" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Conversion Rate Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[60, 75]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}%`, 'Conversion']} />
              <Line type="monotone" dataKey="conversion" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Acquisition Channels — March 2026</h3>
        <div className="space-y-3">
          {CHANNELS.map(ch => (
            <div key={ch.name} className="flex items-center gap-3">
              <div className="w-36 text-sm text-gray-700 truncate">{ch.name}</div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${ch.color} rounded-full`} style={{ width: `${ch.share}%` }} />
              </div>
              <div className="w-10 text-sm font-medium text-right text-gray-900">{ch.patients}</div>
              <div className="w-14 text-xs text-right text-gray-500">{ch.share}%</div>
              <div className={`w-12 text-xs text-right flex items-center justify-end gap-0.5 ${ch.trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {ch.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(ch.trend)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
