import { supabase } from '../lib/supabase';

export interface ServiceLine {
  id: string;
  clinic_id?: string;
  name: string;
  category: 'core' | 'growth' | 'emerging' | 'sunset';
  description?: string;
  status: 'planning' | 'pilot' | 'active' | 'retiring' | 'retired';
  launch_date?: string;
  target_retirement_date?: string;
  strategic_priority?: 'high' | 'medium' | 'low';
  revenue_target_annual?: number;
  margin_target_percentage?: number;
  is_billable?: boolean;
  requires_certification?: boolean;
  growth_potential?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceDemandMetrics {
  id: string;
  service_line_id: string;
  clinic_id: string;
  period_start: string;
  inquiries_received: number;
  appointments_booked: number;
  appointments_completed: number;
  conversion_rate: number;
  demand_trend?: string;
  service_line?: ServiceLine;
}

export interface ServiceMarginAnalysis {
  id: string;
  service_line_id: string;
  clinic_id: string;
  period_start: string;
  revenue: number;
  gross_margin: number;
  gross_margin_percentage: number;
  ltv_cac_ratio: number;
  profitability_tier?: string;
  service_line?: ServiceLine;
}

export async function getServiceLines(): Promise<ServiceLine[]> {
  const { data, error } = await supabase
    .from('service_lines')
    .select('*')
    .eq('status', 'active')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getServiceDemandMetrics(clinicId?: string): Promise<ServiceDemandMetrics[]> {
  let query = supabase
    .from('service_demand_metrics')
    .select(`
      *,
      service_line:service_lines(*)
    `)
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getServiceMarginAnalysis(clinicId?: string): Promise<ServiceMarginAnalysis[]> {
  let query = supabase
    .from('service_margin_analysis')
    .select(`
      *,
      service_line:service_lines(*)
    `)
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export interface ServiceDemand {
  id: string;
  service_line_id: string;
  clinic_id: string;
  period_start: string;
  period_end: string;
  requests_received: number;
  appointments_booked: number;
  appointments_completed: number;
  waitlist_count: number;
  average_wait_days: number;
  referrals_received: number;
  conversion_rate: number;
  created_at: string;
  service_line?: ServiceLine;
}

export interface ServiceCapacity {
  id: string;
  service_line_id: string;
  clinic_id: string;
  period_start: string;
  period_end: string;
  total_slots_available: number;
  slots_booked: number;
  slots_completed: number;
  slots_cancelled: number;
  utilization_percentage: number;
  staff_fte_allocated: number;
  room_hours_allocated: number;
  created_at: string;
  service_line?: ServiceLine;
}

export interface ServicePerformance {
  id: string;
  service_line_id: string;
  clinic_id: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  direct_costs: number;
  gross_margin: number;
  gross_margin_percentage: number;
  patient_count: number;
  average_revenue_per_patient: number;
  patient_satisfaction_score: number;
  nps_score?: number;
  created_at: string;
  service_line?: ServiceLine;
}

export interface ServiceLifecycleEvent {
  id: string;
  service_line_id: string;
  clinic_id: string;
  event_type: 'planning' | 'pilot_launch' | 'full_launch' | 'pivot' | 'scale_up' | 'scale_down' | 'sunset_announced' | 'retired';
  event_date: string;
  decision_maker?: string;
  rationale?: string;
  success_metrics?: any;
  actual_outcomes?: any;
  created_at: string;
  service_line?: ServiceLine;
}

export interface ServiceDependency {
  id: string;
  service_line_id: string;
  dependency_type: 'equipment' | 'staff_certification' | 'space' | 'technology' | 'regulatory';
  description: string;
  is_met: boolean;
  target_completion_date?: string;
  created_at: string;
  updated_at: string;
}

export async function getAllServiceLines(): Promise<ServiceLine[]> {
  const { data, error } = await supabase
    .from('service_lines')
    .select('*')
    .order('strategic_priority', { ascending: false })
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getActiveServiceLines(): Promise<ServiceLine[]> {
  const { data, error } = await supabase
    .from('service_lines')
    .select('*')
    .in('status', ['active', 'pilot'])
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getServiceDemand(): Promise<ServiceDemand[]> {
  const { data, error } = await supabase
    .from('service_demand')
    .select(`
      *,
      service_line:service_lines(*)
    `)
    .order('period_start', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getServiceCapacity(): Promise<ServiceCapacity[]> {
  const { data, error } = await supabase
    .from('service_capacity')
    .select(`
      *,
      service_line:service_lines(*)
    `)
    .order('period_start', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getServicePerformance(): Promise<ServicePerformance[]> {
  const { data, error } = await supabase
    .from('service_performance')
    .select(`
      *,
      service_line:service_lines(*)
    `)
    .order('period_start', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getServiceLifecycleEvents(): Promise<ServiceLifecycleEvent[]> {
  const { data, error } = await supabase
    .from('service_lifecycle_events')
    .select(`
      *,
      service_line:service_lines(*)
    `)
    .order('event_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getServiceDependencies(serviceLineId?: string): Promise<ServiceDependency[]> {
  let query = supabase
    .from('service_dependencies')
    .select('*')
    .order('is_met')
    .order('target_completion_date');

  if (serviceLineId) {
    query = query.eq('service_line_id', serviceLineId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getUnmetDependencies(): Promise<ServiceDependency[]> {
  const { data, error } = await supabase
    .from('service_dependencies')
    .select('*')
    .eq('is_met', false)
    .order('target_completion_date');

  if (error) throw error;
  return data || [];
}

export async function getServiceLineById(id: string): Promise<ServiceLine | null> {
  const { data, error } = await supabase
    .from('service_lines')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createServiceLine(serviceLine: Partial<ServiceLine>): Promise<ServiceLine> {
  const { data, error } = await supabase
    .from('service_lines')
    .insert(serviceLine)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateServiceLine(id: string, updates: Partial<ServiceLine>): Promise<ServiceLine> {
  const { data, error } = await supabase
    .from('service_lines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createLifecycleEvent(event: Partial<ServiceLifecycleEvent>): Promise<ServiceLifecycleEvent> {
  const { data, error } = await supabase
    .from('service_lifecycle_events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getServicesByCategory(category: ServiceLine['category']): Promise<ServiceLine[]> {
  const { data, error } = await supabase
    .from('service_lines')
    .select('*')
    .eq('category', category)
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getServicesNeedingAction(): Promise<ServiceLine[]> {
  const { data, error } = await supabase
    .from('service_lines')
    .select('*')
    .in('status', ['planning', 'pilot', 'retiring'])
    .order('strategic_priority', { ascending: false });

  if (error) throw error;
  return data || [];
}
