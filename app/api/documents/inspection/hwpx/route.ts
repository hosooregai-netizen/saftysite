import { NextResponse } from 'next/server';

import {
  buildInspectionHwpxDocument,
  createInspectionHwpxDownloadResponse,
} from '@/server/documents/inspection/hwpx';
import type { GenerateInspectionHwpxRequest } from '@/types/documents';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateInspectionHwpxRequest;
    if (!body?.session) {
      return NextResponse.json(
        { error: '문서 생성에 필요한 기술지도 보고서 데이터가 없습니다.' },
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
    return createInspectionHwpxDownloadResponse(document);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '기술지도 HWPX 문서를 생성하는 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
