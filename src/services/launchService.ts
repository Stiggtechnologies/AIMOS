import { supabase } from '../lib/supabase';

export type LaunchStatus = 'planning' | 'approved' | 'in_progress' | 'delayed' | 'at_risk' | 'completed' | 'cancelled';
export type PhaseName = 'phase_0_deal_authorization' | 'phase_1_site_build_compliance' | 'phase_2_staffing_credentialing' | 'phase_3_systems_ops_readiness' | 'phase_4_go_live' | 'phase_5_stabilization';
export type PhaseStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'skipped';
export type WorkstreamType = 'real_estate_build' | 'compliance_licensing' | 'staffing_credentials' | 'systems_it' | 'clinical_ops' | 'marketing_outreach';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'identified' | 'assessing' | 'mitigating' | 'monitoring' | 'resolved' | 'accepted';

export interface ClinicLaunch {
  id: string;
  clinic_id: string;
  launch_name: string;
  launch_code: string;
  launch_owner_id: string;
  launch_owner_role?: string;
  executive_sponsor_id?: string;
  target_open_date: string;
  planned_start_date: string;
  actual_start_date?: string;
  actual_open_date?: string;
  stabilization_target_date?: string;
  stabilization_actual_date?: string;
  current_phase: PhaseName;
  status: LaunchStatus;
  approved_budget?: number;
  actual_cost: number;
  overall_completion_pct: number;
  days_to_open?: number;
  is_partner_clinic?: boolean;
  launch_plan_type?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LaunchPhase {
  id: string;
  clinic_launch_id: string;
  phase_name: PhaseName;
  phase_order: number;
  status: PhaseStatus;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  gate_passed: boolean;
  gate_passed_at?: string;
  gate_passed_by?: string;
  gate_notes?: string;
  completion_pct: number;
}

export interface LaunchWorkstream {
  id: string;
  clinic_launch_id: string;
  workstream_type: WorkstreamType;
  workstream_name: string;
  description?: string;
  owner_id?: string;
  owner_role?: string;
  status: PhaseStatus;
  total_tasks: number;
  completed_tasks: number;
  completion_pct: number;
  start_date?: string;
  target_end_date?: string;
  actual_end_date?: string;
}

export interface LaunchTask {
  id: string;
  clinic_launch_id: string;
  workstream_id?: string;
  phase_name?: PhaseName;
  task_name: string;
  description?: string;
  is_required: boolean;
  is_gate_blocker: boolean;
  assigned_to?: string;
  assigned_role?: string;
  due_date?: string;
  start_date?: string;
  completed_date?: string;
  status: PhaseStatus;
  completion_pct: number;
  depends_on_task_ids: string[];
  blocks_task_ids: string[];
  estimated_hours?: number;
  actual_hours?: number;
  notes?: string;
}

export interface LaunchRisk {
  id: string;
  clinic_launch_id: string;
  phase_name?: PhaseName;
  workstream_id?: string;
  risk_title: string;
  risk_description: string;
  severity: RiskSeverity;
  probability?: string;
  impact_description?: string;
  status: RiskStatus;
  identified_by?: string;
  owner_id?: string;
  mitigation_plan?: string;
  mitigation_actions: any[];
  identified_date: string;
  target_resolution_date?: string;
  resolved_date?: string;
  ai_detected: boolean;
  ai_confidence?: number;
}

export interface LaunchKPI {
  id: string;
  clinic_launch_id: string;
  metric_name: string;
  metric_category?: string;
  metric_value: number;
  metric_unit?: string;
  measurement_date: string;
  phase_name?: PhaseName;
  target_value?: number;
  is_on_target?: boolean;
  notes?: string;
}

export interface LaunchWeek {
  id: string;
  clinic_launch_id: string;
  phase_id?: string;
  week_number: number;
  week_label: string;
  start_day: number;
  end_day: number;
  week_objective: string;
  key_actions: string[];
  status: PhaseStatus;
  completion_pct: number;
  actual_start_date?: string;
  actual_end_date?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LaunchDeliverable {
  id: string;
  clinic_launch_id: string;
  week_id?: string;
  deliverable_name: string;
  deliverable_description?: string;
  is_critical: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'not_applicable';
  due_day?: number;
  completed_at?: string;
  completed_by?: string;
  evidence_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LaunchDailyMetric {
  id: string;
  clinic_launch_id: string;
  partner_clinic_id?: string;
  metric_date: string;
  day_number: number;
  patients_treated_today: number;
  cumulative_patients: number;
  new_conversions_today: number;
  clinician_utilization_pct?: number;
  data_completeness_pct?: number;
  avg_intake_to_first_visit_days?: number;
  episode_of_care_compliance_pct?: number;
  source_attribution_pct?: number;
  revenue_today?: number;
  cumulative_revenue?: number;
  revenue_per_patient?: number;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LaunchTargetMetric {
  id: string;
  clinic_launch_id: string;
  week_id: string;
  metric_name: string;
  target_value: number;
  target_operator: '>=' | '<=' | '=' | '>' | '<';
  unit?: string;
  is_critical: boolean;
  created_at: string;
}

export interface LaunchStatusSummary {
  current_day: number;
  current_week: number;
  total_weeks: number;
  completed_weeks: number;
  total_deliverables: number;
  completed_deliverables: number;
  blocked_deliverables: number;
  latest_metrics?: LaunchDailyMetric;
}

class LaunchService {
  async getAllLaunches(): Promise<ClinicLaunch[]> {
    const { data, error } = await supabase
      .from('clinic_launches')
      .select(`
        *,
        clinics (name, city, province)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getLaunch(launchId: string): Promise<ClinicLaunch | null> {
    return this.getLaunchById(launchId);
  }

  async getLaunchById(launchId: string): Promise<ClinicLaunch | null> {
    const { data, error } = await supabase
      .from('clinic_launches')
      .select(`
        *,
        clinics (name, city, province)
      `)
      .eq('id', launchId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createLaunchFromTemplate(params: {
    clinic_id: string;
    launch_name: string;
    launch_code: string;
    launch_owner_id: string;
    target_open_date: string;
    approved_budget?: number;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('create_launch_from_template', {
      p_clinic_id: params.clinic_id,
      p_launch_name: params.launch_name,
      p_launch_code: params.launch_code,
      p_launch_owner_id: params.launch_owner_id,
      p_target_open_date: params.target_open_date,
      p_approved_budget: params.approved_budget || null,
    });

    if (error) throw error;
    return data;
  }

  async updateLaunch(launchId: string, updates: Partial<ClinicLaunch>): Promise<ClinicLaunch> {
    const { data, error } = await supabase
      .from('clinic_launches')
      .update(updates)
      .eq('id', launchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPhases(launchId: string): Promise<LaunchPhase[]> {
    const { data, error } = await supabase
      .from('launch_phases')
      .select('*')
      .eq('clinic_launch_id', launchId)
      .order('phase_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async validatePhaseGate(phaseId: string): Promise<any> {
    const { data, error } = await supabase.rpc('validate_phase_gate', {
      p_phase_id: phaseId,
    });

    if (error) throw error;
    return data;
  }

  async passPhaseGate(phaseId: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('launch_phases')
      .update({
        gate_passed: true,
        gate_passed_at: new Date().toISOString(),
        gate_passed_by: (await supabase.auth.getUser()).data.user?.id,
        gate_notes: notes,
        status: 'completed',
        actual_end_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', phaseId);

    if (error) throw error;
  }

  async getWorkstreams(launchId: string): Promise<LaunchWorkstream[]> {
    const { data, error } = await supabase
      .from('launch_workstreams')
      .select('*')
      .eq('clinic_launch_id', launchId)
      .order('workstream_type', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateWorkstream(workstreamId: string, updates: Partial<LaunchWorkstream>): Promise<LaunchWorkstream> {
    const { data, error } = await supabase
      .from('launch_workstreams')
      .update(updates)
      .eq('id', workstreamId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTasks(launchId: string, filters?: {
    workstream_id?: string;
    phase_name?: PhaseName;
    assigned_to?: string;
    status?: PhaseStatus;
  }): Promise<LaunchTask[]> {
    let query = supabase
      .from('launch_tasks')
      .select('*')
      .eq('clinic_launch_id', launchId);

    if (filters?.workstream_id) {
      query = query.eq('workstream_id', filters.workstream_id);
    }
    if (filters?.phase_name) {
      query = query.eq('phase_name', filters.phase_name);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('due_date', { ascending: true, nullsFirst: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createTask(task: Omit<LaunchTask, 'id' | 'created_at' | 'updated_at'>): Promise<LaunchTask> {
    const { data, error } = await supabase
      .from('launch_tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(taskId: string, updates: Partial<LaunchTask>): Promise<LaunchTask> {
    const { data, error } = await supabase
      .from('launch_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    if (updates.status === 'completed' && !updates.completed_date) {
      await this.updateTask(taskId, {
        completed_date: new Date().toISOString().split('T')[0],
        completion_pct: 100,
      });
    }

    return data;
  }

  async getOverdueTasks(launchId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_overdue_tasks', {
      p_launch_id: launchId,
    });

    if (error) throw error;
    return data || [];
  }

  async getRisks(launchId: string, filters?: {
    severity?: RiskSeverity;
    status?: RiskStatus;
    phase_name?: PhaseName;
  }): Promise<LaunchRisk[]> {
    let query = supabase
      .from('launch_risks')
      .select('*')
      .eq('clinic_launch_id', launchId);

    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.phase_name) {
      query = query.eq('phase_name', filters.phase_name);
    }

    query = query.order('severity', { ascending: false });
    query = query.order('identified_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getCriticalRisks(launchId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_critical_risks', {
      p_launch_id: launchId,
    });

    if (error) throw error;
    return data || [];
  }

  async createRisk(risk: Omit<LaunchRisk, 'id' | 'created_at' | 'updated_at'>): Promise<LaunchRisk> {
    const { data, error } = await supabase
      .from('launch_risks')
      .insert(risk)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRisk(riskId: string, updates: Partial<LaunchRisk>): Promise<LaunchRisk> {
    const { data, error } = await supabase
      .from('launch_risks')
      .update(updates)
      .eq('id', riskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getLaunchBlockers(launchId: string): Promise<any> {
    const { data, error} = await supabase.rpc('get_launch_blockers', {
      p_launch_id: launchId,
    });

    if (error) throw error;
    return data;
  }

  async updateLaunchProgress(launchId: string): Promise<void> {
    const { error } = await supabase.rpc('update_launch_progress', {
      p_launch_id: launchId,
    });

    if (error) throw error;
  }

  async recordKPI(kpi: Omit<LaunchKPI, 'id' | 'recorded_at'>): Promise<LaunchKPI> {
    const { data, error } = await supabase
      .from('launch_kpis')
      .insert(kpi)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getKPIs(launchId: string, metricName?: string): Promise<LaunchKPI[]> {
    let query = supabase
      .from('launch_kpis')
      .select('*')
      .eq('clinic_launch_id', launchId)
      .order('measurement_date', { ascending: false });

    if (metricName) {
      query = query.eq('metric_name', metricName);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  getPhaseDisplayName(phaseName: PhaseName): string {
    const names: Record<PhaseName, string> = {
      phase_0_deal_authorization: 'Phase 0: Deal & Authorization',
      phase_1_site_build_compliance: 'Phase 1: Site, Build & Compliance',
      phase_2_staffing_credentialing: 'Phase 2: Staffing & Credentialing',
      phase_3_systems_ops_readiness: 'Phase 3: Systems & Ops Readiness',
      phase_4_go_live: 'Phase 4: Go-Live',
      phase_5_stabilization: 'Phase 5: Stabilization',
    };
    return names[phaseName];
  }

  getWorkstreamDisplayName(workstreamType: WorkstreamType): string {
    const names: Record<WorkstreamType, string> = {
      real_estate_build: 'Real Estate & Build',
      compliance_licensing: 'Compliance & Licensing',
      staffing_credentials: 'Staffing & Credentials',
      systems_it: 'Systems & IT',
      clinical_ops: 'Clinical Operations',
      marketing_outreach: 'Marketing & Outreach',
    };
    return names[workstreamType];
  }

  getStatusColor(status: LaunchStatus): string {
    const colors: Record<LaunchStatus, string> = {
      planning: 'gray',
      approved: 'blue',
      in_progress: 'blue',
      delayed: 'orange',
      at_risk: 'red',
      completed: 'green',
      cancelled: 'gray',
    };
    return colors[status];
  }

  getRiskSeverityColor(severity: RiskSeverity): string {
    const colors: Record<RiskSeverity, string> = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red',
    };
    return colors[severity];
  }

  async getMyTasks(): Promise<LaunchTask[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('launch_tasks')
      .select(`
        *,
        clinic_launches (launch_name, launch_code)
      `)
      .eq('assigned_to', user.id)
      .in('status', ['not_started', 'in_progress', 'blocked'])
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  }

  async getMyLaunches(): Promise<ClinicLaunch[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('clinic_launches')
      .select(`
        *,
        clinics (name, city, province)
      `)
      .or(`launch_owner_id.eq.${user.id},executive_sponsor_id.eq.${user.id}`)
      .order('target_open_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getWeeks(launchId: string): Promise<LaunchWeek[]> {
    const { data, error } = await supabase
      .from('launch_weeks')
      .select('*')
      .eq('clinic_launch_id', launchId)
      .order('week_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getWeekById(weekId: string): Promise<LaunchWeek | null> {
    const { data, error } = await supabase
      .from('launch_weeks')
      .select('*')
      .eq('id', weekId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateWeek(weekId: string, updates: Partial<LaunchWeek>): Promise<LaunchWeek> {
    const { data, error } = await supabase
      .from('launch_weeks')
      .update(updates)
      .eq('id', weekId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getDeliverables(launchId: string, weekId?: string): Promise<LaunchDeliverable[]> {
    let query = supabase
      .from('launch_deliverables')
      .select('*')
      .eq('clinic_launch_id', launchId);

    if (weekId) {
      query = query.eq('week_id', weekId);
    }

    query = query.order('due_day', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateDeliverable(
    deliverableId: string,
    updates: Partial<LaunchDeliverable>
  ): Promise<LaunchDeliverable> {
    const { data, error } = await supabase
      .from('launch_deliverables')
      .update(updates)
      .eq('id', deliverableId)
      .select()
      .single();

    if (error) throw error;

    if (updates.status === 'completed' && !updates.completed_at) {
      await supabase
        .from('launch_deliverables')
        .update({
          completed_at: new Date().toISOString(),
        })
        .eq('id', deliverableId);
    }

    return data;
  }

  async getAllMetrics(launchId: string): Promise<LaunchDailyMetric[]> {
    return this.getDailyMetrics(launchId);
  }

  async getDailyMetrics(launchId: string, startDate?: string, endDate?: string): Promise<LaunchDailyMetric[]> {
    let query = supabase
      .from('launch_daily_metrics')
      .select('*')
      .eq('clinic_launch_id', launchId);

    if (startDate) {
      query = query.gte('metric_date', startDate);
    }
    if (endDate) {
      query = query.lte('metric_date', endDate);
    }

    query = query.order('metric_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async logDailyMetric(metric: Omit<LaunchDailyMetric, 'id' | 'created_at'>): Promise<LaunchDailyMetric> {
    const { data, error } = await supabase
      .from('launch_daily_metrics')
      .insert(metric)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTargetMetrics(weekId: string): Promise<LaunchTargetMetric[]> {
    const { data, error } = await supabase
      .from('launch_target_metrics')
      .select('*')
      .eq('week_id', weekId)
      .order('is_critical', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getLaunchStatusSummary(launchId: string): Promise<LaunchStatusSummary> {
    const { data, error } = await supabase.rpc('get_launch_status_summary', {
      p_clinic_launch_id: launchId,
    });

    if (error) throw error;
    return data;
  }

  async getLaunchDayNumber(launchId: string): Promise<number> {
    const { data, error } = await supabase.rpc('get_launch_day_number', {
      p_clinic_launch_id: launchId,
    });

    if (error) throw error;
    return data || 0;
  }

  async getWeekCompletionPercentage(weekId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_week_completion', {
      p_week_id: weekId,
    });

    if (error) throw error;
    return data || 0;
  }

  async startLaunch(launchId: string): Promise<ClinicLaunch> {
    const { data, error } = await supabase
      .from('clinic_launches')
      .update({
        actual_start_date: new Date().toISOString().split('T')[0],
        status: 'in_progress',
      })
      .eq('id', launchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async completeWeek(weekId: string): Promise<LaunchWeek> {
    return await this.updateWeek(weekId, {
      status: 'completed',
      actual_end_date: new Date().toISOString().split('T')[0],
      completion_pct: 100,
    });
  }

  async getCurrentWeek(launchId: string): Promise<LaunchWeek | null> {
    const dayNumber = await this.getLaunchDayNumber(launchId);
    const currentWeekNumber = Math.min(Math.floor(dayNumber / 7), 12);

    const { data, error } = await supabase
      .from('launch_weeks')
      .select('*')
      .eq('clinic_launch_id', launchId)
      .eq('week_number', currentWeekNumber)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

export const launchService = new LaunchService();
