import { supabase } from '../lib/supabase';

export interface Vendor {
  id: string;
  vendor_name: string;
  vendor_type: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  website?: string;
  status: string;
  onboarding_date?: string;
  last_review_date?: string;
  next_review_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorContract {
  id: string;
  vendor_id: string;
  clinic_id?: string;
  contract_number?: string;
  contract_type?: string;
  start_date: string;
  end_date: string;
  auto_renewal: boolean;
  renewal_notice_days?: number;
  annual_cost: number;
  payment_frequency?: string;
  termination_notice_days?: number;
  contract_status?: string;
  key_terms?: string;
  sla_commitments?: any;
  document_url?: string;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface VendorCriticality {
  id: string;
  vendor_id: string;
  clinic_id?: string;
  criticality_level: string;
  business_impact_if_down?: string;
  affected_departments?: string[];
  affected_services?: string[];
  patient_impact?: string;
  revenue_impact_per_day: number;
  is_single_point_of_failure: boolean;
  backup_vendor_exists: boolean;
  backup_vendor_id?: string;
  failover_plan_exists: boolean;
  last_tested_date?: string;
  assessment_date: string;
  assessment_notes?: string;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
  backup_vendor?: Vendor;
}

export interface VendorRiskAssessment {
  id: string;
  vendor_id: string;
  assessment_date: string;
  assessed_by_user_id?: string;
  overall_risk_score: number;
  financial_stability_score: number;
  security_compliance_score: number;
  performance_reliability_score: number;
  support_responsiveness_score: number;
  data_privacy_compliance: boolean;
  hipaa_compliant: boolean;
  soc2_certified: boolean;
  insurance_verified: boolean;
  background_check_completed: boolean;
  key_risks_identified?: string[];
  mitigation_actions?: string[];
  next_assessment_due?: string;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface VendorIncident {
  id: string;
  vendor_id: string;
  clinic_id?: string;
  incident_date: string;
  incident_type: string;
  severity: string;
  description?: string;
  business_impact?: string;
  downtime_minutes: number;
  patients_affected: number;
  revenue_impact: number;
  resolution_date?: string;
  resolution_notes?: string;
  root_cause?: string;
  vendor_response_time_minutes?: number;
  preventive_actions?: string[];
  status: string;
  created_at: string;
  updated_at: string;
  vendor?: Vendor;
}

export interface VendorDependency {
  id: string;
  vendor_id: string;
  depends_on_vendor_id: string;
  dependency_type: string;
  is_critical_path: boolean;
  notes?: string;
  created_at: string;
  vendor?: Vendor;
  depends_on_vendor?: Vendor;
}

export async function getVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('vendor_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getActiveVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('status', 'active')
    .order('vendor_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getVendorContracts(): Promise<VendorContract[]> {
  const { data, error } = await supabase
    .from('vendor_contracts')
    .select(`
      *,
      vendor:vendors(*)
    `)
    .order('end_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getExpiringContracts(daysAhead: number = 90): Promise<VendorContract[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('vendor_contracts')
    .select(`
      *,
      vendor:vendors(*)
    `)
    .gte('end_date', today.toISOString().split('T')[0])
    .lte('end_date', futureDate.toISOString().split('T')[0])
    .order('end_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getVendorCriticality(): Promise<VendorCriticality[]> {
  const { data, error } = await supabase
    .from('vendor_criticality')
    .select(`
      *,
      vendor:vendors!vendor_criticality_vendor_id_fkey(*),
      backup_vendor:vendors!vendor_criticality_backup_vendor_id_fkey(*)
    `)
    .order('criticality_level', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getSinglePointsOfFailure(): Promise<VendorCriticality[]> {
  const { data, error } = await supabase
    .from('vendor_criticality')
    .select(`
      *,
      vendor:vendors!vendor_criticality_vendor_id_fkey(*),
      backup_vendor:vendors!vendor_criticality_backup_vendor_id_fkey(*)
    `)
    .eq('is_single_point_of_failure', true)
    .order('criticality_level', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getVendorRiskAssessments(): Promise<VendorRiskAssessment[]> {
  const { data, error } = await supabase
    .from('vendor_risk_assessments')
    .select(`
      *,
      vendor:vendors(*)
    `)
    .order('assessment_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getHighRiskVendors(): Promise<VendorRiskAssessment[]> {
  const { data, error } = await supabase
    .from('vendor_risk_assessments')
    .select(`
      *,
      vendor:vendors(*)
    `)
    .lte('overall_risk_score', 60)
    .order('overall_risk_score', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getVendorIncidents(): Promise<VendorIncident[]> {
  const { data, error } = await supabase
    .from('vendor_incidents')
    .select(`
      *,
      vendor:vendors(*)
    `)
    .order('incident_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getOpenVendorIncidents(): Promise<VendorIncident[]> {
  const { data, error } = await supabase
    .from('vendor_incidents')
    .select(`
      *,
      vendor:vendors(*)
    `)
    .in('status', ['open', 'investigating'])
    .order('incident_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getVendorDependencies(): Promise<VendorDependency[]> {
  const { data, error } = await supabase
    .from('vendor_dependencies')
    .select(`
      *,
      vendor:vendors!vendor_dependencies_vendor_id_fkey(*),
      depends_on_vendor:vendors!vendor_dependencies_depends_on_vendor_id_fkey(*)
    `)
    .order('is_critical_path', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCriticalVendorDependencies(): Promise<VendorDependency[]> {
  const { data, error } = await supabase
    .from('vendor_dependencies')
    .select(`
      *,
      vendor:vendors!vendor_dependencies_vendor_id_fkey(*),
      depends_on_vendor:vendors!vendor_dependencies_depends_on_vendor_id_fkey(*)
    `)
    .eq('is_critical_path', true)
    .order('vendor_id', { ascending: true });

  if (error) throw error;
  return data || [];
}
