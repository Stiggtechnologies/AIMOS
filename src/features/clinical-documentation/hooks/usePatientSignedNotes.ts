import { useQuery } from '@tanstack/react-query';
import { noteService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { PaginationParams } from '../types';

export function usePatientSignedNotes(patientId: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.signed.patient(patientId),
    queryFn: () => noteService.listPatientSignedNotes(patientId, pagination),
    enabled: !!patientId,
  });
}