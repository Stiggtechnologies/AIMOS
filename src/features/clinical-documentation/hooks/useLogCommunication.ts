import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { CreateCommunicationInput } from '../types';

export function useLogCommunication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommunicationInput) => communicationService.logCommunication(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: documentationQueryKeys.communications.all,
      });
      if (data.case_id) {
        queryClient.invalidateQueries({
          queryKey: documentationQueryKeys.communications.case(data.case_id),
        });
      }
      if (data.encounter_id) {
        queryClient.invalidateQueries({
          queryKey: documentationQueryKeys.communications.encounter(data.encounter_id),
        });
      }
    },
  });
}