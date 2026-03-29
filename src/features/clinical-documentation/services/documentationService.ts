import { supabase } from '@/auth';
import type {
  PatientDocumentationSummaryDTO,
} from '../types/dto';
import type {
  NoteDraft,
  NoteAddendum,
  SignedNote,
  PreVisitBrief,
} from '../types/entities';

export interface DocumentationService {
  getPatientDocumentationSummary(patientId: string): Promise<PatientDocumentationSummaryDTO>;
  getDocumentationTimeline(patientId: string): Promise<{
    drafts: NoteDraft[];
    signedNotes: SignedNote[];
    addenda: NoteAddendum[];
  }>;
  getDocumentationDashboardMetrics(clinicId: string, roleView: string): Promise<Record<string, unknown>>;
  getPreVisitBrief(encounterId: string): Promise<PreVisitBrief>;
  getDocumentationAuditSnapshot(patientId: string): Promise<Record<string, unknown>[]>;
}

function requireData<T>(data: T | null, errorMessage: string): T {
  if (!data) throw new Error(errorMessage);
  return data;
}

function mapSignedNote(row: any): SignedNote {
  return {
    id: row.id,
    noteDraftId: row.note_draft_id,
    encounterId: row.encounter_id,
    patientId: row.patient_id,
    caseId: row.case_id,
    clinicId: row.clinic_id,
    noteType: row.note_type,
    signedPayload: row.signed_payload ?? {},
    signedText: row.signed_text,
    versionNumber: row.version_number,
    signedByUserId: row.signed_by_user_id,
    signedAt: row.signed_at,
    versionHash: row.version_hash,
    status: 'signed',
  };
}

function mapNoteAddendum(row: any): NoteAddendum {
  return {
    id: row.id,
    signedNoteId: row.signed_note_id,
    clinicId: row.clinic_id,
    addendumType: row.addendum_type,
    reason: row.reason,
    addendumText: row.addendum_text,
    createdByUserId: row.created_by_user_id,
    approvedByUserId: row.approved_by_user_id,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  };
}

export const documentationService: DocumentationService = {
  async getPatientDocumentationSummary(patientId) {
    const [draftsRes, signedRes, addendaRes, encountersRes] = await Promise.all([
      supabase
        .from('note_drafts')
        .select('id, status, completeness_score, risk_score, updated_at, encounter_id', { count: 'exact', head: true })
        .eq('patient_id', patientId)
        .neq('status', 'signed'),
      supabase
        .from('signed_notes')
        .select('id, signed_at', { count: 'exact', head: true })
        .eq('patient_id', patientId),
      supabase
        .from('note_addenda')
        .select('id', { count: 'exact', head: true })
        .eq('signed_note_id', requireData(
          (await supabase.from('signed_notes').select('id').eq('patient_id', patientId)).data,
          'no signed notes'
        )?.map((s: any) => s.id)),
      supabase
        .from('encounters')
        .select('id, status, scheduled_start, actual_start')
        .eq('patient_id', patientId)
        .order('scheduled_start', { ascending: false })
        .limit(1),
    ]);

    const openDraftCount = draftsRes.count ?? 0;
    const signedNoteCount = signedRes.count ?? 0;
    const addendumCount = addendaRes.count ?? 0;
    const latestSignedAt = signedRes.data?.[0]?.signed_at ?? null;

    const nextEncounter = encountersRes.data?.[0];
    const preVisitBriefReady = nextEncounter
      ? nextEncounter.status === 'scheduled' && !!nextEncounter.scheduled_start
      : false;

    // Risk level from drafts
    const draftRisks = (draftsRes.data ?? []).map((d: any) => d.risk_score ?? 0);
    const avgRisk = draftRisks.length > 0
      ? draftRisks.reduce((a: number, b: number) => a + b, 0) / draftRisks.length
      : 0;
    const chartRiskLevel: 'low' | 'medium' | 'high' =
      avgRisk >= 60 ? 'high' : avgRisk >= 30 ? 'medium' : 'low';

    // Documentation gaps
    const gaps: string[] = [];
    if (openDraftCount > 3) gaps.push(`${openDraftCount} unsigned drafts outstanding`);
    if (signedNoteCount === 0) gaps.push('No signed notes on record');

    return {
      patientId,
      openDraftCount,
      signedNoteCount,
      addendumCount,
      latestSignedAt,
      preVisitBriefReady,
      chartRiskLevel,
      missingDocumentationFlags: gaps,
    };
  },

  async getDocumentationTimeline(patientId) {
    const [draftsRes, signedRes] = await Promise.all([
      supabase
        .from('note_drafts')
        .select('*')
        .eq('patient_id', patientId)
        .order('updated_at', { ascending: false }),
      supabase
        .from('signed_notes')
        .select('id')
        .eq('patient_id', patientId)
        .order('signed_at', { ascending: false }),
    ]);

    const signedNoteIds = (signedRes.data ?? []).map((s: any) => s.id);

    let addenda: NoteAddendum[] = [];
    if (signedNoteIds.length > 0) {
      const addendaRes = await supabase
        .from('note_addenda')
        .select('*')
        .in('signed_note_id', signedNoteIds)
        .order('created_at', { ascending: false });
      addenda = (addendaRes.data ?? []).map(mapNoteAddendum);
    }

    return {
      drafts: (draftsRes.data ?? []).map((d: any) => ({
        id: d.id,
        encounterId: d.encounter_id,
        patientId: d.patient_id,
        caseId: d.case_id,
        clinicId: d.clinic_id,
        authorUserId: d.author_user_id,
        noteType: d.note_type,
        status: d.status,
        sourceMode: d.source_mode,
        structuredPayload: d.structured_payload ?? {},
        plainText: d.plain_text,
        completenessScore: d.completeness_score,
        riskScore: d.risk_score,
        payerReadinessScore: d.payer_readiness_score,
        currentVersion: d.current_version,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })),
      signedNotes: (signedRes.data ?? []).map((s: any) => ({
        id: s.id,
        noteDraftId: s.note_draft_id,
        encounterId: s.encounter_id,
        patientId: s.patient_id,
        caseId: s.case_id,
        clinicId: s.clinic_id,
        noteType: s.note_type,
        signedPayload: s.signed_payload ?? {},
        signedText: s.signed_text,
        versionNumber: s.version_number,
        signedByUserId: s.signed_by_user_id,
        signedAt: s.signed_at,
        versionHash: s.version_hash,
        status: 'signed' as const,
      })),
      addenda,
    };
  },

  async getDocumentationDashboardMetrics(clinicId, roleView) {
    const [draftsRes, signedRes, requestsRes] = await Promise.all([
      supabase
        .from('note_drafts')
        .select('status, completeness_score, risk_score, author_user_id, updated_at', { count: 'exact' })
        .eq('clinic_id', clinicId),
      supabase
        .from('signed_notes')
        .select('id, signed_at', { count: 'exact' })
        .eq('clinic_id', clinicId)
        .gte('signed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('record_requests')
        .select('status', { count: 'exact' })
        .eq('clinic_id', clinicId)
        .neq('status', 'completed'),
    ]);

    const unsigned = (draftsRes.data ?? []).filter((d: any) => d.status !== 'signed').length;
    const totalDrafts = draftsRes.count ?? 0;
    const closureRate = totalDrafts > 0
      ? Math.round(((totalDrafts - unsigned) / totalDrafts) * 100)
      : 100;
    const avgRisk = (draftsRes.data ?? [])
      .map((d: any) => d.risk_score ?? 0)
      .reduce((a: number, b: number) => a + b, 0) / Math.max(1, (draftsRes.data ?? []).length);

    return {
      clinicId,
      roleView,
      totalDrafts,
      unsignedNotes: unsigned,
      sameDayClosureRate: closureRate,
      avgRiskScore: Math.round(avgRisk),
      signedThisWeek: signedRes.count ?? 0,
      openRequests: requestsRes.count ?? 0,
      generatedAt: new Date().toISOString(),
    };
  },

  async getPreVisitBrief(encounterId) {
    const [encounterRes, priorGoalsRes, openDraftsRes] = await Promise.all([
      supabase.from('encounters').select('id, patient_id, scheduled_start').eq('id', encounterId).single(),
      supabase
        .from('signed_notes')
        .select('signed_payload')
        .eq('patient_id', encounterRes.data?.patient_id ?? '')
        .order('signed_at', { ascending: false })
        .limit(10),
      supabase
        .from('note_drafts')
        .select('id, note_type, status, completeness_score, risk_score')
        .eq('encounter_id', encounterId)
        .neq('status', 'signed'),
    ]);

    const encounter = encounterRes.data;
    if (!encounter) throw new Error('Encounter not found');

    // Extract plan text from prior notes as goals
    const priorGoals: string[] = [];
    const unresolvedIssues: string[] = [];
    for (const note of (priorGoalsRes.data ?? [])) {
      const plan = (note.signed_payload as any)?.plan;
      if (plan && typeof plan === 'string') {
        priorGoals.push(plan.substring(0, 200));
      }
    }

    // Documentation gaps from open drafts
    const documentationGaps: string[] = [];
    for (const draft of (openDraftsRes.data ?? [])) {
      if (draft.completeness_score !== null && draft.completeness_score < 70) {
        documentationGaps.push(`${draft.note_type ?? 'Draft'} is incomplete (${draft.completeness_score}%)`);
      }
    }

    return {
      encounterId,
      patientId: encounter.patient_id,
      summary: priorGoals.length > 0
        ? `Prior treatment plan documented. ${priorGoals.length} goal(s) on record.`
        : 'No prior treatment plan found for this patient.',
      priorGoals: priorGoals.slice(0, 5),
      unresolvedIssues,
      documentationGaps,
      payerDeadlines: [],
      recentCommunications: [],
    };
  },

  async getDocumentationAuditSnapshot(patientId) {
    // Return last 30 days of documentation-related audit events
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [draftEvents, noteEvents, docEvents] = await Promise.all([
      supabase
        .from('audit_events')
        .select('*')
        .eq('patient_id', patientId)
        .gte('created_at', cutoff)
        .ilike('event_type', '%documentation%'),
      supabase
        .from('audit_events')
        .select('*')
        .eq('patient_id', patientId)
        .gte('created_at', cutoff)
        .ilike('event_type', '%note%'),
      supabase
        .from('audit_events')
        .select('*')
        .eq('patient_id', patientId)
        .gte('created_at', cutoff)
        .ilike('event_type', '%document%'),
    ]);

    return [
      ...(draftEvents.data ?? []),
      ...(noteEvents.data ?? []),
      ...(docEvents.data ?? []),
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
};