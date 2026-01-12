import { supabase } from '../lib/supabase';

export interface KPINormalization {
  id: string;
  period: string;
  period_start: string;
  period_end: string;
  reported_revenue: number;
  normalized_revenue: number;
  revenue_adjustments?: any;
  reported_ebitda: number;
  normalized_ebitda: number;
  ebitda_adjustments?: any;
  reported_gross_margin: number;
  normalized_gross_margin: number;
  reported_operating_margin: number;
  normalized_operating_margin: number;
  customer_acquisition_cost: number;
  lifetime_value: number;
  ltv_cac_ratio: number;
  rule_of_40_score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DiligenceCategory {
  id: string;
  category_code: string;
  category_name: string;
  description: string;
  importance_level: string;
  typical_buyer_focus?: string;
  display_order: number;
  created_at: string;
}

export interface DiligenceChecklist {
  id: string;
  category_id: string;
  item_number: string;
  item_name: string;
  description: string;
  required_for_exit: boolean;
  buyer_scrutiny_level: string;
  completion_status: string;
  completion_percentage: number;
  assigned_owner_id?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  evidence_location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  category?: DiligenceCategory;
}

export interface DataRoomFolder {
  id: string;
  folder_path: string;
  folder_name: string;
  parent_folder_id?: string;
  folder_type: string;
  diligence_category_id?: string;
  description?: string;
  document_count: number;
  is_confidential: boolean;
  access_level: string;
  display_order: number;
  created_at: string;
}

export interface DataRoomDocument {
  id: string;
  folder_id: string;
  document_name: string;
  document_type: string;
  description?: string;
  file_path?: string;
  file_size_mb: number;
  version: string;
  upload_date: string;
  last_updated: string;
  uploaded_by_user_id?: string;
  is_redacted: boolean;
  requires_nda: boolean;
  access_log_enabled: boolean;
  status: string;
  created_at: string;
}

export interface MaturityDimension {
  id: string;
  dimension_code: string;
  dimension_name: string;
  description: string;
  weight: number;
  max_score: number;
  evaluation_criteria?: any;
  created_at: string;
}

export interface MaturityAssessment {
  id: string;
  assessment_date: string;
  dimension_id: string;
  current_score: number;
  target_score: number;
  score_rationale?: string;
  strengths?: string[];
  weaknesses?: string[];
  improvement_initiatives?: string[];
  assessed_by_user_id?: string;
  next_assessment_date?: string;
  created_at: string;
  dimension?: MaturityDimension;
}

export interface ExitReadinessMetric {
  id: string;
  metric_date: string;
  overall_readiness_score: number;
  diligence_completion_percentage: number;
  data_room_completion_percentage: number;
  maturity_score: number;
  financial_quality_score: number;
  operational_quality_score: number;
  tech_quality_score: number;
  estimated_multiple_low: number;
  estimated_multiple_high: number;
  value_creation_opportunities?: any;
  red_flags?: any;
  competitive_advantages?: any;
  created_at: string;
}

export interface BuyerProfile {
  id: string;
  buyer_type: string;
  buyer_name: string;
  typical_check_size_min: number;
  typical_check_size_max: number;
  preferred_revenue_range_min: number;
  preferred_revenue_range_max: number;
  key_evaluation_criteria?: string[];
  typical_hold_period?: string;
  integration_approach?: string;
  deal_structure_preference?: string;
  fit_score: number;
  created_at: string;
}

export interface ValueDriver {
  id: string;
  driver_category: string;
  driver_name: string;
  description: string;
  current_rating: string;
  impact_on_multiple: string;
  supporting_evidence?: string;
  improvement_plan?: string;
  target_timeline?: string;
  created_at: string;
  updated_at: string;
}

export async function getKPINormalizations(): Promise<KPINormalization[]> {
  const { data, error } = await supabase
    .from('kpi_normalizations')
    .select('*')
    .order('period_start', { ascending: false })
    .limit(12);

  if (error) throw error;
  return data || [];
}

export async function getLatestKPINormalization(): Promise<KPINormalization | null> {
  const { data, error } = await supabase
    .from('kpi_normalizations')
    .select('*')
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getDiligenceCategories(): Promise<DiligenceCategory[]> {
  const { data, error } = await supabase
    .from('diligence_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getDiligenceChecklists(): Promise<DiligenceChecklist[]> {
  const { data, error } = await supabase
    .from('diligence_checklists')
    .select(`
      *,
      category:diligence_categories(*)
    `)
    .order('item_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getIncompleteDiligenceItems(): Promise<DiligenceChecklist[]> {
  const { data, error } = await supabase
    .from('diligence_checklists')
    .select(`
      *,
      category:diligence_categories(*)
    `)
    .in('completion_status', ['not_started', 'in_progress'])
    .order('required_for_exit', { ascending: false })
    .order('buyer_scrutiny_level', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDataRoomFolders(): Promise<DataRoomFolder[]> {
  const { data, error } = await supabase
    .from('data_room_structure')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getDataRoomDocuments(): Promise<DataRoomDocument[]> {
  const { data, error } = await supabase
    .from('data_room_documents')
    .select('*')
    .order('folder_id', { ascending: true })
    .order('document_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMaturityDimensions(): Promise<MaturityDimension[]> {
  const { data, error } = await supabase
    .from('operational_maturity_dimensions')
    .select('*')
    .order('dimension_code', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getLatestMaturityAssessments(): Promise<MaturityAssessment[]> {
  const { data, error } = await supabase
    .from('maturity_assessments')
    .select(`
      *,
      dimension:operational_maturity_dimensions(*)
    `)
    .order('assessment_date', { ascending: false });

  if (error) throw error;

  const latestByDimension = new Map<string, MaturityAssessment>();
  (data || []).forEach((assessment) => {
    if (!latestByDimension.has(assessment.dimension_id)) {
      latestByDimension.set(assessment.dimension_id, assessment);
    }
  });

  return Array.from(latestByDimension.values());
}

export async function getLatestExitReadinessMetric(): Promise<ExitReadinessMetric | null> {
  const { data, error } = await supabase
    .from('exit_readiness_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getExitReadinessMetrics(): Promise<ExitReadinessMetric[]> {
  const { data, error } = await supabase
    .from('exit_readiness_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(12);

  if (error) throw error;
  return data || [];
}

export async function getBuyerProfiles(): Promise<BuyerProfile[]> {
  const { data, error } = await supabase
    .from('buyer_profiles')
    .select('*')
    .order('fit_score', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getValueDrivers(): Promise<ValueDriver[]> {
  const { data, error } = await supabase
    .from('value_drivers')
    .select('*')
    .order('driver_category', { ascending: true })
    .order('driver_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function calculateValuationReadinessMetrics() {
  const [
    kpis,
    categories,
    checklists,
    folders,
    documents,
    dimensions,
    assessments,
    exitMetrics,
    buyers,
    drivers,
  ] = await Promise.all([
    getKPINormalizations(),
    getDiligenceCategories(),
    getDiligenceChecklists(),
    getDataRoomFolders(),
    getDataRoomDocuments(),
    getMaturityDimensions(),
    getLatestMaturityAssessments(),
    getLatestExitReadinessMetric(),
    getBuyerProfiles(),
    getValueDrivers(),
  ]);

  const completedItems = checklists.filter(
    (item) => item.completion_status === 'complete'
  ).length;
  const totalItems = checklists.length;
  const diligenceCompletion = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const requiredItems = checklists.filter((item) => item.required_for_exit);
  const completedRequiredItems = requiredItems.filter(
    (item) => item.completion_status === 'complete'
  ).length;
  const requiredCompletion = requiredItems.length > 0
    ? Math.round((completedRequiredItems / requiredItems.length) * 100)
    : 0;

  const publishedDocs = documents.filter((doc) => doc.status === 'approved' || doc.status === 'published').length;
  const totalDocs = documents.length;
  const dataRoomCompletion = totalDocs > 0 ? Math.round((publishedDocs / totalDocs) * 100) : 0;

  const avgMaturityScore = assessments.length > 0
    ? Math.round(
        assessments.reduce((sum, a) => sum + a.current_score, 0) / assessments.length
      )
    : 0;

  const strongDrivers = drivers.filter((d) => d.current_rating === 'strong').length;
  const weakDrivers = drivers.filter((d) => d.current_rating === 'weak').length;

  const highFitBuyers = buyers.filter((b) => b.fit_score >= 80).length;

  return {
    diligenceCompletion,
    requiredCompletion,
    dataRoomCompletion,
    avgMaturityScore,
    overallReadiness: exitMetrics?.overall_readiness_score || 0,
    estimatedMultipleLow: exitMetrics?.estimated_multiple_low || 0,
    estimatedMultipleHigh: exitMetrics?.estimated_multiple_high || 0,
    totalChecklistItems: totalItems,
    completedChecklistItems: completedItems,
    incompleteItems: totalItems - completedItems,
    totalDocuments: totalDocs,
    publishedDocuments: publishedDocs,
    draftDocuments: documents.filter((d) => d.status === 'draft').length,
    maturityDimensions: dimensions.length,
    strongValueDrivers: strongDrivers,
    weakValueDrivers: weakDrivers,
    totalValueDrivers: drivers.length,
    potentialBuyers: buyers.length,
    highFitBuyers,
    latestKPI: kpis[0] || null,
  };
}

export interface ValuationKPI {
  id: string;
  measurement_date: string;
  fiscal_period: string;
  revenue: number;
  adjusted_ebitda: number;
  ebitda_margin: number;
  revenue_growth_rate: number;
  customer_retention_rate: number;
  ltv_cac_ratio: number;
  rule_of_40_score: number;
  gross_margin: number;
  free_cash_flow: number;
  quality_of_earnings_score: number;
}

export interface OperationalMaturityScore {
  id: string;
  assessment_date: string;
  dimension: string;
  score: number;
  maturity_level?: string;
  description?: string;
  strengths?: string[];
  gaps?: string[];
}

export interface BuyerReadinessItem {
  id: string;
  category: string;
  item_name: string;
  description?: string;
  priority: string;
  status: string;
  completion_percentage: number;
  due_date?: string;
}

export interface ValuationAdjustment {
  id: string;
  fiscal_period: string;
  adjustment_type: string;
  adjustment_category?: string;
  description: string;
  amount: number;
  is_addback: boolean;
  recurring: boolean;
  justification: string;
}

export async function getValuationKPIs(): Promise<ValuationKPI[]> {
  const kpis = await getKPINormalizations();
  return kpis.map(k => ({
    id: k.id,
    measurement_date: k.period_start,
    fiscal_period: k.period,
    revenue: k.normalized_revenue,
    adjusted_ebitda: k.normalized_ebitda,
    ebitda_margin: k.normalized_operating_margin,
    revenue_growth_rate: 0,
    customer_retention_rate: 0,
    ltv_cac_ratio: k.ltv_cac_ratio,
    rule_of_40_score: k.rule_of_40_score,
    gross_margin: k.normalized_gross_margin,
    free_cash_flow: 0,
    quality_of_earnings_score: 0,
  }));
}

export async function getOperationalMaturityScores(): Promise<OperationalMaturityScore[]> {
  const assessments = await getLatestMaturityAssessments();
  return assessments.map(a => ({
    id: a.id,
    assessment_date: a.assessment_date,
    dimension: a.dimension?.dimension_name || '',
    score: a.current_score,
    maturity_level: undefined,
    description: a.score_rationale,
    strengths: a.strengths,
    gaps: a.weaknesses,
  }));
}

export async function getBuyerReadinessChecklist(): Promise<BuyerReadinessItem[]> {
  const checklists = await getDiligenceChecklists();
  return checklists.map(c => ({
    id: c.id,
    category: c.category?.category_name || '',
    item_name: c.item_name,
    description: c.description,
    priority: c.buyer_scrutiny_level,
    status: c.completion_status,
    completion_percentage: c.completion_percentage,
    due_date: c.target_completion_date,
  }));
}

export async function getValuationAdjustments(): Promise<ValuationAdjustment[]> {
  const kpis = await getKPINormalizations();
  const adjustments: ValuationAdjustment[] = [];

  kpis.forEach(k => {
    if (k.ebitda_adjustments) {
      const adj = k.ebitda_adjustments as any;
      if (Array.isArray(adj)) {
        adj.forEach((item: any, idx: number) => {
          adjustments.push({
            id: `${k.id}-${idx}`,
            fiscal_period: k.period,
            adjustment_type: item.type || 'addback',
            adjustment_category: item.category,
            description: item.description || '',
            amount: item.amount || 0,
            is_addback: true,
            recurring: item.recurring || false,
            justification: item.justification || '',
          });
        });
      }
    }
  });

  return adjustments;
}
