// ============================================================
// Practice Perfect identity-mapping service (app-side).
// Lets staff confirm/reject the link between PP provider/patient records and
// canonical AIM OS user_profiles / patients. Writes that mutate match state use
// the authenticated user's session (RLS-governed) — only fields under their
// clinic are visible.
// ============================================================
import { supabase } from '../../lib/supabase';

export interface UnmatchedProvider {
  id: string;
  clinic_id: string;
  canonical_name: string;
  match_status: string;
  match_confidence: number | null;
  user_profile_id: string | null;
}

export interface UnmatchedPatient {
  id: string;
  clinic_id: string;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  match_status: string;
  patient_id: string | null;
}

export const identityService = {
  async listUnmatchedProviders(clinicId: string): Promise<UnmatchedProvider[]> {
    const { data, error } = await supabase
      .from('pp_providers')
      .select('id, clinic_id, canonical_name, match_status, match_confidence, user_profile_id')
      .eq('clinic_id', clinicId)
      .neq('match_status', 'confirmed')
      .order('canonical_name', { ascending: true });
    if (error) throw new Error(`listUnmatchedProviders failed: ${error.message}`);
    return (data ?? []) as UnmatchedProvider[];
  },

  async confirmProvider(ppProviderId: string, userProfileId: string): Promise<void> {
    const { error } = await supabase
      .from('pp_providers')
      .update({ user_profile_id: userProfileId, match_status: 'confirmed' })
      .eq('id', ppProviderId);
    if (error) throw new Error(`confirmProvider failed: ${error.message}`);
  },

  async ignoreProvider(ppProviderId: string): Promise<void> {
    const { error } = await supabase
      .from('pp_providers').update({ match_status: 'ignored' }).eq('id', ppProviderId);
    if (error) throw new Error(`ignoreProvider failed: ${error.message}`);
  },

  async listUnmatchedPatients(clinicId: string, limit = 100): Promise<UnmatchedPatient[]> {
    const { data, error } = await supabase
      .from('pp_patients')
      .select('id, clinic_id, first_name, last_name, dob, match_status, patient_id')
      .eq('clinic_id', clinicId)
      .neq('match_status', 'confirmed')
      .order('last_name', { ascending: true })
      .limit(limit);
    if (error) throw new Error(`listUnmatchedPatients failed: ${error.message}`);
    return (data ?? []) as UnmatchedPatient[];
  },

  /** Confirm a PP patient links to a canonical AIM OS patient. PHI — high bar enforced by staff. */
  async confirmPatient(ppPatientId: string, patientId: string): Promise<void> {
    const { error } = await supabase
      .from('pp_patients')
      .update({ patient_id: patientId, match_status: 'confirmed' })
      .eq('id', ppPatientId);
    if (error) throw new Error(`confirmPatient failed: ${error.message}`);
  },

  async ignorePatient(ppPatientId: string): Promise<void> {
    const { error } = await supabase
      .from('pp_patients').update({ match_status: 'ignored' }).eq('id', ppPatientId);
    if (error) throw new Error(`ignorePatient failed: ${error.message}`);
  },
};
