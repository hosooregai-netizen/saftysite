import { mapSafetySiteToInspectionSite } from '@/lib/safetyApiMappers/sites';
import type { SafetyReport } from '@/types/backend';
import type { InspectionSite } from '@/types/inspectionSession';
import {
  SafetyServerApiError,
  fetchAdminReportByKey,
  fetchSafetySitesServer,
  readRequiredSafetyAuthToken,
} from '@/server/admin/safetyApiServer';

export interface ResolvedReportSitePayload {
  report: SafetyReport;
  site: InspectionSite;
}

export async function resolveReportSitePayloadByReportKey(
  request: Request,
  reportKey: string,
): Promise<ResolvedReportSitePayload> {
  const normalizedReportKey = reportKey.trim();
  if (normalizedReportKey.length === 0) {
    throw new SafetyServerApiError('문서 생성에 필요한 보고서 키가 없습니다.', 400);
  }

  const token = readRequiredSafetyAuthToken(request);
  const [report, sites] = await Promise.all([
    fetchAdminReportByKey(token, normalizedReportKey, request),
    fetchSafetySitesServer(token, request),
  ]);

  const matchedSite = sites.find((site) => site.id === report.site_id) ?? null;
  if (matchedSite === null) {
    throw new SafetyServerApiError('문서 생성에 필요한 현장 정보를 찾지 못했습니다.', 404);
  }

  return {
    report,
    site: mapSafetySiteToInspectionSite(matchedSite),
  };
}
