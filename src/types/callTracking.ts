export type CallSourceType = 'google_ads' | 'meta_ads' | 'bing_ads' | 'organic' | 'referral' | 'direct' | 'other';

export type CallStatus = 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'missed' | 'voicemail';

export type CallOutcome =
  | 'booked'
  | 'callback'
  | 'no_answer'
  | 'not_qualified'
  | 'price_objection'
  | 'already_booked'
  | 'spam';

export interface CallTrackingCall {
  id: string;
  twilio_call_sid: string;
  from_number: string | null;
  to_number: string;

  source_type: CallSourceType | null;
  source_detail: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  gclid: string | null;
  fbclid: string | null;
  referrer: string | null;
  landing_page_url: string | null;

  call_started_at: string;
  call_ended_at: string | null;
  call_duration_seconds: number | null;
  call_status: CallStatus;
  recording_url: string | null;

  outcome: CallOutcome | null;
  outcome_notes: string | null;
  outcome_tagged_at: string | null;

  lead_id: string | null;
  clinic_id: string | null;

  created_at: string;
  updated_at: string;

  // joins
  lead?: { id: string; first_name: string; last_name: string; status: string } | null;
  clinic?: { id: string; name: string } | null;
}

export interface CallTrackingStats {
  total_calls: number;
  answered_calls: number;
  missed_calls: number;
  booked_calls: number;
  avg_duration_seconds: number | null;
  booking_rate: number;
}

export interface CallTrackingFilters {
  source_type?: CallSourceType;
  status?: CallStatus;
  outcome?: CallOutcome;
  date_from?: string;
  date_to?: string;
}
