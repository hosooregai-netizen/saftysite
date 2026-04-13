'use client';

import { useState } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import type { SafetyUser } from '@/types/backend';
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
  const [contentPage, setContentPage] = useState(1);
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
        contentPage={contentPage}
        currentUser={currentUser}
        dashboard={dashboard}
        ensureSessionLoaded={ensureSessionLoaded}
        getSessionById={getSessionById}
        onContentPageChange={setContentPage}
        sessions={sessions}
      />
    </AdminDashboardShell>
  );
}
