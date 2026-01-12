import { supabase } from '../lib/supabase';

export interface PipelineMetrics {
  id: string;
  clinic_id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  marketing_leads: number;
  marketing_spend: number;
  cost_per_lead: number;
  intake_received: number;
  intake_qualified: number;
  intake_conversion_rate: number;
  avg_intake_to_schedule_hours: number;
  appointments_scheduled: number;
  schedule_conversion_rate: number;
  avg_schedule_to_first_visit_days: number;
  appointments_completed: number;
  completion_rate: number;
  no_show_rate: number;
  total_revenue: number;
  revenue_per_appointment: number;
  revenue_per_lead: number;
  overall_conversion_rate: number;
  marketing_roi: number;
  primary_bottleneck?: string;
  bottleneck_severity?: string;
  created_at: string;
  updated_at: string;
}

export interface CapacityMetrics {
  id: string;
  clinic_id: string;
  period_start: string;
  period_end: string;
  total_clinicians: number;
  active_clinicians: number;
  total_available_hours: number;
  booked_hours: number;
  completed_hours: number;
  utilization_rate: number;
  efficiency_rate: number;
  total_revenue: number;
  revenue_per_hour: number;
  revenue_per_clinician: number;
  hours_at_capacity: number;
  constrained_demand: number;
  estimated_lost_revenue: number;
  demand_growth_rate: number;
  capacity_growth_rate: number;
  capacity_gap: number;
  created_at: string;
  updated_at: string;
}

export interface Bottleneck {
  id: string;
  clinic_id: string;
  bottleneck_stage: string;
  severity: string;
  appointments_delayed: number;
  appointments_lost: number;
  revenue_delayed: number;
  revenue_lost: number;
  root_cause: string;
  contributing_factors: string[];
  current_throughput: number;
  optimal_throughput: number;
  throughput_gap_percentage: number;
  recommended_actions: string[];
  estimated_resolution_time: string;
  estimated_impact_if_resolved: number;
  status: string;
  detected_at: string;
  resolved_at?: string;
  assigned_to?: string;
  priority: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicianProductivity {
  id: string;
  clinician_id: string;
  clinic_id: string;
  period_start: string;
  period_end: string;
  scheduled_hours: number;
  worked_hours: number;
  productive_hours: number;
  patients_seen: number;
  appointments_completed: number;
  treatments_delivered: number;
  total_revenue: number;
  revenue_per_hour: number;
  revenue_per_patient: number;
  utilization_rate: number;
  productivity_rate: number;
  avg_appointment_duration: number;
  patient_satisfaction_score?: number;
  treatment_completion_rate: number;
  rebooking_rate: number;
  performance_tier?: string;
  created_at: string;
  updated_at: string;
  clinician?: {
    id: string;
    display_name: string;
    role: string;
  };
}

export interface GrowthAlert {
  id: string;
  clinic_id: string;
  alert_type: string;
  severity: string;
  current_demand: number;
  current_capacity: number;
  gap_percentage: number;
  potential_revenue_loss: number;
  revenue_opportunity: number;
  forecast_horizon: string;
  projected_gap_if_unaddressed: number;
  recommended_action: string;
  action_details: Record<string, any>;
  estimated_cost: number;
  estimated_revenue_gain: number;
  roi_percentage: number;
  status: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  triggered_at: string;
  expires_at?: string;
  notes?: string;
  created_at: string;
}

export interface RevOpsDashboard {
  pipeline_metrics: PipelineMetrics[];
  latest_pipeline: PipelineMetrics | null;
  capacity_metrics: CapacityMetrics[];
  latest_capacity: CapacityMetrics | null;
  active_bottlenecks: Bottleneck[];
  clinician_productivity: ClinicianProductivity[];
  growth_alerts: GrowthAlert[];
  summary: {
    total_revenue_last_week: number;
    revenue_per_hour: number;
    utilization_rate: number;
    capacity_gap: number;
    bottlenecks_count: number;
    alerts_count: number;
    marketing_roi: number;
    overall_conversion_rate: number;
  };
}

export async function getRevOpsDashboard(): Promise<RevOpsDashboard> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [pipelineResult, capacityResult, bottlenecksResult, productivityResult, alertsResult] = await Promise.all([
    supabase
      .from('revops_pipeline_metrics')
      .select('*')
      .gte('period_start', thirtyDaysAgo.toISOString().split('T')[0])
      .order('period_start', { ascending: false }),

    supabase
      .from('revops_capacity_metrics')
      .select('*')
      .gte('period_start', thirtyDaysAgo.toISOString().split('T')[0])
      .order('period_start', { ascending: false }),

    supabase
      .from('revops_bottlenecks')
      .select('*')
      .in('status', ['active', 'monitoring'])
      .order('priority', { ascending: false }),

    supabase
      .from('revops_clinician_productivity')
      .select(`
        *,
        clinician:user_profiles!revops_clinician_productivity_clinician_id_fkey(id, display_name, role)
      `)
      .gte('period_start', thirtyDaysAgo.toISOString().split('T')[0])
      .order('revenue_per_hour', { ascending: false }),

    supabase
      .from('revops_growth_alerts')
      .select('*')
      .in('status', ['active', 'acknowledged'])
      .order('severity', { ascending: false })
  ]);

  if (pipelineResult.error) throw pipelineResult.error;
  if (capacityResult.error) throw capacityResult.error;
  if (bottlenecksResult.error) throw bottlenecksResult.error;
  if (productivityResult.error) throw productivityResult.error;
  if (alertsResult.error) throw alertsResult.error;

  const pipelineMetrics = pipelineResult.data as PipelineMetrics[];
  const capacityMetrics = capacityResult.data as CapacityMetrics[];
  const activeBottlenecks = bottlenecksResult.data as Bottleneck[];
  const clinicianProductivity = productivityResult.data as ClinicianProductivity[];
  const growthAlerts = alertsResult.data as GrowthAlert[];

  const latestPipeline = pipelineMetrics[0] || null;
  const latestCapacity = capacityMetrics[0] || null;

  const summary = {
    total_revenue_last_week: latestPipeline?.total_revenue || 0,
    revenue_per_hour: latestCapacity?.revenue_per_hour || 0,
    utilization_rate: latestCapacity?.utilization_rate || 0,
    capacity_gap: latestCapacity?.capacity_gap || 0,
    bottlenecks_count: activeBottlenecks.length,
    alerts_count: growthAlerts.length,
    marketing_roi: latestPipeline?.marketing_roi || 0,
    overall_conversion_rate: latestPipeline?.overall_conversion_rate || 0,
  };

  return {
    pipeline_metrics: pipelineMetrics,
    latest_pipeline: latestPipeline,
    capacity_metrics: capacityMetrics,
    latest_capacity: latestCapacity,
    active_bottlenecks: activeBottlenecks,
    clinician_productivity: clinicianProductivity,
    growth_alerts: growthAlerts,
    summary,
  };
}

export async function acknowledgeGrowthAlert(alertId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('revops_growth_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) throw error;
}

export async function resolveBottleneck(bottleneckId: string, notes?: string): Promise<void> {
  const { error } = await supabase
    .from('revops_bottlenecks')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      notes: notes || null,
    })
    .eq('id', bottleneckId);

  if (error) throw error;
}

export async function dismissGrowthAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('revops_growth_alerts')
    .update({ status: 'dismissed' })
    .eq('id', alertId);

  if (error) throw error;
}
