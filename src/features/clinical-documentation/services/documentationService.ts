import { supabase } from '../../../lib/supabase';
import type { IDocumentationService } from './types';
import type {
  PaginatedResult,
  PaginationParams,
  Case,
  Encounter,
  EncounterWithRelations,
  Consent,
  DocumentationRisk,
  PreVisitBrief,
  DocumentationComplianceMetrics,
  PatientDocumentationSummaryDTO,
  DocumentationSummary,
  NoteDraft,
} from '../types';

function paginate(pagination?: PaginationParams) {
  const limit = pagination?.limit ?? 20;
  const page = pagination?.page ?? 1;
  const offset = (page - 1) * limit;
  return { limit, page, offset };
}

export const documentationService: IDocumentationService = {
  async getPatientDocumentationSummary(patientId: string): Promise<PatientDocumentationSummaryDTO> {
    const [draftsRes, signedRes, consentsRes, encountersRes, requestsRes] = await Promise.all([
      supabase.from('documentation_note_drafts').select('*').eq('patient_id', patientId).order('updated_at', { ascending: false }).limit(5),
      supabase.from('documentation_signed_notes').select('*').eq('patient_id', patientId).order('signed_at', { ascending: false }).limit(5),
      supabase.from('documentation_consents').select('*').eq('patient_id', patientId).eq('status', 'granted').order('granted_at', { ascending: false }),
      supabase.from('documentation_encounters').select('*', { count: 'exact' }).eq('patient_id', patientId).order('created_at', { ascending: false }).limit(10),
      supabase.from('documentation_record_requests').select('*').eq('patient_id', patientId).in('status', ['received', 'reviewing']),
    ]);

    const draftNotes = (draftsRes.data || []) as NoteDraft[];
    const signedNotes = (signedRes.data || []) as unknown as NoteDraft[];
    const activeConsents = (consentsRes.data || []) as Consent[];
    const recentEncounters = (encountersRes.data || []) as Encounter[];
    const pendingRequests = (requestsRes.data || []) as PatientDocumentationSummaryDTO['pending_requests'];

    const summary: DocumentationSummary = {
      patient_id: patientId,
      active_cases: 0,
      active_consents: activeConsents,
      recent_encounters: recentEncounters,
      draft_notes: draftNotes,
      signed_notes: signedNotes,
      pending_requests: pendingRequests.length,
      pending_addenda: 0,
      risk_flag_count: 0,
      last_signed_note_date: signedNotes[0]?.updated_at ?? null,
    };

    return {
      patient_id: patientId,
      summary,
      recent_notes: draftNotes,
      upcoming_encounters: recentEncounters,
      active_consents: activeConsents,
      pending_requests: pendingRequests,
    };
  },

  async getPatientCases(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<Case>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from('documentation_cases').select('*', { count: 'exact' })
      .eq('patient_id', patientId).order('opened_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`getPatientCases failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as Case[], total, page, limit, has_more: offset + limit < total };
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

  async createCase(patientId: string, clinicId: string, organizationId: string, partial: Partial<Case>): Promise<Case> {
    const { data, error } = await supabase.from('documentation_cases').insert({
      patient_id: patientId, clinic_id: clinicId, organization_id: organizationId, case_status: 'active',
      payer_type: partial.payer_type ?? null, payer_name: partial.payer_name ?? null,
      referral_source: partial.referral_source ?? null, tags: partial.tags ?? [],
    }).select().single();
    if (error) throw new Error(`createCase failed: ${error.message}`);
    return data as Case;
  },

  async getEncountersForPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<Encounter>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from('documentation_encounters').select('*', { count: 'exact' })
      .eq('patient_id', patientId).order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`getEncountersForPatient failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as Encounter[], total, page, limit, has_more: offset + limit < total };
  },

  async getEncounterWithRelations(encounterId: string): Promise<EncounterWithRelations> {
    const { data, error } = await supabase
      .from('documentation_encounters').select('*').eq('id', encounterId).single();
    if (error) throw new Error(`getEncounterWithRelations failed: ${error.message}`);
    const encounter = data as Encounter;
    const [transcriptRes, draftsRes, signedRes, commsRes] = await Promise.all([
      supabase.from('documentation_transcripts').select('*').eq('encounter_id', encounterId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('documentation_note_drafts').select('*').eq('encounter_id', encounterId),
      supabase.from('documentation_signed_notes').select('*').eq('encounter_id', encounterId),
      supabase.from('documentation_communications').select('*').eq('encounter_id', encounterId),
    ]);
    return {
      ...encounter,
      transcript: transcriptRes.data ?? null,
      draft_notes: (draftsRes.data || []) as EncounterWithRelations['draft_notes'],
      signed_notes: (signedRes.data || []) as EncounterWithRelations['signed_notes'],
      communications: (commsRes.data || []) as EncounterWithRelations['communications'],
    };
  },

  async getPreVisitBrief(_patientId: string, encounterId: string): Promise<PreVisitBrief | null> {
    const { data, error } = await supabase
      .from('documentation_pre_visit_briefs').select('*').eq('encounter_id', encounterId).maybeSingle();
    if (error && error.code !== 'PGRST116') throw new Error(`getPreVisitBrief failed: ${error.message}`);
    return (data as PreVisitBrief) ?? null;
  },

  async generatePreVisitBrief(patientId: string, caseId: string, clinicId: string, encounterId?: string): Promise<PreVisitBrief> {
    const { data, error } = await supabase.from('documentation_pre_visit_briefs').insert({
      patient_id: patientId,
      case_id: caseId,
      clinic_id: clinicId,
      encounter_id: encounterId ?? null,
      visit_date: new Date().toISOString(),
      brief_data: {},
    }).select().single();
    if (error) throw new Error(`generatePreVisitBrief failed: ${error.message}`);
    return data as PreVisitBrief;
  },

  async getDocumentationRisks(patientId: string, clinicId: string, unresolvedOnly?: boolean): Promise<DocumentationRisk[]> {
    let query = supabase.from('documentation_risks').select('*').eq('patient_id', patientId).eq('clinic_id', clinicId);
    if (unresolvedOnly) query = query.is('resolved_at', null);
    const { data, error } = await query.order('flagged_at', { ascending: false });
    if (error) throw new Error(`getDocumentationRisks failed: ${error.message}`);
    return data as DocumentationRisk[];
  },

  async resolveDocumentationRisk(riskId: string, resolvedByUserId: string): Promise<DocumentationRisk> {
    const { data, error } = await supabase.from('documentation_risks').update({
      resolved_at: new Date().toISOString(),
      resolved_by_user_id: resolvedByUserId,
    }).eq('id', riskId).select().single();
    if (error) throw new Error(`resolveDocumentationRisk failed: ${error.message}`);
    return data as DocumentationRisk;
  },

  async getComplianceMetrics(clinicId: string, period: string): Promise<DocumentationComplianceMetrics> {
    const [encountersRes, draftsRes, signedRes, addendaRes, correctionsRes, risksRes] = await Promise.all([
      supabase.from('documentation_encounters').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('documentation_note_drafts').select('status', { count: 'exact' }).eq('clinic_id', clinicId),
      supabase.from('documentation_signed_notes').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('documentation_note_addenda').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('documentation_correction_requests').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
      supabase.from('documentation_risks').select('resolved_at').eq('clinic_id', clinicId),
    ]);

    const totalEncounters = encountersRes.count ?? 0;
    const notesCompleted = signedRes.count ?? 0;
    const drafts = (draftsRes.data || []) as { status: string }[];
    const notesPending = drafts.filter((d) => d.status === 'draft' || d.status === 'in_review').length;
    const risks = (risksRes.data || []) as { resolved_at: string | null }[];
    const resolvedRisks = risks.filter((r) => r.resolved_at).length;

    return {
      clinic_id: clinicId,
      period,
      total_encounters: totalEncounters,
      notes_completed: notesCompleted,
      notes_pending: notesPending,
      notes_overdue: 0,
      signature_rate: totalEncounters > 0 ? Math.round((notesCompleted / totalEncounters) * 100) / 100 : 0,
      avg_completion_time_hours: null,
      addendum_count: addendaRes.count ?? 0,
      correction_request_count: correctionsRes.count ?? 0,
      risk_flag_resolution_rate: risks.length > 0 ? Math.round((resolvedRisks / risks.length) * 100) / 100 : 0,
    };
  },
};
