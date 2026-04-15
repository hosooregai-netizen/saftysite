'use client';

import { useMemo } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import { buildSiteHubHref } from '@/features/home/lib/siteEntry';
import { useSiteReportListState } from './useSiteReportListState';
import { useResolvedSiteRoute } from './useResolvedSiteRoute';

export function useSiteReportsScreen(siteKey: string) {
  const {
    isReady,
    isAuthenticated,
    authError,
    login,
    logout,
  } = useInspectionSessions();
  const { currentSite: resolvedSite, isResolvingSite } = useResolvedSiteRoute(siteKey);
  const reportListState = useSiteReportListState(siteKey, { siteOverride: resolvedSite });
  const { currentSite, currentUser } = reportListState;
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));

  const workerBackHref = useMemo(() => {
    if (!isAdminView) {
      return currentSite ? buildSiteHubHref(currentSite.id) : '/';
    }
    if (!currentSite) return getAdminSectionHref('headquarters');

    return getAdminSectionHref('headquarters', {
      headquarterId: currentSite.headquarterId,
      siteId: currentSite.id,
    });
  }, [currentSite, isAdminView]);

  return {
    ...reportListState,
    authError,
    currentUserName: currentUser?.name,
    isAdminView,
    isAuthenticated,
    isResolvingSite,
    isReady,
    login,
    logout,
    workerBackHref,
  };
}
