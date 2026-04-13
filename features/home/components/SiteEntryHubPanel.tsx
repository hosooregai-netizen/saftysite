'use client';

import { useEffect, useMemo } from 'react';
import {
  buildSiteBadWorkplaceHref,
  buildSitePhotoAlbumHref,
  buildSiteQuarterlyListHref,
  buildSiteReportsHref,
  buildWorkerCalendarHref,
} from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteOperationalReportSummary } from '@/hooks/useSiteOperationalReportSummary';
import {
  createQuarterKey,
  getCurrentReportMonth,
} from '@/lib/erpReports/shared';
import { SiteReportsSummaryBar } from '@/features/site-reports/components/SiteReportsSummaryBar';
import type { InspectionSite } from '@/types/inspectionSession';
import { SiteEntryHubCards } from './SiteEntryHubCards';
import styles from './SiteEntryScreens.module.css';

interface SiteEntryHubPanelProps {
  className?: string;
  currentSite: InspectionSite;
  reportMetaText?: string | null;
}

export function SiteEntryHubPanel({
  className,
  currentSite,
  reportMetaText: _reportMetaText = null,
}: SiteEntryHubPanelProps) {
  void _reportMetaText;

  const { ensureSiteReportIndexLoaded, getReportIndexBySiteId, sessions } =
    useInspectionSessions();
  const { completedQuarterKeys, isLoading: operationalReportsLoading } =
    useSiteOperationalReportSummary(currentSite);

  const snapshot = currentSite.adminSiteSnapshot;
  const siteNameDisplay = currentSite.siteName?.trim() || snapshot.siteName?.trim() || '-';
  const addressDisplay = snapshot.siteAddress?.trim() || '-';
  const periodDisplay = snapshot.constructionPeriod?.trim() || '-';
  const amountDisplay = snapshot.constructionAmount?.trim() || '-';
  const currentReportMonth = getCurrentReportMonth();
  const badWorkplaceHref = buildSiteBadWorkplaceHref(currentSite.id, currentReportMonth);
  const calendarHref = buildWorkerCalendarHref(currentSite.id);
  const photoAlbumHref = buildSitePhotoAlbumHref(currentSite.id);
  const reportsHref = buildSiteReportsHref(currentSite.id);
  const quarterlyHref = buildSiteQuarterlyListHref(currentSite.id);
  const currentYear = new Date().getFullYear();
  const reportIndexState = getReportIndexBySiteId(currentSite.id);

  useEffect(() => {
    void ensureSiteReportIndexLoaded(currentSite.id);
  }, [currentSite.id, ensureSiteReportIndexLoaded]);

  const technicalGuidanceCount = useMemo(() => {
    const remoteItems = reportIndexState?.items ?? [];
    const localSessions = sessions.filter((session) => session.siteKey === currentSite.id);
    return new Set([
      ...remoteItems.map((item) => item.reportKey),
      ...localSessions.map((item) => item.id),
    ]).size;
  }, [currentSite.id, reportIndexState?.items, sessions]);

  const completedQuarters = useMemo(
    () =>
      [1, 2, 3, 4].filter((quarter) =>
        completedQuarterKeys.has(createQuarterKey(currentYear, quarter)),
      ),
    [completedQuarterKeys, currentYear],
  );

  return (
    <div className={className ? `${styles.entryPanel} ${className}` : styles.entryPanel}>
      <SiteReportsSummaryBar
        addressDisplay={addressDisplay}
        amountDisplay={amountDisplay}
        periodDisplay={periodDisplay}
        siteNameDisplay={siteNameDisplay}
      />
      <SiteEntryHubCards
        badWorkplaceHref={badWorkplaceHref}
        calendarHref={calendarHref}
        completedQuarters={completedQuarters}
        currentReportMonth={currentReportMonth}
        currentYear={currentYear}
        operationalReportsLoading={operationalReportsLoading}
        photoAlbumHref={photoAlbumHref}
        quarterlyHref={quarterlyHref}
        reportsHref={reportsHref}
        technicalGuidanceCount={technicalGuidanceCount}
      />
    </div>
  );
}
