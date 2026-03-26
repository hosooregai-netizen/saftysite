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
import { SitesSection } from '@/features/admin/sections/sites/SitesSection';
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
  const busy = dashboard.isLoading || dashboard.isMutating;

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
          busy={busy}
          canDelete={canDelete}
          headquarters={headquarters}
          onCreate={dashboard.createHeadquarter}
          onDelete={dashboard.deleteHeadquarter}
          onUpdate={dashboard.updateHeadquarter}
        />
      );
    case 'sites':
      return (
        <SitesSection
          assignments={assignments}
          busy={busy}
          canDelete={canDelete}
          headquarters={headquarters}
          onAssignFieldAgent={dashboard.assignFieldAgentToSite}
          onCreate={dashboard.createSite}
          onDelete={dashboard.deleteSite}
          onUnassignFieldAgent={dashboard.unassignFieldAgentFromSite}
          onUpdate={dashboard.updateSite}
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

  return (
    <AdminDashboardShell
      activeSection={dashboard.activeSection}
      activeSectionLabel={dashboard.activeSectionMeta.label}
      banners={
        <AdminDashboardStateBanners error={dashboard.error} notice={dashboard.notice} />
      }
      currentUserName={currentUser.name}
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

