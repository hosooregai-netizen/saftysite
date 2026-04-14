'use client';

import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { canDeleteControllerCrud, canUploadContentAssets } from '@/lib/admin';
import type { SafetyUser } from '@/types/backend';
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

const CONTENT_SECTION_PAGE_SIZE = 50;

interface AdminDashboardSectionContentProps {
  contentPage: number;
  currentUser: SafetyUser;
  dashboard: ReturnType<typeof useAdminDashboardState>;
  ensureSessionLoaded: ReturnType<typeof useInspectionSessions>['ensureSessionLoaded'];
  getSessionById: ReturnType<typeof useInspectionSessions>['getSessionById'];
  onContentPageChange: (page: number) => void;
  sessions: ReturnType<typeof useInspectionSessions>['sessions'];
}

export function AdminDashboardSectionContent({
  contentPage,
  currentUser,
  dashboard,
  ensureSessionLoaded,
  getSessionById,
  onContentPageChange,
  sessions,
}: AdminDashboardSectionContentProps) {
  const canDelete = canDeleteControllerCrud(currentUser.role);
  const canUploadAssets = canUploadContentAssets(currentUser.role);
  const busy = dashboard.isLoading || dashboard.isContentLoading || dashboard.isMutating;
  const { assignments, headquarters, sites, users } = dashboard.data;

  switch (dashboard.activeSection) {
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
      return <AnalyticsSection currentUserId={currentUser.id} />;
    case 'mailbox':
      return <MailboxSection reports={dashboard.reportList} sites={sites} />;
    case 'photos':
      return <PhotosSection sites={sites} />;
    case 'schedules':
      return <SchedulesSection currentUser={currentUser} />;
    default:
      return (
        <AdminOverviewSection
          data={dashboard.data}
          onUpdateSiteDispatchPolicy={dashboard.updateSiteDispatchPolicy}
          reports={dashboard.reportList}
        />
      );
  }
}
