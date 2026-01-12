import { supabase } from '../lib/supabase';

export interface Lead {
  id: string;
  external_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  service_line_id?: string;
  service_line?: {
    name: string;
    slug: string;
  };
  payor_type_id?: string;
  payor_type?: {
    name: string;
    slug: string;
  };
  clv_tier_id?: string;
  clv_tier?: {
    name: string;
    priority: number;
  };
  lead_source_id?: string;
  lead_source?: {
    name: string;
  };
  campaign_id?: string;
  clinic_id?: string;
  clinic?: {
    name: string;
  };
  status: string;
  priority: string;
  contacted_at?: string;
  contacted_by?: string;
  booked_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  time_since_created?: number;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  booked: number;
  converted: number;
  lost: number;
  avg_contact_time: number;
  conversion_rate: number;
}

export const crmLeadService = {
  async getLeads(filters?: {
    status?: string;
    priority?: string;
    clinic_id?: string;
    service_line_id?: string;
    limit?: number;
  }): Promise<Lead[]> {
    let query = supabase
      .from('crm_leads')
      .select(`
        *,
        service_line:crm_service_lines(name, slug),
        payor_type:crm_payor_types(name, slug),
        clv_tier:crm_clv_tiers(name, priority),
        lead_source:crm_lead_sources(name),
        clinic:clinics(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.clinic_id) {
      query = query.eq('clinic_id', filters.clinic_id);
    }
    if (filters?.service_line_id) {
      query = query.eq('service_line_id', filters.service_line_id);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(lead => ({
      ...lead,
      time_since_created: Math.floor(
        (new Date().getTime() - new Date(lead.created_at).getTime()) / 60000
      )
    }));
  },

  async getLiveLeadQueue(clinic_id?: string): Promise<Lead[]> {
    let query = supabase
      .from('crm_leads')
      .select(`
        *,
        service_line:crm_service_lines(name, slug, priority),
        payor_type:crm_payor_types(name, slug, priority),
        clv_tier:crm_clv_tiers(name, priority)
      `)
      .in('status', ['new', 'contacted'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    if (clinic_id) {
      query = query.eq('clinic_id', clinic_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(lead => ({
      ...lead,
      time_since_created: Math.floor(
        (new Date().getTime() - new Date(lead.created_at).getTime()) / 60000
      )
    }));
  },

  async getLeadStats(period: number = 7, clinic_id?: string): Promise<LeadStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    let query = supabase
      .from('crm_leads')
      .select('status, contacted_at, created_at')
      .gte('created_at', startDate.toISOString());

    if (clinic_id) {
      query = query.eq('clinic_id', clinic_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const leads = data || [];
    const total = leads.length;
    const byStatus = {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      booked: leads.filter(l => l.status === 'booked').length,
      converted: leads.filter(l => l.status === 'converted').length,
      lost: leads.filter(l => l.status === 'lost').length,
    };

    const contactTimes = leads
      .filter(l => l.contacted_at)
      .map(l => {
        const created = new Date(l.created_at).getTime();
        const contacted = new Date(l.contacted_at!).getTime();
        return (contacted - created) / 60000;
      });

    const avg_contact_time = contactTimes.length > 0
      ? contactTimes.reduce((a, b) => a + b, 0) / contactTimes.length
      : 0;

    const conversion_rate = total > 0
      ? (byStatus.converted / total) * 100
      : 0;

    return {
      total,
      ...byStatus,
      avg_contact_time,
      conversion_rate,
    };
  },

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert([lead])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async contactLead(id: string, user_id: string, notes?: string): Promise<Lead> {
    return this.updateLead(id, {
      status: 'contacted',
      contacted_at: new Date().toISOString(),
      contacted_by: user_id,
      notes,
    });
  },

  async getLeadById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select(`
        *,
        service_line:crm_service_lines(*),
        payor_type:crm_payor_types(*),
        clv_tier:crm_clv_tiers(*),
        lead_source:crm_lead_sources(*),
        clinic:clinics(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getServiceLines() {
    const { data, error } = await supabase
      .from('crm_service_lines')
      .select('*')
      .eq('active', true)
      .order('priority');

    if (error) throw error;
    return data || [];
  },

  async getPayorTypes() {
    const { data, error } = await supabase
      .from('crm_payor_types')
      .select('*')
      .eq('active', true)
      .order('priority');

    if (error) throw error;
    return data || [];
  },

  async getCLVTiers() {
    const { data, error } = await supabase
      .from('crm_clv_tiers')
      .select('*')
      .order('priority');

    if (error) throw error;
    return data || [];
  },

  async getLeadSources() {
    const { data, error } = await supabase
      .from('crm_lead_sources')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }
};
