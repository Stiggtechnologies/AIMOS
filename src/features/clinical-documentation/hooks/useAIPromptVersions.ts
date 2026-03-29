import { useQuery } from '@tanstack/react-query';
import { aiGovernanceService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useAIPromptVersions(modelId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.ai.prompts(modelId),
    queryFn: () => aiGovernanceService.listPromptVersions(modelId),
    enabled: !!modelId,
  });
}