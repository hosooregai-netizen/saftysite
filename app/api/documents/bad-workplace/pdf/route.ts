import { NextResponse } from 'next/server';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { buildBadWorkplaceHwpxDocument } from '@/server/documents/badWorkplace/hwpx';
import { convertHwpxBufferToPdf } from '@/server/documents/inspection/hwpxToPdf';
import { resolveBadWorkplaceDocumentRequest } from '@/server/documents/badWorkplace/requestResolver';
import {
  readGeneratedReportPdfCache,
  writeGeneratedReportPdfCache,
} from '@/server/documents/shared/generatedReportPdfCache';
import type { GenerateBadWorkplaceDocumentRequest } from '@/types/documents';

export const runtime = 'nodejs';
export const maxDuration = 300;

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

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateBadWorkplaceDocumentRequest;
    const payload = await resolveBadWorkplaceDocumentRequest(request, body);
    if (payload.cacheKey) {
      const cached = await readGeneratedReportPdfCache(payload.cacheKey);
      if (cached) {
        return new Response(new Uint8Array(cached.buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(cached.filename)}`,
          },
        });
      }
    }
    const document = await buildBadWorkplaceHwpxDocument(payload.report, payload.site);
    const { buffer, filename } = await convertHwpxBufferToPdf(
      document.buffer,
      document.filename,
    );
    if (payload.cacheKey) {
      await writeGeneratedReportPdfCache(payload.cacheKey, { buffer, filename });
    }

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'PDF 변환 중 알 수 없는 오류가 발생했습니다.';
    const status = getPdfRouteStatus(error, message);

    return NextResponse.json({ error: message }, { status });
  }
}
