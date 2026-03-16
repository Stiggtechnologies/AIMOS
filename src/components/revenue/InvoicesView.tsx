import { useState } from 'react';
import { Receipt, Send, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Search, Plus, DollarSign, Clock } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  patient: string;
  service_date: string;
  amount: number;
  paid: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'partial';
  due_date: string;
  clinic: string;
}

const INVOICES: Invoice[] = [
  { id: '1', invoice_number: 'INV-2026-01142', patient: 'Chris A.', service_date: '2026-03-12', amount: 120, paid: 120, status: 'paid', due_date: '2026-03-26', clinic: 'South Commons' },
  { id: '2', invoice_number: 'INV-2026-01141', patient: 'Laura B.', service_date: '2026-03-11', amount: 95, paid: 0, status: 'sent', due_date: '2026-03-25', clinic: 'Beltline' },
  { id: '3', invoice_number: 'INV-2026-01140', patient: 'Kevin D.', service_date: '2026-03-10', amount: 150, paid: 75, status: 'partial', due_date: '2026-03-24', clinic: 'West End' },
  { id: '4', invoice_number: 'INV-2026-01139', patient: 'Nina F.', service_date: '2026-03-05', amount: 85, paid: 0, status: 'overdue', due_date: '2026-03-19', clinic: 'Chinook' },
  { id: '5', invoice_number: 'INV-2026-01138', patient: 'Mark G.', service_date: '2026-03-08', amount: 200, paid: 0, status: 'draft', due_date: '2026-03-22', clinic: 'North Gate' },
  { id: '6', invoice_number: 'INV-2026-01137', patient: 'Jenny H.', service_date: '2026-03-07', amount: 110, paid: 110, status: 'paid', due_date: '2026-03-21', clinic: 'NW Calgary' },
];

const statusConfig = {
  draft: { label: 'Draft', color: 'text-gray-500', bg: 'bg-gray-100' },
  sent: { label: 'Sent', color: 'text-blue-600', bg: 'bg-blue-50' },
  paid: { label: 'Paid', color: 'text-green-600', bg: 'bg-green-50' },
  overdue: { label: 'Overdue', color: 'text-red-600', bg: 'bg-red-50' },
  partial: { label: 'Partial', color: 'text-amber-600', bg: 'bg-amber-50' },
};

export default function InvoicesView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = INVOICES.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (search && !i.patient.toLowerCase().includes(search.toLowerCase()) && !i.invoice_number.includes(search)) return false;
    return true;
  });

  const outstanding = INVOICES.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount - i.paid), 0);
  const collected = INVOICES.reduce((s, i) => s + i.paid, 0);
  const overdue = INVOICES.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Patient invoices, collections, and payment status</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Plus className="h-4 w-4" />
          <span>New Invoice</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Collected', value: `$${collected.toLocaleString()}`, icon: CheckCircle, color: 'green' },
          { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, icon: Clock, color: 'blue' },
          { label: 'Overdue', value: `$${overdue.toLocaleString()}`, icon: AlertTriangle, color: 'red' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-5 w-5 text-${color}-500`} />
            </div>
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by patient or invoice number..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {['all', 'draft', 'sent', 'paid', 'overdue', 'partial'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg capitalize border transition-colors ${statusFilter === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Clinic</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Service Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Due Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Paid</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(inv => {
              const cfg = statusConfig[inv.status];
              return (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.patient}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.clinic}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.service_date}</td>
                  <td className={`px-4 py-3 ${inv.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{inv.due_date}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">${inv.amount}</td>
                  <td className="px-4 py-3 text-right text-green-600">${inv.paid}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
