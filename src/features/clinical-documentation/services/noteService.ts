import { supabase } from '../../../lib/supabase';
import type { INoteService } from './types';
import type { CreateDraftNoteInput, SaveDraftNoteVersionInput, CreateAddendumInput, NoteDraft, NoteDraftVersion, SignedNote, NoteAddendum, PaginatedResult, PaginationParams, NoteDraftWithVersions, SignedNoteWithAddenda } from '../types';

// Completeness score: 0-1 range (numeric(5,4) in DB)
function computeCompleteness(sp: Record<string, unknown>): number {
  const sections = ['subjective_section', 'objective_section', 'assessment_section', 'treatment_section', 'response_section', 'plan_section', 'follow_up_section'];
  const filled = sections.filter(s => sp[s] && String(sp[s]).trim().length > 20).length;
  return Math.round((filled / sections.length) * 100) / 100; // 0.0 to 1.0
}

// Risk score: 0-1 range (numeric(5,4) in DB)
function computeRisk(sp: Record<string, unknown>): number {
  const completeness = computeCompleteness(sp);
  const hasAssessment = sp.assessment_section && String(sp.assessment_section).trim().length > 10;
  const hasPlan = sp.plan_section && String(sp.plan_section).trim().length > 10;
  if (completeness >= 0.8 && hasAssessment && hasPlan) return 0.2;
  if (completeness >= 0.6) return 0.5;
  return 0.8;
}

// Map UI note types to DB values
const NOTE_TYPE_MAP: Record<string, string> = {
  initial: 'initial',
  initial_assessment: 'initial',
  followup: 'progress',
  follow_up: 'progress',
  progress: 'progress',
  soap: 'soap',
  discharge: 'discharge',
  assessment: 'assessment',
  referral: 'referral',
  letter: 'letter',
  wcb_report: 'assessment',
  insurer_update: 'assessment',
  custom: 'custom',
};

export const noteService: INoteService = {
  async createDraftNote(input: CreateDraftNoteInput): Promise<NoteDraft> {
    const structured_payload = {
      subjective_section: input.sections?.subjective ?? null,
      objective_section: input.sections?.objective ?? null,
      assessment_section: input.sections?.assessment ?? null,
      treatment_section: input.sections?.treatment ?? null,
      response_section: input.sections?.response ?? null,
      plan_section: input.sections?.plan ?? null,
      follow_up_section: input.sections?.followUp ?? null,
      additional_sections: input.sections?.additional ?? null,
    };

    const { data, error } = await supabase
      .from('documentation_note_drafts')
      .insert({
        encounter_id: input.encounter_id ?? null,
        patient_id: input.patient_id,
        case_id: input.case_id ?? null,
        clinic_id: input.clinic_id,
        author_user_id: input.author_user_id,
        note_type: NOTE_TYPE_MAP[input.note_type] || input.note_type,
        status: 'draft',
        source_mode: input.source_mode ?? 'manual',
        structured_payload,
        plain_text: input.plain_text ?? null,
        completeness_score: computeCompleteness(structured_payload),
        risk_score: computeRisk(structured_payload),
        current_version: 1,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create draft: ${error.message}`);
    return data as NoteDraft;
  },

  async getDraftNote(noteDraftId: string): Promise<NoteDraft> {
    const { data, error } = await supabase
      .from('documentation_note_drafts')
      .select('*')
      .eq('id', noteDraftId)
      .single();

    if (error) throw new Error(`Failed to fetch draft: ${error.message}`);
    return data as NoteDraft;
  },

  async updateDraftNote(noteDraftId: string, updates: Partial<NoteDraft>): Promise<NoteDraft> {
    const updatePayload: Record<string, unknown> = {};
    if (updates.status) updatePayload.status = updates.status;
    if (updates.plain_text !== undefined) updatePayload.plain_text = updates.plain_text;
    if (updates.structured_payload) {
      const { data: current } = await supabase
        .from('documentation_note_drafts')
        .select('structured_payload')
        .eq('id', noteDraftId)
        .single();
      const merged = { ...(current?.structured_payload || {}), ...updates.structured_payload };
      updatePayload.structured_payload = merged;
      updatePayload.completeness_score = computeCompleteness(merged as Record<string, unknown>);
      updatePayload.risk_score = computeRisk(merged as Record<string, unknown>);
    }

    const { data, error } = await supabase
      .from('documentation_note_drafts')
      .update(updatePayload)
      .eq('id', noteDraftId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update draft: ${error.message}`);
    return data as NoteDraft;
  },

  async saveDraftVersion(input: SaveDraftNoteVersionInput): Promise<NoteDraftVersion> {
    const { data: draft, error: draftError } = await supabase
      .from('documentation_note_drafts')
      .select('*')
      .eq('id', input.note_draft_id)
      .single();

    if (draftError) throw new Error(`Failed to fetch draft for versioning: ${draftError.message}`);

    const sp = (draft.structured_payload as Record<string, unknown>) || {};
    const newVersion = (draft.current_version || 1) + 1;

    // Update the draft with new structured payload + bump version
    const updatedPayload = (input as { structured_payload?: Record<string, unknown> }).structured_payload || sp;
    const { error: updateError } = await supabase
      .from('documentation_note_drafts')
      .update({
        current_version: newVersion,
        structured_payload: updatedPayload,
        completeness_score: computeCompleteness(updatedPayload as Record<string, unknown>),
        risk_score: computeRisk(updatedPayload as Record<string, unknown>),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.note_draft_id);

    if (updateError) throw new Error(`Failed to update draft: ${updateError.message}`);

    // Insert version snapshot
    const { data: version, error: versionError } = await supabase
      .from('documentation_note_draft_versions')
      .insert({
        note_draft_id: input.note_draft_id,
        version_number: newVersion,
        subjective_section: sp.subjective_section as string ?? null,
        objective_section: sp.objective_section as string ?? null,
        assessment_section: sp.assessment_section as string ?? null,
        treatment_section: sp.treatment_section as string ?? null,
        response_section: sp.response_section as string ?? null,
        plan_section: sp.plan_section as string ?? null,
        follow_up_section: sp.follow_up_section as string ?? null,
        additional_sections: sp.additional_sections ?? null,
        change_summary: (input as { provenance_payload?: unknown }).provenance_payload ? 'AI-assisted save' : 'Manual save',
        word_count: (sp._wordCount as number) ?? null,
        created_by_user_id: input.created_by_user_id,
      })
      .select()
      .single();

    if (versionError) throw new Error(`Failed to save version: ${versionError.message}`);

    return version as NoteDraftVersion;
  },

  async getDraftVersions(noteDraftId: string): Promise<NoteDraftVersion[]> {
    const { data, error } = await supabase
      .from('documentation_note_draft_versions')
      .select('*')
      .eq('note_draft_id', noteDraftId)
      .order('version_number', { ascending: false });

    if (error) throw new Error(`Failed to fetch versions: ${error.message}`);
    return data as NoteDraftVersion[];
  },

  async getDraftNoteWithVersions(noteDraftId: string): Promise<NoteDraftWithVersions> {
    const [draft, versions] = await Promise.all([
      noteService.getDraftNote(noteDraftId),
      noteService.getDraftVersions(noteDraftId),
    ]);
    return { ...draft, versions };
  },

  async validateDraftNote(noteDraftId: string, _expectedSignature?: string): Promise<{ valid: boolean; errors: string[] }> {
    const draft = await noteService.getDraftNote(noteDraftId);
    const sp = (draft.structured_payload as Record<string, unknown>) || {};
    const errors: string[] = [];

    if (!sp.assessment_section || String(sp.assessment_section).trim().length < 10)
      errors.push('Assessment section is required and must be at least 10 characters.');
    if (!sp.plan_section || String(sp.plan_section).trim().length < 10)
      errors.push('Plan section is required and must be at least 10 characters.');
    if (!sp.subjective_section || String(sp.subjective_section).trim().length < 10)
      errors.push('Subjective section is required and must be at least 10 characters.');
    if (!sp.objective_section || String(sp.objective_section).trim().length < 10)
      errors.push('Objective section is required and must be at least 10 characters.');
    // completeness_score is 0-1, so 0.6 = 60%
    if ((draft.completeness_score ?? 0) < 0.6)
      errors.push('Note completeness is below 60%.');
    if (draft.status === 'signed')
      errors.push('This draft has already been signed.');

    return { valid: errors.length === 0, errors };
  },

  async signDraftNote(noteDraftId: string, signedByUserId: string): Promise<SignedNote> {
    const { data, error } = await supabase.rpc('documentation_sign_note_from_draft', {
      p_note_draft_id: noteDraftId,
      p_signed_by_user_id: signedByUserId,
    });

    if (error) throw new Error(`Failed to sign note: ${error.message}`);

    return noteService.getSignedNote(data as string);
  },

  async getSignedNote(signedNoteId: string): Promise<SignedNote> {
    const { data, error } = await supabase
      .from('documentation_signed_notes')
      .select('*')
      .eq('id', signedNoteId)
      .single();

    if (error) throw new Error(`Failed to fetch signed note: ${error.message}`);
    return data as SignedNote;
  },

  async getSignedNoteWithAddenda(signedNoteId: string): Promise<SignedNoteWithAddenda> {
    const [signedNote, addenda] = await Promise.all([
      noteService.getSignedNote(signedNoteId),
      noteService.listAddendaForSignedNote(signedNoteId),
    ]);
    return { ...signedNote, addenda };
  },

  async listPatientSignedNotes(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<SignedNote>> {
    const limit = pagination?.limit ?? 20;
    const offset = pagination?.offset ?? 0;

    const { data, error, count } = await supabase
      .from('documentation_signed_notes')
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .order('signed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to list signed notes: ${error.message}`);
    return { data: data as SignedNote[], total: count ?? data.length, page: Math.floor(offset / limit) + 1, pageSize: limit };
  },

  async listPatientDraftNotes(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<NoteDraft>> {
    const limit = pagination?.limit ?? 20;
    const offset = pagination?.offset ?? 0;

    const { data, error, count } = await supabase
      .from('documentation_note_drafts')
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to list draft notes: ${error.message}`);
    return { data: data as NoteDraft[], total: count ?? data.length, page: Math.floor(offset / limit) + 1, pageSize: limit };
  },

  async createAddendum(input: CreateAddendumInput): Promise<NoteAddendum> {
    const { data, error } = await supabase
      .from('documentation_note_addenda')
      .insert({
        signed_note_id: input.signed_note_id,
        clinic_id: input.clinic_id,
        addendum_type: input.addendum_type,
        reason: input.reason,
        addendum_text: input.addendum_text,
        section_affected: input.section_affected ?? null,
        original_text: input.original_text ?? null,
        created_by_user_id: input.created_by_user_id,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create addendum: ${error.message}`);
    return data as NoteAddendum;
  },

  async approveAddendum(addendumId: string, approvedByUserId: string): Promise<NoteAddendum> {
    const { data, error } = await supabase
      .from('documentation_note_addenda')
      .update({ status: 'approved', approved_by_user_id: approvedByUserId, approved_at: new Date().toISOString() })
      .eq('id', addendumId)
      .select()
      .single();

    if (error) throw new Error(`Failed to approve addendum: ${error.message}`);
    return data as NoteAddendum;
  },

  async listAddendaForSignedNote(signedNoteId: string): Promise<NoteAddendum[]> {
    const { data, error } = await supabase
      .from('documentation_note_addenda')
      .select('*')
      .eq('signed_note_id', signedNoteId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to list addenda: ${error.message}`);
    return data as NoteAddendum[];
  },
};