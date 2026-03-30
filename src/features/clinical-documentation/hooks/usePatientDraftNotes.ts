import { useQuery } from '@tanstack/react-query';
import { noteService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { PaginationParams } from '../types';

export function usePatientDraftNotes(patientId: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.drafts.patient(patientId),
    queryFn: () => noteService.listPatientDraftNotes(patientId, pagination),
    enabled: !!patientId,
  });
}
