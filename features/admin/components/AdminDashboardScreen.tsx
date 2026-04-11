'use client';

import { useState } from 'react';
import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import {
  canDeleteControllerCrud,
  canUploadContentAssets,
  ADMIN_SECTIONS,
} from '@/lib/admin';
import type { SafetyUser } from '@/types/backend';
import { AdminDashboardShell } from '@/features/admin/components/AdminDashboardShell';
import { AdminDashboardStateBanners } from '@/features/admin/components/AdminDashboardStateBanners';
import { useAdminDashboardState } from '@/features/admin/hooks/useAdminDashboardState';
import { AnalyticsSection } from '@/features/admin/sections/analytics/AnalyticsSection';
import { ContentItemsSection } from '@/features/admin/sections/content/ContentItemsSection';
import { HeadquartersSection } from '@/features/admin/sections/headquarters/HeadquartersSection';
import { MailboxSection } from '@/features/admin/sections/mailbox/MailboxSection';
import { AdminOverviewSection } from '@/features/admin/sections/overview/AdminOverviewSection';
import { PhotosSection } from '@/features/admin/sections/photos/PhotosSection';
import { ReportsSection } from '@/features/admin/sections/reports/ReportsSection';
import { SchedulesSection } from '@/features/admin/sections/schedules/SchedulesSection';
import { UsersSection } from '@/features/admin/sections/users/UsersSection';

interface AdminDashboardScreenProps {
  currentUser: SafetyUser;
  onLogout: () => void;
}

const CONTENT_SECTION_PAGE_SIZE = 50;

function renderAdminSection(
  activeSection: (typeof ADMIN_SECTIONS)[number]['key'],
  sectionProps: {
    assignments: ReturnType<typeof useAdminDashboardState>['data']['assignments'];
    canDelete: boolean;
    canUploadAssets: boolean;
    currentUser: SafetyUser;
    dashboard: ReturnType<typeof useAdminDashboardState>;
    contentPage: number;
    ensureSessionLoaded: ReturnType<typeof useInspectionSessions>['ensureSessionLoaded'];
    getSessionById: ReturnType<typeof useInspectionSessions>['getSessionById'];
    headquarters: ReturnType<typeof useAdminDashboardState>['data']['headquarters'];
    onContentPageChange: (page: number) => void;
    sessions: ReturnType<typeof useInspectionSessions>['sessions'];
    sites: ReturnType<typeof useAdminDashboardState>['data']['sites'];
    users: ReturnType<typeof useAdminDashboardState>['data']['users'];
  },
) {
  const {
    assignments,
    canDelete,
    canUploadAssets,
    contentPage,
    currentUser,
    dashboard,
    ensureSessionLoaded,
    getSessionById,
    headquarters,
    onContentPageChange,
    sessions,
    sites,
    users,
  } =
    sectionProps;
  const busy = dashboard.isLoading || dashboard.isContentLoading || dashboard.isMutating;

  switch (activeSection) {
    case 'users':
      return (
        <UsersSection
          assignments={assignments}
          busy={busy}
          canDelete={canDelete}
          onCreate={dashboard.createUser}
          onDelete={dashboard.deleteUser}
          onSaveEdit={dashboard.saveUserEdit}
          sessions={sessions}
          sites={sites}
          users={users}
        />
      );
    case 'headquarters':
      return (
        <HeadquartersSection
          assignments={assignments}
          busy={busy}
          canDelete={canDelete}
          headquarters={headquarters}
          onReload={dashboard.reload}
          onAssignFieldAgent={dashboard.assignFieldAgentToSite}
          onClearHeadquarterSelection={dashboard.clearHeadquarterSelection}
          onClearSiteSelection={dashboard.clearSiteSelection}
          onCreate={dashboard.createHeadquarter}
          onCreateSite={dashboard.createSite}
          onDelete={dashboard.deleteHeadquarter}
          onDeleteSite={dashboard.deleteSite}
          onSelectHeadquarter={dashboard.selectHeadquarter}
          onSelectSite={dashboard.selectSite}
          onUnassignFieldAgent={dashboard.unassignFieldAgentFromSite}
          onUpdate={dashboard.updateHeadquarter}
          onUpdateSite={dashboard.updateSite}
          selectedHeadquarterId={dashboard.selectedHeadquarterId}
          selectedSiteId={dashboard.selectedSiteId}
          sites={sites}
          users={users}
        />
      );
    case 'content':
      return (
        <ContentItemsSection
          busy={busy}
          canDelete={canDelete}
          canUploadAssets={canUploadAssets}
          currentPage={contentPage}
          items={dashboard.data.contentItems}
          loading={dashboard.isContentLoading}
          onCreate={dashboard.createContentItem}
          onDelete={dashboard.deleteContentItem}
          onPageChange={onContentPageChange}
          onRefresh={() => void dashboard.reloadContent({ force: true })}
          onUpdate={dashboard.updateContentItem}
          pageSize={CONTENT_SECTION_PAGE_SIZE}
          refreshing={dashboard.isContentRefreshing}
        />
      );
    case 'reports':
      return (
        <ReportsSection
          currentUser={currentUser}
          ensureSessionLoaded={ensureSessionLoaded}
          getSessionById={getSessionById}
          headquarters={headquarters}
          isLoading={dashboard.isLoading || dashboard.isReportsLoading || dashboard.isMutating}
          onReloadData={dashboard.reload}
          sessions={sessions}
          sites={sites}
          users={users}
        />
      );
    case 'analytics':
      return (
        <AnalyticsSection
          data={dashboard.data}
        />
      );
    case 'mailbox':
      return (
        <MailboxSection
          reports={dashboard.reportList}
          sites={sites}
        />
      );
    case 'photos':
      return <PhotosSection sites={sites} />;
    case 'schedules':
      return (
        <SchedulesSection
          currentUser={currentUser}
          sites={sites}
          users={users}
        />
      );
    default:
      return (
        <AdminOverviewSection
          data={dashboard.data}
          reports={dashboard.reportList}
        />
      );
  }
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
  const canDeleteCrud = canDeleteControllerCrud(currentUser.role);
  const canUploadAssets = canUploadContentAssets(currentUser.role);
  const headquartersTitle =
    dashboard.selectedSite?.site_name?.trim() ||
    dashboard.selectedHeadquarter?.name?.trim() ||
    '사업장 목록';
  const shellBackLabel =
    dashboard.activeSection === 'headquarters'
      ? dashboard.selectedSiteId
        ? '현장 목록'
        : dashboard.selectedHeadquarterId
          ? '사업장 목록'
          : undefined
      : undefined;
  const shellBackAction =
    dashboard.activeSection === 'headquarters'
      ? dashboard.selectedSiteId
        ? dashboard.clearSiteSelection
        : dashboard.selectedHeadquarterId
          ? dashboard.clearHeadquarterSelection
          : undefined
      : undefined;

  return (
    <AdminDashboardShell
      activeSection={dashboard.activeSection}
      activeSectionLabel={
        dashboard.activeSection === 'headquarters'
          ? headquartersTitle
          : dashboard.activeSectionMeta.label
      }
      backLabel={shellBackLabel}
      banners={
        <AdminDashboardStateBanners error={dashboard.error} notice={dashboard.notice} />
      }
      currentSiteKey={dashboard.selectedSiteId}
      currentUserName={currentUser.name}
      onBack={shellBackAction}
      onLogout={onLogout}
      onSelectSection={dashboard.selectSection}
    >
      {renderAdminSection(dashboard.activeSection, {
        assignments: dashboard.data.assignments,
        canDelete: canDeleteCrud,
        canUploadAssets,
        contentPage,
        currentUser,
        dashboard,
        ensureSessionLoaded,
        getSessionById,
        headquarters: dashboard.data.headquarters,
        onContentPageChange: setContentPage,
        sessions,
        sites: dashboard.data.sites,
        users: dashboard.data.users,
      })}
    </AdminDashboardShell>
  );
}
