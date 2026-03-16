import { CreditCard, RefreshCw, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock } from 'lucide-react';
import type { PatientBillingSummary } from '../../services/patientExperienceService';

interface PatientBillingViewProps {
  summaries: PatientBillingSummary[];
  loading: boolean;
  onRefresh: () => void;
}

const PAYMENT_STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  outstanding: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
  partial: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  pending: { bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock },
};

export default function PatientBillingView({ summaries, loading, onRefresh }: PatientBillingViewProps) {
  const totalOutstanding = summaries.reduce((sum, s) => sum + (s.amount_outstanding ?? 0), 0);
  const totalBilled = summaries.reduce((sum, s) => sum + (s.amount_billed ?? 0), 0);
  const totalPaid = summaries.reduce((sum, s) => sum + (s.amount_paid ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Billing</h2>
        <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-gray-700">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary cards */}
      {summaries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-3 py-3 text-center">
            <p className="text-lg font-bold text-gray-900">${totalBilled.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total billed</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-3 py-3 text-center">
            <p className="text-lg font-bold text-green-600">${totalPaid.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Paid</p>
          </div>
          <div className={`rounded-2xl border shadow-sm px-3 py-3 text-center ${totalOutstanding > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-lg font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-gray-900'}`}>${totalOutstanding.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Outstanding</p>
          </div>
        </div>
      )}

      {/* Outstanding alert */}
      {totalOutstanding > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Payment Due</p>
            <p className="text-sm text-red-700 mt-0.5">You have ${totalOutstanding.toFixed(2)} outstanding. Please contact your clinic to arrange payment.</p>
          </div>
        </div>
      )}

      {/* Invoice list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : summaries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No billing records found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map(s => {
            const style = PAYMENT_STATUS_STYLES[s.payment_status] ?? PAYMENT_STATUS_STYLES.pending;
            const StatusIcon = style.icon;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{s.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(s.invoice_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${style.bg} ${style.text}`}>
                    <StatusIcon className="w-3 h-3" />
                    {s.payment_status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                    <p className="text-gray-500">Billed</p>
                    <p className="font-semibold text-gray-900">${s.amount_billed?.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                    <p className="text-gray-500">Paid</p>
                    <p className="font-semibold text-green-700">${s.amount_paid?.toFixed(2)}</p>
                  </div>
                  <div className={`rounded-lg px-2 py-1.5 ${s.amount_outstanding > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className="text-gray-500">Balance</p>
                    <p className={`font-semibold ${s.amount_outstanding > 0 ? 'text-red-600' : 'text-gray-900'}`}>${s.amount_outstanding?.toFixed(2)}</p>
                  </div>
                </div>
                {s.insurance_status && s.insurance_status !== 'none' && (
                  <p className="text-xs text-gray-500 mt-2">Insurance: <span className="capitalize font-medium text-gray-700">{s.insurance_status}</span></p>
                )}
                {s.payment_due_date && s.amount_outstanding > 0 && (
                  <p className="text-xs text-red-600 mt-1">Due: {new Date(s.payment_due_date).toLocaleDateString()}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
