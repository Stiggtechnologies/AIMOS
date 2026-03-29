import { useQuery } from '@tanstack/react-query';
import { aiGovernanceService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useAIModels(clinicId?: string) {
  return useQuery({
    queryKey: documentationQueryKeys.ai.models(clinicId),
    queryFn: () => aiGovernanceService.listAIModels(clinicId),
  });
}