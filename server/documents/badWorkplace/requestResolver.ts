import { mapSafetyReportToBadWorkplaceReport } from '@/lib/erpReports/mappers';
import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { resolveReportSitePayloadByReportKey } from '@/server/documents/shared/reportKeyResolver';
import type {
  GenerateBadWorkplaceDocumentRequest,
  GenerateBadWorkplaceHwpxRequest,
} from '@/types/documents';

export async function resolveBadWorkplaceDocumentRequest(
  request: Request,
  body: GenerateBadWorkplaceDocumentRequest,
): Promise<GenerateBadWorkplaceHwpxRequest> {
  if ('report' in body && body.report && body.site) {
    return body;
  }

  const reportKey =
    'reportKey' in body && typeof body.reportKey === 'string'
      ? body.reportKey.trim()
      : '';
  if (reportKey.length === 0) {
    throw new SafetyServerApiError('문서 생성에 필요한 불량사업장 보고서 키가 없습니다.', 400);
  }

  const payload = await resolveReportSitePayloadByReportKey(request, reportKey);
  const report = mapSafetyReportToBadWorkplaceReport(payload.report);
  if (report === null) {
    throw new SafetyServerApiError('불량사업장 보고서 원본 데이터를 찾지 못했습니다.', 404);
  }

  return {
    report,
    site: payload.site,
  };
}
