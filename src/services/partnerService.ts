import { supabase } from '../lib/supabase';

export type PartnerClinicType = 'embedded_partner' | 'on_site_employer' | 'sports_facility' | 'recreation_center' | 'standalone';
export type PartnerStatus = 'prospect' | 'negotiating' | 'active' | 'paused' | 'terminated';

export interface PartnerClinic {
  id: string;
  clinic_id: string;
  partner_name: string;
  partner_type: PartnerClinicType;
  partner_contact_name?: string;
  partner_contact_email?: string;
  partner_contact_phone?: string;
  partner_member_base: number;
  partner_location_type?: string;
  is_flagship_location: boolean;
  is_replication_template: boolean;
  template_name?: string;
  partnership_start_date?: string;
  partnership_end_date?: string;
  status: PartnerStatus;
  revenue_share_enabled: boolean;
  revenue_share_rate: number;
  revenue_share_cap?: number;
  revenue_share_cap_period: string;
  square_footage?: number;
  space_description?: string;
  notes?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PartnerRevenueShare {
  id: string;
  partner_clinic_id: string;
  period_start: string;
  period_end: string;
  period_type: string;
  total_revenue: number;
  partner_sourced_revenue: number;
  revenue_share_amount: number;
  total_patients: number;
  partner_sourced_patients: number;
  partner_conversion_rate?: number;
  ytd_revenue_share: number;
  cap_remaining?: number;
  cap_exhausted: boolean;
  cap_exhausted_date?: string;
  is_paid: boolean;
  paid_date?: string;
  payment_reference?: string;
  notes?: string;
}

export interface PartnerConversion {
  id: string;
  partner_clinic_id: string;
  patient_id?: string;
  patient_ref_code?: string;
  partner_member_id?: string;
  referral_source: string;
  referral_date: string;
  first_contact_date?: string;
  first_appointment_date?: string;
  first_visit_date?: string;
  total_visits: number;
  total_revenue: number;
  episode_status?: string;
  programs_enrolled: string[];
  return_to_play_completed: boolean;
  satisfaction_score?: number;
  outcome_achieved?: boolean;
}

export interface PartnerDashboardMetrics {
  id: string;
  partner_clinic_id: string;
  metric_date: string;
  metric_period: string;
  partner_members_treated: number;
  new_patient_conversions: number;
  total_visits: number;
  clinic_utilization_pct?: number;
  appointment_availability_pct?: number;
  injury_prevention_enrollments: number;
  return_to_play_completions: number;
  performance_programs: number;
  avg_satisfaction_score?: number;
  avg_visits_per_episode?: number;
  successful_outcomes_pct?: number;
  physiotherapy_visits: number;
  performance_rehab_visits: number;
  injury_prevention_visits: number;
}

export interface PartnerDashboardSummary {
  total_members_treated: number;
  total_visits: number;
  avg_satisfaction: number;
  return_to_play_completions: number;
  avg_visits_per_episode: number;
  successful_outcomes_pct: number;
}

class PartnerService {
  async getAllPartnerClinics(): Promise<PartnerClinic[]> {
    const { data, error } = await supabase
      .from('partner_clinics')
      .select(`
        *,
        clinics (name, code, city, province)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPartnerClinicById(id: string): Promise<PartnerClinic | null> {
    const { data, error } = await supabase
      .from('partner_clinics')
      .select(`
        *,
        clinics (name, code, city, province, address, phone, email)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getPartnerClinicByClinicId(clinicId: string): Promise<PartnerClinic | null> {
    const { data, error } = await supabase
      .from('partner_clinics')
      .select('*')
      .eq('clinic_id', clinicId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getFlagshipClinics(): Promise<PartnerClinic[]> {
    const { data, error } = await supabase
      .from('partner_clinics')
      .select(`
        *,
        clinics (name, code, city, province)
      `)
      .eq('is_flagship_location', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getReplicationTemplates(): Promise<PartnerClinic[]> {
    const { data, error } = await supabase
      .from('partner_clinics')
      .select('*')
      .eq('is_replication_template', true)
      .order('template_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createPartnerClinic(partnerClinic: Omit<PartnerClinic, 'id' | 'created_at' | 'updated_at'>): Promise<PartnerClinic> {
    const { data, error } = await supabase
      .from('partner_clinics')
      .insert(partnerClinic)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePartnerClinic(id: string, updates: Partial<PartnerClinic>): Promise<PartnerClinic> {
    const { data, error } = await supabase
      .from('partner_clinics')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async calculateRevenueShare(
    partnerClinicId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any> {
    const { data, error } = await supabase.rpc('calculate_partner_revenue_share', {
      p_partner_clinic_id: partnerClinicId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    });

    if (error) throw error;
    return data;
  }

  async getRevenueShareHistory(
    partnerClinicId: string,
    limit: number = 12
  ): Promise<PartnerRevenueShare[]> {
    const { data, error } = await supabase
      .from('partner_revenue_share')
      .select('*')
      .eq('partner_clinic_id', partnerClinicId)
      .order('period_start', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async recordRevenueShare(revenueShare: Omit<PartnerRevenueShare, 'id' | 'created_at' | 'updated_at'>): Promise<PartnerRevenueShare> {
    const { data, error } = await supabase
      .from('partner_revenue_share')
      .insert(revenueShare)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markRevenueSharePaid(id: string, paymentReference: string): Promise<void> {
    const { error } = await supabase
      .from('partner_revenue_share')
      .update({
        is_paid: true,
        paid_date: new Date().toISOString().split('T')[0],
        payment_reference: paymentReference,
      })
      .eq('id', id);

    if (error) throw error;
  }

  async createConversion(conversion: Omit<PartnerConversion, 'id' | 'created_at' | 'updated_at'>): Promise<PartnerConversion> {
    const { data, error } = await supabase
      .from('partner_conversions')
      .insert(conversion)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateConversion(id: string, updates: Partial<PartnerConversion>): Promise<PartnerConversion> {
    const { data, error } = await supabase
      .from('partner_conversions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getConversions(
    partnerClinicId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      status?: string;
    }
  ): Promise<PartnerConversion[]> {
    let query = supabase
      .from('partner_conversions')
      .select('*')
      .eq('partner_clinic_id', partnerClinicId);

    if (filters?.startDate) {
      query = query.gte('referral_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('referral_date', filters.endDate);
    }
    if (filters?.status) {
      query = query.eq('episode_status', filters.status);
    }

    query = query.order('referral_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getPartnerDashboardSummary(
    partnerClinicId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PartnerDashboardSummary> {
    const { data, error } = await supabase.rpc('get_partner_dashboard_summary', {
      p_partner_clinic_id: partnerClinicId,
      p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_end_date: endDate || new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
    return data || {
      total_members_treated: 0,
      total_visits: 0,
      avg_satisfaction: 0,
      return_to_play_completions: 0,
      avg_visits_per_episode: 0,
      successful_outcomes_pct: 0,
    };
  }

  async getDashboardMetrics(
    partnerClinicId: string,
    startDate: string,
    endDate: string
  ): Promise<PartnerDashboardMetrics[]> {
    const { data, error } = await supabase
      .from('partner_dashboard_metrics')
      .select('*')
      .eq('partner_clinic_id', partnerClinicId)
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async recordDashboardMetrics(metrics: Omit<PartnerDashboardMetrics, 'id' | 'recorded_at'>): Promise<PartnerDashboardMetrics> {
    const { data, error } = await supabase
      .from('partner_dashboard_metrics')
      .insert(metrics)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  getPartnerTypeLabel(type: PartnerClinicType): string {
    const labels: Record<PartnerClinicType, string> = {
      embedded_partner: 'Embedded Partner',
      on_site_employer: 'On-Site Employer',
      sports_facility: 'Sports Facility',
      recreation_center: 'Recreation Center',
      standalone: 'Standalone',
    };
    return labels[type];
  }

  getStatusColor(status: PartnerStatus): string {
    const colors: Record<PartnerStatus, string> = {
      prospect: 'gray',
      negotiating: 'yellow',
      active: 'green',
      paused: 'orange',
      terminated: 'red',
    };
    return colors[status];
  }

  async clonePartnerConfiguration(
    templateId: string,
    newClinicId: string,
    partnerName: string
  ): Promise<string> {
    const template = await this.getPartnerClinicById(templateId);
    if (!template) throw new Error('Template not found');

    const { data, error } = await supabase
      .from('partner_clinics')
      .insert({
        clinic_id: newClinicId,
        partner_name: partnerName,
        partner_type: template.partner_type,
        partner_member_base: 0,
        partner_location_type: template.partner_location_type,
        is_flagship_location: false,
        is_replication_template: false,
        status: 'prospect',
        revenue_share_enabled: template.revenue_share_enabled,
        revenue_share_rate: template.revenue_share_rate,
        revenue_share_cap: template.revenue_share_cap,
        revenue_share_cap_period: template.revenue_share_cap_period,
        metadata: template.metadata,
        notes: `Cloned from template: ${template.template_name}`,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  async exportDashboardToCSV(
    partnerClinicId: string,
    startDate: string,
    endDate: string
  ): Promise<string> {
    const [partner, summary, revenueShare, metrics] = await Promise.all([
      this.getPartnerClinicById(partnerClinicId),
      this.getPartnerDashboardSummary(partnerClinicId, startDate, endDate),
      this.getRevenueShareHistory(partnerClinicId, 12),
      this.getDashboardMetrics(partnerClinicId, startDate, endDate),
    ]);

    if (!partner) throw new Error('Partner not found');

    const csvRows: string[] = [];

    csvRows.push('Partner Clinic Dashboard Export');
    csvRows.push('');
    csvRows.push('Partner Information');
    csvRows.push(`Partner Name,${partner.partner_name}`);
    csvRows.push(`Member Base,${partner.partner_member_base}`);
    csvRows.push(`Revenue Share Rate,${partner.revenue_share_rate}%`);
    csvRows.push(`Revenue Share Cap,$${partner.revenue_share_cap || 'N/A'}`);
    csvRows.push(`Export Date Range,${startDate} to ${endDate}`);
    csvRows.push('');

    csvRows.push('Summary Metrics');
    csvRows.push('Metric,Value');
    csvRows.push(`Members Treated,${summary.total_members_treated}`);
    csvRows.push(`Total Visits,${summary.total_visits}`);
    csvRows.push(`Average Satisfaction,${summary.avg_satisfaction?.toFixed(2) || 'N/A'}`);
    csvRows.push(`Return-to-Play Completions,${summary.return_to_play_completions}`);
    csvRows.push(`Avg Visits per Episode,${summary.avg_visits_per_episode?.toFixed(1) || 'N/A'}`);
    csvRows.push(`Successful Outcomes %,${summary.successful_outcomes_pct?.toFixed(1) || 'N/A'}`);
    csvRows.push('');

    if (partner.revenue_share_enabled && revenueShare.length > 0) {
      csvRows.push('Revenue Share History');
      csvRows.push('Period Start,Period End,Partner Revenue,Revenue Share,YTD Share,Cap Remaining');
      revenueShare.forEach(rs => {
        csvRows.push(
          `${rs.period_start},${rs.period_end},$${rs.partner_sourced_revenue?.toFixed(2) || '0.00'},$${rs.revenue_share_amount?.toFixed(2) || '0.00'},$${rs.ytd_revenue_share?.toFixed(2) || '0.00'},$${rs.cap_remaining?.toFixed(2) || 'N/A'}`
        );
      });
      csvRows.push('');
    }

    if (metrics.length > 0) {
      csvRows.push('Daily Metrics');
      csvRows.push('Date,Members Treated,New Conversions,Total Visits,Satisfaction,RTP Completions');
      metrics.forEach(m => {
        csvRows.push(
          `${m.metric_date},${m.partner_members_treated},${m.new_patient_conversions},${m.total_visits},${m.avg_satisfaction_score?.toFixed(2) || 'N/A'},${m.return_to_play_completions}`
        );
      });
    }

    return csvRows.join('\n');
  }

  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const partnerService = new PartnerService();
