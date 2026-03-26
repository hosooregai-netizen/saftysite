import { getSessionProgress } from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';
import type { ControllerDashboardData } from '@/types/controller';
import { isFieldAgentUserRole } from '@/lib/admin/adminRoles';

const NOW = Date.now();
const EXPIRING_CONTENT_WINDOW_MS = 1000 * 60 * 60 * 24 * 14;

export function buildAdminOverviewModel(
  data: ControllerDashboardData,
  sessions: InspectionSession[],
) {
  const latestAssignment = data.assignments.reduce<typeof data.assignments[number] | null>(
    (latest, assignment) =>
      !latest || latest.assigned_at.localeCompare(assignment.assigned_at) < 0
        ? assignment
        : latest,
    null,
  );
  const activeAssignments = data.assignments.filter((item) => item.is_active);
  const activeSites = data.sites.filter((item) => item.status === 'active');
  const assignedSiteIds = new Set(activeAssignments.map((item) => item.site_id));
  const activeFieldAgents = data.users.filter(
    (item) => isFieldAgentUserRole(item.role) && item.is_active,
  );
  const inactiveUsers = data.users.filter((item) => !item.is_active);
  const reportStats = sessions.reduce(
    (accumulator, session) => {
      const percentage = getSessionProgress(session).percentage;
      accumulator.total += 1;
      if (percentage >= 100) accumulator.completed += 1;
      else if (percentage > 0) accumulator.inProgress += 1;
      else accumulator.notStarted += 1;
      return accumulator;
    },
    { total: 0, inProgress: 0, completed: 0, notStarted: 0 },
  );
  const unassignedActiveSiteCount = activeSites.filter((item) => !assignedSiteIds.has(item.id))
    .length;
  const overloadedAgents = activeFieldAgents
    .map((user) => ({
      name: user.name,
      siteCount: activeAssignments.filter((assignment) => assignment.user_id === user.id).length,
    }))
    .filter((item) => item.siteCount >= 3)
    .sort((left, right) => right.siteCount - left.siteCount);
  const expiringContents = data.contentItems.filter((item) => {
    if (!item.is_active || !item.effective_to) return false;
    const end = new Date(item.effective_to);
    if (Number.isNaN(end.getTime())) return false;
    const diff = end.getTime() - NOW;
    return diff >= 0 && diff <= EXPIRING_CONTENT_WINDOW_MS;
  });

  return {
    activeFieldAgents,
    activeSites,
    expiringContentCount: expiringContents.length,
    inactiveUsers,
    latestAssignment,
    overloadedAgents,
    reportStats,
    unassignedActiveSiteCount,
  };
}

