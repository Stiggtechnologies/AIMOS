import { supabase } from '../lib/supabase';

export interface PlaybookTemplate {
  id: string;
  playbook_name: string;
  playbook_type: string;
  category: string;
  short_description: string;
  long_description?: string;
  objectives: string[];
  difficulty?: string;
  estimated_time_hours?: number;
  estimated_budget?: number;
  required_resources?: string[];
  expected_leads?: number;
  expected_conversion_rate?: number;
  expected_revenue?: number;
  expected_roi?: number;
  best_timing?: string;
  duration_weeks?: number;
  times_used: number;
  avg_success_rating?: number;
  is_active: boolean;
  tags?: string[];
  created_at: string;
}

export interface OutreachScript {
  id: string;
  script_name: string;
  script_type: string;
  use_case: string;
  opening: string;
  body: string;
  closing: string;
  full_script: string;
  merge_fields?: Record<string, any>;
  talking_points?: string[];
  objection_handlers?: Record<string, any>;
  primary_cta?: string;
  secondary_cta?: string;
  tone?: string;
  best_time_to_use?: string;
  tips?: string[];
  times_used: number;
  avg_success_rate?: number;
  is_active: boolean;
  tags?: string[];
  created_at: string;
}

export interface EngagementChecklist {
  id: string;
  checklist_name: string;
  checklist_type: string;
  description?: string;
  recommended_start_timing?: string;
  total_duration_weeks?: number;
  tasks: Array<{
    task: string;
    week: number;
    owner?: string;
    critical: boolean;
  }>;
  success_criteria?: string[];
  common_pitfalls?: string[];
  best_practices?: string[];
  required_materials?: string[];
  helpful_links?: string[];
  times_used: number;
  avg_completion_rate?: number;
  is_active: boolean;
  tags?: string[];
  created_at: string;
}

export interface SeasonalDemandPlan {
  id: string;
  season: string;
  year: number;
  expected_demand_trend?: string;
  demand_drivers?: string[];
  recommended_playbooks?: string[];
  priority_initiatives?: string[];
  recommended_clinician_hours?: number;
  recommended_marketing_budget?: number;
  key_dates?: Record<string, any>;
  campaign_windows?: Record<string, any>;
  last_year_leads?: number;
  last_year_conversion_rate?: number;
  last_year_revenue?: number;
  market_conditions?: string;
  is_template: boolean;
  notes?: string;
  created_at: string;
}

export interface PlaybookExecution {
  id: string;
  clinic_id: string;
  playbook_template_id?: string;
  execution_name: string;
  status: string;
  start_date: string;
  planned_end_date: string;
  actual_end_date?: string;
  owner_id?: string;
  team_members?: string[];
  custom_objectives?: string[];
  custom_budget?: number;
  completion_percentage: number;
  tasks_completed: number;
  tasks_total: number;
  leads_generated: number;
  appointments_booked: number;
  revenue_generated: number;
  roi_achieved?: number;
  what_worked_well?: string;
  what_needs_improvement?: string;
  would_recommend?: boolean;
  success_rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  playbook?: PlaybookTemplate;
  owner?: {
    id: string;
    display_name: string;
  };
}

export interface GrowthPlaybooksLibrary {
  playbook_templates: PlaybookTemplate[];
  outreach_scripts: OutreachScript[];
  engagement_checklists: EngagementChecklist[];
  seasonal_plans: SeasonalDemandPlan[];
  active_executions: PlaybookExecution[];
  stats: {
    total_templates: number;
    total_scripts: number;
    total_checklists: number;
    active_executions_count: number;
    total_leads_generated: number;
    total_revenue_generated: number;
  };
}

export async function getGrowthPlaybooksLibrary(): Promise<GrowthPlaybooksLibrary> {
  const [templatesResult, scriptsResult, checklistsResult, plansResult, executionsResult] = await Promise.all([
    supabase
      .from('growth_playbook_templates')
      .select('*')
      .eq('is_active', true)
      .order('times_used', { ascending: false }),

    supabase
      .from('growth_outreach_scripts')
      .select('*')
      .eq('is_active', true)
      .order('avg_success_rate', { ascending: false }),

    supabase
      .from('growth_engagement_checklists')
      .select('*')
      .eq('is_active', true)
      .order('times_used', { ascending: false }),

    supabase
      .from('seasonal_demand_plans')
      .select('*')
      .eq('is_template', true)
      .eq('year', 2026)
      .order('season', { ascending: true }),

    supabase
      .from('playbook_executions')
      .select(`
        *,
        playbook:growth_playbook_templates(playbook_name),
        owner:user_profiles(id, display_name)
      `)
      .in('status', ['planned', 'in_progress'])
      .order('start_date', { ascending: false })
  ]);

  if (templatesResult.error) {
    console.error('Error loading templates:', templatesResult.error);
    throw templatesResult.error;
  }
  if (scriptsResult.error) {
    console.error('Error loading scripts:', scriptsResult.error);
    throw scriptsResult.error;
  }
  if (checklistsResult.error) {
    console.error('Error loading checklists:', checklistsResult.error);
    throw checklistsResult.error;
  }
  if (plansResult.error) {
    console.error('Error loading plans:', plansResult.error);
    throw plansResult.error;
  }
  if (executionsResult.error) {
    console.error('Error loading executions:', executionsResult.error);
    throw executionsResult.error;
  }

  const playbook_templates = templatesResult.data as PlaybookTemplate[];
  const outreach_scripts = scriptsResult.data as OutreachScript[];
  const engagement_checklists = checklistsResult.data as EngagementChecklist[];
  const seasonal_plans = plansResult.data as SeasonalDemandPlan[];
  const active_executions = executionsResult.data as PlaybookExecution[];

  const stats = {
    total_templates: playbook_templates.length,
    total_scripts: outreach_scripts.length,
    total_checklists: engagement_checklists.length,
    active_executions_count: active_executions.length,
    total_leads_generated: active_executions.reduce((sum, exec) => sum + exec.leads_generated, 0),
    total_revenue_generated: active_executions.reduce((sum, exec) => sum + exec.revenue_generated, 0),
  };

  return {
    playbook_templates,
    outreach_scripts,
    engagement_checklists,
    seasonal_plans,
    active_executions,
    stats,
  };
}

export async function getPlaybookTemplate(id: string): Promise<PlaybookTemplate> {
  const { data, error } = await supabase
    .from('growth_playbook_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as PlaybookTemplate;
}

export async function getOutreachScript(id: string): Promise<OutreachScript> {
  const { data, error } = await supabase
    .from('growth_outreach_scripts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as OutreachScript;
}

export async function startPlaybookExecution(
  clinicId: string,
  playbookTemplateId: string,
  executionName: string,
  startDate: string,
  plannedEndDate: string,
  ownerId: string,
  customBudget?: number
): Promise<PlaybookExecution> {
  const { data, error } = await supabase
    .from('playbook_executions')
    .insert({
      clinic_id: clinicId,
      playbook_template_id: playbookTemplateId,
      execution_name: executionName,
      status: 'planned',
      start_date: startDate,
      planned_end_date: plannedEndDate,
      owner_id: ownerId,
      custom_budget: customBudget,
      completion_percentage: 0,
      tasks_completed: 0,
      tasks_total: 0,
      leads_generated: 0,
      appointments_booked: 0,
      revenue_generated: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PlaybookExecution;
}

export async function updatePlaybookExecution(
  executionId: string,
  updates: Partial<PlaybookExecution>
): Promise<void> {
  const { error } = await supabase
    .from('playbook_executions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', executionId);

  if (error) throw error;
}
