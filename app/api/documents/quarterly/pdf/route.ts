import { NextResponse } from 'next/server';

import { buildQuarterlyHwpxDocument } from '@/server/documents/quarterly/hwpx';
import { convertHwpxBufferToPdf } from '@/server/documents/inspection/hwpxToPdf';
import type { GenerateQuarterlyHwpxRequest } from '@/types/documents';

export const runtime = 'nodejs';
export const maxDuration = 300;

function getPdfRouteStatus(message: string): number {
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
    const body = (await request.json()) as GenerateQuarterlyHwpxRequest;
    if (!body?.report || !body?.site) {
      return NextResponse.json(
        { error: 'PDF 생성에 필요한 분기 보고서 데이터가 없습니다.' },
        { status: 400 },
      );
    }

    const document = await buildQuarterlyHwpxDocument(body.report, body.site, {
      assetBaseUrl: new URL(request.url).origin,
    });
    const { buffer, filename } = await convertHwpxBufferToPdf(
      document.buffer,
      document.filename,
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
        : 'PDF 변환 중 알 수 없는 오류가 발생했습니다.';
    const status = getPdfRouteStatus(message);

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
