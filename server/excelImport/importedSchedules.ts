import { parseSiteInspectionSchedules } from '@/lib/admin/siteContractProfile';
import type { SafetyInspectionSchedule } from '@/types/admin';
import type { SafetySite } from '@/types/backend';

export interface ImportedScheduleSeed {
  assigneeName: string;
  assigneeUserId: string;
  completionStatus: string;
  roundNo: number | null;
  visitDate: string;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function startOfToday(today: Date) {
  const normalized = new Date(today);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function parseDateValue(value: string | null | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function normalizeCompletionStatus(
  completionStatus: string,
  visitDate: string,
  today: Date,
): SafetyInspectionSchedule['status'] {
  const normalizedStatus = normalizeText(completionStatus).toLowerCase();
  if (normalizedStatus.includes('취소') || normalizedStatus.includes('canceled')) {
    return 'canceled';
  }
  if (normalizedStatus.includes('완료') && !normalizedStatus.includes('미완료')) {
    return 'completed';
  }
  const parsedVisitDate = parseDateValue(visitDate);
  if (parsedVisitDate && parsedVisitDate.getTime() <= startOfToday(today).getTime()) {
    return 'completed';
  }
  return 'planned';
}

function buildScheduleId(siteId: string, roundNo: number) {
  return `schedule:${siteId}:${roundNo}`;
}

export function mergeImportedSchedules(
  site: SafetySite,
  seeds: ImportedScheduleSeed[],
  today = new Date(),
): SafetyInspectionSchedule[] {
  const headquarterName = site.headquarter_detail?.name || site.headquarter?.name || '';
  const existingByRound = parseSiteInspectionSchedules(site).reduce((map, schedule) => {
    map.set(schedule.roundNo, schedule);
    return map;
  }, new Map<number, SafetyInspectionSchedule>());

  seeds.forEach((seed) => {
    if (!seed.roundNo || seed.roundNo <= 0 || !normalizeText(seed.visitDate)) {
      return;
    }
    const current = existingByRound.get(seed.roundNo);
    existingByRound.set(seed.roundNo, {
      assigneeName: normalizeText(seed.assigneeName) || current?.assigneeName || site.inspector_name || '',
      assigneeUserId: normalizeText(seed.assigneeUserId) || current?.assigneeUserId || '',
      exceptionMemo: current?.exceptionMemo || '',
      exceptionReasonCode: current?.exceptionReasonCode || '',
      headquarterId: site.headquarter_id,
      headquarterName,
      id: current?.id || buildScheduleId(site.id, seed.roundNo),
      isConflicted: false,
      isOutOfWindow: false,
      isOverdue: false,
      linkedReportKey: current?.linkedReportKey || '',
      plannedDate: seed.visitDate,
      roundNo: seed.roundNo,
      selectionConfirmedAt: current?.selectionConfirmedAt || '',
      selectionConfirmedByName: current?.selectionConfirmedByName || '',
      selectionConfirmedByUserId: current?.selectionConfirmedByUserId || '',
      selectionReasonLabel: current?.selectionReasonLabel || 'K2B 회차 반영',
      selectionReasonMemo: current?.selectionReasonMemo || '',
      siteId: site.id,
      siteName: site.site_name,
      status: normalizeCompletionStatus(seed.completionStatus, seed.visitDate, today),
      windowEnd: current?.windowEnd || seed.visitDate,
      windowStart: current?.windowStart || seed.visitDate,
    });
  });

  return Array.from(existingByRound.values()).sort((left, right) => left.roundNo - right.roundNo);
}
