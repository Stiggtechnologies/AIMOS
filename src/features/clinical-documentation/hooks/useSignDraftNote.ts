import { useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useSignDraftNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteDraftId,
      signedByUserId,
    }: {
      noteDraftId: string;
      signedByUserId: string;
    }) => noteService.signDraftNote(noteDraftId, signedByUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentationQueryKeys.notes.drafts.all });
      queryClient.invalidateQueries({ queryKey: documentationQueryKeys.notes.signed.all });
    },
  });
}