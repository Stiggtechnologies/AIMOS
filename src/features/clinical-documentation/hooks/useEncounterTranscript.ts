import { useQuery } from '@tanstack/react-query';
import { encounterService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useEncounterTranscript(encounterId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.transcripts.encounter(encounterId),
    queryFn: () => encounterService.getEncounterTranscript(encounterId),
    enabled: !!encounterId,
  });
}