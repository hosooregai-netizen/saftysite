'use client';

import { useMemo } from 'react';
import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { normalizeQuarterlyReportPeriod } from '@/lib/erpReports/shared';
import type { InspectionSite } from '@/types/inspectionSession';

export function useSiteOperationalReportSummary(
  site: InspectionSite | null,
  enabled = true,
) {
  const { quarterlyReports, isLoading, error } = useSiteOperationalReportIndex(site, enabled);

  const quarterlyPeriods = useMemo(
    () =>
      quarterlyReports.reduce<ReturnType<typeof normalizeQuarterlyReportPeriod>[]>((acc, item) => {
        const normalized = normalizeQuarterlyReportPeriod(item);
        if (!normalized.quarterKey) {
          return acc;
        }

        if (!acc.some((period) => period.quarterKey === normalized.quarterKey)) {
          acc.push(normalized);
        }
        return acc;
      }, []),
    [quarterlyReports],
  );

  const completedQuarterKeys = useMemo(
    () => new Set(quarterlyPeriods.map((report) => report.quarterKey).filter(Boolean)),
    [quarterlyPeriods],
  );

  return {
    quarterlyPeriods,
    completedQuarterKeys,
    isLoading,
    error,
  };
}
