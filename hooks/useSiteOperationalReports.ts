'use client';

import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { useSiteOperationalReportMutations } from '@/hooks/useSiteOperationalReportMutations';
import type { InspectionSite } from '@/types/inspectionSession';

export function useSiteOperationalReports(site: InspectionSite | null, enabled = true) {
  const indexState = useSiteOperationalReportIndex(site, enabled);
  const mutationState = useSiteOperationalReportMutations(site);

  return {
    quarterlyReports: indexState.quarterlyReports,
    badWorkplaceReports: indexState.badWorkplaceReports,
    isLoading: indexState.isLoading,
    isSaving: mutationState.isSaving,
    error: mutationState.error ?? indexState.error,
    reload: indexState.reload,
    saveQuarterlyReport: mutationState.saveQuarterlyReport,
    saveBadWorkplaceReport: mutationState.saveBadWorkplaceReport,
    deleteOperationalReport: mutationState.deleteOperationalReport,
  };
}
