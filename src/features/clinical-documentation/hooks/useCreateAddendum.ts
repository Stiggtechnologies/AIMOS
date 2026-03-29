import { useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { CreateAddendumInput } from '../types';

export function useCreateAddendum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAddendumInput) => noteService.createAddendum(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentationQueryKeys.notes.signed.withAddenda(variables.signed_note_id),
      });
    },
  });
}