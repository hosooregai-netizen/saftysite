import type { SafetyInspectionSchedule } from '@/types/admin';
import type { SafetySite } from '@/types/backend';
import type { InspectionReportListItem, InspectionSession } from '@/types/inspectionSession';

export interface ScheduleReportContractWindow {
  windowEnd: string;
  windowStart: string;
}

export interface ScheduleReportScheduleUpdate {
  actualVisitDate: string;
  linkedReportKey: string;
  plannedDate: string;
  roundNo: number;
  scheduleId: string;
}

export interface ScheduleReportReportUpdate {
  reportKey: string;
  reportTitle: string;
  scheduleId: string;
  scheduleRoundNo: number;
  visitDate: string;
  visitRound: number;
}

export type ScheduleReportSyncPlan =
  | {
      ok: true;
      reportUpdates: ScheduleReportReportUpdate[];
      scheduleUpdates: ScheduleReportScheduleUpdate[];
    }
  | {
      code:
        | 'contract-window-missing'
        | 'contract-window-out-of-range'
        | 'dispatch-completed-locked'
        | 'missing-schedule-capacity';
      message: string;
      ok: false;
    };

export interface BuildScheduleReportSyncPlanInput {
  buildReportTitle: (reportDate: string, reportNumber: number) => string;
  changedReport?: {
    reportKey: string;
    visitDate: string;
  } | null;
  changedSchedule?: {
    actualVisitDate?: string | null;
    linkedReportKey?: string | null;
    plannedDate: string;
    scheduleId: string;
  } | null;
  contractWindow: ScheduleReportContractWindow | null | undefined;
  reports: InspectionReportListItem[];
  schedules: SafetyInspectionSchedule[];
}

interface SyncEntry {
  canUpdateReport: boolean;
  date: string;
  dispatchCompleted: boolean;
  originalDate: string;
  originalRoundNo: number;
  originalScheduleId: string;
  reportKey: string;
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRoundNo(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : 0;
}

function isWritableReport(
  report: InspectionReportListItem | null | undefined,
  reportKey = normalizeText(report?.reportKey),
) {
  return Boolean(
    report &&
      reportKey &&
      !report.readOnly &&
      report.reportOpenMode !== 'original_pdf' &&
      !reportKey.startsWith('legacy:'),
  );
}

function isWithinWindow(value: string, window: ScheduleReportContractWindow) {
  return Boolean(
    value &&
      window.windowStart &&
      window.windowEnd &&
      value >= window.windowStart &&
      value <= window.windowEnd,
  );
}

export function buildContractWindowFromSafetySite(
  site: Pick<
    SafetySite,
    | 'contract_date'
    | 'contract_end_date'
    | 'contract_signed_date'
    | 'contract_start_date'
    | 'project_end_date'
    | 'project_start_date'
  > | null | undefined,
): ScheduleReportContractWindow {
  const windowStart =
    normalizeText(site?.contract_start_date) ||
    normalizeText(site?.contract_date) ||
    normalizeText(site?.contract_signed_date) ||
    normalizeText(site?.project_start_date);
  let windowEnd =
    normalizeText(site?.contract_end_date) ||
    normalizeText(site?.project_end_date) ||
    windowStart;

  if (windowStart && windowEnd && windowEnd < windowStart) {
    windowEnd = windowStart;
  }

  return { windowEnd, windowStart };
}

export function buildContractWindowFromScheduleRows(
  schedules: Array<Pick<SafetyInspectionSchedule, 'windowEnd' | 'windowStart'>>,
): ScheduleReportContractWindow {
  const windows = schedules
    .map((schedule) => ({
      windowEnd: normalizeText(schedule.windowEnd),
      windowStart: normalizeText(schedule.windowStart),
    }))
    .filter((window) => window.windowStart && window.windowEnd);

  if (windows.length === 0) {
    return { windowEnd: '', windowStart: '' };
  }

  return {
    windowEnd: windows.reduce((max, window) => (
      window.windowEnd > max ? window.windowEnd : max
    ), windows[0].windowEnd),
    windowStart: windows.reduce((min, window) => (
      window.windowStart < min ? window.windowStart : min
    ), windows[0].windowStart),
  };
}

export function resolveContractWindow(
  primary: ScheduleReportContractWindow | null | undefined,
  fallback: ScheduleReportContractWindow | null | undefined,
): ScheduleReportContractWindow {
  const windowStart = normalizeText(primary?.windowStart) || normalizeText(fallback?.windowStart);
  let windowEnd = normalizeText(primary?.windowEnd) || normalizeText(fallback?.windowEnd);

  if (windowStart && windowEnd && windowEnd < windowStart) {
    windowEnd = windowStart;
  }

  return { windowEnd, windowStart };
}

function getReportPriorityScore(item: InspectionReportListItem) {
  let score = 0;
  if (item.status === 'published') score += 40;
  else if (item.status === 'submitted') score += 30;
  else if (item.status === 'draft') score += 20;
  if (item.publishedAt) score += 10;
  else if (item.submittedAt) score += 8;
  if (item.visitDate) score += 4;
  if (item.lastAutosavedAt) score += 2;
  return score;
}

function preferReport(
  current: InspectionReportListItem | null | undefined,
  next: InspectionReportListItem | null | undefined,
) {
  if (!next) return current ?? null;
  if (!current) return next;
  return getReportPriorityScore(next) >= getReportPriorityScore(current) ? next : current;
}

function indexReports(reports: InspectionReportListItem[]) {
  const byKey = new Map<string, InspectionReportListItem>();
  const byRound = new Map<number, InspectionReportListItem>();
  const byScheduleId = new Map<string, InspectionReportListItem>();

  reports.forEach((report) => {
    const reportKey = normalizeText(report.reportKey);
    if (reportKey) {
      byKey.set(reportKey, preferReport(byKey.get(reportKey), report) ?? report);
    }

    const scheduleId = normalizeText(report.scheduleId);
    if (scheduleId) {
      byScheduleId.set(scheduleId, preferReport(byScheduleId.get(scheduleId), report) ?? report);
    }

    const roundNo = normalizeRoundNo(report.visitRound);
    if (roundNo > 0) {
      byRound.set(roundNo, preferReport(byRound.get(roundNo), report) ?? report);
    }
  });

  return { byKey, byRound, byScheduleId };
}

function buildScheduleEntries(input: BuildScheduleReportSyncPlanInput): SyncEntry[] {
  const changedScheduleId = normalizeText(input.changedSchedule?.scheduleId);
  const changedReportKey = normalizeText(input.changedReport?.reportKey);
  const indexedReports = indexReports(input.reports);
  const usedReportKeys = new Set<string>();
  const entries: SyncEntry[] = [];

  input.schedules.forEach((schedule) => {
    const isChangedSchedule = schedule.id === changedScheduleId;
    const scheduleLinkedReportKey = isChangedSchedule
      ? normalizeText(input.changedSchedule?.linkedReportKey) || normalizeText(schedule.linkedReportKey)
      : normalizeText(schedule.linkedReportKey);
    const linkedReport = scheduleLinkedReportKey
      ? indexedReports.byKey.get(scheduleLinkedReportKey) ?? null
      : null;
    const report = scheduleLinkedReportKey
      ? linkedReport
      : indexedReports.byScheduleId.get(schedule.id) ??
        indexedReports.byRound.get(schedule.roundNo) ??
        null;
    const reportKey = normalizeText(report?.reportKey) || scheduleLinkedReportKey;
    const isChangedReport = Boolean(reportKey && reportKey === changedReportKey);
    const date = isChangedReport
      ? normalizeText(input.changedReport?.visitDate)
      : isChangedSchedule
        ? normalizeText(input.changedSchedule?.plannedDate)
        : normalizeText(report?.visitDate) ||
          normalizeText(schedule.actualVisitDate) ||
          normalizeText(schedule.plannedDate);

    if (!date && !reportKey) {
      return;
    }

    if (reportKey) {
      usedReportKeys.add(reportKey);
    }

    entries.push({
      canUpdateReport: isWritableReport(report, reportKey),
      date,
      dispatchCompleted: Boolean(report?.dispatchCompleted),
      originalDate:
        normalizeText(report?.visitDate) ||
        normalizeText(schedule.actualVisitDate) ||
        normalizeText(schedule.plannedDate),
      originalRoundNo: normalizeRoundNo(report?.visitRound) || schedule.roundNo,
      originalScheduleId: normalizeText(report?.scheduleId) || schedule.id,
      reportKey,
    });
  });

  input.reports.forEach((report) => {
    const reportKey = normalizeText(report.reportKey);
    if (!reportKey || usedReportKeys.has(reportKey)) {
      return;
    }

    const matchingSchedule =
      (report.scheduleId ? input.schedules.find((schedule) => schedule.id === report.scheduleId) : null) ??
      input.schedules.find((schedule) => schedule.roundNo === normalizeRoundNo(report.visitRound)) ??
      null;
    const matchingScheduleLinkedReportKey = normalizeText(matchingSchedule?.linkedReportKey);
    if (matchingScheduleLinkedReportKey && matchingScheduleLinkedReportKey !== reportKey) {
      return;
    }
    const isChangedReport = reportKey === changedReportKey;
    const date = isChangedReport
      ? normalizeText(input.changedReport?.visitDate)
      : normalizeText(report.visitDate) ||
        normalizeText(matchingSchedule?.actualVisitDate) ||
        normalizeText(matchingSchedule?.plannedDate);

    if (!date) {
      return;
    }

    entries.push({
      canUpdateReport: isWritableReport(report, reportKey),
      date,
      dispatchCompleted: Boolean(report.dispatchCompleted),
      originalDate: normalizeText(report.visitDate),
      originalRoundNo: normalizeRoundNo(report.visitRound) || matchingSchedule?.roundNo || 0,
      originalScheduleId: normalizeText(report.scheduleId) || matchingSchedule?.id || '',
      reportKey,
    });
  });

  return entries;
}

function hasScheduleChanged(
  schedule: SafetyInspectionSchedule,
  desired: Pick<ScheduleReportScheduleUpdate, 'actualVisitDate' | 'linkedReportKey' | 'plannedDate'>,
) {
  return (
    normalizeText(schedule.actualVisitDate) !== desired.actualVisitDate ||
    normalizeText(schedule.linkedReportKey) !== desired.linkedReportKey ||
    normalizeText(schedule.plannedDate) !== desired.plannedDate
  );
}

function buildChangedScheduleOnlyPlan(
  input: BuildScheduleReportSyncPlanInput,
  schedules: SafetyInspectionSchedule[],
  contractWindow: ScheduleReportContractWindow,
): ScheduleReportSyncPlan | null {
  const changedSchedule = input.changedSchedule;
  if (!changedSchedule) return null;

  const schedule = schedules.find((row) => row.id === changedSchedule.scheduleId) ?? null;
  if (!schedule) {
    return {
      ok: true,
      reportUpdates: [],
      scheduleUpdates: [],
    };
  }

  const plannedDate = normalizeText(changedSchedule.plannedDate);
  if (plannedDate && !isWithinWindow(plannedDate, contractWindow)) {
    return {
      code: 'contract-window-out-of-range',
      message: `${plannedDate}? 怨꾩빟湲곌컙 ${contractWindow.windowStart} ~ ${contractWindow.windowEnd} 諛뽰엯?덈떎.`,
      ok: false,
    };
  }

  const indexedReports = indexReports(input.reports);
  const changedLinkedReportKey =
    normalizeText(changedSchedule.linkedReportKey) || normalizeText(schedule.linkedReportKey);
  const linkedReport = changedLinkedReportKey
    ? indexedReports.byKey.get(changedLinkedReportKey) ?? null
    : null;
  const scheduleReport = changedLinkedReportKey
    ? null
    : indexedReports.byScheduleId.get(schedule.id) ?? null;
  const roundReport = changedLinkedReportKey
    ? null
    : indexedReports.byRound.get(schedule.roundNo) ?? null;
  const report = linkedReport ?? scheduleReport ?? roundReport;
  const reportKey = normalizeText(report?.reportKey) || changedLinkedReportKey;
  const originalDate =
    normalizeText(report?.visitDate) ||
    normalizeText(schedule.actualVisitDate) ||
    normalizeText(schedule.plannedDate);

  if (report?.dispatchCompleted && originalDate && originalDate !== plannedDate) {
    return {
      code: 'dispatch-completed-locked',
      message: `諛쒖넚?꾨즺 蹂닿퀬??${schedule.roundNo}?뚯감???좎쭨???먮룞 ?ъ젙?щ줈 ?대룞?????놁뒿?덈떎.`,
      ok: false,
    };
  }

  const desiredSchedule: ScheduleReportScheduleUpdate = {
    actualVisitDate:
      normalizeText(changedSchedule.actualVisitDate) || normalizeText(schedule.actualVisitDate),
    linkedReportKey: reportKey,
    plannedDate,
    roundNo: schedule.roundNo,
    scheduleId: schedule.id,
  };
  const scheduleUpdates = hasScheduleChanged(schedule, desiredSchedule)
    ? [desiredSchedule]
    : [];
  const shouldUpdateReport =
    Boolean(
      reportKey &&
        report &&
        isWritableReport(report, reportKey) &&
        !report.dispatchCompleted &&
        plannedDate,
    ) &&
    (normalizeText(report?.visitDate) !== plannedDate ||
      normalizeRoundNo(report?.visitRound) !== schedule.roundNo ||
      normalizeText(report?.scheduleId) !== schedule.id);

  return {
    ok: true,
    reportUpdates: shouldUpdateReport
      ? [
          {
            reportKey,
            reportTitle: input.buildReportTitle(plannedDate, schedule.roundNo),
            scheduleId: schedule.id,
            scheduleRoundNo: schedule.roundNo,
            visitDate: plannedDate,
            visitRound: schedule.roundNo,
          },
        ]
      : [],
    scheduleUpdates,
  };
}

export function buildScheduleReportSyncPlan(
  input: BuildScheduleReportSyncPlanInput,
): ScheduleReportSyncPlan {
  const contractWindow = input.contractWindow ?? null;
  if (!contractWindow?.windowStart || !contractWindow.windowEnd) {
    return {
      code: 'contract-window-missing',
      message: '현장 계약기간이 설정되어 있지 않아 방문일을 저장할 수 없습니다.',
      ok: false,
    };
  }

  const schedules = [...input.schedules]
    .filter((schedule) => schedule.id && schedule.roundNo > 0)
    .sort((left, right) => left.roundNo - right.roundNo || left.id.localeCompare(right.id));
  const changedScheduleOnlyPlan = buildChangedScheduleOnlyPlan(input, schedules, contractWindow);
  if (changedScheduleOnlyPlan) {
    return changedScheduleOnlyPlan;
  }
  const entries = buildScheduleEntries(input)
    .filter((entry) => entry.date)
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.originalRoundNo - right.originalRoundNo ||
        left.originalScheduleId.localeCompare(right.originalScheduleId) ||
        left.reportKey.localeCompare(right.reportKey),
    );

  if (entries.length > schedules.length) {
    return {
      code: 'missing-schedule-capacity',
      message: '일정 회차보다 연결할 보고서/방문일이 많아 자동 정렬할 수 없습니다.',
      ok: false,
    };
  }

  const desiredByScheduleId = new Map<string, ScheduleReportScheduleUpdate>();
  const sourceScheduleIdsToClear = new Set<string>();
  const reportUpdates: ScheduleReportReportUpdate[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const targetSchedule = schedules[index];
    if (entry.reportKey && entry.originalScheduleId) {
      sourceScheduleIdsToClear.add(entry.originalScheduleId);
    }

    if (!isWithinWindow(entry.date, contractWindow)) {
      return {
        code: 'contract-window-out-of-range',
        message: `${entry.date}은 계약기간 ${contractWindow.windowStart} ~ ${contractWindow.windowEnd} 밖입니다.`,
        ok: false,
      };
    }

    const reportMoved =
      entry.reportKey &&
      (entry.originalRoundNo !== targetSchedule.roundNo ||
        (entry.originalScheduleId && entry.originalScheduleId !== targetSchedule.id));
    const reportDateChanged = entry.reportKey && entry.originalDate && entry.originalDate !== entry.date;
    if (entry.dispatchCompleted && (reportMoved || reportDateChanged)) {
      return {
        code: 'dispatch-completed-locked',
        message: `발송완료 보고서 ${entry.originalRoundNo || targetSchedule.roundNo}회차는 날짜순 자동 재정렬로 이동할 수 없습니다.`,
        ok: false,
      };
    }

    desiredByScheduleId.set(targetSchedule.id, {
      actualVisitDate: entry.date,
      linkedReportKey: entry.reportKey,
      plannedDate: entry.date,
      roundNo: targetSchedule.roundNo,
      scheduleId: targetSchedule.id,
    });

    if (entry.reportKey && entry.canUpdateReport && !entry.dispatchCompleted) {
      reportUpdates.push({
        reportKey: entry.reportKey,
        reportTitle: input.buildReportTitle(entry.date, targetSchedule.roundNo),
        scheduleId: targetSchedule.id,
        scheduleRoundNo: targetSchedule.roundNo,
        visitDate: entry.date,
        visitRound: targetSchedule.roundNo,
      });
    }
  }

  const scheduleUpdates = schedules.flatMap((schedule) => {
    const desired = desiredByScheduleId.get(schedule.id);
    if (!desired && !sourceScheduleIdsToClear.has(schedule.id)) {
      return [];
    }
    const nextDesired =
      desired ?? {
        actualVisitDate: '',
        linkedReportKey: '',
        plannedDate: '',
        roundNo: schedule.roundNo,
        scheduleId: schedule.id,
      };

    return hasScheduleChanged(schedule, nextDesired) ? [nextDesired] : [];
  });

  return {
    ok: true,
    reportUpdates,
    scheduleUpdates,
  };
}

export function applyScheduleReportUpdateToSession(
  current: InspectionSession,
  update: ScheduleReportReportUpdate,
): InspectionSession {
  const previousGuidanceDate = normalizeText(current.document2Overview.guidanceDate);
  const previousReportDate = normalizeText(current.meta.reportDate);

  return {
    ...current,
    reportNumber: update.visitRound,
    scheduleId: update.scheduleId,
    scheduleRoundNo: update.scheduleRoundNo,
    meta: {
      ...current.meta,
      reportDate: update.visitDate,
      reportTitle: update.reportTitle,
    },
    document2Overview: {
      ...current.document2Overview,
      guidanceDate: update.visitDate,
      visitCount: String(update.visitRound),
    },
    document4FollowUps: current.document4FollowUps.map((item) => ({
      ...item,
      confirmationDate:
        !item.confirmationDate ||
        item.confirmationDate === previousGuidanceDate ||
        item.confirmationDate === previousReportDate
          ? update.visitDate
          : item.confirmationDate,
    })),
  };
}
