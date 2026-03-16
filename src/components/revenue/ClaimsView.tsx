import { useState } from 'react';
import { FileText, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Search, Filter, RefreshCw, DollarSign } from 'lucide-react';

interface Claim {
  id: string;
  claim_number: string;
  patient: string;
  payer: string;
  service_date: string;
  amount: number;
  status: 'pending' | 'submitted' | 'approved' | 'denied' | 'partial';
  clinic: string;
}

const CLAIMS: Claim[] = [
  { id: '1', claim_number: 'CLM-2026-04821', patient: 'Sarah M.', payer: 'Alberta Blue Cross', service_date: '2026-03-12', amount: 285, status: 'submitted', clinic: 'South Commons' },
  { id: '2', claim_number: 'CLM-2026-04820', patient: 'James T.', payer: 'Sun Life Financial', service_date: '2026-03-12', amount: 195, status: 'approved', clinic: 'Beltline' },
  { id: '3', claim_number: 'CLM-2026-04819', patient: 'Maria L.', payer: 'Manulife', service_date: '2026-03-11', amount: 320, status: 'denied', clinic: 'West End' },
  { id: '4', claim_number: 'CLM-2026-04818', patient: 'Robert K.', payer: 'Great-West Life', service_date: '2026-03-11', amount: 240, status: 'pending', clinic: 'South Commons' },
  { id: '5', claim_number: 'CLM-2026-04817', patient: 'Anna P.', payer: 'Alberta Blue Cross', service_date: '2026-03-10', amount: 160, status: 'partial', clinic: 'Chinook' },
  { id: '6', claim_number: 'CLM-2026-04816', patient: 'David W.', payer: 'Canada Life', service_date: '2026-03-10', amount: 390, status: 'approved', clinic: 'North Gate' },
  { id: '7', claim_number: 'CLM-2026-04815', patient: 'Emily R.', payer: 'Desjardins', service_date: '2026-03-09', amount: 275, status: 'submitted', clinic: 'NW Calgary' },
];

const statusConfig = {
  pending: { label: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  submitted: { label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-50', icon: FileText },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  denied: { label: 'Denied', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
  partial: { label: 'Partial', color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
};

export default function ClaimsView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = CLAIMS.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.patient.toLowerCase().includes(search.toLowerCase()) && !c.claim_number.includes(search)) return false;
    return true;
  });

  const totals = {
    total: CLAIMS.reduce((s, c) => s + c.amount, 0),
    approved: CLAIMS.filter(c => c.status === 'approved').reduce((s, c) => s + c.amount, 0),
    pending: CLAIMS.filter(c => ['pending', 'submitted'].includes(c.status)).reduce((s, c) => s + c.amount, 0),
    denied: CLAIMS.filter(c => c.status === 'denied').reduce((s, c) => s + c.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claims</h1>
          <p className="text-sm text-gray-500 mt-1">Insurance claims submission and tracking</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <FileText className="h-4 w-4" />
          <span>New Claim</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Billed', value: `$${totals.total.toLocaleString()}`, color: 'gray' },
          { label: 'Approved', value: `$${totals.approved.toLocaleString()}`, color: 'green' },
          { label: 'Pending / In Flight', value: `$${totals.pending.toLocaleString()}`, color: 'blue' },
          { label: 'Denied', value: `$${totals.denied.toLocaleString()}`, color: 'red' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search by patient or claim number..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {(['all', 'pending', 'submitted', 'approved', 'denied', 'partial'] as const).map(s => (
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
              <th className="text-left px-4 py-3 font-medium text-gray-500">Claim #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Payer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Clinic</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Service Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(claim => {
              const cfg = statusConfig[claim.status];
              const StatusIcon = cfg.icon;
              return (
                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{claim.claim_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{claim.patient}</td>
                  <td className="px-4 py-3 text-gray-600">{claim.payer}</td>
                  <td className="px-4 py-3 text-gray-600">{claim.clinic}</td>
                  <td className="px-4 py-3 text-gray-600">{claim.service_date}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">${claim.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />{cfg.label}
                    </span>
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
