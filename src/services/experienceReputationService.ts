import { supabase } from '../lib/supabase';

export interface PatientSatisfactionSignal {
  id: string;
  clinic_id: string;
  signal_date: string;
  signal_type: string;
  category?: string;
  sentiment_score: number;
  touchpoint?: string;
  resolution_status?: string;
  themes?: string[];
}

export interface ComplaintTheme {
  id: string;
  clinic_id: string;
  theme_name: string;
  category: string;
  severity: string;
  occurrence_count: number;
  first_reported: string;
  last_reported: string;
  status: string;
  trend?: string;
}

export interface ChurnRiskSignal {
  id: string;
  clinic_id: string;
  signal_type: string;
  risk_level: string;
  detected_date: string;
  patient_segment?: string;
  contributing_factors?: string[];
  predicted_churn_probability: number;
  status: string;
}

export async function getPatientSatisfactionSignals(clinicId?: string): Promise<PatientSatisfactionSignal[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let query = supabase
    .from('patient_satisfaction_signals')
    .select('*')
    .gte('signal_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('signal_date', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getComplaintThemes(clinicId?: string): Promise<ComplaintTheme[]> {
  let query = supabase
    .from('complaint_themes')
    .select('*')
    .eq('status', 'active')
    .order('severity', { ascending: false })
    .order('occurrence_count', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getChurnRiskSignals(clinicId?: string): Promise<ChurnRiskSignal[]> {
  let query = supabase
    .from('churn_risk_signals')
    .select('*')
    .eq('status', 'active')
    .order('risk_level', { ascending: false })
    .order('detected_date', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export interface SatisfactionSignals {
  id: string;
  clinic_id: string;
  service_line_id?: string;
  period_start: string;
  period_end: string;
  responses_collected: number;
  average_overall_score: number;
  nps_score: number;
  promoters_count: number;
  passives_count: number;
  detractors_count: number;
  would_recommend_percentage: number;
  ease_of_booking_score: number;
  staff_friendliness_score: number;
  facility_cleanliness_score: number;
  wait_time_satisfaction_score: number;
  treatment_effectiveness_score: number;
  created_at: string;
}

export interface ReferralPartnerSatisfaction {
  id: string;
  clinic_id: string;
  partner_type: string;
  partner_name?: string;
  survey_date?: string;
  overall_satisfaction_score?: number;
  communication_score?: number;
  responsiveness_score?: number;
  quality_of_care_score?: number;
  likelihood_to_refer_score?: number;
  feedback_themes?: string[];
  improvement_areas?: string[];
  relationship_status?: string;
  follow_up_required?: boolean;
  created_at: string;
}

export interface ReputationMonitoring {
  id: string;
  clinic_id: string;
  platform: string;
  period_start: string;
  period_end: string;
  average_rating: number;
  total_reviews: number;
  new_reviews_count: number;
  positive_reviews_count: number;
  negative_reviews_count: number;
  response_rate_percentage: number;
  average_response_time_hours: number;
  created_at: string;
}

export interface ChurnRiskIndicators {
  id: string;
  clinic_id: string;
  service_line_id?: string;
  period_start: string;
  period_end: string;
  patients_at_risk_count: number;
  missed_appointments_count: number;
  declined_rebookings_count: number;
  negative_feedback_count: number;
  payment_issues_count: number;
  long_gaps_between_visits_count: number;
  risk_level: string;
  created_at: string;
}

export interface ExperienceImprovementAction {
  id: string;
  clinic_id: string;
  action_category: string;
  description: string;
  triggered_by?: string;
  status: string;
  start_date: string;
  completion_date?: string;
  expected_impact?: string;
  actual_impact_measured: boolean;
  created_at: string;
  updated_at: string;
}

export async function getSatisfactionSignals(clinicId?: string): Promise<SatisfactionSignals[]> {
  let query = supabase
    .from('satisfaction_signals')
    .select('*')
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getReferralPartnerSatisfaction(clinicId?: string): Promise<ReferralPartnerSatisfaction[]> {
  let query = supabase
    .from('referral_partner_satisfaction')
    .select('*')
    .order('created_at', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getReputationMonitoring(clinicId?: string): Promise<ReputationMonitoring[]> {
  let query = supabase
    .from('reputation_monitoring')
    .select('*')
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getChurnRiskIndicators(clinicId?: string): Promise<ChurnRiskIndicators[]> {
  let query = supabase
    .from('churn_risk_indicators')
    .select('*')
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getExperienceImprovementActions(clinicId?: string): Promise<ExperienceImprovementAction[]> {
  let query = supabase
    .from('experience_improvement_actions')
    .select('*')
    .order('start_date', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getActiveImprovementActions(clinicId?: string): Promise<ExperienceImprovementAction[]> {
  let query = supabase
    .from('experience_improvement_actions')
    .select('*')
    .in('status', ['planned', 'in_progress'])
    .order('start_date', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getHighRiskChurnIndicators(clinicId?: string): Promise<ChurnRiskIndicators[]> {
  let query = supabase
    .from('churn_risk_indicators')
    .select('*')
    .eq('risk_level', 'high')
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
