import { supabase } from '../lib/supabase';
import type { DataClassificationEntry, ConsentScope, AIGovernanceLog } from '../types/aim-os';

export async function getDataClassifications() {
  const { data, error } = await supabase
    .from('data_classifications')
    .select('*')
    .order('table_name')
    .order('column_name');

  if (error) throw error;
  return data as DataClassificationEntry[];
}

export async function getConsentScopes(patientReference?: string) {
  let query = supabase
    .from('consent_scopes')
    .select('*')
    .order('created_at', { ascending: false });

  if (patientReference) {
    query = query.eq('patient_reference', patientReference);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ConsentScope[];
}

export async function getAIGovernanceLogs() {
  const { data, error } = await supabase
    .from('ai_governance_logs')
    .select('*')
    .order('performed_at', { ascending: false });

  if (error) throw error;
  return data as AIGovernanceLog[];
}

export async function createDataClassification(classification: Omit<DataClassificationEntry, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('data_classifications')
    .insert([classification])
    .select()
    .single();

  if (error) throw error;
  return data as DataClassificationEntry;
}

export async function createConsentScope(consent: Omit<ConsentScope, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('consent_scopes')
    .insert([consent])
    .select()
    .single();

  if (error) throw error;
  return data as ConsentScope;
}

export async function logAIGovernanceAction(log: Omit<AIGovernanceLog, 'id' | 'performed_at'>) {
  const { data, error } = await supabase
    .from('ai_governance_logs')
    .insert([log])
    .select()
    .single();

  if (error) throw error;
  return data as AIGovernanceLog;
}
