import { useQuery } from '@tanstack/react-query';
import { noteService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useDraftNoteVersions(noteDraftId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.drafts.versions(noteDraftId),
    queryFn: () => noteService.getDraftVersions(noteDraftId),
    enabled: !!noteDraftId,
  });
}