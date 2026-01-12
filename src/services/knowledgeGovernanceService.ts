import { supabase } from '../lib/supabase';
import type { DocumentVersion, Attestation, DocumentAccessLog } from '../types/aim-os';

export async function getDocumentVersions(policyId: string) {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('policy_id', policyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DocumentVersion[];
}

export async function getAttestations(documentVersionId: string) {
  const { data, error } = await supabase
    .from('attestations')
    .select(`
      *,
      user:user_profiles(*)
    `)
    .eq('document_version_id', documentVersionId)
    .order('attested_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUserAttestations(userId: string) {
  const { data, error } = await supabase
    .from('attestations')
    .select(`
      *,
      document_version:document_versions(*)
    `)
    .eq('user_id', userId)
    .order('attested_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createDocumentVersion(version: Omit<DocumentVersion, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('document_versions')
    .insert([version])
    .select()
    .single();

  if (error) throw error;
  return data as DocumentVersion;
}

export async function createAttestation(attestation: Omit<Attestation, 'id' | 'attested_at'>) {
  const { data, error } = await supabase
    .from('attestations')
    .insert([attestation])
    .select()
    .single();

  if (error) throw error;
  return data as Attestation;
}

export async function logDocumentAccess(log: Omit<DocumentAccessLog, 'id' | 'accessed_at'>) {
  const { data, error } = await supabase
    .from('document_access_logs')
    .insert([log])
    .select()
    .single();

  if (error) throw error;
  return data as DocumentAccessLog;
}
