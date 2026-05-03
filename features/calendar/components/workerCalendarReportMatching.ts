import type { SafetyInspectionSchedule } from '@/types/admin';
import type { InspectionReportListItem } from '@/types/inspectionSession';

interface WorkerCalendarBackfillSite {
  headquarterId?: string;
  id: string;
  siteName: string;
  totalRounds?: number | null;
}

interface WorkerCalendarContractWindow {
  windowEnd: string;
  windowStart: string;
}

function normalizeText(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRoundNo(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : 0;
}

function getSiteRoundKey(siteId: string, roundNo: number) {
  return `${siteId}::${roundNo}`;
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

function setPreferredReport(
  map: Map<string, InspectionReportListItem>,
  key: string,
  row: InspectionReportListItem,
) {
  if (!key) return;
  const current = map.get(key) ?? null;
  if (!current || getReportPriorityScore(row) >= getReportPriorityScore(current)) {
    map.set(key, row);
  }
}

export interface WorkerCalendarReportLookup {
  byReportKey: Map<string, InspectionReportListItem>;
  byRound: Map<number, InspectionReportListItem>;
  byScheduleId: Map<string, InspectionReportListItem>;
}

export function buildWorkerCalendarReportLookup(
  rows: InspectionReportListItem[],
): WorkerCalendarReportLookup {
  const byReportKey = new Map<string, InspectionReportListItem>();
  const byRound = new Map<number, InspectionReportListItem>();
  const byScheduleId = new Map<string, InspectionReportListItem>();

  rows.forEach((row) => {
    setPreferredReport(byReportKey, normalizeText(row.reportKey), row);
    setPreferredReport(byScheduleId, normalizeText(row.scheduleId), row);
    if (
      typeof row.visitRound === 'number' &&
      Number.isFinite(row.visitRound) &&
      row.visitRound > 0
    ) {
      const roundNo = Math.trunc(row.visitRound);
      const current = byRound.get(roundNo) ?? null;
      if (!current || getReportPriorityScore(row) >= getReportPriorityScore(current)) {
        byRound.set(roundNo, row);
      }
    }
  });

  return { byReportKey, byRound, byScheduleId };
}

export function resolveWorkerCalendarReportForSchedule(
  schedule: Pick<SafetyInspectionSchedule, 'id' | 'linkedReportKey' | 'roundNo'>,
  lookup: WorkerCalendarReportLookup,
) {
  const linkedReportKey = normalizeText(schedule.linkedReportKey);
  if (linkedReportKey) {
    const linkedReport = lookup.byReportKey.get(linkedReportKey) ?? null;
    if (linkedReport) return linkedReport;
  }

  const scheduleReport = lookup.byScheduleId.get(normalizeText(schedule.id)) ?? null;
  if (scheduleReport) return scheduleReport;

  return lookup.byRound.get(schedule.roundNo) ?? null;
}

function createFallbackScheduleFromReport(input: {
  contractWindow: WorkerCalendarContractWindow | null;
  report: InspectionReportListItem;
  roundNo: number;
  scheduleId: string;
  site: WorkerCalendarBackfillSite;
  visitDate: string;
}): SafetyInspectionSchedule {
  return {
    actualVisitDate: input.visitDate,
    assigneeName: '',
    assigneeUserId: '',
    exceptionMemo: '',
    exceptionReasonCode: '',
    headquarterId: normalizeText(input.report.headquarterId) || input.site.headquarterId || '',
    headquarterName: '',
    id: input.scheduleId,
    isConflicted: false,
    isOutOfWindow: false,
    isOverdue: false,
    linkedReportKey: normalizeText(input.report.reportKey),
    plannedDate: input.visitDate,
    roundNo: input.roundNo,
    selectionConfirmedAt: '',
    selectionConfirmedByName: '',
    selectionConfirmedByUserId: '',
    selectionReasonLabel: '',
    selectionReasonMemo: '',
    siteId: input.site.id,
    siteName: input.site.siteName,
    status: 'planned',
    totalRounds:
      normalizeRoundNo(input.report.totalRound) ||
      normalizeRoundNo(input.site.totalRounds) ||
      input.roundNo,
    windowEnd: input.contractWindow?.windowEnd || '',
    windowStart: input.contractWindow?.windowStart || '',
  };
}

export function buildWorkerCalendarRowsWithReportDates(input: {
  contractWindowsBySiteId?: Record<string, WorkerCalendarContractWindow>;
  reportsBySiteId: Map<string, InspectionReportListItem[]>;
  rows: SafetyInspectionSchedule[];
  selectedSiteId?: string;
  sites: WorkerCalendarBackfillSite[];
}) {
  const siteById = new Map(input.sites.map((site) => [site.id, site]));
  const rowsById = new Map(input.rows.map((row) => [row.id, row]));
  const rowsBySiteRound = new Map<string, SafetyInspectionSchedule>();
  const outputById = new Map(input.rows.map((row) => [row.id, row]));

  input.rows.forEach((row) => {
    if (row.siteId && row.roundNo > 0) {
      rowsBySiteRound.set(getSiteRoundKey(row.siteId, row.roundNo), row);
    }
  });

  input.reportsBySiteId.forEach((reports, mapSiteId) => {
    const siteId = normalizeText(mapSiteId);
    if (!siteId || (input.selectedSiteId && input.selectedSiteId !== siteId)) {
      return;
    }

    const site = siteById.get(siteId);
    if (!site) return;

    reports.forEach((report) => {
      const visitDate = normalizeText(report.visitDate);
      if (!visitDate) return;

      const reportSiteId = normalizeText(report.siteId) || siteId;
      if (input.selectedSiteId && input.selectedSiteId !== reportSiteId) {
        return;
      }

      const scheduleId = normalizeText(report.scheduleId);
      const reportKey = normalizeText(report.reportKey);
      const roundNo = normalizeRoundNo(report.visitRound);
      const row =
        (scheduleId ? rowsById.get(scheduleId) ?? null : null) ??
        (roundNo > 0 ? rowsBySiteRound.get(getSiteRoundKey(reportSiteId, roundNo)) ?? null : null);
      const fallbackRow =
        row ??
        (scheduleId && roundNo > 0
          ? createFallbackScheduleFromReport({
              contractWindow: input.contractWindowsBySiteId?.[reportSiteId] ?? null,
              report,
              roundNo,
              scheduleId,
              site,
              visitDate,
            })
          : null);

      if (!fallbackRow) return;

      outputById.set(fallbackRow.id, {
        ...fallbackRow,
        actualVisitDate: visitDate,
        linkedReportKey: normalizeText(fallbackRow.linkedReportKey) || reportKey,
        plannedDate: visitDate,
        siteId: fallbackRow.siteId || reportSiteId,
        siteName: fallbackRow.siteName || site.siteName,
        totalRounds:
          normalizeRoundNo(fallbackRow.totalRounds) ||
          normalizeRoundNo(report.totalRound) ||
          normalizeRoundNo(site.totalRounds) ||
          fallbackRow.roundNo,
      });
    });
  });

  return Array.from(outputById.values());
}
