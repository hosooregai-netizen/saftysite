import { normalizeControllerReportType } from '@/lib/admin/reportMeta';
import { fetchAdminOriginalPdfDescriptor } from '@/server/admin/originalPdfDocument';
import { SafetyServerApiError } from '@/server/admin/safetyApiServer';

export interface MailReportAttachmentInput {
  originalPdfAvailable?: boolean;
  originalPdfDownloadPath?: string | null;
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

const MAIL_REPORT_INLINE_PREFETCH_MAX_BYTES = 6 * 1024 * 1024;
const MAIL_REPORT_ATTACHMENT_CACHE_TTL_MS = 2 * 60 * 1000;
const MAIL_REPORT_ATTACHMENT_CACHE_MAX_ENTRIES = 8;

interface CachedMailReportAttachmentEntry {
  expiresAt: number;
  lastAccessedAt: number;
  promise: Promise<MailAttachmentServerPayload> | null;
  value: MailAttachmentServerPayload | null;
}

const globalMailReportAttachmentState = globalThis as typeof globalThis & {
  __mailReportAttachmentCache?: Map<string, CachedMailReportAttachmentEntry>;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizePdfFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function isLegacyReportKey(reportKey: string) {
  return normalizeText(reportKey).startsWith('legacy:');
}

function getMailReportAttachmentCache() {
  if (!globalMailReportAttachmentState.__mailReportAttachmentCache) {
    globalMailReportAttachmentState.__mailReportAttachmentCache = new Map();
  }

  return globalMailReportAttachmentState.__mailReportAttachmentCache;
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

function buildMailReportAttachmentCacheKey(input: MailReportAttachmentInput) {
  return JSON.stringify({
    originalPdfAvailable: Boolean(input.originalPdfAvailable),
    preferredFilename: normalizeText(input.preferredFilename),
    reportKey: normalizeText(input.reportKey),
    reportTitle: normalizeText(input.reportTitle),
    reportType: normalizeText(input.reportType),
    reportUpdatedAt: normalizeText(input.reportUpdatedAt),
  });
}

function cloneMailAttachmentPayload(
  attachment: MailAttachmentServerPayload,
): MailAttachmentServerPayload {
  return {
    ...attachment,
    download_headers: attachment.download_headers
      ? { ...attachment.download_headers }
      : undefined,
  };
}

function applyMailReportAttachmentFilename(
  attachment: MailAttachmentServerPayload,
  input: MailReportAttachmentInput,
) {
  return {
    ...cloneMailAttachmentPayload(attachment),
    filename: buildMailReportFilename(
      input,
      attachment.filename || `${normalizeText(input.reportKey) || 'report'}.pdf`,
    ),
  } satisfies MailAttachmentServerPayload;
}

function pruneMailReportAttachmentCache(cache: Map<string, CachedMailReportAttachmentEntry>) {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now && !entry.promise) {
      cache.delete(key);
    }
  }

  if (cache.size <= MAIL_REPORT_ATTACHMENT_CACHE_MAX_ENTRIES) {
    return;
  }

  const removableEntries = Array.from(cache.entries())
    .filter(([, entry]) => !entry.promise)
    .sort((left, right) => left[1].lastAccessedAt - right[1].lastAccessedAt);

  while (cache.size > MAIL_REPORT_ATTACHMENT_CACHE_MAX_ENTRIES && removableEntries.length > 0) {
    const [key] = removableEntries.shift()!;
    cache.delete(key);
  }
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    return normalizeText(payload.error) || normalizeText(payload.detail) || '';
  } catch {
    return '';
  }
}

async function buildInlineOriginalPdfAttachment(input: {
  contentType: string;
  downloadUrl: string;
  filename: string;
  sizeBytes: number | null;
  token: string;
}): Promise<MailAttachmentServerPayload | null> {
  if (
    !input.downloadUrl ||
    input.sizeBytes === null ||
    input.sizeBytes > MAIL_REPORT_INLINE_PREFETCH_MAX_BYTES
  ) {
    return null;
  }

  try {
    const response = await fetch(input.downloadUrl, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${input.token}`,
      },
    });

    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      return null;
    }

    return {
      content_type: response.headers.get('content-type') || input.contentType || 'application/pdf',
      data_base64: buffer.toString('base64'),
      filename: input.filename,
      size_bytes: buffer.length,
    };
  } catch {
    return null;
  }
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
        preferredDownloadPath: normalizeText(input.originalPdfDownloadPath),
        reportKey,
        request,
        token,
      });
      const filename = buildMailReportFilename({ ...input, reportKey }, descriptor.filename);
      const directDownloadUrl = normalizeText(descriptor.source);
      const warmedAttachment = await buildInlineOriginalPdfAttachment({
        contentType: descriptor.contentType,
        downloadUrl: directDownloadUrl,
        filename,
        sizeBytes: descriptor.sizeBytes,
        token,
      });
      if (warmedAttachment) {
        return warmedAttachment;
      }

      return {
        content_type: descriptor.contentType,
        download_headers: {
          Authorization: `Bearer ${token}`,
        },
        download_url: directDownloadUrl || originalPdfRequest.url.toString(),
        filename,
        size_bytes: descriptor.sizeBytes ?? undefined,
      };
    } catch (error) {
      if (error instanceof SafetyServerApiError && error.status === 504) {
        return {
          content_type: 'application/pdf',
          download_headers: {
            Authorization: `Bearer ${token}`,
          },
          download_url: originalPdfRequest.url.toString(),
          filename: buildMailReportFilename({ ...input, reportKey }, `${reportKey}.pdf`),
        };
      }
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

async function buildMailReportAttachmentCached(
  request: Request,
  token: string,
  input: MailReportAttachmentInput,
): Promise<MailAttachmentServerPayload> {
  const reportKey = normalizeText(input.reportKey);
  if (!reportKey) {
    throw new Error('메일에 첨부할 보고서 키가 없습니다.');
  }

  const normalizedInput = {
    ...input,
    reportKey,
  };
  const cache = getMailReportAttachmentCache();
  const cacheKey = buildMailReportAttachmentCacheKey(normalizedInput);
  const now = Date.now();
  const cachedEntry = cache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    cachedEntry.lastAccessedAt = now;
    if (cachedEntry.value) {
      return applyMailReportAttachmentFilename(cachedEntry.value, normalizedInput);
    }
    if (cachedEntry.promise) {
      return applyMailReportAttachmentFilename(await cachedEntry.promise, normalizedInput);
    }
  }

  const loadPromise = buildMailReportAttachmentUncached(request, token, normalizedInput)
    .then((attachment) => {
      const settledAt = Date.now();
      const storedAttachment = cloneMailAttachmentPayload(attachment);
      const currentEntry = cache.get(cacheKey);
      if (currentEntry?.promise === loadPromise) {
        currentEntry.expiresAt = settledAt + MAIL_REPORT_ATTACHMENT_CACHE_TTL_MS;
        currentEntry.lastAccessedAt = settledAt;
        currentEntry.promise = null;
        currentEntry.value = storedAttachment;
        pruneMailReportAttachmentCache(cache);
      }
      return storedAttachment;
    })
    .catch((error) => {
      const currentEntry = cache.get(cacheKey);
      if (currentEntry?.promise === loadPromise) {
        cache.delete(cacheKey);
      }
      throw error;
    });

  cache.set(cacheKey, {
    expiresAt: now + MAIL_REPORT_ATTACHMENT_CACHE_TTL_MS,
    lastAccessedAt: now,
    promise: loadPromise,
    value: null,
  });

  pruneMailReportAttachmentCache(cache);
  return applyMailReportAttachmentFilename(await loadPromise, normalizedInput);
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

  await buildMailReportAttachmentCached(request, token, {
    ...input,
    reportKey,
  });
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

  return buildMailReportAttachmentCached(
    request,
    token,
    { ...input, reportKey },
  );
}
