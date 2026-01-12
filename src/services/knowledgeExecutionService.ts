import { supabase } from '../lib/supabase';

export interface SOPEffectivenessTracking {
  id: string;
  sop_title: string;
  category?: string;
  measurement_period_start: string;
  measurement_period_end: string;
  views_count: number;
  incidents_before_sop: number;
  incidents_after_sop: number;
  incident_reduction_percentage: number;
  compliance_score: number;
  effectiveness_rating?: string;
}

export interface TrainingImpactAnalysis {
  id: string;
  training_program: string;
  training_date: string;
  completion_rate: number;
  average_assessment_score: number;
  pre_training_performance_metric: number;
  post_training_performance_metric: number;
  improvement_percentage: number;
  roi_calculation: number;
}

export interface KnowledgeGap {
  id: string;
  identified_date: string;
  gap_type: string;
  area: string;
  description: string;
  priority: string;
  proposed_solution?: string;
  status: string;
  target_close_date?: string;
}

export async function getSOPEffectiveness(): Promise<SOPEffectivenessTracking[]> {
  const { data, error } = await supabase
    .from('sop_effectiveness_tracking')
    .select('*')
    .order('measurement_period_end', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTrainingImpact(): Promise<TrainingImpactAnalysis[]> {
  const { data, error } = await supabase
    .from('training_impact_analysis')
    .select('*')
    .order('training_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getKnowledgeGaps(): Promise<KnowledgeGap[]> {
  const { data, error } = await supabase
    .from('knowledge_gaps')
    .select('*')
    .in('status', ['identified', 'in_progress'])
    .order('priority', { ascending: true })
    .order('identified_date', { ascending: false });

  if (error) throw error;
  return data || [];
}
