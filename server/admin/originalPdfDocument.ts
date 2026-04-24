import { promises as fs } from 'node:fs';
import path from 'node:path';
import legacyReportOriginalPdfs from '@/data/legacy-admin-report-original-pdfs.json';
import { getSafetyApiUpstreamBaseUrl } from '@/lib/safetyApi/upstream';
import { getSafetyAssetPath } from '@/lib/safetyApi/assetUrls';
import type { SafetyReport } from '@/types/backend';
import {
  buildSafetyAdminPublicUrl,
  fetchAdminReportByKey,
  requestSafetyAdminServerRaw,
  SafetyServerApiError,
} from './safetyApiServer';

type LegacyReportPdfEntry = {
  archivePath: string;
  fileName: string;
  legacyReportId: string;
  visitDate: string;
};

const legacyPdfManifest = new Map(
  Object.entries(legacyReportOriginalPdfs as Record<string, LegacyReportPdfEntry>),
);

const UPSTREAM_PDF_DESCRIPTOR_HEAD_TIMEOUT_MS = 5000;
const UPSTREAM_PDF_DESCRIPTOR_RANGE_TIMEOUT_MS = 8000;
const UPSTREAM_PDF_DESCRIPTOR_TOTAL_TIMEOUT_MS = 25000;
const UPSTREAM_PDF_DOWNLOAD_TIMEOUT_MS = 30000;
const UPSTREAM_PDF_DOWNLOAD_TOTAL_TIMEOUT_MS = 90000;

export interface AdminOriginalPdfDocument {
  buffer: Buffer;
  contentDisposition: string;
  contentType: string;
  filename: string;
  source: string;
}

export interface AdminOriginalPdfDescriptor {
  contentDisposition: string;
  contentType: string;
  filename: string;
  sizeBytes: number | null;
  source: string;
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    ('name' in error && error.name === 'AbortError')
  );
}

function getRemainingTimeoutMs(deadlineAt: number, timeoutMs: number) {
  return Math.max(0, Math.min(timeoutMs, deadlineAt - Date.now()));
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  requestLabel: string,
) {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(
      new Error(`${requestLabel} 요청이 ${timeoutMs}ms 안에 완료되지 않았습니다.`),
    );
  }, timeoutMs);
  const originalSignal = init.signal;

  if (originalSignal) {
    if (originalSignal.aborted) {
      abortController.abort(originalSignal.reason);
    } else {
      originalSignal.addEventListener(
        'abort',
        () => abortController.abort(originalSignal.reason),
        { once: true },
      );
    }
  }

  try {
    return await fetch(url, {
      ...init,
      signal: abortController.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error(`${requestLabel} 요청이 ${timeoutMs}ms 안에 완료되지 않았습니다.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function readMetaText(meta: Record<string, unknown>, key: string) {
  return normalizeText(meta[key]);
}

function encodeInlineName(value: string) {
  return `inline; filename*=UTF-8''${encodeURIComponent(value)}`;
}

function getUpstreamOrigin() {
  return new URL(getSafetyApiUpstreamBaseUrl()).origin;
}

function getPathBasename(value: string) {
  return value.split(/[\\/]/).filter(Boolean).at(-1) || '';
}

function decodePathText(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readMetaCandidates(meta: Record<string, unknown>, report: SafetyReport) {
  const candidates = [
    readMetaText(meta, 'original_pdf_download_path'),
    readMetaText(meta, 'originalPdfDownloadPath'),
    readMetaText(meta, 'original_pdf_filename'),
    readMetaText(meta, 'originalPdfFilename'),
    readMetaText(meta, 'pdf_filename'),
    readMetaText(meta, 'pdfFilename'),
    readMetaText(meta, 'legacy_report_id') ? `${readMetaText(meta, 'legacy_report_id')}.pdf` : '',
    report.report_key.startsWith('legacy:')
      ? `${report.report_key.split(':').at(-1) || ''}.pdf`
      : '',
    report.report_title ? `${report.report_title}.pdf` : '',
  ];

  return candidates
    .map((candidate) => candidate.trim())
    .filter((candidate, index, list) => candidate && list.indexOf(candidate) === index);
}

function extractContentAssetRelativePath(value: string) {
  const trimmed = value.trim();
  let normalized = decodePathText(trimmed);
  if (/^https?:\/\//i.test(normalized)) {
    try {
      normalized = new URL(normalized).pathname;
    } catch {
      normalized = trimmed;
    }
  }

  const markerMatch = normalized.match(/content_assets[\\/]+(.+)$/i);
  if (markerMatch?.[1]) {
    return markerMatch[1].replace(/\\/g, '/');
  }

  return '';
}

function resolveDirectAssetUrl(value: string) {
  const normalized = decodePathText(value.trim());
  if (!normalized) {
    return '';
  }

  const assetPath = getSafetyAssetPath(normalized);
  if (assetPath) {
    return buildSafetyAdminPublicUrl(assetPath);
  }

  const relativeContentAssetPath = extractContentAssetRelativePath(normalized);
  if (!relativeContentAssetPath) {
    return '';
  }

  const encodedPath = relativeContentAssetPath
    .replace(/^\/+/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  return `${getUpstreamOrigin()}/uploads/content-items/${encodedPath}`;
}

function buildUpstreamAssetUrls(input: {
  archivePath: string;
  fileNameCandidates: string[];
}) {
  const origin = getUpstreamOrigin();
  const urls: string[] = [];
  const append = (url: string) => {
    if (url && !urls.includes(url)) {
      urls.push(url);
    }
  };
  const appendAssetName = (assetName: string) => {
    const normalized = assetName.replace(/^\/+/, '').trim();
    if (!normalized) return;
    const encodedPath = normalized.split('/').map(encodeURIComponent).join('/');
    append(`${origin}/uploads/content-items/${encodedPath}`);
    append(`${getSafetyApiUpstreamBaseUrl()}/content-items/assets/${encodedPath}`);
    append(`${origin}/content_assets/${encodedPath}`);
  };
  const appendAssetCandidate = (candidate: string) => {
    const normalized = candidate.trim();
    if (!normalized) return;
    if (/\/api\/admin\/reports\/.+\/original-pdf(?:$|[?#])/i.test(normalized)) {
      return;
    }

    const canonicalAssetName = getPathBasename(normalized) || normalized;
    if (
      normalized.startsWith('/uploads/content-items/') ||
      normalized.startsWith('/content-items/assets/') ||
      /^https?:\/\/.+\/uploads\/content-items\//i.test(normalized) ||
      /^https?:\/\/.+\/api\/v\d+\/content-items\/assets\//i.test(normalized)
    ) {
      appendAssetName(canonicalAssetName);
    }

    const directAssetUrl = resolveDirectAssetUrl(normalized);
    if (directAssetUrl) {
      append(directAssetUrl);
    }

    if (/^https?:\/\//i.test(normalized)) {
      append(normalized);
    }

    appendAssetName(canonicalAssetName);
  };

  appendAssetCandidate(input.archivePath);
  input.fileNameCandidates.forEach(appendAssetCandidate);
  return urls;
}

async function fetchUpstreamPdf(urls: string[], token: string) {
  let lastError = '';
  let timedOut = false;
  const deadlineAt = Date.now() + UPSTREAM_PDF_DOWNLOAD_TOTAL_TIMEOUT_MS;
  for (const url of urls) {
    try {
      const timeoutMs = getRemainingTimeoutMs(deadlineAt, UPSTREAM_PDF_DOWNLOAD_TIMEOUT_MS);
      if (timeoutMs <= 0) {
        timedOut = true;
        lastError = '원본 PDF 파일 조회 제한 시간을 초과했습니다.';
        break;
      }

      const response = await fetchWithTimeout(
        url,
        {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        timeoutMs,
        '원본 PDF 파일 조회',
      );
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        lastError = `${response.status} ${response.statusText}`;
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength === 0) {
        lastError = 'empty response';
        continue;
      }

      return {
        buffer,
        contentType: response.headers.get('content-type') || 'application/pdf',
        lastError: '',
        source: url,
        timedOut: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      lastError = errorMessage;
      timedOut =
        timedOut ||
        isAbortError(error) ||
        errorMessage.includes('안에 완료되지 않았습니다') ||
        errorMessage.includes('제한 시간을 초과');
    }
  }

  return {
    buffer: null,
    contentType: 'application/pdf',
    source: '',
    lastError,
    timedOut,
  };
}

function buildOriginalPdfLookupError(input: {
  archivePath: string;
  lastError?: string;
  timedOut?: boolean;
}) {
  if (input.timedOut) {
    return new SafetyServerApiError(
      '원본 PDF 파일 조회가 시간 안에 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.',
      504,
    );
  }

  return new SafetyServerApiError(
    input.archivePath ? '원본 PDF 파일을 찾지 못했습니다.' : '원본 PDF가 등록되지 않았습니다.',
    404,
  );
}

async function fetchUpstreamPdfDescriptorByRange(url: string, token: string, timeoutMs: number) {
  if (timeoutMs <= 0) {
    return {
      contentType: 'application/pdf',
      lastError: '원본 PDF 범위 조회 제한 시간을 초과했습니다.',
      sizeBytes: null,
      source: '',
      timedOut: true,
    };
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          Range: 'bytes=0-0',
        },
      },
      timeoutMs,
      '원본 PDF 범위 조회',
    );
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      return {
        contentType: 'application/pdf',
        lastError: `${response.status} ${response.statusText}`,
        sizeBytes: null,
        source: '',
        timedOut: false,
      };
    }

    await response.body?.cancel().catch(() => {});
    return {
      ...readPdfDescriptorFromHeaders(response.headers),
      lastError: '',
      source: url,
      timedOut: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      contentType: 'application/pdf',
      lastError: errorMessage,
      sizeBytes: null,
      source: '',
      timedOut:
        isAbortError(error) ||
        errorMessage.includes('안에 완료되지 않았습니다') ||
        errorMessage.includes('제한 시간을 초과'),
    };
  }
}

async function fetchUpstreamPdfDescriptor(urls: string[], token: string) {
  let lastError = '';
  let timedOut = false;
  const deadlineAt = Date.now() + UPSTREAM_PDF_DESCRIPTOR_TOTAL_TIMEOUT_MS;
  for (const url of urls) {
    try {
      const timeoutMs = getRemainingTimeoutMs(deadlineAt, UPSTREAM_PDF_DESCRIPTOR_HEAD_TIMEOUT_MS);
      if (timeoutMs <= 0) {
        timedOut = true;
        lastError = '원본 PDF 정보 조회 제한 시간을 초과했습니다.';
        break;
      }

      const response = await fetchWithTimeout(
        url,
        {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          method: 'HEAD',
        },
        timeoutMs,
        '원본 PDF 정보 조회',
      );
      if (response.ok) {
        return {
          ...readPdfDescriptorFromHeaders(response.headers),
          lastError: '',
          source: url,
          timedOut: false,
        };
      }

      if (response.status === 405) {
        await response.body?.cancel().catch(() => {});
        const rangeTimeoutMs = getRemainingTimeoutMs(
          deadlineAt,
          UPSTREAM_PDF_DESCRIPTOR_RANGE_TIMEOUT_MS,
        );
        const rangeDescriptor = await fetchUpstreamPdfDescriptorByRange(
          url,
          token,
          rangeTimeoutMs,
        );
        if (rangeDescriptor.source) {
          return rangeDescriptor;
        }
        lastError = rangeDescriptor.lastError;
        timedOut = timedOut || rangeDescriptor.timedOut;
        continue;
      }

      await response.body?.cancel().catch(() => {});
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      lastError = errorMessage;
      timedOut =
        timedOut ||
        isAbortError(error) ||
        errorMessage.includes('안에 완료되지 않았습니다') ||
        errorMessage.includes('제한 시간을 초과');
    }
  }

  return {
    contentType: 'application/pdf',
    lastError,
    sizeBytes: null,
    source: '',
    timedOut,
  };
}

async function fetchBackendOriginalPdf(reportKey: string, token: string, request: Request) {
  try {
    const response = await requestSafetyAdminServerRaw(
      `/reports/by-key/${encodeURIComponent(reportKey)}/original-pdf`,
      {},
      token,
      request,
    );
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0) return null;

    return {
      buffer,
      contentDisposition:
        response.headers.get('content-disposition') || encodeInlineName(`${reportKey}.pdf`),
      contentType: response.headers.get('content-type') || 'application/pdf',
      filename: `${reportKey}.pdf`,
      source: 'backend-report-original-pdf',
    };
  } catch (error) {
    if (error instanceof SafetyServerApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function readLocalPdf(archivePath: string) {
  if (!archivePath || /^https?:\/\//i.test(archivePath) || archivePath.startsWith('/uploads/')) {
    return null;
  }

  return fs.readFile(path.resolve(archivePath));
}

async function statLocalPdf(archivePath: string) {
  if (!archivePath || /^https?:\/\//i.test(archivePath) || archivePath.startsWith('/uploads/')) {
    return null;
  }

  return fs.stat(path.resolve(archivePath));
}

function parseContentLength(headers: Headers) {
  const raw = normalizeText(headers.get('content-length'));
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseContentRangeTotal(headers: Headers) {
  const raw = normalizeText(headers.get('content-range'));
  if (!raw) return null;
  const match = raw.match(/\/(\d+)\s*$/);
  if (!match?.[1]) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readPdfDescriptorFromHeaders(headers: Headers) {
  return {
    contentType: headers.get('content-type') || 'application/pdf',
    sizeBytes: parseContentRangeTotal(headers) ?? parseContentLength(headers),
  };
}


async function resolveAdminOriginalPdfReference(input: {
  preferredDownloadPath?: string | null;
  reportKey: string;
  request: Request;
  token: string;
}) {
  const reportKey = normalizeText(input.reportKey);
  const preferredDownloadPath = normalizeText(input.preferredDownloadPath);
  const manifestEntry = legacyPdfManifest.get(reportKey) ?? null;
  const shouldUseLegacyManifestDirectly = Boolean(manifestEntry) && reportKey.startsWith('legacy:');
  const shouldUsePreferredDownloadPathDirectly =
    Boolean(preferredDownloadPath) &&
    !/\/api\/admin\/reports\/.+\/original-pdf(?:$|[?#])/i.test(preferredDownloadPath);

  let report: SafetyReport | null = null;
  if (!shouldUseLegacyManifestDirectly && !shouldUsePreferredDownloadPathDirectly) {
    try {
      report = await fetchAdminReportByKey(input.token, reportKey, input.request);
    } catch (error) {
      if (!(error instanceof SafetyServerApiError && error.status === 404)) {
        throw error;
      }
    }
  }

  const meta =
    report?.meta && typeof report.meta === 'object'
      ? (report.meta as Record<string, unknown>)
      : {};
  const archivePath =
    preferredDownloadPath ||
    readMetaText(meta, 'original_pdf_archive_path') ||
    readMetaText(meta, 'originalPdfArchivePath') ||
    readMetaText(meta, 'original_pdf_download_path') ||
    readMetaText(meta, 'originalPdfDownloadPath') ||
    manifestEntry?.archivePath ||
    '';
  const filename =
    readMetaText(meta, 'original_pdf_filename') ||
    readMetaText(meta, 'originalPdfFilename') ||
    manifestEntry?.fileName ||
    `${reportKey}.pdf`;
  const fileNameCandidates = Array.from(
    new Set([
      preferredDownloadPath,
      ...(report ? readMetaCandidates(meta, report) : []),
      manifestEntry?.fileName || '',
    ].filter(Boolean)),
  );

  return {
    archivePath,
    filename,
    fileNameCandidates,
    reportKey,
    shouldUseLegacyManifestDirectly,
  };
}

export async function fetchAdminOriginalPdfDescriptor(input: {
  preferredDownloadPath?: string | null;
  reportKey: string;
  request: Request;
  token: string;
}): Promise<AdminOriginalPdfDescriptor> {
  const resolved = await resolveAdminOriginalPdfReference(input);

  const localStat = await statLocalPdf(resolved.archivePath).catch((error) => {
    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') return null;
    throw error;
  });
  if (localStat) {
    return {
      contentDisposition: encodeInlineName(resolved.filename),
      contentType: 'application/pdf',
      filename: resolved.filename,
      sizeBytes: localStat.size,
      source: 'local-original-pdf',
    };
  }

  const upstreamDescriptor = await fetchUpstreamPdfDescriptor(
    buildUpstreamAssetUrls({
      archivePath: resolved.archivePath,
      fileNameCandidates: resolved.fileNameCandidates,
    }),
    input.token,
  );
  if (!upstreamDescriptor.source) {
    throw buildOriginalPdfLookupError({
      archivePath: resolved.archivePath,
      lastError: upstreamDescriptor.lastError,
      timedOut: upstreamDescriptor.timedOut,
    });
  }

  return {
    contentDisposition: encodeInlineName(resolved.filename),
    contentType: upstreamDescriptor.contentType,
    filename: resolved.filename,
    sizeBytes: upstreamDescriptor.sizeBytes,
    source: upstreamDescriptor.source,
  };
}

export async function fetchAdminOriginalPdfDocument(input: {
  preferredDownloadPath?: string | null;
  reportKey: string;
  request: Request;
  token: string;
}): Promise<AdminOriginalPdfDocument> {
  const reportKey = normalizeText(input.reportKey);
  const resolved = await resolveAdminOriginalPdfReference({
    reportKey,
    request: input.request,
    token: input.token,
  });
  const shouldUseLegacyManifestDirectly = resolved.shouldUseLegacyManifestDirectly;
  const localBuffer = await readLocalPdf(resolved.archivePath).catch((error) => {
    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') return null;
    throw error;
  });
  if (localBuffer) {
    return {
      buffer: localBuffer,
      contentDisposition: encodeInlineName(resolved.filename),
      contentType: 'application/pdf',
      filename: resolved.filename,
      source: 'local-original-pdf',
    };
  }

  const directAssetUrls = buildUpstreamAssetUrls({
    archivePath: resolved.archivePath,
    fileNameCandidates: resolved.fileNameCandidates,
  });
  const prefersDirectAssetLookup =
    Boolean(resolved.archivePath) &&
    (/^https?:\/\//i.test(resolved.archivePath) || resolved.archivePath.startsWith('/uploads/'));
  let directAssetPdf = {
    buffer: null as Buffer | null,
    contentType: 'application/pdf',
    lastError: '',
    source: '',
    timedOut: false,
  };

  if (prefersDirectAssetLookup) {
    directAssetPdf = await fetchUpstreamPdf(directAssetUrls, input.token);
    if (directAssetPdf.buffer) {
      return {
        buffer: directAssetPdf.buffer,
        contentDisposition: encodeInlineName(resolved.filename),
        contentType: directAssetPdf.contentType,
        filename: resolved.filename,
        source: directAssetPdf.source,
      };
    }
  }

  const backendPdf = shouldUseLegacyManifestDirectly
    ? null
    : await fetchBackendOriginalPdf(reportKey, input.token, input.request);
  if (backendPdf) {
    return backendPdf;
  }

  const upstreamPdf = prefersDirectAssetLookup
    ? directAssetPdf
    : await fetchUpstreamPdf(directAssetUrls, input.token);
  if (!upstreamPdf.buffer) {
    throw buildOriginalPdfLookupError({
      archivePath: resolved.archivePath,
      lastError: upstreamPdf.lastError,
      timedOut: upstreamPdf.timedOut,
    });
  }

  return {
    buffer: upstreamPdf.buffer,
    contentDisposition: encodeInlineName(resolved.filename),
    contentType: upstreamPdf.contentType,
    filename: resolved.filename,
    source: upstreamPdf.source,
  };
}
