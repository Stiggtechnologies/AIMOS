import { supabase } from '../lib/supabase';

export interface KpiDefinition {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  formula: string | null;
  unit: string;
  unit_label: string;
  frequency: string;
  higher_is_better: boolean;
  red_threshold: number | null;
  yellow_threshold: number | null;
  green_threshold: number | null;
  benchmark_source: string | null;
  benchmark_value: number | null;
  is_active: boolean;
  approved_at: string | null;
}

export interface ScorecardRow {
  id: string;
  scope_level: string;
  period_type: string;
  period_label: string;
  period_start: string;
  period_end: string;
  status: string;
  overall_rag: string;
  notes: string | null;
  created_at: string;
  scorecard_metrics?: ScorecardMetricRow[];
}

export interface ScorecardMetricRow {
  id: string;
  scorecard_id: string;
  metric_name: string;
  category: string;
  projected: number | null;
  actual: number | null;
  target: number | null;
  unit: string;
  higher_is_better: boolean;
  rag_status: string;
  owner_comment: string | null;
  recovery_plan: string | null;
  sort_order: number;
}

export interface GoalNode {
  id: string;
  parent_id: string | null;
  goal_level: string;
  title: string;
  description: string | null;
  fiscal_year: number | null;
  quarter: number | null;
  scope_level: string | null;
  rag_status: string;
  progress_pct: number;
  projected_pct: number;
  target_value: number | null;
  current_value: number | null;
  unit: string;
  due_date: string | null;
  is_active: boolean;
  children?: GoalNode[];
}

export interface MeetingTemplate {
  id: string;
  cadence_type: string;
  title: string;
  default_duration_minutes: number;
  default_agenda: AgendaItem[];
}

export interface AgendaItem {
  title: string;
  minutes: number;
}

export interface MeetingSession {
  id: string;
  cadence_type: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  attendance_count: number;
  notes: string | null;
  meeting_agenda_items?: { id: string; title: string; status: string; item_type: string; duration_minutes: number }[];
  meeting_action_items?: { id: string; title: string; status: string; priority: string; due_date: string | null }[];
}

export interface FhirSubscription {
  id: string;
  subscription_name: string;
  resource_type: string;
  event_type: string;
  filter_criteria: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface FhirEventLog {
  id: string;
  resource_type: string;
  event_type: string;
  payload: Record<string, unknown>;
  fired_at: string;
  processed: boolean;
  error_message: string | null;
  retry_count: number;
}

export const enterpriseOSService = {
  async getKpiDefinitions(): Promise<KpiDefinition[]> {
    const { data, error } = await supabase
      .from('kpi_definitions')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  async getScorecards(scopeLevel?: string, periodType?: string): Promise<ScorecardRow[]> {
    let q = supabase
      .from('scorecards')
      .select('*, scorecard_metrics(*)')
      .order('period_start', { ascending: false });
    if (scopeLevel) q = q.eq('scope_level', scopeLevel);
    if (periodType) q = q.eq('period_type', periodType);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async getGoalCascade(): Promise<GoalNode[]> {
    const { data, error } = await supabase
      .from('goal_nodes')
      .select('*')
      .eq('is_active', true)
      .order('goal_level')
      .order('created_at');
    if (error) throw error;
    const nodes: GoalNode[] = data ?? [];
    return buildTree(nodes, null);
  },

  async getMeetingTemplates(): Promise<MeetingTemplate[]> {
    const { data, error } = await supabase
      .from('meeting_templates')
      .select('*')
      .eq('is_active', true)
      .order('cadence_type');
    if (error) throw error;
    return data ?? [];
  },

  async getMeetingSessions(cadenceType?: string): Promise<MeetingSession[]> {
    let q = supabase
      .from('meeting_sessions')
      .select('*, meeting_agenda_items(*), meeting_action_items(*)')
      .order('scheduled_at', { ascending: false })
      .limit(20);
    if (cadenceType) q = q.eq('cadence_type', cadenceType);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async getFhirSubscriptions(): Promise<FhirSubscription[]> {
    const { data, error } = await supabase
      .from('fhir_event_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getFhirEventLog(limit = 50): Promise<FhirEventLog[]> {
    const { data, error } = await supabase
      .from('fhir_event_log')
      .select('*')
      .order('fired_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async toggleFhirSubscription(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('fhir_event_subscriptions')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  computeRag(actual: number, target: number, higherIsBetter: boolean, redThreshold: number, yellowThreshold: number): string {
    if (higherIsBetter) {
      if (actual >= yellowThreshold) return 'green';
      if (actual >= redThreshold) return 'yellow';
      return 'red';
    } else {
      if (actual <= yellowThreshold) return 'green';
      if (actual <= redThreshold) return 'yellow';
      return 'red';
    }
  },

  computeVariance(actual: number | null, projected: number | null): number | null {
    if (actual == null || projected == null) return null;
    return actual - projected;
  },

  computeVariancePct(actual: number | null, projected: number | null): number | null {
    if (actual == null || projected == null || projected === 0) return null;
    return Math.round(((actual - projected) / Math.abs(projected)) * 1000) / 10;
  },
};

function buildTree(nodes: GoalNode[], parentId: string | null): GoalNode[] {
  return nodes
    .filter(n => n.parent_id === parentId)
    .map(n => ({ ...n, children: buildTree(nodes, n.id) }));
}
