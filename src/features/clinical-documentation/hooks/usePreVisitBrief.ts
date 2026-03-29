import { useQuery } from '@tanstack/react-query';
import { documentationService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function usePreVisitBrief(patientId: string, encounterId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.preVisitBrief(patientId, encounterId),
    queryFn: () => documentationService.getPreVisitBrief(patientId, encounterId),
    enabled: !!patientId && !!encounterId,
  });
}