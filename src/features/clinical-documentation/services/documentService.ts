import { supabase } from '../../../lib/supabase';
import type { IDocumentService } from './types';
import type { UploadClinicalDocumentInput, ClinicalDocument, PaginatedResult, PaginationParams } from '../types';

const TABLE = 'documentation_clinical_documents';
const STORAGE_BUCKET = 'clinical-documents';

function paginate(pagination?: PaginationParams) {
  const limit = pagination?.limit ?? 20;
  const page = pagination?.page ?? 1;
  const offset = (page - 1) * limit;
  return { limit, page, offset };
}

export const documentService: IDocumentService = {
  async uploadClinicalDocument(input: UploadClinicalDocumentInput): Promise<ClinicalDocument> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        patient_id: input.patient_id,
        case_id: input.case_id ?? null,
        clinic_id: input.clinic_id,
        document_type: input.document_type,
        file_name: input.file_name,
        storage_path: input.storage_path,
        mime_type: input.mime_type,
        size_bytes: input.size_bytes,
        uploaded_by_user_id: input.uploaded_by_user_id,
      })
      .select()
      .single();
    if (error) throw new Error(`uploadClinicalDocument failed: ${error.message}`);
    return data as ClinicalDocument;
  },

  async getClinicalDocument(documentId: string): Promise<ClinicalDocument> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', documentId).single();
    if (error) throw new Error(`getClinicalDocument failed: ${error.message}`);
    return data as ClinicalDocument;
  },

  async listDocumentsByPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<ClinicalDocument>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(TABLE).select('*', { count: 'exact' })
      .eq('patient_id', patientId).order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listDocumentsByPatient failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as ClinicalDocument[], total, page, limit, has_more: offset + limit < total };
  },

  async listDocumentsByCase(caseId: string, pagination?: PaginationParams): Promise<PaginatedResult<ClinicalDocument>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(TABLE).select('*', { count: 'exact' })
      .eq('case_id', caseId).order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listDocumentsByCase failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as ClinicalDocument[], total, page, limit, has_more: offset + limit < total };
  },

  async listDocumentsByClinic(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<ClinicalDocument>> {
    const { limit, page, offset } = paginate(pagination);
    const { data, error, count } = await supabase
      .from(TABLE).select('*', { count: 'exact' })
      .eq('clinic_id', clinicId).order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listDocumentsByClinic failed: ${error.message}`);
    const total = count ?? data.length;
    return { data: data as ClinicalDocument[], total, page, limit, has_more: offset + limit < total };
  },

  async deleteClinicalDocument(documentId: string): Promise<void> {
    const { data: doc, error: fetchError } = await supabase
      .from(TABLE).select('storage_path').eq('id', documentId).single();
    if (fetchError) throw new Error(`deleteClinicalDocument (lookup) failed: ${fetchError.message}`);

    // Remove the stored object first, then the metadata row.
    if (doc?.storage_path) {
      const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([doc.storage_path as string]);
      if (storageError) throw new Error(`deleteClinicalDocument (storage) failed: ${storageError.message}`);
    }

    const { error } = await supabase.from(TABLE).delete().eq('id', documentId);
    if (error) throw new Error(`deleteClinicalDocument failed: ${error.message}`);
  },

  async getDocumentDownloadUrl(documentId: string): Promise<string> {
    const { data: doc, error } = await supabase
      .from(TABLE).select('storage_path').eq('id', documentId).single();
    if (error) throw new Error(`getDocumentDownloadUrl (lookup) failed: ${error.message}`);

    const { data: signed, error: signError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(doc.storage_path as string, 3600);
    if (signError) throw new Error(`getDocumentDownloadUrl failed: ${signError.message}`);
    return signed.signedUrl;
  },
};
