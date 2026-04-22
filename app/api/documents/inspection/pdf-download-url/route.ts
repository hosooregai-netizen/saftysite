import { NextResponse } from 'next/server';

import {
  buildSafetyAdminPublicUrl,
  readRequiredSafetyAuthToken,
  SafetyServerApiError,
  uploadSafetyAssetServer,
} from '@/server/admin/safetyApiServer';
import { buildInspectionHwpxDocument } from '@/server/documents/inspection/hwpx';
import { convertHwpxBufferToPdf } from '@/server/documents/inspection/hwpxToPdf';
import { resolveInspectionDocumentRequest } from '@/server/documents/inspection/requestResolver';
import {
  readGeneratedReportPdfCache,
  writeGeneratedReportPdfCache,
} from '@/server/documents/shared/generatedReportPdfCache';
import type { GenerateInspectionDocumentRequest } from '@/types/documents';

export const runtime = 'nodejs';
export const maxDuration = 300;

interface PdfDownloadUrlResponse {
  assetPath: string;
  downloadUrl: string;
  filename: string;
}

function getPdfRouteStatus(error: unknown, message: string): number {
  if (error instanceof SafetyServerApiError) {
    return error.status;
  }

  if (
    message.includes('must be configured') ||
    message.includes('required outside Windows') ||
    message.includes('Internal API key') ||
    message.includes('Invalid internal API key') ||
    message.includes('header is required') ||
    message.includes('Not authenticated')
  ) {
    return 503;
  }

  if (message.startsWith('HWPX PDF conversion failed:')) {
    return 502;
  }

  return 500;
}

function normalizeAssetPath(assetPath: string): string {
  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
}

function buildProxiedDownloadUrl(request: Request, assetPath: string): string {
  const proxiedUrl = new URL(`/api/safety${normalizeAssetPath(assetPath)}`, request.url);
  proxiedUrl.searchParams.set('download', '1');
  return proxiedUrl.toString();
}

function buildDownloadUrl(request: Request, assetPath: string): string {
  const downloadUrl = new URL(buildSafetyAdminPublicUrl(assetPath), request.url);
  if (new URL(request.url).protocol === 'https:' && downloadUrl.protocol !== 'https:') {
    return buildProxiedDownloadUrl(request, assetPath);
  }

  downloadUrl.searchParams.set('download', '1');
  return downloadUrl.toString();
}

async function uploadGeneratedPdfAsset(
  request: Request,
  token: string,
  pdfBuffer: Buffer,
  filename: string,
): Promise<PdfDownloadUrlResponse> {
  const body = new FormData();
  body.set('file', new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }), filename);

  const uploaded = await uploadSafetyAssetServer(token, body, request);
  return {
    assetPath: uploaded.path,
    downloadUrl: buildDownloadUrl(request, uploaded.path),
    filename: uploaded.file_name || filename,
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readRequiredSafetyAuthToken(request);
    const body = (await request.json()) as GenerateInspectionDocumentRequest;
    const payload = await resolveInspectionDocumentRequest(request, body);

    if (payload.cacheKey) {
      const cached = await readGeneratedReportPdfCache(payload.cacheKey);
      if (cached?.downloadPath) {
        return NextResponse.json({
          assetPath: cached.downloadPath,
          downloadUrl: buildDownloadUrl(request, cached.downloadPath),
          filename: cached.filename,
        } satisfies PdfDownloadUrlResponse);
      }

      if (cached) {
        const uploaded = await uploadGeneratedPdfAsset(request, token, cached.buffer, cached.filename);
        await writeGeneratedReportPdfCache(payload.cacheKey, {
          buffer: cached.buffer,
          downloadPath: uploaded.assetPath,
          filename: uploaded.filename,
        });
        return NextResponse.json(uploaded);
      }
    }

    const generated = await buildInspectionHwpxDocument(payload.session, payload.siteSessions, {
      assetBaseUrl: new URL(request.url).origin,
    });
    const converted = await convertHwpxBufferToPdf(generated.buffer, generated.filename);
    const uploaded = await uploadGeneratedPdfAsset(
      request,
      token,
      converted.buffer,
      converted.filename,
    );

    if (payload.cacheKey) {
      await writeGeneratedReportPdfCache(payload.cacheKey, {
        buffer: converted.buffer,
        downloadPath: uploaded.assetPath,
        filename: uploaded.filename,
      });
    }

    return NextResponse.json(uploaded);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'PDF download URL generation failed due to an unexpected error.';
    const status = getPdfRouteStatus(error, message);

    return NextResponse.json({ error: message }, { status });
  }
}
