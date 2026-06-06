import { useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { SaveDraftNoteVersionInput, CreateDraftNoteInput } from '../types';

export function useSaveDraftNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDraftNoteInput | SaveDraftNoteVersionInput) => {
      // Distinguish by presence of note_draft_id vs encounter_id
      if ('note_draft_id' in input) {
        return noteService.saveDraftVersion(input);
      }
      return noteService.createDraftNote(input);
    },
    onSuccess: (data) => {
      const keys = documentationQueryKeys.notes.drafts.detail(data.id);
      queryClient.invalidateQueries({ queryKey: keys });
      queryClient.invalidateQueries({ queryKey: documentationQueryKeys.notes.drafts.all });
    },
  });
}