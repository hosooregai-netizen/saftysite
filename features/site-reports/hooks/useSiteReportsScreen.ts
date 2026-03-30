'use client';

import { useMemo } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { getAdminSectionHref, isAdminUserRole } from '@/lib/admin';
import { useSiteReportListState } from './useSiteReportListState';

export function useSiteReportsScreen(siteKey: string) {
  const {
    isReady,
    isAuthenticated,
    authError,
    login,
    logout,
  } = useInspectionSessions();
  const reportListState = useSiteReportListState(siteKey);
  const { currentSite, currentUser } = reportListState;
  const isAdminView = Boolean(currentUser && isAdminUserRole(currentUser.role));

  const workerBackHref = useMemo(() => {
    if (!isAdminView) return '/';
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
    isReady,
    login,
    logout,
    workerBackHref,
  };
}
