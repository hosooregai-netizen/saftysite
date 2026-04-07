import { NextResponse } from 'next/server';

import { SafetyServerApiError } from '@/server/admin/safetyApiServer';
import { buildInspectionHwpxDocument } from '@/server/documents/inspection/hwpx';
import { convertHwpxBufferToPdf } from '@/server/documents/inspection/hwpxToPdf';
import { resolveInspectionDocumentRequest } from '@/server/documents/inspection/requestResolver';
import type { GenerateInspectionDocumentRequest } from '@/types/documents';

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

async function readHwpxFromRequest(
  request: Request,
): Promise<{ buffer: Buffer; filename: string } | Response> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = (await request.json()) as GenerateInspectionDocumentRequest;
    const payload = await resolveInspectionDocumentRequest(request, body);
    const document = await buildInspectionHwpxDocument(payload.session, payload.siteSessions, {
      assetBaseUrl: new URL(request.url).origin,
    });

    return {
      buffer: document.buffer,
      filename: document.filename,
    };
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'PDF 변환용 HWPX 파일이 없습니다.' }, { status: 400 });
  }

  const originalFilename = formData.get('filename');
  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    filename:
      typeof originalFilename === 'string' && originalFilename.trim()
        ? originalFilename.trim()
        : file.name || 'inspection-report.hwpx',
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await readHwpxFromRequest(request);
    if (payload instanceof Response) {
      return payload;
    }

    const { buffer, filename } = await convertHwpxBufferToPdf(
      payload.buffer,
      payload.filename,
    );

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
        : 'PDF 생성 중 알 수 없는 오류가 발생했습니다.';
    const status = getPdfRouteStatus(error, message);

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
