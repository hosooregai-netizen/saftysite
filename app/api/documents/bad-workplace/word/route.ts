import { NextResponse } from 'next/server';
import { buildBadWorkplaceWordDocument } from '@/server/documents/badWorkplace/docx';
import { createWordDocumentDownloadResponse } from '@/server/documents/sharedDocx';
import type { GenerateBadWorkplaceWordRequest } from '@/types/documents';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateBadWorkplaceWordRequest;
    if (!body?.report || !body?.site) {
      return NextResponse.json(
        { error: '문서 생성에 필요한 신고서 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    const document = await buildBadWorkplaceWordDocument(
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
