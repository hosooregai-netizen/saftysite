'use client';

import { useMemo } from 'react';
import {
  buildMobileSessionHref,
  buildMobileSitePhotoAlbumHref,
  buildMobileSiteQuarterlyListHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { useSiteOperationalReportIndex } from '@/hooks/useSiteOperationalReportIndex';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { useSiteReportListState } from '@/features/site-reports/hooks/useSiteReportListState';
import {
  buildCurrentQuarterStatusLabel,
  buildSiteContactModel,
  getLatestSiteReport,
  getProgressLabel,
} from './mobileSiteHomeHelpers';
import { useMobileSiteHomePhotoUpload } from './useMobileSiteHomePhotoUpload';

export function useMobileSiteHomeScreenState(siteKey: string) {
  const { authError, getSessionsBySiteId, isAuthenticated, isReady, login, logout } =
    useInspectionSessions();
  const { currentSite, currentUser, reportIndexStatus, reportItems } = useSiteReportListState(siteKey);
  const { quarterlyReports } = useSiteOperationalReportIndex(
    currentSite,
    isAuthenticated && isReady && Boolean(currentSite),
  );
  const photoUpload = useMobileSiteHomePhotoUpload(currentSite?.id ?? null);

  const siteSessions = useMemo(
    () => (currentSite ? getSessionsBySiteId(currentSite.id) : []),
    [currentSite, getSessionsBySiteId],
  );
  const latestReport = useMemo(
    () => getLatestSiteReport({ reportItems, siteSessions }),
    [reportItems, siteSessions],
  );
  const quarterlyStatusLabel = useMemo(
    () => buildCurrentQuarterStatusLabel(quarterlyReports),
    [quarterlyReports],
  );
  const contactModel = useMemo(
    () => (currentSite ? buildSiteContactModel(currentSite) : null),
    [currentSite],
  );
  const latestReportHref = currentSite
    ? latestReport.latestReportKey
      ? buildMobileSessionHref(latestReport.latestReportKey)
      : buildMobileSiteReportsHref(currentSite.id)
    : null;
  const directSignatureHref =
    latestReport.latestReportKey && currentSite
      ? buildMobileSessionHref(latestReport.latestReportKey, { action: 'direct-signature' })
      : null;
  const photoAlbumHref = currentSite ? buildMobileSitePhotoAlbumHref(currentSite.id) : null;
  const quarterlyListHref = currentSite ? buildMobileSiteQuarterlyListHref(currentSite.id) : null;

  return {
    authError,
    contactModel,
    currentSite,
    currentUserName: currentUser?.name ?? null,
    directSignatureHref,
    isAuthenticated,
    isReady,
    latestGuidanceDate: latestReport.latestGuidanceDate,
    latestReportHref,
    latestReportProgressLabel: getProgressLabel(latestReport.latestReportProgress),
    latestReportTitle: latestReport.latestReportTitle,
    login,
    logout,
    photoAlbumHref,
    photoUpload,
    quarterlyListHref,
    quarterlyStatusLabel,
    reportIndexStatus,
  };
}
