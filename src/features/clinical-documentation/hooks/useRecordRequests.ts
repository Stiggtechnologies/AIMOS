import { useQuery } from '@tanstack/react-query';
import { recordsRequestService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { PaginationParams } from '../types';

export function useRecordRequests(patientId: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: documentationQueryKeys.requests.records.patient(patientId),
    queryFn: () => recordsRequestService.listRecordRequestsByPatient(patientId, pagination),
    enabled: !!patientId,
  });
}