import { useQuery } from '@tanstack/react-query';
import { noteService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useDraftNote(noteDraftId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.drafts.detail(noteDraftId),
    queryFn: () => noteService.getDraftNote(noteDraftId),
    enabled: !!noteDraftId,
  });
}