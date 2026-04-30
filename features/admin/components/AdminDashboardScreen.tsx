'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { readNumberParam, useUrlQueryUpdater } from '@/hooks/useUrlQueryState';
import { CONTENT_CRUD_TYPE_OPTIONS } from '@/lib/admin';
import type { SafetyContentType, SafetyUser } from '@/types/backend';
import { AdminDashboardShell } from '@/features/admin/components/AdminDashboardShell';
import { AdminDashboardSectionContent } from '@/features/admin/components/AdminDashboardSectionContent';
import { AdminDashboardStateBanners } from '@/features/admin/components/AdminDashboardStateBanners';
import { useAdminDashboardState } from '@/features/admin/hooks/useAdminDashboardState';
import { buildAdminDashboardShellState } from '@/features/admin/lib/adminDashboardShellState';

interface AdminDashboardScreenProps {
  currentUser: SafetyUser;
  onLogout: () => void;
}

export function AdminDashboardScreen({
  currentUser,
  onLogout,
}: AdminDashboardScreenProps) {
  const searchParams = useSearchParams();
  const updateUrlQuery = useUrlQueryUpdater();
  const urlContentPage = readNumberParam(searchParams, 'contentPage', 1, 1);
  const [contentPage, setContentPage] = useState(urlContentPage);
  const contentTypeParam = searchParams.get('contentType');
  const {
    ensureSessionLoaded,
    getSessionById,
    sessions,
    refreshMasterData,
  } = useInspectionSessions();
  const dashboard = useAdminDashboardState({
    contentCacheScope: currentUser.id,
    enabled: true,
    refreshMasterData,
  });
  const shellState = buildAdminDashboardShellState({
    activeSection: dashboard.activeSection,
    activeSectionLabel: dashboard.activeSectionMeta.label,
    onClearHeadquarterSelection: dashboard.clearHeadquarterSelection,
    onClearSiteSelection: dashboard.clearSiteSelection,
    selectedHeadquarterId: dashboard.selectedHeadquarterId,
    selectedHeadquarterName: dashboard.selectedHeadquarter?.name ?? null,
    selectedSiteId: dashboard.selectedSiteId,
    selectedSiteName: dashboard.selectedSite?.site_name ?? null,
  });
  const activeContentType = useMemo<SafetyContentType | 'all'>(
    () =>
      CONTENT_CRUD_TYPE_OPTIONS.some((option) => option.value === contentTypeParam)
        ? (contentTypeParam as SafetyContentType)
        : 'all',
    [contentTypeParam],
  );
  useEffect(() => {
    setContentPage(urlContentPage);
  }, [urlContentPage]);

  return (
    <AdminDashboardShell
      activeSection={dashboard.activeSection}
      activeSectionLabel={shellState.activeSectionLabel}
      backLabel={shellState.backLabel}
      banners={
        <AdminDashboardStateBanners error={dashboard.error} notice={dashboard.notice} />
      }
      currentSiteKey={dashboard.selectedSiteId}
      currentUserName={currentUser.name}
      onBack={shellState.onBack}
      onLogout={onLogout}
      onSelectSection={dashboard.selectSection}
    >
      <AdminDashboardSectionContent
        activeContentType={activeContentType}
        contentPage={contentPage}
        currentUser={currentUser}
        dashboard={dashboard}
        ensureSessionLoaded={ensureSessionLoaded}
        getSessionById={getSessionById}
        onContentPageChange={(page) => {
          setContentPage(page);
          updateUrlQuery({ contentPage: page }, { contentPage: 1 });
        }}
        onContentTypeChange={(type) => {
          setContentPage(1);
          updateUrlQuery(
            { contentPage: 1, contentType: type === 'all' ? null : type },
            { contentPage: 1 },
          );
        }}
        sessions={sessions}
      />
    </AdminDashboardShell>
  );
}
