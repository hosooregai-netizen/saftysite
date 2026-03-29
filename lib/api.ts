import type {
  GenerateBadWorkplaceWordRequest,
  GenerateInspectionWordRequest,
  GenerateQuarterlyWordRequest,
} from '@/types/documents';
import type { BadWorkplaceReport, QuarterlySummaryReport } from '@/types/erpReports';
import type { InspectionSession, InspectionSite } from '@/types/inspectionSession';

const API_BASE = '/api';

async function parseApiResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }

  return res.text();
}

async function postFiles(path: string, files: File[]): Promise<unknown> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API 오류 (${res.status}): ${text || res.statusText}`);
  }

  return parseApiResponse(res);
}

export function analyzeHazardPhotos(files: File[]): Promise<unknown> {
  return postFiles('/vision/analyze-hazard-photos', files);
}

export function checkCausativeAgents(files: File[]): Promise<unknown> {
  return postFiles('/vision/check-causative-agents', files);
}

function getDownloadFilenameFromDisposition(header: string | null): string {
  if (!header) return 'inspection-report.docx';

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
  return bareMatch?.[1]?.trim() ?? 'inspection-report.docx';
}

async function fetchWordDocument<TBody>(
  path: string,
  body: TBody,
  errorLabel: string
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
      res.headers.get('content-disposition')
    ),
  };
}

export function saveBlobAsFile(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = blobUrl;
  link.download = filename || 'inspection-report.docx';
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
      res.headers.get('content-disposition')
    ),
  };
}

export async function fetchInspectionWordDocument(
  session: InspectionSession,
  siteSessions: InspectionSession[] = [session]
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateInspectionWordRequest = {
    session,
    siteSessions,
    templateId: 'default-inspection',
  };
  return fetchWordDocument('/documents/inspection/word', body, '워드 다운로드 실패');
}

export async function fetchQuarterlyWordDocument(
  report: QuarterlySummaryReport,
  site: InspectionSite
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateQuarterlyWordRequest = { report, site };
  return fetchWordDocument(
    '/documents/quarterly/word',
    body,
    '분기 보고서 다운로드 실패'
  );
}

export async function fetchBadWorkplaceWordDocument(
  report: BadWorkplaceReport,
  site: InspectionSite
): Promise<{ blob: Blob; filename: string }> {
  const body: GenerateBadWorkplaceWordRequest = { report, site };
  return fetchWordDocument(
    '/documents/bad-workplace/word',
    body,
    '불량사업장 신고서 다운로드 실패'
  );
}
