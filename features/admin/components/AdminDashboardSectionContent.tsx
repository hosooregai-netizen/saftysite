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
  const { sites } = dashboard.data;

  switch (dashboard.activeSection) {
    case 'users':
      return (
        <UsersSection
          busy={busy}
          canDelete={canDelete}
          currentUserId={currentUser.id}
          onCreate={async (input) => {
            await dashboard.createUser(input);
          }}
          onDelete={async (id) => {
            await dashboard.deleteUser(id);
          }}
          onSaveEdit={async (id, input, password) => {
            await dashboard.saveUserEdit(id, input, password);
          }}
          sessions={sessions}
        />
      );
    case 'headquarters':
      return (
        <HeadquartersSection
          busy={busy}
          canDelete={canDelete}
          onClearHeadquarterSelection={dashboard.clearHeadquarterSelection}
          onClearSiteSelection={dashboard.clearSiteSelection}
          currentUserId={currentUser.id}
          onAssignFieldAgent={async (siteId, userId) => {
            await dashboard.assignFieldAgentToSite(siteId, userId);
          }}
          onCreate={async (input) => {
            await dashboard.createHeadquarter(input);
          }}
          onCreateSite={dashboard.createSite}
          onDelete={async (id) => {
            await dashboard.deleteHeadquarter(id);
          }}
          onDeleteSite={async (id) => {
            await dashboard.deleteSite(id);
          }}
          onSelectHeadquarter={dashboard.selectHeadquarter}
          onSelectSite={dashboard.selectSite}
          onUnassignFieldAgent={async (siteId, userId) => {
            await dashboard.unassignFieldAgentFromSite(siteId, userId);
          }}
          onUpdate={async (id, input) => {
            await dashboard.updateHeadquarter(id, input);
          }}
          onUpdateSite={async (id, input) => {
            await dashboard.updateSite(id, input);
          }}
          selectedHeadquarterId={dashboard.selectedHeadquarterId}
          selectedSiteId={dashboard.selectedSiteId}
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
          onCreate={async (input) => {
            await dashboard.createContentItem(input);
          }}
          onDelete={async (id) => {
            await dashboard.deleteContentItem(id);
          }}
          onPageChange={onContentPageChange}
          onRefresh={() => void dashboard.reloadContent({ force: true })}
          onUpdate={async (id, input) => {
            await dashboard.updateContentItem(id, input);
          }}
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
          isLoading={dashboard.isLoading || dashboard.isReportsLoading || dashboard.isMutating}
          onReloadData={dashboard.reload}
          sessions={sessions}
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
          currentUserId={currentUser.id}
          data={dashboard.data}
          onUpdateSiteDispatchPolicy={dashboard.updateSiteDispatchPolicy}
          reports={dashboard.reportList}
        />
      );
  }
}
