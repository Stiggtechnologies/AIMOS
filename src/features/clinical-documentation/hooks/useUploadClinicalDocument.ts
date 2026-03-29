import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';
import type { UploadClinicalDocumentInput } from '../types';

export function useUploadClinicalDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadClinicalDocumentInput) =>
      documentService.uploadClinicalDocument(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: documentationQueryKeys.documents.all,
      });
      queryClient.invalidateQueries({
        queryKey: documentationQueryKeys.documents.patient(data.patient_id),
      });
      if (data.case_id) {
        queryClient.invalidateQueries({
          queryKey: documentationQueryKeys.documents.case(data.case_id),
        });
      }
    },
  });
}