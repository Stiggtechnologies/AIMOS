import { supabase } from '../lib/supabase';

export async function getFinancialSnapshots() {
  const { data, error } = await supabase
    .from('financial_snapshots')
    .select('*')
    .order('period_start', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getClinicFinancialMetrics(clinicId?: string) {
  let query = supabase
    .from('clinic_financial_metrics')
    .select('*')
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error} = await query;
  if (error) throw error;
  return data || [];
}

export async function createFinancialSnapshot(snapshot: any) {
  const { data, error } = await supabase
    .from('financial_snapshots')
    .insert([snapshot])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAccountsReceivableAging(clinicId?: string) {
  let query = supabase
    .from('accounts_receivable_aging')
    .select('*')
    .order('snapshot_date', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCashFlowForecasts(clinicId?: string, limit: number = 12) {
  let query = supabase
    .from('cash_flow_forecasts')
    .select('*')
    .order('forecast_date', { ascending: false })
    .limit(limit);

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getFinancialBudgets(clinicId?: string, year?: number) {
  let query = supabase
    .from('financial_budgets')
    .select('*')
    .order('period_start', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  if (year) {
    query = query.eq('budget_year', year);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getFinancialAlerts(clinicId?: string, status: string = 'open') {
  let query = supabase
    .from('financial_alerts')
    .select('*')
    .order('alert_date', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getServiceLinePerformance(clinicId?: string) {
  let query = supabase
    .from('service_line_performance')
    .select('*')
    .order('total_revenue', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateFinancialAlert(alertId: string, updates: any) {
  const { data, error } = await supabase
    .from('financial_alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFinancialKPIs(clinicId?: string) {
  const [snapshots, arAging, alerts, serviceLine] = await Promise.all([
    getFinancialSnapshots(),
    getAccountsReceivableAging(clinicId),
    getFinancialAlerts(clinicId, 'open'),
    getServiceLinePerformance(clinicId)
  ]);

  const latestSnapshot = snapshots[0];
  const totalAR = arAging.reduce((sum: number, item: any) => sum + (item.total_outstanding || 0), 0);
  const atRiskAR = arAging.reduce((sum: number, item: any) => sum + (item.at_risk_amount || 0), 0);
  const criticalAlerts = alerts.filter((a: any) => a.severity === 'critical').length;
  const highAlerts = alerts.filter((a: any) => a.severity === 'high').length;

  const topServiceLine = serviceLine[0];
  const negativeMarginServices = serviceLine.filter((s: any) => s.gross_margin_percent < 0).length;

  return {
    totalRevenue: latestSnapshot?.total_revenue || 0,
    revenuePerVisit: latestSnapshot?.revenue_per_visit || 0,
    operatingMargin: latestSnapshot?.operating_margin_percent || 0,
    totalAR,
    atRiskAR,
    arPercentAtRisk: totalAR > 0 ? (atRiskAR / totalAR) * 100 : 0,
    dso: latestSnapshot?.days_sales_outstanding || 0,
    criticalAlerts,
    highAlerts,
    totalAlerts: alerts.length,
    topServiceLine: topServiceLine?.service_line || 'N/A',
    topServiceRevenue: topServiceLine?.total_revenue || 0,
    negativeMarginServices,
    workingCapital: latestSnapshot?.working_capital || 0,
    currentRatio: latestSnapshot?.current_ratio || 0
  };
}
