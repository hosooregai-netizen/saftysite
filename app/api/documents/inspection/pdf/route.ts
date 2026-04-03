import { NextResponse } from 'next/server';

import { buildInspectionHwpxDocument } from '@/server/documents/inspection/hwpx';
import { convertHwpxBufferToPdf } from '@/server/documents/inspection/hwpxToPdf';
import type { GenerateInspectionHwpxRequest } from '@/types/documents';

export const runtime = 'nodejs';
export const maxDuration = 300;

function hasRemoteConverterConfigured(): boolean {
  return Boolean(
    process.env.HWPX_PDF_CONVERTER_URL?.trim() ||
      process.env.WINDOWS_HWPX_PDF_CONVERTER_URL?.trim(),
  );
}

async function readHwpxFromRequest(
  request: Request,
): Promise<{ buffer: Buffer; filename: string } | Response> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = (await request.json()) as GenerateInspectionHwpxRequest;
    if (!body?.session) {
      return NextResponse.json(
        { error: 'PDF 생성에 필요한 기술지도 보고서 데이터가 없습니다.' },
        { status: 400 },
      );
    }

    const document = await buildInspectionHwpxDocument(
      body.session,
      body.siteSessions?.length ? body.siteSessions : [body.session],
      {
        assetBaseUrl: new URL(request.url).origin,
      },
    );

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
    if (process.platform !== 'win32' && !hasRemoteConverterConfigured()) {
      return NextResponse.json(
        {
          error: 'PDF 변환은 Windows 서버 또는 별도 HWPX PDF 변환 서버 설정이 필요합니다.',
        },
        { status: 501 },
      );
    }

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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'PDF 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
