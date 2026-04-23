import { normalizeControllerReportType } from '@/lib/admin/reportMeta';
import { fetchAdminOriginalPdfDescriptor } from '@/server/admin/originalPdfDocument';
import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import {
  readMailReportAttachmentCache,
  writeMailReportAttachmentCache,
} from './reportAttachmentCache';

export interface MailReportAttachmentInput {
  originalPdfAvailable?: boolean;
  preferredFilename?: string | null;
  reportKey: string;
  reportTitle?: string | null;
  reportType?: string | null;
  reportUpdatedAt?: string | null;
}

export interface MailAttachmentServerPayload {
  content_type: string;
  filename: string;
  data_base64?: string;
  download_headers?: Record<string, string>;
  download_url?: string;
  size_bytes?: number;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizePdfFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function isLegacyReportKey(reportKey: string) {
  return normalizeText(reportKey).startsWith('legacy:');
}

export function buildMailReportFilename(
  input: Pick<MailReportAttachmentInput, 'preferredFilename' | 'reportKey' | 'reportTitle'>,
  fallback: string,
) {
  const normalizedBaseName = sanitizePdfFilename(
    normalizeText(input.preferredFilename) || normalizeText(input.reportTitle),
  );
  const fallbackBaseName = sanitizePdfFilename(fallback.replace(/\.pdf$/i, ''));
  const baseName = normalizedBaseName || fallbackBaseName || sanitizePdfFilename(input.reportKey) || 'report';
  return /\.pdf$/i.test(baseName) ? baseName : `${baseName}.pdf`;
}

export function shouldUseOriginalPdfForMailReport(input: MailReportAttachmentInput) {
  return Boolean(input.originalPdfAvailable);
}

export function readMailReportFilenameFromHeaders(headers: Headers, fallback: string) {
  const disposition = headers.get('content-disposition') || '';
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).trim() || fallback;
    } catch {
      return utf8Match[1].trim() || fallback;
    }
  }

  const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1]?.trim() || fallback;
}

function buildReportPdfPath(input: MailReportAttachmentInput) {
  const reportKey = encodeURIComponent(input.reportKey);
  if (shouldUseOriginalPdfForMailReport(input)) {
    return `/api/admin/reports/${reportKey}/original-pdf`;
  }

  switch (normalizeControllerReportType(input.reportType)) {
    case 'bad_workplace':
      return '/api/documents/bad-workplace/pdf';
    case 'quarterly_report':
      return '/api/documents/quarterly/pdf';
    case 'technical_guidance':
    default:
      return '/api/documents/inspection/pdf';
  }
}

function buildReportPdfRequest(input: MailReportAttachmentInput, request: Request, token: string) {
  const reportKey = normalizeText(input.reportKey);
  const isOriginalPdf = shouldUseOriginalPdfForMailReport({ ...input, reportKey });
  return {
    isOriginalPdf,
    reportKey,
    requestInit: {
      method: isOriginalPdf ? 'GET' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isOriginalPdf ? {} : { 'Content-Type': 'application/json' }),
      },
      body: isOriginalPdf ? undefined : JSON.stringify({ reportKey }),
      cache: 'no-store' as RequestCache,
    },
    url: new URL(buildReportPdfPath({ ...input, reportKey }), request.url),
  };
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    return normalizeText(payload.error) || normalizeText(payload.detail) || '';
  } catch {
    return '';
  }
}

function buildMailReportAttachmentCacheKey(input: MailReportAttachmentInput) {
  return {
    originalPdfAvailable: Boolean(input.originalPdfAvailable),
    preferredFilename: normalizeText(input.preferredFilename),
    reportKey: normalizeText(input.reportKey),
    reportTitle: normalizeText(input.reportTitle),
    reportType: normalizeText(input.reportType),
    reportUpdatedAt: normalizeText(input.reportUpdatedAt),
  };
}

async function buildMailReportAttachmentUncached(
  request: Request,
  token: string,
  input: MailReportAttachmentInput,
): Promise<MailAttachmentServerPayload> {
  const reportKey = normalizeText(input.reportKey);
  if (!reportKey) {
    throw new Error('메일에 첨부할 보고서 키가 없습니다.');
  }

  const originalPdfRequest = buildReportPdfRequest(
    { ...input, originalPdfAvailable: true, reportKey },
    request,
    token,
  );
  const shouldAttemptOriginalPdf =
    shouldUseOriginalPdfForMailReport({ ...input, reportKey }) || isLegacyReportKey(reportKey);

  if (shouldAttemptOriginalPdf) {
    try {
      const descriptor = await fetchAdminOriginalPdfDescriptor({
        reportKey,
        request,
        token,
      });
      return {
        content_type: descriptor.contentType,
        download_headers: {
          Authorization: `Bearer ${token}`,
        },
        download_url: originalPdfRequest.url.toString(),
        filename: buildMailReportFilename({ ...input, reportKey }, descriptor.filename),
        size_bytes: descriptor.sizeBytes ?? undefined,
      };
    } catch (error) {
      if (!(error instanceof SafetyServerApiError) || error.status !== 404) {
        throw error;
      }
    }
  }

  const generatedPdfRequest = buildReportPdfRequest(
    { ...input, originalPdfAvailable: false, reportKey },
    request,
    token,
  );
  const response = await fetch(generatedPdfRequest.url, generatedPdfRequest.requestInit);

  if (!response.ok) {
    const detail = await readErrorMessage(response);
    throw new Error(
      detail || `보고서 PDF를 메일 첨부로 준비하지 못했습니다. (${response.status})`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error('보고서 PDF 파일이 비어 있습니다.');
  }

  return {
    content_type: response.headers.get('content-type') || 'application/pdf',
    data_base64: buffer.toString('base64'),
    filename: buildMailReportFilename(
      { ...input, reportKey },
      readMailReportFilenameFromHeaders(response.headers, `${reportKey}.pdf`),
    ),
    size_bytes: buffer.length,
  };
}

export async function prepareMailReportAttachment(
  request: Request,
  token: string,
  input: MailReportAttachmentInput,
) {
  const reportKey = normalizeText(input.reportKey);
  if (!reportKey) {
    throw new Error('메일에 첨부할 보고서 키가 없습니다.');
  }

  const cacheKey = buildMailReportAttachmentCacheKey({ ...input, reportKey });
  const cached = await readMailReportAttachmentCache(cacheKey);
  if (cached) {
    return { prepared: false, skipped: 'cached' as const };
  }

  const attachment = await buildMailReportAttachmentUncached(request, token, {
    ...input,
    reportKey,
  });
  await writeMailReportAttachmentCache(cacheKey, attachment);
  return { prepared: true, skipped: null };
}

export async function buildMailReportAttachment(
  request: Request,
  token: string,
  input: MailReportAttachmentInput,
): Promise<MailAttachmentServerPayload> {
  const reportKey = normalizeText(input.reportKey);
  if (!reportKey) {
    throw new Error('메일에 첨부할 보고서 키가 없습니다.');
  }

  const cacheKey = buildMailReportAttachmentCacheKey({ ...input, reportKey });
  const cached = await readMailReportAttachmentCache(cacheKey);
  if (cached) {
    return cached;
  }

  const attachment = await buildMailReportAttachmentUncached(
    request,
    token,
    { ...input, reportKey },
  );
  await writeMailReportAttachmentCache(cacheKey, attachment);
  return attachment;
}
