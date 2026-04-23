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

    const directAssetUrl = resolveDirectAssetUrl(normalized);
    if (directAssetUrl) {
      append(directAssetUrl);
      return;
    }

    if (/^https?:\/\//i.test(normalized)) {
      append(normalized);
    }

    appendAssetName(getPathBasename(normalized) || normalized);
  };

  appendAssetCandidate(input.archivePath);
  input.fileNameCandidates.forEach(appendAssetCandidate);
  return urls;
}

async function fetchUpstreamPdf(urls: string[], token: string) {
  let lastError = '';
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
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
        source: url,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    buffer: null,
    contentType: 'application/pdf',
    source: '',
    lastError,
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

async function fetchUpstreamPdfDescriptor(urls: string[], token: string) {
  let lastError = '';
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: 'HEAD',
      });
      if (!response.ok) {
        lastError = `${response.status} ${response.statusText}`;
        continue;
      }

      return {
        contentType: response.headers.get('content-type') || 'application/pdf',
        sizeBytes: parseContentLength(response.headers),
        source: url,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    contentType: 'application/pdf',
    lastError,
    sizeBytes: null,
    source: '',
  };
}

async function resolveAdminOriginalPdfReference(input: {
  reportKey: string;
  request: Request;
  token: string;
}) {
  const reportKey = normalizeText(input.reportKey);
  const manifestEntry = legacyPdfManifest.get(reportKey) ?? null;
  const shouldUseLegacyManifestDirectly = Boolean(manifestEntry) && reportKey.startsWith('legacy:');

  let report: SafetyReport | null = null;
  if (!shouldUseLegacyManifestDirectly) {
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
    readMetaText(meta, 'original_pdf_archive_path') ||
    readMetaText(meta, 'originalPdfArchivePath') ||
    manifestEntry?.archivePath ||
    '';
  const filename =
    readMetaText(meta, 'original_pdf_filename') ||
    readMetaText(meta, 'originalPdfFilename') ||
    manifestEntry?.fileName ||
    `${reportKey}.pdf`;
  const fileNameCandidates = Array.from(
    new Set([
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
    throw new SafetyServerApiError(
      resolved.archivePath ? '원본 PDF 파일을 찾지 못했습니다.' : '원본 PDF가 등록되지 않았습니다.',
      404,
    );
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
  const backendPdf = shouldUseLegacyManifestDirectly
    ? null
    : await fetchBackendOriginalPdf(reportKey, input.token, input.request);
  if (backendPdf) {
    return backendPdf;
  }

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

  const upstreamPdf = await fetchUpstreamPdf(
    buildUpstreamAssetUrls({
      archivePath: resolved.archivePath,
      fileNameCandidates: resolved.fileNameCandidates,
    }),
    input.token,
  );
  if (!upstreamPdf.buffer) {
    throw new SafetyServerApiError(
      resolved.archivePath ? '원본 PDF 파일을 찾지 못했습니다.' : '원본 PDF가 등록되지 않았습니다.',
      404,
    );
  }

  return {
    buffer: upstreamPdf.buffer,
    contentDisposition: encodeInlineName(resolved.filename),
    contentType: upstreamPdf.contentType,
    filename: resolved.filename,
    source: upstreamPdf.source,
  };
}
