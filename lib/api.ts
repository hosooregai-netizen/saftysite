import { generateInspectionHwpxBlob } from '@/lib/documents/inspection/hwpxClient';
import { readSafetyAuthToken } from '@/lib/safetyApi';
import { buildPublicSafetyApiUpstreamUrl } from '@/lib/safetyApi/upstream';
import type { SafetyAdminReportSessionBootstrapResponse } from '@/types/admin';
import type {
  GenerateBadWorkplaceHwpxRequest,
  GenerateQuarterlyHwpxRequest,
} from '@/types/documents';
import type {
  GenerateInspectionDocumentByReportKeyRequest,
  GenerateInspectionHwpxRequest,
} from '@/types/documents';
import type {
  BadWorkplaceReport,
  QuarterlySummaryReport,
} from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

const API_BASE = '/api';
const VERCEL_FUNCTION_BODY_LIMIT_MB = 4.5;
const PDF_CONVERTER_TIMEOUT_MS = 180000;

function formatBlobSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function parseApiResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }

  return res.text();
}

function getDownloadFilenameFromDisposition(header: string | null): string {
  if (!header) return 'download.bin';

  const encodedMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      // Fall through to other filename formats.
    }
  }

  const match = header.match(/filename="([^"]+)"/i);
  if (match?.[1]) return match[1];

  const bareMatch = header.match(/filename=([^;]+)/i);
  return bareMatch?.[1]?.trim() ?? 'download.bin';
}

async function fetchDocumentFile<TBody>(
  path: string,
  body: TBody,
  errorLabel: string,
  headers?: HeadersInit,
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers:
      headers ??
      {
        'Content-Type': 'application/json',
      },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await parseApiResponse(res);
    const message =
      typeof errorBody === 'object' && errorBody && 'error' in errorBody
        ? String(errorBody.error)
        : res.statusText;

    throw new Error(`${errorLabel} (${res.status}): ${message}`);
  }

  return {
    blob: await res.blob(),
    filename: getDownloadFilenameFromDisposition(
      res.headers.get('content-disposition'),
    ),
  };
}

function buildInspectionDocumentHeaders(authToken?: string | null): HeadersInit {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  const normalizedToken = authToken?.trim();

  if (normalizedToken) {
    headers.set('Authorization', `Bearer ${normalizedToken}`);
  }

  return headers;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function getPublicInspectionPdfConverterUrl(): string | null {
  const dedicatedBaseUrl = process.env.NEXT_PUBLIC_INSPECTION_PDF_UPSTREAM_BASE_URL?.trim() || '';
  if (dedicatedBaseUrl && isAbsoluteHttpUrl(dedicatedBaseUrl)) {
    return new URL('documents/inspection/pdf', `${normalizeBaseUrl(dedicatedBaseUrl)}/`).toString();
  }

  return buildPublicSafetyApiUpstreamUrl('/documents/inspection/pdf');
}

function canUseDirectInspectionPdfConverter(converterUrl: string | null): boolean {
  if (!converterUrl) {
    return false;
  }

  try {
    const targetUrl = new URL(converterUrl);
    if (!/^https?:$/i.test(targetUrl.protocol)) {
      return false;
    }

    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      return targetUrl.protocol === 'https:';
    }

    return true;
  } catch {
    return false;
  }
}

function getUsableDirectInspectionPdfConverterUrl(): string | null {
  const converterUrl = getPublicInspectionPdfConverterUrl();
  return canUseDirectInspectionPdfConverter(converterUrl) ? converterUrl : null;
}

function getDirectPdfAuthToken(authToken?: string | null): string | null {
  const normalizedToken = authToken?.trim();
  if (normalizedToken) {
    return normalizedToken;
  }

  return readSafetyAuthToken()?.trim() || null;
}

async function convertHwpxBlobToPdfDirect(
  converterUrl: string,
  hwpxBlob: Blob,
  hwpxFilename: string,
  authToken: string,
): Promise<{ blob: Blob; filename: string }> {
  const formData = new FormData();
  formData.append('file', hwpxBlob, hwpxFilename || 'inspection-report.hwpx');
  formData.append('filename', hwpxFilename || 'inspection-report.hwpx');

  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    abortController.abort(new Error('Inspection PDF direct conversion timed out.'));
  }, PDF_CONVERTER_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(converterUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
      cache: 'no-store',
      signal: abortController.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errorBody = await parseApiResponse(res);
    const message =
      typeof errorBody === 'object' && errorBody && 'detail' in errorBody
        ? String(errorBody.detail)
        : typeof errorBody === 'object' && errorBody && 'error' in errorBody
          ? String(errorBody.error)
          : res.statusText;

    throw new Error(`PDF direct conversion failed (${res.status}): ${message}`);
  }

  return {
    blob: await res.blob(),
    filename: getDownloadFilenameFromDisposition(res.headers.get('content-disposition')),
  };
}

async function fetchDocumentDownloadUrl<TBody>(
  path: string,
  body: TBody,
  errorLabel: string,
  headers?: HeadersInit,
): Promise<{ downloadUrl: string; filename: string }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers:
      headers ??
      {
        'Content-Type': 'application/json',
      },
    body: JSON.stringify(body),
  });

  const errorBody = !res.ok ? await parseApiResponse(res) : null;
  if (!res.ok) {
    const message =
      typeof errorBody === 'object' && errorBody && 'error' in errorBody
        ? String(errorBody.error)
        : res.statusText;

    throw new Error(`${errorLabel} (${res.status}): ${message}`);
  }

  const payload = (await res.json()) as { downloadUrl?: unknown; filename?: unknown };
  const downloadUrl =
    typeof payload.downloadUrl === 'string' && payload.downloadUrl.trim()
      ? payload.downloadUrl.trim()
      : '';
  const filename =
    typeof payload.filename === 'string' && payload.filename.trim()
      ? payload.filename.trim()
      : 'download.bin';

  if (!downloadUrl) {
    throw new Error(`${errorLabel}: download URL is missing.`);
  }

  return {
    downloadUrl,
    filename,
  };
}

async function fetchInspectionSessionBootstrapByReportKey(
  reportKey: string,
  authToken?: string | null,
): Promise<SafetyAdminReportSessionBootstrapResponse> {
  const res = await fetch(`/api/admin/reports/${encodeURIComponent(reportKey)}/session-bootstrap`, {
    cache: 'no-store',
    headers: buildInspectionDocumentHeaders(authToken),
  });

  if (!res.ok) {
    const errorBody = await parseApiResponse(res);
    const message =
      typeof errorBody === 'object' && errorBody && 'error' in errorBody
        ? String(errorBody.error)
        : res.statusText;
    throw new Error(`기술지도 세션 bootstrap 다운로드 실패 (${res.status}): ${message}`);
  }

  return (await res.json()) as SafetyAdminReportSessionBootstrapResponse;
}

async function tryDirectInspectionPdfByReportKey(
  reportKey: string,
  authToken?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  const converterUrl = getUsableDirectInspectionPdfConverterUrl();
  const token = getDirectPdfAuthToken(authToken);
  if (!converterUrl || !token) {
    throw new Error('Direct inspection PDF converter is not available.');
  }

  const bootstrap = await fetchInspectionSessionBootstrapByReportKey(reportKey, authToken);
  const hwpx = await generateInspectionHwpxBlob(bootstrap.session, bootstrap.siteSessions);
  return convertHwpxBlobToPdfDirect(converterUrl, hwpx.blob, hwpx.filename, token);
}

export interface PdfDocumentResult {
  blob: Blob;
  filename: string;
  fallbackToHwpx: boolean;
  fallbackReason?: string;
}

export function saveBlobAsFile(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = blobUrl;
  link.download = filename || 'download.bin';
  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(blobUrl);
  }, 0);
}

export async function startFileDownloadFromUrl(
  downloadUrl: string,
  filename?: string | null,
): Promise<void> {
  const normalizedFilename = filename?.trim() || '';

  try {
    const response = await fetch(downloadUrl, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Download request failed with status ${response.status}.`);
    }

    const blob = await response.blob();
    saveBlobAsFile(
      blob,
      normalizedFilename ||
        getDownloadFilenameFromDisposition(response.headers.get('content-disposition')),
    );
    return;
  } catch (error) {
    console.warn('Direct file download via fetch failed; falling back to navigation.', {
      downloadUrl,
      error: error instanceof Error ? error.message : String(error),
      filename: normalizedFilename || undefined,
    });
  }

  const link = document.createElement('a');

  link.href = downloadUrl;
  link.rel = 'noopener';
  if (normalizedFilename) {
    link.download = normalizedFilename;
  }
  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
  }, 0);
}

export async function convertHwpxBlobToPdf(
  hwpxBlob: Blob,
  hwpxFilename: string,
): Promise<{ blob: Blob; filename: string }> {
  const directConverterUrl = getUsableDirectInspectionPdfConverterUrl();
  const directAuthToken = getDirectPdfAuthToken();

  if (directConverterUrl && directAuthToken) {
    try {
      return await convertHwpxBlobToPdfDirect(
        directConverterUrl,
        hwpxBlob,
        hwpxFilename,
        directAuthToken,
      );
    } catch (error) {
      console.warn('Inspection PDF direct conversion failed; falling back to Vercel route.', {
        error: error instanceof Error ? error.message : String(error),
        filename: hwpxFilename,
      });
    }
  }

  const formData = new FormData();

  formData.append('file', hwpxBlob, hwpxFilename || 'inspection-report.hwpx');
  formData.append('filename', hwpxFilename || 'inspection-report.hwpx');

  const res = await fetch(`${API_BASE}/documents/inspection/pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 413) {
      throw new Error(
        [
          `PDF 변환 요청 크기가 너무 큽니다. 현재 HWPX는 ${formatBlobSizeMb(hwpxBlob.size)}입니다.`,
          `Vercel Functions 요청 본문 제한은 ${VERCEL_FUNCTION_BODY_LIMIT_MB}MB라서 현 배포 환경에서는 처리할 수 없습니다.`,
          'HWPX로 다운로드하거나 별도 Windows PDF 변환 서버로 보내는 구조가 필요합니다.',
        ].join(' '),
      );
    }

    const errorBody = await parseApiResponse(res);
    const message =
      typeof errorBody === 'object' && errorBody && 'error' in errorBody
        ? String(errorBody.error)
        : res.statusText;

    throw new Error(`PDF 변환 실패 (${res.status}): ${message}`);
  }

  return {
    blob: await res.blob(),
    filename: getDownloadFilenameFromDisposition(
      res.headers.get('content-disposition'),
    ),
  };
}

export async function convertHwpxBlobToPdfWithFallback(
  hwpxBlob: Blob,
  hwpxFilename: string,
): Promise<PdfDocumentResult> {
  try {
    const converted = await convertHwpxBlobToPdf(hwpxBlob, hwpxFilename);
    return { ...converted, fallbackToHwpx: false };
  } catch (error) {
    console.warn('Inspection PDF generation failed; falling back to HWPX download.', {
      error: error instanceof Error ? error.message : String(error),
      filename: hwpxFilename,
    });
    return {
      blob: hwpxBlob,
      fallbackReason: error instanceof Error ? error.message : 'PDF 변환에 실패했습니다.',
      fallbackToHwpx: true,
      filename: hwpxFilename || 'inspection-report.hwpx',
    };
  }
}

export async function fetchInspectionHwpxDocument(
  session: InspectionSession,
  siteSessions?: InspectionSession[],
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateInspectionHwpxRequest = siteSessions?.length
    ? { session, siteSessions }
    : { session };
  return fetchDocumentFile(
    '/documents/inspection/hwpx',
    body,
    '기술지도 HWPX 다운로드 실패',
  );
}

export async function fetchInspectionHwpxDocumentByReportKey(
  reportKey: string,
  authToken?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateInspectionDocumentByReportKeyRequest = { reportKey };
  return fetchDocumentFile(
    '/documents/inspection/hwpx',
    body,
    '기술지도 HWPX 다운로드 실패',
    buildInspectionDocumentHeaders(authToken),
  );
}

export async function fetchInspectionPdfDocument(
  session: InspectionSession,
  siteSessions?: InspectionSession[],
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateInspectionHwpxRequest = siteSessions?.length
    ? { session, siteSessions }
    : { session };
  return fetchDocumentFile(
    '/documents/inspection/pdf',
    body,
    '기술지도 PDF 다운로드 실패',
  );
}

export async function fetchInspectionPdfDocumentByReportKey(
  reportKey: string,
  authToken?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateInspectionDocumentByReportKeyRequest = { reportKey };
  return fetchDocumentFile(
    '/documents/inspection/pdf',
    body,
    '기술지도 PDF 다운로드 실패',
    buildInspectionDocumentHeaders(authToken),
  );
}

export async function fetchInspectionPdfDownloadUrlByReportKey(
  reportKey: string,
  authToken?: string | null,
): Promise<{ downloadUrl: string; filename: string }> {
  const body: GenerateInspectionDocumentByReportKeyRequest = { reportKey };
  return fetchDocumentDownloadUrl(
    '/documents/inspection/pdf-download-url',
    body,
    '기술지도 PDF 다운로드 URL 조회 실패',
    buildInspectionDocumentHeaders(authToken),
  );
}

export async function fetchInspectionPdfDocumentWithFallback(
  session: InspectionSession,
  siteSessions?: InspectionSession[],
): Promise<PdfDocumentResult> {
  try {
    const pdf = await fetchInspectionPdfDocument(session, siteSessions);
    return { ...pdf, fallbackToHwpx: false };
  } catch (error) {
    console.warn('Inspection PDF server generation failed; falling back to HWPX generation.', {
      error: error instanceof Error ? error.message : String(error),
      sessionId: session.id,
    });
    const hwpx = await fetchInspectionHwpxDocument(session, siteSessions);
    return {
      ...hwpx,
      fallbackReason: error instanceof Error ? error.message : 'PDF 생성에 실패했습니다.',
      fallbackToHwpx: true,
    };
  }
}

export async function fetchInspectionPdfDocumentByReportKeyWithFallback(
  reportKey: string,
  authToken?: string | null,
): Promise<PdfDocumentResult> {
  try {
    const directPdf = await tryDirectInspectionPdfByReportKey(reportKey, authToken);
    return { ...directPdf, fallbackToHwpx: false };
  } catch (directError) {
    console.warn('Inspection PDF direct export failed; falling back to server generation.', {
      error: directError instanceof Error ? directError.message : String(directError),
      reportKey,
    });
  }

  try {
    const pdf = await fetchInspectionPdfDocumentByReportKey(reportKey, authToken);
    return { ...pdf, fallbackToHwpx: false };
  } catch (error) {
    console.warn('Inspection PDF server generation failed; falling back to HWPX download.', {
      error: error instanceof Error ? error.message : String(error),
      reportKey,
    });
    const hwpx = await fetchInspectionHwpxDocumentByReportKey(reportKey, authToken);
    return {
      ...hwpx,
      fallbackReason: error instanceof Error ? error.message : 'PDF 생성에 실패했습니다.',
      fallbackToHwpx: true,
    };
  }
}

export async function fetchQuarterlyHwpxDocument(
  report: QuarterlySummaryReport,
  site: InspectionSite,
  authToken?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateQuarterlyHwpxRequest = { report, site };
  const headers = buildInspectionDocumentHeaders(authToken);
  return fetchDocumentFile(
    '/documents/quarterly/hwpx',
    body,
    '분기 보고서 HWPX 다운로드 실패',
    headers,
  );
}

export async function fetchQuarterlyPdfDocument(
  report: QuarterlySummaryReport,
  site: InspectionSite,
  authToken?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateQuarterlyHwpxRequest = { report, site };
  const headers = buildInspectionDocumentHeaders(authToken);
  return fetchDocumentFile(
    '/documents/quarterly/pdf',
    body,
    '분기 보고서 PDF 다운로드 실패',
    headers,
  );
}

export async function fetchQuarterlyPdfDocumentWithFallback(
  report: QuarterlySummaryReport,
  site: InspectionSite,
  authToken?: string | null,
): Promise<PdfDocumentResult> {
  try {
    const pdf = await fetchQuarterlyPdfDocument(report, site, authToken);
    return { ...pdf, fallbackToHwpx: false };
  } catch (error) {
    console.warn('Quarterly PDF generation failed; falling back to HWPX download.', {
      error: error instanceof Error ? error.message : String(error),
      reportId: report.id,
      siteId: site.id,
    });
    const hwpx = await fetchQuarterlyHwpxDocument(report, site, authToken);
    return {
      ...hwpx,
      fallbackReason: error instanceof Error ? error.message : 'PDF 생성에 실패했습니다.',
      fallbackToHwpx: true,
    };
  }
}

export async function fetchBadWorkplaceHwpxDocument(
  report: BadWorkplaceReport,
  site: InspectionSite,
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateBadWorkplaceHwpxRequest = { report, site };
  return fetchDocumentFile(
    '/documents/bad-workplace/hwpx',
    body,
    '불량사업장 신고서 HWPX 다운로드 실패',
  );
}

export async function fetchQuarterlyHwpxDocumentByReportKey(
  reportKey: string,
  authToken?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  return fetchDocumentFile(
    '/documents/quarterly/hwpx',
    { reportKey },
    '분기 보고서 HWPX 다운로드 실패',
    buildInspectionDocumentHeaders(authToken),
  );
}

export async function fetchQuarterlyPdfDocumentByReportKey(
  reportKey: string,
  authToken?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  return fetchDocumentFile(
    '/documents/quarterly/pdf',
    { reportKey },
    '분기 보고서 PDF 다운로드 실패',
    buildInspectionDocumentHeaders(authToken),
  );
}

export async function fetchQuarterlyPdfDocumentByReportKeyWithFallback(
  reportKey: string,
  authToken?: string | null,
): Promise<PdfDocumentResult> {
  try {
    const pdf = await fetchQuarterlyPdfDocumentByReportKey(reportKey, authToken);
    return { ...pdf, fallbackToHwpx: false };
  } catch (error) {
    console.warn('Quarterly PDF server generation failed; falling back to HWPX download.', {
      error: error instanceof Error ? error.message : String(error),
      reportKey,
    });
    const hwpx = await fetchQuarterlyHwpxDocumentByReportKey(reportKey, authToken);
    return {
      ...hwpx,
      fallbackReason: error instanceof Error ? error.message : 'PDF 생성에 실패했습니다.',
      fallbackToHwpx: true,
    };
  }
}

export async function fetchBadWorkplaceHwpxDocumentByReportKey(
  reportKey: string,
  authToken?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  return fetchDocumentFile(
    '/documents/bad-workplace/hwpx',
    { reportKey },
    '불량사업장 신고서 HWPX 다운로드 실패',
    buildInspectionDocumentHeaders(authToken),
  );
}

export async function fetchBadWorkplacePdfDocumentByReportKey(
  reportKey: string,
  authToken?: string | null,
): Promise<{ blob: Blob; filename: string }> {
  return fetchDocumentFile(
    '/documents/bad-workplace/pdf',
    { reportKey },
    '불량사업장 신고서 PDF 다운로드 실패',
    buildInspectionDocumentHeaders(authToken),
  );
}

export async function fetchBadWorkplacePdfDocumentByReportKeyWithFallback(
  reportKey: string,
  authToken?: string | null,
): Promise<PdfDocumentResult> {
  try {
    const pdf = await fetchBadWorkplacePdfDocumentByReportKey(reportKey, authToken);
    return { ...pdf, fallbackToHwpx: false };
  } catch (error) {
    console.warn('Bad workplace PDF server generation failed; falling back to HWPX download.', {
      error: error instanceof Error ? error.message : String(error),
      reportKey,
    });
    const hwpx = await fetchBadWorkplaceHwpxDocumentByReportKey(reportKey, authToken);
    return {
      ...hwpx,
      fallbackReason: error instanceof Error ? error.message : 'PDF 생성에 실패했습니다.',
      fallbackToHwpx: true,
    };
  }
}
