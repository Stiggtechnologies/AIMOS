import { useMutation } from '@tanstack/react-query';
import { noteService } from '../services';

export function useValidateDraftNote() {
  return useMutation({
    mutationFn: ({
      noteDraftId,
      expectedSignature,
    }: {
      noteDraftId: string;
      expectedSignature?: string;
    }) => noteService.validateDraftNote(noteDraftId, expectedSignature),
  });
}