'use client';

import { useMemo } from 'react';
import { getCurrentReportMonth } from '@/lib/erpReports/shared';
import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { useSiteReportListState } from '@/features/site-reports/hooks/useSiteReportListState';
import type { InspectionSite } from '@/types/inspectionSession';
import {
  buildSiteBadWorkplaceHref,
  buildSitePhotoAlbumHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
  buildWorkerCalendarHref,
} from '@/features/home/lib/siteEntry';
import { SiteEntryHubCards } from './SiteEntryHubCards';
import homeStyles from './HomeScreen.module.css';

interface SiteEntryHubPanelProps {
  currentSite: InspectionSite;
}

function getCompletedQuarterList(
  quarterlyReports: Array<{
    quarter: number;
    year: number;
  }>,
) {
  return [...new Set(quarterlyReports.map((item) => item.quarter))]
    .filter((quarter) => quarter >= 1 && quarter <= 4)
    .sort((left, right) => left - right);
}

export function SiteEntryHubPanel({ currentSite }: SiteEntryHubPanelProps) {
  const {
    currentSite: resolvedSite,
    reportIndexError,
    reportIndexStatus,
    reportItems,
  } = useSiteReportListState(currentSite.id, {
    siteOverride: currentSite,
  });
  const { isLoading: operationalReportsLoading, quarterlyReports } = useSiteOperationalReportIndex(
    resolvedSite,
    Boolean(resolvedSite),
  );
  const reportMonth = getCurrentReportMonth();
  const completedQuarters = useMemo(
    () => getCompletedQuarterList(quarterlyReports),
    [quarterlyReports],
  );

  if (!resolvedSite && reportIndexStatus === 'error') {
    return (
      <div className={homeStyles.emptyState}>
        <p className={homeStyles.emptyTitle}>현장 상세 정보를 불러오지 못했습니다.</p>
        <p className={homeStyles.emptyDescription}>
          {reportIndexError || '배정 현장 목록을 다시 확인하거나 잠시 후 다시 시도해 주세요.'}
        </p>
      </div>
    );
  }

  if (!resolvedSite) {
    return (
      <div className={homeStyles.emptyState}>
        <p className={homeStyles.emptyTitle}>현장 정보를 불러오는 중입니다.</p>
      </div>
    );
  }

  return (
    <SiteEntryHubCards
      badWorkplaceHref={buildSiteBadWorkplaceHref(resolvedSite.id, reportMonth)}
      calendarHref={buildWorkerCalendarHref(resolvedSite.id)}
      completedQuarters={completedQuarters}
      currentReportMonth={reportMonth}
      currentYear={new Date().getFullYear()}
      operationalReportsLoading={operationalReportsLoading}
      photoAlbumHref={buildSitePhotoAlbumHref(resolvedSite.id)}
      quarterlyHref={buildSiteQuarterlyListHref(resolvedSite.id)}
      reportsHref={buildSiteReportsHref(resolvedSite.id)}
      technicalGuidanceCount={reportItems.length}
    />
  );
}
