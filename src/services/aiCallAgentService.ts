import { supabase } from '../lib/supabase';

export type IntentType = 'physio' | 'orthotics' | 'wcb' | 'mva' | 'employer' | 'existing_patient' | 'unknown' | 'other';
export type ServiceType = 'physio' | 'orthotics' | 'both' | 'wcb' | 'mva' | 'unknown';
export type UrgencyLevel = 'high' | 'medium' | 'low';
export type RoutingResult = 'booked' | 'callback_requested' | 'transferred' | 'voicemail' | 'incomplete' | 'lost' | 'information_only';
export type Sentiment = 'positive' | 'neutral' | 'frustrated' | 'angry';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled' | 'reschedule_requested';
export type BookingSource = 'ai_call_agent' | 'web_form' | 'staff_manual' | 'messenger' | 'google' | 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'patient_portal';
export type AppointmentServiceType = 'physio' | 'orthotics' | 'assessment' | 'follow_up' | 'consultation' | 'employer_call' | 'wcb_assessment' | 'mva_assessment';
export type AppointmentType = 'initial_assessment' | 'orthotics_assessment' | 'follow_up' | 'consultation' | 'employer_call' | 'reassessment' | 'discharge';

export interface CallSession {
  id: string;
  created_at: string;
  updated_at: string;
  caller_phone: string;
  caller_name: string;
  transcript: string;
  ai_summary: string;
  intent_type: IntentType;
  service_type: ServiceType;
  urgency_level: UrgencyLevel;
  routing_result: RoutingResult;
  lead_id: string | null;
  appointment_id: string | null;
  assigned_location_id: string | null;
  assigned_staff_id: string | null;
  escalation_required: boolean;
  escalation_reason: string;
  call_duration_seconds: number;
  recording_url: string;
  sentiment: Sentiment;
  outcome_notes: string;
  structured_data: Record<string, unknown>;
  stage_reached: string;
  location_preference: string;
  issue_summary: string;
  callback_needed: boolean;
  insurance_context: string;
  is_existing_patient: boolean;
  staff_notes: string;
  follow_up_sent_at: string | null;
  reviewed_at: string | null;
  lead?: { id: string; first_name: string; last_name: string; status: string } | null;
  assigned_location?: { id: string; name: string } | null;
  appointment?: { id: string; status: string; start_time: string | null } | null;
}

export interface AIAppointment {
  id: string;
  created_at: string;
  updated_at: string;
  lead_id: string | null;
  clinic_location_id: string | null;
  practitioner_id: string | null;
  service_type: AppointmentServiceType;
  appointment_type: AppointmentType;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  status: AppointmentStatus;
  booking_source: BookingSource;
  notes: string;
  confirmation_code: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  insurance_type: string;
  estimated_revenue: number;
  is_new_patient: boolean;
  reminder_sent_at: string | null;
  clinic_location?: { id: string; name: string } | null;
  practitioner?: { id: string; name: string; title: string } | null;
  lead?: { id: string; first_name: string; last_name: string } | null;
}

export interface AIClinicLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  timezone: string;
  active: boolean;
  services_offered: string[];
  booking_rules: Record<string, unknown>;
  max_daily_bookings: number;
  buffer_minutes: number;
}

export interface AIPractitioner {
  id: string;
  name: string;
  title: string;
  clinic_location_id: string | null;
  services_offered: string[];
  active: boolean;
  booking_priority: number;
  accepts_new_patients: boolean;
  accepts_wcb: boolean;
  accepts_mva: boolean;
}

export interface CallAgentStats {
  total_calls: number;
  calls_today: number;
  bookings_from_calls: number;
  callback_pending: number;
  escalations: number;
  call_to_booking_rate: number;
  call_to_lead_rate: number;
  physio_bookings: number;
  orthotics_bookings: number;
  wcb_mva_calls: number;
  employer_inquiries: number;
  avg_call_duration: number;
  incomplete_calls: number;
}

export interface CallSessionFilters {
  intent_type?: IntentType;
  routing_result?: RoutingResult;
  urgency_level?: UrgencyLevel;
  escalation_required?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface AppointmentFilters {
  status?: AppointmentStatus;
  booking_source?: BookingSource;
  service_type?: AppointmentServiceType;
  clinic_location_id?: string;
  date_from?: string;
  date_to?: string;
}

export const aiCallAgentService = {

  // ─── CALL SESSIONS ────────────────────────────────────────────────────────

  async getSessions(filters?: CallSessionFilters, limit = 100): Promise<CallSession[]> {
    let query = supabase
      .from('call_sessions')
      .select(`
        *,
        lead:crm_leads(id, first_name, last_name, status),
        assigned_location:ai_clinic_locations(id, name),
        appointment:ai_appointments(id, status, start_time)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters?.intent_type) query = query.eq('intent_type', filters.intent_type);
    if (filters?.routing_result) query = query.eq('routing_result', filters.routing_result);
    if (filters?.urgency_level) query = query.eq('urgency_level', filters.urgency_level);
    if (filters?.escalation_required !== undefined) query = query.eq('escalation_required', filters.escalation_required);
    if (filters?.date_from) query = query.gte('created_at', filters.date_from);
    if (filters?.date_to) query = query.lte('created_at', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as CallSession[];
  },

  async getSessionById(id: string): Promise<CallSession | null> {
    const { data, error } = await supabase
      .from('call_sessions')
      .select(`
        *,
        lead:crm_leads(id, first_name, last_name, status, phone, email),
        assigned_location:ai_clinic_locations(id, name, address, phone),
        appointment:ai_appointments(id, status, start_time, service_type, practitioner_id)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as CallSession | null;
  },

  async getStats(): Promise<CallAgentStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [allSessions, todaySessions, appointments] = await Promise.all([
      supabase.from('call_sessions').select('routing_result, intent_type, call_duration_seconds, lead_id, escalation_required').order('created_at', { ascending: false }).limit(500),
      supabase.from('call_sessions').select('routing_result').gte('created_at', todayStart.toISOString()),
      supabase.from('ai_appointments').select('booking_source, service_type, status').eq('booking_source', 'ai_call_agent'),
    ]);

    const sessions = allSessions.data || [];
    const todayData = todaySessions.data || [];
    const appts = appointments.data || [];

    const booked = sessions.filter(s => s.routing_result === 'booked').length;
    const withLead = sessions.filter(s => s.lead_id).length;
    const durations = sessions.filter(s => s.call_duration_seconds > 0).map(s => s.call_duration_seconds);

    return {
      total_calls: sessions.length,
      calls_today: todayData.length,
      bookings_from_calls: booked,
      callback_pending: sessions.filter(s => s.routing_result === 'callback_requested').length,
      escalations: sessions.filter(s => s.escalation_required).length,
      call_to_booking_rate: sessions.length > 0 ? Math.round((booked / sessions.length) * 100) : 0,
      call_to_lead_rate: sessions.length > 0 ? Math.round((withLead / sessions.length) * 100) : 0,
      physio_bookings: appts.filter(a => a.service_type === 'physio').length,
      orthotics_bookings: appts.filter(a => a.service_type === 'orthotics').length,
      wcb_mva_calls: sessions.filter(s => s.intent_type === 'wcb' || s.intent_type === 'mva').length,
      employer_inquiries: sessions.filter(s => s.intent_type === 'employer').length,
      avg_call_duration: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      incomplete_calls: sessions.filter(s => s.routing_result === 'incomplete' || s.routing_result === 'lost').length,
    };
  },

  async updateSession(id: string, updates: Partial<CallSession>): Promise<void> {
    const { error } = await supabase
      .from('call_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async addStaffNotes(id: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('call_sessions')
      .update({ staff_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async markReviewed(id: string, reviewerId: string): Promise<void> {
    const { error } = await supabase
      .from('call_sessions')
      .update({ reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async escalate(id: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('call_sessions')
      .update({ escalation_required: true, escalation_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // ─── APPOINTMENTS ─────────────────────────────────────────────────────────

  async getAppointments(filters?: AppointmentFilters, limit = 200): Promise<AIAppointment[]> {
    let query = supabase
      .from('ai_appointments')
      .select(`
        *,
        clinic_location:ai_clinic_locations(id, name),
        practitioner:ai_practitioners(id, name, title),
        lead:crm_leads(id, first_name, last_name)
      `)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.booking_source) query = query.eq('booking_source', filters.booking_source);
    if (filters?.service_type) query = query.eq('service_type', filters.service_type);
    if (filters?.clinic_location_id) query = query.eq('clinic_location_id', filters.clinic_location_id);
    if (filters?.date_from) query = query.gte('start_time', filters.date_from);
    if (filters?.date_to) query = query.lte('start_time', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as AIAppointment[];
  },

  async getTodaysAppointments(): Promise<AIAppointment[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.getAppointments({ date_from: start.toISOString(), date_to: end.toISOString() });
  },

  async createAppointment(data: Partial<AIAppointment>): Promise<AIAppointment> {
    const { data: result, error } = await supabase
      .from('ai_appointments')
      .insert({
        ...data,
        confirmation_code: `AIM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result as unknown as AIAppointment;
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus, reason?: string): Promise<void> {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = reason || '';
    }
    if (status === 'no_show') updates.no_show_at = new Date().toISOString();
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();

    const { error } = await supabase.from('ai_appointments').update(updates).eq('id', id);
    if (error) throw error;
  },

  async getAppointmentStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [all, today] = await Promise.all([
      supabase.from('ai_appointments').select('status, booking_source, service_type, estimated_revenue').limit(500),
      supabase.from('ai_appointments').select('status, booking_source').gte('start_time', todayStart.toISOString()).lte('start_time', todayEnd.toISOString()),
    ]);

    const allData = all.data || [];
    const todayData = today.data || [];

    const totalRevenue = allData.reduce((sum, a) => sum + (Number(a.estimated_revenue) || 0), 0);

    return {
      total: allData.length,
      today: todayData.length,
      scheduled: allData.filter(a => a.status === 'scheduled').length,
      confirmed: allData.filter(a => a.status === 'confirmed').length,
      completed: allData.filter(a => a.status === 'completed').length,
      no_shows: allData.filter(a => a.status === 'no_show').length,
      cancelled: allData.filter(a => a.status === 'cancelled').length,
      from_ai_agent: allData.filter(a => a.booking_source === 'ai_call_agent').length,
      from_web: allData.filter(a => a.booking_source === 'web_form').length,
      physio: allData.filter(a => a.service_type === 'physio').length,
      orthotics: allData.filter(a => a.service_type === 'orthotics').length,
      wcb: allData.filter(a => a.service_type === 'wcb_assessment').length,
      mva: allData.filter(a => a.service_type === 'mva_assessment').length,
      total_revenue: totalRevenue,
      today_ai: todayData.filter(a => a.booking_source === 'ai_call_agent').length,
    };
  },

  // ─── CLINIC LOCATIONS ─────────────────────────────────────────────────────

  async getLocations(): Promise<AIClinicLocation[]> {
    const { data, error } = await supabase
      .from('ai_clinic_locations')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as unknown as AIClinicLocation[];
  },

  async getAllLocations(): Promise<AIClinicLocation[]> {
    const { data, error } = await supabase
      .from('ai_clinic_locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []) as unknown as AIClinicLocation[];
  },

  async upsertLocation(location: Partial<AIClinicLocation> & { id?: string }): Promise<AIClinicLocation> {
    const { data, error } = await supabase
      .from('ai_clinic_locations')
      .upsert(location)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as AIClinicLocation;
  },

  // ─── PRACTITIONERS ────────────────────────────────────────────────────────

  async getPractitioners(locationId?: string): Promise<AIPractitioner[]> {
    let query = supabase
      .from('ai_practitioners')
      .select('*')
      .eq('active', true)
      .order('booking_priority');

    if (locationId) query = query.eq('clinic_location_id', locationId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as AIPractitioner[];
  },

  // ─── BOOKING QUEUE ────────────────────────────────────────────────────────

  async getBookingQueue() {
    const [callbacks, escalations, employers, existingPatients] = await Promise.all([
      supabase.from('call_sessions').select('*, assigned_location:ai_clinic_locations(name)').eq('routing_result', 'callback_requested').is('follow_up_sent_at', null).order('created_at', { ascending: false }).limit(50),
      supabase.from('call_sessions').select('*, assigned_location:ai_clinic_locations(name)').eq('escalation_required', true).order('urgency_level', { ascending: false }).order('created_at', { ascending: false }).limit(50),
      supabase.from('call_sessions').select('*, assigned_location:ai_clinic_locations(name)').eq('intent_type', 'employer').order('created_at', { ascending: false }).limit(20),
      supabase.from('call_sessions').select('*, assigned_location:ai_clinic_locations(name)').eq('intent_type', 'existing_patient').eq('routing_result', 'callback_requested').order('created_at', { ascending: false }).limit(20),
    ]);

    return {
      callbacks: (callbacks.data || []) as unknown as CallSession[],
      escalations: (escalations.data || []) as unknown as CallSession[],
      employers: (employers.data || []) as unknown as CallSession[],
      existingPatients: (existingPatients.data || []) as unknown as CallSession[],
    };
  },

  // ─── EVENTS ───────────────────────────────────────────────────────────────

  async logEvent(params: {
    event_type: string;
    call_session_id?: string;
    appointment_id?: string;
    lead_id?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await supabase
      .from('call_agent_events')
      .insert({
        ...params,
        created_at: new Date().toISOString(),
      });

    if (error) console.error('Failed to log call agent event:', error);
  },

  // ─── CONFIG ───────────────────────────────────────────────────────────────

  async getConfig(locationId?: string) {
    let query = supabase.from('call_agent_config').select('*');
    if (locationId) {
      query = query.eq('clinic_location_id', locationId);
    } else {
      query = query.eq('is_global', true);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateConfig(id: string, updates: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('call_agent_config')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
