import type { InspectionSession } from '@/types/inspectionSession';

function normalizeDateText(value: string) {
  return value.trim();
}

export function buildInspectionAutoReportTitle(reportDate: string, reportNumber: number) {
  return reportDate ? `${reportDate} 보고서 ${reportNumber}` : `보고서 ${reportNumber}`;
}

export function applyInspectionSessionGuidanceDateChange(
  current: InspectionSession,
  value: string,
): InspectionSession {
  const nextDate = normalizeDateText(value);
  const previousGuidanceDate = normalizeDateText(current.document2Overview.guidanceDate);
  const previousReportDate = normalizeDateText(current.meta.reportDate);

  return {
    ...current,
    meta: {
      ...current.meta,
      reportDate: nextDate,
      reportTitle: buildInspectionAutoReportTitle(nextDate, current.reportNumber),
    },
    document2Overview: {
      ...current.document2Overview,
      guidanceDate: nextDate,
    },
    document4FollowUps: current.document4FollowUps.map((item) => ({
      ...item,
      confirmationDate:
        !item.confirmationDate ||
        item.confirmationDate === previousGuidanceDate ||
        item.confirmationDate === previousReportDate
          ? nextDate
          : item.confirmationDate,
    })),
  };
}
