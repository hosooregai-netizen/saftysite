import { NextResponse } from 'next/server';
import { buildInspectionWordDocument } from '@/server/documents/inspection/docx';
import { resolveInspectionDocumentAssets } from '@/server/documents/inspection/assets';
import { createWordDocumentDownloadResponse } from '@/server/documents/sharedDocx';
import type { GenerateInspectionWordRequest } from '@/types/documents';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateInspectionWordRequest;
    if (!body?.session) {
      return NextResponse.json({ error: '문서 생성에 필요한 보고서 데이터가 없습니다.' }, { status: 400 });
    }

    const { session, siteSessions } = await resolveInspectionDocumentAssets(
      body.session,
      body.siteSessions ?? [body.session],
      new URL(request.url).origin
    );

    const document = await buildInspectionWordDocument(
      session,
      siteSessions
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

