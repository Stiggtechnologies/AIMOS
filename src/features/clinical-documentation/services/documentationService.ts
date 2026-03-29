import { supabase } from '@/lib/supabase';
import type { IDocumentationService } from './types';
import type { PaginatedResult, PaginationParams, Case, Encounter, Consent, DocumentationRisk, PreVisitBrief, DocumentationComplianceMetrics, PatientDocumentationSummaryDTO } from '../types';

export const documentationService: IDocumentationService = {
  async getPatientDocumentationSummary(patientId: string): Promise<PatientDocumentationSummaryDTO> {
    const [drafts, signed, consents, encountersResult] = await Promise.all([
      supabase.from('documentation_note_drafts').select('id, status, note_type, completeness_score, risk_score, updated_at').eq('patient_id', patientId).order('updated_at', { ascending: false }).limit(5),
      supabase.from('documentation_signed_notes').select('id, note_type, signed_at, version_number').eq('patient_id', patientId).order('signed_at', { ascending: false }).limit(5),
      supabase.from('documentation_consents').select('*').eq('patient_id', patientId).eq('status', 'granted').order('granted_at', { ascending: false }),
      supabase.from('documentation_encounters').select('id, encounter_type, status, created_at', { count: 'exact' }).eq('patient_id', patientId).order('created_at', { ascending: false }).limit(10),
    ]);

    return {
      patientId,
      draftNotes: (drafts.data || []) as unknown[],
      signedNotes: (signed.data || []) as unknown[],
      activeConsents: consents.data || [],
      recentEncounters: encountersResult.data || [],
      totalEncounters: encountersResult.count ?? 0,
    };
  },

  async getPatientCases(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<Case>> {
    const limit = pagination?.limit ?? 20;
    const offset = pagination?.offset ?? 0;
    const { data, error, count } = await supabase
      .from('documentation_cases').select('*', { count: 'exact' })
      .eq('patient_id', patientId).order('opened_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`getPatientCases failed: ${error.message}`);
    return { data: data as Case[], total: count ?? data.length, page: Math.floor(offset / limit) + 1, pageSize: limit };
  },

  async getPatientConsents(patientId: string, activeOnly?: boolean): Promise<Consent[]> {
    let query = supabase.from('documentation_consents').select('*').eq('patient_id', patientId);
    if (activeOnly) query = query.eq('status', 'granted');
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(`getPatientConsents failed: ${error.message}`);
    return data as Consent[];
  },

  async getActiveConsentsForEncounter(patientId: string, clinicId: string): Promise<Consent[]> {
    const { data, error } = await supabase
      .from('documentation_consents')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .eq('status', 'granted')
      .order('granted_at', { ascending: false });
    if (error) throw new Error(`getActiveConsentsForEncounter failed: ${error.message}`);
    return data as Consent[];
  },

  async createCase(patientId: string, clinicId: string, _organizationId: string, partial: Partial<Case>): Promise<Case> {
    const { data, error } = await supabase.from('documentation_cases').insert({
      patient_id: patientId, clinic_id: clinicId, case_status: 'active',
      payer_type: partial.payer_type ?? null, payer_name: partial.payer_name ?? null,
      referral_source: partial.referral_source ?? null, tags: partial.tags ?? [],
    }).select().single();
    if (error) throw new Error(`createCase failed: ${error.message}`);
    return data as Case;
  },

  async getEncountersForPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<Encounter>> {
    const limit = pagination?.limit ?? 20;
    const offset = pagination?.offset ?? 0;
    const { data, error, count } = await supabase
      .from('documentation_encounters').select('*', { count: 'exact' })
      .eq('patient_id', patientId).order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`getEncountersForPatient failed: ${error.message}`);
    return { data: data as Encounter[], total: count ?? data.length, page: Math.floor(offset / limit) + 1, pageSize: limit };
  },

  async getEncounterWithRelations(encounterId: string): Promise<Encounter & { patient?: Record<string,unknown>; case?: Record<string,unknown>; }> {
    const { data, error } = await supabase
      .from('documentation_encounters').select('*').eq('id', encounterId).single();
    if (error) throw new Error(`getEncounterWithRelations failed: ${error.message}`);
    // Fetch related patient
    const [patientResult] = await Promise.all([
      supabase.from('patients').select('id, first_name, last_name, date_of_birth, gender, medical_record_number, clinic_id').eq('id', (data as Encounter).patient_id).single(),
    ]);
    return { ...(data as Encounter), patient: patientResult.data || undefined };
  },

  async getPreVisitBrief(encounterId: string): Promise<PreVisitBrief | null> {
    // Pre-visit briefs stored as part of structured payload in a dedicated table
    const { data, error } = await supabase
      .from('documentation_pre_visit_briefs')?.select('*').eq('encounter_id', encounterId).single();
    if (error && error.code !== 'PGRST116') throw new Error(`getPreVisitBrief failed: ${error.message}`);
    return data as PreVisitBrief | null;
  },

  async getDocumentationComplianceMetrics(_clinicId?: string): Promise<DocumentationComplianceMetrics> {
    return {
      overallCompleteness: 0, signedNotesCount: 0, pendingDraftsCount: 0,
      avgSignTimeHours: 0, complianceRate: 0, riskDistribution: { low: 0, medium: 0, high: 0 },
    };
  },

  async getAuditSnapshot(patientId: string): Promise<Record<string, unknown>[]> {
    const [signed, addenda, disclosures, corrections] = await Promise.all([
      supabase.from('documentation_signed_notes').select('id, signed_at, note_type, signed_by_user_id').eq('patient_id', patientId).order('signed_at', { ascending: false }).limit(20),
      supabase.from('documentation_note_addenda').select('id, created_at, addendum_type, created_by_user_id, signed_note_id').eq('signed_note_id', `select(signed_note_id) from documentation_signed_notes where patient_id = '${patientId}'`).limit(20),
      supabase.from('documentation_disclosures').select('id, disclosed_at, disclosure_type, disclosed_to').eq('patient_id', patientId).order('disclosed_at', { ascending: false }).limit(20),
      supabase.from('documentation_correction_requests').select('id, created_at, status, request_reason').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(20),
    ]);
    return [...(signed.data || []), ...(addenda.data || []), ...(disclosures.data || []), ...(corrections.data || [])] as Record<string, unknown>[];
  },
};