import { supabase } from '../lib/supabase';

export interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  clinic_id?: string;
  campaign_id?: string;
  lead_id?: string;
  metadata?: any;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export const crmAlertService = {
  async getAlerts(filters?: {
    acknowledged?: boolean;
    severity?: string;
    alert_type?: string;
    limit?: number;
  }): Promise<Alert[]> {
    let query = supabase
      .from('crm_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.acknowledged !== undefined) {
      query = query.eq('acknowledged', filters.acknowledged);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.alert_type) {
      query = query.eq('alert_type', filters.alert_type);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getUnacknowledgedAlerts(): Promise<Alert[]> {
    return this.getAlerts({ acknowledged: false });
  },

  async getCriticalAlerts(): Promise<Alert[]> {
    return this.getAlerts({ acknowledged: false, severity: 'critical' });
  },

  async acknowledgeAlert(id: string, user_id: string): Promise<Alert> {
    const { data, error } = await supabase
      .from('crm_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: user_id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createAlert(alert: Partial<Alert>): Promise<Alert> {
    const { data, error } = await supabase
      .from('crm_alerts')
      .insert([alert])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async checkLeadSLA(): Promise<Alert[]> {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data: overdueLeads, error } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('status', 'new')
      .lt('created_at', fiveMinutesAgo.toISOString());

    if (error) throw error;

    const alerts: Alert[] = [];
    for (const lead of overdueLeads || []) {
      const existingAlert = await supabase
        .from('crm_alerts')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('alert_type', 'lead_sla')
        .gte('created_at', fiveMinutesAgo.toISOString())
        .maybeSingle();

      if (!existingAlert.data) {
        const alert = await this.createAlert({
          alert_type: 'lead_sla',
          severity: 'critical',
          title: 'Lead SLA Breach',
          message: `Lead ${lead.first_name} ${lead.last_name} not contacted in 5 minutes`,
          lead_id: lead.id,
          clinic_id: lead.clinic_id,
        });
        alerts.push(alert);
      }
    }

    return alerts;
  },

  async getAlertStats() {
    const { data, error } = await supabase
      .from('crm_alerts')
      .select('alert_type, severity, acknowledged');

    if (error) throw error;

    const alerts = data || [];
    return {
      total: alerts.length,
      unacknowledged: alerts.filter(a => !a.acknowledged).length,
      critical: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
      warning: alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
      by_type: {
        capacity: alerts.filter(a => a.alert_type === 'capacity').length,
        cpa: alerts.filter(a => a.alert_type === 'cpa').length,
        lead_sla: alerts.filter(a => a.alert_type === 'lead_sla').length,
        cash_lag: alerts.filter(a => a.alert_type === 'cash_lag').length,
      },
    };
  }
};
