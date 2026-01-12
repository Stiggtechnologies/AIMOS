import { supabase } from '../lib/supabase';

export interface CaseAgingRule {
  id: string;
  case_type: string;
  clinic_id: string | null;
  warning_threshold_days: number;
  escalation_threshold_days: number;
  critical_threshold_days: number;
  authorization_expiry_warning_days: number;
  is_active: boolean;
  escalation_path: any[];
  notification_config: any;
  created_at: string;
  updated_at: string;
}

export interface CaseAgingAlert {
  id: string;
  case_id: string;
  alert_type: 'warning' | 'escalation' | 'critical' | 'authorization_expiry';
  alert_level: number;
  triggered_at: string;
  case_age_days: number;
  notification_status: 'pending' | 'sent' | 'failed' | 'acknowledged';
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  action_taken: string | null;
  metadata: any;
}

export interface CaseEscalation {
  id: string;
  case_id: string;
  escalation_level: number;
  escalated_from: string | null;
  escalated_to: string | null;
  escalation_reason: string;
  escalated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  auto_escalated: boolean;
}

export interface CaseAgingStatus {
  id: string;
  case_number: string;
  case_type: string;
  status: string;
  priority: string;
  opened_at: string;
  closed_at: string | null;
  age_days: number;
  authorization_expiry: string | null;
  auth_days_remaining: number | null;
  warning_threshold_days: number;
  escalation_threshold_days: number;
  critical_threshold_days: number;
  aging_status: 'normal' | 'warning' | 'escalation' | 'critical';
  unack_alerts_count: number;
  active_escalations_count: number;
  last_alert_at: string | null;
  last_escalation_at: string | null;
  clinic_name: string;
  primary_clinician_name: string;
  primary_clinician_id: string;
  clinic_id: string;
  target_completion_date: string | null;
}

export interface CaseAgingSummary {
  total_open_cases: number;
  cases_warning: number;
  cases_escalated: number;
  cases_critical: number;
  avg_case_age_days: number;
  auth_expiring_soon: number;
  unacknowledged_alerts: number;
  active_escalations: number;
}

export const caseAgingService = {
  async getCaseAgingStatus(filters?: {
    clinic_id?: string;
    aging_status?: string;
    case_type?: string;
  }): Promise<CaseAgingStatus[]> {
    let query = supabase
      .from('ops_case_aging_status')
      .select('*');

    if (filters?.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }

    if (filters?.aging_status) {
      query = query.eq('aging_status', filters.aging_status);
    }

    if (filters?.case_type) {
      query = query.eq('case_type', filters.case_type);
    }

    const { data, error } = await query.order('age_days', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCaseAgingSummary(clinicId?: string): Promise<CaseAgingSummary> {
    const { data, error } = await supabase.rpc('get_case_aging_summary', {
      p_clinic_id: clinicId || null
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        total_open_cases: 0,
        cases_warning: 0,
        cases_escalated: 0,
        cases_critical: 0,
        avg_case_age_days: 0,
        auth_expiring_soon: 0,
        unacknowledged_alerts: 0,
        active_escalations: 0
      };
    }

    return data[0];
  },

  async getCaseAlerts(caseId: string): Promise<CaseAgingAlert[]> {
    const { data, error } = await supabase
      .from('ops_case_aging_alerts')
      .select('*')
      .eq('case_id', caseId)
      .order('triggered_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMyAlerts(): Promise<CaseAgingAlert[]> {
    const { data, error } = await supabase
      .from('ops_case_aging_alerts')
      .select(`
        *,
        case:ops_cases(
          case_number,
          case_type,
          status,
          priority
        )
      `)
      .order('triggered_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async getUnacknowledgedAlerts(): Promise<CaseAgingAlert[]> {
    const { data, error } = await supabase
      .from('ops_case_aging_alerts')
      .select(`
        *,
        case:ops_cases(
          case_number,
          case_type,
          status,
          priority,
          clinic:clinics(name)
        )
      `)
      .neq('notification_status', 'acknowledged')
      .order('triggered_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async acknowledgeAlert(alertId: string, actionTaken?: string): Promise<void> {
    const { error } = await supabase
      .from('ops_case_aging_alerts')
      .update({
        notification_status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        action_taken: actionTaken || null
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  async getCaseEscalations(caseId: string): Promise<CaseEscalation[]> {
    const { data, error } = await supabase
      .from('ops_case_escalations')
      .select(`
        *,
        escalated_to_profile:user_profiles!ops_case_escalations_escalated_to_fkey(
          display_name,
          email
        ),
        escalated_from_profile:user_profiles!ops_case_escalations_escalated_from_fkey(
          display_name,
          email
        )
      `)
      .eq('case_id', caseId)
      .order('escalated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMyEscalations(): Promise<CaseEscalation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ops_case_escalations')
      .select(`
        *,
        case:ops_cases(
          case_number,
          case_type,
          status,
          priority,
          clinic:clinics(name)
        ),
        escalated_from_profile:user_profiles!ops_case_escalations_escalated_from_fkey(
          display_name,
          email
        )
      `)
      .eq('escalated_to', user.id)
      .is('resolved_at', null)
      .order('escalated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async escalateCase(
    caseId: string,
    reason: string,
    autoEscalate: boolean = false
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('escalate_case', {
      p_case_id: caseId,
      p_escalation_reason: reason,
      p_escalated_by: user.id,
      p_auto_escalate: autoEscalate
    });

    if (error) throw error;
    return data;
  },

  async resolveEscalation(
    escalationId: string,
    resolutionNotes: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('ops_case_escalations')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        resolution_notes: resolutionNotes
      })
      .eq('id', escalationId);

    if (error) throw error;
  },

  async batchCheckCaseAging(): Promise<{
    cases_checked: number;
    alerts_triggered: number;
    escalations_created: number;
  }> {
    const { data, error } = await supabase.rpc('batch_check_case_aging');

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        cases_checked: 0,
        alerts_triggered: 0,
        escalations_created: 0
      };
    }

    return data[0];
  },

  async getAgingRules(): Promise<CaseAgingRule[]> {
    const { data, error } = await supabase
      .from('ops_case_aging_rules')
      .select('*')
      .eq('is_active', true)
      .order('case_type');

    if (error) throw error;
    return data || [];
  },

  async updateAgingRule(
    ruleId: string,
    updates: Partial<CaseAgingRule>
  ): Promise<void> {
    const { error } = await supabase
      .from('ops_case_aging_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId);

    if (error) throw error;
  },

  async createAgingRule(rule: Omit<CaseAgingRule, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ops_case_aging_rules')
      .insert({
        ...rule,
        created_by: user.id
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async getCaseStatusHistory(caseId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ops_case_status_history')
      .select(`
        *,
        changed_by_profile:user_profiles(
          display_name,
          email
        )
      `)
      .eq('case_id', caseId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
