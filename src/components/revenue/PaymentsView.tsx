import { useState, useEffect } from 'react';
import { CreditCard, CircleCheck as CheckCircle, RefreshCw, Search, TrendingUp, DollarSign, ArrowDownLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

interface Payment {
  id: string;
  patient: string;
  method: string;
  amount: number;
  date: string;
  clinic: string;
  type: string;
  status: string;
}

interface WeeklyPoint {
  day: string;
  amount: number;
}

const DEMO_PAYMENTS: Payment[] = [
  { id: '1', patient: 'Anna K.', method: 'Visa', amount: 120, date: '2026-03-14', clinic: 'South Commons', type: 'copay', status: 'success' },
  { id: '2', patient: 'Brian T.', method: 'Interac', amount: 95, date: '2026-03-14', clinic: 'Beltline', type: 'self-pay', status: 'success' },
  { id: '3', patient: 'Clara M.', method: 'Mastercard', amount: 200, date: '2026-03-14', clinic: 'West End', type: 'copay', status: 'success' },
  { id: '4', patient: 'Dennis L.', method: 'Visa', amount: 75, date: '2026-03-13', clinic: 'Chinook', type: 'copay', status: 'success' },
  { id: '5', patient: 'Emma S.', method: 'Interac', amount: 150, date: '2026-03-13', clinic: 'North Gate', type: 'self-pay', status: 'refunded' },
  { id: '6', patient: 'Frank O.', method: 'Cash', amount: 60, date: '2026-03-12', clinic: 'NW Calgary', type: 'copay', status: 'success' },
];

const DEMO_WEEKLY: WeeklyPoint[] = [
  { day: 'Mon', amount: 3820 },
  { day: 'Tue', amount: 4210 },
  { day: 'Wed', amount: 3950 },
  { day: 'Thu', amount: 4680 },
  { day: 'Fri', amount: 5120 },
  { day: 'Sat', amount: 2340 },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  success: { label: 'Success', color: 'bg-green-50 text-green-700' },
  refunded: { label: 'Refunded', color: 'bg-amber-50 text-amber-700' },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-700' },
  pending: { label: 'Pending', color: 'bg-blue-50 text-blue-700' },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>(DEMO_WEEKLY);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadPayments(); }, []);

  async function loadPayments() {
    setLoading(true);
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const { data, error } = await supabase
        .from('payments')
        .select(`
          id, amount, payment_method, payment_type, status, payment_date,
          clinics:clinic_id ( name ),
          patients:patient_id ( first_name, last_name )
        `)
        .gte('payment_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('payment_date', { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        setPayments(DEMO_PAYMENTS);
        setWeeklyData(DEMO_WEEKLY);
      } else {
        const mapped: Payment[] = data.map((r: Record<string, unknown>) => {
          const pt = r.patients as Record<string, string> | null;
          const cl = r.clinics as Record<string, string> | null;
          return {
            id: r.id as string,
            patient: pt ? `${pt.first_name} ${pt.last_name[0]}.` : 'Unknown',
            method: (r.payment_method as string) || 'Unknown',
            amount: Number(r.amount) || 0,
            date: (r.payment_date as string) || '',
            clinic: cl ? cl.name : '—',
            type: (r.payment_type as string) || 'payment',
            status: (r.status as string) || 'success',
          };
        });
        setPayments(mapped);

        const dayMap = new Map<string, number>();
        DAY_LABELS.forEach(d => dayMap.set(d, 0));
        mapped.forEach(p => {
          if (p.status === 'success') {
            const d = new Date(p.date);
            const dayLabel = DAY_LABELS[d.getDay()];
            dayMap.set(dayLabel, (dayMap.get(dayLabel) || 0) + p.amount);
          }
        });
        setWeeklyData(DAY_LABELS.map(d => ({ day: d, amount: dayMap.get(d) || 0 })));
      }
    } catch {
      setPayments(DEMO_PAYMENTS);
      setWeeklyData(DEMO_WEEKLY);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const filtered = payments.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.patient.toLowerCase().includes(search.toLowerCase()) && !p.clinic.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const todayTotal = payments.filter(p => p.date === today && p.status === 'success').reduce((s, p) => s + p.amount, 0);
  const weekTotal = payments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0);
  const todayCount = payments.filter(p => p.date === today && p.status === 'success').length;
  const refundTotal = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Patient payments, copays, and collections</p>
        </div>
        <button
          onClick={loadPayments}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Collections", value: `$${todayTotal.toLocaleString()}`, icon: DollarSign, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: '7-Day Total', value: `$${weekTotal.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: "Today's Transactions", value: String(todayCount), icon: CheckCircle, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
          { label: 'Refunds (7d)', value: `$${refundTotal.toLocaleString()}`, icon: ArrowDownLeft, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
            <Icon className={`h-4 w-4 ${color} mb-2`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Payment Volume — Last 7 Days</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
            <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Collected']} />
            <Bar dataKey="amount" fill="#10b981" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {['all', 'success', 'refunded', 'pending'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 text-xs rounded-lg capitalize border transition-colors ${
                    statusFilter === s
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex flex-col items-center gap-3 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm">Loading payments...</p>
          </div>
        ) : (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <CreditCard className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="font-medium text-gray-500">No payments found</p>
                    <p className="text-xs mt-1">Adjust your filters to see more results</p>
                  </td>
                </tr>
              ) : filtered.map(p => {
                const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.success;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.patient}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                        {p.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{p.type}</td>
                    <td className="px-4 py-3 text-gray-600">{p.clinic}</td>
                    <td className="px-4 py-3 text-gray-600">{p.date}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">${p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
