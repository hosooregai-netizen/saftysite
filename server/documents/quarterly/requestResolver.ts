import { mapSafetyReportToQuarterlySummaryReport } from '@/lib/erpReports/mappers';
import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import type { GeneratedReportPdfCacheKey } from '@/server/documents/shared/generatedReportPdfCache';
import { resolveReportSitePayloadByReportKey } from '@/server/documents/shared/reportKeyResolver';
import type {
  GenerateQuarterlyDocumentRequest,
  GenerateQuarterlyHwpxRequest,
} from '@/types/documents';

export interface ResolvedQuarterlyDocumentRequest extends GenerateQuarterlyHwpxRequest {
  cacheKey: GeneratedReportPdfCacheKey | null;
}

export async function resolveQuarterlyDocumentRequest(
  request: Request,
  body: GenerateQuarterlyDocumentRequest,
): Promise<ResolvedQuarterlyDocumentRequest> {
  if ('report' in body && body.report && body.site) {
    return { ...body, cacheKey: null };
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

  return {
    cacheKey: {
      documentKind: 'quarterly_report',
      reportKey,
      updatedAt: payload.report.updated_at || '',
    },
    report,
    site: payload.site,
  };
}
