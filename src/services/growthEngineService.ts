import { supabase } from '../lib/supabase';

export interface ChannelMetrics {
  channel: string;
  label: string;
  icon: string;
  color: string;
  budget: number;
  spend: number;
  leads: number;
  bookings: number;
  revenue: number;
  cpl: number;
  cpb: number;
  roas: number;
  convRate: number;
}

export interface GrowthKPIs {
  totalLeads: number;
  totalBookings: number;
  totalRevenue: number;
  totalSpend: number;
  overallConvRate: number;
  avgCPL: number;
  avgCPB: number;
  overallROAS: number;
  newToday: number;
  activeLeads: number;
  lostLeads: number;
}

export interface PipelineLead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  status: string;
  priority: string;
  channel_source: string;
  funnel_type: string;
  urgency_level: string;
  intent_confidence: string;
  lead_value_estimate: number;
  conversion_failure_reason?: string;
  notes?: string;
  contacted_at?: string;
  booked_at?: string;
  created_at: string;
  service_line?: { name: string; slug: string };
  payor_type?: { name: string; slug: string };
  lead_source?: { name: string; slug: string };
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DailyTrend {
  date: string;
  leads: number;
  bookings: number;
  revenue: number;
}

const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  'google-ads':             { label: 'Google Ads',       icon: 'Search',   color: '#4285F4' },
  'google-business-profile':{ label: 'Google Business',  icon: 'MapPin',   color: '#34A853' },
  'facebook-ads':           { label: 'Facebook',         icon: 'Facebook', color: '#1877F2' },
  'instagram':              { label: 'Instagram',        icon: 'Instagram',color: '#E1306C' },
  'tiktok':                 { label: 'TikTok',           icon: 'Music',    color: '#010101' },
  'linkedin':               { label: 'LinkedIn',         icon: 'Linkedin', color: '#0A66C2' },
  'website-organic':        { label: 'Organic / Direct', icon: 'Globe',    color: '#059669' },
  'epc-referral':           { label: 'EPC Referral',     icon: 'Share2',   color: '#D97706' },
  'physician-referral':     { label: 'Physician Referral',icon:'Stethoscope',color:'#7C3AED'},
  'walk-in':                { label: 'Walk-in',          icon: 'Users',    color: '#6B7280' },
  'unknown':                { label: 'Other',            icon: 'HelpCircle',color:'#9CA3AF' },
};

export const PIPELINE_STAGES = [
  { key: 'new',         label: 'New Lead',     color: 'bg-gray-100 text-gray-700',   ring: 'ring-gray-300' },
  { key: 'contacted',   label: 'Contacted',    color: 'bg-blue-100 text-blue-700',    ring: 'ring-blue-300' },
  { key: 'qualified',   label: 'Qualified',    color: 'bg-amber-100 text-amber-700',  ring: 'ring-amber-300' },
  { key: 'booked',      label: 'Booked',       color: 'bg-green-100 text-green-700',  ring: 'ring-green-300' },
  { key: 'attended',    label: 'Attended',     color: 'bg-teal-100 text-teal-700',    ring: 'ring-teal-300' },
  { key: 'active_care', label: 'Active Care',  color: 'bg-cyan-100 text-cyan-700',    ring: 'ring-cyan-300' },
  { key: 'completed',   label: 'Completed',    color: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-300' },
  { key: 'lost',        label: 'Lost',         color: 'bg-red-100 text-red-700',      ring: 'ring-red-300' },
];

export const FUNNEL_TYPES = [
  { key: 'general',  label: 'General',    color: 'bg-gray-100 text-gray-700' },
  { key: 'physio',   label: 'Physio',     color: 'bg-blue-100 text-blue-700' },
  { key: 'orthotics',label: 'Orthotics',  color: 'bg-amber-100 text-amber-700' },
  { key: 'wcb',      label: 'WCB',        color: 'bg-red-100 text-red-700' },
  { key: 'mva',      label: 'MVA',        color: 'bg-orange-100 text-orange-700' },
  { key: 'sports',   label: 'Sports',     color: 'bg-green-100 text-green-700' },
  { key: 'concussion',label: 'Concussion',color: 'bg-rose-100 text-rose-700' },
  { key: 'employer', label: 'Employer',   color: 'bg-sky-100 text-sky-700' },
];

export const growthEngineService = {
  getChannelMeta(slug: string) {
    return CHANNEL_META[slug] ?? CHANNEL_META['unknown'];
  },

  async getChannelMetrics(period_month = '2026-03'): Promise<ChannelMetrics[]> {
    const { data, error } = await supabase
      .from('crm_channel_budgets')
      .select('*')
      .eq('period_month', period_month)
      .order('revenue', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => {
      const meta = CHANNEL_META[row.channel_source] ?? CHANNEL_META['unknown'];
      return {
        channel: row.channel_source,
        label:   meta.label,
        icon:    meta.icon,
        color:   meta.color,
        budget:  row.budget_amount,
        spend:   row.actual_spend,
        leads:   row.leads_count,
        bookings:row.bookings_count,
        revenue: row.revenue,
        cpl:     row.cost_per_lead,
        cpb:     row.cost_per_booking,
        roas:    row.roas,
        convRate: row.leads_count > 0 ? (row.bookings_count / row.leads_count) * 100 : 0,
      };
    });
  },

  async getGrowthKPIs(clinic_id?: string): Promise<GrowthKPIs> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabase
      .from('crm_leads')
      .select('status, booked_at, created_at, lead_value_estimate')
      .gte('created_at', startOfMonth.toISOString());

    if (clinic_id) query = query.eq('clinic_id', clinic_id);

    const { data: leads, error } = await query;
    if (error) throw error;

    const all = leads || [];
    const totalLeads    = all.length;
    const totalBookings = all.filter(l => l.status === 'booked' || l.status === 'attended' || l.status === 'active_care' || l.status === 'completed').length;
    const totalRevenue  = all.reduce((sum, l) => sum + (l.lead_value_estimate || 0), 0);
    const lostLeads     = all.filter(l => l.status === 'lost').length;
    const newToday      = all.filter(l => new Date(l.created_at) >= today).length;
    const activeLeads   = all.filter(l => ['new','contacted','qualified'].includes(l.status)).length;

    const { data: budgets } = await supabase
      .from('crm_channel_budgets')
      .select('actual_spend, leads_count, bookings_count, revenue')
      .eq('period_month', '2026-03');

    const bAll = budgets || [];
    const totalSpend    = bAll.reduce((s, b) => s + (b.actual_spend || 0), 0);
    const bLeads        = bAll.reduce((s, b) => s + (b.leads_count || 0), 0);
    const bBookings     = bAll.reduce((s, b) => s + (b.bookings_count || 0), 0);
    const bRevenue      = bAll.reduce((s, b) => s + (b.revenue || 0), 0);

    return {
      totalLeads,
      totalBookings,
      totalRevenue,
      totalSpend,
      overallConvRate: totalLeads > 0 ? (totalBookings / totalLeads) * 100 : 0,
      avgCPL: bLeads > 0 ? totalSpend / bLeads : 0,
      avgCPB: bBookings > 0 ? totalSpend / bBookings : 0,
      overallROAS: totalSpend > 0 ? bRevenue / totalSpend : 0,
      newToday,
      activeLeads,
      lostLeads,
    };
  },

  async getPipelineLeads(filters?: {
    status?: string;
    channel_source?: string;
    funnel_type?: string;
    clinic_id?: string;
    limit?: number;
  }): Promise<PipelineLead[]> {
    let query = supabase
      .from('crm_leads')
      .select(`
        id, first_name, last_name, phone, email, status, priority,
        channel_source, funnel_type, urgency_level, intent_confidence,
        lead_value_estimate, conversion_failure_reason, notes,
        contacted_at, booked_at, created_at,
        service_line:crm_service_lines(name, slug),
        payor_type:crm_payor_types(name, slug),
        lead_source:crm_lead_sources(name, slug)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status)         query = query.eq('status', filters.status);
    if (filters?.channel_source) query = query.eq('channel_source', filters.channel_source);
    if (filters?.funnel_type)    query = query.eq('funnel_type', filters.funnel_type);
    if (filters?.clinic_id)      query = query.eq('clinic_id', filters.clinic_id);
    query = query.limit(filters?.limit ?? 200);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as PipelineLead[];
  },

  async updateLeadStatus(id: string, status: string, extra?: Partial<PipelineLead>): Promise<void> {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString(), ...extra };
    if (status === 'booked') updates.booked_at = new Date().toISOString();
    if (status === 'contacted') updates.contacted_at = new Date().toISOString();
    const { error } = await supabase.from('crm_leads').update(updates).eq('id', id);
    if (error) throw error;
  },

  async createLead(lead: {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    channel_source: string;
    funnel_type: string;
    urgency_level: string;
    intent_confidence: string;
    lead_value_estimate: number;
    notes?: string;
    clinic_id?: string;
  }): Promise<PipelineLead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert([{ ...lead, status: 'new', priority: 'medium' }])
      .select()
      .single();
    if (error) throw error;
    return data as PipelineLead;
  },

  async addActivity(lead_id: string, activity_type: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('crm_lead_activities')
      .insert([{ lead_id, activity_type, notes }]);
    if (error) throw error;
  },

  async getLeadActivities(lead_id: string): Promise<LeadActivity[]> {
    const { data, error } = await supabase
      .from('crm_lead_activities')
      .select('*')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as LeadActivity[];
  },

  async getDailyTrends(days = 14): Promise<DailyTrend[]> {
    const start = new Date();
    start.setDate(start.getDate() - days);

    const { data, error } = await supabase
      .from('crm_leads')
      .select('status, created_at, lead_value_estimate, booked_at')
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const byDay: Record<string, DailyTrend> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { date: key, leads: 0, bookings: 0, revenue: 0 };
    }

    (data || []).forEach(lead => {
      const key = lead.created_at.slice(0, 10);
      if (byDay[key]) {
        byDay[key].leads += 1;
        if (['booked', 'attended', 'active_care', 'completed'].includes(lead.status)) {
          byDay[key].bookings += 1;
          byDay[key].revenue  += lead.lead_value_estimate || 0;
        }
      }
    });

    return Object.values(byDay);
  },
};
