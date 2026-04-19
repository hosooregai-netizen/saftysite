import { normalizeInspectionSite } from '@/constants/inspectionSession';
import { mapSafetyReportToQuarterlySummaryReport } from '@/lib/erpReports/mappers';
import { TECHNICAL_GUIDANCE_REPORT_KIND } from '@/lib/erpReports/shared';
import { buildSafetyMasterData, mapSafetyReportToInspectionSession } from '@/lib/safetyApiMappers';
import {
  fetchSafetyContentItemsServer,
  fetchSafetyReportsBySiteFullServer,
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import type { GeneratedReportPdfCacheKey } from '@/server/documents/shared/generatedReportPdfCache';
import { resolveReportSitePayloadByReportKey } from '@/server/documents/shared/reportKeyResolver';
import type { SafetyContentItem, SafetyReport } from '@/types/backend';
import type {
  GenerateQuarterlyDocumentRequest,
  GenerateQuarterlyResolvedDocumentRequest,
} from '@/types/documents';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

export interface QuarterlySelectableSessionRecord {
  isTechnicalGuidance: boolean;
  reportKey: string;
  session: InspectionSession | null;
}

function isTechnicalGuidanceReport(report: SafetyReport): boolean {
  const rawKind =
    typeof report.meta?.reportKind === 'string'
      ? report.meta.reportKind.trim().toLowerCase()
      : '';

  return !rawKind || rawKind === TECHNICAL_GUIDANCE_REPORT_KIND;
}

function getReportSortRound(report: SafetyReport): number {
  return typeof report.visit_round === 'number' && report.visit_round > 0
    ? report.visit_round
    : Number.MAX_SAFE_INTEGER;
}

function getReportSortDate(report: SafetyReport): string {
  return report.visit_date?.trim() || '9999-12-31';
}

function getReportSortCreatedAt(report: SafetyReport): string {
  return report.created_at?.trim() || '9999-12-31T23:59:59.999Z';
}

function compareTechnicalGuidanceReports(left: SafetyReport, right: SafetyReport): number {
  const roundDiff = getReportSortRound(left) - getReportSortRound(right);
  if (roundDiff !== 0) return roundDiff;

  const visitDateDiff = getReportSortDate(left).localeCompare(getReportSortDate(right));
  if (visitDateDiff !== 0) return visitDateDiff;

  return getReportSortCreatedAt(left).localeCompare(getReportSortCreatedAt(right));
}

function buildFallbackSiteFromReport(report: SafetyReport): InspectionSite {
  const payload =
    report.payload && typeof report.payload === 'object'
      ? (report.payload as Record<string, unknown>)
      : {};
  const snapshot =
    payload.adminSiteSnapshot && typeof payload.adminSiteSnapshot === 'object'
      ? payload.adminSiteSnapshot
      : {};
  const meta = report.meta ?? {};

  return normalizeInspectionSite({
    id: report.site_id,
    headquarterId: report.headquarter_id,
    title:
      (typeof payload.title === 'string' && payload.title) ||
      (typeof meta.siteName === 'string' && meta.siteName) ||
      report.report_title,
    siteName:
      (typeof meta.siteName === 'string' && meta.siteName) ||
      (typeof payload.siteName === 'string' && payload.siteName) ||
      report.report_title,
    assigneeName:
      (typeof meta.drafter === 'string' && meta.drafter) ||
      (typeof payload.assigneeName === 'string' && payload.assigneeName),
    adminSiteSnapshot: snapshot,
    createdAt: report.created_at,
    updatedAt: report.updated_at,
  });
}

function buildQuarterlySelectableSessionRecords(
  rawSiteReports: SafetyReport[],
  contentItems: SafetyContentItem[],
): {
  records: QuarterlySelectableSessionRecord[];
  siteSessions: InspectionSession[];
} {
  const masterData = buildSafetyMasterData(contentItems);
  const technicalReports = rawSiteReports
    .filter(isTechnicalGuidanceReport)
    .sort(compareTechnicalGuidanceReports);
  const sessionsById = new Map<string, InspectionSession>();

  technicalReports.forEach((report) => {
    sessionsById.set(
      report.report_key,
      mapSafetyReportToInspectionSession(report, buildFallbackSiteFromReport(report), masterData),
    );
  });

  const records = rawSiteReports.map((report) => ({
    isTechnicalGuidance: isTechnicalGuidanceReport(report),
    reportKey: report.report_key,
    session: sessionsById.get(report.report_key) ?? null,
  }));

  return {
    records,
    siteSessions: technicalReports
      .map((report) => sessionsById.get(report.report_key) ?? null)
      .filter((session): session is InspectionSession => session !== null),
  };
}

export function selectQuarterlyAppendixSessions(
  generatedFromSessionIds: string[],
  records: QuarterlySelectableSessionRecord[],
): InspectionSession[] {
  const normalizedKeys = Array.from(
    new Set(generatedFromSessionIds.map((value) => value.trim()).filter(Boolean)),
  );
  if (normalizedKeys.length === 0) {
    return [];
  }

  const recordsByKey = new Map(records.map((record) => [record.reportKey, record]));

  return normalizedKeys.map((reportKey) => {
    const matched = recordsByKey.get(reportKey);
    if (!matched) {
      throw new SafetyServerApiError(
        `선택된 기술지도 보고서를 찾지 못했습니다: ${reportKey}`,
        404,
      );
    }

    if (!matched.isTechnicalGuidance) {
      throw new SafetyServerApiError(
        `분기보고서에는 기술지도 보고서만 첨부할 수 있습니다: ${reportKey}`,
        400,
      );
    }

    if (!matched.session) {
      throw new SafetyServerApiError(
        `선택된 기술지도 보고서를 문서로 변환하지 못했습니다: ${reportKey}`,
        500,
      );
    }

    return matched.session;
  });
}

async function resolveQuarterlyAppendixPayload(
  request: Request,
  site: InspectionSite,
  report: QuarterlySummaryReport,
): Promise<Pick<GenerateQuarterlyResolvedDocumentRequest, 'selectedSessions' | 'siteSessions'>> {
  const selectedReportKeys = Array.from(
    new Set(report.generatedFromSessionIds.map((value) => value.trim()).filter(Boolean)),
  );
  if (selectedReportKeys.length === 0) {
    return {
      selectedSessions: [],
      siteSessions: [],
    };
  }

  const token = readRequiredSafetyAuthToken(request);
  const [contentItems, rawSiteReports] = await Promise.all([
    fetchSafetyContentItemsServer(token, request),
    fetchSafetyReportsBySiteFullServer(token, site.id, request),
  ]);
  const { records, siteSessions } = buildQuarterlySelectableSessionRecords(
    rawSiteReports,
    contentItems,
  );

  return {
    selectedSessions: selectQuarterlyAppendixSessions(selectedReportKeys, records),
    siteSessions,
  };
}

export interface ResolvedQuarterlyDocumentRequest
  extends GenerateQuarterlyResolvedDocumentRequest {
  cacheKey: GeneratedReportPdfCacheKey | null;
}

export async function resolveQuarterlyDocumentRequest(
  request: Request,
  body: GenerateQuarterlyDocumentRequest,
): Promise<ResolvedQuarterlyDocumentRequest> {
  if ('report' in body && body.report && body.site) {
    const appendixPayload = await resolveQuarterlyAppendixPayload(
      request,
      body.site,
      body.report,
    );
    return {
      ...body,
      cacheKey: null,
      ...appendixPayload,
    };
  }

  const reportKey =
    'reportKey' in body && typeof body.reportKey === 'string'
      ? body.reportKey.trim()
      : '';
  if (reportKey.length === 0) {
    throw new SafetyServerApiError('문서 생성에 필요한 분기 보고서 키가 없습니다.', 400);
  }

  const payload = await resolveReportSitePayloadByReportKey(request, reportKey);
  const report = mapSafetyReportToQuarterlySummaryReport(payload.report);
  if (report === null) {
    throw new SafetyServerApiError('분기 보고서 원본 데이터를 찾지 못했습니다.', 404);
  }

  const appendixPayload = await resolveQuarterlyAppendixPayload(request, payload.site, report);

  return {
    cacheKey: {
      documentKind: 'quarterly_report',
      reportKey,
      updatedAt: payload.report.updated_at || '',
    },
    report,
    site: payload.site,
    ...appendixPayload,
  };
}
