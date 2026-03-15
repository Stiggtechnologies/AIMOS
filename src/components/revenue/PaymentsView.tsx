import { useState } from 'react';
import { CreditCard, CircleCheck as CheckCircle, RefreshCw, Search, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WEEKLY_DATA = [
  { day: 'Mon', amount: 3820 },
  { day: 'Tue', amount: 4210 },
  { day: 'Wed', amount: 3950 },
  { day: 'Thu', amount: 4680 },
  { day: 'Fri', amount: 5120 },
  { day: 'Sat', amount: 2340 },
];

const PAYMENTS = [
  { id: '1', patient: 'Anna K.', method: 'Visa', amount: 120, date: '2026-03-14', clinic: 'South Commons', type: 'copay', status: 'success' },
  { id: '2', patient: 'Brian T.', method: 'Interac', amount: 95, date: '2026-03-14', clinic: 'Beltline', type: 'self-pay', status: 'success' },
  { id: '3', patient: 'Clara M.', method: 'Mastercard', amount: 200, date: '2026-03-14', clinic: 'West End', type: 'copay', status: 'success' },
  { id: '4', patient: 'Dennis L.', method: 'Visa', amount: 75, date: '2026-03-13', clinic: 'Chinook', type: 'copay', status: 'success' },
  { id: '5', patient: 'Emma S.', method: 'Interac', amount: 150, date: '2026-03-13', clinic: 'North Gate', type: 'self-pay', status: 'refunded' },
  { id: '6', patient: 'Frank O.', method: 'Cash', amount: 60, date: '2026-03-12', clinic: 'NW Calgary', type: 'copay', status: 'success' },
];

export default function PaymentsView() {
  const [search, setSearch] = useState('');

  const todayTotal = PAYMENTS.filter(p => p.date === '2026-03-14' && p.status === 'success').reduce((s, p) => s + p.amount, 0);
  const weekTotal = WEEKLY_DATA.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Patient payments, copays, and collections</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <DollarSign className="h-5 w-5 text-gray-400 mb-2" />
          <p className="text-2xl font-bold text-green-600">${todayTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Today's Collections</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TrendingUp className="h-5 w-5 text-gray-400 mb-2" />
          <p className="text-2xl font-bold text-blue-600">${weekTotal.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">This Week</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <CheckCircle className="h-5 w-5 text-gray-400 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{PAYMENTS.filter(p => p.status === 'success').length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Transactions Today</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Weekly Payment Volume</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={WEEKLY_DATA} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
            <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Collected']} />
            <Bar dataKey="amount" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Method</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Clinic</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {PAYMENTS.filter(p => !search || p.patient.toLowerCase().includes(search.toLowerCase())).map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.patient}</td>
                <td className="px-4 py-3 text-gray-600 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-gray-400" />{p.method}
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{p.type}</td>
                <td className="px-4 py-3 text-gray-600">{p.clinic}</td>
                <td className="px-4 py-3 text-gray-600">{p.date}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">${p.amount}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
