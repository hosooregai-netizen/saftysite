'use client';

import { useInspectionSessions } from '@/hooks/useInspectionSessions';
import { canDeleteControllerCrud, ADMIN_SECTIONS } from '@/lib/admin';
import type { SafetyUser } from '@/types/backend';
import { AdminDashboardShell } from '@/features/admin/components/AdminDashboardShell';
import { AdminDashboardStateBanners } from '@/features/admin/components/AdminDashboardStateBanners';
import { useAdminDashboardState } from '@/features/admin/hooks/useAdminDashboardState';
import { ContentItemsSection } from '@/features/admin/sections/content/ContentItemsSection';
import { HeadquartersSection } from '@/features/admin/sections/headquarters/HeadquartersSection';
import { AdminOverviewSection } from '@/features/admin/sections/overview/AdminOverviewSection';
import { UsersSection } from '@/features/admin/sections/users/UsersSection';

interface AdminDashboardScreenProps {
  currentUser: SafetyUser;
  onLogout: () => void;
}

function renderAdminSection(
  activeSection: (typeof ADMIN_SECTIONS)[number]['key'],
  sectionProps: {
    assignments: ReturnType<typeof useAdminDashboardState>['data']['assignments'];
    canDelete: boolean;
    dashboard: ReturnType<typeof useAdminDashboardState>;
    headquarters: ReturnType<typeof useAdminDashboardState>['data']['headquarters'];
    sessions: ReturnType<typeof useInspectionSessions>['sessions'];
    sites: ReturnType<typeof useAdminDashboardState>['data']['sites'];
    users: ReturnType<typeof useAdminDashboardState>['data']['users'];
  },
) {
  const { assignments, canDelete, dashboard, headquarters, sessions, sites, users } =
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
          items={dashboard.data.contentItems}
          onCreate={dashboard.createContentItem}
          onDelete={dashboard.deleteContentItem}
          onUpdate={dashboard.updateContentItem}
        />
      );
    default:
      return (
        <AdminOverviewSection
          data={dashboard.data}
          onSelectSection={dashboard.selectSection}
          sessions={sessions}
        />
      );
  }
}

export function AdminDashboardScreen({
  currentUser,
  onLogout,
}: AdminDashboardScreenProps) {
  const { sessions, refreshMasterData } = useInspectionSessions();
  const dashboard = useAdminDashboardState({
    enabled: true,
    refreshMasterData,
  });
  const canDeleteCrud = canDeleteControllerCrud(currentUser.role);
  const headquartersTitle =
    dashboard.selectedSite?.site_name?.trim() ||
    dashboard.selectedHeadquarter?.name?.trim() ||
    '사업장 목록';
  const headquartersDescription = dashboard.selectedSite
    ? '보고서 및 추가 업무'
    : dashboard.selectedHeadquarter
      ? '현장 목록'
      : undefined;
  const shellBackLabel =
    dashboard.activeSection === 'headquarters'
      ? dashboard.selectedSiteId
        ? dashboard.selectedHeadquarter?.name?.trim() || '현장 목록'
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
      activeSectionDescription={
        dashboard.activeSection === 'headquarters' ? headquartersDescription : undefined
      }
      activeSectionLabel={
        dashboard.activeSection === 'headquarters'
          ? headquartersTitle
          : dashboard.activeSectionMeta.label
      }
      backLabel={shellBackLabel}
      banners={
        <AdminDashboardStateBanners error={dashboard.error} notice={dashboard.notice} />
      }
      currentUserName={currentUser.name}
      onBack={shellBackAction}
      onLogout={onLogout}
      onSelectSection={dashboard.selectSection}
    >
      {renderAdminSection(dashboard.activeSection, {
        assignments: dashboard.data.assignments,
        canDelete: canDeleteCrud,
        dashboard,
        headquarters: dashboard.data.headquarters,
        sessions,
        sites: dashboard.data.sites,
        users: dashboard.data.users,
      })}
    </AdminDashboardShell>
  );
}
