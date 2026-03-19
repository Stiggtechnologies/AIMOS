import { useState, useEffect } from 'react';
import { DollarSign, FileText, Clock, TriangleAlert as AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, CircleCheck as CheckCircle, Circle as XCircle, RefreshCw, CreditCard, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RevenueCycleCommandCenterProps {
  onNavigate: (module: string, subModule: string) => void;
}

interface ClaimQueueItem {
  id: string;
  patientName: string;
  payer: string;
  amount: number;
  status: 'ready' | 'missing_data' | 'denied' | 'pending';
  slaHours: number;
  missingFields?: string[];
}

interface DenialInsight {
  reason: string;
  count: number;
  amount: number;
  trend: 'up' | 'down' | 'stable';
}

interface PayerPerformance {
  payer: string;
  claimsCount: number;
  avgDaysToPayment: number;
  denialRate: number;
  netCollectionRate: number;
}

const DEMO_KPIS = { claimsToSubmit: 42, claimsPending: 156, deniedClaims: 18, arDays: 38, arDaysTarget: 35, netCollectionRate: 94.2, cleanClaimRate: 87.5, paymentsPosted: 12450, unappliedPayments: 3, writeOffs: 1250 };
const DEMO_AR = { current: 125000, days30: 45000, days60: 22000, days90: 8500, days120plus: 4500 };
const DEMO_CLAIMS: ClaimQueueItem[] = [
  { id: '1', patientName: 'Sarah Johnson', payer: 'Alberta Blue Cross', amount: 285, status: 'ready', slaHours: 2 },
  { id: '2', patientName: 'Michael Chen', payer: 'WSIB', amount: 420, status: 'missing_data', slaHours: 4, missingFields: ['Diagnosis code', 'Auth number'] },
  { id: '3', patientName: 'Emma Wilson', payer: 'Manulife', amount: 195, status: 'ready', slaHours: 6 },
  { id: '4', patientName: 'James Anderson', payer: 'Sun Life', amount: 350, status: 'denied', slaHours: 0, missingFields: ['Prior auth required'] },
  { id: '5', patientName: 'Lisa Thompson', payer: 'Green Shield', amount: 225, status: 'ready', slaHours: 8 },
];
const DEMO_DENIALS: DenialInsight[] = [
  { reason: 'Missing prior authorization', count: 7, amount: 2450, trend: 'up' },
  { reason: 'Invalid diagnosis code', count: 5, amount: 1650, trend: 'stable' },
  { reason: 'Patient not covered', count: 4, amount: 980, trend: 'down' },
  { reason: 'Duplicate claim', count: 2, amount: 420, trend: 'stable' },
];
const DEMO_PAYERS: PayerPerformance[] = [
  { payer: 'Alberta Blue Cross', claimsCount: 245, avgDaysToPayment: 18, denialRate: 4.2, netCollectionRate: 96.5 },
  { payer: 'Manulife', claimsCount: 189, avgDaysToPayment: 22, denialRate: 6.1, netCollectionRate: 93.8 },
  { payer: 'Sun Life', claimsCount: 156, avgDaysToPayment: 25, denialRate: 8.3, netCollectionRate: 91.2 },
  { payer: 'Green Shield', claimsCount: 142, avgDaysToPayment: 20, denialRate: 5.5, netCollectionRate: 94.1 },
  { payer: 'WSIB', claimsCount: 98, avgDaysToPayment: 35, denialRate: 12.4, netCollectionRate: 88.5 },
];

export function RevenueCycleCommandCenter({ onNavigate }: RevenueCycleCommandCenterProps) {
  const [kpis, setKpis] = useState(DEMO_KPIS);
  const [arAging, setArAging] = useState(DEMO_AR);
  const [claimQueue, setClaimQueue] = useState<ClaimQueueItem[]>(DEMO_CLAIMS);
  const [denialInsights, setDenialInsights] = useState<DenialInsight[]>(DEMO_DENIALS);
  const [payerPerformance, setPayerPerformance] = useState<PayerPerformance[]>(DEMO_PAYERS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [claimsRes, arRes] = await Promise.all([
        supabase.from('claims').select('id, amount, status, payer_name, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('ar_aging_snapshots').select('bucket_current, bucket_30, bucket_60, bucket_90, bucket_120_plus').order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
      ]);

      let hasLive = false;

      if (claimsRes.data && claimsRes.data.length > 0) {
        const claims = claimsRes.data;
        setClaimQueue(claims.slice(0, 5).map((c: { id: string; amount: number; status: string; payer_name: string }) => ({
          id: c.id,
          patientName: 'Patient',
          payer: c.payer_name ?? 'Unknown',
          amount: c.amount ?? 0,
          status: (['ready', 'missing_data', 'denied', 'pending'] as const).includes(c.status as 'ready' | 'missing_data' | 'denied' | 'pending') ? (c.status as ClaimQueueItem['status']) : 'pending',
          slaHours: 4,
        })));
        const denied = claims.filter((c: { status: string }) => c.status === 'denied').length;
        const pending = claims.filter((c: { status: string }) => c.status === 'pending').length;
        setKpis(prev => ({ ...prev, deniedClaims: denied, claimsPending: pending }));
        hasLive = true;
      }

      if (arRes.data) {
        setArAging({
          current: arRes.data.bucket_current ?? DEMO_AR.current,
          days30: arRes.data.bucket_30 ?? DEMO_AR.days30,
          days60: arRes.data.bucket_60 ?? DEMO_AR.days60,
          days90: arRes.data.bucket_90 ?? DEMO_AR.days90,
          days120plus: arRes.data.bucket_120_plus ?? DEMO_AR.days120plus,
        });
        hasLive = true;
      }

      if (hasLive) setIsLive(true);
    } catch {
      // keep demo data
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getStatusColor = (status: ClaimQueueItem['status']) => {
    const colors = {
      ready: 'bg-emerald-100 text-emerald-700',
      missing_data: 'bg-amber-100 text-amber-700',
      denied: 'bg-red-100 text-red-700',
      pending: 'bg-blue-100 text-blue-700'
    };
    return colors[status];
  };

  const totalAR = arAging.current + arAging.days30 + arAging.days60 + arAging.days90 + arAging.days120plus;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Cycle Command Center</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">Claims, collections, and revenue performance</p>
            {isLive
              ? <span className="text-xs text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />Live</span>
              : <span className="text-xs text-gray-400">Demo data</span>
            }
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>All Clinics</option>
            <option>AIM South Commons</option>
            <option>AIM Windermere</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* KPI Strip - HFMA MAP Keys */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-5 w-5 opacity-80" />
            <span className="text-xs text-blue-100">Ready</span>
          </div>
          <div className="text-2xl font-bold">{kpis.claimsToSubmit}</div>
          <div className="text-xs text-blue-100 mt-0.5">Claims to Submit</div>
        </div>

        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 opacity-80" />
          </div>
          <div className="text-2xl font-bold">{kpis.claimsPending}</div>
          <div className="text-xs text-amber-100 mt-0.5">Claims Pending</div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-5 w-5 opacity-80" />
          </div>
          <div className="text-2xl font-bold">{kpis.deniedClaims}</div>
          <div className="text-xs text-red-100 mt-0.5">Denied Claims</div>
        </div>

        <div className={`rounded-xl p-4 text-white ${kpis.arDays > kpis.arDaysTarget ? 'bg-gradient-to-br from-rose-600 to-rose-700' : 'bg-gradient-to-br from-emerald-600 to-emerald-700'}`}>
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 opacity-80" />
            <span className="text-xs opacity-80">Target: {kpis.arDaysTarget}</span>
          </div>
          <div className="text-2xl font-bold">{kpis.arDays}</div>
          <div className="text-xs opacity-80 mt-0.5">AR Days</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 opacity-80" />
            <span className="flex items-center text-xs text-emerald-100">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />+1.2%
            </span>
          </div>
          <div className="text-2xl font-bold">{kpis.netCollectionRate}%</div>
          <div className="text-xs text-emerald-100 mt-0.5">Net Collection Rate</div>
        </div>

        <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 opacity-80" />
          </div>
          <div className="text-2xl font-bold">{kpis.cleanClaimRate}%</div>
          <div className="text-xs text-sky-100 mt-0.5">Clean Claim Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Claims Queue</h2>
            </div>
            <button
              onClick={() => onNavigate('revenue', 'claims')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {claimQueue.map(claim => (
              <div key={claim.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{claim.patientName}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(claim.status)}`}>
                        {claim.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{claim.payer} - ${claim.amount}</div>
                    {claim.missingFields && (
                      <div className="text-xs text-red-600 mt-1">
                        Missing: {claim.missingFields.join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {claim.status === 'ready' && (
                      <span className="text-xs text-gray-500">SLA: {claim.slaHours}h</span>
                    )}
                    <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                      {claim.status === 'ready' ? 'Submit' : claim.status === 'denied' ? 'Appeal' : 'Fix'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AR Aging */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <h2 className="font-semibold text-gray-900">AR Aging</h2>
            </div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(totalAR)}</div>
            <div className="text-sm text-gray-500">Total Outstanding</div>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Current</span>
                <span className="font-medium">{formatCurrency(arAging.current)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(arAging.current / totalAR) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">30 Days</span>
                <span className="font-medium">{formatCurrency(arAging.days30)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(arAging.days30 / totalAR) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">60 Days</span>
                <span className="font-medium">{formatCurrency(arAging.days60)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(arAging.days60 / totalAR) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">90 Days</span>
                <span className="font-medium">{formatCurrency(arAging.days90)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${(arAging.days90 / totalAR) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">120+ Days</span>
                <span className="font-medium text-red-600">{formatCurrency(arAging.days120plus)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-700 rounded-full" style={{ width: `${(arAging.days120plus / totalAR) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Denial Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="font-semibold text-gray-900">Top Denial Reasons</h2>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {denialInsights.map((denial, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{denial.reason}</p>
                  <p className="text-sm text-gray-500">{denial.count} claims - {formatCurrency(denial.amount)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {denial.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-red-500" />}
                  {denial.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-emerald-500" />}
                  {denial.trend === 'stable' && <RefreshCw className="h-4 w-4 text-gray-400" />}
                  <button className="text-sm text-blue-600 hover:text-blue-700">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payer Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Payer Performance</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="px-4 py-2 text-left">Payer</th>
                  <th className="px-4 py-2 text-right">Days</th>
                  <th className="px-4 py-2 text-right">Denial %</th>
                  <th className="px-4 py-2 text-right">Collect %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payerPerformance.map(payer => (
                  <tr key={payer.payer} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{payer.payer}</td>
                    <td className="px-4 py-3 text-sm text-right">{payer.avgDaysToPayment}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={payer.denialRate > 10 ? 'text-red-600' : payer.denialRate > 6 ? 'text-amber-600' : 'text-emerald-600'}>
                        {payer.denialRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{payer.netCollectionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cash & Payments */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-6 w-6" />
            <h2 className="font-semibold text-lg">Cash & Payments Today</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-3xl font-bold">${kpis.paymentsPosted.toLocaleString()}</div>
            <div className="text-sm text-emerald-100">Payments Posted</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-3xl font-bold">{kpis.unappliedPayments}</div>
            <div className="text-sm text-emerald-100">Unapplied Payments</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-3xl font-bold">${kpis.writeOffs.toLocaleString()}</div>
            <div className="text-sm text-emerald-100">Write-offs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
