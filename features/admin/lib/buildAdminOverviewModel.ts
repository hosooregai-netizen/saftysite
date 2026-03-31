import { getSessionProgress } from '@/constants/inspectionSession';
import { getControllerSectionHref, isFieldAgentUserRole } from '@/lib/admin/adminShared';
import type { ControllerDashboardData } from '@/types/controller';
import type { InspectionSession } from '@/types/inspectionSession';

export interface AdminOverviewChartEntry {
  count: number;
  label: string;
}

export interface AdminOverviewSiteLink {
  headquarterName: string | null;
  href: string;
  siteId: string;
  siteName: string;
}

export interface AdminOverviewUrgentSiteRow {
  detailHref: string;
  headquarterName: string | null;
  missingCount: number;
  missingLabels: string[];
  siteId: string;
  siteName: string;
}

export interface AdminOverviewPendingAgentRow {
  assignedSites: AdminOverviewSiteLink[];
  reportCount: number;
  reportedSites: AdminOverviewSiteLink[];
  userId: string;
  userName: string;
}

export interface AdminOverviewAsyncKpiState {
  pendingAgentRows: AdminOverviewPendingAgentRow[];
  urgentSiteRows: AdminOverviewUrgentSiteRow[];
}

const EMPTY_ASYNC_KPI_STATE: AdminOverviewAsyncKpiState = {
  pendingAgentRows: [],
  urgentSiteRows: [],
};

export function buildAdminOverviewModel(
  data: ControllerDashboardData,
  sessions: InspectionSession[],
  asyncKpiState: AdminOverviewAsyncKpiState = EMPTY_ASYNC_KPI_STATE,
) {
  const activeAssignments = data.assignments.filter((item) => item.is_active);
  const activeSites = data.sites.filter((item) => item.status === 'active');
  const assignedSiteIds = new Set(activeAssignments.map((item) => item.site_id));
  const activeFieldAgents = data.users.filter(
    (item) => isFieldAgentUserRole(item.role) && item.is_active,
  );
  const reportStats = sessions.reduce(
    (accumulator, session) => {
      const percentage = getSessionProgress(session).percentage;
      accumulator.total += 1;
      if (percentage >= 100) accumulator.completed += 1;
      else if (percentage > 0) accumulator.inProgress += 1;
      else accumulator.notStarted += 1;
      return accumulator;
    },
    { completed: 0, inProgress: 0, notStarted: 0, total: 0 },
  );
  const unassignedActiveSiteCount = activeSites.filter((item) => !assignedSiteIds.has(item.id))
    .length;
  const assignedActiveSiteCount = Math.max(0, activeSites.length - unassignedActiveSiteCount);
  const urgentSiteRows = asyncKpiState.urgentSiteRows;
  const pendingAgentRows = asyncKpiState.pendingAgentRows;

  return {
    activeFieldAgents,
    activeSites,
    assignedActiveSiteCount,
    attentionCount: urgentSiteRows.length + pendingAgentRows.length,
    coverageEntries: [
      { count: assignedActiveSiteCount, label: '배정 완료' },
      { count: unassignedActiveSiteCount, label: '미배정' },
    ] satisfies AdminOverviewChartEntry[],
    pendingAgentRows,
    reportProgressEntries: [
      { count: reportStats.completed, label: '완료' },
      { count: reportStats.inProgress, label: '작성 중' },
      { count: reportStats.notStarted, label: '미착수' },
    ] satisfies AdminOverviewChartEntry[],
    reportStats,
    unassignedActiveSiteCount,
    urgentSiteRows,
  };
}

export function buildOverviewSiteQuickLink(
  site: ControllerDashboardData['sites'][number],
): AdminOverviewSiteLink {
  return {
    headquarterName: site.headquarter_detail?.name ?? site.headquarter?.name ?? null,
    href: getControllerSectionHref('headquarters', {
      headquarterId: site.headquarter_id,
      siteId: site.id,
    }),
    siteId: site.id,
    siteName: site.site_name,
  };
}
