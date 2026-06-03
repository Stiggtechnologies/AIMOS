import { supabase } from '../../../lib/supabase';
import type { IEncounterService } from './types';
import type { CreateEncounterInput, UpdateEncounterStateInput, Encounter, Transcript, TranscriptSegment, PaginatedResult, PaginationParams } from '../types';

export const encounterService: IEncounterService = {
  async createEncounter(input: CreateEncounterInput): Promise<Encounter> {
    const { data, error } = await supabase
      .from('documentation_encounters')
      .insert({
        patient_id: input.patient_id,
        case_id: input.case_id ?? null,
        clinic_id: input.clinic_id,
        provider_user_id: input.provider_user_id,
        encounter_type: input.encounter_type,
        modality: input.modality ?? 'in_person',
        status: 'in_progress',
        ambient_capture_enabled: input.ambient_capture_enabled ?? false,
        capture_status: 'idle',
        scheduled_start: input.scheduled_start ?? null,
        actual_start: null,
        created_by_user_id: input.provider_user_id,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create encounter: ${error.message}`);
    return data as Encounter;
  },

  async getEncounter(encounterId: string): Promise<Encounter> {
    const { data, error } = await supabase
      .from('documentation_encounters')
      .select('*')
      .eq('id', encounterId)
      .single();

    if (error) throw new Error(`Failed to fetch encounter: ${error.message}`);
    return data as Encounter;
  },

  async updateEncounterState(input: UpdateEncounterStateInput): Promise<Encounter> {
    const updates: Record<string, unknown> = {};
    if (input.status) updates.status = input.status;
    if (input.capture_status) updates.capture_status = input.capture_status;
    if (input.actual_start) updates.actual_start = input.actual_start;
    if (input.actual_end) updates.actual_end = input.actual_end;

    const { data, error } = await supabase
      .from('documentation_encounters')
      .update(updates)
      .eq('id', input.encounter_id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update encounter: ${error.message}`);
    return data as Encounter;
  },

  async listEncountersByPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<Encounter>> {
    const limit = pagination?.limit ?? 20;
    const page = pagination?.page ?? 1;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('documentation_encounters')
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to list encounters: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as Encounter[], total, page, limit, has_more: offset + limit < total };
  },

  async listEncountersByCase(caseId: string): Promise<Encounter[]> {
    const { data, error } = await supabase
      .from('documentation_encounters')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to list encounters by case: ${error.message}`);
    return data as Encounter[];
  },

  async listEncountersByClinic(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<Encounter>> {
    const limit = pagination?.limit ?? 20;
    const page = pagination?.page ?? 1;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('documentation_encounters')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to list encounters by clinic: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as Encounter[], total, page, limit, has_more: offset + limit < total };
  },

  async getEncounterTranscript(encounterId: string): Promise<Transcript | null> {
    const { data, error } = await supabase
      .from('documentation_transcripts')
      .select('*')
      .eq('encounter_id', encounterId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch transcript: ${error.message}`);
    return data ? (data as Transcript) : null;
  },

  async getTranscriptSegments(transcriptId: string): Promise<TranscriptSegment[]> {
    const { data, error } = await supabase
      .from('documentation_transcript_segments')
      .select('*')
      .eq('transcript_id', transcriptId)
      .order('segment_index', { ascending: true });

    if (error) throw new Error(`Failed to fetch segments: ${error.message}`);
    return data as TranscriptSegment[];
  },

  async uploadTranscript(encounterId: string, storagePath: string, createdByUserId: string): Promise<Transcript> {
    const { data, error } = await supabase
      .from('documentation_transcripts')
      .insert({
        encounter_id: encounterId,
        storage_path: storagePath,
        diarization_status: 'pending',
        transcript_status: 'pending',
        source_language: 'en',
        created_by_user_id: createdByUserId,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to upload transcript: ${error.message}`);
    return data as Transcript;
  },

  async processTranscript(transcriptId: string, _createdByUserId: string): Promise<Transcript> {
    const { data, error } = await supabase
      .from('documentation_transcripts')
      .update({ transcript_status: 'processing', diarization_status: 'processing' })
      .eq('id', transcriptId)
      .select()
      .single();

    if (error) throw new Error(`Failed to process transcript: ${error.message}`);
    return data as Transcript;
  },
};