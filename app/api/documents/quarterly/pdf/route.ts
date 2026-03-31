import { NextResponse } from 'next/server';

import { buildQuarterlyHwpxDocument } from '@/server/documents/quarterly/hwpx';
import { convertHwpxBufferToPdf } from '@/server/documents/inspection/hwpxToPdf';
import type { GenerateQuarterlyWordRequest } from '@/types/documents';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  try {
    if (process.platform !== 'win32') {
      return NextResponse.json(
        {
          error:
            '현재 PDF 변환은 Windows와 한컴 자동화 환경이 필요하여 이 배포 환경에서는 실행할 수 없습니다.',
        },
        { status: 501 },
      );
    }

    const body = (await request.json()) as GenerateQuarterlyWordRequest;
    if (!body?.report || !body?.site) {
      return NextResponse.json(
        { error: 'PDF 생성에 필요한 분기 보고서 데이터가 없습니다.' },
        { status: 400 },
      );
    }

    const document = await buildQuarterlyHwpxDocument(body.report, body.site);
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'PDF 변환 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
