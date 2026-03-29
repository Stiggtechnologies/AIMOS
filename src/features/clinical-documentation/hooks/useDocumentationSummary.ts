import { useQuery } from '@tanstack/react-query';
import { documentationService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { PatientDocumentationSummaryDTO } from '../types';

export function useDocumentationSummary(patientId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.summary(patientId),
    queryFn: () => documentationService.getPatientDocumentationSummary(patientId),
    enabled: !!patientId,
  });
}