import { NextResponse } from 'next/server';
import { convertHwpxBufferToPdf } from '@/server/documents/inspection/hwpxToPdf';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  try {
    if (process.platform !== 'win32') {
      return NextResponse.json(
        {
          error:
            '이 PDF 변환은 Windows와 한컴오피스 자동화가 필요한 기능이라 현재 배포 환경에서는 실행할 수 없습니다.',
        },
        { status: 501 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'PDF 변환용 HWPX 파일이 없습니다.' }, { status: 400 });
    }

    const originalFilename = formData.get('filename');
    const hwpxBuffer = Buffer.from(await file.arrayBuffer());
    const { buffer, filename } = await convertHwpxBufferToPdf(
      hwpxBuffer,
      typeof originalFilename === 'string' && originalFilename.trim()
        ? originalFilename
        : file.name || 'inspection-report.hwpx',
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
