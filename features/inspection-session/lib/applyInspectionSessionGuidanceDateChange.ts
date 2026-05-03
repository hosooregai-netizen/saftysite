import type { InspectionSession } from '@/types/inspectionSession';

function normalizeDateText(value: string) {
  return value.trim();
}

export function buildInspectionAutoReportTitle(reportDate: string, reportNumber: number) {
  return reportDate ? `${reportDate} 보고서 ${reportNumber}` : `보고서 ${reportNumber}`;
}

function buildAutoTitleCandidates(session: InspectionSession) {
  const candidates = new Set<string>();
  const reportNumber = session.reportNumber;
  const guidanceDate = normalizeDateText(session.document2Overview.guidanceDate);
  const reportDate = normalizeDateText(session.meta.reportDate);

  [guidanceDate, reportDate, ''].forEach((date) => {
    candidates.add(buildInspectionAutoReportTitle(date, reportNumber));
  });

  return candidates;
}

export function applyInspectionSessionGuidanceDateChange(
  current: InspectionSession,
  value: string,
): InspectionSession {
  const nextDate = normalizeDateText(value);
  const previousGuidanceDate = normalizeDateText(current.document2Overview.guidanceDate);
  const previousReportDate = normalizeDateText(current.meta.reportDate);
  const currentTitle = current.meta.reportTitle.trim();
  const shouldRefreshTitle =
    !currentTitle || buildAutoTitleCandidates(current).has(currentTitle);

  return {
    ...current,
    meta: {
      ...current.meta,
      reportDate: nextDate,
      reportTitle: shouldRefreshTitle
        ? buildInspectionAutoReportTitle(nextDate, current.reportNumber)
        : current.meta.reportTitle,
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
