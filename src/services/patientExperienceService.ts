import { supabase } from '../lib/supabase';

export interface PatientExerciseProgram {
  id: string;
  patient_id: string;
  program_name: string;
  assigned_by_name: string;
  assigned_date: string;
  target_sessions: number;
  completed_sessions: number;
  is_active: boolean;
  notes: string;
  created_at: string;
}

export interface PatientExerciseLog {
  id: string;
  patient_id: string;
  exercise_program_id: string | null;
  exercise_name: string;
  completed_at: string;
  sets_completed: number;
  reps_completed: number;
  duration_minutes: number;
  pain_before: number;
  pain_after: number;
  difficulty_rating: number;
  notes: string;
}

export interface PatientProgressScore {
  id: string;
  patient_id: string;
  score_date: string;
  pain_score: number;
  function_score: number;
  mood_score: number;
  activity_level: string;
  sleep_quality: number;
  notes: string;
  created_at: string;
}

export interface PatientSecureMessage {
  id: string;
  patient_id: string;
  sender_id: string | null;
  sender_type: 'patient' | 'staff';
  sender_name: string;
  thread_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  priority: 'normal' | 'urgent' | 'low';
  created_at: string;
}

export interface PatientBillingSummary {
  id: string;
  patient_id: string;
  clinic_id: string | null;
  invoice_date: string;
  description: string;
  amount_billed: number;
  amount_paid: number;
  amount_outstanding: number;
  insurance_status: string;
  payment_status: string;
  payment_due_date: string | null;
  notes: string;
  created_at: string;
}

export const patientExperienceService = {
  async getExercisePrograms(patientId: string): Promise<PatientExerciseProgram[]> {
    const { data, error } = await supabase
      .from('patient_exercise_programs')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getExerciseLogs(patientId: string, limit = 30): Promise<PatientExerciseLog[]> {
    const { data, error } = await supabase
      .from('patient_exercise_logs')
      .select('*')
      .eq('patient_id', patientId)
      .order('completed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async logExercise(log: Omit<PatientExerciseLog, 'id'>): Promise<PatientExerciseLog> {
    const { data, error } = await supabase
      .from('patient_exercise_logs')
      .insert(log)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('No data returned');
    return data;
  },

  async getProgressScores(patientId: string, limit = 30): Promise<PatientProgressScore[]> {
    const { data, error } = await supabase
      .from('patient_progress_scores')
      .select('*')
      .eq('patient_id', patientId)
      .order('score_date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async addProgressScore(score: Omit<PatientProgressScore, 'id' | 'created_at'>): Promise<PatientProgressScore> {
    const { data, error } = await supabase
      .from('patient_progress_scores')
      .insert(score)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('No data returned');
    return data;
  },

  async getMessages(patientId: string): Promise<PatientSecureMessage[]> {
    const { data, error } = await supabase
      .from('patient_secure_messages')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PatientSecureMessage[];
  },

  async sendMessage(msg: {
    patient_id: string;
    sender_id?: string;
    sender_type: 'patient' | 'staff';
    sender_name: string;
    subject: string;
    body: string;
    priority?: string;
    thread_id?: string;
  }): Promise<PatientSecureMessage> {
    const { data, error } = await supabase
      .from('patient_secure_messages')
      .insert(msg)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('No data returned');
    return data as PatientSecureMessage;
  },

  async markMessageRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('patient_secure_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);
    if (error) throw error;
  },

  async getBillingSummaries(patientId: string): Promise<PatientBillingSummary[]> {
    const { data, error } = await supabase
      .from('patient_billing_summaries')
      .select('*')
      .eq('patient_id', patientId)
      .order('invoice_date', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
