export interface AfterHoursCall {
  id: string;
  twilio_call_sid: string;
  from_number: string;
  to_number: string;
  call_started_at: string;
  call_ended_at?: string;
  call_duration_seconds?: number;
  call_status: 'initiated' | 'recorded' | 'transcribed' | 'completed';
  
  recording_url?: string;
  transcription?: string;
  ai_summary?: string;
  ai_extracted_data?: Record<string, any>;
  
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  injury_description?: string;
  pain_level?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'emergency';
  callback_preferences?: Record<string, any>;
  
  lead_id?: string;
  conversation_id?: string;
  clinic_id?: string;
  assigned_to_user_id?: string;
  
  follow_up_scheduled_at?: string;
  follow_up_completed_at?: string;
  follow_up_notes?: string;
  outcome?: 'booked' | 'not_interested' | 'no_answer' | 'wrong_number' | 'spam';
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    status: string;
  };
  assigned_to?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
}

export interface AfterHoursStats {
  total_calls: number;
  pending_follow_ups: number;
  completed_follow_ups: number;
  booked_appointments: number;
  avg_response_time_minutes: number;
  conversion_rate: number;
}

export interface AfterHoursFilters {
  status?: string;
  urgency?: string;
  assigned_to?: string;
  outcome?: string;
  date_from?: string;
  date_to?: string;
}
