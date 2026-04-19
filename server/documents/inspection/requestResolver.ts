import { normalizeInspectionSite } from '@/constants/inspectionSession';
import { TECHNICAL_GUIDANCE_REPORT_KIND } from '@/lib/erpReports/shared';
import { buildSafetyMasterData, mapSafetyReportToInspectionSession } from '@/lib/safetyApiMappers';
import {
  fetchAdminReportByKey,
  fetchSafetyContentItemsServer,
  fetchSafetyReportsBySiteFullServer,
  readRequiredSafetyAuthToken,
} from '@/server/admin/safetyApiServer';
import { resolveReportSitePayloadByReportKey } from '@/server/documents/shared/reportKeyResolver';
import type { GeneratedReportPdfCacheKey } from '@/server/documents/shared/generatedReportPdfCache';
import type { SafetyReport } from '@/types/backend';
import type {
  GenerateInspectionDocumentRequest,
  GenerateInspectionHwpxRequest,
} from '@/types/documents';
import type { InspectionSite, InspectionSession } from '@/types/inspectionSession';

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

export interface InspectionSessionBootstrapPayload {
  cacheKey: GeneratedReportPdfCacheKey;
  site: InspectionSite;
  session: InspectionSession;
  siteSessions: InspectionSession[];
}

export interface ResolvedInspectionDocumentRequest extends GenerateInspectionHwpxRequest {
  cacheKey: GeneratedReportPdfCacheKey | null;
}

export async function resolveInspectionSessionBootstrapByReportKey(
  request: Request,
  reportKey: string,
): Promise<InspectionSessionBootstrapPayload> {
  const normalizedReportKey = reportKey.trim();
  if (!normalizedReportKey) {
    throw new Error('문서 생성에 필요한 기술지도 보고서 키가 없습니다.');
  }

  const token = readRequiredSafetyAuthToken(request);
  const { report: targetReport, site } = await resolveReportSitePayloadByReportKey(
    request,
    normalizedReportKey,
  ).catch(async () => {
    const report = await fetchAdminReportByKey(token, normalizedReportKey, request);
    return {
      report,
      site: buildFallbackSiteFromReport(report),
    };
  });
  const [contentItems, rawSiteReports] = await Promise.all([
    fetchSafetyContentItemsServer(token, request),
    fetchSafetyReportsBySiteFullServer(token, targetReport.site_id, request),
  ]);

  const masterData = buildSafetyMasterData(contentItems);
  const technicalReports = rawSiteReports
    .filter(isTechnicalGuidanceReport)
    .sort(compareTechnicalGuidanceReports);
  const sessionsById = new Map<string, InspectionSession>();

  technicalReports.forEach((report) => {
    sessionsById.set(
      report.report_key,
      mapSafetyReportToInspectionSession(
        report,
        report.report_key === targetReport.report_key ? site : buildFallbackSiteFromReport(report),
        masterData,
      ),
    );
  });

  if (!sessionsById.has(targetReport.report_key)) {
    sessionsById.set(
      targetReport.report_key,
      mapSafetyReportToInspectionSession(targetReport, site, masterData),
    );
  }

  const session = sessionsById.get(targetReport.report_key);
  if (!session) {
    throw new Error('문서 생성에 필요한 기술지도 보고서를 불러오지 못했습니다.');
  }

  return {
    cacheKey: {
      documentKind: 'technical_guidance',
      reportKey: targetReport.report_key,
      updatedAt: targetReport.updated_at || '',
    },
    site,
    session,
    siteSessions: Array.from(sessionsById.values()),
  };
}

export async function resolveInspectionDocumentRequest(
  request: Request,
  body: GenerateInspectionDocumentRequest,
): Promise<ResolvedInspectionDocumentRequest> {
  if ('session' in body && body.session) {
    return {
      cacheKey: null,
      session: body.session,
      siteSessions: body.siteSessions?.length ? body.siteSessions : [body.session],
    };
  }

  const reportKey =
    'reportKey' in body && typeof body.reportKey === 'string'
      ? body.reportKey.trim()
      : '';
  if (!reportKey) {
    throw new Error('문서 생성에 필요한 기술지도 보고서 키가 없습니다.');
  }

  const { cacheKey, session, siteSessions } = await resolveInspectionSessionBootstrapByReportKey(
    request,
    reportKey,
  );

  return {
    cacheKey,
    session,
    siteSessions,
  };
}
