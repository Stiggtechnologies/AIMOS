import { useState, useEffect } from 'react';
import { FileText, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, Search, RefreshCw, DollarSign, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Claim {
  id: string;
  claim_number: string;
  patient_name: string;
  payer_name: string;
  clinic_name: string;
  service_date: string;
  billed_amount: number;
  paid_amount: number;
  status: string;
}

const DEMO_CLAIMS: Claim[] = [
  { id: '1', claim_number: 'CLM-2026-04821', patient_name: 'Sarah M.', payer_name: 'Alberta Blue Cross', clinic_name: 'South Commons', service_date: '2026-03-12', billed_amount: 285, paid_amount: 0, status: 'submitted' },
  { id: '2', claim_number: 'CLM-2026-04820', patient_name: 'James T.', payer_name: 'Sun Life Financial', clinic_name: 'Beltline', service_date: '2026-03-12', billed_amount: 195, paid_amount: 195, status: 'approved' },
  { id: '3', claim_number: 'CLM-2026-04819', patient_name: 'Maria L.', payer_name: 'Manulife', clinic_name: 'West End', service_date: '2026-03-11', billed_amount: 320, paid_amount: 0, status: 'denied' },
  { id: '4', claim_number: 'CLM-2026-04818', patient_name: 'Robert K.', payer_name: 'Great-West Life', clinic_name: 'South Commons', service_date: '2026-03-11', billed_amount: 240, paid_amount: 0, status: 'pending' },
  { id: '5', claim_number: 'CLM-2026-04817', patient_name: 'Anna P.', payer_name: 'Alberta Blue Cross', clinic_name: 'Chinook', service_date: '2026-03-10', billed_amount: 160, paid_amount: 80, status: 'partial' },
  { id: '6', claim_number: 'CLM-2026-04816', patient_name: 'David W.', payer_name: 'Canada Life', clinic_name: 'North Gate', service_date: '2026-03-10', billed_amount: 390, paid_amount: 390, status: 'approved' },
  { id: '7', claim_number: 'CLM-2026-04815', patient_name: 'Emily R.', payer_name: 'Desjardins', clinic_name: 'NW Calgary', service_date: '2026-03-09', billed_amount: 275, paid_amount: 0, status: 'submitted' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  submitted: { label: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-50', icon: FileText },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  denied: { label: 'Denied', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
  partial: { label: 'Partial', color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
};

export default function ClaimsView() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('claims')
        .select(`
          id,
          claim_number,
          service_date,
          billed_amount,
          paid_amount,
          status,
          clinics:clinic_id ( name ),
          patients:patient_id ( first_name, last_name ),
          patient_insurance:patient_insurance_id ( insurance_company )
        `)
        .order('service_date', { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        setClaims(DEMO_CLAIMS);
      } else {
        setClaims(data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          claim_number: (row.claim_number as string) || '—',
          patient_name: row.patients
            ? `${(row.patients as Record<string, string>).first_name} ${(row.patients as Record<string, string>).last_name}`
            : 'Unknown',
          payer_name: row.patient_insurance
            ? (row.patient_insurance as Record<string, string>).insurance_company
            : 'Direct Pay',
          clinic_name: row.clinics ? (row.clinics as Record<string, string>).name : '—',
          service_date: row.service_date as string,
          billed_amount: Number(row.billed_amount) || 0,
          paid_amount: Number(row.paid_amount) || 0,
          status: (row.status as string) || 'pending',
        })));
      }
    } catch {
      setClaims(DEMO_CLAIMS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = claims.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.patient_name.toLowerCase().includes(search.toLowerCase()) && !c.claim_number.includes(search)) return false;
    return true;
  });

  const totals = {
    total: claims.reduce((s, c) => s + c.billed_amount, 0),
    approved: claims.filter(c => c.status === 'approved').reduce((s, c) => s + c.billed_amount, 0),
    pending: claims.filter(c => ['pending', 'submitted'].includes(c.status)).reduce((s, c) => s + c.billed_amount, 0),
    denied: claims.filter(c => c.status === 'denied').reduce((s, c) => s + c.billed_amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claims</h1>
          <p className="text-sm text-gray-500 mt-0.5">Insurance claims submission and tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadClaims}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="h-4 w-4" />
            New Claim
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Billed', value: `$${totals.total.toLocaleString()}`, color: 'text-gray-900', bg: 'bg-gray-50', border: 'border-gray-200' },
          { label: 'Approved', value: `$${totals.approved.toLocaleString()}`, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Pending / In-Flight', value: `$${totals.pending.toLocaleString()}`, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Denied', value: `$${totals.denied.toLocaleString()}`, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
            <DollarSign className="h-4 w-4 text-gray-400 mb-2" />
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
            placeholder="Search by patient or claim number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'pending', 'submitted', 'approved', 'denied', 'partial'] as const).map(s => (
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
            <p className="text-sm">Loading claims...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Claim #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Payer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Clinic</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Service Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Billed</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Paid</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                    <p className="font-medium text-gray-500">No claims found</p>
                    <p className="text-xs mt-1">Adjust filters or submit a new claim</p>
                  </td>
                </tr>
              ) : filtered.map(claim => {
                const cfg = STATUS_CONFIG[claim.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <tr key={claim.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{claim.claim_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{claim.patient_name}</td>
                    <td className="px-4 py-3 text-gray-600">{claim.payer_name}</td>
                    <td className="px-4 py-3 text-gray-600">{claim.clinic_name}</td>
                    <td className="px-4 py-3 text-gray-600">{claim.service_date}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">${claim.billed_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-green-600">${claim.paid_amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <StatusIcon className="h-3 w-3" />
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
