import { supabase } from '../lib/supabase';

export interface ServicePricing {
  id: string;
  clinic_id: string;
  service_name: string;
  standard_price: number;
  payer_name?: string;
  payer_rate?: number;
  payer_rate_percentage?: number;
  effective_date: string;
  is_active: boolean;
}

export interface PayerContract {
  id: string;
  clinic_id: string;
  payer_name: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  revenue_last_12_months: number;
  revenue_percentage: number;
  status: string;
  risk_level?: string;
  renewal_status?: string;
}

export interface ContractRenewalAlert {
  id: string;
  clinic_id: string;
  alert_type: string;
  severity: string;
  days_until_renewal: number;
  action_required: string;
  action_by_date: string;
  status: string;
  contract?: PayerContract;
}

export interface MarginByServiceLine {
  id: string;
  clinic_id: string;
  service_line_name: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  gross_margin: number;
  gross_margin_percentage: number;
  contribution_margin_percentage: number;
}

export async function getPayerContracts(clinicId?: string): Promise<PayerContract[]> {
  let query = supabase
    .from('payer_contracts')
    .select('*')
    .order('revenue_last_12_months', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getContractRenewalAlerts(): Promise<ContractRenewalAlert[]> {
  const { data, error } = await supabase
    .from('contract_renewal_alerts')
    .select(`
      *,
      contract:payer_contracts(*)
    `)
    .in('status', ['pending', 'in_progress'])
    .order('days_until_renewal', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMarginByServiceLine(clinicId?: string): Promise<MarginByServiceLine[]> {
  let query = supabase
    .from('margin_by_service_line')
    .select('*')
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getServicePricing(clinicId?: string): Promise<ServicePricing[]> {
  let query = supabase
    .from('service_pricing_matrix')
    .select('*')
    .eq('is_active', true)
    .order('service_name');

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
