import { supabase } from '../lib/supabase';

export interface Campaign {
  id: string;
  external_id?: string;
  name: string;
  service_line_id?: string;
  service_line?: {
    name: string;
    slug: string;
  };
  clinic_id?: string;
  clinic?: {
    name: string;
  };
  status: string;
  daily_budget?: number;
  actual_spend?: number;
  total_clicks?: number;
  total_impressions?: number;
  total_leads?: number;
  total_bookings?: number;
  total_revenue?: number;
  cpa?: number;
  roas?: number;
  auto_throttle_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Keyword {
  id: string;
  campaign_id: string;
  keyword: string;
  match_type: string;
  clicks: number;
  impressions: number;
  spend: number;
  leads: number;
  revenue: number;
  cpa?: number;
  roas?: number;
  status: string;
}

export interface CampaignStats {
  total_spend: number;
  total_revenue: number;
  total_leads: number;
  avg_cpa: number;
  avg_roas: number;
  active_campaigns: number;
}

export const crmCampaignService = {
  async getCampaigns(filters?: {
    status?: string;
    clinic_id?: string;
    service_line_id?: string;
  }): Promise<Campaign[]> {
    let query = supabase
      .from('crm_campaigns')
      .select(`
        *,
        service_line:crm_service_lines(name, slug),
        clinic:clinics(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }
    if (filters?.service_line_id) {
      query = query.eq('service_line_id', filters.service_line_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getCampaignStats(period: number = 30): Promise<CampaignStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const { data, error } = await supabase
      .from('crm_campaigns')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const campaigns = data || [];
    const active = campaigns.filter(c => c.status === 'active');

    return {
      total_spend: campaigns.reduce((sum, c) => sum + (c.actual_spend || 0), 0),
      total_revenue: campaigns.reduce((sum, c) => sum + (c.total_revenue || 0), 0),
      total_leads: campaigns.reduce((sum, c) => sum + (c.total_leads || 0), 0),
      avg_cpa: campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + (c.cpa || 0), 0) / campaigns.length
        : 0,
      avg_roas: campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + (c.roas || 0), 0) / campaigns.length
        : 0,
      active_campaigns: active.length,
    };
  },

  async getKeywords(campaign_id: string): Promise<Keyword[]> {
    const { data, error } = await supabase
      .from('crm_keywords')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('revenue', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTopKeywords(limit: number = 10): Promise<Keyword[]> {
    const { data, error } = await supabase
      .from('crm_keywords')
      .select('*')
      .eq('status', 'active')
      .order('revenue', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getBottomKeywords(limit: number = 10): Promise<Keyword[]> {
    const { data, error } = await supabase
      .from('crm_keywords')
      .select('*')
      .eq('status', 'active')
      .gt('spend', 0)
      .order('roas', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async updateCampaignStatus(id: string, status: string): Promise<Campaign> {
    const { data, error } = await supabase
      .from('crm_campaigns')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async pauseCampaign(id: string): Promise<Campaign> {
    return this.updateCampaignStatus(id, 'paused');
  },

  async activateCampaign(id: string): Promise<Campaign> {
    return this.updateCampaignStatus(id, 'active');
  },

  async updateKeywordStatus(id: string, status: string): Promise<Keyword> {
    const { data, error } = await supabase
      .from('crm_keywords')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFunnelData(service_line_id?: string, period: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    let campaignQuery = supabase
      .from('crm_campaigns')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (service_line_id) {
      campaignQuery = campaignQuery.eq('service_line_id', service_line_id);
    }

    const { data: campaigns, error: campaignError } = await campaignQuery;
    if (campaignError) throw campaignError;

    const totalClicks = campaigns?.reduce((sum, c) => sum + (c.total_clicks || 0), 0) || 0;
    const totalLeads = campaigns?.reduce((sum, c) => sum + (c.total_leads || 0), 0) || 0;
    const totalBookings = campaigns?.reduce((sum, c) => sum + (c.total_bookings || 0), 0) || 0;
    const totalRevenue = campaigns?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0;

    return {
      clicks: totalClicks,
      leads: totalLeads,
      booked: totalBookings,
      revenue: totalRevenue,
      click_to_lead: totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0,
      lead_to_booking: totalLeads > 0 ? (totalBookings / totalLeads) * 100 : 0,
      revenue_per_lead: totalLeads > 0 ? totalRevenue / totalLeads : 0,
    };
  }
};
