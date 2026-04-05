import type { GenerateQuarterlyHwpxRequest } from '@/types/documents';
import type { GenerateInspectionHwpxRequest } from '@/types/documents';
import type { QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

const API_BASE = '/api';
const VERCEL_FUNCTION_BODY_LIMIT_MB = 4.5;

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
): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
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

export async function convertHwpxBlobToPdf(
  hwpxBlob: Blob,
  hwpxFilename: string,
): Promise<{ blob: Blob; filename: string }> {
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

export async function fetchQuarterlyHwpxDocument(
  report: QuarterlySummaryReport,
  site: InspectionSite,
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateQuarterlyHwpxRequest = { report, site };
  return fetchDocumentFile(
    '/documents/quarterly/hwpx',
    body,
    '분기 보고서 HWPX 다운로드 실패',
  );
}

export async function fetchQuarterlyPdfDocument(
  report: QuarterlySummaryReport,
  site: InspectionSite,
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateQuarterlyHwpxRequest = { report, site };
  return fetchDocumentFile(
    '/documents/quarterly/pdf',
    body,
    '분기 보고서 PDF 다운로드 실패',
  );
}

export async function fetchQuarterlyPdfDocumentWithFallback(
  report: QuarterlySummaryReport,
  site: InspectionSite,
): Promise<PdfDocumentResult> {
  try {
    const pdf = await fetchQuarterlyPdfDocument(report, site);
    return { ...pdf, fallbackToHwpx: false };
  } catch (error) {
    console.warn('Quarterly PDF generation failed; falling back to HWPX download.', {
      error: error instanceof Error ? error.message : String(error),
      reportId: report.id,
      siteId: site.id,
    });
    const hwpx = await fetchQuarterlyHwpxDocument(report, site);
    return {
      ...hwpx,
      fallbackReason: error instanceof Error ? error.message : 'PDF 생성에 실패했습니다.',
      fallbackToHwpx: true,
    };
  }
}
