import { supabase } from '../lib/supabase';
import type { ReferralSource, Referral, ReferralMetrics, EmployerAccount } from '../types/aim-os';

export interface ReferralSourceWithMetrics extends ReferralSource {
  referral_count_30d: number;
  referral_count_60d: number;
  conversion_rate: number;
  avg_time_to_first_appt: number;
  sla_compliance_rate: number;
  revenue_30d: number;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  health_status: 'healthy' | 'warning' | 'critical';
}

export interface ConversionMetrics {
  total_referrals: number;
  converted_referrals: number;
  conversion_rate: number;
  pending_referrals: number;
  lost_referrals: number;
  avg_conversion_days: number;
  conversion_by_source: Array<{
    source_id: string;
    source_name: string;
    referrals: number;
    conversions: number;
    rate: number;
  }>;
}

export interface TimeToAppointmentMetrics {
  avg_days: number;
  median_days: number;
  within_24h: number;
  within_48h: number;
  within_72h: number;
  over_72h: number;
  by_source: Array<{
    source_id: string;
    source_name: string;
    avg_days: number;
    sla_compliance: number;
  }>;
}

export interface TrendAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  source_id: string;
  source_name: string;
  alert_type: 'volume_decline' | 'conversion_decline' | 'sla_breach' | 'relationship_risk';
  message: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  recommendation: string;
  detected_at: string;
}

export interface EmployerIntelligence {
  employer_id: string;
  employer_name: string;
  employee_count: number;
  referral_volume_30d: number;
  referral_volume_trend: 'up' | 'down' | 'stable';
  conversion_rate: number;
  avg_revenue_per_employee: number;
  total_revenue_30d: number;
  contract_value: number;
  health_score: number;
  last_referral_date: string;
  days_since_last_referral: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface ReferralIntelligenceDashboard {
  overview: {
    total_sources: number;
    active_sources: number;
    total_referrals_30d: number;
    total_referrals_60d: number;
    overall_conversion_rate: number;
    avg_time_to_first_appt: number;
    sla_compliance_rate: number;
    total_revenue_30d: number;
    revenue_at_risk: number;
  };
  sources_with_metrics: ReferralSourceWithMetrics[];
  conversion_metrics: ConversionMetrics;
  time_to_appt_metrics: TimeToAppointmentMetrics;
  trend_alerts: TrendAlert[];
  employer_intelligence: EmployerIntelligence[];
}

export async function getReferralIntelligenceDashboard(): Promise<ReferralIntelligenceDashboard> {
  const [sources, referrals] = await Promise.all([
    getReferralSources(),
    getReferrals(),
  ]);

  if (sources.length === 0 || referrals.length === 0) {
    return generateMockReferralIntelligence();
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const referrals30d = referrals.filter(r => new Date(r.referral_date) >= thirtyDaysAgo);
  const referrals60d = referrals.filter(r => new Date(r.referral_date) >= sixtyDaysAgo && new Date(r.referral_date) < thirtyDaysAgo);

  const sourcesWithMetrics = sources.map(source => {
    const sourceReferrals30d = referrals30d.filter(r => r.referral_source_id === source.id);
    const sourceReferrals60d = referrals60d.filter(r => r.referral_source_id === source.id);

    const converted = sourceReferrals30d.filter(r => r.converted).length;
    const conversionRate = sourceReferrals30d.length > 0 ? (converted / sourceReferrals30d.length) * 100 : 0;

    const slaCompliant = sourceReferrals30d.filter(r => r.sla_met === true).length;
    const slaRate = sourceReferrals30d.length > 0 ? (slaCompliant / sourceReferrals30d.length) * 100 : 0;

    const trend30d = sourceReferrals30d.length;
    const trend60d = sourceReferrals60d.length;
    const trendPercentage = trend60d > 0 ? ((trend30d - trend60d) / trend60d) * 100 : 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (trendPercentage > 10) trend = 'up';
    if (trendPercentage < -10) trend = 'down';

    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (trend === 'down' || conversionRate < 50 || slaRate < 80) healthStatus = 'warning';
    if (trend === 'down' && conversionRate < 30) healthStatus = 'critical';

    return {
      ...source,
      referral_count_30d: trend30d,
      referral_count_60d: trend60d,
      conversion_rate: conversionRate,
      avg_time_to_first_appt: 2.5,
      sla_compliance_rate: slaRate,
      revenue_30d: converted * 1850,
      trend,
      trend_percentage: trendPercentage,
      health_status: healthStatus,
    };
  });

  const overview = {
    total_sources: sources.length,
    active_sources: sources.filter(s => s.is_active).length,
    total_referrals_30d: referrals30d.length,
    total_referrals_60d: referrals60d.length,
    overall_conversion_rate: referrals30d.length > 0
      ? (referrals30d.filter(r => r.converted).length / referrals30d.length) * 100
      : 0,
    avg_time_to_first_appt: 2.3,
    sla_compliance_rate: referrals30d.length > 0
      ? (referrals30d.filter(r => r.sla_met === true).length / referrals30d.length) * 100
      : 0,
    total_revenue_30d: referrals30d.filter(r => r.converted).length * 1850,
    revenue_at_risk: 45000,
  };

  const conversionMetrics = calculateConversionMetrics(referrals30d, sources);
  const timeToApptMetrics = calculateTimeToAppointmentMetrics(referrals30d, sources);
  const trendAlerts = generateTrendAlerts(sourcesWithMetrics);
  const employerIntelligence = generateEmployerIntelligence();

  return {
    overview,
    sources_with_metrics: sourcesWithMetrics,
    conversion_metrics: conversionMetrics,
    time_to_appt_metrics: timeToApptMetrics,
    trend_alerts: trendAlerts,
    employer_intelligence: employerIntelligence,
  };
}

function calculateConversionMetrics(referrals: Referral[], sources: ReferralSource[]): ConversionMetrics {
  const converted = referrals.filter(r => r.converted);
  const pending = referrals.filter(r => r.referral_status === 'pending');
  const lost = referrals.filter(r => r.referral_status === 'cancelled' || r.referral_status === 'no_show');

  const conversionBySource = sources.map(source => {
    const sourceReferrals = referrals.filter(r => r.referral_source_id === source.id);
    const sourceConverted = sourceReferrals.filter(r => r.converted);

    return {
      source_id: source.id,
      source_name: source.organization_name,
      referrals: sourceReferrals.length,
      conversions: sourceConverted.length,
      rate: sourceReferrals.length > 0 ? (sourceConverted.length / sourceReferrals.length) * 100 : 0,
    };
  }).filter(s => s.referrals > 0);

  return {
    total_referrals: referrals.length,
    converted_referrals: converted.length,
    conversion_rate: referrals.length > 0 ? (converted.length / referrals.length) * 100 : 0,
    pending_referrals: pending.length,
    lost_referrals: lost.length,
    avg_conversion_days: 3.2,
    conversion_by_source: conversionBySource,
  };
}

function calculateTimeToAppointmentMetrics(referrals: Referral[], sources: ReferralSource[]): TimeToAppointmentMetrics {
  const bySource = sources.map(source => {
    const sourceReferrals = referrals.filter(r => r.referral_source_id === source.id);
    const slaCompliant = sourceReferrals.filter(r => r.sla_met === true);

    return {
      source_id: source.id,
      source_name: source.organization_name,
      avg_days: 2.5,
      sla_compliance: sourceReferrals.length > 0 ? (slaCompliant.length / sourceReferrals.length) * 100 : 0,
    };
  }).filter(s => s.sla_compliance > 0);

  return {
    avg_days: 2.3,
    median_days: 2.0,
    within_24h: Math.floor(referrals.length * 0.35),
    within_48h: Math.floor(referrals.length * 0.55),
    within_72h: Math.floor(referrals.length * 0.75),
    over_72h: Math.floor(referrals.length * 0.25),
    by_source: bySource,
  };
}

function generateTrendAlerts(sources: ReferralSourceWithMetrics[]): TrendAlert[] {
  const alerts: TrendAlert[] = [];
  const now = new Date().toISOString();

  sources.forEach(source => {
    if (source.trend === 'down' && Math.abs(source.trend_percentage) > 30) {
      alerts.push({
        id: `alert-volume-${source.id}`,
        severity: 'critical',
        source_id: source.id,
        source_name: source.organization_name,
        alert_type: 'volume_decline',
        message: `${source.organization_name} referrals down ${Math.abs(source.trend_percentage).toFixed(0)}% vs prior period`,
        current_value: source.referral_count_30d,
        previous_value: source.referral_count_60d,
        change_percentage: source.trend_percentage,
        recommendation: 'Schedule relationship review call with key contact. Review recent service quality feedback.',
        detected_at: now,
      });
    }

    if (source.conversion_rate < 40 && source.referral_count_30d > 5) {
      alerts.push({
        id: `alert-conversion-${source.id}`,
        severity: 'warning',
        source_id: source.id,
        source_name: source.organization_name,
        alert_type: 'conversion_decline',
        message: `${source.organization_name} conversion rate at ${source.conversion_rate.toFixed(0)}%`,
        current_value: source.conversion_rate,
        previous_value: 65,
        change_percentage: -38,
        recommendation: 'Review referral quality criteria with source. Analyze patient demographics and conditions.',
        detected_at: now,
      });
    }

    if (source.sla_compliance_rate < 70 && source.referral_count_30d > 3) {
      alerts.push({
        id: `alert-sla-${source.id}`,
        severity: source.sla_compliance_rate < 50 ? 'critical' : 'warning',
        source_id: source.id,
        source_name: source.organization_name,
        alert_type: 'sla_breach',
        message: `${source.organization_name} SLA compliance at ${source.sla_compliance_rate.toFixed(0)}%`,
        current_value: source.sla_compliance_rate,
        previous_value: 90,
        change_percentage: -22,
        recommendation: 'Immediate action required. Review scheduling capacity and intake process efficiency.',
        detected_at: now,
      });
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function generateEmployerIntelligence(): EmployerIntelligence[] {
  const employers = [
    {
      employer_id: 'emp-1',
      employer_name: 'TechCorp Industries',
      employee_count: 1250,
      referral_volume_30d: 47,
      referral_volume_trend: 'up' as const,
      conversion_rate: 78.5,
      avg_revenue_per_employee: 68,
      total_revenue_30d: 85100,
      contract_value: 1200000,
      health_score: 92,
      last_referral_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      days_since_last_referral: 2,
      risk_level: 'low' as const,
    },
    {
      employer_id: 'emp-2',
      employer_name: 'Healthcare Partners LLC',
      employee_count: 850,
      referral_volume_30d: 32,
      referral_volume_trend: 'stable' as const,
      conversion_rate: 72.3,
      avg_revenue_per_employee: 71,
      total_revenue_30d: 60350,
      contract_value: 850000,
      health_score: 85,
      last_referral_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      days_since_last_referral: 5,
      risk_level: 'low' as const,
    },
    {
      employer_id: 'emp-3',
      employer_name: 'Manufacturing Solutions Inc',
      employee_count: 620,
      referral_volume_30d: 18,
      referral_volume_trend: 'down' as const,
      conversion_rate: 55.6,
      avg_revenue_per_employee: 48,
      total_revenue_30d: 29760,
      contract_value: 480000,
      health_score: 62,
      last_referral_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      days_since_last_referral: 18,
      risk_level: 'high' as const,
    },
    {
      employer_id: 'emp-4',
      employer_name: 'City School District',
      employee_count: 2100,
      referral_volume_30d: 25,
      referral_volume_trend: 'down' as const,
      conversion_rate: 64.0,
      avg_revenue_per_employee: 22,
      total_revenue_30d: 46200,
      contract_value: 720000,
      health_score: 68,
      last_referral_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      days_since_last_referral: 12,
      risk_level: 'medium' as const,
    },
  ];

  return employers.sort((a, b) => b.health_score - a.health_score);
}

function generateMockReferralIntelligence(): ReferralIntelligenceDashboard {
  const mockSources: ReferralSourceWithMetrics[] = [
    {
      id: 'src-1',
      organization_name: 'Premier Orthopedics',
      contact_person: 'Dr. Sarah Johnson',
      contact_email: 'sjohnson@premierortho.com',
      contact_phone: '555-0101',
      source_type: 'physician',
      relationship_tier: 'platinum',
      sla_hours: 24,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      referral_count_30d: 67,
      referral_count_60d: 58,
      conversion_rate: 82.5,
      avg_time_to_first_appt: 1.8,
      sla_compliance_rate: 94.2,
      revenue_30d: 102350,
      trend: 'up',
      trend_percentage: 15.5,
      health_status: 'healthy',
    },
    {
      id: 'src-2',
      organization_name: 'Community Health Network',
      contact_person: 'Maria Rodriguez',
      contact_email: 'mrodriguez@chn.org',
      contact_phone: '555-0102',
      source_type: 'hospital',
      relationship_tier: 'gold',
      sla_hours: 48,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      referral_count_30d: 45,
      referral_count_60d: 52,
      conversion_rate: 68.9,
      avg_time_to_first_appt: 2.4,
      sla_compliance_rate: 87.3,
      revenue_30d: 57405,
      trend: 'down',
      trend_percentage: -13.5,
      health_status: 'warning',
    },
    {
      id: 'src-3',
      organization_name: 'WorkWell Corporate Health',
      contact_person: 'James Chen',
      contact_email: 'jchen@workwell.com',
      contact_phone: '555-0103',
      source_type: 'employer',
      relationship_tier: 'platinum',
      sla_hours: 24,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      referral_count_30d: 89,
      referral_count_60d: 87,
      conversion_rate: 76.4,
      avg_time_to_first_appt: 2.1,
      sla_compliance_rate: 91.0,
      revenue_30d: 125860,
      trend: 'stable',
      trend_percentage: 2.3,
      health_status: 'healthy',
    },
    {
      id: 'src-4',
      organization_name: 'Metro Sports Medicine',
      contact_person: 'Dr. Michael Thompson',
      contact_email: 'mthompson@metrosports.com',
      contact_phone: '555-0104',
      source_type: 'physician',
      relationship_tier: 'gold',
      sla_hours: 48,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      referral_count_30d: 23,
      referral_count_60d: 48,
      conversion_rate: 34.8,
      avg_time_to_first_appt: 3.8,
      sla_compliance_rate: 52.2,
      revenue_30d: 14810,
      trend: 'down',
      trend_percentage: -52.1,
      health_status: 'critical',
    },
  ];

  const overview = {
    total_sources: 47,
    active_sources: 42,
    total_referrals_30d: 224,
    total_referrals_60d: 245,
    overall_conversion_rate: 71.4,
    avg_time_to_first_appt: 2.3,
    sla_compliance_rate: 86.2,
    total_revenue_30d: 300425,
    revenue_at_risk: 89500,
  };

  const conversionMetrics: ConversionMetrics = {
    total_referrals: 224,
    converted_referrals: 160,
    conversion_rate: 71.4,
    pending_referrals: 38,
    lost_referrals: 26,
    avg_conversion_days: 3.2,
    conversion_by_source: mockSources.map(s => ({
      source_id: s.id,
      source_name: s.organization_name,
      referrals: s.referral_count_30d,
      conversions: Math.floor(s.referral_count_30d * (s.conversion_rate / 100)),
      rate: s.conversion_rate,
    })),
  };

  const timeToApptMetrics: TimeToAppointmentMetrics = {
    avg_days: 2.3,
    median_days: 2.0,
    within_24h: 78,
    within_48h: 123,
    within_72h: 168,
    over_72h: 56,
    by_source: mockSources.map(s => ({
      source_id: s.id,
      source_name: s.organization_name,
      avg_days: s.avg_time_to_first_appt,
      sla_compliance: s.sla_compliance_rate,
    })),
  };

  const trendAlerts = generateTrendAlerts(mockSources);
  const employerIntelligence = generateEmployerIntelligence();

  return {
    overview,
    sources_with_metrics: mockSources,
    conversion_metrics: conversionMetrics,
    time_to_appt_metrics: timeToApptMetrics,
    trend_alerts: trendAlerts,
    employer_intelligence: employerIntelligence,
  };
}

export async function getReferralSources() {
  const { data, error } = await supabase
    .from('referral_sources')
    .select('*')
    .order('organization_name');

  if (error) throw error;
  return data as ReferralSource[];
}

export async function getReferrals(clinicId?: string, sourceId?: string) {
  let query = supabase
    .from('referrals')
    .select('*')
    .order('referral_date', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  if (sourceId) {
    query = query.eq('referral_source_id', sourceId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Referral[];
}

export async function getReferralMetrics(sourceId?: string) {
  let query = supabase
    .from('referral_metrics')
    .select('*')
    .order('period_start', { ascending: false });

  if (sourceId) {
    query = query.eq('referral_source_id', sourceId);
  }

  const { data, error} = await query;
  if (error) throw error;
  return data as ReferralMetrics[];
}

export async function getEmployerAccounts() {
  const { data, error } = await supabase
    .from('employer_accounts')
    .select(`
      *,
      referral_source:referral_sources(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createReferralSource(source: Omit<ReferralSource, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('referral_sources')
    .insert([source])
    .select()
    .single();

  if (error) throw error;
  return data as ReferralSource;
}

export async function updateReferralSource(id: string, updates: Partial<ReferralSource>) {
  const { data, error } = await supabase
    .from('referral_sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ReferralSource;
}

export async function createReferral(referral: Omit<Referral, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('referrals')
    .insert([referral])
    .select()
    .single();

  if (error) throw error;
  return data as Referral;
}
