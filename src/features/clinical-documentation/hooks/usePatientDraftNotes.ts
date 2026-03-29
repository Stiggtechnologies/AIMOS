import { useQuery } from '@tanstack/react-query';
import { documentationService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { PaginationParams } from '../types';

export function usePatientDraftNotes(patientId: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.drafts.patient(patientId),
    queryFn: () => documentationService.getEncountersForPatient(patientId, pagination),
    enabled: !!patientId,
  });
}