import { useQuery } from '@tanstack/react-query';
import { recordsRequestService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { PaginationParams } from '../types';

export function useCorrectionRequests(patientId: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: documentationQueryKeys.requests.corrections.patient(patientId),
    queryFn: () => recordsRequestService.listCorrectionRequestsByPatient(patientId, pagination),
    enabled: !!patientId,
  });
}