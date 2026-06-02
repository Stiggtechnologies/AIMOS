import { supabase } from '../../../lib/supabase';
import type { ICommunicationService } from './types';
import type { CreateCommunicationInput, CommunicationLog, PaginatedResult, PaginationParams } from '../types';

const TABLE = 'documentation_communications';

function paginate(pagination?: PaginationParams) {
  const limit = pagination?.limit ?? 20;
  const page = pagination?.page ?? 1;
  const offset = (page - 1) * limit;
  return { limit, page, offset };
}

export const communicationService: ICommunicationService = {
  async logCommunication(input: CreateCommunicationInput): Promise<CommunicationLog> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        patient_id: input.patient_id,
        case_id: input.case_id ?? null,
        encounter_id: input.encounter_id ?? null,
        clinic_id: input.clinic_id,
        communication_type: input.communication_type,
        direction: input.direction,
        occurred_at: input.occurred_at,
        summary_text: input.summary_text ?? null,
        participants: input.participants ?? null,
        captured_by_user_id: input.captured_by_user_id,
        requires_follow_up: input.requires_follow_up ?? false,
      })
      .select()
      .single();
    if (error) throw new Error(`logCommunication failed: ${error.message}`);
    return data as CommunicationLog;
  },

  async getCommunication(communicationId: string): Promise<CommunicationLog> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', communicationId).single();
    if (error) throw new Error(`getCommunication failed: ${error.message}`);
    return data as CommunicationLog;
  },

  async listCommunicationsByPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<CommunicationLog>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(TABLE).select('*', { count: 'exact' })
      .eq('patient_id', patientId).order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listCommunicationsByPatient failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as CommunicationLog[], total, page, limit, has_more: offset + limit < total };
  },

  async listCommunicationsByCase(caseId: string, pagination?: PaginationParams): Promise<PaginatedResult<CommunicationLog>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(TABLE).select('*', { count: 'exact' })
      .eq('case_id', caseId).order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listCommunicationsByCase failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as CommunicationLog[], total, page, limit, has_more: offset + limit < total };
  },

  async listCommunicationsByEncounter(encounterId: string): Promise<CommunicationLog[]> {
    const { data, error } = await supabase
      .from(TABLE).select('*').eq('encounter_id', encounterId).order('occurred_at', { ascending: false });
    if (error) throw new Error(`listCommunicationsByEncounter failed: ${error.message}`);
    return data as CommunicationLog[];
  },

  async listCommunicationsByClinic(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<CommunicationLog>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(TABLE).select('*', { count: 'exact' })
      .eq('clinic_id', clinicId).order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listCommunicationsByClinic failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as CommunicationLog[], total, page, limit, has_more: offset + limit < total };
  },

  async markCommunicationFollowUp(communicationId: string, requiresFollowUp: boolean): Promise<CommunicationLog> {
    const { data, error } = await supabase
      .from(TABLE).update({ requires_follow_up: requiresFollowUp }).eq('id', communicationId).select().single();
    if (error) throw new Error(`markCommunicationFollowUp failed: ${error.message}`);
    return data as CommunicationLog;
  },

  async convertCommunicationToNote(communicationId: string, noteDraftId: string): Promise<CommunicationLog> {
    const { data, error } = await supabase
      .from(TABLE).update({ converted_to_note_id: noteDraftId }).eq('id', communicationId).select().single();
    if (error) throw new Error(`convertCommunicationToNote failed: ${error.message}`);
    return data as CommunicationLog;
  },
};
