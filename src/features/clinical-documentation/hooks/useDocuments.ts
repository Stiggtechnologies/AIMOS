import { useQuery } from '@tanstack/react-query';
import { documentService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { PaginationParams } from '../types';

export function useDocuments(patientId: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: documentationQueryKeys.documents.patient(patientId),
    queryFn: () => documentService.listDocumentsByPatient(patientId, pagination),
    enabled: !!patientId,
  });
}