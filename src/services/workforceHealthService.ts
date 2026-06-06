import { supabase } from '../lib/supabase';

export interface WorkloadMetric {
  id: string;
  staff_id?: string;
  clinic_id?: string;
  metric_date: string;
  total_patient_contacts?: number;
  total_clinical_hours?: number;
  total_admin_hours?: number;
  overtime_hours?: number;
  consecutive_days_worked?: number;
  high_intensity_shift_count?: number;
  workload_score?: number;
  risk_level?: string;
  burnout_risk_score?: number;
  days_without_break?: number;
  evening_weekend_hours?: number;
  cancelled_pto_count?: number;
  last_pto_date?: string;
  avg_patient_complexity?: number;
  documentation_backlog_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface PulseSurvey {
  id: string;
  survey_code: string;
  survey_name: string;
  description?: string;
  is_anonymous?: boolean;
  target_roles?: string[];
  questions: any;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PulseSurveyResponse {
  id: string;
  survey_id?: string;
  respondent_id?: string;
  clinic_id?: string;
  role?: string;
  responses: any;
  sentiment_score?: number;
  burnout_indicators?: any;
  resilience_score?: number;
  support_needs?: any;
  submitted_at?: string;
}

export interface StaffWellbeingFlag {
  id: string;
  staff_id?: string;
  flag_type?: string;
  severity?: string;
  flag_date: string;
  description?: string;
  auto_generated?: boolean;
  source?: string;
  action_taken?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_by?: string;
  consecutive_flag_count?: number;
  last_flag_type?: string;
  escalation_level?: number;
  intervention_recommended?: boolean;
  confidential_notes?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkloadBalanceSummary {
  id: string;
  clinic_id?: string;
  department?: string;
  summary_date: string;
  staff_count: number;
  avg_workload_score?: number;
  avg_burnout_risk?: number;
  high_risk_percentage?: number;
  avg_consecutive_days?: number;
  avg_overtime_hours?: number;
  avg_days_since_pto?: number;
  balance_status?: 'balanced' | 'strained' | 'critical';
  trend_direction?: 'improving' | 'stable' | 'declining';
  created_at: string;
  updated_at: string;
}

export interface BurnoutRiskIndicator {
  id: string;
  indicator_code: string;
  indicator_name: string;
  category?: 'workload' | 'schedule' | 'environment' | 'support' | 'recovery';
  description?: string;
  severity_weight?: number;
  threshold_value?: number;
  intervention_trigger?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkforceHealthTrend {
  id: string;
  clinic_id?: string;
  department?: string;
  trend_date: string;
  metric_type: string;
  metric_value?: number;
  staff_count?: number;
  comparison_previous_period?: number;
  status?: 'healthy' | 'watch' | 'concern' | 'critical';
  notes?: string;
  created_at: string;
}

export interface WorkforceHealthDashboard {
  overview: {
    total_staff: number;
    at_risk_count: number;
    high_risk_percentage: number;
    avg_burnout_score: number;
    active_flags: number;
    resolved_flags_30d: number;
    survey_participation_rate: number;
    avg_sentiment_score: number;
  };
  balance_summary: WorkloadBalanceSummary[];
  critical_indicators: {
    indicator: BurnoutRiskIndicator;
    affected_staff_count: number;
    trend: string;
  }[];
  recent_flags: StaffWellbeingFlag[];
  survey_insights: {
    survey: PulseSurvey;
    response_count: number;
    avg_sentiment: number;
    key_themes: string[];
  }[];
  health_trends: WorkforceHealthTrend[];
}

export async function getWorkforceHealthDashboard(): Promise<WorkforceHealthDashboard> {
  const [balanceSummary, indicators, flags, surveys, trends] = await Promise.all([
    getWorkloadBalanceSummaries(),
    getBurnoutRiskIndicators(),
    getStaffWellbeingFlags(),
    getPulseSurveys(),
    getHealthTrends(),
  ]);

  const activeFlags = flags.filter(f => !f.resolved_at);
  const resolvedFlags30d = flags.filter(f =>
    f.resolved_at &&
    new Date(f.resolved_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );

  const atRiskFlags = flags.filter(f =>
    !f.resolved_at &&
    (f.severity === 'high' || f.intervention_recommended)
  );

  const avgBurnoutScore = balanceSummary.length > 0
    ? balanceSummary.reduce((sum, s) => sum + (s.avg_burnout_risk || 0), 0) / balanceSummary.length
    : 0;

  const totalStaff = balanceSummary.reduce((sum, s) => sum + s.staff_count, 0);
  const highRiskStaff = balanceSummary.reduce((sum, s) =>
    sum + (s.staff_count * (s.high_risk_percentage || 0) / 100), 0
  );

  return {
    overview: {
      total_staff: totalStaff,
      at_risk_count: atRiskFlags.length,
      high_risk_percentage: totalStaff > 0 ? (highRiskStaff / totalStaff) * 100 : 0,
      avg_burnout_score: avgBurnoutScore,
      active_flags: activeFlags.length,
      resolved_flags_30d: resolvedFlags30d.length,
      survey_participation_rate: 0,
      avg_sentiment_score: 0,
    },
    balance_summary: balanceSummary,
    critical_indicators: indicators
      .filter(i => i.intervention_trigger)
      .map(indicator => ({
        indicator,
        affected_staff_count: 0,
        trend: 'stable',
      })),
    recent_flags: flags.slice(0, 10),
    survey_insights: surveys.map(survey => ({
      survey,
      response_count: 0,
      avg_sentiment: 0,
      key_themes: [],
    })),
    health_trends: trends,
  };
}

export async function getWorkloadBalanceSummaries(): Promise<WorkloadBalanceSummary[]> {
  const { data, error } = await supabase
    .from('workload_balance_summary')
    .select('*')
    .order('summary_date', { ascending: false })
    .limit(50);

  if (error) return generateMockBalanceSummaries();
  return data as WorkloadBalanceSummary[];
}

export async function getBurnoutRiskIndicators(): Promise<BurnoutRiskIndicator[]> {
  const { data, error } = await supabase
    .from('burnout_risk_indicators')
    .select('*')
    .eq('is_active', true)
    .order('severity_weight', { ascending: false });

  if (error) throw error;
  return data as BurnoutRiskIndicator[];
}

export async function getHealthTrends(clinicId?: string): Promise<WorkforceHealthTrend[]> {
  let query = supabase
    .from('workforce_health_trends')
    .select('*')
    .order('trend_date', { ascending: false })
    .limit(100);

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) return generateMockHealthTrends();
  return data as WorkforceHealthTrend[];
}

export async function getWorkloadMetrics(clinicId?: string, staffId?: string): Promise<WorkloadMetric[]> {
  let query = supabase
    .from('workload_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(100);

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  if (staffId) {
    query = query.eq('staff_id', staffId);
  }

  const { data, error } = await query;
  if (error) return [];
  return data as WorkloadMetric[];
}

export async function getPulseSurveys(activeOnly: boolean = true): Promise<PulseSurvey[]> {
  let query = supabase
    .from('pulse_surveys')
    .select('*')
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) return generateMockPulseSurveys();
  return data as PulseSurvey[];
}

export async function getPulseSurveyResponses(surveyId: string): Promise<PulseSurveyResponse[]> {
  const { data, error } = await supabase
    .from('pulse_survey_responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data as PulseSurveyResponse[];
}

export async function getStaffWellbeingFlags(staffId?: string, activeOnly: boolean = false): Promise<StaffWellbeingFlag[]> {
  let query = supabase
    .from('staff_wellbeing_flags')
    .select('*')
    .order('flag_date', { ascending: false })
    .limit(100);

  if (staffId) {
    query = query.eq('staff_id', staffId);
  }

  if (activeOnly) {
    query = query.is('resolved_at', null);
  }

  const { data, error } = await query;
  if (error) return generateMockWellbeingFlags();
  return data as StaffWellbeingFlag[];
}

export async function createWorkloadMetric(metric: Omit<WorkloadMetric, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('workload_metrics')
    .insert([metric])
    .select()
    .single();

  if (error) throw error;
  return data as WorkloadMetric;
}

export async function submitPulseSurveyResponse(response: Omit<PulseSurveyResponse, 'id' | 'submitted_at'>) {
  const { data, error } = await supabase
    .from('pulse_survey_responses')
    .insert([response])
    .select()
    .single();

  if (error) throw error;
  return data as PulseSurveyResponse;
}

export async function createWellbeingFlag(flag: Omit<StaffWellbeingFlag, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('staff_wellbeing_flags')
    .insert([flag])
    .select()
    .single();

  if (error) throw error;
  return data as StaffWellbeingFlag;
}

export async function resolveWellbeingFlag(flagId: string, actionTaken: string) {
  const { data, error } = await supabase
    .from('staff_wellbeing_flags')
    .update({
      resolved_at: new Date().toISOString(),
      action_taken: actionTaken,
    })
    .eq('id', flagId)
    .select()
    .single();

  if (error) throw error;
  return data as StaffWellbeingFlag;
}

function generateMockBalanceSummaries(): WorkloadBalanceSummary[] {
  return [
    {
      id: 'summary-1',
      clinic_id: 'clinic-1',
      department: 'Physical Therapy',
      summary_date: new Date().toISOString().split('T')[0],
      staff_count: 12,
      avg_workload_score: 72,
      avg_burnout_risk: 45,
      high_risk_percentage: 16.7,
      avg_consecutive_days: 5.2,
      avg_overtime_hours: 3.5,
      avg_days_since_pto: 45,
      balance_status: 'strained',
      trend_direction: 'declining',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'summary-2',
      clinic_id: 'clinic-2',
      department: 'Occupational Therapy',
      summary_date: new Date().toISOString().split('T')[0],
      staff_count: 8,
      avg_workload_score: 58,
      avg_burnout_risk: 28,
      high_risk_percentage: 0,
      avg_consecutive_days: 4.1,
      avg_overtime_hours: 1.2,
      avg_days_since_pto: 28,
      balance_status: 'balanced',
      trend_direction: 'stable',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

function generateMockHealthTrends(): WorkforceHealthTrend[] {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return {
      id: `trend-${i}`,
      clinic_id: 'clinic-1',
      department: 'Physical Therapy',
      trend_date: date.toISOString().split('T')[0],
      metric_type: 'burnout_risk',
      metric_value: 40 + Math.random() * 20,
      staff_count: 12,
      comparison_previous_period: (Math.random() - 0.5) * 10,
      status: 'watch',
      created_at: date.toISOString(),
    };
  });
}

function generateMockPulseSurveys(): PulseSurvey[] {
  return [
    {
      id: 'survey-1',
      survey_code: 'PULSE-2025-01',
      survey_name: 'January Workforce Health Check',
      description: 'Monthly anonymous pulse survey to assess staff wellbeing and workload balance',
      is_anonymous: true,
      target_roles: ['clinician', 'clinic_manager'],
      questions: [
        { id: 'q1', text: 'How would you rate your current workload?', type: 'scale', scale: 5 },
        { id: 'q2', text: 'Do you feel supported by your team?', type: 'scale', scale: 5 },
        { id: 'q3', text: 'What would help reduce your stress?', type: 'text' },
      ],
      is_active: true,
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];
}

function generateMockWellbeingFlags(): StaffWellbeingFlag[] {
  return [
    {
      id: 'flag-1',
      flag_type: 'consecutive_days',
      severity: 'high',
      flag_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Staff member has worked 12 consecutive days without a break',
      auto_generated: true,
      source: 'workload_monitor',
      consecutive_flag_count: 1,
      escalation_level: 2,
      intervention_recommended: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'flag-2',
      flag_type: 'high_overtime',
      severity: 'medium',
      flag_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: 'Overtime hours exceeded threshold (15 hours)',
      auto_generated: true,
      source: 'workload_monitor',
      consecutive_flag_count: 2,
      escalation_level: 1,
      intervention_recommended: false,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
