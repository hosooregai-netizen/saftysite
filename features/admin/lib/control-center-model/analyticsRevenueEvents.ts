import { parseSiteInspectionSchedules, resolveSiteRevenueProfile } from '@/lib/admin/siteContractProfile';
import type { SafetyUser, SafetySite } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';
import type { SafetyAssignment } from '@/types/controller';
import { parseDateValue, startOfToday } from './dates';
import { filterRevenueRecognizedGuidanceRows } from './analyticsRevenueRules';
import { buildEnrichedRows } from './rowEnrichment';

export interface AnalyticsRevenueEvent {
  assigneeUserId: string;
  assigneeName: string;
  date: string;
  headquarterName: string;
  revenue: number;
  roundKey: string;
  roundNo: number | null;
  siteId: string;
  siteName: string;
}

export interface AnalyticsScheduleRow {
  assigneeUserId: string;
  assigneeName: string;
  headquarterName: string;
  isOverdue: boolean;
  plannedDate: string;
  roundNo: number;
  siteId: string;
  siteName: string;
  status: 'planned' | 'completed' | 'canceled';
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNameKey(value: string) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, ' ');
}

function buildUniqueUsersByName(users: SafetyUser[]) {
  const counts = new Map<string, number>();
  users.forEach((user) => {
    const key = normalizeNameKey(user.name);
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return users.reduce((map, user) => {
    const key = normalizeNameKey(user.name);
    if (!key || counts.get(key) !== 1) return map;
    map.set(key, user);
    return map;
  }, new Map<string, SafetyUser>());
}

function buildDefaultSiteAssignee(
  site: SafetySite,
  assignmentsBySiteId: Map<string, SafetyAssignment[]>,
) {
  const assignmentUserId =
    assignmentsBySiteId.get(site.id)?.find((assignment) => assignment.is_active)?.user_id || '';

  return {
    userId:
      normalizeText(site.assigned_user?.id) ||
      normalizeText(site.assigned_users?.[0]?.id) ||
      normalizeText(assignmentUserId),
    userName:
      normalizeText(site.assigned_user?.name) ||
      normalizeText(site.assigned_users?.[0]?.name) ||
      normalizeText(site.inspector_name) ||
      normalizeText(site.guidance_officer_name),
  };
}

function resolveScheduleAssignee(
  site: SafetySite,
  schedule: ReturnType<typeof parseSiteInspectionSchedules>[number],
  usersById: Map<string, SafetyUser>,
  uniqueUsersByName: Map<string, SafetyUser>,
  assignmentsBySiteId: Map<string, SafetyAssignment[]>,
) {
  const directUserId = normalizeText(schedule.assigneeUserId);
  const directUser = directUserId ? usersById.get(directUserId) ?? null : null;
  if (directUser) {
    return { userId: directUser.id, userName: directUser.name };
  }

  const namedUser = uniqueUsersByName.get(normalizeNameKey(schedule.assigneeName));
  if (namedUser) {
    return { userId: namedUser.id, userName: namedUser.name };
  }

  const fallback = buildDefaultSiteAssignee(site, assignmentsBySiteId);
  return {
    userId: fallback.userId,
    userName: normalizeText(schedule.assigneeName) || fallback.userName,
  };
}

export function buildAnalyticsScheduleRows(
  data: ControllerDashboardData,
  today: Date,
): AnalyticsScheduleRow[] {
  const todayStart = startOfToday(today);
  const usersById = new Map(data.users.map((user) => [user.id, user]));
  const uniqueUsersByName = buildUniqueUsersByName(data.users);
  const assignmentsBySiteId = data.assignments.reduce((map, assignment) => {
    if (!assignment.is_active) return map;
    if (!map.has(assignment.site_id)) {
      map.set(assignment.site_id, []);
    }
    map.get(assignment.site_id)?.push(assignment);
    return map;
  }, new Map<string, SafetyAssignment[]>());

  const rows = data.sites.flatMap((site) =>
    parseSiteInspectionSchedules(site)
      .filter((schedule) => schedule.roundNo > 0 && normalizeText(schedule.plannedDate))
      .map((schedule) => {
        const assignee = resolveScheduleAssignee(
          site,
          schedule,
          usersById,
          uniqueUsersByName,
          assignmentsBySiteId,
        );
        const plannedDate = normalizeText(schedule.plannedDate);
        const parsedDate = parseDateValue(plannedDate);
        return {
          assigneeName: assignee.userName,
          assigneeUserId: assignee.userId,
          headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
          isOverdue:
            schedule.status !== 'completed' &&
            schedule.status !== 'canceled' &&
            parsedDate != null &&
            parsedDate.getTime() < todayStart.getTime(),
          plannedDate,
          roundNo: schedule.roundNo,
          siteId: site.id,
          siteName: site.site_name,
          status: schedule.status,
        } satisfies AnalyticsScheduleRow;
      }),
  );

  return Array.from(
    rows.reduce((map, row) => {
      const key = `${row.siteId}:${row.roundNo}`;
      if (!map.has(key)) {
        map.set(key, row);
      }
      return map;
    }, new Map<string, AnalyticsScheduleRow>()).values(),
  );
}

export function buildAnalyticsRevenueEvents(
  data: ControllerDashboardData,
  reports: import('@/types/backend').SafetyReportListItem[],
  today: Date,
): AnalyticsRevenueEvent[] {
  const todayStart = startOfToday(today);
  const scheduleRows = buildAnalyticsScheduleRows(data, today);
  const siteById = new Map(data.sites.map((site) => [site.id, site]));
  const events = new Map<string, AnalyticsRevenueEvent>();

  scheduleRows.forEach((scheduleRow) => {
    const site = siteById.get(scheduleRow.siteId);
    if (!site || scheduleRow.plannedDate === '') return;
    const plannedDate = parseDateValue(scheduleRow.plannedDate);
    if (!plannedDate || plannedDate.getTime() > todayStart.getTime()) return;
    if (scheduleRow.status === 'canceled') return;
    const revenueProfile = resolveSiteRevenueProfile(site);
    if (!revenueProfile.isRevenueReady || revenueProfile.resolvedPerVisitAmount == null) return;

    events.set(`${scheduleRow.siteId}:${scheduleRow.roundNo}`, {
      assigneeName: scheduleRow.assigneeName,
      assigneeUserId: scheduleRow.assigneeUserId,
      date: scheduleRow.plannedDate,
      headquarterName: scheduleRow.headquarterName,
      revenue: revenueProfile.resolvedPerVisitAmount,
      roundKey: `${scheduleRow.siteId}:${scheduleRow.roundNo}`,
      roundNo: scheduleRow.roundNo,
      siteId: scheduleRow.siteId,
      siteName: scheduleRow.siteName,
    });
  });

  filterRevenueRecognizedGuidanceRows(buildEnrichedRows(data, reports, today), today).forEach((row) => {
    if (row.reportType !== 'technical_guidance' || !row.visitRound || row.visitRound <= 0) {
      return;
    }
    const key = `${row.siteId}:${row.visitRound || row.reportKey}`;
    if (events.has(key)) return;
    const revenue = resolveSiteRevenueProfile(row.contractProfile).resolvedPerVisitAmount;
    if (revenue == null) return;
    events.set(key, {
      assigneeName: row.assigneeName,
      assigneeUserId: row.assigneeUserId,
      date: row.visitDate || row.reportDate,
      headquarterName: row.headquarterName,
      revenue,
      roundKey: key,
      roundNo: row.visitRound,
      siteId: row.siteId,
      siteName: row.siteName,
    });
  });

  return Array.from(events.values()).sort((left, right) => {
    const dateCompare = left.date.localeCompare(right.date);
    if (dateCompare !== 0) return dateCompare;
    return left.roundKey.localeCompare(right.roundKey);
  });
}

export function countRevenueEvents(rows: AnalyticsRevenueEvent[]) {
  return rows.length;
}

export function sumRevenueEvents(rows: AnalyticsRevenueEvent[]) {
  return rows.reduce((sum, row) => sum + row.revenue, 0);
}
