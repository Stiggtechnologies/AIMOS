import { useState, useEffect } from 'react';
import { ChartBar as BarChart3, ChevronDown, ChevronUp, RefreshCw, Filter, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Minus, ArrowUpRight, ArrowDownRight, FileText, Lock, CreditCard as Edit3 } from 'lucide-react';
import { enterpriseOSService, ScorecardRow, ScorecardMetricRow } from '../../services/enterpriseOSService';

const SCOPE_LEVELS = ['network','region','clinic','team','owner'] as const;
const PERIOD_TYPES = ['weekly','monthly','quarterly','annual'] as const;

const RAG_CONFIG = {
  green:   { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Green' },
  yellow:  { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500',   label: 'Yellow' },
  red:     { bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-500',     label: 'Red' },
  not_set: { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400',    label: 'Not Set' },
};

function RagBadge({ rag }: { rag: string }) {
  const cfg = RAG_CONFIG[rag as keyof typeof RAG_CONFIG] ?? RAG_CONFIG.not_set;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function VarianceCell({ actual, projected, higherIsBetter }: { actual: number | null; projected: number | null; higherIsBetter: boolean }) {
  if (actual == null || projected == null) return <span className="text-gray-300">—</span>;
  const variance = actual - projected;
  const variancePct = projected !== 0 ? Math.round((variance / Math.abs(projected)) * 1000) / 10 : 0;
  const isPositive = higherIsBetter ? variance >= 0 : variance <= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
      {variance > 0 ? <ArrowUpRight className="h-3 w-3" /> : variance < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {variance > 0 ? '+' : ''}{variancePct}%
    </span>
  );
}

const DEMO_SCORECARDS: ScorecardRow[] = [
  {
    id: 'sc1', scope_level: 'network', period_type: 'monthly', period_label: 'February 2026',
    period_start: '2026-02-01', period_end: '2026-02-28', status: 'reviewed', overall_rag: 'yellow',
    notes: 'AR days remain elevated. Utilization strong in most clinics except EPC.', created_at: '2026-03-01',
    scorecard_metrics: [
      { id: 'm1', scorecard_id: 'sc1', metric_name: 'Provider Utilization', category: 'operations', projected: 87, actual: 84.2, target: 87, unit: '%', higher_is_better: true, rag_status: 'yellow', owner_comment: 'EPC clinic drag — 3 providers onboarding.', recovery_plan: 'Complete EPC onboarding by Mar 15.', sort_order: 0 },
      { id: 'm2', scorecard_id: 'sc1', metric_name: 'Visits per Provider/Day', category: 'operations', projected: 11, actual: 11.4, target: 11, unit: 'visits', higher_is_better: true, rag_status: 'green', owner_comment: 'Slightly above target.', recovery_plan: null, sort_order: 1 },
      { id: 'm3', scorecard_id: 'sc1', metric_name: 'No-Show Rate', category: 'operations', projected: 6, actual: 5.8, target: 6, unit: '%', higher_is_better: false, rag_status: 'green', owner_comment: 'Reminder automation working well.', recovery_plan: null, sort_order: 2 },
      { id: 'm4', scorecard_id: 'sc1', metric_name: 'Net Days in AR', category: 'financial', projected: 38, actual: 44.1, target: 35, unit: 'days', higher_is_better: false, rag_status: 'red', owner_comment: 'Payer mix shift. Blue Cross processing delays.', recovery_plan: 'Escalate Blue Cross denial queue. AR team daily review.', sort_order: 3 },
      { id: 'm5', scorecard_id: 'sc1', metric_name: 'Denial Rate', category: 'financial', projected: 5, actual: 4.2, target: 5, unit: '%', higher_is_better: false, rag_status: 'green', owner_comment: 'Below target. Coding accuracy improved.', recovery_plan: null, sort_order: 4 },
      { id: 'm6', scorecard_id: 'sc1', metric_name: 'Plan Completion Rate', category: 'clinical', projected: 84, actual: 81.3, target: 84, unit: '%', higher_is_better: true, rag_status: 'yellow', owner_comment: 'Patient drop-off increasing.', recovery_plan: 'Patient retention protocol review for March.', sort_order: 5 },
      { id: 'm7', scorecard_id: 'sc1', metric_name: 'Reassessment Compliance', category: 'clinical', projected: 90, actual: 92.1, target: 90, unit: '%', higher_is_better: true, rag_status: 'green', owner_comment: 'Above target.', recovery_plan: null, sort_order: 6 },
      { id: 'm8', scorecard_id: 'sc1', metric_name: 'Provider Vacancy Rate', category: 'workforce', projected: 10, actual: 8.5, target: 10, unit: '%', higher_is_better: false, rag_status: 'green', owner_comment: 'Two hires closing this month.', recovery_plan: null, sort_order: 7 },
    ]
  },
];

const CATEGORY_ORDER = ['operations', 'clinical', 'financial', 'workforce', 'growth', 'quality', 'patient_experience'];

export function ScorecardEngine() {
  const [scorecards, setScorecards] = useState<ScorecardRow[]>(DEMO_SCORECARDS);
  const [loading, setLoading] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('monthly');
  const [expandedScorecards, setExpandedScorecards] = useState<Set<string>>(new Set(['sc1']));
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());

  useEffect(() => {
    load();
  }, [scopeFilter, periodFilter]);

  async function load() {
    setLoading(true);
    try {
      const data = await enterpriseOSService.getScorecards(
        scopeFilter === 'all' ? undefined : scopeFilter,
        periodFilter === 'all' ? undefined : periodFilter
      );
      setScorecards(data.length > 0 ? data : DEMO_SCORECARDS);
    } catch {
      setScorecards(DEMO_SCORECARDS);
    } finally {
      setLoading(false);
    }
  }

  const toggleScorecard = (id: string) =>
    setExpandedScorecards(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleMetric = (id: string) =>
    setExpandedMetrics(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  function groupMetricsByCategory(metrics: ScorecardMetricRow[]) {
    const groups: Record<string, ScorecardMetricRow[]> = {};
    for (const m of metrics) {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    }
    return CATEGORY_ORDER.filter(c => groups[c]).map(c => ({ category: c, metrics: groups[c] }));
  }

  return (
    <div className="space-y-5">
      {/* Header + Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-teal-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Enterprise Scorecard Engine</h2>
            <p className="text-xs text-gray-500">Network → Region → Clinic → Team → Owner · Weekly / Monthly / Quarterly / Annual</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={scopeFilter} onChange={e => setScopeFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
            <option value="all">All Scopes</option>
            {SCOPE_LEVELS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
            <option value="all">All Periods</option>
            {PERIOD_TYPES.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <button onClick={load} className="p-1.5 text-gray-400 hover:text-gray-700">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Scorecard summary row */}
      {scorecards.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {(['green','yellow','red'] as const).map(rag => {
            const count = scorecards.flatMap(s => s.scorecard_metrics ?? []).filter(m => m.rag_status === rag).length;
            return (
              <div key={rag} className={`rounded-xl p-3 border ${RAG_CONFIG[rag].bg} border-opacity-50`}>
                <div className={`text-2xl font-bold ${RAG_CONFIG[rag].text}`}>{count}</div>
                <div className="text-xs text-gray-600 capitalize">{rag} Metrics</div>
              </div>
            );
          })}
          <div className="rounded-xl p-3 border border-gray-100 bg-white">
            <div className="text-2xl font-bold text-gray-800">{scorecards.length}</div>
            <div className="text-xs text-gray-500">Scorecards</div>
          </div>
        </div>
      )}

      {/* Scorecard cards */}
      {scorecards.map(sc => {
        const metrics = sc.scorecard_metrics ?? [];
        const groups = groupMetricsByCategory(metrics);
        const isExpanded = expandedScorecards.has(sc.id);
        const redCount = metrics.filter(m => m.rag_status === 'red').length;
        const yellowCount = metrics.filter(m => m.rag_status === 'yellow').length;
        return (
          <div key={sc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Scorecard header */}
            <button
              onClick={() => toggleScorecard(sc.id)}
              className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <span className="font-semibold text-gray-900">
                    {sc.scope_level.charAt(0).toUpperCase() + sc.scope_level.slice(1)} Scorecard — {sc.period_label}
                  </span>
                  <span className="text-xs text-gray-400 capitalize border border-gray-200 px-1.5 py-0.5 rounded">{sc.period_type}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${sc.status === 'reviewed' ? 'bg-blue-100 text-blue-700' : sc.status === 'locked' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
                    {sc.status === 'locked' ? <><Lock className="h-3 w-3 inline mr-0.5" />{sc.status}</> : sc.status}
                  </span>
                  <RagBadge rag={sc.overall_rag} />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{metrics.length} metrics</span>
                  {redCount > 0 && <span className="text-red-600 font-medium">{redCount} red</span>}
                  {yellowCount > 0 && <span className="text-amber-600 font-medium">{yellowCount} yellow</span>}
                  {sc.notes && <span className="italic truncate max-w-xs">{sc.notes}</span>}
                </div>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100">
                {groups.map(({ category, metrics: catMetrics }) => (
                  <div key={category}>
                    <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{category}</span>
                    </div>
                    {catMetrics.map(metric => {
                      const isMetricExpanded = expandedMetrics.has(metric.id);
                      const variance = metric.actual != null && metric.projected != null ? metric.actual - metric.projected : null;
                      return (
                        <div key={metric.id}>
                          <button
                            onClick={() => toggleMetric(metric.id)}
                            className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900">{metric.metric_name}</span>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-right">
                                  <div className="text-xs text-gray-400">Projected</div>
                                  <div className="font-medium text-gray-700">{metric.projected ?? '—'}{metric.unit}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-400">Actual</div>
                                  <div className="font-semibold text-gray-900">{metric.actual ?? '—'}{metric.unit}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-400">Variance</div>
                                  <VarianceCell actual={metric.actual} projected={metric.projected} higherIsBetter={metric.higher_is_better} />
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-400">Target</div>
                                  <div className="text-gray-600 text-sm">{metric.target ?? '—'}{metric.unit}</div>
                                </div>
                                <RagBadge rag={metric.rag_status} />
                              </div>
                              {isMetricExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                            </div>
                          </button>

                          {isMetricExpanded && (metric.owner_comment || metric.recovery_plan) && (
                            <div className="px-5 pb-3 ml-4 space-y-2 border-b border-gray-50">
                              {metric.owner_comment && (
                                <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
                                  <span className="font-semibold text-gray-700">Owner Comment: </span>{metric.owner_comment}
                                </div>
                              )}
                              {metric.recovery_plan && (
                                <div className="text-xs bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                                  <span className="font-semibold text-amber-800">Recovery Plan: </span>
                                  <span className="text-amber-700">{metric.recovery_plan}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {scorecards.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No scorecards found for the selected filters.</p>
        </div>
      )}
    </div>
  );
}
