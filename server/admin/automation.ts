import {
  buildAdminAnalyticsModel,
  buildAdminOverviewModel,
  type AdminAnalyticsPeriod,
} from '@/features/admin/lib/buildAdminControlCenterModel';
import { getAdminSectionHref } from '@/lib/admin';
import { buildControllerReportRows } from '@/lib/admin/controllerReports';
import {
  buildSiteMemoWithContractProfile,
  parseSiteContractProfile,
  parseSiteInspectionSchedules,
  parseSiteMemoNote,
  resolveSiteRevenueProfile,
} from '@/lib/admin/siteContractProfile';
import type {
  ControllerReportRow,
  SafetyAdminAlert,
  SafetyAdminAnalyticsResponse,
  SafetyAdminDataCompletionRow,
  SafetyAdminOverviewResponse,
  SafetyInspectionSchedule,
} from '@/types/admin';
import type { SafetyReport, SafetyReportListItem, SafetySite, SafetyUser } from '@/types/backend';
import type { ControllerDashboardData } from '@/types/controller';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseDateValue(value: string | null | undefined): Date | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const matched = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matched) {
    const date = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]));
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number) {
  const parsed = parseDateValue(value);
  if (!parsed) return '';
  parsed.setDate(parsed.getDate() + days);
  return formatDateValue(parsed);
}

function getMonthWindow(month: string, today: Date) {
  const matched = normalizeText(month).match(/^(\d{4})-(\d{2})$/);
  if (!matched) {
    return {
      end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      token: formatDateValue(today).slice(0, 7),
    };
  }

  return {
    end: new Date(Number(matched[1]), Number(matched[2]), 0),
    start: new Date(Number(matched[1]), Number(matched[2]) - 1, 1),
    token: `${matched[1]}-${matched[2]}`,
  };
}

function isDateOutsideWindow(plannedDate: string, windowStart: string, windowEnd: string) {
  return Boolean(
    plannedDate &&
      windowStart &&
      windowEnd &&
      (plannedDate < windowStart || plannedDate > windowEnd),
  );
}

function isDateOverdue(plannedDate: string, today: Date, status: SafetyInspectionSchedule['status']) {
  if (status !== 'planned') return false;
  const parsed = parseDateValue(plannedDate);
  if (!parsed) return false;
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);
  return parsed.getTime() < current.getTime();
}

function buildBaseScheduleRows(
  data: ControllerDashboardData,
  today = new Date(),
): SafetyInspectionSchedule[] {
  const usersById = new Map(data.users.map((user) => [user.id, user]));

  const rows = data.sites.flatMap((site) => {
    const profile = parseSiteContractProfile(site);
    const storedSchedules =
      profile.contractDate && (profile.totalRounds ?? 0) > 0
        ? generateSchedulesForSite(site, data.users)
        : parseSiteInspectionSchedules(site);
    const defaultAssigneeUserId =
      site.assigned_user?.id || site.assigned_users?.[0]?.id || '';
    const headquarterName = site.headquarter_detail?.name || site.headquarter?.name || '';

    return storedSchedules.map((schedule) => {
      const assigneeUserId = schedule.assigneeUserId || defaultAssigneeUserId;
      return {
        ...schedule,
        assigneeName:
          usersById.get(assigneeUserId)?.name ||
          schedule.assigneeName ||
          site.assigned_user?.name ||
          site.assigned_users?.[0]?.name ||
          '',
        assigneeUserId,
        headquarterId: site.headquarter_id,
        headquarterName,
        isConflicted: false,
        isOutOfWindow: isDateOutsideWindow(
          schedule.plannedDate,
          schedule.windowStart,
          schedule.windowEnd,
        ),
        isOverdue: isDateOverdue(schedule.plannedDate, today, schedule.status),
        siteId: site.id,
        siteName: site.site_name,
      };
    });
  });

  const conflictCountByKey = rows.reduce((accumulator, row) => {
    if (!row.assigneeUserId || !row.plannedDate) return accumulator;
    const key = `${row.assigneeUserId}:${row.plannedDate}`;
    accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
    return accumulator;
  }, new Map<string, number>());

  return rows.map((row) => ({
    ...row,
    isConflicted:
      Boolean(row.assigneeUserId && row.plannedDate) &&
      (conflictCountByKey.get(`${row.assigneeUserId}:${row.plannedDate}`) ?? 0) > 1,
  }));
}

function buildScheduleQueryText(row: SafetyInspectionSchedule) {
  return [row.siteName, row.headquarterName, row.assigneeName]
    .join(' ')
    .toLowerCase();
}

function matchesScheduleQuery(row: SafetyInspectionSchedule, query: string) {
  const normalizedQuery = normalizeText(query).toLowerCase();
  if (!normalizedQuery) return true;
  return buildScheduleQueryText(row).includes(normalizedQuery);
}

function getScheduleMonthToken(row: SafetyInspectionSchedule) {
  return (row.plannedDate || row.windowStart).slice(0, 7);
}

function overlapsMonthWindow(
  row: SafetyInspectionSchedule,
  monthWindow: ReturnType<typeof getMonthWindow>,
) {
  const windowStart = parseDateValue(row.windowStart);
  const windowEnd = parseDateValue(row.windowEnd || row.windowStart);
  if (!windowStart || !windowEnd) {
    return getScheduleMonthToken(row) === monthWindow.token;
  }

  return !(
    windowEnd.getTime() < monthWindow.start.getTime() ||
    windowStart.getTime() > monthWindow.end.getTime()
  );
}

function matchesCommonScheduleFilters(
  row: SafetyInspectionSchedule,
  options?: {
    assigneeUserId?: string;
    plannedDate?: string;
    query?: string;
    siteId?: string;
    status?: string;
  },
) {
  if (options?.siteId && row.siteId !== options.siteId) return false;
  if (options?.assigneeUserId && row.assigneeUserId !== options.assigneeUserId) return false;
  if (options?.plannedDate && row.plannedDate !== options.plannedDate) return false;
  if (options?.status && row.status !== options.status) return false;
  return matchesScheduleQuery(row, options?.query || '');
}

function sortCalendarScheduleRows(rows: SafetyInspectionSchedule[]) {
  return [...rows].sort(
    (left, right) =>
      left.plannedDate.localeCompare(right.plannedDate) ||
      left.assigneeName.localeCompare(right.assigneeName, 'ko') ||
      left.siteName.localeCompare(right.siteName, 'ko') ||
      left.roundNo - right.roundNo,
  );
}

function sortQueueScheduleRows(rows: SafetyInspectionSchedule[]) {
  return [...rows].sort(
    (left, right) =>
      left.windowStart.localeCompare(right.windowStart) ||
      left.roundNo - right.roundNo ||
      left.siteName.localeCompare(right.siteName, 'ko'),
  );
}

export function buildAvailableScheduleMonths(rows: SafetyInspectionSchedule[]) {
  return Array.from(
    new Set(
      rows
        .map((row) => getScheduleMonthToken(row))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function buildAdminScheduleRows(
  data: ControllerDashboardData,
  today = new Date(),
) {
  return buildBaseScheduleRows(data, today);
}

export function buildAdminCalendarSchedules(
  rows: SafetyInspectionSchedule[],
  options?: {
    assigneeUserId?: string;
    month?: string;
    plannedDate?: string;
    query?: string;
    siteId?: string;
    status?: string;
  },
  today = new Date(),
) {
  const includeAllMonths = options?.month === 'all';
  const monthWindow = getMonthWindow(options?.month || '', today);

  return sortCalendarScheduleRows(
    rows.filter((row) => {
      if (!row.plannedDate) return false;
      if (!matchesCommonScheduleFilters(row, options)) return false;
      if (!includeAllMonths && row.plannedDate.slice(0, 7) !== monthWindow.token) {
        return false;
      }
      return true;
    }),
  );
}

export function buildAdminQueueSchedules(
  rows: SafetyInspectionSchedule[],
  options?: {
    assigneeUserId?: string;
    month?: string;
    plannedDate?: string;
    query?: string;
    siteId?: string;
    status?: string;
  },
  today = new Date(),
) {
  const includeAllMonths = options?.month === 'all';
  const monthWindow = getMonthWindow(options?.month || '', today);

  return sortQueueScheduleRows(
    rows.filter((row) => {
      if (row.plannedDate) return false;
      if (!matchesCommonScheduleFilters(row, options)) return false;
      if (!includeAllMonths && !overlapsMonthWindow(row, monthWindow)) {
        return false;
      }
      return true;
    }),
  );
}

function buildCompletionRows(
  data: ControllerDashboardData,
  schedules: SafetyInspectionSchedule[],
): SafetyAdminDataCompletionRow[] {
  const schedulesBySiteId = schedules.reduce((accumulator, schedule) => {
    if (!accumulator.has(schedule.siteId)) {
      accumulator.set(schedule.siteId, []);
    }
    accumulator.get(schedule.siteId)?.push(schedule);
    return accumulator;
  }, new Map<string, SafetyInspectionSchedule[]>());

  return data.sites
    .map((site) => {
      const profile = parseSiteContractProfile(site);
      const revenueProfile = resolveSiteRevenueProfile(profile);
      const missingItems: string[] = [];

      if (!profile.contractDate) missingItems.push('계약일');
      if (!profile.contractType) missingItems.push('계약유형');
      if (!profile.contractStatus) missingItems.push('계약상태');
      if (profile.totalRounds == null) missingItems.push('총 회차');
      if (profile.totalContractAmount == null) missingItems.push('총 계약금액');
      if (profile.perVisitAmount == null && !revenueProfile.isRevenueReady) {
        missingItems.push('회차당 단가');
      }
      if (!site.assigned_user?.id && !(site.assigned_users || []).length) {
        missingItems.push('담당자');
      }
      if (profile.contractDate && profile.totalRounds && !(schedulesBySiteId.get(site.id)?.length)) {
        missingItems.push('방문 일정');
      }

      return {
        href: getAdminSectionHref('headquarters', {
          headquarterId: site.headquarter_id,
          siteId: site.id,
        }),
        headquarterName: site.headquarter_detail?.name || site.headquarter?.name || '-',
        missingItems,
        siteId: site.id,
        siteName: site.site_name,
      };
    })
    .filter((row) => row.missingItems.length > 0)
    .sort((left, right) => right.missingItems.length - left.missingItems.length);
}

function buildAlerts(
  reportRows: ControllerReportRow[],
  schedules: SafetyInspectionSchedule[],
  completionRows: SafetyAdminDataCompletionRow[],
  today = new Date(),
): SafetyAdminAlert[] {
  const alerts: SafetyAdminAlert[] = [];

  reportRows.forEach((row) => {
    if (row.reportType === 'quarterly_report' && row.dispatchStatus === 'overdue') {
      alerts.push({
        createdAt: row.deadlineDate || row.updatedAt,
        description: `${row.siteName} / ${row.reportTitle || row.periodLabel || row.reportKey}`,
        href: getAdminSectionHref('reports', { siteId: row.siteId, dispatchStatus: 'overdue' }),
        id: `report-overdue:${row.reportKey}`,
        reportKey: row.reportKey,
        scheduleId: '',
        severity: 'danger',
        siteId: row.siteId,
        title: '분기 발송 지연',
        type: 'quarterly_dispatch_overdue',
      });
    }

    if (row.reportType === 'quarterly_report' && row.dispatchStatus !== 'sent') {
      const deadline = parseDateValue(row.deadlineDate);
      if (deadline) {
        const diff = Math.floor((deadline.getTime() - today.getTime()) / DAY_IN_MS);
        if (diff >= 0 && diff <= 7) {
          alerts.push({
            createdAt: row.deadlineDate,
            description: `${row.siteName} / 마감 ${row.deadlineDate}`,
            href: getAdminSectionHref('reports', { siteId: row.siteId }),
            id: `report-deadline:${row.reportKey}`,
            reportKey: row.reportKey,
            scheduleId: '',
            severity: diff <= 1 ? 'warning' : 'info',
            siteId: row.siteId,
            title: '분기 마감 예정',
            type: 'quarterly_deadline',
          });
        }
      }
    }

    if (row.qualityStatus !== 'ok') {
      alerts.push({
        createdAt: row.updatedAt,
        description: `${row.siteName} / ${row.reportTitle || row.periodLabel || row.reportKey}`,
        href: getAdminSectionHref('reports', { reportType: row.reportType, siteId: row.siteId }),
        id: `report-review:${row.reportKey}`,
        reportKey: row.reportKey,
        scheduleId: '',
        severity: row.qualityStatus === 'issue' ? 'warning' : 'info',
        siteId: row.siteId,
        title: '품질 체크 필요',
        type: 'quality_review_pending',
      });
    }
  });

  schedules.forEach((schedule) => {
    if (schedule.isConflicted) {
      alerts.push({
        createdAt: schedule.plannedDate,
        description: `${schedule.siteName} / ${schedule.assigneeName || '담당자 미지정'}`,
        href: getAdminSectionHref('schedules', {
          month: schedule.plannedDate.slice(0, 7),
          siteId: schedule.siteId,
        }),
        id: `schedule-conflict:${schedule.id}`,
        reportKey: '',
        scheduleId: schedule.id,
        severity: 'warning',
        siteId: schedule.siteId,
        title: '일정 충돌',
        type: 'schedule_conflict',
      });
    }

    if (schedule.isOutOfWindow) {
      alerts.push({
        createdAt: schedule.plannedDate,
        description: `${schedule.siteName} / 허용구간 ${schedule.windowStart} ~ ${schedule.windowEnd}`,
        href: getAdminSectionHref('schedules', {
          month: schedule.plannedDate.slice(0, 7),
          siteId: schedule.siteId,
        }),
        id: `schedule-window:${schedule.id}`,
        reportKey: '',
        scheduleId: schedule.id,
        severity: 'danger',
        siteId: schedule.siteId,
        title: '구간 밖 일정',
        type: 'schedule_out_of_window',
      });
    }
  });

  completionRows.forEach((row) => {
    if (row.missingItems.includes('계약일')) {
      alerts.push({
        createdAt: '',
        description: `${row.siteName} / ${row.missingItems.join(', ')}`,
        href: row.href,
        id: `completion-contract:${row.siteId}`,
        reportKey: '',
        scheduleId: '',
        severity: 'warning',
        siteId: row.siteId,
        title: '계약정보 누락',
        type: 'contract_missing',
      });
    }

    if (row.missingItems.includes('담당자')) {
      alerts.push({
        createdAt: '',
        description: `${row.siteName} / 담당자 미배정`,
        href: row.href,
        id: `completion-assignee:${row.siteId}`,
        reportKey: '',
        scheduleId: '',
        severity: 'danger',
        siteId: row.siteId,
        title: '담당자 누락',
        type: 'assignment_missing',
      });
    }
  });

  return alerts.sort((left, right) => {
    const severityWeight = (value: SafetyAdminAlert['severity']) =>
      value === 'danger' ? 0 : value === 'warning' ? 1 : 2;
    return severityWeight(left.severity) - severityWeight(right.severity);
  });
}

export function buildAdminSchedules(
  data: ControllerDashboardData,
  options?: {
    assigneeUserId?: string;
    month?: string;
    plannedDate?: string;
    query?: string;
    siteId?: string;
    status?: string;
  },
  today = new Date(),
) {
  const schedules = buildAdminScheduleRows(data, today);
  const includeAllMonths = options?.month === 'all';
  const monthWindow = getMonthWindow(options?.month || '', today);

  return schedules
    .filter((row) => {
      if (!matchesCommonScheduleFilters(row, options)) return false;
      if (!includeAllMonths && row.plannedDate) {
        if (row.plannedDate < formatDateValue(monthWindow.start)) return false;
        if (row.plannedDate > formatDateValue(monthWindow.end)) return false;
      }
      return true;
    })
    .sort((left, right) => {
      const dateCompare = (left.plannedDate || '').localeCompare(right.plannedDate || '');
      if (dateCompare !== 0) return dateCompare;

      const roundCompare = left.roundNo - right.roundNo;
      if (roundCompare !== 0) return roundCompare;

      return left.siteName.localeCompare(right.siteName, 'ko');
    });
}

export function buildAdminOverviewResponse(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  materialSourceReports: SafetyReport[] = [],
  today = new Date(),
): SafetyAdminOverviewResponse {
  const overview = buildAdminOverviewModel(data, reports, materialSourceReports, today);
  const reportRows = buildControllerReportRows(reports, data.sites, data.users);
  const schedules = buildAdminSchedules(data, undefined, today)
    .filter((row) => row.isConflicted || row.isOutOfWindow || row.isOverdue)
    .slice(0, 8);
  const completionRows = buildCompletionRows(data, buildAdminSchedules(data, undefined, today));
  const alerts = buildAlerts(reportRows, buildAdminSchedules(data, undefined, today), completionRows, today);

  return {
    ...overview,
    alerts,
    completionRows,
    scheduleRows: schedules,
  };
}

export function buildAdminAnalyticsResponse(
  data: ControllerDashboardData,
  reports: SafetyReportListItem[],
  filters: {
    contractType?: string;
    headquarterId?: string;
    period?: string;
    query?: string;
    userId?: string;
  },
  today = new Date(),
): SafetyAdminAnalyticsResponse {
  return buildAdminAnalyticsModel(data, reports, {
    contractType: filters.contractType || '',
    headquarterId: filters.headquarterId || '',
    period: (filters.period as AdminAnalyticsPeriod) || 'month',
    query: filters.query || '',
    userId: filters.userId || '',
  }, today);
}

export function generateSchedulesForSite(site: SafetySite, users: SafetyUser[]) {
  const contractProfile = parseSiteContractProfile(site);
  const contractDate = normalizeText(contractProfile.contractDate);
  const totalRounds = contractProfile.totalRounds ?? 0;

  if (!contractDate || totalRounds <= 0) {
    throw new Error('계약일과 총 회차가 설정된 현장만 일정 자동생성이 가능합니다.');
  }

  const existingByRound = new Map(
    parseSiteInspectionSchedules(site).map((schedule) => [schedule.roundNo, schedule]),
  );
  const defaultAssigneeUserId =
    site.assigned_user?.id || site.assigned_users?.[0]?.id || '';
  const defaultAssigneeName =
    users.find((user) => user.id === defaultAssigneeUserId)?.name ||
    site.assigned_user?.name ||
    site.assigned_users?.[0]?.name ||
    '';
  const headquarterName = site.headquarter_detail?.name || site.headquarter?.name || '';
  const contractWindowStart =
    normalizeText(site.contract_start_date) ||
    normalizeText(contractProfile.contractDate) ||
    normalizeText(site.contract_date);
  let contractWindowEnd =
    normalizeText(site.contract_end_date) ||
    normalizeText(site.project_end_date) ||
    contractWindowStart;
  if (contractWindowStart && contractWindowEnd && contractWindowEnd < contractWindowStart) {
    contractWindowEnd = contractWindowStart;
  }

  const nextSchedules: SafetyInspectionSchedule[] = [];

  for (let roundNo = 1; roundNo <= totalRounds; roundNo += 1) {
    const windowStart = contractWindowStart;
    const windowEnd = contractWindowEnd;
    const existing = existingByRound.get(roundNo);

    nextSchedules.push({
      actualVisitDate: existing?.actualVisitDate || '',
      assigneeName: existing?.assigneeName || defaultAssigneeName,
      assigneeUserId: existing?.assigneeUserId || defaultAssigneeUserId,
      exceptionMemo: existing?.exceptionMemo || '',
      exceptionReasonCode: existing?.exceptionReasonCode || '',
      headquarterId: site.headquarter_id,
      headquarterName,
      id: existing?.id || `schedule:${site.id}:${roundNo}`,
      isConflicted: false,
      isOutOfWindow: false,
      isOverdue: false,
      linkedReportKey: existing?.linkedReportKey || '',
      plannedDate: existing?.plannedDate || '',
      roundNo,
      totalRounds,
      selectionConfirmedAt: existing?.selectionConfirmedAt || '',
      selectionConfirmedByName: existing?.selectionConfirmedByName || '',
      selectionConfirmedByUserId: existing?.selectionConfirmedByUserId || '',
      selectionReasonLabel: existing?.selectionReasonLabel || '',
      selectionReasonMemo: existing?.selectionReasonMemo || '',
      siteId: site.id,
      siteName: site.site_name,
      status: existing?.status || 'planned',
      windowEnd,
      windowStart,
    });
  }

  return nextSchedules;
}

export function updateSiteSchedules(
  site: SafetySite,
  nextSchedules: SafetyInspectionSchedule[],
) {
  return buildSiteMemoWithContractProfile(
    parseSiteMemoNote(site.memo),
    parseSiteContractProfile(site),
    {
      existingMemo: site.memo,
      schedules: nextSchedules,
    },
  );
}

export function updateSingleSchedule(
  data: ControllerDashboardData,
  scheduleId: string,
  payload: Partial<SafetyInspectionSchedule>,
  options?: {
    actorUserId?: string;
    actorUserName?: string;
  },
) {
  for (const site of data.sites) {
    const profile = parseSiteContractProfile(site);
    const schedules =
      profile.contractDate && (profile.totalRounds ?? 0) > 0
        ? generateSchedulesForSite(site, data.users)
        : parseSiteInspectionSchedules(site);
    const index = schedules.findIndex((schedule) => schedule.id === scheduleId);
    if (index < 0) continue;

    const current = schedules[index];
    const nextPlannedDate = payload.plannedDate ?? current.plannedDate;
    const nextAssigneeUserId = payload.assigneeUserId ?? current.assigneeUserId;
    const scheduleChanged =
      nextPlannedDate !== current.plannedDate ||
      nextAssigneeUserId !== current.assigneeUserId ||
      (payload.status ?? current.status) !== current.status ||
      (payload.selectionReasonLabel ?? current.selectionReasonLabel) !==
        current.selectionReasonLabel ||
      (payload.selectionReasonMemo ?? current.selectionReasonMemo) !==
        current.selectionReasonMemo ||
      (payload.exceptionReasonCode ?? current.exceptionReasonCode) !==
        current.exceptionReasonCode ||
      (payload.exceptionMemo ?? current.exceptionMemo) !== current.exceptionMemo;
    const stampedAt = new Date().toISOString();
    const nextSchedule: SafetyInspectionSchedule = {
      ...current,
      ...payload,
      assigneeName: payload.assigneeName ?? current.assigneeName,
      assigneeUserId: nextAssigneeUserId,
      exceptionMemo: payload.exceptionMemo ?? current.exceptionMemo,
      exceptionReasonCode: payload.exceptionReasonCode ?? current.exceptionReasonCode,
      linkedReportKey: payload.linkedReportKey ?? current.linkedReportKey,
      plannedDate: nextPlannedDate,
      status: payload.status ?? current.status,
      selectionConfirmedAt:
        payload.selectionConfirmedAt ??
        (scheduleChanged ? stampedAt : current.selectionConfirmedAt),
      selectionConfirmedByName:
        payload.selectionConfirmedByName ??
        (scheduleChanged
          ? options?.actorUserName ?? current.selectionConfirmedByName
          : current.selectionConfirmedByName),
      selectionConfirmedByUserId:
        payload.selectionConfirmedByUserId ??
        (scheduleChanged
          ? options?.actorUserId ?? current.selectionConfirmedByUserId
          : current.selectionConfirmedByUserId),
      selectionReasonLabel: payload.selectionReasonLabel ?? current.selectionReasonLabel,
      selectionReasonMemo: payload.selectionReasonMemo ?? current.selectionReasonMemo,
    };

    schedules[index] = nextSchedule;
    return {
      memo: updateSiteSchedules(site, schedules),
      previousSchedule: current,
      schedule: nextSchedule,
      site,
    };
  }

  throw new Error('수정할 일정을 찾지 못했습니다.');
}
