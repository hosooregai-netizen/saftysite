import {
  buildSiteMemoWithContractProfile,
  parseSiteContractProfile,
  parseSiteInspectionSchedules,
  parseSiteMemoNote,
  resolveSiteRevenueProfile,
} from '@/lib/admin/siteContractProfile';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { SafetyReportListItem, SafetySite, SafetyUser } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseDateValue(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfToday(today: Date) {
  const normalized = new Date(today);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function buildDefaultAssignee(site: SafetySite, usersById: Map<string, SafetyUser>) {
  const defaultUserId = site.assigned_user?.id || site.assigned_users?.[0]?.id || '';
  return {
    userId: defaultUserId,
    userName:
      usersById.get(defaultUserId)?.name ||
      site.assigned_user?.name ||
      site.assigned_users?.[0]?.name ||
      normalizeText(site.inspector_name) ||
      normalizeText(site.guidance_officer_name),
  };
}

function buildReportDate(report: SafetyReportListItem) {
  return (
    normalizeText(report.visit_date) ||
    normalizeText(report.updated_at).slice(0, 10) ||
    normalizeText(report.created_at).slice(0, 10)
  );
}

function buildBackfilledSchedule(
  site: SafetySite,
  roundNo: number,
  plannedDate: string,
  status: SafetyInspectionSchedule['status'],
  assigneeUserId: string,
  assigneeName: string,
  selectionReasonLabel: string,
  linkedReportKey = '',
  current?: SafetyInspectionSchedule,
): SafetyInspectionSchedule {
  const headquarterName = site.headquarter_detail?.name || site.headquarter?.name || '';
  return {
    actualVisitDate: current?.actualVisitDate || (linkedReportKey ? plannedDate : ''),
    assigneeName: assigneeName || current?.assigneeName || normalizeText(site.inspector_name) || '',
    assigneeUserId: assigneeUserId || current?.assigneeUserId || '',
    exceptionMemo: current?.exceptionMemo || '',
    exceptionReasonCode: current?.exceptionReasonCode || '',
    headquarterId: site.headquarter_id,
    headquarterName,
    id: current?.id || `schedule:${site.id}:${roundNo}`,
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: linkedReportKey || current?.linkedReportKey || '',
    plannedDate: plannedDate || current?.plannedDate || '',
    roundNo,
    selectionConfirmedAt: current?.selectionConfirmedAt || '',
    selectionConfirmedByName: current?.selectionConfirmedByName || '',
    selectionConfirmedByUserId: current?.selectionConfirmedByUserId || '',
    selectionReasonLabel: current?.selectionReasonLabel || selectionReasonLabel,
    selectionReasonMemo: current?.selectionReasonMemo || '',
    siteId: site.id,
    siteName: site.site_name,
    status,
    windowEnd: current?.windowEnd || plannedDate,
    windowStart: current?.windowStart || plannedDate,
  };
}

function mergeReportBackfilledSchedules(
  site: SafetySite,
  reports: SafetyReportListItem[],
  usersById: Map<string, SafetyUser>,
  today: Date,
) {
  const currentSchedules = parseSiteInspectionSchedules(site);
  const schedulesByRound = new Map(currentSchedules.map((schedule) => [schedule.roundNo, schedule]));
  const defaultAssignee = buildDefaultAssignee(site, usersById);
  const todayStart = startOfToday(today);

  reports
    .filter((report) => report.report_type === 'technical_guidance' && (report.visit_round ?? 0) > 0)
    .sort((left, right) => {
      const roundCompare = (left.visit_round ?? 0) - (right.visit_round ?? 0);
      if (roundCompare !== 0) return roundCompare;
      return normalizeText(right.updated_at).localeCompare(normalizeText(left.updated_at));
    })
    .forEach((report) => {
      const roundNo = report.visit_round ?? 0;
      const reportDate = buildReportDate(report);
      const parsedReportDate = parseDateValue(reportDate);
      if (roundNo <= 0 || !parsedReportDate) return;

      const current = schedulesByRound.get(roundNo);
      const nextStatus =
        current?.status === 'canceled'
          ? 'canceled'
          : parsedReportDate.getTime() <= todayStart.getTime()
            ? 'completed'
            : 'planned';
      const assigneeUserId = normalizeText(report.assigned_user_id) || current?.assigneeUserId || defaultAssignee.userId;
      const assigneeName =
        usersById.get(assigneeUserId)?.name ||
        current?.assigneeName ||
        defaultAssignee.userName;

      if (!current) {
        schedulesByRound.set(
          roundNo,
          buildBackfilledSchedule(
            site,
            roundNo,
            reportDate,
            nextStatus,
            assigneeUserId,
            assigneeName,
            '기술지도 보고서 백필',
            report.report_key,
          ),
        );
        return;
      }

      const shouldPatchCurrent =
        !normalizeText(current.plannedDate) ||
        !normalizeText(current.assigneeName) ||
        !normalizeText(current.assigneeUserId) ||
        !normalizeText(current.linkedReportKey) ||
        current.status === 'planned';

      if (!shouldPatchCurrent) {
        return;
      }

      schedulesByRound.set(
        roundNo,
        buildBackfilledSchedule(
          site,
          roundNo,
          normalizeText(current.plannedDate) || reportDate,
          current.status === 'canceled' ? 'canceled' : nextStatus,
          assigneeUserId,
          assigneeName,
          '기술지도 보고서 백필',
          report.report_key,
          current,
        ),
      );
    });

  return Array.from(schedulesByRound.values()).sort((left, right) => left.roundNo - right.roundNo);
}

function buildContractFallbackSchedules(
  site: SafetySite,
  usersById: Map<string, SafetyUser>,
  today: Date,
) {
  const revenueProfile = resolveSiteRevenueProfile(site);
  if (!revenueProfile.isRevenueReady || revenueProfile.plannedRounds <= 0) {
    return [];
  }

  const startDate =
    parseDateValue(site.contract_start_date) ||
    parseDateValue(site.contract_date) ||
    parseDateValue(site.contract_signed_date) ||
    parseDateValue(site.project_start_date);
  if (!startDate) {
    return [];
  }

  const totalRounds = revenueProfile.plannedRounds;
  const parsedEndDate =
    parseDateValue(site.contract_end_date) || parseDateValue(site.project_end_date);
  const endDate =
    parsedEndDate && parsedEndDate.getTime() >= startDate.getTime()
      ? parsedEndDate
      : new Date(startDate.getTime() + Math.max(totalRounds - 1, 0) * 30 * 24 * 60 * 60 * 1000);
  const defaultAssignee = buildDefaultAssignee(site, usersById);
  const todayStart = startOfToday(today);
  const spanDays = Math.max(
    0,
    Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
  );
  const stepDays = totalRounds > 1 ? Math.max(1, Math.round(spanDays / (totalRounds - 1))) : 0;

  return Array.from({ length: totalRounds }, (_, index) => {
    const plannedAt = new Date(startDate);
    plannedAt.setDate(plannedAt.getDate() + stepDays * index);
    const plannedDate = formatDateValue(plannedAt);
    const status: SafetyInspectionSchedule['status'] =
      plannedAt.getTime() <= todayStart.getTime() ? 'completed' : 'planned';
    return buildBackfilledSchedule(
      site,
      index + 1,
      plannedDate,
      status,
      defaultAssignee.userId,
      defaultAssignee.userName,
      '계약 일정 추정 백필',
    );
  });
}

export function backfillAnalyticsSourceData(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  today = new Date(),
): ControllerDashboardData {
  const reportsBySiteId = reports.reduce((map, report) => {
    if (!normalizeText(report.site_id)) return map;
    if (!map.has(report.site_id)) {
      map.set(report.site_id, []);
    }
    map.get(report.site_id)?.push(report);
    return map;
  }, new Map<string, SafetyReportListItem[]>());
  const usersById = new Map(data.users.map((user) => [user.id, user]));

  let changed = false;
  const sites = data.sites.map((site) => {
    const reportBackfilledSchedules = mergeReportBackfilledSchedules(
      site,
      reportsBySiteId.get(site.id) ?? [],
      usersById,
      today,
    );
    const nextSchedules =
      reportBackfilledSchedules.length > 0
        ? reportBackfilledSchedules
        : buildContractFallbackSchedules(site, usersById, today);

    if (nextSchedules.length === 0) {
      return site;
    }

    const nextMemo = buildSiteMemoWithContractProfile(
      parseSiteMemoNote(site.memo),
      parseSiteContractProfile(site),
      {
        existingMemo: site.memo,
        schedules: nextSchedules,
      },
    );

    if (nextMemo === site.memo) {
      return site;
    }

    changed = true;
    return {
      ...site,
      memo: nextMemo,
    };
  });

  return changed ? { ...data, sites } : data;
}
