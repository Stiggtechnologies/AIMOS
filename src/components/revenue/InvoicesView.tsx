import { useState, useEffect } from 'react';
import { Receipt, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Search, Plus, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Invoice {
  id: string;
  invoice_number: string;
  patient_name: string;
  clinic_name: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: string;
}

const DEMO_INVOICES: Invoice[] = [
  { id: '1', invoice_number: 'INV-2026-01142', patient_name: 'Chris A.', clinic_name: 'South Commons', invoice_date: '2026-03-12', due_date: '2026-03-26', total_amount: 120, amount_paid: 120, balance_due: 0, status: 'paid' },
  { id: '2', invoice_number: 'INV-2026-01141', patient_name: 'Laura B.', clinic_name: 'Beltline', invoice_date: '2026-03-11', due_date: '2026-03-25', total_amount: 95, amount_paid: 0, balance_due: 95, status: 'sent' },
  { id: '3', invoice_number: 'INV-2026-01140', patient_name: 'Kevin D.', clinic_name: 'West End', invoice_date: '2026-03-10', due_date: '2026-03-24', total_amount: 150, amount_paid: 75, balance_due: 75, status: 'partial' },
  { id: '4', invoice_number: 'INV-2026-01139', patient_name: 'Nina F.', clinic_name: 'Chinook', invoice_date: '2026-03-05', due_date: '2026-03-19', total_amount: 85, amount_paid: 0, balance_due: 85, status: 'overdue' },
  { id: '5', invoice_number: 'INV-2026-01138', patient_name: 'Mark G.', clinic_name: 'North Gate', invoice_date: '2026-03-08', due_date: '2026-03-22', total_amount: 200, amount_paid: 0, balance_due: 200, status: 'draft' },
  { id: '6', invoice_number: 'INV-2026-01137', patient_name: 'Jenny H.', clinic_name: 'NW Calgary', invoice_date: '2026-03-07', due_date: '2026-03-21', total_amount: 110, amount_paid: 110, balance_due: 0, status: 'paid' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-500', bg: 'bg-gray-100' },
  sent: { label: 'Sent', color: 'text-blue-600', bg: 'bg-blue-50' },
  paid: { label: 'Paid', color: 'text-green-600', bg: 'bg-green-50' },
  overdue: { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-50' },
  partial: { label: 'Partial', color: 'text-amber-600', bg: 'bg-amber-50' },
  voided: { label: 'Voided', color: 'text-gray-400', bg: 'bg-gray-50' },
};

export default function InvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          invoice_date,
          due_date,
          total_amount,
          amount_paid,
          balance_due,
          status,
          clinics:clinic_id ( name ),
          patients:patient_id ( first_name, last_name )
        `)
        .order('invoice_date', { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        setInvoices(DEMO_INVOICES);
      } else {
        setInvoices(data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          invoice_number: (row.invoice_number as string) || '—',
          patient_name: row.patients
            ? `${(row.patients as Record<string, string>).first_name} ${(row.patients as Record<string, string>).last_name}`
            : 'Unknown',
          clinic_name: row.clinics ? (row.clinics as Record<string, string>).name : '—',
          invoice_date: row.invoice_date as string,
          due_date: row.due_date as string,
          total_amount: Number(row.total_amount) || 0,
          amount_paid: Number(row.amount_paid) || 0,
          balance_due: Number(row.balance_due) || 0,
          status: (row.status as string) || 'draft',
        })));
      }
    } catch {
      setInvoices(DEMO_INVOICES);
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (search && !i.patient_name.toLowerCase().includes(search.toLowerCase()) && !i.invoice_number.includes(search)) return false;
    return true;
  });

  const outstanding = invoices.filter(i => i.status !== 'paid' && i.status !== 'voided').reduce((s, i) => s + i.balance_due, 0);
  const collected = invoices.reduce((s, i) => s + i.amount_paid, 0);
  const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.balance_due, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Patient invoices, collections, and payment status</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadInvoices}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="h-4 w-4" />
            New Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Collected', value: `$${collected.toLocaleString()}`, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, icon: Clock, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Overdue', value: `$${overdue.toLocaleString()}`, icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
            <Icon className={`h-4 w-4 ${color} mb-2`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient or invoice number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['all', 'draft', 'sent', 'paid', 'overdue', 'partial'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg capitalize border transition-colors ${
                statusFilter === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex flex-col items-center gap-3 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm">Loading invoices...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Clinic</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Due Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Paid</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <Receipt className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="font-medium text-gray-500">No invoices found</p>
                    <p className="text-xs mt-1">Adjust filters or create a new invoice</p>
                  </td>
                </tr>
              ) : filtered.map(inv => {
                const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.patient_name}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.clinic_name}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.invoice_date}</td>
                    <td className={`px-4 py-3 ${inv.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {inv.due_date}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">${inv.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600">${inv.amount_paid.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-medium ${inv.balance_due > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      ${inv.balance_due.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
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
