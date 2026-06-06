import { useState, useEffect } from 'react';
import {
  Target, ChevronDown, ChevronUp, ChevronRight, RefreshCw,
  ArrowRight, TrendingUp, Calendar, Award, Layers
} from 'lucide-react';
import { enterpriseOSService, GoalNode } from '../../services/enterpriseOSService';

const RAG_CONFIG = {
  green:   { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500', border: 'border-emerald-300' },
  yellow:  { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: 'bg-amber-500',   border: 'border-amber-300'  },
  red:     { bg: 'bg-red-100',     text: 'text-red-700',     bar: 'bg-red-500',     border: 'border-red-300'    },
  not_set: { bg: 'bg-gray-100',    text: 'text-gray-600',    bar: 'bg-gray-400',    border: 'border-gray-200'   },
};

const LEVEL_CONFIG: Record<string, { label: string; color: string; indent: number; icon: React.ReactNode }> = {
  bhag:       { label: 'BHAG',            color: 'text-gray-900', indent: 0,   icon: <Award className="h-5 w-5 text-teal-600" /> },
  '3hag':     { label: '3-Year HA Goal',  color: 'text-gray-800', indent: 1,   icon: <Layers className="h-5 w-5 text-blue-600" /> },
  annual:     { label: 'Annual Priority', color: 'text-gray-800', indent: 2,   icon: <Calendar className="h-5 w-5 text-amber-600" /> },
  quarterly:  { label: 'Quarterly',       color: 'text-gray-700', indent: 3,   icon: <Target className="h-5 w-5 text-orange-500" /> },
  regional:   { label: 'Regional',        color: 'text-gray-700', indent: 3,   icon: <Target className="h-5 w-5 text-purple-500" /> },
  clinic:     { label: 'Clinic',          color: 'text-gray-700', indent: 4,   icon: <Target className="h-5 w-5 text-gray-500" /> },
  owner:      { label: 'Owner',           color: 'text-gray-600', indent: 5,   icon: <Target className="h-5 w-5 text-gray-400" /> },
};

const DEMO_GOALS: GoalNode[] = [
  {
    id: 'bhag1', parent_id: null, goal_level: 'bhag',
    title: "Become Canada's most trusted physiotherapy network — 50 clinics, $100M revenue",
    description: "Our 10-year BHAG. Every decision must move us closer to this vision.",
    fiscal_year: 2030, quarter: null, scope_level: 'network',
    rag_status: 'green', progress_pct: 22, projected_pct: 20, unit: '%',
    target_value: 100, current_value: 22, due_date: '2030-12-31', is_active: true,
    children: [
      {
        id: 'hag1', parent_id: 'bhag1', goal_level: '3hag',
        title: 'Build a replicable clinic excellence model across 20+ locations by 2027',
        description: 'Scalable operations, clinical quality, and patient outcomes defining the network standard.',
        fiscal_year: 2027, quarter: null, scope_level: 'network',
        rag_status: 'green', progress_pct: 38, projected_pct: 35, unit: '%',
        target_value: 20, current_value: 8, due_date: '2027-12-31', is_active: true,
        children: [
          {
            id: 'ann1', parent_id: 'hag1', goal_level: 'annual',
            title: 'Achieve 87%+ provider utilization across all clinics',
            description: 'Drive operational efficiency to network benchmark level.',
            fiscal_year: 2026, quarter: null, scope_level: 'network',
            rag_status: 'yellow', progress_pct: 61, projected_pct: 70, unit: '%',
            target_value: 87, current_value: 82, due_date: '2026-12-31', is_active: true,
            children: [
              { id: 'q1', parent_id: 'ann1', goal_level: 'quarterly', title: 'Q1: Onboard EPC clinic fully — 3 providers to full schedule', description: null, fiscal_year: 2026, quarter: 1, scope_level: 'clinic', rag_status: 'yellow', progress_pct: 55, projected_pct: 75, unit: '%', target_value: null, current_value: null, due_date: '2026-03-31', is_active: true, children: [] },
              { id: 'q2', parent_id: 'ann1', goal_level: 'quarterly', title: 'Q2: Reduce schedule gaps across 5 underperforming clinics', description: null, fiscal_year: 2026, quarter: 2, scope_level: 'network', rag_status: 'not_set', progress_pct: 0, projected_pct: 0, unit: '%', target_value: null, current_value: null, due_date: '2026-06-30', is_active: true, children: [] },
            ]
          },
          {
            id: 'ann2', parent_id: 'hag1', goal_level: 'annual',
            title: 'Reduce AR days below 35 across all billing entities',
            description: 'Align revenue cycle performance to HFMA MAP Key standard.',
            fiscal_year: 2026, quarter: null, scope_level: 'network',
            rag_status: 'red', progress_pct: 40, projected_pct: 60, unit: 'days',
            target_value: 35, current_value: 44, due_date: '2026-12-31', is_active: true,
            children: [
              { id: 'q3', parent_id: 'ann2', goal_level: 'quarterly', title: 'Q1: Resolve Blue Cross denial backlog — target 80% resolution', description: null, fiscal_year: 2026, quarter: 1, scope_level: 'network', rag_status: 'red', progress_pct: 30, projected_pct: 70, unit: '%', target_value: 80, current_value: 30, due_date: '2026-03-31', is_active: true, children: [] },
            ]
          },
          {
            id: 'ann3', parent_id: 'hag1', goal_level: 'annual',
            title: 'Open 3 new clinics — South Commons, EPC flagship, 1 TBD',
            description: 'Expand network footprint.',
            fiscal_year: 2026, quarter: null, scope_level: 'network',
            rag_status: 'green', progress_pct: 67, projected_pct: 60, unit: 'clinics',
            target_value: 3, current_value: 2, due_date: '2026-12-31', is_active: true,
            children: []
          },
        ]
      }
    ]
  },
];

function ProgressBar({ pct, projected, rag }: { pct: number; projected: number; rag: string }) {
  const cfg = RAG_CONFIG[rag as keyof typeof RAG_CONFIG] ?? RAG_CONFIG.not_set;
  return (
    <div className="flex-1 relative h-3 bg-gray-100 rounded-full overflow-hidden min-w-20 max-w-40">
      <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      <div className="absolute top-0 h-full w-0.5 bg-gray-400/50" style={{ left: `${Math.min(projected, 100)}%` }} title={`Projected: ${projected}%`} />
    </div>
  );
}

function GoalNodeRow({ node, depth = 0 }: { node: GoalNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const cfg = LEVEL_CONFIG[node.goal_level] ?? LEVEL_CONFIG.owner;
  const ragCfg = RAG_CONFIG[node.rag_status as keyof typeof RAG_CONFIG] ?? RAG_CONFIG.not_set;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`group flex items-start gap-3 py-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-2 ${ragCfg.border}`}
        style={{ paddingLeft: `${(depth * 20) + 16}px` }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{cfg.label}</span>
            {node.fiscal_year && <span className="text-xs text-gray-400">FY{node.fiscal_year}</span>}
            {node.quarter && <span className="text-xs text-gray-400">Q{node.quarter}</span>}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${ragCfg.bg} ${ragCfg.text}`}>
              {node.rag_status === 'not_set' ? 'Not Set' : node.rag_status.charAt(0).toUpperCase() + node.rag_status.slice(1)}
            </span>
          </div>
          <p className={`text-sm font-medium ${cfg.color} mb-1.5 leading-snug`}>{node.title}</p>
          {node.description && <p className="text-xs text-gray-400 mb-2 line-clamp-1">{node.description}</p>}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <ProgressBar pct={node.progress_pct} projected={node.projected_pct} rag={node.rag_status} />
              <span className="text-xs font-bold text-gray-700 w-8">{node.progress_pct}%</span>
            </div>
            {node.target_value != null && node.current_value != null && (
              <span className="text-xs text-gray-500 whitespace-nowrap">{node.current_value} / {node.target_value} {node.unit}</span>
            )}
            {node.due_date && (
              <span className="text-xs text-gray-400 whitespace-nowrap">{node.due_date}</span>
            )}
          </div>
        </div>
        {hasChildren && (
          <div className="flex-shrink-0 mt-1 text-gray-400">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map(child => (
            <GoalNodeRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GoalCascadeEngine() {
  const [goals, setGoals] = useState<GoalNode[]>(DEMO_GOALS);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await enterpriseOSService.getGoalCascade();
      setGoals(data.length > 0 ? data : DEMO_GOALS);
    } catch {
      setGoals(DEMO_GOALS);
    } finally {
      setLoading(false);
    }
  }

  const allNodes = flattenGoals(goals);
  const greens = allNodes.filter(n => n.rag_status === 'green').length;
  const yellows = allNodes.filter(n => n.rag_status === 'yellow').length;
  const reds = allNodes.filter(n => n.rag_status === 'red').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-teal-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Goal Cascade Engine</h2>
            <p className="text-xs text-gray-500">BHAG → 3HAG → Annual → Quarterly → Regional → Clinic → Owner</p>
          </div>
        </div>
        <button onClick={load} className="p-1.5 text-gray-400 hover:text-gray-700">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Health summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{allNodes.length}</div>
          <div className="text-xs text-gray-500">Total Goals</div>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
          <div className="text-2xl font-bold text-emerald-700">{greens}</div>
          <div className="text-xs text-emerald-600">On Track</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
          <div className="text-2xl font-bold text-amber-700">{yellows}</div>
          <div className="text-xs text-amber-600">At Risk</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <div className="text-2xl font-bold text-red-700">{reds}</div>
          <div className="text-xs text-red-600">Off Track</div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Legend:</span>
        {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => (
          <span key={level} className="flex items-center gap-1.5">{cfg.icon}<span>{cfg.label}</span></span>
        ))}
        <span className="ml-auto text-gray-400">Bar: filled = actual · line = projected</span>
      </div>

      {/* Goal tree */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {goals.map(g => <GoalNodeRow key={g.id} node={g} depth={0} />)}
        {goals.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-400 text-sm">No goals configured yet.</div>
        )}
      </div>
    </div>
  );
}

function flattenGoals(nodes: GoalNode[]): GoalNode[] {
  return nodes.flatMap(n => [n, ...flattenGoals(n.children ?? [])]);
}
