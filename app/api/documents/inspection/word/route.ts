import { NextResponse } from 'next/server';
import { buildInspectionWordDocument } from '@/server/documents/inspection/docx';
import type { GenerateInspectionWordRequest } from '@/types/documents';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateInspectionWordRequest;
    if (!body?.session) {
      return NextResponse.json({ error: '문서 생성에 필요한 보고서 데이터가 없습니다.' }, { status: 400 });
    }

    const { buffer, filename } = await buildInspectionWordDocument(
      body.session,
      body.siteSessions ?? [body.session]
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '문서 생성 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

