import { supabase } from '../../../lib/supabase';
import type { IRecordsRequestService } from './types';
import type { CreateRecordRequestInput, ReleaseDisclosureInput, CreateCorrectionRequestInput, UpdateRequestStatusInput, RecordRequest, Disclosure, CorrectionRequest, CorrectionRequestStatus, PaginatedResult, PaginationParams } from '../types';

const REQUESTS = 'documentation_record_requests';
const DISCLOSURES = 'documentation_disclosures';
const CORRECTIONS = 'documentation_correction_requests';

function paginate(pagination?: PaginationParams) {
  const limit = pagination?.limit ?? 20;
  const page = pagination?.page ?? 1;
  const offset = (page - 1) * limit;
  return { limit, page, offset };
}

export const recordsRequestService: IRecordsRequestService = {
  async createRecordRequest(input: CreateRecordRequestInput): Promise<RecordRequest> {
    const { data, error } = await supabase
      .from(REQUESTS)
      .insert({
        patient_id: input.patient_id,
        case_id: input.case_id ?? null,
        clinic_id: input.clinic_id,
        request_type: input.request_type,
        requester_name: input.requester_name,
        requester_role: input.requester_role ?? null,
        authority_basis: input.authority_basis ?? null,
        scope_description: input.scope_description ?? null,
        status: 'received',
        received_at: input.received_at,
        created_by_user_id: input.created_by_user_id,
      })
      .select()
      .single();
    if (error) throw new Error(`createRecordRequest failed: ${error.message}`);
    return data as RecordRequest;
  },

  async getRecordRequest(requestId: string): Promise<RecordRequest> {
    const { data, error } = await supabase.from(REQUESTS).select('*').eq('id', requestId).single();
    if (error) throw new Error(`getRecordRequest failed: ${error.message}`);
    return data as RecordRequest;
  },

  async updateRequestStatus(input: UpdateRequestStatusInput): Promise<RecordRequest> {
    const updates: Record<string, unknown> = { status: input.status };
    if (input.completed_at) updates.completed_at = input.completed_at;
    const { data, error } = await supabase
      .from(REQUESTS).update(updates).eq('id', input.request_id).select().single();
    if (error) throw new Error(`updateRequestStatus failed: ${error.message}`);
    return data as RecordRequest;
  },

  async listRecordRequestsByPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<RecordRequest>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(REQUESTS).select('*', { count: 'exact' })
      .eq('patient_id', patientId).order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listRecordRequestsByPatient failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as RecordRequest[], total, page, limit, has_more: offset + limit < total };
  },

  async listRecordRequestsByClinic(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<RecordRequest>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(REQUESTS).select('*', { count: 'exact' })
      .eq('clinic_id', clinicId).order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listRecordRequestsByClinic failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as RecordRequest[], total, page, limit, has_more: offset + limit < total };
  },

  async listPendingRequestsByClinic(clinicId: string): Promise<RecordRequest[]> {
    const { data, error } = await supabase
      .from(REQUESTS).select('*')
      .eq('clinic_id', clinicId)
      .in('status', ['received', 'reviewing'])
      .order('received_at', { ascending: true });
    if (error) throw new Error(`listPendingRequestsByClinic failed: ${error.message}`);
    return data as RecordRequest[];
  },

  async releaseDisclosure(input: ReleaseDisclosureInput): Promise<Disclosure> {
    const { data, error } = await supabase
      .from(DISCLOSURES)
      .insert({
        record_request_id: input.record_request_id,
        patient_id: input.patient_id,
        clinic_id: input.clinic_id,
        disclosed_by_user_id: input.disclosed_by_user_id,
        recipient_name: input.recipient_name,
        recipient_details: input.recipient_details ?? null,
        scope_description: input.scope_description ?? null,
        delivery_method: input.delivery_method,
      })
      .select()
      .single();
    if (error) throw new Error(`releaseDisclosure failed: ${error.message}`);

    // Mark the parent request as released.
    await supabase.from(REQUESTS)
      .update({ status: 'released', completed_at: new Date().toISOString() })
      .eq('id', input.record_request_id);

    return data as Disclosure;
  },

  async listDisclosuresByRequest(requestId: string): Promise<Disclosure[]> {
    const { data, error } = await supabase
      .from(DISCLOSURES).select('*').eq('record_request_id', requestId).order('disclosed_at', { ascending: false });
    if (error) throw new Error(`listDisclosuresByRequest failed: ${error.message}`);
    return data as Disclosure[];
  },

  async createCorrectionRequest(input: CreateCorrectionRequestInput): Promise<CorrectionRequest> {
    const { data, error } = await supabase
      .from(CORRECTIONS)
      .insert({
        patient_id: input.patient_id,
        signed_note_id: input.signed_note_id,
        clinic_id: input.clinic_id,
        requested_by: input.requested_by,
        request_text: input.request_text,
        status: 'received',
        received_at: input.received_at,
        created_by_user_id: input.created_by_user_id,
      })
      .select()
      .single();
    if (error) throw new Error(`createCorrectionRequest failed: ${error.message}`);
    return data as CorrectionRequest;
  },

  async getCorrectionRequest(requestId: string): Promise<CorrectionRequest> {
    const { data, error } = await supabase.from(CORRECTIONS).select('*').eq('id', requestId).single();
    if (error) throw new Error(`getCorrectionRequest failed: ${error.message}`);
    return data as CorrectionRequest;
  },

  async updateCorrectionRequestStatus(
    requestId: string,
    status: CorrectionRequestStatus,
    resolutionNotes?: string,
    resolvedAt?: string
  ): Promise<CorrectionRequest> {
    const updates: Record<string, unknown> = { status };
    if (resolutionNotes !== undefined) updates.resolution_notes = resolutionNotes;
    if (resolvedAt !== undefined) updates.resolved_at = resolvedAt;
    else if (['approved', 'denied', 'partially_corrected', 'implemented'].includes(status)) {
      updates.resolved_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from(CORRECTIONS).update(updates).eq('id', requestId).select().single();
    if (error) throw new Error(`updateCorrectionRequestStatus failed: ${error.message}`);
    return data as CorrectionRequest;
  },

  async listCorrectionRequestsByPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<CorrectionRequest>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(CORRECTIONS).select('*', { count: 'exact' })
      .eq('patient_id', patientId).order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listCorrectionRequestsByPatient failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as CorrectionRequest[], total, page, limit, has_more: offset + limit < total };
  },

  async listCorrectionRequestsByClinic(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<CorrectionRequest>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(CORRECTIONS).select('*', { count: 'exact' })
      .eq('clinic_id', clinicId).order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listCorrectionRequestsByClinic failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as CorrectionRequest[], total, page, limit, has_more: offset + limit < total };
  },
};
