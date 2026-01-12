import { supabase } from '../lib/supabase';

export interface ClinicianSchedule {
  id: string;
  clinician_id: string;
  clinic_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  schedule_type: string;
  status: string;
  notes?: string;
}

export interface QuickNote {
  id: string;
  clinician_id: string;
  patient_id?: string;
  appointment_id?: string;
  note_type: string;
  note_text: string;
  voice_memo_url?: string;
  tags: string[];
  is_draft: boolean;
  created_at: string;
}

export interface ClinicianAvailability {
  id: string;
  clinician_id: string;
  clinic_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  availability_type: string;
  effective_start_date?: string;
  effective_end_date?: string;
  notes?: string;
}

export interface AppointmentForCheckIn {
  id: string;
  patient_id: string;
  patient: {
    first_name: string;
    last_name: string;
    medical_record_number: string;
  };
  appointment_type: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason_for_visit?: string;
  checked_in_at?: string;
  checked_out_at?: string;
}

export const clinicianMobileService = {
  async getSchedule(clinicianId: string, date?: string): Promise<ClinicianSchedule[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('clinician_schedules')
      .select('*')
      .eq('clinician_id', clinicianId)
      .eq('schedule_date', targetDate)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getWeekSchedule(clinicianId: string, startDate: string): Promise<ClinicianSchedule[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const { data, error } = await supabase
      .from('clinician_schedules')
      .select('*')
      .eq('clinician_id', clinicianId)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate.toISOString().split('T')[0])
      .order('schedule_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTodaysAppointments(clinicianId: string): Promise<AppointmentForCheckIn[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('patient_appointments')
      .select(`
        *,
        patient:patients(first_name, last_name, medical_record_number)
      `)
      .eq('provider_id', clinicianId)
      .eq('appointment_date', today)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data as any || [];
  },

  async checkInPatient(appointmentId: string) {
    const { data, error } = await supabase
      .from('patient_appointments')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async checkOutPatient(appointmentId: string) {
    const { data, error } = await supabase
      .from('patient_appointments')
      .update({
        status: 'completed',
        checked_out_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAppointmentStatus(appointmentId: string, status: string) {
    const { data, error } = await supabase
      .from('patient_appointments')
      .update({ status })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createQuickNote(note: Omit<QuickNote, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('clinician_quick_notes')
      .insert(note)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getQuickNotes(clinicianId: string, filters?: {
    patientId?: string;
    appointmentId?: string;
    isDraft?: boolean;
    limit?: number;
  }): Promise<QuickNote[]> {
    let query = supabase
      .from('clinician_quick_notes')
      .select('*')
      .eq('clinician_id', clinicianId)
      .order('created_at', { ascending: false });

    if (filters?.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }

    if (filters?.appointmentId) {
      query = query.eq('appointment_id', filters.appointmentId);
    }

    if (filters?.isDraft !== undefined) {
      query = query.eq('is_draft', filters.isDraft);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updateQuickNote(noteId: string, updates: Partial<QuickNote>) {
    const { data, error } = await supabase
      .from('clinician_quick_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteQuickNote(noteId: string) {
    const { error } = await supabase
      .from('clinician_quick_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  async getAvailability(clinicianId: string): Promise<ClinicianAvailability[]> {
    const { data, error } = await supabase
      .from('clinician_availability')
      .select('*')
      .eq('clinician_id', clinicianId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async setAvailability(availability: Omit<ClinicianAvailability, 'id'>) {
    const { data, error } = await supabase
      .from('clinician_availability')
      .insert(availability)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAvailability(availabilityId: string, updates: Partial<ClinicianAvailability>) {
    const { data, error } = await supabase
      .from('clinician_availability')
      .update(updates)
      .eq('id', availabilityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAvailability(availabilityId: string) {
    const { error } = await supabase
      .from('clinician_availability')
      .delete()
      .eq('id', availabilityId);

    if (error) throw error;
  },

  async startMobileSession(clinicianId: string, deviceInfo: Record<string, any>) {
    const { data, error } = await supabase
      .from('clinician_mobile_sessions')
      .insert({
        clinician_id: clinicianId,
        device_info: deviceInfo,
        session_started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async endMobileSession(sessionId: string) {
    const { error } = await supabase
      .from('clinician_mobile_sessions')
      .update({
        session_ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async updateSessionActivity(sessionId: string) {
    const { error } = await supabase
      .from('clinician_mobile_sessions')
      .update({
        last_activity_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  },

  async getAppointmentDetails(appointmentId: string) {
    const { data, error } = await supabase
      .from('patient_appointments')
      .select(`
        *,
        patient:patients(*),
        clinic:clinics(name)
      `)
      .eq('id', appointmentId)
      .single();

    if (error) throw error;
    return data;
  }
};
