import { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, RefreshCw, Filter, Search, ArrowUpRight, ArrowDownRight, Minus, CircleCheck as CheckCircle } from 'lucide-react';
import { enterpriseOSService, KpiDefinition } from '../../services/enterpriseOSService';
import { supabase } from '../../lib/supabase';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  operations:        { label: 'Operations',         color: 'text-teal-700',   bg: 'bg-teal-50'   },
  clinical:          { label: 'Clinical',            color: 'text-blue-700',   bg: 'bg-blue-50'   },
  financial:         { label: 'Financial',           color: 'text-emerald-700',bg: 'bg-emerald-50' },
  workforce:         { label: 'Workforce',           color: 'text-orange-700', bg: 'bg-orange-50' },
  growth:            { label: 'Growth',              color: 'text-pink-700',   bg: 'bg-pink-50'   },
  quality:           { label: 'Quality',             color: 'text-violet-700', bg: 'bg-violet-50' },
  patient_experience:{ label: 'Patient Experience',  color: 'text-amber-700',  bg: 'bg-amber-50'  },
};

const DEMO_KPIS: KpiDefinition[] = [
  { id: 'k1', slug: 'provider_utilization', name: 'Provider Utilization', category: 'operations', description: 'Percentage of available provider hours that are billable/scheduled. Canonical definition per APTA PPS standard.', formula: '(Scheduled Hours / Available Hours) × 100', unit: '%', unit_label: 'Percent', frequency: 'monthly', higher_is_better: true, red_threshold: 75, yellow_threshold: 85, green_threshold: 90, benchmark_source: 'APTA PPS 2024', benchmark_value: 87, is_active: true, approved_at: '2026-01-01' },
  { id: 'k2', slug: 'visits_per_provider', name: 'Visits per Provider per Day', category: 'operations', description: 'Average number of patient visits per full-time equivalent provider per day.', formula: 'Total Visits / Provider FTE / Working Days', unit: 'visits', unit_label: 'Visits/FTE/Day', frequency: 'monthly', higher_is_better: true, red_threshold: 8, yellow_threshold: 10, green_threshold: 12, benchmark_source: 'Clinicient Benchmark 2024', benchmark_value: 10.5, is_active: true, approved_at: '2026-01-01' },
  { id: 'k3', slug: 'no_show_rate', name: 'No-Show Rate', category: 'operations', description: 'Percentage of scheduled appointments where the patient did not attend and did not cancel in advance.', formula: '(No-Shows / Total Scheduled) × 100', unit: '%', unit_label: 'Percent', frequency: 'monthly', higher_is_better: false, red_threshold: 10, yellow_threshold: 7, green_threshold: 4, benchmark_source: 'MGMA 2024', benchmark_value: 6.2, is_active: true, approved_at: '2026-01-01' },
  { id: 'k4', slug: 'wait_time_first_visit', name: 'Wait Time to First Visit', category: 'patient_experience', description: 'Average number of calendar days from referral/booking request to first attended visit.', formula: 'AVG(First Visit Date - Referral Date)', unit: 'days', unit_label: 'Days', frequency: 'monthly', higher_is_better: false, red_threshold: 14, yellow_threshold: 10, green_threshold: 7, benchmark_source: 'AIM Network Internal 2024', benchmark_value: 8, is_active: true, approved_at: '2026-01-01' },
  { id: 'k5', slug: 'plan_completion_rate', name: 'Plan Completion Rate', category: 'clinical', description: 'Percentage of treatment plans completed through discharge as planned (not abandoned or significantly shortened).', formula: '(Completed Plans / Started Plans) × 100', unit: '%', unit_label: 'Percent', frequency: 'monthly', higher_is_better: true, red_threshold: 70, yellow_threshold: 82, green_threshold: 90, benchmark_source: 'Clinicient Benchmark 2024', benchmark_value: 84, is_active: true, approved_at: '2026-01-01' },
  { id: 'k6', slug: 'reassessment_compliance', name: 'Reassessment Compliance', category: 'clinical', description: 'Percentage of active patients who received a formal reassessment within the mandated interval (every 6 visits or 30 days).', formula: '(Reassessments Completed on Time / Reassessments Due) × 100', unit: '%', unit_label: 'Percent', frequency: 'monthly', higher_is_better: true, red_threshold: 70, yellow_threshold: 85, green_threshold: 95, benchmark_source: 'APTA CPG 2024', benchmark_value: 90, is_active: true, approved_at: '2026-01-01' },
  { id: 'k7', slug: 'net_days_ar', name: 'Net Days in AR', category: 'financial', description: 'Average number of days to collect a claim from date of service. Canonical per HFMA MAP Key.', formula: 'Net AR Balance / (Net Collections / Days in Period)', unit: 'days', unit_label: 'Days', frequency: 'monthly', higher_is_better: false, red_threshold: 50, yellow_threshold: 40, green_threshold: 30, benchmark_source: 'HFMA MAP Key 2024', benchmark_value: 35, is_active: true, approved_at: '2026-01-01' },
  { id: 'k8', slug: 'denial_rate', name: 'Denial Rate', category: 'financial', description: 'Percentage of submitted claims denied on first submission, before appeals.', formula: '(Denied Claims / Submitted Claims) × 100', unit: '%', unit_label: 'Percent', frequency: 'monthly', higher_is_better: false, red_threshold: 10, yellow_threshold: 6, green_threshold: 3, benchmark_source: 'HFMA MAP Key 2024', benchmark_value: 5.1, is_active: true, approved_at: '2026-01-01' },
  { id: 'k9', slug: 'revenue_per_provider', name: 'Revenue per Provider Monthly', category: 'financial', description: 'Total collected revenue divided by full-time equivalent providers in the period.', formula: 'Total Collected Revenue / Provider FTE', unit: '$', unit_label: 'USD', frequency: 'monthly', higher_is_better: true, red_threshold: 18000, yellow_threshold: 22000, green_threshold: 26000, benchmark_source: 'AIM Network Internal 2024', benchmark_value: 24000, is_active: true, approved_at: '2026-01-01' },
  { id: 'k10', slug: 'vacancy_rate', name: 'Provider Vacancy Rate', category: 'workforce', description: 'Percentage of budgeted provider FTE positions that are currently unfilled.', formula: '(Vacant Positions / Budgeted Positions) × 100', unit: '%', unit_label: 'Percent', frequency: 'monthly', higher_is_better: false, red_threshold: 20, yellow_threshold: 10, green_threshold: 5, benchmark_source: 'SHRM Healthcare 2024', benchmark_value: 8, is_active: true, approved_at: '2026-01-01' },
];

const DEMO_VALUES: Record<string, { actual: number; projected: number }> = {
  provider_utilization: { actual: 84.2, projected: 87 },
  visits_per_provider:  { actual: 11.4, projected: 11 },
  no_show_rate:         { actual: 5.8,  projected: 6  },
  wait_time_first_visit:{ actual: 9.1,  projected: 8  },
  plan_completion_rate: { actual: 81.3, projected: 84 },
  reassessment_compliance:{ actual: 92.1, projected: 90 },
  net_days_ar:          { actual: 44.1, projected: 38 },
  denial_rate:          { actual: 4.2,  projected: 5  },
  revenue_per_provider: { actual: 23400,projected: 24000 },
  vacancy_rate:         { actual: 8.5,  projected: 10 },
};

function computeRag(kpi: KpiDefinition, actual: number): string {
  if (kpi.higher_is_better) {
    if (kpi.green_threshold != null && actual >= kpi.green_threshold) return 'green';
    if (kpi.yellow_threshold != null && actual >= kpi.yellow_threshold) return 'yellow';
    return 'red';
  } else {
    if (kpi.green_threshold != null && actual <= kpi.green_threshold) return 'green';
    if (kpi.yellow_threshold != null && actual <= kpi.yellow_threshold) return 'yellow';
    return 'red';
  }
}

const RAG_STYLE = {
  green:  { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  yellow: { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50'  },
  red:    { dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50'    },
};

export function KPIGovernanceView() {
  const [kpis, setKpis] = useState<KpiDefinition[]>(DEMO_KPIS);
  const [liveValues, setLiveValues] = useState<Record<string, { actual: number; projected: number }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [showDictionary, setShowDictionary] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [kpiData, valuesResult] = await Promise.all([
        enterpriseOSService.getKpiDefinitions(),
        supabase
          .from('kpi_values')
          .select('kpi_slug, actual_value, projected_value')
          .order('period_end', { ascending: false })
          .limit(50),
      ]);
      if (kpiData.length > 0) setKpis(kpiData);
      if (!valuesResult.error && valuesResult.data && valuesResult.data.length > 0) {
        const map: Record<string, { actual: number; projected: number }> = {};
        for (const row of valuesResult.data) {
          if (!map[row.kpi_slug]) {
            map[row.kpi_slug] = { actual: row.actual_value, projected: row.projected_value };
          }
        }
        setLiveValues(map);
      }
    } catch {
      // keep demo data
    } finally {
      setLoading(false);
    }
  }

  const kpiValues = liveValues ?? DEMO_VALUES;

  const filtered = kpis.filter(k => {
    const matchSearch = k.name.toLowerCase().includes(search.toLowerCase()) || k.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || k.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(kpis.map(k => k.category))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-teal-600" />
          <div>
            <h2 className="font-semibold text-gray-900">KPI Governance Layer</h2>
            <p className="text-xs text-gray-500">Canonical metric definitions · One source of truth · RYG thresholds · Benchmark references</p>
          </div>
        </div>
        <button onClick={load} className="p-1.5 text-gray-400 hover:text-gray-700">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary RYG bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Network Performance — February 2026</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {filtered.map(kpi => {
            const val = kpiValues[kpi.slug];
            if (!val) return null;
            const rag = computeRag(kpi, val.actual);
            const style = RAG_STYLE[rag as keyof typeof RAG_STYLE] ?? RAG_STYLE.green;
            const variance = val.actual - val.projected;
            const variancePct = val.projected !== 0 ? ((variance / Math.abs(val.projected)) * 100).toFixed(1) : '0';
            const isGoodVariance = kpi.higher_is_better ? variance >= 0 : variance <= 0;
            return (
              <div key={kpi.id} className={`rounded-lg p-3 border ${style.bg}`} style={{ borderColor: rag === 'green' ? '#d1fae5' : rag === 'yellow' ? '#fde68a' : '#fecaca' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className="text-xs text-gray-500 truncate">{kpi.name}</span>
                </div>
                <div className={`text-xl font-bold ${style.text}`}>{val.actual}{kpi.unit === '$' ? '' : kpi.unit}</div>
                <div className={`text-xs flex items-center gap-0.5 ${isGoodVariance ? 'text-emerald-600' : 'text-red-600'}`}>
                  {variance > 0 ? <ArrowUpRight className="h-3 w-3" /> : variance < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {variance > 0 ? '+' : ''}{variancePct}% vs projected
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-40 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search KPIs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{CATEGORY_CONFIG[c]?.label ?? c}</option>)}
          </select>
        </div>
        <span className="text-xs text-gray-400">{filtered.length} KPIs</span>
      </div>

      {/* KPI Dictionary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Metric Dictionary</h3>
          <button onClick={() => setShowDictionary(d => !d)} className="text-xs text-gray-500 hover:text-gray-700">
            {showDictionary ? 'Collapse' : 'Expand'} all
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map(kpi => {
            const catCfg = CATEGORY_CONFIG[kpi.category] ?? { label: kpi.category, color: 'text-gray-600', bg: 'bg-gray-50' };
            const val = kpiValues[kpi.slug];
            const rag = val ? computeRag(kpi, val.actual) : 'not_set';
            const ragStyle = RAG_STYLE[rag as keyof typeof RAG_STYLE];
            const isExpanded = expandedKpi === kpi.id;

            return (
              <div key={kpi.id}>
                <button
                  onClick={() => setExpandedKpi(isExpanded ? null : kpi.id)}
                  className="w-full px-5 py-3.5 text-left flex items-start gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${catCfg.bg} ${catCfg.color}`}>{catCfg.label}</span>
                      <span className="font-medium text-gray-900 text-sm">{kpi.name}</span>
                      {kpi.approved_at && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                      <span className="text-xs text-gray-400 capitalize">{kpi.frequency}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{kpi.description}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {val && ragStyle && (
                      <div className="text-right">
                        <div className={`text-sm font-bold ${ragStyle.text}`}>{val.actual}{kpi.unit === '$' ? '' : kpi.unit}</div>
                        <div className="text-xs text-gray-400">Current</div>
                      </div>
                    )}
                    {/* RYG threshold bar */}
                    <div className="flex gap-0.5 items-center" title={`Red <${kpi.red_threshold} · Yellow <${kpi.yellow_threshold} · Green ≥${kpi.green_threshold}`}>
                      <div className="w-2.5 h-5 rounded-sm bg-red-400" />
                      <div className="w-2.5 h-5 rounded-sm bg-amber-400" />
                      <div className="w-2.5 h-5 rounded-sm bg-emerald-400" />
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 bg-gray-50/60 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Definition</h4>
                        <p className="text-sm text-gray-700">{kpi.description}</p>
                        {kpi.formula && (
                          <div className="bg-white border border-gray-200 rounded-lg p-2.5">
                            <div className="text-xs font-semibold text-gray-500 mb-1">Formula</div>
                            <code className="text-xs text-teal-700 font-mono">{kpi.formula}</code>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Thresholds</h4>
                        <div className="space-y-1.5">
                          {[
                            { label: 'Green', value: kpi.green_threshold, style: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                            { label: 'Yellow', value: kpi.yellow_threshold, style: 'bg-amber-100 text-amber-700 border-amber-200' },
                            { label: 'Red', value: kpi.red_threshold, style: 'bg-red-100 text-red-700 border-red-200' },
                          ].map(({ label, value, style }) => (
                            <div key={label} className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${style}`}>
                              <span className="font-semibold">{label}</span>
                              <span>{kpi.higher_is_better ? '≥' : '≤'} {value}{kpi.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Benchmark</h4>
                        {kpi.benchmark_value != null && (
                          <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-1">
                            <div className="text-xl font-bold text-gray-900">{kpi.benchmark_value}{kpi.unit === '$' ? '' : kpi.unit}</div>
                            <div className="text-xs text-gray-500">{kpi.benchmark_source}</div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Frequency:</span> {kpi.frequency} · <span className="font-medium">Direction:</span> {kpi.higher_is_better ? 'Higher is better' : 'Lower is better'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
