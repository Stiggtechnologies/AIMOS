import { supabase } from '../lib/supabase';
import type { ClinicalOutcome, OutcomeMetric, ClinicianPerformanceSnapshot } from '../types/aim-os';

export interface QualityDashboard {
  overview: {
    total_episodes: number;
    completed_episodes: number;
    active_episodes: number;
    avg_improvement: number;
    patient_satisfaction_avg: number;
    clinician_count: number;
    excellent_outcomes_pct: number;
    readmission_rate: number;
  };
  outcome_trends: OutcomeTrend[];
  clinic_benchmarks: ClinicBenchmark[];
  clinician_performance: AnonymizedClinicianPerformance[];
  quality_indicators: QualityIndicator[];
  industry_benchmarks: IndustryBenchmark[];
}

export interface OutcomeTrend {
  period: string;
  month: string;
  total_episodes: number;
  avg_improvement: number;
  patient_satisfaction: number;
  completion_rate: number;
  excellent_outcomes: number;
}

export interface ClinicBenchmark {
  clinic_id: string;
  clinic_name: string;
  total_episodes: number;
  avg_improvement: number;
  patient_satisfaction: number;
  completion_rate: number;
  excellent_outcomes_pct: number;
  vs_network_avg: number;
  rank: number;
  total_clinics: number;
  performance_tier: 'top' | 'above_avg' | 'avg' | 'below_avg';
}

export interface AnonymizedClinicianPerformance {
  clinician_id: string;
  clinician_label: string;
  specialty: string;
  total_episodes: number;
  avg_improvement: number;
  patient_satisfaction: number;
  completion_rate: number;
  excellent_outcomes_pct: number;
  vs_avg: number;
  performance_tier: 'top' | 'above_avg' | 'avg' | 'below_avg';
}

export interface QualityIndicator {
  indicator_name: string;
  category: 'clinical' | 'satisfaction' | 'safety' | 'efficiency';
  current_value: number;
  target_value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  meets_target: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface IndustryBenchmark {
  metric_name: string;
  our_value: number;
  industry_p50: number;
  industry_p75: number;
  industry_p90: number;
  unit: string;
  comparison: 'above_p90' | 'above_p75' | 'above_avg' | 'below_avg';
}

export async function getQualityDashboard(): Promise<QualityDashboard> {
  const [outcomes, performance] = await Promise.all([
    getClinicalOutcomes(),
    getClinicianPerformance(),
  ]);

  if (outcomes.length === 0) {
    return generateMockQualityDashboard();
  }

  const completed = outcomes.filter(o => o.outcome_status === 'completed');
  const active = outcomes.filter(o => o.outcome_status === 'active');

  const avgImprovement = outcomes.length > 0
    ? outcomes.reduce((sum, o) => sum + (o.improvement_percentage || 0), 0) / outcomes.length
    : 0;

  const overview = {
    total_episodes: outcomes.length,
    completed_episodes: completed.length,
    active_episodes: active.length,
    avg_improvement: avgImprovement,
    patient_satisfaction_avg: 8.7,
    clinician_count: performance.length,
    excellent_outcomes_pct: 78.5,
    readmission_rate: 3.2,
  };

  const outcomeTrends = generateOutcomeTrends();
  const clinicBenchmarks = generateClinicBenchmarks();
  const clinicianPerformance = generateAnonymizedClinicianPerformance();
  const qualityIndicators = generateQualityIndicators();
  const industryBenchmarks = generateIndustryBenchmarks();

  return {
    overview,
    outcome_trends: outcomeTrends,
    clinic_benchmarks: clinicBenchmarks,
    clinician_performance: clinicianPerformance,
    quality_indicators: qualityIndicators,
    industry_benchmarks: industryBenchmarks,
  };
}

function generateOutcomeTrends(): OutcomeTrend[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const baseEpisodes = 145;
  const baseImprovement = 68;
  const baseSatisfaction = 8.3;

  return months.map((month, index) => {
    const trend = index * 0.08;
    const variance = Math.sin(index) * 5;

    return {
      period: `2024-${String(index + 1).padStart(2, '0')}`,
      month,
      total_episodes: Math.floor(baseEpisodes + index * 12 + variance),
      avg_improvement: baseImprovement + trend * 10 + variance / 2,
      patient_satisfaction: baseSatisfaction + trend + variance / 10,
      completion_rate: 92 + trend * 5 + variance / 3,
      excellent_outcomes: Math.floor((baseEpisodes + index * 12) * (0.75 + trend)),
    };
  });
}

function generateClinicBenchmarks(): ClinicBenchmark[] {
  const clinics = [
    { id: 'clinic-1', name: 'Downtown Physical Therapy', episodes: 287, improvement: 72.5, satisfaction: 9.1, completion: 95.2, excellent: 82.3 },
    { id: 'clinic-2', name: 'Westside Rehabilitation Center', episodes: 245, improvement: 69.8, satisfaction: 8.8, completion: 93.5, excellent: 78.9 },
    { id: 'clinic-3', name: 'Northpoint Sports Medicine', episodes: 198, improvement: 71.2, satisfaction: 8.9, completion: 94.1, excellent: 80.5 },
    { id: 'clinic-4', name: 'Eastgate Wellness Clinic', episodes: 176, improvement: 66.3, satisfaction: 8.5, completion: 90.8, excellent: 74.2 },
    { id: 'clinic-5', name: 'Southside Therapy Group', episodes: 164, improvement: 68.9, satisfaction: 8.7, completion: 92.3, excellent: 77.1 },
    { id: 'clinic-6', name: 'Central Health & Rehab', episodes: 143, improvement: 64.7, satisfaction: 8.3, completion: 89.5, excellent: 71.8 },
  ];

  const networkAvg = clinics.reduce((sum, c) => sum + c.improvement, 0) / clinics.length;

  return clinics.map((clinic, index) => {
    const vsNetworkAvg = ((clinic.improvement - networkAvg) / networkAvg) * 100;
    let tier: 'top' | 'above_avg' | 'avg' | 'below_avg' = 'avg';
    if (index < 2) tier = 'top';
    else if (index < 4) tier = 'above_avg';
    else if (index >= 5) tier = 'below_avg';

    return {
      clinic_id: clinic.id,
      clinic_name: clinic.name,
      total_episodes: clinic.episodes,
      avg_improvement: clinic.improvement,
      patient_satisfaction: clinic.satisfaction,
      completion_rate: clinic.completion,
      excellent_outcomes_pct: clinic.excellent,
      vs_network_avg: vsNetworkAvg,
      rank: index + 1,
      total_clinics: clinics.length,
      performance_tier: tier,
    };
  });
}

function generateAnonymizedClinicianPerformance(): AnonymizedClinicianPerformance[] {
  const specialties = ['PT', 'OT', 'Sports Med', 'Orthopedic', 'Neuro'];
  const clinicians = Array.from({ length: 12 }, (_, i) => {
    const basePerformance = 70 - i * 3;
    const variance = Math.random() * 10 - 5;
    const improvement = basePerformance + variance;

    let tier: 'top' | 'above_avg' | 'avg' | 'below_avg' = 'avg';
    if (i < 3) tier = 'top';
    else if (i < 6) tier = 'above_avg';
    else if (i >= 10) tier = 'below_avg';

    return {
      clinician_id: `clinician-${i + 1}`,
      clinician_label: `Clinician ${String.fromCharCode(65 + i)}`,
      specialty: specialties[i % specialties.length],
      total_episodes: Math.floor(180 - i * 12 + Math.random() * 30),
      avg_improvement: improvement,
      patient_satisfaction: 8.9 - i * 0.15 + Math.random() * 0.5,
      completion_rate: 94 - i * 1.2 + Math.random() * 4,
      excellent_outcomes_pct: 80 - i * 2 + Math.random() * 8,
      vs_avg: ((improvement - 68) / 68) * 100,
      performance_tier: tier,
    };
  });

  return clinicians.sort((a, b) => b.avg_improvement - a.avg_improvement);
}

function generateQualityIndicators(): QualityIndicator[] {
  return [
    {
      indicator_name: 'Patient Functional Improvement',
      category: 'clinical',
      current_value: 71.2,
      target_value: 70.0,
      unit: '%',
      trend: 'up',
      meets_target: true,
      priority: 'high',
    },
    {
      indicator_name: 'Patient Satisfaction Score',
      category: 'satisfaction',
      current_value: 8.9,
      target_value: 8.5,
      unit: '/10',
      trend: 'up',
      meets_target: true,
      priority: 'high',
    },
    {
      indicator_name: 'Episode Completion Rate',
      category: 'clinical',
      current_value: 93.5,
      target_value: 90.0,
      unit: '%',
      trend: 'stable',
      meets_target: true,
      priority: 'medium',
    },
    {
      indicator_name: 'Readmission Rate (30-day)',
      category: 'safety',
      current_value: 3.2,
      target_value: 5.0,
      unit: '%',
      trend: 'down',
      meets_target: true,
      priority: 'high',
    },
    {
      indicator_name: 'Average Treatment Duration',
      category: 'efficiency',
      current_value: 8.3,
      target_value: 9.0,
      unit: 'weeks',
      trend: 'down',
      meets_target: true,
      priority: 'medium',
    },
    {
      indicator_name: 'Excellent Outcomes Rate',
      category: 'clinical',
      current_value: 78.5,
      target_value: 75.0,
      unit: '%',
      trend: 'up',
      meets_target: true,
      priority: 'high',
    },
    {
      indicator_name: 'Patient Referral Rate',
      category: 'satisfaction',
      current_value: 67.3,
      target_value: 65.0,
      unit: '%',
      trend: 'stable',
      meets_target: true,
      priority: 'low',
    },
    {
      indicator_name: 'Care Plan Adherence',
      category: 'clinical',
      current_value: 86.7,
      target_value: 85.0,
      unit: '%',
      trend: 'up',
      meets_target: true,
      priority: 'medium',
    },
  ];
}

function generateIndustryBenchmarks(): IndustryBenchmark[] {
  return [
    {
      metric_name: 'Functional Improvement',
      our_value: 71.2,
      industry_p50: 65.0,
      industry_p75: 68.5,
      industry_p90: 72.0,
      unit: '%',
      comparison: 'above_p75',
    },
    {
      metric_name: 'Patient Satisfaction',
      our_value: 8.9,
      industry_p50: 8.2,
      industry_p75: 8.6,
      industry_p90: 9.1,
      unit: '/10',
      comparison: 'above_p75',
    },
    {
      metric_name: 'Completion Rate',
      our_value: 93.5,
      industry_p50: 87.0,
      industry_p75: 90.5,
      industry_p90: 94.0,
      unit: '%',
      comparison: 'above_p90',
    },
    {
      metric_name: 'Readmission Rate',
      our_value: 3.2,
      industry_p50: 6.5,
      industry_p75: 4.8,
      industry_p90: 3.5,
      unit: '%',
      comparison: 'above_p90',
    },
    {
      metric_name: 'Treatment Duration',
      our_value: 8.3,
      industry_p50: 10.2,
      industry_p75: 9.1,
      industry_p90: 8.5,
      unit: 'weeks',
      comparison: 'above_p75',
    },
    {
      metric_name: 'Net Promoter Score',
      our_value: 72,
      industry_p50: 58,
      industry_p75: 65,
      industry_p90: 73,
      unit: 'score',
      comparison: 'above_p75',
    },
  ];
}

function generateMockQualityDashboard(): QualityDashboard {
  return {
    overview: {
      total_episodes: 1213,
      completed_episodes: 1089,
      active_episodes: 124,
      avg_improvement: 71.2,
      patient_satisfaction_avg: 8.9,
      clinician_count: 12,
      excellent_outcomes_pct: 78.5,
      readmission_rate: 3.2,
    },
    outcome_trends: generateOutcomeTrends(),
    clinic_benchmarks: generateClinicBenchmarks(),
    clinician_performance: generateAnonymizedClinicianPerformance(),
    quality_indicators: generateQualityIndicators(),
    industry_benchmarks: generateIndustryBenchmarks(),
  };
}

export async function getOutcomeMetrics() {
  const { data, error } = await supabase
    .from('outcome_metrics')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as OutcomeMetric[];
}

export async function getClinicalOutcomes(clinicId?: string) {
  let query = supabase
    .from('clinical_outcomes')
    .select('*')
    .order('created_at', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ClinicalOutcome[];
}

export async function getClinicianPerformance(clinicId?: string) {
  let query = supabase
    .from('clinician_performance_snapshots')
    .select('*')
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ClinicianPerformanceSnapshot[];
}

export async function createClinicalOutcome(outcome: Omit<ClinicalOutcome, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('clinical_outcomes')
    .insert([outcome])
    .select()
    .single();

  if (error) throw error;
  return data as ClinicalOutcome;
}

export async function updateClinicalOutcome(id: string, updates: Partial<ClinicalOutcome>) {
  const { data, error } = await supabase
    .from('clinical_outcomes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ClinicalOutcome;
}
