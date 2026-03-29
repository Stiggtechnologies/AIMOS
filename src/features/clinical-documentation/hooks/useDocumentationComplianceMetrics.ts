import { useQuery } from '@tanstack/react-query';
import { complianceService } from '../services';
import { documentationQueryKeys } from '../utils/queryKeys';

export function useDocumentationComplianceMetrics(clinicId: string, period: string) {
  return useQuery({
    queryKey: documentationQueryKeys.compliance.metrics(clinicId, period),
    queryFn: () => complianceService.getComplianceMetrics(clinicId, period),
    enabled: !!clinicId && !!period,
  });
}