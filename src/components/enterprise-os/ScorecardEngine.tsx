import { useState, useEffect, useId } from 'react';
import { ChartBar as BarChart3, ChevronDown, ChevronUp, RefreshCw, Filter, ArrowUpRight, ArrowDownRight, Minus, Lock } from 'lucide-react';
import { enterpriseOSService, ScorecardRow, ScorecardMetricRow } from '../../services/enterpriseOSService';
import { useAuth } from '../../contexts/AuthContext';

const SCOPE_LEVELS = ['network','region','clinic','team','owner'] as const;
const PERIOD_TYPES = ['weekly','monthly','quarterly','annual'] as const;

const RAG_CONFIG = {
  green:   { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'On Track', ariaLabel: 'Status: On Track (Green)' },
  yellow:  { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500',   label: 'At Risk',  ariaLabel: 'Status: At Risk (Yellow)' },
  red:     { bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-500',     label: 'Off Track', ariaLabel: 'Status: Off Track (Red)' },
  not_set: { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400',    label: 'Not Set',  ariaLabel: 'Status: Not Set' },
};

const ROLE_SCOPE_MAP: Record<string, string[]> = {
  executive:         ['network','region','clinic','team','owner'],
  admin:             ['network','region','clinic','team','owner'],
  regional_director: ['region','clinic','team'],
  clinic_manager:    ['clinic','team'],
  clinician:         ['team','owner'],
};

function RagBadge({ rag }: { rag: string }) {
  const cfg = RAG_CONFIG[rag as keyof typeof RAG_CONFIG] ?? RAG_CONFIG.not_set;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
      aria-label={cfg.ariaLabel}
      role="status"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

function VarianceCell({ actual, projected, higherIsBetter, metricName }: { actual: number | null; projected: number | null; higherIsBetter: boolean; metricName: string }) {
  if (actual == null || projected == null) return <span className="text-gray-300" aria-label={`${metricName} variance: not available`}>—</span>;
  const variance = actual - projected;
  const variancePct = projected !== 0 ? Math.round((variance / Math.abs(projected)) * 1000) / 10 : 0;
  const isPositive = higherIsBetter ? variance >= 0 : variance <= 0;
  const direction = variance > 0 ? 'up' : variance < 0 ? 'down' : 'no change';
  const sign = variance > 0 ? '+' : '';

  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}
      aria-label={`${metricName} variance: ${sign}${variancePct}% (${direction}), ${isPositive ? 'favourable' : 'unfavourable'}`}
    >
      {variance > 0
        ? <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        : variance < 0
          ? <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
          : <Minus className="h-3 w-3" aria-hidden="true" />
      }
      {sign}{variancePct}%
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
  {
    id: 'sc2', scope_level: 'clinic', period_type: 'monthly', period_label: 'February 2026',
    period_start: '2026-02-01', period_end: '2026-02-28', status: 'draft', overall_rag: 'green',
    notes: 'South Commons performing well overall.', created_at: '2026-03-01',
    scorecard_metrics: [
      { id: 'm9', scorecard_id: 'sc2', metric_name: 'Provider Utilization', category: 'operations', projected: 87, actual: 89.1, target: 87, unit: '%', higher_is_better: true, rag_status: 'green', owner_comment: 'Full capacity most days.', recovery_plan: null, sort_order: 0 },
      { id: 'm10', scorecard_id: 'sc2', metric_name: 'New Patient Intake', category: 'growth', projected: 45, actual: 48, target: 45, unit: 'pts', higher_is_better: true, rag_status: 'green', owner_comment: 'Referral pipeline strong.', recovery_plan: null, sort_order: 1 },
      { id: 'm11', scorecard_id: 'sc2', metric_name: 'Google Review Rating', category: 'quality', projected: 4.7, actual: 4.8, target: 4.7, unit: '★', higher_is_better: true, rag_status: 'green', owner_comment: 'Consistent 5-star responses.', recovery_plan: null, sort_order: 2 },
    ]
  },
];

const CATEGORY_ORDER = ['operations', 'clinical', 'financial', 'workforce', 'growth', 'quality', 'patient_experience'];

const CATEGORY_LABELS: Record<string, string> = {
  operations: 'Operations',
  clinical: 'Clinical',
  financial: 'Financial',
  workforce: 'Workforce',
  growth: 'Growth',
  quality: 'Quality',
  patient_experience: 'Patient Experience',
};

function MetricRow({ metric, isExpanded, onToggle }: {
  metric: ScorecardMetricRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const detailId = useId();
  const hasDetail = !!(metric.owner_comment || metric.recovery_plan);

  return (
    <div>
      <div
        role={hasDetail ? 'button' : undefined}
        tabIndex={hasDetail ? 0 : undefined}
        aria-expanded={hasDetail ? isExpanded : undefined}
        aria-controls={hasDetail ? detailId : undefined}
        onClick={hasDetail ? onToggle : undefined}
        onKeyDown={hasDetail ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } } : undefined}
        className={`w-full px-5 py-3 text-left transition-colors ${hasDetail ? 'hover:bg-gray-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500' : ''}`}
        aria-label={hasDetail
          ? `${metric.metric_name}: actual ${metric.actual ?? 'unknown'}${metric.unit}, target ${metric.target ?? 'unknown'}${metric.unit}. ${isExpanded ? 'Collapse' : 'Expand'} details`
          : undefined
        }
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900">{metric.metric_name}</span>
          </div>
          <div className="flex items-center gap-6 text-sm" role="group" aria-label={`${metric.metric_name} metrics`}>
            <div className="text-right">
              <div className="text-xs text-gray-400" id={`proj-label-${metric.id}`}>Projected</div>
              <div className="font-medium text-gray-700" aria-labelledby={`proj-label-${metric.id}`}>
                {metric.projected ?? '—'}{metric.unit}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400" id={`actual-label-${metric.id}`}>Actual</div>
              <div className="font-semibold text-gray-900" aria-labelledby={`actual-label-${metric.id}`}>
                {metric.actual ?? '—'}{metric.unit}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Variance</div>
              <VarianceCell
                actual={metric.actual}
                projected={metric.projected}
                higherIsBetter={metric.higher_is_better}
                metricName={metric.metric_name}
              />
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400" id={`target-label-${metric.id}`}>Target</div>
              <div className="text-gray-600 text-sm" aria-labelledby={`target-label-${metric.id}`}>
                {metric.target ?? '—'}{metric.unit}
              </div>
            </div>
            <RagBadge rag={metric.rag_status} />
          </div>
          {hasDetail && (
            <span aria-hidden="true">
              {isExpanded
                ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                : <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              }
            </span>
          )}
        </div>
      </div>

      {hasDetail && (
        <div
          id={detailId}
          hidden={!isExpanded}
          role="region"
          aria-label={`${metric.metric_name} detail`}
        >
          {isExpanded && (
            <div className="px-5 pb-3 ml-4 space-y-2 border-b border-gray-50">
              {metric.owner_comment && (
                <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
                  <span className="font-semibold text-gray-700">Owner Comment: </span>
                  {metric.owner_comment}
                </div>
              )}
              {metric.recovery_plan && (
                <div className="text-xs bg-amber-50 border border-amber-100 rounded-lg p-2.5" role="note" aria-label="Recovery plan">
                  <span className="font-semibold text-amber-800">Recovery Plan: </span>
                  <span className="text-amber-700">{metric.recovery_plan}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScorecardCard({ sc, isExpanded, onToggle, expandedMetrics, onToggleMetric }: {
  sc: ScorecardRow;
  isExpanded: boolean;
  onToggle: () => void;
  expandedMetrics: Set<string>;
  onToggleMetric: (id: string) => void;
}) {
  const panelId = useId();
  const metrics = sc.scorecard_metrics ?? [];
  const redCount = metrics.filter(m => m.rag_status === 'red').length;
  const yellowCount = metrics.filter(m => m.rag_status === 'yellow').length;
  const greenCount = metrics.filter(m => m.rag_status === 'green').length;

  function groupMetricsByCategory(items: ScorecardMetricRow[]) {
    const groups: Record<string, ScorecardMetricRow[]> = {};
    for (const m of items) {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    }
    return CATEGORY_ORDER.filter(c => groups[c]).map(c => ({ category: c, metrics: groups[c] }));
  }

  const groups = groupMetricsByCategory(metrics);
  const summaryParts = [
    greenCount > 0 && `${greenCount} on track`,
    yellowCount > 0 && `${yellowCount} at risk`,
    redCount > 0 && `${redCount} off track`,
  ].filter(Boolean).join(', ');

  const scopeLabel = sc.scope_level.charAt(0).toUpperCase() + sc.scope_level.slice(1);
  const headingId = useId();

  return (
    <article
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      aria-labelledby={headingId}
    >
      <button
        id={headingId}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="w-full px-5 py-4 text-left flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        aria-label={`${scopeLabel} Scorecard — ${sc.period_label}. Overall ${RAG_CONFIG[sc.overall_rag as keyof typeof RAG_CONFIG]?.ariaLabel ?? 'status unknown'}. ${summaryParts}. ${isExpanded ? 'Collapse' : 'Expand'}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <span className="font-semibold text-gray-900" aria-hidden="true">
              {scopeLabel} Scorecard — {sc.period_label}
            </span>
            <span className="text-xs text-gray-400 capitalize border border-gray-200 px-1.5 py-0.5 rounded" aria-hidden="true">
              {sc.period_type}
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded capitalize ${sc.status === 'reviewed' ? 'bg-blue-100 text-blue-700' : sc.status === 'locked' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700'}`}
              aria-hidden="true"
            >
              {sc.status === 'locked' && <Lock className="h-3 w-3 inline mr-0.5" aria-hidden="true" />}
              {sc.status}
            </span>
            <span aria-hidden="true"><RagBadge rag={sc.overall_rag} /></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500" aria-hidden="true">
            <span>{metrics.length} metrics</span>
            {redCount > 0 && <span className="text-red-600 font-medium">{redCount} red</span>}
            {yellowCount > 0 && <span className="text-amber-600 font-medium">{yellowCount} yellow</span>}
            {sc.notes && <span className="italic truncate max-w-xs">{sc.notes}</span>}
          </div>
        </div>
        <span aria-hidden="true">
          {isExpanded
            ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
            : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
          }
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-label={`${scopeLabel} Scorecard details`}
        hidden={!isExpanded}
      >
        {isExpanded && (
          <div className="border-t border-gray-100">
            {groups.map(({ category, metrics: catMetrics }) => (
              <section key={category} aria-label={`${CATEGORY_LABELS[category] ?? category} metrics`}>
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {CATEGORY_LABELS[category] ?? category}
                  </span>
                </div>
                {catMetrics.map(metric => (
                  <MetricRow
                    key={metric.id}
                    metric={metric}
                    isExpanded={expandedMetrics.has(metric.id)}
                    onToggle={() => onToggleMetric(metric.id)}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function ScorecardEngine() {
  const { profile } = useAuth();
  const [scorecards, setScorecards] = useState<ScorecardRow[]>(DEMO_SCORECARDS);
  const [loading, setLoading] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('monthly');
  const [expandedScorecards, setExpandedScorecards] = useState<Set<string>>(new Set(['sc1']));
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());

  const role = profile?.role ?? 'observer';
  const allowedScopes = ROLE_SCOPE_MAP[role] ?? SCOPE_LEVELS;

  const filteredScorecards = scorecards.filter(sc =>
    allowedScopes.includes(sc.scope_level)
  );

  const visibleScopeOptions = SCOPE_LEVELS.filter(s => allowedScopes.includes(s));

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

  const allMetrics = filteredScorecards.flatMap(s => s.scorecard_metrics ?? []);
  const greenCount = allMetrics.filter(m => m.rag_status === 'green').length;
  const yellowCount = allMetrics.filter(m => m.rag_status === 'yellow').length;
  const redCount = allMetrics.filter(m => m.rag_status === 'red').length;

  const summaryStatusId = useId();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-teal-600" aria-hidden="true" />
          <div>
            <h2 className="font-semibold text-gray-900">Enterprise Scorecard Engine</h2>
            <p className="text-xs text-gray-500">
              {allowedScopes.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ')} · Weekly / Monthly / Quarterly / Annual
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Scorecard filters">
          <Filter className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <label className="sr-only" htmlFor="scope-filter">Filter by scope</label>
          <select
            id="scope-filter"
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="all">All Scopes</option>
            {visibleScopeOptions.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="period-filter">Filter by period</label>
          <select
            id="period-filter"
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="all">All Periods</option>
            {PERIOD_TYPES.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="p-1.5 text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label={loading ? 'Refreshing scorecards…' : 'Refresh scorecards'}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {filteredScorecards.length > 0 && (
        <div
          className="grid grid-cols-4 gap-3"
          role="region"
          aria-labelledby={summaryStatusId}
        >
          <h3 id={summaryStatusId} className="sr-only">Scorecard metric summary</h3>
          {([
            { rag: 'green' as const, label: 'On Track' },
            { rag: 'yellow' as const, label: 'At Risk' },
            { rag: 'red' as const, label: 'Off Track' },
          ]).map(({ rag, label }) => {
            const count = allMetrics.filter(m => m.rag_status === rag).length;
            const cfg = RAG_CONFIG[rag];
            return (
              <div key={rag} className={`rounded-xl p-3 border ${cfg.bg} border-opacity-50`}>
                <div className={`text-2xl font-bold ${cfg.text}`} aria-hidden="true">{count}</div>
                <div className="text-xs text-gray-600">{label} Metrics</div>
                <span className="sr-only">{count} metrics are {label.toLowerCase()}</span>
              </div>
            );
          })}
          <div className="rounded-xl p-3 border border-gray-100 bg-white">
            <div className="text-2xl font-bold text-gray-800" aria-hidden="true">{filteredScorecards.length}</div>
            <div className="text-xs text-gray-500">Scorecards</div>
            <span className="sr-only">{filteredScorecards.length} scorecards total</span>
          </div>
        </div>
      )}

      <div role="list" aria-label="Scorecards" aria-live="polite" aria-busy={loading}>
        {loading && <p className="sr-only">Loading scorecards…</p>}
        {filteredScorecards.map(sc => (
          <div key={sc.id} role="listitem" className="mb-4">
            <ScorecardCard
              sc={sc}
              isExpanded={expandedScorecards.has(sc.id)}
              onToggle={() => toggleScorecard(sc.id)}
              expandedMetrics={expandedMetrics}
              onToggleMetric={toggleMetric}
            />
          </div>
        ))}
      </div>

      {filteredScorecards.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400" role="status">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
          <p className="text-sm">No scorecards found for the selected filters.</p>
        </div>
      )}
    </div>
  );
}
