import { supabase } from '../lib/supabase';

export interface DataQualityAlert {
  id: string;
  alert_date: string;
  alert_type: string;
  severity: string;
  affected_table: string;
  affected_module?: string;
  issue_description: string;
  records_affected?: number;
  status: string;
}

export interface ModuleAdoptionMetric {
  id: string;
  module_name: string;
  clinic_id: string;
  measurement_date: string;
  total_potential_users: number;
  active_users: number;
  adoption_rate: number;
  adoption_trend?: string;
  barriers_to_adoption?: string[];
}

export interface SystemHealthScore {
  id: string;
  measurement_date: string;
  clinic_id?: string;
  module_name?: string;
  data_quality_score: number;
  adoption_score: number;
  overall_health_score: number;
  health_grade?: string;
  critical_issues: number;
  warnings: number;
  recommendations?: string[];
}

export interface IncompleteWorkflow {
  id: string;
  workflow_name: string;
  workflow_type: string;
  clinic_id?: string;
  initiated_date: string;
  current_step?: string;
  days_stalled: number;
  blocker_description?: string;
  status: string;
}

export async function getDataQualityAlerts(): Promise<DataQualityAlert[]> {
  const { data, error } = await supabase
    .from('data_quality_alerts')
    .select('*')
    .eq('status', 'active')
    .order('severity', { ascending: false })
    .order('alert_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getModuleAdoptionMetrics(clinicId?: string): Promise<ModuleAdoptionMetric[]> {
  let query = supabase
    .from('module_adoption_metrics')
    .select('*')
    .order('measurement_date', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getSystemHealthScores(clinicId?: string): Promise<SystemHealthScore[]> {
  let query = supabase
    .from('system_health_scores')
    .select('*')
    .order('measurement_date', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getIncompleteWorkflows(clinicId?: string): Promise<IncompleteWorkflow[]> {
  let query = supabase
    .from('incomplete_workflows')
    .select('*')
    .eq('status', 'stalled')
    .order('days_stalled', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
