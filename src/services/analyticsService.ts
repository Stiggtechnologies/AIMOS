import { supabase } from '../lib/supabase';
import type { KPI } from '../types';

export const analyticsService = {
  async getKPIs(metricNames?: string[], startDate?: string, endDate?: string): Promise<KPI[]> {
    let query = supabase
      .from('kpis')
      .select('*')
      .order('period_start', { ascending: false });

    if (metricNames && metricNames.length > 0) {
      query = query.in('metric_name', metricNames);
    }

    if (startDate) {
      query = query.gte('period_start', startDate);
    }

    if (endDate) {
      query = query.lte('period_end', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getLatestKPI(metricName: string): Promise<KPI | null> {
    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('metric_name', metricName)
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createKPI(kpi: Partial<KPI>): Promise<KPI> {
    const { data, error } = await supabase
      .from('kpis')
      .insert(kpi)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDashboardMetrics(): Promise<{
    active_jobs: number;
    total_candidates: number;
    active_applications: number;
    pending_interviews: number;
    time_to_fill_avg: number;
    cost_per_hire_avg: number;
    pipeline_conversion_rate: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const [
      activeJobsResult,
      candidatesResult,
      applicationsResult,
      interviewsResult,
      timeToFillResult,
      costPerHireResult,
      conversionResult
    ] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('candidates').select('id', { count: 'exact' }),
      supabase.from('applications').select('id', { count: 'exact' }).in('status', ['screening', 'interviewing', 'offered']),
      supabase.from('interviews').select('id', { count: 'exact' }).eq('status', 'scheduled'),
      supabase.from('kpis').select('metric_value').eq('metric_name', 'time_to_fill_days').gte('period_start', today).maybeSingle(),
      supabase.from('kpis').select('metric_value').eq('metric_name', 'cost_per_hire').gte('period_start', today).maybeSingle(),
      supabase.from('kpis').select('metric_value').eq('metric_name', 'pipeline_conversion_rate').gte('period_start', today).maybeSingle()
    ]);

    return {
      active_jobs: activeJobsResult.count || 0,
      total_candidates: candidatesResult.count || 0,
      active_applications: applicationsResult.count || 0,
      pending_interviews: interviewsResult.count || 0,
      time_to_fill_avg: timeToFillResult.data?.metric_value || 0,
      cost_per_hire_avg: costPerHireResult.data?.metric_value || 0,
      pipeline_conversion_rate: conversionResult.data?.metric_value || 0
    };
  },

  async getAgentPerformance(): Promise<Array<{
    agent_name: string;
    total_executions: number;
    success_rate: number;
    avg_execution_time: number;
  }>> {
    const { data, error } = await supabase
      .from('agents')
      .select('name, display_name, total_executions, total_failures, average_execution_time_ms')
      .eq('status', 'active');

    if (error) throw error;

    return (data || []).map(agent => ({
      agent_name: agent.display_name,
      total_executions: agent.total_executions,
      success_rate: agent.total_executions > 0
        ? ((agent.total_executions - agent.total_failures) / agent.total_executions) * 100
        : 0,
      avg_execution_time: agent.average_execution_time_ms || 0
    }));
  },

  async getSourcingChannelPerformance(): Promise<Array<{
    channel_name: string;
    total_candidates: number;
    total_hires: number;
    conversion_rate: number;
    cost_per_hire: number;
  }>> {
    const { data, error } = await supabase
      .from('sourcing_channels')
      .select('*')
      .eq('is_active', true)
      .order('performance_score', { ascending: false });

    if (error) throw error;

    return (data || []).map(channel => ({
      channel_name: channel.channel_name,
      total_candidates: channel.total_candidates,
      total_hires: channel.total_hires,
      conversion_rate: channel.conversion_rate || 0,
      cost_per_hire: channel.cost_per_hire || 0
    }));
  }
};
