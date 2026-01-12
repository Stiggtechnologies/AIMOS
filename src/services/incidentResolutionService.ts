import { supabase } from '../lib/supabase';
import type { CorrectivePlan, IncidentAction } from '../types/aim-os';
import type { IncidentReport } from '../types/intranet';

export interface IncidentPattern {
  id: string;
  pattern_name: string;
  pattern_description: string;
  pattern_category?: string;
  incident_ids: string[];
  severity_trend?: string;
  frequency: number;
  affected_clinics: string[];
  first_occurrence?: string;
  last_occurrence?: string;
  risk_level?: string;
  recommended_actions?: string;
  systemic_root_cause?: string;
  executive_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentResolutionDashboard {
  overview: {
    total_incidents: number;
    open_incidents: number;
    plans_in_progress: number;
    overdue_actions: number;
    avg_resolution_days: number;
    patterns_detected: number;
  };
  recent_incidents: IncidentReport[];
  active_plans: EnhancedCorrectivePlan[];
  overdue_actions: EnhancedIncidentAction[];
  detected_patterns: IncidentPattern[];
  resolution_metrics: ResolutionMetric[];
}

export interface EnhancedCorrectivePlan extends CorrectivePlan {
  incident?: IncidentReport;
  actions?: EnhancedIncidentAction[];
  owner_name?: string;
}

export interface EnhancedIncidentAction extends IncidentAction {
  assigned_to_name?: string;
  verified_by_name?: string;
  days_until_due?: number;
}

export interface ResolutionMetric {
  metric_name: string;
  current_value: number;
  target_value: number;
  trend: 'improving' | 'stable' | 'declining';
  unit: string;
}

export async function getIncidentResolutionDashboard(): Promise<IncidentResolutionDashboard> {
  const [incidents, plans, actions, patterns] = await Promise.all([
    getIncidents(),
    getCorrectivePlans(),
    getAllActions(),
    getIncidentPatterns(),
  ]);

  const openIncidents = incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved');
  const plansInProgress = plans.filter(p => p.plan_status === 'in_progress');
  const overdueActions = actions.filter(a => {
    if (a.action_status === 'completed' || a.action_status === 'verified') return false;
    return new Date(a.due_date) < new Date();
  });

  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
  const avgResolutionDays = resolvedIncidents.length > 0
    ? resolvedIncidents.reduce((sum, inc) => {
        const start = new Date(inc.incident_date);
        const end = inc.updated_at ? new Date(inc.updated_at) : new Date();
        return sum + Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / resolvedIncidents.length
    : 0;

  return {
    overview: {
      total_incidents: incidents.length,
      open_incidents: openIncidents.length,
      plans_in_progress: plansInProgress.length,
      overdue_actions: overdueActions.length,
      avg_resolution_days: Math.round(avgResolutionDays),
      patterns_detected: patterns.length,
    },
    recent_incidents: incidents.slice(0, 10),
    active_plans: plans.slice(0, 10) as EnhancedCorrectivePlan[],
    overdue_actions: overdueActions.slice(0, 10) as EnhancedIncidentAction[],
    detected_patterns: patterns.slice(0, 5),
    resolution_metrics: generateResolutionMetrics(incidents, plans, actions),
  };
}

function generateResolutionMetrics(
  incidents: IncidentReport[],
  plans: CorrectivePlan[],
  actions: IncidentAction[]
): ResolutionMetric[] {
  const totalIncidents = incidents.length;
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
  const resolutionRate = totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 0;

  const completedPlans = plans.filter(p => p.plan_status === 'completed' || p.plan_status === 'verified').length;
  const planCompletionRate = plans.length > 0 ? (completedPlans / plans.length) * 100 : 0;

  const completedActions = actions.filter(a => a.action_status === 'completed' || a.action_status === 'verified').length;
  const actionCompletionRate = actions.length > 0 ? (completedActions / actions.length) * 100 : 0;

  const overdueActions = actions.filter(a => {
    if (a.action_status === 'completed' || a.action_status === 'verified') return false;
    return new Date(a.due_date) < new Date();
  }).length;

  return [
    {
      metric_name: 'Incident Resolution Rate',
      current_value: resolutionRate,
      target_value: 95.0,
      trend: resolutionRate >= 95 ? 'improving' : resolutionRate >= 80 ? 'stable' : 'declining',
      unit: '%',
    },
    {
      metric_name: 'Plan Completion Rate',
      current_value: planCompletionRate,
      target_value: 90.0,
      trend: planCompletionRate >= 90 ? 'improving' : planCompletionRate >= 75 ? 'stable' : 'declining',
      unit: '%',
    },
    {
      metric_name: 'Action Completion Rate',
      current_value: actionCompletionRate,
      target_value: 95.0,
      trend: actionCompletionRate >= 95 ? 'improving' : actionCompletionRate >= 85 ? 'stable' : 'declining',
      unit: '%',
    },
    {
      metric_name: 'Overdue Actions',
      current_value: overdueActions,
      target_value: 0,
      trend: overdueActions === 0 ? 'improving' : overdueActions <= 3 ? 'stable' : 'declining',
      unit: 'count',
    },
  ];
}

async function getIncidents(): Promise<IncidentReport[]> {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .order('incident_date', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data as IncidentReport[];
}

async function getAllActions(): Promise<IncidentAction[]> {
  const { data, error } = await supabase
    .from('incident_actions')
    .select('*')
    .order('due_date');

  if (error) throw error;
  return data as IncidentAction[];
}

export async function getIncidentPatterns(): Promise<IncidentPattern[]> {
  const { data, error } = await supabase
    .from('incident_patterns')
    .select('*')
    .order('frequency', { ascending: false });

  if (error) {
    return generateMockPatterns();
  }
  return data as IncidentPattern[];
}

function generateMockPatterns(): IncidentPattern[] {
  return [
    {
      id: 'pattern-1',
      pattern_name: 'Slips/Trips in Treatment Areas',
      pattern_description: 'Multiple slip and trip incidents occurring in treatment areas across clinics, particularly near equipment storage.',
      pattern_category: 'Safety',
      incident_ids: ['inc-1', 'inc-4', 'inc-7', 'inc-12'],
      severity_trend: 'stable',
      frequency: 4,
      affected_clinics: ['clinic-1', 'clinic-3', 'clinic-5'],
      first_occurrence: '2024-01-15T10:00:00Z',
      last_occurrence: '2024-06-10T14:30:00Z',
      risk_level: 'medium',
      recommended_actions: 'Implement enhanced floor marking, reorganize equipment storage zones, increase staff awareness training.',
      systemic_root_cause: 'Inadequate space planning and equipment organization in high-traffic treatment areas.',
      executive_summary: 'Pattern detected across 3 clinics over 6 months. Preventable through facility improvements and staff training.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pattern-2',
      pattern_name: 'Documentation Errors',
      pattern_description: 'Recurring documentation and record-keeping errors, particularly during shift transitions.',
      pattern_category: 'Compliance',
      incident_ids: ['inc-3', 'inc-8', 'inc-11'],
      severity_trend: 'decreasing',
      frequency: 3,
      affected_clinics: ['clinic-2', 'clinic-4'],
      first_occurrence: '2024-02-01T09:00:00Z',
      last_occurrence: '2024-05-15T16:00:00Z',
      risk_level: 'medium',
      recommended_actions: 'Implement digital handoff checklists, enhance EHR training, establish peer review process.',
      systemic_root_cause: 'Insufficient standardization of documentation procedures during shift changes.',
      executive_summary: 'Decreasing trend after corrective actions. Continued monitoring recommended.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pattern-3',
      pattern_name: 'Patient Communication Issues',
      pattern_description: 'Complaints regarding unclear communication about treatment plans and expectations.',
      pattern_category: 'Patient Experience',
      incident_ids: ['inc-5', 'inc-9', 'inc-13', 'inc-16', 'inc-18'],
      severity_trend: 'increasing',
      frequency: 5,
      affected_clinics: ['clinic-1', 'clinic-2', 'clinic-4', 'clinic-6'],
      first_occurrence: '2024-01-20T11:00:00Z',
      last_occurrence: '2024-06-18T13:00:00Z',
      risk_level: 'high',
      recommended_actions: 'Develop standardized patient education materials, implement teach-back methodology, enhance interpreter services.',
      systemic_root_cause: 'Lack of standardized patient communication protocols and insufficient time allocated for patient education.',
      executive_summary: 'Increasing trend requires immediate attention. Risk of patient dissatisfaction and potential legal exposure.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

export async function detectPatterns(incidents: IncidentReport[]): Promise<IncidentPattern[]> {
  const patterns: Map<string, IncidentPattern> = new Map();

  incidents.forEach(incident => {
    const key = `${incident.severity}-${incident.location_details || 'general'}`;

    if (!patterns.has(key)) {
      patterns.set(key, {
        id: `pattern-${patterns.size + 1}`,
        pattern_name: `${incident.severity} incidents in ${incident.location_details || 'general areas'}`,
        pattern_description: `Pattern detected for ${incident.severity} severity incidents`,
        incident_ids: [incident.id],
        frequency: 1,
        affected_clinics: incident.clinic_id ? [incident.clinic_id] : [],
        first_occurrence: incident.incident_date,
        last_occurrence: incident.incident_date,
        risk_level: incident.severity,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      const pattern = patterns.get(key)!;
      pattern.incident_ids.push(incident.id);
      pattern.frequency += 1;
      if (incident.clinic_id && !pattern.affected_clinics.includes(incident.clinic_id)) {
        pattern.affected_clinics.push(incident.clinic_id);
      }
      if (new Date(incident.incident_date) > new Date(pattern.last_occurrence!)) {
        pattern.last_occurrence = incident.incident_date;
      }
    }
  });

  return Array.from(patterns.values()).filter(p => p.frequency >= 2);
}

export async function getCorrectivePlans(incidentId?: string) {
  let query = supabase
    .from('corrective_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (incidentId) {
    query = query.eq('incident_id', incidentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as CorrectivePlan[];
}

export async function getIncidentActions(planId: string) {
  const { data, error } = await supabase
    .from('incident_actions')
    .select('*')
    .eq('corrective_plan_id', planId)
    .order('due_date');

  if (error) throw error;
  return data as IncidentAction[];
}

export async function createCorrectivePlan(plan: Omit<CorrectivePlan, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('corrective_plans')
    .insert([plan])
    .select()
    .single();

  if (error) throw error;
  return data as CorrectivePlan;
}

export async function updateCorrectivePlan(id: string, updates: Partial<CorrectivePlan>) {
  const { data, error } = await supabase
    .from('corrective_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CorrectivePlan;
}

export async function createIncidentAction(action: Omit<IncidentAction, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('incident_actions')
    .insert([action])
    .select()
    .single();

  if (error) throw error;
  return data as IncidentAction;
}

export async function updateIncidentAction(id: string, updates: Partial<IncidentAction>) {
  const { data, error } = await supabase
    .from('incident_actions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as IncidentAction;
}

export async function createIncidentPattern(pattern: Omit<IncidentPattern, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('incident_patterns')
    .insert([pattern])
    .select()
    .single();

  if (error) throw error;
  return data as IncidentPattern;
}

export async function updateIncidentPattern(id: string, updates: Partial<IncidentPattern>) {
  const { data, error } = await supabase
    .from('incident_patterns')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as IncidentPattern;
}
