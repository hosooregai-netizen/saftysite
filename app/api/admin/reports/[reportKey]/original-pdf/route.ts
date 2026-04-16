import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getSafetyApiUpstreamBaseUrl } from '@/lib/safetyApi/upstream';
import {
  fetchAdminReportByKey,
  readRequiredAdminToken,
  requestSafetyAdminServerRaw,
  SafetyServerApiError,
} from '@/server/admin/safetyApiServer';
import type { SafetyReport } from '@/types/backend';

export const runtime = 'nodejs';

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

function readMetaCandidates(meta: Record<string, unknown>, report: SafetyReport) {
  const candidates = [
    readMetaText(meta, 'original_pdf_filename'),
    readMetaText(meta, 'originalPdfFilename'),
    readMetaText(meta, 'pdf_filename'),
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
  const normalized = value.trim();
  const markerMatch = normalized.match(/content_assets[\\/]+(.+)$/i);
  if (markerMatch?.[1]) {
    return markerMatch[1].replace(/\\/g, '/');
  }

  if (normalized.startsWith('/uploads/content-items/')) {
    return normalized.slice('/uploads/content-items/'.length);
  }

  if (normalized.startsWith('/content-items/assets/')) {
    return normalized.slice('/content-items/assets/'.length);
  }

  return '';
}

function buildUpstreamAssetUrls(input: {
  archivePath: string;
  fileNameCandidates: string[];
}) {
  const origin = getUpstreamOrigin();
  const urls: string[] = [];
  const append = (url: string) => {
    if (!urls.includes(url)) urls.push(url);
  };
  const appendAssetName = (assetName: string) => {
    const normalized = assetName.replace(/^\/+/, '').trim();
    if (!normalized) return;
    const encodedPath = normalized.split('/').map(encodeURIComponent).join('/');
    append(`${origin}/uploads/content-items/${encodedPath}`);
    append(`${getSafetyApiUpstreamBaseUrl()}/content-items/assets/${encodedPath}`);
    append(`${origin}/content_assets/${encodedPath}`);
  };

  if (/^https?:\/\//i.test(input.archivePath)) {
    append(input.archivePath);
  }

  const relativeArchivePath = extractContentAssetRelativePath(input.archivePath);
  if (relativeArchivePath) {
    appendAssetName(relativeArchivePath);
  }

  const archiveBasename = getPathBasename(input.archivePath);
  if (archiveBasename) {
    appendAssetName(archiveBasename);
  }

  input.fileNameCandidates.forEach(appendAssetName);
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

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength === 0) {
        lastError = 'empty response';
        continue;
      }

      return {
        buffer,
        contentType: response.headers.get('content-type') || 'application/pdf',
        sourceUrl: url,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    buffer: null,
    contentType: 'application/pdf',
    sourceUrl: '',
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
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) return null;

    return {
      buffer,
      contentDisposition:
        response.headers.get('content-disposition') || encodeInlineName(`${reportKey}.pdf`),
      contentType: response.headers.get('content-type') || 'application/pdf',
    };
  } catch (error) {
    if (error instanceof SafetyServerApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function readLocalPdf(archivePath: string) {
  if (!archivePath || /^https?:\/\//i.test(archivePath)) {
    return null;
  }

  const resolvedPath = path.resolve(archivePath);
  return fs.readFile(resolvedPath);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ reportKey: string }> },
): Promise<Response> {
  try {
    const token = readRequiredAdminToken(request);
    const { reportKey } = await context.params;
    const backendPdf = await fetchBackendOriginalPdf(reportKey, token, request);
    if (backendPdf) {
      return new Response(new Uint8Array(backendPdf.buffer), {
        headers: {
          'Content-Disposition': backendPdf.contentDisposition,
          'Content-Type': backendPdf.contentType,
          'X-Original-Pdf-Source': 'backend-report-original-pdf',
        },
        status: 200,
      });
    }

    const report = await fetchAdminReportByKey(token, reportKey, request);
    const meta = report.meta && typeof report.meta === 'object' ? (report.meta as Record<string, unknown>) : {};
    const archivePath =
      readMetaText(meta, 'original_pdf_archive_path') ||
      readMetaText(meta, 'originalPdfArchivePath');
    const fileName =
      readMetaText(meta, 'original_pdf_filename') ||
      readMetaText(meta, 'originalPdfFilename') ||
      `${reportKey}.pdf`;
    const fileNameCandidates = readMetaCandidates(meta, report);

    const localBuffer = await readLocalPdf(archivePath).catch((error) => {
      if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') return null;
      throw error;
    });
    if (localBuffer) {
      return new Response(new Uint8Array(localBuffer), {
        headers: {
          'Content-Disposition': encodeInlineName(fileName),
          'Content-Type': 'application/pdf',
        },
        status: 200,
      });
    }

    const upstreamPdf = await fetchUpstreamPdf(
      buildUpstreamAssetUrls({
        archivePath,
        fileNameCandidates,
      }),
      token,
    );
    if (!upstreamPdf.buffer) {
      return NextResponse.json(
        {
          error: archivePath
            ? '원본 PDF 파일을 찾지 못했습니다.'
            : '원본 PDF가 등록되지 않았습니다.',
          detail: upstreamPdf.lastError || undefined,
        },
        { status: 404 },
      );
    }

    return new Response(new Uint8Array(upstreamPdf.buffer), {
      headers: {
        'Content-Disposition': encodeInlineName(fileName),
        'Content-Type': upstreamPdf.contentType,
        'X-Original-Pdf-Source': upstreamPdf.sourceUrl,
      },
      status: 200,
    });
  } catch (error) {
    if (error instanceof SafetyServerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') {
      return NextResponse.json({ error: '원본 PDF 파일을 찾지 못했습니다.' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '원본 PDF 다운로드에 실패했습니다.',
      },
      { status: 500 },
    );
  }
}
