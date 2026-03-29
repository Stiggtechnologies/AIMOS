import { useQuery } from '@tanstack/react-query';
import { recordsRequestService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useDisclosureQueue(clinicId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.requests.records.pending(clinicId),
    queryFn: () => recordsRequestService.listPendingRequestsByClinic(clinicId),
    enabled: !!clinicId,
  });
}