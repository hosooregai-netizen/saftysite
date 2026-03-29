import { NextResponse } from 'next/server';
import { buildQuarterlyWordDocument } from '@/server/documents/quarterly/docx';
import { createWordDocumentDownloadResponse } from '@/server/documents/sharedDocx';
import type { GenerateQuarterlyWordRequest } from '@/types/documents';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateQuarterlyWordRequest;
    if (!body?.report || !body?.site) {
      return NextResponse.json(
        { error: '문서 생성에 필요한 분기 보고서 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    const document = await buildQuarterlyWordDocument(
      body.report,
      body.site
    );

    return createWordDocumentDownloadResponse(document);
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
