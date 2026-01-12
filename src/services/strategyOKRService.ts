import { supabase } from '../lib/supabase';

export interface StrategicPriority {
  id: string;
  priority_number: string;
  fiscal_year: number;
  title: string;
  description: string;
  category: string;
  owner_user_id?: string;
  priority_level: string;
  status: string;
  target_impact?: string;
  success_metrics?: any;
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  percent_complete: number;
  created_at: string;
  updated_at: string;
}

export interface Objective {
  id: string;
  objective_number: string;
  strategic_priority_id?: string;
  fiscal_year: number;
  fiscal_quarter: number;
  title: string;
  description: string;
  owner_user_id?: string;
  clinic_id?: string;
  category: string;
  status: string;
  confidence_level: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  strategic_priority?: StrategicPriority;
  key_results?: KeyResult[];
}

export interface KeyResult {
  id: string;
  objective_id: string;
  key_result_number: string;
  title: string;
  description?: string;
  metric_type: string;
  baseline_value: number;
  target_value: number;
  current_value: number;
  unit?: string;
  owner_user_id?: string;
  status: string;
  progress_percent: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface Initiative {
  id: string;
  objective_id: string;
  key_result_id?: string;
  initiative_number: string;
  title: string;
  description?: string;
  owner_user_id?: string;
  status: string;
  priority: string;
  effort_estimate?: string;
  start_date?: string;
  due_date?: string;
  completion_date?: string;
  percent_complete: number;
  blockers?: string[];
  created_at: string;
  updated_at: string;
}

export interface OKRCheckIn {
  id: string;
  objective_id: string;
  check_in_date: string;
  submitted_by_user_id?: string;
  confidence_level: number;
  overall_status: string;
  accomplishments?: string;
  challenges?: string;
  next_steps?: string;
  support_needed?: string;
  created_at: string;
}

export interface ClinicAlignment {
  id: string;
  clinic_id: string;
  strategic_priority_id?: string;
  objective_id?: string;
  fiscal_year: number;
  fiscal_quarter: number;
  alignment_strength: string;
  contribution_description?: string;
  local_initiatives_count: number;
  created_at: string;
  updated_at: string;
}

export async function getStrategicPriorities(fiscalYear?: number): Promise<StrategicPriority[]> {
  let query = supabase
    .from('strategic_priorities')
    .select('*')
    .order('fiscal_year', { ascending: false })
    .order('priority_level', { ascending: true });

  if (fiscalYear) {
    query = query.eq('fiscal_year', fiscalYear);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getActiveStrategicPriorities(): Promise<StrategicPriority[]> {
  const { data, error } = await supabase
    .from('strategic_priorities')
    .select('*')
    .in('status', ['active', 'on_track', 'at_risk'])
    .order('priority_level', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getObjectives(fiscalYear?: number, fiscalQuarter?: number): Promise<Objective[]> {
  let query = supabase
    .from('objectives')
    .select(`
      *,
      strategic_priority:strategic_priorities(*)
    `)
    .order('fiscal_year', { ascending: false })
    .order('fiscal_quarter', { ascending: false });

  if (fiscalYear) {
    query = query.eq('fiscal_year', fiscalYear);
  }

  if (fiscalQuarter) {
    query = query.eq('fiscal_quarter', fiscalQuarter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getObjectivesByClinic(clinicId: string): Promise<Objective[]> {
  const { data, error } = await supabase
    .from('objectives')
    .select(`
      *,
      strategic_priority:strategic_priorities(*)
    `)
    .eq('clinic_id', clinicId)
    .order('fiscal_year', { ascending: false })
    .order('fiscal_quarter', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getActiveObjectives(): Promise<Objective[]> {
  const { data, error } = await supabase
    .from('objectives')
    .select(`
      *,
      strategic_priority:strategic_priorities(*)
    `)
    .eq('status', 'active')
    .order('fiscal_year', { ascending: false })
    .order('fiscal_quarter', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getObjectiveWithKeyResults(objectiveId: string): Promise<Objective | null> {
  const { data, error } = await supabase
    .from('objectives')
    .select(`
      *,
      strategic_priority:strategic_priorities(*),
      key_results(*)
    `)
    .eq('id', objectiveId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getKeyResultsByObjective(objectiveId: string): Promise<KeyResult[]> {
  const { data, error } = await supabase
    .from('key_results')
    .select('*')
    .eq('objective_id', objectiveId)
    .order('key_result_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getInitiativesByObjective(objectiveId: string): Promise<Initiative[]> {
  const { data, error } = await supabase
    .from('initiatives')
    .select('*')
    .eq('objective_id', objectiveId)
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveInitiatives(): Promise<Initiative[]> {
  const { data, error } = await supabase
    .from('initiatives')
    .select('*')
    .in('status', ['planning', 'in_progress'])
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getOKRCheckIns(objectiveId?: string): Promise<OKRCheckIn[]> {
  let query = supabase
    .from('okr_check_ins')
    .select('*')
    .order('check_in_date', { ascending: false });

  if (objectiveId) {
    query = query.eq('objective_id', objectiveId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getClinicAlignments(clinicId?: string, fiscalYear?: number, fiscalQuarter?: number): Promise<ClinicAlignment[]> {
  let query = supabase
    .from('clinic_alignment')
    .select('*')
    .order('fiscal_year', { ascending: false })
    .order('fiscal_quarter', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  if (fiscalYear) {
    query = query.eq('fiscal_year', fiscalYear);
  }

  if (fiscalQuarter) {
    query = query.eq('fiscal_quarter', fiscalQuarter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function calculateOKRMetrics() {
  const priorities = await getStrategicPriorities();
  const objectives = await getObjectives();
  const activeObjectives = objectives.filter(o => o.status === 'active');
  const initiatives = await getActiveInitiatives();

  const activePriorities = priorities.filter(p => ['active', 'on_track', 'at_risk'].includes(p.status));

  const avgPriorityProgress = activePriorities.length > 0
    ? activePriorities.reduce((sum, p) => sum + p.percent_complete, 0) / activePriorities.length
    : 0;

  const avgConfidence = activeObjectives.length > 0
    ? activeObjectives.reduce((sum, o) => sum + o.confidence_level, 0) / activeObjectives.length
    : 0;

  const onTrackObjectives = activeObjectives.filter(o => o.confidence_level >= 7).length;
  const atRiskObjectives = activeObjectives.filter(o => o.confidence_level >= 4 && o.confidence_level < 7).length;
  const behindObjectives = activeObjectives.filter(o => o.confidence_level < 4).length;

  return {
    totalPriorities: priorities.length,
    activePriorities: activePriorities.length,
    totalObjectives: objectives.length,
    activeObjectives: activeObjectives.length,
    totalInitiatives: initiatives.length,
    avgPriorityProgress,
    avgConfidence,
    onTrackObjectives,
    atRiskObjectives,
    behindObjectives,
  };
}
