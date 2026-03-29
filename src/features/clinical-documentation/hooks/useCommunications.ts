import { useQuery } from '@tanstack/react-query';
import { communicationService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { PaginationParams } from '../types';

export function useCommunications(patientId: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: documentationQueryKeys.communications.patient(patientId),
    queryFn: () => communicationService.listCommunicationsByPatient(patientId, pagination),
    enabled: !!patientId,
  });
}