import { useQuery } from '@tanstack/react-query';
import { aiGovernanceService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { PaginationParams } from '../types';

export function useAIRuns(clinicId: string, pagination?: PaginationParams) {
  return useQuery({
    queryKey: documentationQueryKeys.ai.runs(clinicId),
    queryFn: () => aiGovernanceService.listAIRuns(clinicId, pagination),
    enabled: !!clinicId,
  });
}