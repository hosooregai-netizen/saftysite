import {
  getSessionGuidanceDate,
} from '@/constants/inspectionSession';
import {
  syncQuarterlySummaryReportSources,
} from '@/lib/erpReports/quarterly';
import { SafetyApiError } from '@/lib/safetyApi';
import type {
  SafetyQuarterlySummarySeed,
  SafetyQuarterlySummarySeedSourceReport,
} from '@/types/backend';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';
export {
  createEmptyImplementationRow,
  formatDateTimeLabel,
  getQuarterSelectionTarget,
  getQuarterlyDraftFingerprint,
  normalizeIds,
} from './quarterlyReportStateHelpers';

export function sortSourceReportsByDateDesc(
  reports: SafetyQuarterlySummarySeedSourceReport[],
) {
  return [...reports].sort((left, right) => {
    const leftTime = new Date(left.guidance_date || '').getTime();
    const rightTime = new Date(right.guidance_date || '').getTime();
    return rightTime - leftTime;
  });
}

export function getQuarterlySourceReportTitle(
  report: SafetyQuarterlySummarySeedSourceReport,
) {
  return report.report_title || report.guidance_date || report.report_key;
}

function getQuarterlySessionReportTitle(session: InspectionSession) {
  if (session.meta.reportTitle?.trim()) {
    return session.meta.reportTitle.trim();
  }

  const guidanceDate = getSessionGuidanceDate(session);
  if (guidanceDate && Number.isFinite(session.reportNumber) && session.reportNumber > 0) {
    return `${guidanceDate} 보고서 ${session.reportNumber}`;
  }

  if (guidanceDate) {
    return guidanceDate;
  }

  if (Number.isFinite(session.reportNumber) && session.reportNumber > 0) {
    return `보고서 ${session.reportNumber}`;
  }

  return session.id;
}

function mapSessionToQuarterlySourceReport(
  session: InspectionSession,
): SafetyQuarterlySummarySeedSourceReport {
  return {
    report_key: session.id,
    report_title: getQuarterlySessionReportTitle(session),
    guidance_date: getSessionGuidanceDate(session),
    drafter: session.meta.drafter || '',
    progress_rate: session.document2Overview.progressRate || '',
    finding_count: session.document7Findings.length,
    improved_count: session.document4FollowUps.filter((item) => item.result === 'completed').length,
  };
}

export function shouldUseLocalQuarterlySeedFallback(error: unknown) {
  return error instanceof SafetyApiError && [404, 405, 501].includes(error.status ?? -1);
}

export function buildLocalQuarterlySummarySeed(
  report: QuarterlySummaryReport,
  site: InspectionSite,
  siteSessions: InspectionSession[],
  options?: {
    selectedReportKeys?: string[];
    explicitSelection?: boolean;
  },
): SafetyQuarterlySummarySeed {
  const normalizedSelectedKeys = Array.from(
    new Set((options?.selectedReportKeys ?? []).map((value) => value.trim()).filter(Boolean)),
  );
  const sourceSessions = [...siteSessions]
    .filter((session) => getSessionGuidanceDate(session))
    .filter((session) => {
      const guidanceDate = getSessionGuidanceDate(session);
      return guidanceDate >= report.periodStartDate && guidanceDate <= report.periodEndDate;
    })
    .sort((left, right) => {
      const leftTime = new Date(getSessionGuidanceDate(left) || left.updatedAt).getTime();
      const rightTime = new Date(getSessionGuidanceDate(right) || right.updatedAt).getTime();
      return rightTime - leftTime;
    });
  const selectedReportKeys =
    options?.explicitSelection || normalizedSelectedKeys.length > 0
      ? normalizedSelectedKeys
      : sourceSessions.map((session) => session.id);
  const derivedReport = syncQuarterlySummaryReportSources(
    report,
    site,
    siteSessions,
    selectedReportKeys,
    sourceSessions,
  );

  return {
    period_start_date: derivedReport.periodStartDate,
    period_end_date: derivedReport.periodEndDate,
    selected_report_keys: [...derivedReport.generatedFromSessionIds],
    source_reports: sourceSessions.map(mapSessionToQuarterlySourceReport),
    last_calculated_at: derivedReport.lastCalculatedAt,
    implementation_rows: derivedReport.implementationRows.map((row) => ({
      session_id: row.sessionId,
      report_title: row.reportTitle,
      report_date: row.reportDate,
      report_number: row.reportNumber,
      drafter: row.drafter,
      progress_rate: row.progressRate,
      finding_count: row.findingCount,
      improved_count: row.improvedCount,
      note: row.note,
    })),
    accident_stats: derivedReport.accidentStats.map((item) => ({ ...item })),
    causative_stats: derivedReport.causativeStats.map((item) => ({ ...item })),
    future_plans: derivedReport.futurePlans.map((item) => ({
      id: item.id,
      process_name: item.hazard ? '' : item.processName,
      hazard: item.hazard || item.processName,
      countermeasure: item.countermeasure,
      note: item.note,
      source: item.source,
    })),
    major_measures: [...derivedReport.majorMeasures],
  };
}

export function getSeedLoadErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '분기 원본 보고서를 불러오는 중 오류가 발생했습니다.';
}

export function getQuarterlyPageErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return '분기 원본 보고서를 불러오는 중 오류가 발생했습니다.';
  }

  return getSeedLoadErrorMessage(error);
}
