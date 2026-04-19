'use client';

import { useMemo } from 'react';
import { buildSiteHubHref } from '@/features/home/lib/siteEntry';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import { useResolvedSiteRoute } from './useResolvedSiteRoute';
import { useSiteReportListState } from './useSiteReportListState';

export function useSiteReportsScreen(siteKey: string) {
  const { isReady, isAuthenticated, authError, login, logout } = useInspectionSessions();
  const { currentSite: resolvedSite, isResolvingSite } = useResolvedSiteRoute(siteKey);
  const reportListState = useSiteReportListState(siteKey, { siteOverride: resolvedSite });
  const { currentSite, currentUser } = reportListState;
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));
  const createAvailabilityMessage =
    currentSite && isResolvingSite ? '사업장 정보를 확인하는 중입니다.' : null;
  const canCreateReport =
    reportListState.canCreateReport && Boolean(currentSite) && !isResolvingSite;

  const workerBackHref = useMemo(() => {
    if (!isAdminView) {
      return currentSite ? buildSiteHubHref(currentSite.id) : '/';
    }
    if (!currentSite) {
      return getAdminSectionHref('headquarters');
    }

    return getAdminSectionHref('headquarters', {
      headquarterId: currentSite.headquarterId,
      siteId: currentSite.id,
    });
  }, [currentSite, isAdminView]);

  return {
    ...reportListState,
    authError,
    canCreateReport,
    createAvailabilityMessage,
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
