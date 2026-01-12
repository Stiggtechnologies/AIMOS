import { supabase } from '../lib/supabase';

export interface CapitalRequest {
  id: string;
  request_number: string;
  clinic_id?: string;
  requested_by_user_id?: string;
  request_date: string;
  project_title: string;
  project_description: string;
  investment_category: string;
  requested_amount: number;
  investment_timeline_months: number;
  strategic_priority: string;
  business_case?: string;
  expected_annual_roi_percent: number;
  payback_period_months?: number;
  revenue_impact_year1: number;
  revenue_impact_year2: number;
  revenue_impact_year3: number;
  cost_savings_year1: number;
  cost_savings_year2: number;
  cost_savings_year3: number;
  risk_assessment?: string;
  alternative_options_considered?: string;
  status: string;
  submitted_date?: string;
  decision_date?: string;
  decision_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CapitalApproval {
  id: string;
  request_id: string;
  approver_user_id?: string;
  approval_level: string;
  review_date: string;
  decision: string;
  comments?: string;
  conditions?: string[];
  created_at: string;
  request?: CapitalRequest;
}

export interface CapitalInvestment {
  id: string;
  request_id: string;
  investment_number: string;
  clinic_id?: string;
  approved_amount: number;
  actual_spent: number;
  funding_date: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  project_status: string;
  percent_complete: number;
  budget_variance_percent: number;
  timeline_variance_days: number;
  project_manager_user_id?: string;
  milestones?: any;
  issues?: string[];
  created_at: string;
  updated_at: string;
  request?: CapitalRequest;
}

export interface InvestmentReview {
  id: string;
  investment_id: string;
  review_date: string;
  review_period: string;
  reviewed_by_user_id?: string;
  actual_roi_percent: number;
  actual_revenue_impact: number;
  actual_cost_savings: number;
  performance_vs_projection?: string;
  success_metrics?: any;
  lessons_learned?: string;
  recommendations?: string;
  overall_rating?: number;
  created_at: string;
  investment?: CapitalInvestment;
}

export interface ClinicReinvestment {
  id: string;
  clinic_id: string;
  fiscal_year: number;
  fiscal_quarter: number;
  total_revenue: number;
  total_investments: number;
  reinvestment_rate_percent: number;
  investment_categories?: any;
  roi_performance: number;
  benchmark_comparison?: string;
  created_at: string;
  updated_at: string;
}

export async function getCapitalRequests(): Promise<CapitalRequest[]> {
  const { data, error } = await supabase
    .from('capital_requests')
    .select('*')
    .order('request_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPendingCapitalRequests(): Promise<CapitalRequest[]> {
  const { data, error } = await supabase
    .from('capital_requests')
    .select('*')
    .in('status', ['submitted', 'under_review'])
    .order('submitted_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getApprovedCapitalRequests(): Promise<CapitalRequest[]> {
  const { data, error } = await supabase
    .from('capital_requests')
    .select('*')
    .in('status', ['approved', 'funded'])
    .order('decision_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCapitalRequestsByCategory(category: string): Promise<CapitalRequest[]> {
  const { data, error } = await supabase
    .from('capital_requests')
    .select('*')
    .eq('investment_category', category)
    .order('request_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCapitalApprovals(): Promise<CapitalApproval[]> {
  const { data, error } = await supabase
    .from('capital_approvals')
    .select(`
      *,
      request:capital_requests(*)
    `)
    .order('review_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCapitalApprovalsByRequest(requestId: string): Promise<CapitalApproval[]> {
  const { data, error } = await supabase
    .from('capital_approvals')
    .select('*')
    .eq('request_id', requestId)
    .order('review_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCapitalInvestments(): Promise<CapitalInvestment[]> {
  const { data, error } = await supabase
    .from('capital_investments')
    .select(`
      *,
      request:capital_requests(*)
    `)
    .order('funding_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getActiveCapitalInvestments(): Promise<CapitalInvestment[]> {
  const { data, error } = await supabase
    .from('capital_investments')
    .select(`
      *,
      request:capital_requests(*)
    `)
    .in('project_status', ['planning', 'in_progress'])
    .order('expected_completion_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCompletedCapitalInvestments(): Promise<CapitalInvestment[]> {
  const { data, error } = await supabase
    .from('capital_investments')
    .select(`
      *,
      request:capital_requests(*)
    `)
    .eq('project_status', 'completed')
    .order('actual_completion_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getInvestmentReviews(): Promise<InvestmentReview[]> {
  const { data, error } = await supabase
    .from('investment_reviews')
    .select(`
      *,
      investment:capital_investments(*)
    `)
    .order('review_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getInvestmentReviewsByInvestment(investmentId: string): Promise<InvestmentReview[]> {
  const { data, error } = await supabase
    .from('investment_reviews')
    .select('*')
    .eq('investment_id', investmentId)
    .order('review_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getClinicReinvestments(): Promise<ClinicReinvestment[]> {
  const { data, error } = await supabase
    .from('clinic_reinvestments')
    .select('*')
    .order('fiscal_year', { ascending: false })
    .order('fiscal_quarter', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getClinicReinvestmentsByYear(fiscalYear: number): Promise<ClinicReinvestment[]> {
  const { data, error } = await supabase
    .from('clinic_reinvestments')
    .select('*')
    .eq('fiscal_year', fiscalYear)
    .order('fiscal_quarter', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function calculatePortfolioMetrics() {
  const requests = await getCapitalRequests();
  const investments = await getCapitalInvestments();
  const reviews = await getInvestmentReviews();

  const totalRequested = requests.reduce((sum, r) => sum + (r.requested_amount || 0), 0);
  const totalApproved = requests.filter(r => ['approved', 'funded'].includes(r.status))
    .reduce((sum, r) => sum + (r.requested_amount || 0), 0);
  const totalInvested = investments.reduce((sum, i) => sum + (i.actual_spent || 0), 0);

  const avgROI = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.actual_roi_percent || 0), 0) / reviews.length
    : 0;

  const approvalRate = requests.length > 0
    ? (requests.filter(r => r.status === 'approved').length / requests.length) * 100
    : 0;

  return {
    totalRequested,
    totalApproved,
    totalInvested,
    avgROI,
    approvalRate,
    activeInvestments: investments.filter(i => ['planning', 'in_progress'].includes(i.project_status)).length,
    completedInvestments: investments.filter(i => i.project_status === 'completed').length,
    pendingRequests: requests.filter(r => ['submitted', 'under_review'].includes(r.status)).length,
  };
}
