import { useQuery } from '@tanstack/react-query';
import { noteService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useSignedNote(signedNoteId: string) {
  return useQuery({
    queryKey: documentationQueryKeys.notes.signed.detail(signedNoteId),
    queryFn: () => noteService.getSignedNote(signedNoteId),
    enabled: !!signedNoteId,
  });
}