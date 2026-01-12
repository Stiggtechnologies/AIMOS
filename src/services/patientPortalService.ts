import { supabase } from '../lib/supabase';

export interface PatientProfile {
  id: string;
  user_id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  assigned_provider_id?: string;
  insurance_info?: Record<string, any>;
  status: string;
}

export interface PatientAppointment {
  id: string;
  patient_id: string;
  clinic_id: string;
  provider_id: string;
  appointment_type: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason_for_visit?: string;
  notes?: string;
  checked_in_at?: string;
  checked_out_at?: string;
}

export interface PatientDocument {
  id: string;
  patient_id: string;
  document_type: string;
  title: string;
  description?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  is_visible_to_patient: boolean;
  viewed_by_patient_at?: string;
  created_at: string;
}

export interface PatientMessage {
  id: string;
  patient_id: string;
  sender_id: string;
  sender_type: string;
  recipient_id: string;
  subject: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  priority: string;
  thread_id?: string;
  created_at: string;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  provider_id: string;
  diagnosis: string;
  treatment_goals?: string;
  plan_details: Record<string, any>;
  start_date: string;
  end_date?: string;
  status: string;
  progress_notes: any[];
  created_at: string;
}

export const patientPortalService = {
  async getPatientProfile(userId: string): Promise<PatientProfile | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updatePatientProfile(userId: string, updates: Partial<PatientProfile>) {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAppointments(patientId: string, filter?: {
    upcoming?: boolean;
    past?: boolean;
    limit?: number;
  }): Promise<PatientAppointment[]> {
    let query = supabase
      .from('patient_appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    if (filter?.upcoming) {
      query = query.gte('appointment_date', new Date().toISOString().split('T')[0]);
    }

    if (filter?.past) {
      query = query.lt('appointment_date', new Date().toISOString().split('T')[0]);
    }

    if (filter?.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getDocuments(patientId: string, filters?: {
    document_type?: string;
    limit?: number;
  }): Promise<PatientDocument[]> {
    let query = supabase
      .from('patient_documents')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_visible_to_patient', true)
      .order('created_at', { ascending: false });

    if (filters?.document_type) {
      query = query.eq('document_type', filters.document_type);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async markDocumentAsViewed(documentId: string) {
    const { error } = await supabase
      .from('patient_documents')
      .update({ viewed_by_patient_at: new Date().toISOString() })
      .eq('id', documentId);

    if (error) throw error;
  },

  async getMessages(patientId: string, filters?: {
    unread?: boolean;
    limit?: number;
  }): Promise<PatientMessage[]> {
    const { data: patient } = await supabase
      .from('patients')
      .select('user_id')
      .eq('id', patientId)
      .single();

    if (!patient) throw new Error('Patient not found');

    let query = supabase
      .from('patient_messages')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (filters?.unread) {
      query = query.eq('is_read', false);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async sendMessage(message: {
    patient_id: string;
    sender_id: string;
    sender_type: string;
    recipient_id: string;
    subject: string;
    message: string;
    priority?: string;
    thread_id?: string;
  }) {
    const { data, error } = await supabase
      .from('patient_messages')
      .insert({
        ...message,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markMessageAsRead(messageId: string) {
    const { error } = await supabase
      .from('patient_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) throw error;
  },

  async getTreatmentPlans(patientId: string): Promise<TreatmentPlan[]> {
    const { data, error } = await supabase
      .from('patient_treatment_plans')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async logAccess(patientId: string, action: string, resourceType?: string, resourceId?: string) {
    const { error } = await supabase
      .from('patient_access_logs')
      .insert({
        patient_id: patientId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        created_at: new Date().toISOString()
      });

    if (error) console.error('Error logging access:', error);
  },

  async getCareTeam(patientId: string) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        assigned_provider_id,
        primary_clinic_id
      `)
      .eq('id', patientId)
      .single();

    if (error) throw error;
    return data;
  }
};
