import { NextResponse } from 'next/server';

import {
  buildBadWorkplaceHwpxDocument,
  createHwpxDownloadResponse,
} from '@/server/documents/badWorkplace/hwpx';
import type { GenerateBadWorkplaceHwpxRequest } from '@/types/documents';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as GenerateBadWorkplaceHwpxRequest;
    if (!body?.report || !body?.site) {
      return NextResponse.json(
        { error: '문서 생성에 필요한 불량사업장 신고 데이터가 없습니다.' },
        { status: 400 },
      );
    }

    const document = await buildBadWorkplaceHwpxDocument(body.report, body.site);
    return createHwpxDownloadResponse(document);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '문서를 생성하는 중 알 수 없는 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
