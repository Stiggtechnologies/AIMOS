import { useQuery } from '@tanstack/react-query';
import { encounterService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useEncounter(encounterId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.encounters.encounter(encounterId),
    queryFn: () => encounterService.getEncounter(encounterId),
    enabled: !!encounterId,
  });
}