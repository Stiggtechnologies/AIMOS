import { supabase } from '../lib/supabase';

export interface ReportDefinition {
  id: string;
  name: string;
  description: string | null;
  report_type: 'executive' | 'operational' | 'compliance' | 'financial' | 'growth' | 'custom';
  data_sources: any[];
  metrics: any[];
  filters: any;
  grouping: any[];
  visualization_config: any;
  is_system: boolean;
  is_public: boolean;
  created_by: string;
  clinic_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReport {
  id: string;
  report_definition_id: string;
  schedule_cron: string;
  delivery_method: 'email' | 'download' | 'dashboard';
  recipients: any[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportExecution {
  id: string;
  report_definition_id: string;
  scheduled_report_id: string | null;
  executed_by: string;
  execution_started_at: string;
  execution_completed_at: string | null;
  status: 'queued' | 'running' | 'completed' | 'failed';
  row_count: number;
  file_path: string | null;
  error_message: string | null;
  execution_params: any;
}

export interface OperationalHealth {
  clinic_id: string;
  clinic_name: string;
  total_staff: number;
  active_staff: number;
  total_credentials: number;
  expired_credentials: number;
  expiring_soon_credentials: number;
  total_rooms: number;
  active_rooms: number;
  open_cases: number;
  critical_cases: number;
  avg_case_age_days: number;
  unack_aging_alerts: number;
  health_score: number;
  calculated_at: string;
}

export interface CredentialImpact {
  clinic_id: string;
  clinic_name: string;
  staff_id: string;
  staff_name: string;
  employment_type: string;
  total_credentials: number;
  active_credentials: number;
  expired_credentials: number;
  next_expiry_date: string | null;
  compliance_status: 'compliant' | 'warning' | 'at_risk';
  active_cases: number;
  risk_level: 'no_risk' | 'low_risk' | 'medium_risk' | 'high_risk';
}

export interface ExecutiveSummary {
  total_active_clinics: number;
  total_active_staff: number;
  total_open_cases: number;
  avg_operational_health: number;
  total_expired_credentials: number;
  credentials_expiring_soon: number;
  critical_cases: number;
  avg_case_age_days: number;
  capacity_utilization_pct: number;
  unacknowledged_alerts: number;
  active_escalations: number;
  staff_at_risk: number;
  snapshot_time: string;
}

export interface ClinicPerformance {
  clinic_id: string;
  clinic_name: string;
  total_cases: number;
  completed_cases: number;
  avg_case_duration_days: number;
  credential_compliance_rate: number;
  staff_count: number;
  staff_productivity_score: number;
  overall_performance_score: number;
}

export interface MetricTrendPoint {
  date: string;
  value: number;
}

export const analyticsReportingService = {
  // ==================== Analytics Views ====================

  async getOperationalHealth(clinicId?: string): Promise<OperationalHealth[]> {
    let query = supabase
      .from('analytics_operational_health')
      .select('*');

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    const { data, error } = await query.order('health_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCredentialImpact(clinicId?: string, riskLevel?: string): Promise<CredentialImpact[]> {
    let query = supabase
      .from('analytics_credential_impact')
      .select('*');

    if (clinicId) {
      query = query.eq('clinic_id', clinicId);
    }

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }

    const { data, error } = await query.order('risk_level', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getExecutiveSummary(): Promise<ExecutiveSummary> {
    const { data, error } = await supabase
      .from('analytics_executive_summary')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async getClinicPerformanceComparison(
    startDate?: string,
    endDate?: string
  ): Promise<ClinicPerformance[]> {
    const { data, error } = await supabase.rpc('get_clinic_performance_comparison', {
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });

    if (error) throw error;
    return data || [];
  },

  async getMetricTrend(
    metricName: 'open_cases' | 'expired_credentials' | 'active_staff',
    clinicId?: string,
    daysBack: number = 30
  ): Promise<MetricTrendPoint[]> {
    const { data, error } = await supabase.rpc('get_metric_trend', {
      p_metric_name: metricName,
      p_clinic_id: clinicId || null,
      p_days_back: daysBack
    });

    if (error) throw error;
    return data || [];
  },

  // ==================== Report Definitions ====================

  async getReportDefinitions(filters?: {
    report_type?: string;
    is_public?: boolean;
    clinic_id?: string;
  }): Promise<ReportDefinition[]> {
    let query = supabase
      .from('analytics_report_definitions')
      .select('*');

    if (filters?.report_type) {
      query = query.eq('report_type', filters.report_type);
    }

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    if (filters?.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getReportDefinition(id: string): Promise<ReportDefinition> {
    const { data, error } = await supabase
      .from('analytics_report_definitions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createReportDefinition(
    report: Omit<ReportDefinition, 'id' | 'created_at' | 'updated_at' | 'created_by'>
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analytics_report_definitions')
      .insert({
        ...report,
        created_by: user.id
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async updateReportDefinition(
    id: string,
    updates: Partial<ReportDefinition>
  ): Promise<void> {
    const { error } = await supabase
      .from('analytics_report_definitions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteReportDefinition(id: string): Promise<void> {
    const { error } = await supabase
      .from('analytics_report_definitions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== Scheduled Reports ====================

  async getScheduledReports(reportDefinitionId?: string): Promise<ScheduledReport[]> {
    let query = supabase
      .from('analytics_scheduled_reports')
      .select('*');

    if (reportDefinitionId) {
      query = query.eq('report_definition_id', reportDefinitionId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createScheduledReport(
    schedule: Omit<ScheduledReport, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'last_run_at' | 'next_run_at'>
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analytics_scheduled_reports')
      .insert({
        ...schedule,
        created_by: user.id
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async updateScheduledReport(
    id: string,
    updates: Partial<ScheduledReport>
  ): Promise<void> {
    const { error } = await supabase
      .from('analytics_scheduled_reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteScheduledReport(id: string): Promise<void> {
    const { error } = await supabase
      .from('analytics_scheduled_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== Report Executions ====================

  async getReportExecutions(filters?: {
    report_definition_id?: string;
    status?: string;
  }): Promise<ReportExecution[]> {
    let query = supabase
      .from('analytics_report_executions')
      .select('*');

    if (filters?.report_definition_id) {
      query = query.eq('report_definition_id', filters.report_definition_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query
      .order('execution_started_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  },

  async createReportExecution(
    reportDefinitionId: string,
    executionParams: any = {}
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('analytics_report_executions')
      .insert({
        report_definition_id: reportDefinitionId,
        executed_by: user.id,
        execution_params: executionParams,
        status: 'queued'
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async updateReportExecution(
    id: string,
    updates: Partial<ReportExecution>
  ): Promise<void> {
    const { error } = await supabase
      .from('analytics_report_executions')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  // ==================== Export Functions ====================

  async exportToCSV(data: any[], filename: string): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async exportToJSON(data: any[], filename: string): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // ==================== Utility Functions ====================

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  },

  formatNumber(value: number, decimals: number = 0): string {
    return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  getHealthScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-yellow-600 bg-yellow-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  },

  getRiskLevelColor(level: string): string {
    switch (level) {
      case 'no_risk': return 'text-green-600 bg-green-50';
      case 'low_risk': return 'text-blue-600 bg-blue-50';
      case 'medium_risk': return 'text-orange-600 bg-orange-50';
      case 'high_risk': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
};
