import { supabase } from '../lib/supabase';
import type { ClinicIntegration, IntegrationTask } from '../types/aim-os';

export async function getClinicIntegrations() {
  const { data, error } = await supabase
    .from('clinic_integrations')
    .select(`
      *,
      clinic:clinics(*)
    `)
    .order('integration_start_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getIntegrationTasks(integrationId: string) {
  const { data, error } = await supabase
    .from('integration_tasks')
    .select('*')
    .eq('integration_id', integrationId)
    .order('milestone')
    .order('priority', { ascending: false });

  if (error) throw error;
  return data as IntegrationTask[];
}

export async function createClinicIntegration(integration: Omit<ClinicIntegration, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('clinic_integrations')
    .insert([integration])
    .select()
    .single();

  if (error) throw error;
  return data as ClinicIntegration;
}

export async function updateClinicIntegration(id: string, updates: Partial<ClinicIntegration>) {
  const { data, error } = await supabase
    .from('clinic_integrations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ClinicIntegration;
}

export async function createIntegrationTask(task: Omit<IntegrationTask, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('integration_tasks')
    .insert([task])
    .select()
    .single();

  if (error) throw error;
  return data as IntegrationTask;
}

export async function updateIntegrationTask(id: string, updates: Partial<IntegrationTask>) {
  const { data, error} = await supabase
    .from('integration_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as IntegrationTask;
}

export async function getIntegrationChecklists(integrationId: string) {
  const { data, error } = await supabase
    .from('integration_checklists')
    .select('*')
    .eq('integration_id', integrationId)
    .order('milestone', { ascending: true });

  if (error) return [];
  return data;
}

export async function getChecklistItems(checklistId: string) {
  const { data, error } = await supabase
    .from('integration_checklist_items')
    .select('*')
    .eq('checklist_id', checklistId)
    .order('priority', { ascending: true });

  if (error) return [];
  return data;
}

export async function getSOPAdoption(integrationId: string) {
  const { data, error } = await supabase
    .from('integration_sop_adoption')
    .select('*')
    .eq('integration_id', integrationId)
    .order('is_critical_sop', { ascending: false });

  if (error) return [];
  return data;
}

export async function getPerformanceMetrics(integrationId: string) {
  const { data, error } = await supabase
    .from('performance_normalization_metrics')
    .select('*')
    .eq('integration_id', integrationId)
    .order('metric_category', { ascending: true });

  if (error) return [];
  return data;
}

export async function getCulturalTasks(integrationId: string) {
  const { data, error } = await supabase
    .from('cultural_alignment_tasks')
    .select('*')
    .eq('integration_id', integrationId)
    .order('scheduled_date', { ascending: true });

  if (error) return [];
  return data;
}

export async function getIntegrationMilestones(integrationId: string) {
  const { data, error } = await supabase
    .from('integration_milestones')
    .select('*')
    .eq('integration_id', integrationId)
    .order('target_date', { ascending: true });

  if (error) return [];
  return data;
}

export async function getTeamMembers(integrationId: string) {
  const { data, error } = await supabase
    .from('integration_team_members')
    .select('*')
    .eq('integration_id', integrationId)
    .eq('is_active', true)
    .order('role', { ascending: true });

  if (error) return [];
  return data;
}

export async function getIntegrationDashboard(integrationId: string) {
  const [
    integration,
    checklists,
    tasks,
    sopAdoption,
    metrics,
    culturalTasks,
    milestones,
    teamMembers,
  ] = await Promise.all([
    supabase.from('clinic_integrations').select('*, clinic:clinics(*)').eq('id', integrationId).maybeSingle(),
    getIntegrationChecklists(integrationId),
    getIntegrationTasks(integrationId),
    getSOPAdoption(integrationId),
    getPerformanceMetrics(integrationId),
    getCulturalTasks(integrationId),
    getIntegrationMilestones(integrationId),
    getTeamMembers(integrationId),
  ]);

  if (!integration.data) return null;

  const day0Checklists = checklists.filter((c: any) => c.milestone === 'day_0');
  const day30Checklists = checklists.filter((c: any) => c.milestone === 'day_30');
  const day90Checklists = checklists.filter((c: any) => c.milestone === 'day_90');
  const ongoingChecklists = checklists.filter((c: any) => c.milestone === 'ongoing');

  const totalTasks = checklists.reduce((sum: number, c: any) => sum + (c.total_items || 0), 0);
  const completedTasks = checklists.reduce((sum: number, c: any) => sum + (c.completed_items || 0), 0);
  const blockedTasks = checklists.reduce((sum: number, c: any) => sum + (c.blocked_items || 0), 0);

  const criticalSops = sopAdoption.filter((s: any) => s.is_critical_sop).length;
  const adoptedSops = sopAdoption.filter((s: any) => s.adoption_status === 'adopted' || s.adoption_status === 'verified').length;

  const metricsOnTrack = metrics.filter((m: any) => m.status === 'on_track' || m.status === 'achieved').length;
  const metricsAtRisk = metrics.filter((m: any) => m.status === 'at_risk' || m.status === 'off_track').length;

  const culturalCompleted = culturalTasks.filter((t: any) => t.status === 'completed').length;

  return {
    project: integration.data,
    checklists: {
      day_0: day0Checklists,
      day_30: day30Checklists,
      day_90: day90Checklists,
      ongoing: ongoingChecklists,
    },
    tasks,
    sop_adoption: sopAdoption,
    performance_metrics: metrics,
    cultural_tasks: culturalTasks,
    milestones,
    team_members: teamMembers,
    summary: {
      overall_completion: integration.data.progress_percent || 0,
      day_0_status: integration.data.day_0_completion_date ? 'completed' : 'in_progress',
      day_30_status: integration.data.day_30_completion_date ? 'completed' : 'pending',
      day_90_status: integration.data.day_90_completion_date ? 'completed' : 'pending',
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      blocked_tasks: blockedTasks,
      critical_sops: criticalSops,
      adopted_sops: adoptedSops,
      metrics_on_track: metricsOnTrack,
      metrics_at_risk: metricsAtRisk,
      cultural_tasks_completed: culturalCompleted,
      team_size: teamMembers.length,
    },
  };
}
