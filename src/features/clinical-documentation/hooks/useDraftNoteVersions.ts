import { useQuery } from '@tanstack/react-query';
import { noteService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

// Fetches versions for a draft note
export function useDraftNoteVersions(noteDraftId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.drafts.versions(noteDraftId),
    queryFn: () => noteService.getDraftVersions(noteDraftId),
    enabled: !!noteDraftId,
  });
}

// Fetches draft WITH its version history
export function useDraftNoteWithVersions(noteDraftId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.drafts.detail(noteDraftId),
    queryFn: () => noteService.getDraftNoteWithVersions(noteDraftId),
    enabled: !!noteDraftId,
  });
}

// Fetches a single draft note
export function useDraftNote(noteDraftId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.drafts.detail(noteDraftId),
    queryFn: () => noteService.getDraftNote(noteDraftId),
    enabled: !!noteDraftId,
  });
}