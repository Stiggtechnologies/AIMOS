import type { IDocumentService } from './types';
import type { UploadClinicalDocumentInput, ClinicalDocument, PaginatedResult, PaginationParams } from '../types';

export const documentService: IDocumentService = {
  async uploadClinicalDocument(input: UploadClinicalDocumentInput): Promise<ClinicalDocument> {
    throw new Error('Not implemented');
  },
  async getClinicalDocument(documentId: string): Promise<ClinicalDocument> {
    throw new Error('Not implemented');
  },
  async listDocumentsByPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<ClinicalDocument>> {
    throw new Error('Not implemented');
  },
  async listDocumentsByCase(caseId: string, pagination?: PaginationParams): Promise<PaginatedResult<ClinicalDocument>> {
    throw new Error('Not implemented');
  },
  async listDocumentsByClinic(clinicId: string, pagination?: PaginationParams): Promise<PaginatedResult<ClinicalDocument>> {
    throw new Error('Not implemented');
  },
  async deleteClinicalDocument(documentId: string): Promise<void> {
    throw new Error('Not implemented');
  },
  async getDocumentDownloadUrl(documentId: string): Promise<string> {
    throw new Error('Not implemented');
  },
};